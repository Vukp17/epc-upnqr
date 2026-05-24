import logging
import time

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, Response
from pydantic import BaseModel

from .auth import AUTH_PASSWORD, AUTH_USERNAME, create_token, verify_token_from_request
from .epc import build_epc_payload, epc_qr_to_base64
from .pdf_qr import QRExtractionError, extract_first_qr_payload_from_pdf, extract_qr_payload_from_image
from .repository import ConversionRepository
from .schemas import ConvertResponse, ConvertUPNStringRequest, UPNParsedData
from .upn_parser import parse_upn_payload

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("qr-converter-service")

app = FastAPI(
    title="QR Converter Service",
    version="0.3.0",
    description="Microservice for UPN QR extraction and EPC QR generation.",
)
repository = ConversionRepository()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000.0
    logger.info(
        "method=%s path=%s status=%s duration_ms=%.2f",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.get("/swagger", include_in_schema=False)
def swagger_redirect() -> RedirectResponse:
    return RedirectResponse(url="/docs")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/auth/login")
def login(payload: LoginRequest) -> dict[str, object]:
    if payload.username != AUTH_USERNAME or payload.password != AUTH_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    token = create_token(payload.username)
    return token


@app.post("/api/convert/pdf", response_model=ConvertResponse)
async def convert_pdf_upn_to_epc(file: UploadFile = File(...)) -> ConvertResponse:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Fajl mora biti PDF.")

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Prazan PDF fajl.")

    try:
        upn_payload = extract_first_qr_payload_from_pdf(pdf_bytes)
    except QRExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Neuspesna obrada PDF-a: {exc}") from exc

    parsed = parse_upn_payload(upn_payload)
    epc_payload = build_epc_payload(parsed)
    epc_qr_base64 = epc_qr_to_base64(epc_payload)
    repository.add(
        source="pdf-upnqr",
        iban=parsed.iban,
        amount=parsed.amount,
        currency=parsed.currency or "EUR",
        recipient_name=parsed.recipient_name,
        purpose=parsed.purpose,
        reference=parsed.reference,
        pdf_bytes=pdf_bytes,
    )
    logger.info("conversion=pdf-upnqr iban=%s amount=%s", parsed.iban, parsed.amount)

    return ConvertResponse(
        upn_raw_payload=upn_payload,
        upn_parsed=UPNParsedData(**parsed.__dict__),
        epc_payload=epc_payload,
        epc_qr_png_base64=epc_qr_base64,
    )


_IMAGE_EXTS = {"jpg", "jpeg", "png", "webp", "bmp", "gif"}


@app.post("/api/convert/image", response_model=ConvertResponse)
async def convert_image_upn_to_epc(file: UploadFile = File(...)) -> ConvertResponse:
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    mime = file.content_type or ""
    if ext not in _IMAGE_EXTS and not mime.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, WebP, etc.).")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file.")

    try:
        upn_payload = extract_qr_payload_from_image(image_bytes)
    except QRExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {exc}") from exc

    parsed = parse_upn_payload(upn_payload)
    epc_payload = build_epc_payload(parsed)
    epc_qr_base64 = epc_qr_to_base64(epc_payload)
    repository.add(
        source="image-upnqr",
        iban=parsed.iban,
        amount=parsed.amount,
        currency=parsed.currency or "EUR",
        recipient_name=parsed.recipient_name,
        purpose=parsed.purpose,
        reference=parsed.reference,
    )
    logger.info("conversion=image-upnqr iban=%s amount=%s", parsed.iban, parsed.amount)

    return ConvertResponse(
        source="image-upnqr",
        upn_raw_payload=upn_payload,
        upn_parsed=UPNParsedData(**parsed.__dict__),
        epc_payload=epc_payload,
        epc_qr_png_base64=epc_qr_base64,
    )


@app.post("/api/convert/upn-string", response_model=ConvertResponse)
def convert_upn_string_to_epc(payload: ConvertUPNStringRequest) -> ConvertResponse:
    upn_payload = payload.upn_payload.strip()
    if not upn_payload:
        raise HTTPException(status_code=400, detail="UPN payload je prazan.")

    parsed = parse_upn_payload(upn_payload)
    epc_payload = build_epc_payload(parsed)
    epc_qr_base64 = epc_qr_to_base64(epc_payload)
    repository.add(
        source="upn-string",
        iban=parsed.iban,
        amount=parsed.amount,
        currency=parsed.currency or "EUR",
        recipient_name=parsed.recipient_name,
        purpose=parsed.purpose,
        reference=parsed.reference,
    )
    logger.info("conversion=upn-string iban=%s amount=%s", parsed.iban, parsed.amount)

    return ConvertResponse(
        source="upn-string",
        upn_raw_payload=upn_payload,
        upn_parsed=UPNParsedData(**parsed.__dict__),
        epc_payload=epc_payload,
        epc_qr_png_base64=epc_qr_base64,
    )


@app.get("/api/conversions/recent")
def list_recent_conversions(request: Request, limit: int = 20) -> dict[str, object]:
    verify_token_from_request(request)
    if limit < 1 or limit > 200:
        raise HTTPException(status_code=400, detail="Parametar 'limit' mora biti izmedju 1 i 200.")

    records = repository.list(limit=limit)
    items = [
        {
            "id": r["id"],
            "source": r["source"],
            "iban": r["iban"],
            "amount": r["amount"],
            "currency": r["currency"],
            "recipient_name": r["recipient_name"],
            "created_at": r["created_at"],
            "has_pdf": bool(r["has_pdf"]),
        }
        for r in records
    ]

    return {"count": len(items), "items": items}


@app.get("/api/conversions/stats")
def get_conversion_stats(request: Request) -> dict[str, object]:
    verify_token_from_request(request)
    records = repository.list(limit=10000)
    total = len(records)
    pdf_count = sum(1 for r in records if r["source"] == "pdf-upnqr")
    string_count = sum(1 for r in records if r["source"] == "upn-string")
    amounts = [r["amount"] for r in records if r["amount"] is not None]
    amount_sum = round(sum(amounts), 2) if amounts else 0.0
    amount_avg = round(amount_sum / len(amounts), 2) if amounts else 0.0

    return {
        "total_conversions": total,
        "pdf_conversions": pdf_count,
        "string_conversions": string_count,
        "amount": {
            "count": len(amounts),
            "sum": amount_sum,
            "avg": amount_avg,
        },
    }


@app.get("/api/conversions/{conversion_id}/pdf")
def get_conversion_pdf(conversion_id: str, request: Request) -> Response:
    verify_token_from_request(request)
    pdf_bytes = repository.get_pdf(conversion_id)
    if pdf_bytes is None:
        raise HTTPException(status_code=404, detail="PDF not found.")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=\"payment.pdf\""},
    )


@app.delete("/api/conversions")
def clear_conversions(request: Request) -> dict[str, int | str]:
    verify_token_from_request(request)
    deleted = repository.clear()
    return {"status": "ok", "deleted": deleted}

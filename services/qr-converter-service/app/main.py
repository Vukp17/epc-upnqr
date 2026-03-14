import logging
import time

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import RedirectResponse

from .epc import build_epc_payload, epc_qr_to_base64
from .pdf_qr import QRExtractionError, extract_first_qr_payload_from_pdf
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
    version="0.2.0",
    description="Microservice for UPN QR extraction and EPC QR generation.",
)
repository = ConversionRepository()


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
    repository.add(source="pdf-upnqr", iban=parsed.iban, amount=parsed.amount)
    logger.info("conversion=pdf-upnqr iban=%s amount=%s", parsed.iban, parsed.amount)

    return ConvertResponse(
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
    repository.add(source="upn-string", iban=parsed.iban, amount=parsed.amount)
    logger.info("conversion=upn-string iban=%s amount=%s", parsed.iban, parsed.amount)

    return ConvertResponse(
        source="upn-string",
        upn_raw_payload=upn_payload,
        upn_parsed=UPNParsedData(**parsed.__dict__),
        epc_payload=epc_payload,
        epc_qr_png_base64=epc_qr_base64,
    )

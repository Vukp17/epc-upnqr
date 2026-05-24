from typing import Any

import httpx
from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .circuit_breaker import CircuitBreaker, CircuitOpenError
from .auth import verify_token_from_request

QR_SERVICE_URL = "http://qr-converter-service:8001"

app = FastAPI(
    title="Mobile Gateway",
    version="1.0.0",
    description="Mobile-specific API Gateway (BFF style) with Circuit Breaker.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Circuit Breaker ────────────────────────────────────────────────────────────
# Shared instance protecting all calls to qr-converter-service.
# Opens after 5 consecutive failures; probes again after 30 s.
_breaker = CircuitBreaker(
    failure_threshold=5,
    recovery_timeout=30.0,
    success_threshold=2,
    name="qr-converter-service",
)


class MobileUPNRequest:
    def __init__(self, upn_payload: str) -> None:
        self.upn_payload = upn_payload


from pydantic import BaseModel


class MobileUPNRequest(BaseModel):
    upn_payload: str


# ── Helpers ────────────────────────────────────────────────────────────────────

def _guard() -> None:
    """Raise HTTP 503 when the circuit is open (fail fast)."""
    if not _breaker.allow_request():
        status = _breaker.status()
        raise HTTPException(
            status_code=503,
            detail={
                "error": "circuit_open",
                "message": "Upstream qr-converter-service is unavailable (circuit breaker OPEN).",
                "seconds_until_probe": status["seconds_until_probe"],
            },
        )


async def _get(client: httpx.AsyncClient, url: str, **kwargs: Any) -> httpx.Response:
    """GET through the circuit breaker."""
    try:
        response = await client.get(url, **kwargs)
        response.raise_for_status()
        _breaker.record_success()
        return response
    except httpx.HTTPStatusError as exc:
        _breaker.record_failure()
        raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text) from exc
    except Exception as exc:
        _breaker.record_failure()
        raise HTTPException(status_code=502, detail="Upstream service unavailable") from exc


async def _post(client: httpx.AsyncClient, url: str, **kwargs: Any) -> httpx.Response:
    """POST through the circuit breaker."""
    try:
        response = await client.post(url, **kwargs)
        response.raise_for_status()
        _breaker.record_success()
        return response
    except httpx.HTTPStatusError as exc:
        _breaker.record_failure()
        raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text) from exc
    except Exception as exc:
        _breaker.record_failure()
        raise HTTPException(status_code=502, detail="Upstream service unavailable") from exc


def to_mobile_conversion(data: dict[str, Any]) -> dict[str, Any]:
    parsed = data.get("upn_parsed", {})
    return {
        "status": "ok",
        "channel": "mobile",
        "payment": {
            "recipient": parsed.get("recipient_name"),
            "iban": parsed.get("iban"),
            "amount": parsed.get("amount"),
            "currency": parsed.get("currency"),
            "purpose_code": parsed.get("purpose_code"),
            "purpose": parsed.get("purpose"),
            "reference": parsed.get("reference"),
            "payer_name": parsed.get("payer_name"),
            "payer_address": parsed.get("payer_address"),
            "payer_city": parsed.get("payer_city"),
            "recipient_address": parsed.get("recipient_address"),
            "recipient_city": parsed.get("recipient_city"),
            "due_date": parsed.get("due_date"),
            "control_code": parsed.get("control_code"),
        },
        "qr": {
            "epc_payload": data.get("epc_payload"),
            "epc_qr_png_base64": data.get("epc_qr_png_base64"),
        },
    }


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/mobile/health")
async def mobile_health() -> dict[str, Any]:
    breaker_status = _breaker.status()
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            response = await client.get(f"{QR_SERVICE_URL}/health")
            response.raise_for_status()
            upstream = response.json()
            _breaker.record_success()
        except Exception:
            _breaker.record_failure()
            return {
                "status": "degraded",
                "gateway": "mobile",
                "dependency": "qr-converter-service",
                "circuit_breaker": breaker_status,
            }

    return {
        "status": "ok",
        "gateway": "mobile",
        "dependency": upstream,
        "circuit_breaker": breaker_status,
    }


@app.get("/mobile/circuit-breaker/status")
async def circuit_breaker_status() -> dict[str, Any]:
    """Expose live circuit breaker state for observability."""
    return _breaker.status()


@app.post("/mobile/scan/upn")
async def mobile_scan_upn(payload: MobileUPNRequest) -> dict[str, Any]:
    _guard()
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await _post(
            client,
            f"{QR_SERVICE_URL}/api/convert/upn-string",
            json={"upn_payload": payload.upn_payload},
        )
    return to_mobile_conversion(response.json())


@app.post("/mobile/scan/image")
async def mobile_scan_image(file: UploadFile = File(...)) -> dict[str, Any]:
    _guard()
    mime = file.content_type or ""
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if not mime.startswith("image/") and ext not in {"jpg", "jpeg", "png", "webp", "bmp", "gif"}:
        raise HTTPException(status_code=400, detail="Only image files are supported.")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await _post(
            client,
            f"{QR_SERVICE_URL}/api/convert/image",
            files={"file": (file.filename or "photo.jpg", image_bytes, mime or "image/jpeg")},
        )
    return to_mobile_conversion(response.json())


@app.post("/mobile/scan/pdf")
async def mobile_scan_pdf(file: UploadFile = File(...)) -> dict[str, Any]:
    _guard()
    filename = file.filename or "upload.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded PDF is empty.")

    content_type = file.content_type or "application/pdf"
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await _post(
            client,
            f"{QR_SERVICE_URL}/api/convert/pdf",
            files={"file": (filename, file_bytes, content_type)},
        )
    return to_mobile_conversion(response.json())


@app.get("/mobile/history")
async def mobile_history(request: Request, limit: int = Query(default=10, ge=1, le=100)) -> dict[str, Any]:
    verify_token_from_request(request)
    _guard()
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await _get(
            client,
            f"{QR_SERVICE_URL}/api/conversions/recent",
            params={"limit": limit},
            headers={"Authorization": request.headers.get("Authorization", "")},
        )
    payload = response.json()
    items = payload.get("items", [])
    return {
        "status": "ok",
        "channel": "mobile",
        "count": payload.get("count", len(items)),
        "items": items,
    }


@app.get("/mobile/insights")
async def mobile_insights(request: Request) -> dict[str, Any]:
    verify_token_from_request(request)
    _guard()
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await _get(
            client,
            f"{QR_SERVICE_URL}/api/conversions/stats",
            headers={"Authorization": request.headers.get("Authorization", "")},
        )
    return {
        "status": "ok",
        "channel": "mobile",
        "stats": response.json(),
    }


@app.get("/mobile/capabilities")
async def mobile_capabilities(request: Request) -> dict[str, Any]:
    verify_token_from_request(request)
    return {
        "status": "ok",
        "channel": "mobile",
        "features": [
            "scan_upn_string",
            "scan_pdf",
            "history",
            "insights",
        ],
        "circuit_breaker": _breaker.status(),
    }

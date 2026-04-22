from typing import Any

import httpx
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from pydantic import BaseModel

QR_SERVICE_URL = "http://qr-converter-service:8001"

app = FastAPI(
    title="Mobile Gateway",
    version="1.0.0",
    description="Mobile-specific API Gateway (BFF style).",
)


class MobileUPNRequest(BaseModel):
    upn_payload: str


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
            "purpose": parsed.get("purpose"),
            "reference": parsed.get("reference"),
        },
        "qr": {
            "epc_payload": data.get("epc_payload"),
            "epc_qr_png_base64": data.get("epc_qr_png_base64"),
        },
    }


@app.get("/mobile/health")
async def mobile_health() -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            response = await client.get(f"{QR_SERVICE_URL}/health")
            response.raise_for_status()
            upstream = response.json()
        except Exception:
            return {
                "status": "degraded",
                "gateway": "mobile",
                "dependency": "qr-converter-service",
            }

    return {
        "status": "ok",
        "gateway": "mobile",
        "dependency": upstream,
    }


@app.post("/mobile/scan/upn")
async def mobile_scan_upn(payload: MobileUPNRequest) -> dict[str, Any]:
    body = {"upn_payload": payload.upn_payload}

    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            response = await client.post(
                f"{QR_SERVICE_URL}/api/convert/upn-string",
                json=body,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text
            raise HTTPException(status_code=exc.response.status_code, detail=detail) from exc
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Upstream service unavailable") from exc

    return to_mobile_conversion(response.json())


@app.post("/mobile/scan/pdf")
async def mobile_scan_pdf(file: UploadFile = File(...)) -> dict[str, Any]:
    filename = file.filename or "upload.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded PDF is empty.")

    content_type = file.content_type or "application/pdf"
    files = {"file": (filename, file_bytes, content_type)}

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{QR_SERVICE_URL}/api/convert/pdf",
                files=files,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text
            raise HTTPException(status_code=exc.response.status_code, detail=detail) from exc
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Upstream service unavailable") from exc

    return to_mobile_conversion(response.json())


@app.get("/mobile/history")
async def mobile_history(limit: int = Query(default=10, ge=1, le=100)) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{QR_SERVICE_URL}/api/conversions/recent",
                params={"limit": limit},
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text
            raise HTTPException(status_code=exc.response.status_code, detail=detail) from exc
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Upstream service unavailable") from exc

    payload = response.json()
    items = payload.get("items", [])
    return {
        "status": "ok",
        "channel": "mobile",
        "count": payload.get("count", len(items)),
        "items": items,
    }


@app.get("/mobile/insights")
async def mobile_insights() -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(f"{QR_SERVICE_URL}/api/conversions/stats")
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text
            raise HTTPException(status_code=exc.response.status_code, detail=detail) from exc
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Upstream service unavailable") from exc

    return {
        "status": "ok",
        "channel": "mobile",
        "stats": response.json(),
    }


@app.get("/mobile/capabilities")
async def mobile_capabilities() -> dict[str, Any]:
    return {
        "status": "ok",
        "channel": "mobile",
        "features": [
            "scan_upn_string",
            "scan_pdf",
            "history",
            "insights",
        ],
    }

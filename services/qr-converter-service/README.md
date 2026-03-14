# QR Converter Service

Prvi mikroservis koji:
- prima PDF dokument,
- pronalazi prvi QR kod u PDF-u,
- cita UPN payload,
- mapira podatke u EPC QR payload,
- vraca JSON preview podataka i EPC QR sliku (base64 PNG).

## Pokretanje lokalno

```bash
cd services/qr-converter-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Logovi su ukljuceni i ispisuju:
- HTTP request/response (metoda, putanja, status, trajanje),
- poslovni dogadjaj konverzije (`source`, `iban`, `amount`).

## OpenAPI / Swagger

- Swagger UI: `http://localhost:8001/docs`
- Swagger alias: `http://localhost:8001/swagger`
- OpenAPI JSON: `http://localhost:8001/openapi.json`

## API endpoint

- `POST /api/convert/pdf`
- `multipart/form-data`
- polje: `file` (PDF)

- `POST /api/convert/upn-string`
- `application/json`
- body: `{"upn_payload": "UPNQR..."}`

- `GET /health`
- health check endpoint

Primer curl:

```bash
curl -X POST "http://localhost:8001/api/convert/pdf" \
  -H "accept: application/json" \
  -F "file=@../../racun_2512252875501.pdf"
```

Primer curl za skenirani UPN string (frontend/mobilni scan):

```bash
curl -X POST "http://localhost:8001/api/convert/upn-string" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "upn_payload": "UPNQR\\n\\n\\n\\n\\nG. VUK PAPIC\\nKOROSKA CESTA 80\\n2000 MARIBOR\\n00000000538\\n\\n\\nOTLC\\nStoritve 25.11. do 24.12.2025\\n09.01.2026\\nSI56290000159800373\\nSI122512252875501\\nA1 Slovenija, d. d.\\nAmeriska ulica 4\\n1000 Ljubljana\\n203"
  }'
```

## Odgovor

```json
{
  "source": "pdf-upnqr",
  "upn_raw_payload": "...",
  "upn_parsed": {
    "recipient_name": "...",
    "iban": "...",
    "amount": 123.45,
    "currency": "EUR",
    "purpose_code": "...",
    "purpose": "...",
    "reference": "...",
    "payer_name": "..."
  },
  "epc_payload": "BCD\\n002\\n1\\nSCT\\n...",
  "epc_qr_png_base64": "iVBORw0KGgo..."
}
```

## Testiranje

Mikrostoritva ima unit testove za:
- repozitorij (`tests/test_repository.py`),
- sve koncne tacke (`tests/test_api.py`).

Pokretanje lokalno:

```bash
cd services/qr-converter-service
pip install -r requirements-dev.txt
pytest -q
```

Testovi se automatski izvrsavaju i u GitHub Actions cevovodu:
- `.github/workflows/unit-tests.yml`

## Docker

Build slike:

```bash
cd services/qr-converter-service
docker build -t qr-converter-service:latest .
```

Pokretanje preko Docker Compose (iz root-a projekta):

```bash
docker compose up --build
```

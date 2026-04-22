# Web API Gateway (KrakenD)

KrakenD acts as the web-facing API Gateway.

## Exposed endpoints

- `GET /health`
- `GET /openapi.json`
- `POST /api/convert/pdf`
- `POST /api/convert/upn-string`

These routes proxy to `qr-converter-service`.

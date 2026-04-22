# API Gateways Setup

This project now includes two API gateways:

- Web gateway: KrakenD (`http://localhost:8080`)
- Mobile gateway: FastAPI (`http://localhost:8090`)

They both proxy to `qr-converter-service` and expose different contracts.

## 1) Start with Docker Compose

```bash
docker compose up -d --build qr-converter-service web-gateway mobile-gateway
```

## 2) Web Gateway (KrakenD)

Configured in `gateways/web-gateway/krakend.json`.

Exposed endpoints:

- `GET /health`
- `GET /openapi.json`
- `POST /api/convert/pdf`
- `POST /api/convert/upn-string`

## 3) Mobile Gateway (FastAPI)

Source in `gateways/mobile-gateway/app/main.py`.

Exposed endpoints:

- `GET /mobile/health`
- `POST /mobile/scan/upn`

`/mobile/scan/upn` returns a compact, mobile-oriented response contract.

## 4) Postman Demo

Use:

- `postman/local.postman_environment.json`
- `postman/qr-converter-service.postman_collection.json`

Environment variables:

- `webGatewayUrl = http://127.0.0.1:8080`
- `mobileGatewayUrl = http://127.0.0.1:8090`

## 5) Quick curl checks

```bash
curl http://localhost:8080/health
curl http://localhost:8090/mobile/health
```

```bash
curl -X POST http://localhost:8090/mobile/scan/upn \
  -H "Content-Type: application/json" \
  -d '{"upn_payload":"UPNQR..."}'
```

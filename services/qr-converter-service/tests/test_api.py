from fastapi.testclient import TestClient

from app.main import app

SAMPLE_UPN_PAYLOAD = """UPNQR\n\n\n\n\nG. VUK PAPIĆ\nKOROŠKA CESTA 80\n2000 MARIBOR\n00000000538\n\n\nOTLC\nStoritve 25.11. do 24.12.2025\n09.01.2026\nSI56290000159800373\nSI122512252875501\nA1 Slovenija, d. d.\nAmeriška ulica 4\n1000 Ljubljana\n203"""


def test_health_endpoint() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_swagger_redirect_endpoint() -> None:
    client = TestClient(app)

    response = client.get("/swagger", follow_redirects=False)

    assert response.status_code in (307, 302)
    assert response.headers["location"] == "/docs"


def test_convert_upn_string_endpoint_returns_epc() -> None:
    client = TestClient(app)

    response = client.post("/api/convert/upn-string", json={"upn_payload": SAMPLE_UPN_PAYLOAD})

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "upn-string"
    assert body["upn_parsed"]["iban"] == "SI56290000159800373"
    assert body["upn_parsed"]["amount"] == 5.38
    assert body["epc_payload"].splitlines()[0] == "BCD"
    assert len(body["epc_qr_png_base64"]) > 100


def test_convert_pdf_endpoint(monkeypatch) -> None:
    client = TestClient(app)

    def fake_extract_first_qr_payload_from_pdf(pdf_bytes: bytes, max_pages: int = 5) -> str:
        del max_pages
        assert pdf_bytes == b"dummy-pdf"
        return SAMPLE_UPN_PAYLOAD

    monkeypatch.setattr(
        "app.main.extract_first_qr_payload_from_pdf",
        fake_extract_first_qr_payload_from_pdf,
    )

    files = {"file": ("racun.pdf", b"dummy-pdf", "application/pdf")}
    response = client.post("/api/convert/pdf", files=files)

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "pdf-upnqr"
    assert body["upn_parsed"]["amount"] == 5.38
    assert body["upn_parsed"]["iban"] == "SI56290000159800373"


def test_convert_pdf_rejects_non_pdf() -> None:
    client = TestClient(app)

    files = {"file": ("racun.txt", b"test", "text/plain")}
    response = client.post("/api/convert/pdf", files=files)

    assert response.status_code == 400
    assert response.json()["detail"] == "Fajl mora biti PDF."


def test_convert_upn_string_rejects_empty_payload() -> None:
    client = TestClient(app)

    response = client.post("/api/convert/upn-string", json={"upn_payload": "   "})

    assert response.status_code == 400
    assert response.json()["detail"] == "UPN payload je prazan."

import tempfile
from pathlib import Path

import cv2
import numpy as np
import pypdfium2 as pdfium
import zxingcpp


class QRExtractionError(Exception):
    pass


def _try_decode(detector: cv2.QRCodeDetector, image: np.ndarray) -> str | None:
    try:
        payload, _, _ = detector.detectAndDecode(image)
        if payload:
            return payload.strip()
    except UnicodeDecodeError:
        pass

    try:
        ok, decoded_list, _, _ = detector.detectAndDecodeMulti(image)
        if ok and decoded_list:
            for candidate in decoded_list:
                if candidate:
                    return candidate.strip()
    except UnicodeDecodeError:
        pass

    zxing_results = zxingcpp.read_barcodes(image)
    for result in zxing_results:
        if result.text:
            return result.text.strip()

    return None


def _preprocess_variants(image: np.ndarray) -> list[np.ndarray]:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    _, otsu = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    adaptive = cv2.adaptiveThreshold(
        blurred,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        2,
    )
    scaled_gray = cv2.resize(gray, None, fx=1.8, fy=1.8, interpolation=cv2.INTER_CUBIC)

    return [image, gray, otsu, adaptive, scaled_gray]


def _render_pdf_page_to_image(doc: pdfium.PdfDocument, page_index: int, scale: float = 2.5) -> np.ndarray:
    page = doc.get_page(page_index)
    bitmap = page.render(scale=scale)
    pil_image = bitmap.to_pil()
    page.close()
    return cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)


def extract_first_qr_payload_from_pdf(pdf_bytes: bytes, max_pages: int = 5) -> str:
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
        temp_file.write(pdf_bytes)
        temp_path = Path(temp_file.name)

    try:
        doc = pdfium.PdfDocument(str(temp_path))
        page_count = min(len(doc), max_pages)
        detector = cv2.QRCodeDetector()

        for page_idx in range(page_count):
            image = _render_pdf_page_to_image(doc, page_idx)
            for variant in _preprocess_variants(image):
                payload = _try_decode(detector, variant)
                if payload:
                    return payload

        raise QRExtractionError("QR kod nije pronadjen ni na jednoj PDF stranici.")
    finally:
        temp_path.unlink(missing_ok=True)

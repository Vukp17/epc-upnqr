import base64
from io import BytesIO

import qrcode

from .upn_parser import ParsedUPN


def build_epc_payload(parsed: ParsedUPN) -> str:
    # EPC QR (BCD) format, minimal subset for SCT transfer.
    lines = [
        "BCD",
        "002",
        "1",
        "SCT",
        "",  # BIC is optional for SEPA transfers in many banks.
        parsed.recipient_name or "UNKNOWN RECIPIENT",
        parsed.iban or "",
        f"{parsed.currency}{parsed.amount:.2f}" if parsed.amount is not None else "",
        "",
        parsed.reference or "",
        parsed.purpose or "",
    ]
    return "\n".join(lines)


def epc_qr_to_base64(epc_payload: str) -> str:
    image = qrcode.make(epc_payload)
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("ascii")

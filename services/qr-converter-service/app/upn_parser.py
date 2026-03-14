import re
from dataclasses import dataclass


@dataclass
class ParsedUPN:
    recipient_name: str | None = None
    iban: str | None = None
    amount: float | None = None
    currency: str = "EUR"
    purpose_code: str | None = None
    purpose: str | None = None
    reference: str | None = None
    payer_name: str | None = None


def _extract_amount(raw: str) -> float | None:
    # UPNQR positional format often encodes amount as 11-digit cents value.
    for line in raw.splitlines():
        candidate = line.strip()
        if re.fullmatch(r"\d{11}", candidate):
            return int(candidate) / 100.0

    # Supports amounts like 123.45, 123,45 or 123,45 EUR.
    match = re.search(r"(?:iznos|amount)?\s*[:=]?\s*(\d+[\.,]\d{2}|\d+)(?:\s*(?:EUR|RSD))?", raw, re.IGNORECASE)
    if not match:
        return None
    amount_str = match.group(1).replace(",", ".")
    try:
        return float(amount_str)
    except ValueError:
        return None


def _extract_iban(raw: str) -> str | None:
    match = re.search(r"\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b", raw.replace(" ", ""))
    return match.group(0) if match else None


def _extract_reference(lines: list[str]) -> str | None:
    for line in lines:
        if "RF" in line.upper() or "POZIV" in line.upper() or "REFERENCE" in line.upper():
            compact = line.split(":", 1)
            return compact[1].strip() if len(compact) == 2 else line.strip()
    return None


def parse_upn_payload(raw_payload: str) -> ParsedUPN:
    lines = [line.strip() for line in raw_payload.splitlines() if line.strip()]
    normalized = "\n".join(lines)

    recipient_name = None
    payer_name = None
    purpose = None
    purpose_code = None

    for line in lines:
        upper = line.upper()
        if upper.startswith(("PREJEMNIK", "PRIMALAC", "RECIPIENT")):
            recipient_name = line.split(":", 1)[-1].strip() if ":" in line else line
        if upper.startswith(("PLACNIK", "PLATILAC", "PAYER")):
            payer_name = line.split(":", 1)[-1].strip() if ":" in line else line
        if upper.startswith(("NAMEN", "SVRHA", "PURPOSE")):
            purpose = line.split(":", 1)[-1].strip() if ":" in line else line
        if upper.startswith(("KODA NAMENA", "PURPOSE CODE")):
            purpose_code = line.split(":", 1)[-1].strip() if ":" in line else line

    return ParsedUPN(
        recipient_name=recipient_name,
        iban=_extract_iban(normalized),
        amount=_extract_amount(normalized),
        currency="EUR",
        purpose_code=purpose_code,
        purpose=purpose,
        reference=_extract_reference(lines),
        payer_name=payer_name,
    )

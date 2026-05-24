import re
from dataclasses import dataclass


@dataclass
class ParsedUPN:
    recipient_name: str | None = None
    recipient_address: str | None = None
    recipient_city: str | None = None
    iban: str | None = None
    amount: float | None = None
    currency: str = "EUR"
    purpose_code: str | None = None
    purpose: str | None = None
    reference: str | None = None
    payer_name: str | None = None
    payer_address: str | None = None
    payer_city: str | None = None
    due_date: str | None = None
    control_code: str | None = None


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


def _is_date(value: str) -> bool:
    return re.fullmatch(r"\d{2}\.\d{2}\.\d{4}", value) is not None


def _extract_iban_candidates(lines: list[str]) -> list[str]:
    candidates: list[str] = []
    seen: set[str] = set()
    for line in lines:
        for match in re.findall(r"\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b", line.replace(" ", "")):
            if match not in seen:
                candidates.append(match)
                seen.add(match)
    return candidates


def parse_upn_payload(raw_payload: str) -> ParsedUPN:
    raw_lines = [line.strip() for line in raw_payload.splitlines()]
    lines = [line for line in raw_lines if line]
    normalized = "\n".join(lines)

    recipient_name = None
    recipient_address = None
    recipient_city = None
    payer_name = None
    payer_address = None
    payer_city = None
    purpose = None
    purpose_code = None
    due_date = None
    control_code = None

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

    if raw_lines and any(line.upper() == "UPNQR" for line in raw_lines):
        amount_index = None
        for idx, line in enumerate(lines):
            if re.fullmatch(r"\d{11}", line):
                amount_index = idx
                break

        if amount_index is not None:
            payer_block = lines[max(0, amount_index - 3):amount_index]
            if len(payer_block) >= 3:
                payer_name = payer_name or payer_block[0]
                payer_address = payer_address or payer_block[1]
                payer_city = payer_city or payer_block[2]
            elif len(payer_block) == 2:
                payer_name = payer_name or payer_block[0]
                payer_address = payer_address or payer_block[1]
            elif len(payer_block) == 1:
                payer_name = payer_name or payer_block[0]

        if purpose_code is None:
            for line in lines:
                if re.fullmatch(r"[A-Z]{4}", line):
                    purpose_code = line
                    break

        if due_date is None:
            for line in lines:
                if _is_date(line):
                    due_date = line
                    break

        if purpose is None and purpose_code:
            try:
                code_index = lines.index(purpose_code)
            except ValueError:
                code_index = None
            if code_index is not None:
                for line in lines[code_index + 1:]:
                    if _is_date(line):
                        due_date = due_date or line
                        continue
                    if re.fullmatch(r"\d{1,3}", line):
                        continue
                    if re.fullmatch(r"[A-Z]{2}\d{2}[A-Z0-9]{10,30}", line):
                        continue
                    purpose = line
                    break

        iban_candidates = _extract_iban_candidates(lines)
        iban = _extract_iban(normalized) or (iban_candidates[0] if iban_candidates else None)
        reference = _extract_reference(lines)
        if reference is None and len(iban_candidates) >= 2:
            reference = iban_candidates[1]

        if reference:
            try:
                ref_index = lines.index(reference)
            except ValueError:
                ref_index = None
            if ref_index is not None:
                recipient_block: list[str] = []
                for line in lines[ref_index + 1: ref_index + 6]:
                    if re.fullmatch(r"\d{1,3}", line):
                        control_code = control_code or line
                        continue
                    if re.fullmatch(r"[A-Z]{2}\d{2}[A-Z0-9]{10,30}", line):
                        continue
                    recipient_block.append(line)
                if len(recipient_block) >= 3:
                    recipient_name = recipient_name or recipient_block[0]
                    recipient_address = recipient_address or recipient_block[1]
                    recipient_city = recipient_city or recipient_block[2]
                elif len(recipient_block) == 2:
                    recipient_name = recipient_name or recipient_block[0]
                    recipient_address = recipient_address or recipient_block[1]
                elif len(recipient_block) == 1:
                    recipient_name = recipient_name or recipient_block[0]

        if control_code is None and lines and re.fullmatch(r"\d{1,3}", lines[-1]):
            control_code = lines[-1]

        amount = _extract_amount(normalized)
    else:
        iban = _extract_iban(normalized)
        reference = _extract_reference(lines)
        amount = _extract_amount(normalized)

    return ParsedUPN(
        recipient_name=recipient_name,
        recipient_address=recipient_address,
        recipient_city=recipient_city,
        iban=iban,
        amount=amount,
        currency="EUR",
        purpose_code=purpose_code,
        purpose=purpose,
        reference=reference,
        payer_name=payer_name,
        payer_address=payer_address,
        payer_city=payer_city,
        due_date=due_date,
        control_code=control_code,
    )

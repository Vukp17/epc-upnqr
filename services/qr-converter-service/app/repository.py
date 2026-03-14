from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class ConversionRecord:
    source: str
    iban: str | None
    amount: float | None
    created_at_utc: str


class ConversionRepository:
    def __init__(self) -> None:
        self._records: list[ConversionRecord] = []

    def add(self, source: str, iban: str | None, amount: float | None) -> ConversionRecord:
        record = ConversionRecord(
            source=source,
            iban=iban,
            amount=amount,
            created_at_utc=datetime.now(timezone.utc).isoformat(),
        )
        self._records.append(record)
        return record

    def list(self) -> Sequence[ConversionRecord]:
        return tuple(self._records)

    def clear(self) -> None:
        self._records.clear()

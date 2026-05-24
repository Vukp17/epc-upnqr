import os
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from threading import Lock
from typing import Generator

DB_PATH = os.environ.get("DB_PATH", "./conversions.db")

_lock = Lock()


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def _db() -> Generator[sqlite3.Connection, None, None]:
    with _lock:
        conn = _connect()
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()


def init_db() -> None:
    with _db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS conversions (
                id TEXT PRIMARY KEY,
                source TEXT NOT NULL,
                iban TEXT,
                amount REAL,
                currency TEXT NOT NULL DEFAULT 'EUR',
                recipient_name TEXT,
                purpose TEXT,
                reference TEXT,
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS conversion_pdfs (
                conversion_id TEXT PRIMARY KEY
                    REFERENCES conversions(id) ON DELETE CASCADE,
                pdf_data BLOB NOT NULL
            )
        """)


class ConversionRepository:
    def __init__(self) -> None:
        init_db()

    def add(
        self,
        source: str,
        iban: str | None = None,
        amount: float | None = None,
        currency: str = "EUR",
        recipient_name: str | None = None,
        purpose: str | None = None,
        reference: str | None = None,
        pdf_bytes: bytes | None = None,
    ) -> str:
        record_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        with _db() as conn:
            conn.execute(
                """INSERT INTO conversions
                   (id, source, iban, amount, currency, recipient_name, purpose, reference, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (record_id, source, iban, amount, currency, recipient_name, purpose, reference, created_at),
            )
            if pdf_bytes:
                conn.execute(
                    "INSERT INTO conversion_pdfs (conversion_id, pdf_data) VALUES (?, ?)",
                    (record_id, pdf_bytes),
                )
        return record_id

    def list(self, limit: int = 200) -> list[dict]:
        with _db() as conn:
            rows = conn.execute(
                """SELECT c.id, c.source, c.iban, c.amount, c.currency,
                          c.recipient_name, c.purpose, c.reference, c.created_at,
                          CASE WHEN p.conversion_id IS NOT NULL THEN 1 ELSE 0 END AS has_pdf
                   FROM conversions c
                   LEFT JOIN conversion_pdfs p ON p.conversion_id = c.id
                   ORDER BY c.created_at DESC
                   LIMIT ?""",
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]

    def get_pdf(self, conversion_id: str) -> bytes | None:
        with _db() as conn:
            row = conn.execute(
                "SELECT pdf_data FROM conversion_pdfs WHERE conversion_id = ?",
                (conversion_id,),
            ).fetchone()
        return bytes(row["pdf_data"]) if row else None

    def clear(self) -> int:
        with _db() as conn:
            count = conn.execute("SELECT COUNT(*) FROM conversions").fetchone()[0]
            conn.execute("DELETE FROM conversion_pdfs")
            conn.execute("DELETE FROM conversions")
        return count

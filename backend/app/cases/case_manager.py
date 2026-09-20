"""
Case manager — persists cases to SQLite and manages lifecycle.
"""

from __future__ import annotations

import json
import logging
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from ..config import get_settings
from ..models.case import CaseAnswer, CaseStatus, Verdict

logger = logging.getLogger(__name__)
settings = get_settings()


def _db_path() -> str:
    url = settings.database_url
    if url.startswith("sqlite:///"):
        return url[len("sqlite:///"):]
    return "fraud_cases.db"


@contextmanager
def _conn():
    db = _db_path()
    Path(db).parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(db)
    con.row_factory = sqlite3.Row
    try:
        yield con
        con.commit()
    finally:
        con.close()


def _init_db() -> None:
    with _conn() as con:
        con.executescript("""
            CREATE TABLE IF NOT EXISTS cases (
                case_id TEXT PRIMARY KEY,
                status TEXT,
                verdict TEXT,
                fraud_probability REAL,
                pattern TEXT,
                exposure_usd REAL,
                opened_at TEXT,
                closed_at TEXT,
                answer_json TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_id TEXT,
                step INTEGER,
                action TEXT,
                status TEXT,
                ts TEXT,
                data_json TEXT
            );
        """)


class CaseManager:
    def __init__(self) -> None:
        _init_db()

    def save_answer(self, answer: CaseAnswer) -> None:
        with _conn() as con:
            con.execute(
                """
                INSERT OR REPLACE INTO cases
                  (case_id, status, verdict, fraud_probability, pattern,
                   exposure_usd, opened_at, closed_at, answer_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    answer.case_id,
                    answer.case.status.value,
                    answer.case.verdict.value,
                    answer.case.fraud_probability,
                    answer.case.pattern.value,
                    answer.case.exposure_usd,
                    datetime.utcnow().isoformat(),
                    datetime.utcnow().isoformat(),
                    answer.model_dump_json(),
                ),
            )

    def get_answer(self, case_id: str) -> Optional[CaseAnswer]:
        with _conn() as con:
            row = con.execute(
                "SELECT answer_json FROM cases WHERE case_id = ?", (case_id,)
            ).fetchone()
        if row:
            return CaseAnswer.model_validate_json(row[0])
        return None

    def list_cases(self, limit: int = 100) -> list[dict]:
        with _conn() as con:
            rows = con.execute(
                "SELECT case_id, status, verdict, fraud_probability, pattern, "
                "exposure_usd, created_at FROM cases ORDER BY created_at DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]

    def log_audit(self, case_id: str, entries: list[dict]) -> None:
        with _conn() as con:
            for e in entries:
                con.execute(
                    "INSERT INTO audit_log (case_id, step, action, status, ts, data_json) "
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    (
                        case_id,
                        e.get("step", 0),
                        e.get("action", ""),
                        e.get("status", ""),
                        e.get("timestamp", datetime.utcnow().isoformat()),
                        json.dumps({k: v for k, v in e.items()
                                    if k not in ("step", "action", "status", "timestamp")}),
                    ),
                )

    def get_audit(self, case_id: str) -> list[dict[str, Any]]:
        with _conn() as con:
            rows = con.execute(
                "SELECT step, action, status, ts, data_json FROM audit_log "
                "WHERE case_id = ? ORDER BY id",
                (case_id,),
            ).fetchall()
        entries = []
        for row in rows:
            entry = {
                "step": row["step"],
                "action": row["action"],
                "status": row["status"],
                "timestamp": row["ts"],
            }
            if row["data_json"]:
                entry.update(json.loads(row["data_json"]))
            entries.append(entry)
        return entries

    def update_answer(self, answer: CaseAnswer) -> None:
        self.save_answer(answer)

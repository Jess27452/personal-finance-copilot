"""Transaction CSV parsing and validation."""

from __future__ import annotations

from io import BytesIO, StringIO
from pathlib import Path
from typing import IO, Any

import pandas as pd


REQUIRED_COLUMNS = {"date", "description", "amount"}
COLUMN_ALIASES = {
    "transaction date": "date",
    "posted date": "date",
    "merchant": "description",
    "memo": "description",
    "transaction": "description",
    "value": "amount",
}


def _normalize_columns(columns: list[str]) -> list[str]:
    normalized = []
    for column in columns:
        name = column.strip().lower().replace("_", " ")
        normalized.append(COLUMN_ALIASES.get(name, name.replace(" ", "_")))
    return normalized


def load_transactions(source: str | Path | IO[Any] | BytesIO | StringIO) -> pd.DataFrame:
    """Load transaction data and return a normalized expense DataFrame."""
    transactions = pd.read_csv(source)
    transactions.columns = _normalize_columns(list(transactions.columns))

    missing = REQUIRED_COLUMNS - set(transactions.columns)
    if missing:
        raise ValueError(f"CSV is missing required columns: {', '.join(sorted(missing))}")

    transactions = transactions.copy()
    transactions["date"] = pd.to_datetime(transactions["date"], errors="coerce")
    transactions["description"] = transactions["description"].fillna("").astype(str).str.strip()
    transactions["amount"] = pd.to_numeric(
        transactions["amount"].astype(str).str.replace(r"[$,]", "", regex=True),
        errors="coerce",
    )
    transactions = transactions.dropna(subset=["date", "amount"])
    transactions = transactions[transactions["description"].str.len() > 0]

    # Expenses are normalized as positive values. Negative bank values are common for charges.
    transactions["amount"] = transactions["amount"].abs()
    transactions = transactions[transactions["amount"] > 0]

    if transactions.empty:
        raise ValueError("CSV does not contain any valid transactions.")

    return transactions.sort_values("date").reset_index(drop=True)


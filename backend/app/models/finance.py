from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class FinanceDocument(BaseModel):
    # For speed we keep it flexible and store the JSON as-is.
    # You can later replace this with strict models matching FinanceDataV1.
    data: dict[str, Any]

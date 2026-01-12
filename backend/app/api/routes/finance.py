from __future__ import annotations

import csv
import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.db.repositories import FinanceRepo
from app.models.finance import FinanceDocument
from app.services.auth import get_current_user_id

router = APIRouter()

finance = FinanceRepo()


@router.get("/me", response_model=FinanceDocument)
async def get_me(user_id: str = Depends(get_current_user_id)):
    doc = await finance.get_for_user(user_id)
    if doc is None:
        return FinanceDocument(data={})
    doc.pop("_id", None)
    doc.pop("user_id", None)
    return FinanceDocument(data=doc)


@router.put("/me", response_model=FinanceDocument)
async def put_me(body: FinanceDocument, user_id: str = Depends(get_current_user_id)):
    await finance.upsert_for_user(user_id=user_id, doc=body.data)
    saved = await finance.get_for_user(user_id)
    if saved is None:
        raise HTTPException(status_code=500, detail="Failed to save")
    saved.pop("_id", None)
    saved.pop("user_id", None)
    return FinanceDocument(data=saved)


@router.post("/me/import/incomes")
async def import_incomes_csv(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    # Accepts CSV with columns: date,name,amount,currency(optional)
    raw = await file.read()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)

    # Fetch existing document
    doc = await finance.get_for_user(user_id)
    base = {} if doc is None else {k: v for k, v in doc.items() if k not in ("_id", "user_id")}

    incomes = base.get("incomes")
    if not isinstance(incomes, list):
        incomes = []

    imported = 0
    for r in rows:
        date = (r.get("date") or "").strip()
        name = (r.get("name") or "").strip()
        amount_str = (r.get("amount") or "").strip().replace(",", ".")
        currency = (r.get("currency") or base.get("currency") or "EUR").strip()
        if not date or not name or not amount_str:
            continue
        try:
            amount = float(amount_str)
        except ValueError:
            continue

        incomes.append(
            {
                "id": f"inc_import_{date}_{name}",
                "date": date,
                "name": name,
                "amount": {"amount": amount, "currency": currency},
            }
        )
        imported += 1

    base["incomes"] = incomes
    await finance.upsert_for_user(user_id=user_id, doc=base)

    return {"imported": imported}

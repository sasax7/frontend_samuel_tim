from __future__ import annotations

from bson import ObjectId

from app.db.mongo import get_db


def _id_str(oid: ObjectId) -> str:
    return str(oid)


class UsersRepo:
    @property
    def col(self):
        return get_db()["users"]

    async def find_by_email(self, email: str):
        return await self.col.find_one({"email": email})

    async def create(self, *, email: str, password_hash: str) -> str:
        res = await self.col.insert_one({"email": email, "password_hash": password_hash})
        return _id_str(res.inserted_id)


class FinanceRepo:
    @property
    def col(self):
        return get_db()["finance"]

    async def get_for_user(self, user_id: str):
        return await self.col.find_one({"user_id": user_id})

    async def upsert_for_user(self, *, user_id: str, doc: dict):
        # store user_id in document
        payload = {**doc, "user_id": user_id}
        await self.col.update_one({"user_id": user_id}, {"$set": payload}, upsert=True)

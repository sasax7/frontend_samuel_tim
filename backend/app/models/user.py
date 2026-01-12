from __future__ import annotations

from pydantic import BaseModel, Field


class UserPublic(BaseModel):
    id: str
    email: str


class UserInDB(BaseModel):
    # Mongo will store _id as ObjectId stringified
    id: str = Field(alias="_id")
    email: str
    password_hash: str

from passlib.context import CryptContext

# NOTE:
# We intentionally use argon2 here instead of bcrypt.
# bcrypt has had recurring compatibility issues across passlib/bcrypt versions
# (e.g. "module 'bcrypt' has no attribute '__about__'").
# argon2 is a strong default and works reliably in modern Python environments.
_pwd = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _pwd.verify(password, password_hash)

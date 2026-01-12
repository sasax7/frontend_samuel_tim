from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db: str = "quantraider"

    jwt_secret: str = "CHANGE_ME"
    jwt_issuer: str = "quantraider"
    jwt_audience: str = "quantraider"
    jwt_access_ttl_minutes: int = 60 * 24 * 7  # 7 days

    # CORS (comma-separated list in env)
    cors_allow_origins: str = "http://localhost:5173,http://127.0.0.1:5173,https://localhost:5173,https://127.0.0.1:5173,https://api.samueltim.com,https://samueltim.com"


settings = Settings()

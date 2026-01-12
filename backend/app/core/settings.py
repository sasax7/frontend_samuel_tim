from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Ermöglicht das Laden aus einer .env Datei (lokal) oder Environment Variables (Docker/K8s)
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # In K8s wird dies zu: mongodb://mongo:27017
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db: str = "quantraider"

    jwt_secret: str = "CHANGE_ME"
    jwt_issuer: str = "quantraider"
    jwt_audience: str = "quantraider"
    jwt_access_ttl_minutes: int = 60 * 24 * 7  # 7 Tage

    # WICHTIG: Hier stehen die Domains für Produktion und lokales Testing
    cors_allow_origins: str = (
        "http://localhost:5173,"
        "http://127.0.0.1:5173,"
        "https://samueltim.com,"
        "https://www.samueltim.com,"
        "https://api.samueltim.com"
    )

settings = Settings()
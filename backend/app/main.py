from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.settings import settings
from app.db.mongo import close_client

def create_app() -> FastAPI:
    app = FastAPI(
        title="SamuelTim API",
        version="1.0.0",
        # Health-Check Endpunkt für Kubernetes Probes
        docs_url="/api/docs",
        openapi_url="/api/openapi.json"
    )

    # CORS Konfiguration: Wandelt den String in eine Liste um
    allow_origins = [o.strip() for o in settings.cors_allow_origins.split(",") if o.strip()]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health Check für Kubernetes Liveness/Readiness Probes
    @app.get("/health")
    async def health_check():
        return {"status": "ok"}

    # Alle Routen unter /auth, /users etc. einbinden
    app.include_router(api_router)

    @app.on_event("shutdown")
    async def _shutdown() -> None:
        await close_client()

    return app

app = create_app()
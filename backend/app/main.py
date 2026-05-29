from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings
from app.db.schema_upgrades import ensure_schema_upgrades
from app.db.session import Base, SessionLocal, engine
from app.services.seed_data import seed_job_roles


def create_app() -> FastAPI:
    Base.metadata.create_all(bind=engine)
    ensure_schema_upgrades(engine)

    with SessionLocal() as db:
        seed_job_roles(db)

    app = FastAPI(title=settings.app_name)

    allowed_origins = [
        settings.frontend_origin,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        *settings.frontend_origins,
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)
    return app


app = create_app()

from functools import lru_cache
from os import getenv
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()


def database_url() -> str:
    url = getenv("DATABASE_URL") or (
        "sqlite:////tmp/skillbridge_dev.db" if getenv("VERCEL") else "sqlite:///./skillbridge_dev.db"
    )

    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)

    return url


class Settings:
    app_name: str = getenv("APP_NAME", "SkillBridge AI")
    database_url: str = database_url()
    frontend_origin: str = getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    frontend_origins: list[str] = [
        origin.strip()
        for origin in getenv("FRONTEND_ORIGINS", "").split(",")
        if origin.strip()
    ]
    upload_dir: Path = Path(getenv("UPLOAD_DIR", "/tmp/skillbridge_uploads" if getenv("VERCEL") else "uploads"))
    secret_key: str = getenv("SECRET_KEY", "skillbridge-dev-secret")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

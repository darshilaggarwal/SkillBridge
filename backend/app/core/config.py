from functools import lru_cache
from os import getenv
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()


class Settings:
    app_name: str = getenv("APP_NAME", "SkillBridge AI")
    database_url: str = getenv("DATABASE_URL") or "sqlite:///./skillbridge_dev.db"
    frontend_origin: str = getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    upload_dir: Path = Path(getenv("UPLOAD_DIR", "uploads"))
    secret_key: str = getenv("SECRET_KEY", "skillbridge-dev-secret")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    APP_NAME: str = "AstroSight: Lunar Crater Image Classification and Spatial Analysis"
    API_V1_STR: str = "/api/v1"

    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # Cryptography & Session Tokens
    SECRET_KEY: str = "astrosight-dev-super-secure-cryptographic-signing-key-32-chars-min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "sqlite:///./backend/data/astrosight.db"

    # CORS Origins (never wildcard with credentials)
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    # File Upload Limits
    MAX_UPLOAD_SIZE_MB: int = 50
    MAX_IMAGE_WIDTH_PX: int = 8000
    MAX_IMAGE_HEIGHT_PX: int = 8000
    PRIVATE_STORAGE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))

    # Initial Admin Seed
    INITIAL_ADMIN_EMAIL: str = "VTU30097@astrosight.vel.tech"
    INITIAL_ADMIN_PASSWORD: str = "Srikiran@2006"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

settings = Settings()

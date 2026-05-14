"""Application configuration and settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = "SmartResume API"
    app_version: str = "1.0.0"
    debug: bool = True

    # Ollama
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "resume-analyzer"
    ollama_timeout: int = 120

    # CORS
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # Upload
    max_upload_size_mb: int = 10
    upload_dir: str = "uploads"

    class Config:
        env_file = ".env"
        env_prefix = "SMARTRESUME_"


settings = Settings()

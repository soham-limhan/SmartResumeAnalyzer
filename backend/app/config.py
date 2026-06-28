"""Application configuration and settings."""

import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = "ProfileX AI API"
    app_version: str = "1.0.0"
    debug: bool = True

    # AI Provider — set PROFILEX_AI_GROQ_API_KEY to use Groq cloud,
    # otherwise falls back to local Ollama.
    groq_api_key: Optional[str] = None
    groq_model: str = "llama-3.3-70b-versatile"

    # Ollama (local fallback)
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "resume-analyzer"
    ollama_timeout: int = 120

    # Firebase
    firebase_credentials_path: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "firebase-key.json",
    )
    # For production (Render): base64-encoded service account JSON
    firebase_credentials_base64: Optional[str] = None

    # CORS
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # Upload
    max_upload_size_mb: int = 10
    upload_dir: str = "uploads"

    @property
    def ai_provider(self) -> str:
        """Return which AI provider is active."""
        return "groq" if self.groq_api_key else "ollama"

    class Config:
        env_file = ".env"
        env_prefix = "PROFILEX_AI_"


settings = Settings()

"""FastAPI application entry point."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import upload, history, export, auth
from app.database import init_firebase


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # Startup
    os.makedirs(settings.upload_dir, exist_ok=True)
    print(f"[STARTUP] {settings.app_name} v{settings.app_version} starting...")
    print(f"[UPLOAD]  Upload directory: {settings.upload_dir}")
    print(f"[AI]      Provider: {settings.ai_provider.upper()}")

    # Initialize Firebase
    try:
        init_firebase()
        print("[OK]      Firebase initialized successfully")
    except Exception as e:
        print(f"[ERROR]   Firebase initialization failed: {e}")
        raise

    if settings.ai_provider == "groq":
        print(f"[AI]      Groq model: {settings.groq_model}")
        try:
            from groq import Groq
            client = Groq(api_key=settings.groq_api_key)
            models = client.models.list()
            print(f"[OK]      Groq connection successful ({len(models.data)} models available)")
        except Exception as e:
            print(f"[WARN]    Groq connection check failed: {e}")
            print("          Analysis may fail. Check your SMARTRESUME_GROQ_API_KEY.")
    else:
        print(f"[AI]      Ollama model: {settings.ollama_model} @ {settings.ollama_host}")
        try:
            import ollama
            ollama.list()
            print("[OK]      Ollama connection successful")

            print(f"[WARMUP]  Loading '{settings.ollama_model}' into memory...")
            try:
                warmup_response = ollama.chat(
                    model=settings.ollama_model,
                    messages=[{"role": "user", "content": "Respond with only the word READY."}],
                    options={"temperature": 0, "num_ctx": 128, "num_predict": 5},
                )
                print(f"[WARMUP]  Model loaded and responding: {warmup_response.message.content.strip()[:20]}")
            except Exception as warmup_err:
                print(f"[WARN]    Model warmup failed: {warmup_err}")
                print("          First analysis request may be slow (cold start).")

        except Exception as e:
            print(f"[WARN]    Ollama connection failed: {e}")
            print("          Resume analysis will fail until Ollama is running.")

    yield

    # Shutdown
    print("[SHUTDOWN] ResumePilot API shutting down...")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered resume analysis API",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(upload.router, prefix="/api", tags=["Upload & Analysis"])
app.include_router(history.router, prefix="/api", tags=["History"])
app.include_router(export.router, prefix="/api", tags=["Export"])


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint with AI provider status."""
    provider = settings.ai_provider

    if provider == "groq":
        ai_status = "unknown"
        has_model = False
        try:
            from groq import Groq
            client = Groq(api_key=settings.groq_api_key)
            models = client.models.list()
            model_ids = [m.id for m in models.data] if models.data else []
            ai_status = "connected"
            has_model = settings.groq_model in model_ids
        except Exception:
            ai_status = "disconnected"

        return {
            "status": "healthy",
            "version": settings.app_version,
            "ai_provider": "groq",
            "ollama": {
                "status": ai_status,
                "model": settings.groq_model,
                "model_available": has_model,
            },
        }
    else:
        ollama_status = "unknown"
        has_model = False
        try:
            import ollama
            models = ollama.list()
            model_names = [m.model for m in models.models] if models.models else []
            ollama_status = "connected"
            has_model = settings.ollama_model in model_names or any(
                settings.ollama_model in name for name in model_names
            )
        except Exception:
            ollama_status = "disconnected"

        return {
            "status": "healthy",
            "version": settings.app_version,
            "ai_provider": "ollama",
            "ollama": {
                "status": ollama_status,
                "model": settings.ollama_model,
                "model_available": has_model,
            },
        }

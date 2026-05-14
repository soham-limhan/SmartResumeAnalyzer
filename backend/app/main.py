"""FastAPI application entry point."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import upload, history, export


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # Startup
    os.makedirs(settings.upload_dir, exist_ok=True)
    print(f"[STARTUP] {settings.app_name} v{settings.app_version} starting...")
    print(f"[UPLOAD]  Upload directory: {settings.upload_dir}")
    print(f"[AI]      Ollama model: {settings.ollama_model} @ {settings.ollama_host}")

    # Check Ollama connectivity and warm up the model
    try:
        import ollama
        ollama.list()
        print("[OK]      Ollama connection successful")

        # Warm up the LLM - loads model weights into memory for fast first inference
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
    print("[SHUTDOWN] SmartResume API shutting down...")


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
app.include_router(upload.router, prefix="/api", tags=["Upload & Analysis"])
app.include_router(history.router, prefix="/api", tags=["History"])
app.include_router(export.router, prefix="/api", tags=["Export"])


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint with Ollama status."""
    ollama_status = "unknown"
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
        has_model = False

    return {
        "status": "healthy",
        "version": settings.app_version,
        "ollama": {
            "status": ollama_status,
            "model": settings.ollama_model,
            "model_available": has_model,
        },
    }

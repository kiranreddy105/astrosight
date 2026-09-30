# AstroSight Main Entrypoint
# Re-exports the modular FastAPI application from backend.app.main
from .app.main import app

__all__ = ["app"]

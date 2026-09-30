import os
import sys
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session

from .core.config import settings
from .core.database import engine, Base, SessionLocal
from .core.rate_limiter import limiter
from .core.security import get_password_hash
from .models.user import User
from .models.dataset import DatasetRecord

from .api.v1.auth import router as auth_router
from .api.v1.uploads import router as uploads_router
from .api.v1.analyses import router as analyses_router
from .api.v1.datasets import router as datasets_router
from .api.v1.model import router as model_router
from .api.v1.admin import router as admin_router

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if not present
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # 1. Seed initial Administrator if no users exist
        admin_count = db.query(User).filter(User.role == "admin").count()
        if admin_count == 0:
            initial_admin = User(
                email=settings.INITIAL_ADMIN_EMAIL.lower(),
                hashed_password=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
                full_name="Mission Control Commander",
                role="admin",
                planet_preference="Moon",
                is_active=True,
                is_verified=True
            )
            db.add(initial_admin)
            db.commit()
            print(f"[SYSTEM] Initial administrator created: {settings.INITIAL_ADMIN_EMAIL}")

        # 2. Seed system benchmark dataset record if empty
        sys_ds_count = db.query(DatasetRecord).filter(DatasetRecord.is_system == True).count()
        if sys_ds_count == 0:
            benchmark_ds = DatasetRecord(
                name="LROC & HiRISE Planetary Crater Benchmark (PCB-10K)",
                planet="Moon & Mars",
                description="Standardized 128x128 satellite sub-window corpus derived from Lunar Reconnaissance Orbiter (LROC NAC) and Mars Reconnaissance Orbiter (HiRISE).",
                total_images=10400,
                crater_count=5200,
                non_crater_count=5200,
                is_system=True
            )
            db.add(benchmark_ds)
            db.commit()
    finally:
        db.close()
    yield

# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Planetary Surface Analysis Platform for Lunar and Martian Crater Classification & Spatial Geodesy",
    version="2.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Attach SlowAPI Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Middleware (Explicit origins only; credentials enabled)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

# Security Headers Middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    # Content Security Policy (allows font/style CDNs and data blobs for canvas)
    csp = (
        "default-src 'self'; "
        "img-src 'self' data: blob: http: https:; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "connect-src 'self' http://localhost:5173 http://127.0.0.1:5173 http://localhost:8000 http://127.0.0.1:8000; "
        "frame-ancestors 'none';"
    )
    response.headers["Content-Security-Policy"] = csp
    return response

# Safe Global Exception Handler (Hides internal stack traces in production)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[SECURITY ALERT] Unhandled Server Exception at {request.url.path}: {exc}")
    if settings.DEBUG:
        # In debug mode provide informative error without raw internal memory dump
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Mission Operations Internal Failure: {str(exc)}"}
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal mission control error occurred. The security incident has been logged."}
    )

# Static Samples Mount (Read-only bundled planetary benchmark imagery)
SAMPLES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "samples"))
if os.path.exists(SAMPLES_DIR):
    app.mount("/static/samples", StaticFiles(directory=SAMPLES_DIR), name="samples")

# Frontend Production Build Mount (if built)
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(os.path.join(FRONTEND_DIST, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="frontend-assets")

# Register API v1 Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(uploads_router, prefix=settings.API_V1_STR)
app.include_router(analyses_router, prefix=settings.API_V1_STR)
app.include_router(datasets_router, prefix=settings.API_V1_STR)
app.include_router(model_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)



# Root Route: Serves Frontend or API metadata
@app.get("/")
def read_root():
    index_file = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "platform": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "status": "ONLINE",
        "api_v1_docs": "/docs" if settings.DEBUG else "Protected",
        "api_prefix": settings.API_V1_STR
    }

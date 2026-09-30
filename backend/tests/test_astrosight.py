import os
import math
import pytest
import numpy as np
import cv2
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.config import settings
from backend.app.core.database import Base, get_db
from backend.app.core.security import get_password_hash, verify_password, validate_password_strength
from backend.app.models.user import User
from backend.app.models.analysis import Analysis
from backend.app.main import app
from backend.spatial_analysis import (
    calculate_euclidean_distance,
    pixel_to_real_distance,
    calculate_crater_centroid,
    calculate_crater_density,
    calculate_bearing
)
from backend.ai.crater_cnn import build_crater_model
from backend.ai.preprocessing import ImagePreprocessor

# Test database setup
TEST_DB_URL = "sqlite:///./backend/data/test_astrosight.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    
    # Seed initial test admin
    db = TestingSessionLocal()
    admin_user = User(
        email=settings.INITIAL_ADMIN_EMAIL.lower(),
        hashed_password=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
        full_name="Commander Sri Kiran",
        role="admin",
        planet_preference="Moon",
        is_active=True,
        is_verified=True
    )
    db.add(admin_user)
    db.commit()
    db.close()

    yield
    Base.metadata.drop_all(bind=test_engine)
    test_db_path = "./backend/data/test_astrosight.db"
    if os.path.exists(test_db_path):
        try:
            os.remove(test_db_path)
        except Exception:
            pass

client = TestClient(app)

# --- 1. Security & Authentication Tests ---
def test_password_strength_validation():
    assert validate_password_strength("short") is not None
    assert validate_password_strength("alllowercaseletters") is not None
    assert validate_password_strength("ValidPass123!") is None

def test_bcrypt_hashing():
    raw = "LunarMission2026!"
    hashed = get_password_hash(raw)
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_user_registration_and_login():
    # Register User A
    reg_resp = client.post("/api/v1/auth/register", json={
        "email": "astronaut_a@nasa.gov",
        "password": "SecurePassword123!",
        "full_name": "Neil Armstrong",
        "planet_preference": "Moon"
    })
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "astronaut_a@nasa.gov"

    # Reject duplicate registration
    dup_resp = client.post("/api/v1/auth/register", json={
        "email": "astronaut_a@nasa.gov",
        "password": "SecurePassword123!",
        "full_name": "Duplicate User",
        "planet_preference": "Moon"
    })
    assert dup_resp.status_code == 400

    # Successful login
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "astronaut_a@nasa.gov",
        "password": "SecurePassword123!"
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

    # Failed login
    bad_login = client.post("/api/v1/auth/login", json={
        "email": "astronaut_a@nasa.gov",
        "password": "IncorrectPassword!"
    })
    assert bad_login.status_code == 401

# --- 2. Authorization & Least-Privilege Ownership Tests ---
def test_ownership_enforcement_and_idor_protection():
    # Register User A
    user_a_token = client.post("/api/v1/auth/login", json={
        "email": "astronaut_a@nasa.gov",
        "password": "SecurePassword123!"
    }).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {user_a_token}"}

    # Register User B
    client.post("/api/v1/auth/register", json={
        "email": "astronaut_b@nasa.gov",
        "password": "SecurePassword456!",
        "full_name": "Buzz Aldrin",
        "planet_preference": "Mars"
    })
    user_b_token = client.post("/api/v1/auth/login", json={
        "email": "astronaut_b@nasa.gov",
        "password": "SecurePassword456!"
    }).json()["access_token"]
    headers_b = {"Authorization": f"Bearer {user_b_token}"}

    # User A runs analysis on demo sample
    analysis_resp = client.post("/api/v1/analyses", headers=headers_a, json={
        "file_id": "sample-lunar-apollo11",
        "filename": "lunar_apollo11_tranquillitatis.jpg",
        "planet": "Moon",
        "analysis_mode": "Full Analysis",
        "resolution_m_px": 10.0,
        "apply_clahe": True,
        "apply_denoise": True,
        "confidence_threshold": 0.50
    })
    assert analysis_resp.status_code == 201
    analysis_id = analysis_resp.json()["id"]

    # User A CAN access their own analysis
    get_a = client.get(f"/api/v1/analyses/{analysis_id}", headers=headers_a)
    assert get_a.status_code == 200

    # User B CANNOT access User A's analysis (Enforces 403 Forbidden)
    get_b = client.get(f"/api/v1/analyses/{analysis_id}", headers=headers_b)
    assert get_b.status_code == 403

    # User B CANNOT download User A's report (Enforces 403 Forbidden)
    report_b = client.get(f"/api/v1/reports/{analysis_id}", headers=headers_b)
    assert report_b.status_code == 403

    # User B CANNOT delete User A's analysis (Enforces 403 Forbidden)
    del_b = client.delete(f"/api/v1/analyses/{analysis_id}", headers=headers_b)
    assert del_b.status_code == 403

# --- 3. Spatial Analysis & Geodesic Equations Tests ---
def test_spatial_calculations():
    p1 = {"x": 100.0, "y": 200.0}
    p2 = {"x": 400.0, "y": 600.0}
    # Expected: sqrt((400-100)^2 + (600-200)^2) = sqrt(300^2 + 400^2) = 500.0
    dist_px = calculate_euclidean_distance(p1, p2)
    assert dist_px == 500.0

    # 10 m/px -> 5,000 meters = 5.0 km
    m_data = pixel_to_real_distance(dist_px, 10.0, "kilometers")
    assert m_data["meters"] == 5000.0
    assert m_data["kilometers"] == 5.0

    # Bearing from (100, 200) to (400, 600): dx=300, dy=400 (screen Y is down -> southward)
    bearing = calculate_bearing(p1, p2)
    assert 0.0 <= bearing <= 360.0

    # Density & Centroid
    craters = [
        {"x": 100.0, "y": 200.0, "radius": 20.0},
        {"x": 300.0, "y": 400.0, "radius": 30.0}
    ]
    centroid = calculate_crater_centroid(craters)
    assert centroid["x"] == 200.0
    assert centroid["y"] == 300.0

    # Reject non-finite values & negative scale
    with pytest.raises(ValueError):
        pixel_to_real_distance(100.0, -5.0)
    with pytest.raises(ValueError):
        pixel_to_real_distance(100.0, float("nan"))
    with pytest.raises(ValueError):
        calculate_euclidean_distance({"x": float("inf"), "y": 0.0}, {"x": 0.0, "y": 0.0})

# --- 4. Deep Learning Model & Preprocessing Tests ---
def test_craternet_forward_and_preprocessing():
    model = build_crater_model()
    preprocessor = ImagePreprocessor()
    dummy = np.random.randint(0, 255, (128, 128, 3), dtype=np.uint8)
    tensor = preprocessor.preprocess_patch_for_cnn(dummy)
    assert tensor.shape == (1, 3, 128, 128)
    logits = model(tensor)
    assert logits.shape == (1, 2)

# --- 5. Administrator Telemetry & Personnel Tracking Tests ---
def test_admin_telemetry_and_personnel_tracking():
    # 1. Register a regular scientist researcher
    sci_email = "researcher_telemetry_test@nasa.gov"
    client.post("/api/v1/auth/register", json={
        "email": sci_email,
        "password": "SecurePassword123!",
        "full_name": "Dr. Sarah Stone",
        "planet_preference": "Mars"
    })
    sci_token = client.post("/api/v1/auth/login", json={
        "email": sci_email,
        "password": "SecurePassword123!"
    }).json()["access_token"]
    sci_headers = {"Authorization": f"Bearer {sci_token}"}

    # 2. Scientist should be forbidden from accessing Commander telemetry
    forbidden_resp = client.get("/api/v1/admin/telemetry", headers=sci_headers)
    assert forbidden_resp.status_code == 403

    # 3. Authenticate Commander (admin)
    admin_token = client.post("/api/v1/auth/login", json={
        "email": "VTU30097@astrosight.vel.tech",
        "password": "Srikiran@2006"
    }).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 4. Commander successfully accesses telemetry
    admin_resp = client.get("/api/v1/admin/telemetry", headers=admin_headers)
    assert admin_resp.status_code == 200
    telemetry = admin_resp.json()

    # Validate accounts and daily visitor telemetry
    assert "summary" in telemetry
    assert telemetry["summary"]["total_researchers"] >= 1
    assert telemetry["summary"]["today_visitors_total"] >= 1
    assert len(telemetry["visitor_trend"]) == 14
    assert len(telemetry["researchers"]) >= 1

    # 5. Commander toggles researcher status
    target_scientist = next(r for r in telemetry["researchers"] if r["email"] == sci_email)
    toggle_resp = client.put(
        f"/api/v1/admin/users/{target_scientist['id']}/status",
        headers=admin_headers,
        json={"is_active": False}
    )
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["is_active"] is False


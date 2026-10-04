import os
import uuid
import time
import math
import cv2
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ...core.config import settings
from ...core.database import get_db
from ...core.deps import get_current_user, get_user_or_guest, log_security_event
from ...core.rate_limiter import limiter
from ...models.user import User
from ...models.analysis import Analysis, DetectedCrater, SpatialMeasurement
from ...schemas.analysis import (
    AnalysisCreateRequest,
    AnalysisResponse,
    AnalysisListResponse,
    AnalysisListItem,
    DetectedCraterSchema,
    SpatialMeasurementSchema
)
from ...schemas.spatial import SpatialCalcRequest, SpatialCalcResponse
from backend.ai.model_service import get_model_service
from backend.ai.preprocessing import ImagePreprocessor
from backend.spatial_analysis.spatial_engine import (
    calculate_euclidean_distance,
    pixel_to_real_distance,
    calculate_bearing,
    calculate_crater_centroid,
    calculate_crater_density,
    calculate_pairwise_distances
)
from backend.reports.pdf_generator import generate_pdf_report

router = APIRouter(tags=["Planetary Analyses & Spatial Engine"])

model_service = get_model_service()

@router.post("/analyses", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
def create_analysis(
    request: Request,
    body: AnalysisCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_or_guest)
):
    """
    Executes the modular AstroSight planetary surface intelligence pipeline:
    1. Authorization & Input Validation
    2. Image Preprocessing (CLAHE, Denoise)
    3. CraterNet CNN binary inference
    4. Multi-scale candidate extraction & NMS
    5. Geodesic spatial analysis (Euclidean + scaling)
    6. HUD Reticle Annotation
    7. PDF Dossier Generation
    8. User-isolated DB persistence
    """
    start_time = time.time()
    samples_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "samples"))
    is_sample = body.file_id.startswith("sample-") or os.path.exists(os.path.join(samples_dir, body.filename))
    
    # Resolve image file path safely
    source_img_path = None
    if is_sample:
        # Bundled system benchmark samples
        sample_filename_map = {
            "sample-lunar-apollo11": "lunar_apollo11_tranquillitatis.jpg",
            "sample-lunar-tycho": "lunar_tycho_crater_basin.jpg",
            "sample-mars-jezero": "mars_jezero_crater_delta.jpg",
            "sample-mars-gale": "mars_gale_crater_mount_sharp.jpg"
        }
        fname = sample_filename_map.get(body.file_id, body.filename)
        source_img_path = os.path.join(samples_dir, fname)
    else:
        # Look in user's isolated private upload directory
        user_upload_dir = os.path.join(settings.PRIVATE_STORAGE_DIR, "uploads", str(current_user.id))
        if os.path.exists(user_upload_dir):
            for f in os.listdir(user_upload_dir):
                if f.startswith(f"{body.file_id}_"):
                    source_img_path = os.path.join(user_upload_dir, f)
                    break

    if not source_img_path or not os.path.exists(source_img_path):
        raise HTTPException(status_code=404, detail="Source satellite image not found or unauthorized.")

    img_bgr = cv2.imread(source_img_path)
    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Failed to decode satellite image raster.")

    h, w = img_bgr.shape[:2]

    # Preprocessing
    preprocessor = ImagePreprocessor(apply_clahe=body.apply_clahe, apply_denoise=body.apply_denoise)
    processed_bgr = preprocessor.process_full_image(img_bgr)

    # Global CNN classification
    classification_res = model_service.predict(processed_bgr)

    # Multi-scale Crater Detection
    detection_config = {
        "confidence_threshold": body.confidence_threshold,
        "show_boundaries": body.show_boundaries,
        "show_center_points": body.show_center_points,
        "show_labels": body.show_labels,
        "show_bounding_boxes": body.show_bounding_boxes
    }
    detection_out = model_service.detect_craters(processed_bgr, detection_config)
    craters = detection_out["craters"]
    avg_conf = detection_out["average_confidence"]
    annotated_bgr = detection_out["annotated_image"]

    # Spatial Analysis
    density_info = calculate_crater_density(craters, w, h, body.resolution_m_px)
    centroid = calculate_crater_centroid(craters)
    pairwise_measurements = calculate_pairwise_distances(craters, body.resolution_m_px)

    # Save annotated image into user's private storage
    analysis_id = str(uuid.uuid4())
    user_upload_dir = os.path.join(settings.PRIVATE_STORAGE_DIR, "uploads", str(current_user.id))
    os.makedirs(user_upload_dir, exist_ok=True)
    
    annotated_filename = f"annotated_{analysis_id}.jpg"
    annotated_path = os.path.join(user_upload_dir, annotated_filename)
    cv2.imwrite(annotated_path, annotated_bgr)

    # Generate PDF Report into user's private reports folder
    user_reports_dir = os.path.join(settings.PRIVATE_STORAGE_DIR, "reports", str(current_user.id))
    os.makedirs(user_reports_dir, exist_ok=True)
    
    pdf_filename = f"AstroSight_Report_{analysis_id[:8]}.pdf"
    pdf_path = os.path.join(user_reports_dir, pdf_filename)
    
    report_data = {
        "id": analysis_id,
        "filename": body.filename,
        "planet": body.planet,
        "resolution_m_px": body.resolution_m_px,
        "crater_count": len(craters),
        "average_confidence": avg_conf,
        "processing_time_ms": round((time.time() - start_time) * 1000, 1),
        "crater_density_per_km2": density_info["density_per_km2"],
        "craters": craters,
        "measurements": pairwise_measurements
    }
    try:
        generate_pdf_report(report_data, source_img_path, annotated_path, pdf_path)
    except Exception as e:
        print(f"Warning: PDF generation failed: {e}")

    proc_time_ms = round((time.time() - start_time) * 1000, 1)

    # Save Analysis to DB associated with current_user.id
    analysis_rec = Analysis(
        id=analysis_id,
        user_id=current_user.id,
        filename=body.filename,
        original_filename=os.path.basename(source_img_path),
        planet=body.planet,
        storage_path=source_img_path,
        annotated_path=annotated_path,
        report_path=pdf_path if os.path.exists(pdf_path) else None,
        crater_count=len(craters),
        average_confidence=avg_conf,
        resolution_m_px=body.resolution_m_px,
        processing_time_ms=proc_time_ms,
        analysis_mode=body.analysis_mode,
        classification_result=classification_res["prediction"],
        classification_confidence=classification_res["confidence"],
        crater_density_per_km2=density_info["density_per_km2"],
        centroid_x=centroid["x"] if centroid else None,
        centroid_y=centroid["y"] if centroid else None,
        is_demo=is_sample
    )
    db.add(analysis_rec)
    db.flush()

    # Save craters
    for c in craters:
        db.add(DetectedCrater(
            analysis_id=analysis_id,
            crater_index=c.get("index", 0),
            x=c["x"],
            y=c["y"],
            radius=c["radius"],
            confidence=c["confidence"],
            cnn_prob=c.get("cnn_prob"),
            morph_score=c.get("morph_score")
        ))

    # Save top 25 measurements
    for m in pairwise_measurements[:25]:
        db.add(SpatialMeasurement(
            analysis_id=analysis_id,
            crater_a_index=m["crater_a_index"],
            crater_b_index=m["crater_b_index"],
            crater_a_x=m["crater_a_x"],
            crater_a_y=m["crater_a_y"],
            crater_b_x=m["crater_b_x"],
            crater_b_y=m["crater_b_y"],
            pixel_distance=m["pixel_distance"],
            real_distance_m=m["real_distance_m"],
            real_distance_km=m["real_distance_km"],
            real_distance_mi=m["real_distance_mi"],
            bearing_deg=m.get("bearing_deg")
        ))

    db.commit()
    db.refresh(analysis_rec)

    log_security_event(db, "ANALYSIS_RUN", current_user.id, request, {
        "analysis_id": analysis_id,
        "planet": body.planet,
        "crater_count": len(craters)
    })

    # Prepare response URLs
    image_url = f"{settings.API_V1_STR}/files/{body.file_id}" if not is_sample else f"/static/samples/{os.path.basename(source_img_path)}"
    annotated_url = f"{settings.API_V1_STR}/files/{analysis_id}"
    report_url = f"{settings.API_V1_STR}/reports/{analysis_id}"

    return AnalysisResponse(
        id=analysis_rec.id,
        filename=analysis_rec.filename,
        planet=analysis_rec.planet,
        analysis_mode=analysis_rec.analysis_mode,
        resolution_m_px=analysis_rec.resolution_m_px,
        processing_time_ms=analysis_rec.processing_time_ms,
        crater_count=analysis_rec.crater_count,
        average_confidence=analysis_rec.average_confidence,
        classification_result=analysis_rec.classification_result,
        classification_confidence=analysis_rec.classification_confidence,
        crater_density_per_km2=analysis_rec.crater_density_per_km2,
        centroid_x=analysis_rec.centroid_x,
        centroid_y=analysis_rec.centroid_y,
        is_demo=analysis_rec.is_demo,
        created_at=analysis_rec.created_at,
        craters=[DetectedCraterSchema.model_validate(c) for c in craters],
        measurements=[SpatialMeasurementSchema.model_validate(m) for m in pairwise_measurements[:25]],
        image_url=image_url,
        annotated_image_url=annotated_url,
        report_download_url=report_url
    )

@router.get("/analyses", response_model=AnalysisListResponse)
def get_analyses(
    search: Optional[str] = Query(None),
    planet: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves paginated analysis history strictly isolated to current user.
    Administrators can view all.
    """
    query = db.query(Analysis)
    if current_user.role != "admin":
        query = query.filter(Analysis.user_id == current_user.id)

    if search:
        query = query.filter(Analysis.filename.ilike(f"%{search.strip()}%"))
    if planet and planet.lower() != "all":
        query = query.filter(Analysis.planet.ilike(planet.strip()))

    total = query.count()
    items = query.order_by(desc(Analysis.created_at)).offset((page - 1) * size).limit(size).all()
    total_pages = math.ceil(total / size) if total > 0 else 1

    return AnalysisListResponse(
        items=[AnalysisListItem.model_validate(it) for it in items],
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )

@router.get("/analyses/{analysis_id}", response_model=AnalysisResponse)
def get_analysis_detail(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_or_guest)
):
    """Returns single analysis record with ownership enforcement."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    if analysis.user_id != current_user.id and current_user.role != "admin":
        if not (analysis.owner and analysis.owner.role == "guest"):
            raise HTTPException(status_code=403, detail="Unauthorized access to this analysis record.")

    image_url = f"{settings.API_V1_STR}/files/{analysis.id}" if not analysis.is_demo else f"/static/samples/{analysis.original_filename}"
    annotated_url = f"{settings.API_V1_STR}/files/{analysis.id}"
    report_url = f"{settings.API_V1_STR}/reports/{analysis.id}"

    return AnalysisResponse(
        id=analysis.id,
        filename=analysis.filename,
        planet=analysis.planet,
        analysis_mode=analysis.analysis_mode,
        resolution_m_px=analysis.resolution_m_px,
        processing_time_ms=analysis.processing_time_ms,
        crater_count=analysis.crater_count,
        average_confidence=analysis.average_confidence,
        classification_result=analysis.classification_result,
        classification_confidence=analysis.classification_confidence,
        crater_density_per_km2=analysis.crater_density_per_km2,
        centroid_x=analysis.centroid_x,
        centroid_y=analysis.centroid_y,
        is_demo=analysis.is_demo,
        created_at=analysis.created_at,
        craters=[DetectedCraterSchema.model_validate(c) for c in analysis.craters],
        measurements=[SpatialMeasurementSchema.model_validate(m) for m in analysis.measurements],
        image_url=image_url,
        annotated_image_url=annotated_url,
        report_download_url=report_url
    )

@router.delete("/analyses/{analysis_id}")
def delete_analysis(
    analysis_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes analysis and purges associated private files with ownership check."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    if analysis.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized to delete this record.")

    # Remove files safely
    for path in [analysis.annotated_path, analysis.report_path]:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass

    db.delete(analysis)
    db.commit()
    log_security_event(db, "DELETE_ANALYSIS", current_user.id, request, {"analysis_id": analysis_id})
    return {"success": True, "message": f"Analysis {analysis_id[:8]} deleted successfully."}

@router.post("/analyses/{analysis_id}/spatial-analysis", response_model=SpatialCalcResponse)
def calculate_spatial_pair(
    analysis_id: str,
    body: SpatialCalcRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_or_guest)
):
    """Calculates Euclidean pixel distance and ground metric distance for selected crater pair."""
    # Check ownership
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    if analysis.user_id != current_user.id and current_user.role != "admin":
        if not (analysis.owner and analysis.owner.role == "guest"):
            raise HTTPException(status_code=403, detail="Unauthorized access to this analysis.")

    # Strict non-finite scale rejection
    if not math.isfinite(body.resolution_m_px) or body.resolution_m_px <= 0:
        raise HTTPException(status_code=400, detail="Invalid non-finite or non-positive resolution scale.")

    p_a = {"x": body.point_a.x, "y": body.point_a.y}
    p_b = {"x": body.point_b.x, "y": body.point_b.y}

    px_dist = calculate_euclidean_distance(p_a, p_b)
    real_dist = pixel_to_real_distance(px_dist, body.resolution_m_px, body.unit)
    bearing = calculate_bearing(p_a, p_b)

    dx = round(body.point_b.x - body.point_a.x, 2)
    dy = round(body.point_b.y - body.point_a.y, 2)

    return SpatialCalcResponse(
        pixel_distance=round(px_dist, 2),
        delta_x=dx,
        delta_y=dy,
        meters_per_pixel=body.resolution_m_px,
        real_distance_m=real_dist["meters"],
        real_distance_km=real_dist["kilometers"],
        real_distance_mi=real_dist["miles"],
        formatted_distance=f"{real_dist['value']:.2f} {real_dist['unit']}",
        bearing_deg=bearing,
        formula="d = sqrt((x2 - x1)^2 + (y2 - y1)^2) * scale",
        unit=body.unit
    )

@router.get("/reports/{analysis_id}")
def download_pdf_report(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_user_or_guest)
):
    """
    Authorized PDF report streaming:
    Checks ownership, ensures user only downloads reports they own.
    """
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Report not found.")

    if analysis.user_id != current_user.id and current_user.role != "admin":
        if not (analysis.owner and analysis.owner.role == "guest"):
            raise HTTPException(status_code=403, detail="Unauthorized access to this report.")

    user_reports_dir = os.path.join(settings.PRIVATE_STORAGE_DIR, "reports", str(analysis.user_id))
    pdf_filename = f"AstroSight_Report_{analysis_id[:8]}.pdf"
    pdf_path = os.path.join(user_reports_dir, pdf_filename)

    if not os.path.exists(pdf_path):
        # Regenerate report if missing
        report_data = {
            "id": analysis.id,
            "filename": analysis.filename,
            "planet": analysis.planet,
            "resolution_m_px": analysis.resolution_m_px,
            "crater_count": analysis.crater_count,
            "average_confidence": analysis.average_confidence,
            "processing_time_ms": analysis.processing_time_ms,
            "crater_density_per_km2": analysis.crater_density_per_km2 or 0.0,
            "craters": [{"index": c.crater_index, "x": c.x, "y": c.y, "radius": c.radius, "confidence": c.confidence} for c in analysis.craters],
            "measurements": [{"crater_a_index": m.crater_a_index, "crater_b_index": m.crater_b_index, "crater_a_x": m.crater_a_x, "crater_a_y": m.crater_a_y, "crater_b_x": m.crater_b_x, "crater_b_y": m.crater_b_y, "pixel_distance": m.pixel_distance, "real_distance_m": m.real_distance_m, "real_distance_km": m.real_distance_km, "bearing_deg": m.bearing_deg} for m in analysis.measurements]
        }
        os.makedirs(user_reports_dir, exist_ok=True)
        generate_pdf_report(report_data, analysis.storage_path, analysis.annotated_path, pdf_path)

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=pdf_filename,
        headers={"X-Content-Type-Options": "nosniff"}
    )

import math
from typing import List, Dict, Any, Tuple, Optional

def validate_finite_coordinate(val: float, name: str) -> float:
    """Ensures coordinate values are finite real numbers."""
    if not math.isfinite(val):
        raise ValueError(f"Coordinate '{name}' must be a finite real number, got {val}")
    return float(val)

def calculate_euclidean_distance(point_a: Dict[str, float], point_b: Dict[str, float]) -> float:
    """
    Calculates 2D Euclidean Distance between two crater coordinates in pixel space:
    d = sqrt((x2 - x1)^2 + (y2 - y1)^2)
    """
    x1 = validate_finite_coordinate(point_a["x"], "point_a.x")
    y1 = validate_finite_coordinate(point_a["y"], "point_a.y")
    x2 = validate_finite_coordinate(point_b["x"], "point_b.x")
    y2 = validate_finite_coordinate(point_b["y"], "point_b.y")
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

def pixel_to_real_distance(
    pixel_distance: float,
    meters_per_pixel: float,
    target_unit: str = "kilometers"
) -> Dict[str, Any]:
    """
    Converts pixel space distance into real-world planetary metric units:
    Real Distance = Pixel Distance * Resolution (meters/pixel)
    Validates that meters_per_pixel is strictly positive and finite.
    """
    if not math.isfinite(pixel_distance) or pixel_distance < 0:
        raise ValueError("Pixel distance must be non-negative and finite.")
    if not math.isfinite(meters_per_pixel) or meters_per_pixel <= 0:
        raise ValueError("Meters per pixel calibration must be strictly positive and finite.")

    meters = pixel_distance * meters_per_pixel
    kilometers = meters / 1000.0
    miles = kilometers * 0.621371192

    val = kilometers
    unit_str = target_unit.lower()
    if unit_str in ("meters", "m"):
        val = meters
    elif unit_str in ("miles", "mi"):
        val = miles

    return {
        "meters": round(meters, 2),
        "kilometers": round(kilometers, 3),
        "miles": round(miles, 3),
        "formatted_meters": f"{meters:,.1f} m",
        "formatted_km": f"{kilometers:,.2f} km",
        "formatted_mi": f"{miles:,.2f} mi",
        "value": round(val, 3),
        "unit": target_unit
    }

def calculate_bearing(point_a: Dict[str, float], point_b: Dict[str, float]) -> float:
    """
    Calculates navigational azimuth in degrees [0, 360) from crater A to B.
    0 deg = North (Up), 90 deg = East (Right), 180 deg = South (Down), 270 deg = West (Left).
    """
    x1 = validate_finite_coordinate(point_a["x"], "point_a.x")
    y1 = validate_finite_coordinate(point_a["y"], "point_a.y")
    x2 = validate_finite_coordinate(point_b["x"], "point_b.x")
    y2 = validate_finite_coordinate(point_b["y"], "point_b.y")

    dx = x2 - x1
    dy = y2 - y1  # Inverted Y axis for computer vision / raster coordinate system
    angle_rad = math.atan2(dx, -dy)
    deg = math.degrees(angle_rad)
    return round((deg + 360) % 360, 1)

def calculate_crater_centroid(craters: List[Dict[str, Any]]) -> Optional[Dict[str, float]]:
    """
    Calculates spatial geometric center (mean coordinates) of all detected craters:
    (X_bar, Y_bar) = (sum(xi)/N, sum(yi)/N)
    """
    if not craters:
        return None
    sum_x = sum(validate_finite_coordinate(c["x"], f"crater_{idx}.x") for idx, c in enumerate(craters))
    sum_y = sum(validate_finite_coordinate(c["y"], f"crater_{idx}.y") for idx, c in enumerate(craters))
    n = len(craters)
    return {
        "x": round(sum_x / n, 2),
        "y": round(sum_y / n, 2)
    }

def calculate_crater_density(
    craters: List[Dict[str, Any]],
    image_width_px: int,
    image_height_px: int,
    meters_per_pixel: float
) -> Dict[str, Any]:
    """
    Calculates crater spatial density per square kilometer:
    Area = (W * res) * (H * res) in km^2
    Density = N_craters / Area_km2
    """
    if not math.isfinite(meters_per_pixel) or meters_per_pixel <= 0:
        raise ValueError("Resolution must be strictly positive and finite.")
    if image_width_px <= 0 or image_height_px <= 0:
        raise ValueError("Image dimensions must be positive integers.")

    width_km = (image_width_px * meters_per_pixel) / 1000.0
    height_km = (image_height_px * meters_per_pixel) / 1000.0
    area_km2 = max(0.00001, width_km * height_km)
    
    n_craters = len(craters)
    density = n_craters / area_km2
    
    return {
        "crater_count": n_craters,
        "width_km": round(width_km, 2),
        "height_km": round(height_km, 2),
        "area_km2": round(area_km2, 2),
        "density_per_km2": round(density, 4),
        "formatted_density": f"{density:.3f} craters/km²"
    }

def calculate_pairwise_distances(
    craters: List[Dict[str, Any]],
    meters_per_pixel: float
) -> List[Dict[str, Any]]:
    """
    Computes pairwise spatial distances between all detected craters.
    """
    measurements = []
    n = len(craters)
    
    for i in range(n):
        for j in range(i + 1, n):
            c_a = craters[i]
            c_b = craters[j]
            
            px_dist = calculate_euclidean_distance(c_a, c_b)
            real_dist = pixel_to_real_distance(px_dist, meters_per_pixel)
            bearing = calculate_bearing(c_a, c_b)
            
            idx_a = c_a.get("index", i + 1)
            idx_b = c_b.get("index", j + 1)
            
            measurements.append({
                "crater_a_index": idx_a,
                "crater_b_index": idx_b,
                "crater_a_name": c_a.get("name", f"Crater #{idx_a:02d}"),
                "crater_b_name": c_b.get("name", f"Crater #{idx_b:02d}"),
                "crater_a_x": c_a["x"],
                "crater_a_y": c_a["y"],
                "crater_b_x": c_b["x"],
                "crater_b_y": c_b["y"],
                "pixel_distance": round(px_dist, 2),
                "real_distance_m": real_dist["meters"],
                "real_distance_km": real_dist["kilometers"],
                "real_distance_mi": real_dist["miles"],
                "formatted_km": real_dist["formatted_km"],
                "formatted_m": real_dist["formatted_meters"],
                "bearing_deg": bearing
            })
            
    measurements = sorted(measurements, key=lambda m: m["pixel_distance"])
    return measurements

def calculate_nearest_crater(
    target_crater_index: int,
    craters: List[Dict[str, Any]],
    meters_per_pixel: float
) -> Optional[Dict[str, Any]]:
    """Finds closest neighboring crater to a selected target crater."""
    target = next((c for c in craters if c.get("index") == target_crater_index), None)
    if not target or len(craters) < 2:
        return None
        
    nearest = None
    min_dist = float("inf")
    
    for c in craters:
        if c.get("index") == target_crater_index:
            continue
        dist = calculate_euclidean_distance(target, c)
        if dist < min_dist:
            min_dist = dist
            nearest = c
            
    if not nearest:
        return None
        
    real_dist = pixel_to_real_distance(min_dist, meters_per_pixel)
    bearing = calculate_bearing(target, nearest)
    
    return {
        "target_index": target_crater_index,
        "nearest_index": nearest.get("index"),
        "nearest_name": nearest.get("name"),
        "pixel_distance": round(min_dist, 2),
        "real_distance_km": real_dist["kilometers"],
        "real_distance_m": real_dist["meters"],
        "bearing_deg": bearing
    }

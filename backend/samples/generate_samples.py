import os
import cv2
import numpy as np

def generate_planetary_surface(
    width: int = 800,
    height: int = 800,
    planet: str = "moon",
    seed: int = 42,
    craters_spec = None
) -> np.ndarray:
    """
    Synthesizes a realistic high-resolution planetary satellite surface image with
    impact craters, illuminated rims, shadow depths, ejecta patterns, and regolith noise.
    """
    np.random.seed(seed)
    
    # 1. Base terrain regolith texture
    # Multi-octave Perlin-like fractal terrain
    terrain = np.zeros((height, width), dtype=np.float32)
    for scale in [200, 100, 50, 25, 12]:
        rand_grid = np.random.uniform(0, 1, (height // scale + 2, width // scale + 2)).astype(np.float32)
        resized = cv2.resize(rand_grid, (width, height), interpolation=cv2.INTER_CUBIC)
        terrain += resized * (scale / 200.0)
        
    # Normalize base terrain
    terrain = (terrain - terrain.min()) / (terrain.max() - terrain.min())
    
    if planet.lower() == "mars":
        base_gray = (terrain * 70 + 90).astype(np.float32)
    else:
        base_gray = (terrain * 60 + 110).astype(np.float32)

    # Oblique solar illumination direction vector (default: sunlight from upper-left, e.g. dx=0.7, dy=0.7)
    light_dx, light_dy = -0.65, -0.75
    
    # Default craters if none provided
    if craters_spec is None:
        if planet.lower() == "moon":
            craters_spec = [
                {"x": 230, "y": 240, "r": 65, "depth": 1.2, "has_peak": True},
                {"x": 580, "y": 320, "r": 90, "depth": 1.4, "has_peak": True},
                {"x": 420, "y": 570, "r": 50, "depth": 1.0, "has_peak": False},
                {"x": 190, "y": 620, "r": 38, "depth": 0.9, "has_peak": False},
                {"x": 680, "y": 640, "r": 32, "depth": 0.8, "has_peak": False},
                {"x": 360, "y": 140, "r": 28, "depth": 0.8, "has_peak": False},
                {"x": 500, "y": 180, "r": 22, "depth": 0.7, "has_peak": False},
            ]
        else: # Mars
            craters_spec = [
                {"x": 310, "y": 280, "r": 78, "depth": 1.3, "has_peak": True},
                {"x": 600, "y": 480, "r": 62, "depth": 1.1, "has_peak": False},
                {"x": 220, "y": 530, "r": 48, "depth": 0.9, "has_peak": False},
                {"x": 540, "y": 190, "r": 36, "depth": 0.8, "has_peak": False},
                {"x": 420, "y": 410, "r": 26, "depth": 0.7, "has_peak": False},
                {"x": 690, "y": 290, "r": 22, "depth": 0.6, "has_peak": False},
            ]

    surface = base_gray.copy()
    
    # Render craters into topography & lighting
    y_coords, x_coords = np.ogrid[:height, :width]
    
    for c in craters_spec:
        cx, cy, r = c["x"], c["y"], c["r"]
        depth = c.get("depth", 1.0)
        has_peak = c.get("has_peak", False)
        
        dist = np.sqrt((x_coords - cx)**2 + (y_coords - cy)**2)
        norm_dist = dist / float(r)
        
        # Bowl depression & raised rim mask
        rim_width = 0.28
        in_bowl = norm_dist < 1.0
        on_rim = (norm_dist >= 1.0 - rim_width) & (norm_dist <= 1.0 + rim_width)
        
        # Shadow/Light gradient across crater based on angle to sun
        angle_to_sun = (x_coords - cx) * light_dx + (y_coords - cy) * light_dy
        norm_angle = angle_to_sun / (dist + 1e-4)
        
        # Shadow in bowl on sunlit side
        shadow_intensity = np.clip(norm_angle * 1.8, -1.0, 1.0)
        
        # Bowl depression shading: dark on shadow side, floor texture
        bowl_shading = np.zeros_like(surface)
        bowl_shading[in_bowl] = (1.0 - norm_dist[in_bowl]**2) * depth * 65.0 * shadow_intensity[in_bowl]
        
        # Raised rim: bright on illuminated edge, shadow behind opposite rim
        rim_shading = np.zeros_like(surface)
        rim_profile = np.cos(np.pi * (norm_dist - 1.0) / (rim_width * 2))
        rim_shading[on_rim] = rim_profile[on_rim] * depth * 55.0 * (-shadow_intensity[on_rim])
        
        surface -= bowl_shading
        surface += rim_shading
        
        # Central peak if requested
        if has_peak:
            peak_mask = norm_dist < 0.22
            peak_profile = np.cos(np.pi * norm_dist / 0.44)
            peak_shading = np.zeros_like(surface)
            peak_shading[peak_mask] = peak_profile[peak_mask] * 40.0 * (-shadow_intensity[peak_mask])
            surface += peak_shading
            
        # Radial ejecta rays
        n_rays = np.random.randint(6, 12)
        for _ in range(n_rays):
            ray_angle = np.random.uniform(0, 2 * np.pi)
            ray_length = r * np.random.uniform(1.8, 3.2)
            ray_width = np.random.uniform(2, 5)
            
            rx = cx + ray_length * np.cos(ray_angle)
            ry = cy + ray_length * np.sin(ray_angle)
            
            line_mask = np.zeros((height, width), dtype=np.uint8)
            cv2.line(line_mask, (cx, cy), (int(rx), int(ry)), 255, int(ray_width))
            blurred_ray = cv2.GaussianBlur(line_mask.astype(np.float32), (7, 7), 2) / 255.0
            
            ray_dist_fade = np.clip(1.0 - (dist / ray_length), 0, 1)
            surface += blurred_ray * ray_dist_fade * 14.0

    # Add realistic sensor shot noise & micrometeorite speckles
    sensor_noise = np.random.normal(0, 3.5, (height, width)).astype(np.float32)
    surface = np.clip(surface + sensor_noise, 15, 245).astype(np.uint8)
    
    # Colorize for planet
    if planet.lower() == "mars":
        # Martian rusty ferric oxide palette (R > G > B)
        b_ch = (surface * 0.72).astype(np.uint8)
        g_ch = (surface * 0.88).astype(np.uint8)
        r_ch = np.clip(surface * 1.18, 0, 255).astype(np.uint8)
        bgr = cv2.merge([b_ch, g_ch, r_ch])
    else:
        # Lunar anorthosite / basalt regolith (monochrome silvery gray)
        bgr = cv2.merge([surface, surface, surface])
        
    return bgr

def create_all_samples(output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Apollo 11 Mare Tranquillitatis
    img1 = generate_planetary_surface(
        width=850, height=850, planet="moon", seed=101,
        craters_spec=[
            {"x": 280, "y": 300, "r": 72, "depth": 1.3, "has_peak": True},
            {"x": 610, "y": 240, "r": 54, "depth": 1.1, "has_peak": False},
            {"x": 480, "y": 590, "r": 68, "depth": 1.2, "has_peak": True},
            {"x": 190, "y": 660, "r": 42, "depth": 0.9, "has_peak": False},
            {"x": 720, "y": 620, "r": 35, "depth": 0.8, "has_peak": False},
            {"x": 380, "y": 140, "r": 30, "depth": 0.7, "has_peak": False},
        ]
    )
    cv2.imwrite(os.path.join(output_dir, "lunar_apollo11_tranquillitatis.jpg"), img1)

    # 2. Tycho Impact Basin Complex
    img2 = generate_planetary_surface(
        width=850, height=850, planet="moon", seed=202,
        craters_spec=[
            {"x": 425, "y": 425, "r": 115, "depth": 1.6, "has_peak": True},
            {"x": 170, "y": 210, "r": 48, "depth": 1.0, "has_peak": False},
            {"x": 690, "y": 220, "r": 52, "depth": 1.1, "has_peak": False},
            {"x": 210, "y": 680, "r": 40, "depth": 0.9, "has_peak": False},
            {"x": 670, "y": 660, "r": 45, "depth": 1.0, "has_peak": False},
            {"x": 580, "y": 160, "r": 28, "depth": 0.7, "has_peak": False},
            {"x": 290, "y": 120, "r": 25, "depth": 0.7, "has_peak": False},
        ]
    )
    cv2.imwrite(os.path.join(output_dir, "lunar_tycho_crater_basin.jpg"), img2)

    # 3. Mars Jezero Crater Delta
    img3 = generate_planetary_surface(
        width=850, height=850, planet="mars", seed=303,
        craters_spec=[
            {"x": 340, "y": 320, "r": 85, "depth": 1.4, "has_peak": True},
            {"x": 640, "y": 280, "r": 50, "depth": 1.0, "has_peak": False},
            {"x": 520, "y": 620, "r": 64, "depth": 1.2, "has_peak": False},
            {"x": 210, "y": 610, "r": 38, "depth": 0.8, "has_peak": False},
            {"x": 710, "y": 570, "r": 32, "depth": 0.7, "has_peak": False},
            {"x": 380, "y": 150, "r": 27, "depth": 0.7, "has_peak": False},
        ]
    )
    cv2.imwrite(os.path.join(output_dir, "mars_jezero_crater_delta.jpg"), img3)

    # 4. Mars Gale Crater & Mount Sharp
    img4 = generate_planetary_surface(
        width=850, height=850, planet="mars", seed=404,
        craters_spec=[
            {"x": 425, "y": 425, "r": 120, "depth": 1.5, "has_peak": True},
            {"x": 190, "y": 240, "r": 45, "depth": 0.9, "has_peak": False},
            {"x": 680, "y": 250, "r": 40, "depth": 0.9, "has_peak": False},
            {"x": 240, "y": 670, "r": 52, "depth": 1.1, "has_peak": False},
            {"x": 650, "y": 640, "r": 38, "depth": 0.8, "has_peak": False},
            {"x": 560, "y": 130, "r": 26, "depth": 0.7, "has_peak": False},
        ]
    )
    cv2.imwrite(os.path.join(output_dir, "mars_gale_crater_mount_sharp.jpg"), img4)
    print("Sample planetary images generated successfully.")

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__))
    create_all_samples(out_dir)

import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, Sparkles } from 'lucide-react';

export interface GeologicalPOI {
  id: string;
  name: string;
  lat: string;
  lon: string;
  type: string;
  diameter: string;
  desc: string;
  latDeg: number;
  lonDeg: number;
}

interface CelestialGlobe3DProps {
  selectedPlanet: string;
  onSelectPOI?: (poi: GeologicalPOI) => void;
  selectedPOI?: GeologicalPOI | null;
  interactive?: boolean;
  size?: number;
}

export const LUNAR_POIS: GeologicalPOI[] = [
  {
    id: 'l-poi-1',
    name: 'Mare Tranquillitatis',
    lat: '0.67°N',
    lon: '23.47°E',
    type: 'Basaltic Lava Mare (Apollo 11 Landing Site)',
    diameter: '873 km basin',
    desc: 'High-titanium basalt plain deposited during the Imbrian epoch. Exceptional photometric reference for crater density benchmarking and CNN calibration.',
    latDeg: 0.67,
    lonDeg: 23.47
  },
  {
    id: 'l-poi-2',
    name: 'Tycho Crater Complex',
    lat: '43.31°S',
    lon: '11.36°W',
    type: 'Prominent Rayed Impact Basin',
    diameter: '86.2 km diameter (4.8 km deep)',
    desc: 'Prominent Copernican-era impact feature with 1,500 km ray systems radiating across the nearside lunar highlands.',
    latDeg: -43.31,
    lonDeg: -11.36
  },
  {
    id: 'l-poi-3',
    name: 'Copernicus Crater',
    lat: '9.62°N',
    lon: '20.08°W',
    type: 'Terraced Rim Basin with Central Peaks',
    diameter: '93.0 km diameter (3.8 km deep)',
    desc: 'Deep impact crater showcasing multiple central peaks and slumped inner terraces in eastern Oceanus Procellarum.',
    latDeg: 9.62,
    lonDeg: -20.08
  },
  {
    id: 'l-poi-4',
    name: 'Shackleton Crater',
    lat: '89.90°S',
    lon: '0.00°E',
    type: 'Permanently Shadowed Polar Basin',
    diameter: '21.0 km diameter (4.2 km deep)',
    desc: 'Ultra-cold lunar South Pole crater harboring confirmed water ice deposits in eternal shadow zones.',
    latDeg: -89.90,
    lonDeg: 0.00
  }
];

export const MARTIAN_POIS: GeologicalPOI[] = [
  {
    id: 'm-poi-1',
    name: 'Jezero Crater Delta',
    lat: '18.38°N',
    lon: '77.58°E',
    type: 'Ancient Fluvial Paleolake Basin',
    diameter: '49.0 km diameter',
    desc: 'Site of NASA Perseverance rover exploring clay sediment deposits from paleolake water flows and biosignature preservation zones.',
    latDeg: 18.38,
    lonDeg: 77.58
  },
  {
    id: 'm-poi-2',
    name: 'Olympus Mons Caldera',
    lat: '18.65°N',
    lon: '133.80°W',
    type: 'Massive Shield Volcano Caldera',
    diameter: '624.0 km diameter (21.9 km height)',
    desc: 'Solar system’s largest shield volcano with complex collapsed summit calderas and basal cliffs up to 8 km high.',
    latDeg: 18.65,
    lonDeg: -133.80
  },
  {
    id: 'm-poi-3',
    name: 'Gale Crater & Mount Sharp',
    lat: '5.40°S',
    lon: '137.80°E',
    type: 'Sedimentary Central Mound Crater',
    diameter: '154.0 km diameter',
    desc: 'Deep impact crater harboring Mount Sharp (Aeolis Mons), studied for layered sulfate deposits and past aqueous habitability.',
    latDeg: -5.40,
    lonDeg: 137.80
  }
];

export const CelestialGlobe3D: React.FC<CelestialGlobe3DProps> = ({
  selectedPlanet,
  onSelectPOI,
  selectedPOI,
  interactive = true,
  size = 500
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastMouseX, setLastMouseX] = useState<number>(0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showTerminator, setShowTerminator] = useState<boolean>(true);
  const [hoveredPOI, setHoveredPOI] = useState<GeologicalPOI | null>(null);

  const pois = selectedPlanet === 'Mars' ? MARTIAN_POIS : LUNAR_POIS;

  // Auto-rotation & Render Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      if (!isDragging) {
        setRotation((prev) => prev + 0.0035);
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = (w * 0.38) * zoom;

      ctx.clearRect(0, 0, w, h);

      // 1. Atmospheric Limb Glow
      ctx.save();
      const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.18);
      if (selectedPlanet === 'Mars') {
        glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
        glowGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.18)');
        glowGrad.addColorStop(1, 'transparent');
      } else {
        glowGrad.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
        glowGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.15)');
        glowGrad.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.18, 0, Math.PI * 2);
      ctx.fill();

      // 2. Planet Sphere Clip
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // Base spherical texture lighting gradient
      const baseGrad = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.35,
        radius * 0.1,
        cx,
        cy,
        radius
      );
      if (selectedPlanet === 'Mars') {
        baseGrad.addColorStop(0, '#f97316');
        baseGrad.addColorStop(0.5, '#c2410c');
        baseGrad.addColorStop(1, '#431407');
      } else {
        baseGrad.addColorStop(0, '#e2e8f0');
        baseGrad.addColorStop(0.5, '#64748b');
        baseGrad.addColorStop(1, '#0f172a');
      }
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, w, h);

      // 3. Procedural Geological Impact Basins & Maria
      const numCraters = selectedPlanet === 'Mars' ? 14 : 20;
      for (let i = 0; i < numCraters; i++) {
        const angle = (i / numCraters) * Math.PI * 2 + rotation;
        const sphereX = Math.cos(angle);
        const sphereZ = Math.sin(angle);

        if (sphereZ > -0.2) {
          const px = cx + sphereX * (radius * 0.85);
          const py = cy + Math.sin(i * 2.3) * (radius * 0.65);
          const featR = (10 + (i % 5) * 8) * Math.max(0.2, sphereZ) * zoom;

          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, featR, 0, Math.PI * 2);
          if (selectedPlanet === 'Mars') {
            ctx.fillStyle = i % 3 === 0 ? 'rgba(124, 45, 18, 0.55)' : 'rgba(67, 20, 7, 0.45)';
          } else {
            ctx.fillStyle = i % 3 === 0 ? 'rgba(30, 41, 59, 0.65)' : 'rgba(15, 23, 42, 0.5)';
          }
          ctx.fill();

          ctx.strokeStyle = selectedPlanet === 'Mars' ? 'rgba(254, 215, 170, 0.4)' : 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }
      }

      // 4. Latitude & Longitude Graticule Grid Lines
      if (showGrid) {
        ctx.strokeStyle = selectedPlanet === 'Mars' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 240, 255, 0.18)';
        ctx.lineWidth = 1;

        // Parallels
        for (let lat = -60; lat <= 60; lat += 30) {
          const latY = cy + (lat / 90) * radius;
          const latW = Math.sqrt(Math.max(0, radius * radius - (latY - cy) * (latY - cy)));
          ctx.beginPath();
          ctx.ellipse(cx, latY, latW, latW * 0.22, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 5. Solar Terminator Nightside Shadow
      if (showTerminator) {
        const shadowGrad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        shadowGrad.addColorStop(0.55, 'rgba(4, 7, 17, 0.25)');
        shadowGrad.addColorStop(1, 'rgba(2, 4, 10, 0.88)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // 6. Interactive Geological Hotspot Markers
      pois.forEach((poi, idx) => {
        const poiAngle = ((poi.lonDeg * Math.PI) / 180) + rotation;
        const sphereX = Math.cos(poiAngle);
        const sphereZ = Math.sin(poiAngle);

        if (sphereZ > 0.05) {
          const latRad = (poi.latDeg * Math.PI) / 180;
          const px = cx + sphereX * (radius * 0.82) * Math.cos(latRad);
          const py = cy - Math.sin(latRad) * radius * 0.9;
          const isSelected = selectedPOI?.id === poi.id;

          ctx.save();
          // Halo Pulse
          ctx.beginPath();
          ctx.arc(px, py, isSelected ? 12 : 7, 0, Math.PI * 2);
          ctx.strokeStyle = isSelected ? '#ffaa00' : (selectedPlanet === 'Mars' ? '#f59e0b' : '#00f0ff');
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
          ctx.stroke();

          ctx.fillStyle = isSelected ? 'rgba(255, 170, 0, 0.35)' : 'rgba(0, 240, 255, 0.25)';
          ctx.fill();

          // Center Reticle
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // POI Label Tag
          ctx.font = 'bold 10px monospace';
          const labelW = ctx.measureText(poi.name).width;
          ctx.fillStyle = 'rgba(5, 8, 17, 0.85)';
          ctx.fillRect(px + 10, py - 9, labelW + 8, 18);
          ctx.strokeStyle = isSelected ? '#ffaa00' : 'rgba(0, 240, 255, 0.4)';
          ctx.strokeRect(px + 10, py - 9, labelW + 8, 18);

          ctx.fillStyle = isSelected ? '#ffaa00' : '#ffffff';
          ctx.fillText(poi.name, px + 14, py + 4);
          ctx.restore();
        }
      });

      ctx.restore();

      // Outer HUD Ring Accent
      ctx.strokeStyle = selectedPlanet === 'Mars' ? 'rgba(245, 158, 11, 0.45)' : 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedPlanet, rotation, zoom, isDragging, showGrid, showTerminator, selectedPOI]);

  // Mouse Interaction handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    setIsDragging(true);
    setLastMouseX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    if (isDragging) {
      const delta = e.clientX - lastMouseX;
      setRotation((prev) => prev + delta * 0.007);
      setLastMouseX(e.clientX);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !onSelectPOI) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = (canvas.width * 0.38) * zoom;

    // Hit test against visible POIs
    for (const poi of pois) {
      const poiAngle = ((poi.lonDeg * Math.PI) / 180) + rotation;
      const sphereX = Math.cos(poiAngle);
      const sphereZ = Math.sin(poiAngle);

      if (sphereZ > 0.05) {
        const latRad = (poi.latDeg * Math.PI) / 180;
        const px = cx + sphereX * (radius * 0.82) * Math.cos(latRad);
        const py = cy - Math.sin(latRad) * radius * 0.9;
        const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
        if (dist <= 22) {
          onSelectPOI(poi);
          break;
        }
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* 3D Globe Canvas with scanning laser beam */}
      <div className="relative overflow-hidden rounded-full border border-nasa-cyan/30 shadow-[0_0_60px_rgba(0,240,255,0.2)] bg-black/60 cursor-grab active:cursor-grabbing">
        {/* Animated Laser Scanning Beam */}
        <div className="absolute inset-x-0 h-2 scan-beam pointer-events-none z-10 opacity-70" />

        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          className="block max-w-full"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      </div>

      {/* Floating HUD Controls */}
      {interactive && (
        <div className="absolute bottom-3 inset-x-0 flex items-center justify-between px-4 pointer-events-none z-20">
          <div className="flex items-center gap-1.5 pointer-events-auto bg-space-950/80 px-2.5 py-1 rounded-lg border border-space-700 text-xs font-mono">
            <button
              onClick={() => setShowGrid((v) => !v)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                showGrid ? 'bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setShowTerminator((v) => !v)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                showTerminator ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Shadow
            </button>
          </div>

          <div className="flex items-center gap-1 pointer-events-auto bg-space-950/80 px-2 py-1 rounded-lg border border-space-700 text-xs font-mono">
            <button
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.15))}
              className="p-1 rounded hover:bg-space-800 text-nasa-cyan"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
              className="p-1 rounded hover:bg-space-800 text-nasa-cyan"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1.0);
                setRotation(0);
              }}
              className="p-1 rounded hover:bg-space-800 text-slate-300"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

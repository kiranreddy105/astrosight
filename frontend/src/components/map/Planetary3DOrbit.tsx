import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Globe2,
  Crosshair,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Volume2,
  VolumeX,
  Layers,
  Sparkles,
  MapPin,
  Compass,
  ArrowRight
} from 'lucide-react';
import { SampleImage } from '../../types';

interface POI {
  id: string;
  name: string;
  badge: string;
  lat: number;
  lon: number;
  type: string;
  diam: string;
  depth: string;
  confidence: string;
}

interface Planetary3DOrbitProps {
  selectedPlanet: string;
  setSelectedPlanet: (planet: string) => void;
  samples: SampleImage[];
  onSelectSampleForAnalysis: (sample: SampleImage) => void;
}

export const Planetary3DOrbit: React.FC<Planetary3DOrbitProps> = ({
  selectedPlanet,
  setSelectedPlanet,
  samples,
  onSelectSampleForAnalysis,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Geological POIs for Moon and Mars
  const lunarPOIs: POI[] = [
    { id: 'poi-1', name: 'Mare Tranquillitatis', badge: 'APOLLO 11', lat: 0.67, lon: 23.47, type: 'Historical Lunar Landing & Basalt Ocean', diam: '48.2 km', depth: '1,840 m', confidence: 'CRATER (98.6%)' },
    { id: 'poi-2', name: 'Tycho Crater Complex', badge: 'IMPACT RIM', lat: -43.31, lon: -11.36, type: 'Prominent Ray System & Central Peak', diam: '85.0 km', depth: '4,800 m', confidence: 'CRATER (99.4%)' },
    { id: 'poi-3', name: 'Copernicus Crater', badge: 'TERRACED', lat: 9.62, lon: -20.08, type: 'Terraced Impact Basin with Central Uplift', diam: '93.0 km', depth: '3,800 m', confidence: 'CRATER (97.8%)' },
    { id: 'poi-4', name: 'Oceanus Procellarum', badge: 'MARE BASALT', lat: 18.40, lon: -57.40, type: 'Vast Lunar Mare Lava Plain', diam: '2,500 km', depth: 'N/A', confidence: 'NON-CRATER' },
    { id: 'poi-5', name: 'Shackleton Crater', badge: 'SOUTH POLE', lat: -89.90, lon: 0.00, type: 'Permanently Shadowed Water Ice Site', diam: '21.0 km', depth: '4,200 m', confidence: 'CRATER (99.1%)' }
  ];

  const martianPOIs: POI[] = [
    { id: 'm-poi-1', name: 'Jezero Crater', badge: 'PERSEVERANCE', lat: 18.38, lon: 77.58, type: 'Ancient Fluvial Delta & Paleolake', diam: '49.0 km', depth: '1,000 m', confidence: 'CRATER (99.2%)' },
    { id: 'm-poi-2', name: 'Gale Crater & Mt Sharp', badge: 'CURIOSITY', lat: -5.40, lon: 137.80, type: 'Layered Sedimentary Mound Basin', diam: '154.0 km', depth: '5,500 m', confidence: 'CRATER (98.9%)' },
    { id: 'm-poi-3', name: 'Olympus Mons Caldera', badge: 'VOLCANO', lat: 18.65, lon: -133.80, type: 'Solar System Largest Shield Volcano', diam: '624.0 km', depth: '21,900 m', confidence: 'CALDERA (96.5%)' },
    { id: 'm-poi-4', name: 'Valles Marineris', badge: 'CANYON', lat: -13.90, lon: -59.20, type: 'Tectonic Rift Grand Canyon System', diam: '4,000 km', depth: '7,000 m', confidence: 'NON-CRATER' },
    { id: 'm-poi-5', name: 'Gusev Crater', badge: 'SPIRIT ROVER', lat: -14.57, lon: 175.47, type: 'Impact Crater Lake Bed Specimen', diam: '166.0 km', depth: '3,200 m', confidence: 'CRATER (97.4%)' }
  ];

  const pois = selectedPlanet === 'Mars' ? martianPOIs : lunarPOIs;
  const radiusKm = selectedPlanet === 'Mars' ? 3389.5 : 1737.4;

  const [selectedPOI, setSelectedPOI] = useState<POI>(pois[0]);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);
  const [subSatCoords, setSubSatCoords] = useState<{ lat: string; lon: string; alt: string }>({
    lat: '0.67° N',
    lon: '23.47° E',
    alt: '320.0 km'
  });

  // Layer toggles
  const [showPins, setShowPins] = useState<boolean>(true);
  const [showAtmosphere, setShowAtmosphere] = useState<boolean>(true);
  const [showStarfield, setShowStarfield] = useState<boolean>(true);
  const [showWireframe, setShowWireframe] = useState<boolean>(false);

  // Camera Orbit Physics State
  const camState = useRef({
    rotX: 0.25,
    rotY: 0.0,
    dist: 2.2,
    velX: 0,
    velY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0
  });

  // Web Audio Synthesizer
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChirp = useCallback((freq1: number, freq2: number, dur = 0.08) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq1, now);
      osc.frequency.exponentialRampToValueAtTime(freq2, now + dur);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur);
    } catch (e) {
      // Audio autoplay policy catch
    }
  }, [soundEnabled]);

  // Keep selected POI in sync when planet changes
  useEffect(() => {
    setSelectedPOI(selectedPlanet === 'Mars' ? martianPOIs[0] : lunarPOIs[0]);
  }, [selectedPlanet]);

  // Great Circle Distance calculation
  const getGreatCircleKm = (p1: POI, p2: POI) => {
    const phi1 = (p1.lat * Math.PI) / 180;
    const phi2 = (p2.lat * Math.PI) / 180;
    const deltaLambda = ((p2.lon - p1.lon) * Math.PI) / 180;
    const angularDist = Math.acos(
      Math.max(-1, Math.min(1, Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(deltaLambda)))
    );
    return (angularDist * radiusKm).toFixed(1);
  };

  // Convert lat/lon to 3D Cartesian coordinates
  const latLonToVec3 = (latDeg: number, lonDeg: number) => {
    const latRad = (latDeg * Math.PI) / 180;
    const lonRad = (lonDeg * Math.PI) / 180;
    return {
      x: Math.cos(latRad) * Math.sin(lonRad),
      y: Math.sin(latRad),
      z: Math.cos(latRad) * Math.cos(lonRad)
    };
  };

  // 3D Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate Background Stars
    const starCount = 450;
    const stars: Array<{ x: number; y: number; size: number; speed: number; color: string }> = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * 2000,
        y: Math.random() * 1400,
        size: Math.random() * 1.6 + 0.4,
        speed: Math.random() * 3 + 1,
        color: ['#ffffff', '#a5f3fc', '#fef08a', '#e0e7ff', '#f472b6'][Math.floor(Math.random() * 5)]
      });
    }

    let animId: number;
    let frameCounter = 0;
    let lastFpsTime = performance.now();

    const render = (time: number) => {
      animId = requestAnimationFrame(render);

      // Frame rate telemetry
      frameCounter++;
      if (time - lastFpsTime >= 1000) {
        setFps(frameCounter);
        frameCounter = 0;
        lastFpsTime = time;
      }

      // Physics & Inertia
      const state = camState.current;
      if (autoRotate && !state.isDragging) {
        state.rotY += 0.0028;
      }
      state.rotX += state.velX;
      state.rotY += state.velY;
      state.velX *= 0.88;
      state.velY *= 0.88;
      state.rotX = Math.max(-Math.PI * 0.44, Math.min(Math.PI * 0.44, state.rotX));

      // Viewport bounds
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const baseRadius = Math.min(w, h) * 0.32 / (state.dist * 0.5);

      ctx.clearRect(0, 0, w, h);

      // 1. STARFIELD & NEBULA
      if (showStarfield) {
        const nebula = ctx.createRadialGradient(cx * 0.8, cy * 0.7, 40, cx, cy, Math.max(w, h));
        if (selectedPlanet === 'Mars') {
          nebula.addColorStop(0, '#1c0e08');
          nebula.addColorStop(0.5, '#090a14');
          nebula.addColorStop(1, '#030509');
        } else {
          nebula.addColorStop(0, '#0c1626');
          nebula.addColorStop(0.5, '#060b16');
          nebula.addColorStop(1, '#020409');
        }
        ctx.fillStyle = nebula;
        ctx.fillRect(0, 0, w, h);

        const tSec = time * 0.001;
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          const px = (s.x - state.rotY * 250) % w;
          const py = (s.y - state.rotX * 250) % h;
          const finalX = px < 0 ? px + w : px;
          const finalY = py < 0 ? py + h : py;

          const twinkle = 0.6 + 0.4 * Math.sin(tSec * s.speed + i);
          ctx.beginPath();
          ctx.arc(finalX, finalY, s.size, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = twinkle;
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      } else {
        ctx.fillStyle = '#040711';
        ctx.fillRect(0, 0, w, h);
      }

      // Matrix transforms for 3D sphere projection
      const cosX = Math.cos(state.rotX);
      const sinX = Math.sin(state.rotX);
      const cosY = Math.cos(state.rotY);
      const sinY = Math.sin(state.rotY);

      const project = (vec: { x: number; y: number; z: number }) => {
        const x1 = vec.x * cosY + vec.z * sinY;
        const y1 = vec.y;
        const z1 = -vec.x * sinY + vec.z * cosY;

        const x2 = x1;
        const y2 = y1 * cosX - z1 * sinX;
        const z2 = y1 * sinX + z1 * cosX;

        return {
          sx: cx + x2 * baseRadius,
          sy: cy - y2 * baseRadius,
          depthZ: z2,
          isFront: z2 > 0.05
        };
      };

      // 2. ATMOSPHERIC FRESNEL GLOW
      if (showAtmosphere) {
        ctx.save();
        const glow = ctx.createRadialGradient(cx, cy, baseRadius * 0.94, cx, cy, baseRadius * 1.28);
        glow.addColorStop(0, 'transparent');
        glow.addColorStop(0.35, selectedPlanet === 'Mars' ? 'rgba(255, 110, 50, 0.4)' : 'rgba(0, 240, 255, 0.35)');
        glow.addColorStop(0.8, selectedPlanet === 'Mars' ? 'rgba(255, 170, 0, 0.08)' : 'rgba(0, 240, 255, 0.08)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius * 1.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. PLANETARY GLOBE & SUN SHADING
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.clip();

      const sun = ctx.createRadialGradient(
        cx + baseRadius * 0.42, cy - baseRadius * 0.42, baseRadius * 0.08,
        cx, cy, baseRadius * 1.05
      );
      if (selectedPlanet === 'Mars') {
        sun.addColorStop(0, '#c7532d');
        sun.addColorStop(0.55, '#5c2214');
        sun.addColorStop(1.0, '#120503');
      } else {
        sun.addColorStop(0, '#9da7b3');
        sun.addColorStop(0.55, '#28313e');
        sun.addColorStop(1.0, '#06090e');
      }
      ctx.fillStyle = sun;
      ctx.fillRect(cx - baseRadius, cy - baseRadius, baseRadius * 2, baseRadius * 2);

      // Procedural Crater Surface Rims
      const surfaceCraters = [
        { lat: 15, lon: 35, r: 0.18 },
        { lat: -28, lon: -45, r: 0.24 },
        { lat: 48, lon: 115, r: 0.14 },
        { lat: -52, lon: 82, r: 0.20 },
        { lat: 2, lon: -115, r: 0.28 },
        { lat: 38, lon: -75, r: 0.13 }
      ];

      surfaceCraters.forEach(sc => {
        const p = project(latLonToVec3(sc.lat, sc.lon));
        if (p.isFront) {
          const craterRad = baseRadius * sc.r * (p.depthZ * 0.8 + 0.2);
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, Math.max(2, craterRad), 0, Math.PI * 2);
          ctx.fillStyle = selectedPlanet === 'Mars' ? 'rgba(50, 15, 8, 0.45)' : 'rgba(8, 12, 18, 0.55)';
          ctx.fill();
          ctx.strokeStyle = selectedPlanet === 'Mars' ? 'rgba(255, 140, 90, 0.25)' : 'rgba(160, 190, 220, 0.25)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });

      // Topographic Mesh Grid
      if (showWireframe) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
        ctx.lineWidth = 0.8;
        for (let lat = -60; lat <= 60; lat += 30) {
          ctx.beginPath();
          let started = false;
          for (let lon = -180; lon <= 180; lon += 12) {
            const pt = project(latLonToVec3(lat, lon));
            if (pt.isFront) {
              if (!started) { ctx.moveTo(pt.sx, pt.sy); started = true; }
              else { ctx.lineTo(pt.sx, pt.sy); }
            } else {
              started = false;
            }
          }
          ctx.stroke();
        }
      }
      ctx.restore();

      // 4. GEODESIC DISTANCE BEAM TO SECONDARY POI
      if (showPins && pois.length >= 2) {
        const secondary = pois.find(p => p.id !== selectedPOI.id) || pois[1];
        const pr1 = project(latLonToVec3(selectedPOI.lat, selectedPOI.lon));
        const pr2 = project(latLonToVec3(secondary.lat, secondary.lon));

        if (pr1.isFront || pr2.isFront) {
          ctx.save();
          ctx.strokeStyle = '#ffaa00';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(pr1.sx, pr1.sy);
          ctx.lineTo(pr2.sx, pr2.sy);
          ctx.stroke();
          ctx.setLineDash([]);

          const midX = (pr1.sx + pr2.sx) / 2;
          const midY = (pr1.sy + pr2.sy) / 2;
          const distKm = getGreatCircleKm(selectedPOI, secondary);

          ctx.fillStyle = '#080d1a';
          ctx.fillRect(midX - 36, midY - 10, 72, 20);
          ctx.strokeStyle = '#ffaa00';
          ctx.strokeRect(midX - 36, midY - 10, 72, 20);
          ctx.fillStyle = '#ffaa00';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${distKm} km`, midX, midY);
          ctx.restore();
        }
      }

      // 5. 3D HOLOGRAPHIC CRATER PINS
      if (showPins) {
        pois.forEach(poi => {
          const pr = project(latLonToVec3(poi.lat, poi.lon));
          if (!pr.isFront) return;

          const isSelected = poi.id === selectedPOI.id;
          const pinColor = isSelected ? '#00f0ff' : '#ffaa00';

          ctx.save();
          ctx.translate(pr.sx, pr.sy);

          // Outer reticle ring
          ctx.beginPath();
          ctx.arc(0, 0, isSelected ? 12 : 8, 0, Math.PI * 2);
          ctx.strokeStyle = pinColor;
          ctx.lineWidth = isSelected ? 2 : 1.2;
          ctx.stroke();

          // Center crosshair dot
          ctx.beginPath();
          ctx.arc(0, 0, isSelected ? 3.5 : 2, 0, Math.PI * 2);
          ctx.fillStyle = pinColor;
          ctx.fill();

          // Label Tag
          const tx = 16;
          const ty = -10;
          ctx.fillStyle = isSelected ? 'rgba(0, 240, 255, 0.95)' : 'rgba(8, 13, 26, 0.85)';
          ctx.fillRect(tx, ty, 105, 20);
          ctx.strokeStyle = pinColor;
          ctx.strokeRect(tx, ty, 105, 20);

          ctx.fillStyle = isSelected ? '#040711' : '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(poi.name.slice(0, 14), tx + 5, ty + 10);
          ctx.restore();
        });
      }

      // Telemetry update
      const centerLon = ((-state.rotY * 180 / Math.PI) % 360).toFixed(2);
      const centerLat = ((state.rotX * 180 / Math.PI)).toFixed(2);
      setSubSatCoords({
        lat: `${Math.abs(Number(centerLat))}° ${Number(centerLat) >= 0 ? 'N' : 'S'}`,
        lon: `${Math.abs(Number(centerLon))}° ${Number(centerLon) >= 0 ? 'E' : 'W'}`,
        alt: `${(state.dist * 145).toFixed(1)} km`
      });
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedPlanet, selectedPOI, autoRotate, showPins, showAtmosphere, showStarfield, showWireframe]);

  // Handle Canvas Mouse & Touch Interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    camState.current.isDragging = true;
    camState.current.lastX = e.clientX;
    camState.current.lastY = e.clientY;
    setAutoRotate(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = camState.current;
    if (!state.isDragging) return;
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.velY = dx * 0.005;
    state.velX = dy * 0.005;
  };

  const handleMouseUp = () => {
    camState.current.isDragging = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    camState.current.dist = Math.max(1.3, Math.min(4.2, camState.current.dist + e.deltaY * 0.0015));
    playChirp(440, 660, 0.03);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const state = camState.current;
    const baseRadius = Math.min(canvas.width, canvas.height) * 0.32 / (state.dist * 0.5);
    const cosX = Math.cos(state.rotX);
    const sinX = Math.sin(state.rotX);
    const cosY = Math.cos(state.rotY);
    const sinY = Math.sin(state.rotY);

    for (const poi of pois) {
      const vec = latLonToVec3(poi.lat, poi.lon);
      const x1 = vec.x * cosY + vec.z * sinY;
      const y1 = vec.y;
      const z1 = -vec.x * sinY + vec.z * cosY;
      const x2 = x1;
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;

      if (z2 > 0.05) {
        const sx = canvas.width / 2 + x2 * baseRadius;
        const sy = canvas.height / 2 - y2 * baseRadius;
        const dist = Math.hypot(clickX - sx, clickY - sy);
        if (dist < 28) {
          setSelectedPOI(poi);
          playChirp(880, 1760, 0.1);
          break;
        }
      }
    }
  };

  // Find sample matching selected planet for AI analysis handover
  const matchingSample = samples.find(
    s => s.planet.toLowerCase() === selectedPlanet.toLowerCase()
  ) || samples[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 8 Cols: Interactive 3D Canvas */}
      <div className="lg:col-span-8 flex flex-col space-y-3">
        <div className="glass-panel p-4 rounded-2xl border border-cyan-500/20 relative overflow-hidden">
          {/* Top Canvas Toolbar */}
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 text-xs font-mono">
            <div className="flex items-center space-x-2 text-slate-200">
              <Globe2 className="w-4 h-4 text-cyan-400 animate-spin-slow" />
              <span className="font-bold text-white uppercase">{selectedPlanet} 3D SPATIAL ORBIT</span>
              <span className="text-cyan-400 text-[11px] hidden sm:inline">
                • {subSatCoords.lat}, {subSatCoords.lon}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-lg border transition-all ${
                  soundEnabled
                    ? 'bg-cyan-950 text-cyan-400 border-cyan-500/40'
                    : 'bg-space-800 text-slate-400 border-space-700'
                }`}
                title="Toggle Web Audio Synthesizer"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${
                  autoRotate
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40 font-semibold'
                    : 'bg-space-800 text-slate-400 border-space-700'
                }`}
              >
                {autoRotate ? 'Orbit Active' : 'Orbit Paused'}
              </button>

              <div className="flex items-center space-x-1 bg-space-850 p-1 rounded border border-space-700">
                <button
                  onClick={() => {
                    camState.current.dist = Math.max(1.3, camState.current.dist - 0.25);
                    playChirp(700, 900, 0.04);
                  }}
                  className="p-1 hover:text-cyan-400 text-slate-400"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    camState.current.dist = Math.min(4.2, camState.current.dist + 0.25);
                    playChirp(500, 400, 0.04);
                  }}
                  className="p-1 hover:text-cyan-400 text-slate-400"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    camState.current.rotX = 0.25;
                    camState.current.rotY = 0.0;
                    camState.current.dist = 2.2;
                    setAutoRotate(true);
                    playChirp(440, 880, 0.08);
                  }}
                  className="p-1 hover:text-white text-slate-400"
                  title="Reset 3D Orientation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 3D Viewport Canvas */}
          <div className="relative overflow-hidden bg-black/95 rounded-xl my-3 border border-space-800 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={900}
              height={560}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              onClick={handleCanvasClick}
              className="cursor-grab active:cursor-grabbing max-w-full block"
            />

            {/* In-Canvas Telemetry HUD Glass */}
            <div className="absolute top-3 left-3 pointer-events-none p-2.5 rounded-xl bg-space-900/80 backdrop-blur-md border border-cyan-500/20 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="text-cyan-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>TELEMETRY STREAM: 8.4 GHz</span>
              </div>
              <div>ALTITUDE: <span className="text-cyan-300 font-semibold">{subSatCoords.alt}</span></div>
              <div>FRAME LATENCY: <span className="text-emerald-400 font-semibold">{fps} FPS</span></div>
            </div>
          </div>

          {/* Layer Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-space-700/60 gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">LAYERS:</span>
              <button
                onClick={() => setShowPins(!showPins)}
                className={`px-2 py-0.5 rounded border transition-all ${
                  showPins ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40' : 'bg-space-850 text-slate-500 border-space-700'
                }`}
              >
                Pins
              </button>
              <button
                onClick={() => setShowAtmosphere(!showAtmosphere)}
                className={`px-2 py-0.5 rounded border transition-all ${
                  showAtmosphere ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40' : 'bg-space-850 text-slate-500 border-space-700'
                }`}
              >
                Glow
              </button>
              <button
                onClick={() => setShowStarfield(!showStarfield)}
                className={`px-2 py-0.5 rounded border transition-all ${
                  showStarfield ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40' : 'bg-space-850 text-slate-500 border-space-700'
                }`}
              >
                Nebula
              </button>
              <button
                onClick={() => setShowWireframe(!showWireframe)}
                className={`px-2 py-0.5 rounded border transition-all ${
                  showWireframe ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40' : 'bg-space-850 text-slate-500 border-space-700'
                }`}
              >
                Wireframe
              </button>
            </div>
            <span className="text-slate-400">Click & Drag to rotate • Wheel to zoom • Click pins to lock</span>
          </div>
        </div>
      </div>

      {/* Right 4 Cols: Selected POI Telemetry & Action Handover */}
      <div className="lg:col-span-4 space-y-4">
        {/* Selected POI Details Card */}
        <div className="glass-panel p-5 rounded-2xl space-y-3 border-l-4 border-l-cyan-400 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5" />
              ORBITAL TARGET LOCK
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
              {selectedPOI.badge}
            </span>
          </div>

          <h3 className="text-base font-bold font-sans text-white">{selectedPOI.name}</h3>
          <p className="text-xs text-slate-400 font-sans">{selectedPOI.type}</p>

          <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-space-700/60">
            <div className="flex justify-between">
              <span className="text-slate-400">Coordinates:</span>
              <span className="text-cyan-300 font-bold">{selectedPOI.lat}°N, {selectedPOI.lon}°E</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Classification:</span>
              <span className="text-emerald-400 font-bold">{selectedPOI.confidence}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Rim Diameter:</span>
              <span className="text-amber-300 font-bold">{selectedPOI.diam}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Crater Depth:</span>
              <span className="text-white font-bold">{selectedPOI.depth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Geodesic Caliper:</span>
              <span className="text-amber-400 font-bold">
                {getGreatCircleKm(selectedPOI, pois.find(p => p.id !== selectedPOI.id) || pois[0])} km
              </span>
            </div>
          </div>

          {/* Handover Action */}
          <div className="pt-3">
            <button
              onClick={() => {
                if (matchingSample) {
                  onSelectSampleForAnalysis(matchingSample);
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-sans text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-950"
            >
              <span>Inspect in AI CraterNet Detection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Priority Formations Quick Select */}
        <div className="glass-panel p-4 rounded-2xl space-y-2.5 font-mono text-xs">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>GEOLOGICAL FORMATIONS</span>
            <span className="text-cyan-400">{pois.length} CATALOGED</span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {pois.map((poi) => {
              const isCurrent = poi.id === selectedPOI.id;
              return (
                <button
                  key={poi.id}
                  onClick={() => {
                    setSelectedPOI(poi);
                    playChirp(880, 1760, 0.1);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all border flex items-center justify-between ${
                    isCurrent
                      ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200'
                      : 'bg-space-850/60 hover:bg-space-800 border-space-700/60 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs text-white truncate max-w-[150px]">{poi.name}</div>
                    <div className="text-[10px] text-slate-400">{poi.lat}°N, {poi.lon}°E</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-space-800 border border-slate-700 text-amber-400">
                    {poi.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

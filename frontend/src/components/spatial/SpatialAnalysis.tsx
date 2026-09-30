import React, { useState, useRef, useEffect } from 'react';
import {
  Ruler,
  Compass,
  ArrowRight,
  Calculator,
  Layers,
  MapPin,
  Sparkles,
  BarChart2,
  Table,
  CheckCircle2,
  TrendingUp,
  Download
} from 'lucide-react';
import { AnalysisRecord, Crater, SpatialMeasurement } from '../../types';

interface SpatialAnalysisProps {
  activeAnalysis: AnalysisRecord | null;
  onNavigate: (tab: string) => void;
}

export const SpatialAnalysis: React.FC<SpatialAnalysisProps> = ({
  activeAnalysis,
  onNavigate
}) => {
  const craters = activeAnalysis?.craters || [];
  
  // Selection state for two craters
  const [craterAIndex, setCraterAIndex] = useState<number>(craters[0]?.index || 1);
  const [craterBIndex, setCraterBIndex] = useState<number>(craters[1]?.index || 2);
  
  // Resolution & unit state
  const [resolutionMeters, setResolutionMeters] = useState<number>(
    activeAnalysis?.resolution_m_px || 10.0
  );
  const [unit, setUnit] = useState<'meters' | 'kilometers' | 'miles'>('kilometers');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Sync resolution when activeAnalysis changes
  useEffect(() => {
    if (activeAnalysis?.resolution_m_px) {
      setResolutionMeters(activeAnalysis.resolution_m_px);
    }
    if (craters.length >= 2) {
      setCraterAIndex(craters[0].index);
      setCraterBIndex(craters[1].index);
    }
  }, [activeAnalysis?.id]);

  // Load satellite image onto canvas
  useEffect(() => {
    if (!activeAnalysis?.image_url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = activeAnalysis.image_url;
    img.onload = () => {
      imgRef.current = img;
      drawCanvas();
    };
  }, [activeAnalysis?.image_url]);

  // Find Crater A and Crater B
  const craterA = craters.find((c) => c.index === craterAIndex) || craters[0];
  const craterB = craters.find((c) => c.index === craterBIndex) || craters[1];

  // Real-time Euclidean Distance Calculation
  let pixelDistance = 0;
  let deltaX = 0;
  let deltaY = 0;
  let realDistanceM = 0;
  let realDistanceKm = 0;
  let realDistanceMi = 0;
  let bearingDeg = 0;

  if (craterA && craterB) {
    deltaX = craterB.x - craterA.x;
    deltaY = craterB.y - craterA.y;
    pixelDistance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    realDistanceM = pixelDistance * resolutionMeters;
    realDistanceKm = realDistanceM / 1000.0;
    realDistanceMi = realDistanceKm * 0.621371192;
    
    const angleRad = Math.atan2(deltaX, -deltaY);
    bearingDeg = Math.round(((angleRad * 180) / Math.PI + 360) % 360);
  }

  // Draw Interactive Measurement Canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth || 800;
    canvas.height = img.naturalHeight || 800;

    // Draw background satellite frame
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw dim circles for all craters
    craters.forEach((c) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Mini label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px monospace';
      ctx.fillText(`#${c.index}`, c.x - 8, c.y - c.radius - 4);
      ctx.restore();
    });

    if (craterA && craterB && craterAIndex !== craterBIndex) {
      // 1. Draw glowing measurement beam / vector
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(craterA.x, craterA.y);
      ctx.lineTo(craterB.x, craterB.y);

      // Outer glow
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.restore();

      // 2. Highlight Crater A (Source)
      ctx.save();
      ctx.beginPath();
      ctx.arc(craterA.x, craterA.y, craterA.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#00e676'; // Emerald
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00e676';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.fillStyle = 'rgba(0, 230, 118, 0.2)';
      ctx.fill();
      ctx.restore();

      // 3. Highlight Crater B (Target)
      ctx.save();
      ctx.beginPath();
      ctx.arc(craterB.x, craterB.y, craterB.radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#ffaa00'; // Amber
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 170, 0, 0.2)';
      ctx.fill();
      ctx.restore();

      // 4. Draw Center Pins
      [craterA, craterB].forEach((c, idx) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(c.x, c.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      });

      // 5. Draw Midpoint Measurement Badge
      const midX = (craterA.x + craterB.x) / 2;
      const midY = (craterA.y + craterB.y) / 2;
      const badgeText = `${realDistanceKm >= 1 ? realDistanceKm.toFixed(2) + ' km' : realDistanceM.toFixed(0) + ' m'} (${pixelDistance.toFixed(1)} px)`;

      ctx.save();
      ctx.font = 'bold 12px ui-monospace, SFMono-Regular, monospace';
      const textW = ctx.measureText(badgeText).width;
      
      ctx.fillStyle = 'rgba(4, 7, 17, 0.9)';
      ctx.fillRect(midX - textW / 2 - 6, midY - 12, textW + 12, 22);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(midX - textW / 2 - 6, midY - 12, textW + 12, 22);

      ctx.fillStyle = '#00f0ff';
      ctx.fillText(badgeText, midX - textW / 2, midY + 4);
      ctx.restore();
    }
  };

  useEffect(() => {
    drawCanvas();
  }, [craterAIndex, craterBIndex, resolutionMeters, unit, activeAnalysis]);

  // Click on canvas to select craters
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Find closest crater
    let closest: Crater | null = null;
    let minDist = Infinity;

    for (const c of craters) {
      const d = Math.sqrt((clickX - c.x) ** 2 + (clickY - c.y) ** 2);
      if (d < minDist && d <= c.radius * 1.5) {
        minDist = d;
        closest = c;
      }
    }

    if (closest) {
      if (closest.index !== craterAIndex) {
        setCraterBIndex(closest.index);
      } else {
        setCraterAIndex(closest.index);
      }
    }
  };

  if (!activeAnalysis || craters.length < 2) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12">
        <Ruler className="w-12 h-12 text-slate-500 mx-auto animate-pulse" />
        <h3 className="text-lg font-bold font-mono text-white">Spatial Measurement Studio</h3>
        <p className="text-xs text-slate-400">
          At least two detected crater features are required to perform spatial geodesic measurements. Please analyze an image first.
        </p>
        <button
          onClick={() => onNavigate('analysis')}
          className="px-5 py-2.5 rounded-lg bg-nasa-cyan text-space-950 font-bold font-mono text-xs uppercase tracking-wider hover:brightness-110 transition-all inline-flex items-center gap-2"
        >
          <span>Run Analysis</span>
        </button>
      </div>
    );
  }

  // Get active display distance formatted based on user selected unit
  const displayDistance =
    unit === 'meters'
      ? `${realDistanceM.toLocaleString(undefined, { maximumFractionDigits: 1 })} meters`
      : unit === 'miles'
      ? `${realDistanceMi.toFixed(2)} miles`
      : `${realDistanceKm.toFixed(2)} km`;

  const density = activeAnalysis.spatial_density?.density_per_km2 || 0.015;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-space-700/60">
        <div>
          <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <span>SPATIAL ANALYSIS & DISTANCE CONVERSION STUDIO</span>
            <span className="text-xs px-2 py-0.5 rounded bg-nasa-amber/20 text-nasa-amber border border-nasa-amber/30 font-mono">
              EUCLIDEAN GEODESIC ENGINE
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Calculate accurate spatial pixel distances and real-world ground metrics between planetary geological structures.
          </p>
        </div>

        {/* Units Selector */}
        <div className="flex items-center gap-1 bg-space-850 p-1 rounded-lg border border-space-700">
          {(['kilometers', 'meters', 'miles'] as const).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-3 py-1 rounded text-xs font-mono font-medium capitalize transition-all ${
                unit === u
                  ? 'bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Prominent High-Impact Distance Banner (Section 9) */}
      <div className="rounded-2xl glass-panel p-6 border-2 border-nasa-cyan/40 shadow-xl shadow-nasa-cyan/10 hud-grid flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-nasa-cyan font-bold flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            GROUND GEODESIC DISTANCE
          </span>
          <div className="text-4xl md:text-5xl font-extrabold font-mono text-white tracking-tight glow-cyan">
            {displayDistance}
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400 pt-1">
            <span>Pair: Crater #{craterA?.index.toString().padStart(2, '0')} &rarr; Crater #{craterB?.index.toString().padStart(2, '0')}</span>
            <span>|</span>
            <span>Bearing: {bearingDeg}°</span>
          </div>
        </div>

        {/* Pixel & Formula Card */}
        <div className="bg-space-950/80 p-4 rounded-xl border border-space-700/80 font-mono text-xs space-y-2 md:min-w-[280px]">
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">Pixel Distance:</span>
            <span className="font-bold text-nasa-cyan text-sm">{pixelDistance.toFixed(2)} px</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">Pixel Resolution:</span>
            <span className="text-white font-bold">{resolutionMeters} m / px</span>
          </div>
          <div className="pt-1.5 border-t border-space-800 text-[10.5px] text-slate-400">
            <span>Formula: d = &radic;((x₂ - x₁)&sup2; + (y₂ - y₁)&sup2;) &times; R</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Canvas on Left, Telemetry & Coordinate Readouts on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-space-700/80 overflow-hidden relative">
            <div className="flex items-center justify-between pb-3 border-b border-space-700/60 text-xs font-mono">
              <span className="text-slate-300 font-semibold flex items-center gap-2">
                <Compass className="w-4 h-4 text-nasa-cyan" />
                <span>Interactive Planetary Measurement Studio</span>
              </span>
              <span className="text-[11px] text-slate-400">Click any crater to pair</span>
            </div>

            <div className="relative overflow-hidden bg-black/90 rounded-xl my-3 border border-space-800 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="cursor-crosshair max-w-full block"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-space-700/60">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-nasa-emerald" /> Crater A (Start)
                <span className="w-2.5 h-2.5 rounded-full bg-nasa-amber ml-2" /> Crater B (End)
              </span>
              <span className="text-nasa-cyan font-semibold">
                Vector: &Delta;X={deltaX.toFixed(1)} px, &Delta;Y={deltaY.toFixed(1)} px
              </span>
            </div>
          </div>
        </div>

        {/* Right: Coordinates & Pairwise Calculations (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Crater Pair Selector & Coordinate Inspection (Section 8) */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold font-mono text-white flex items-center gap-2 border-b border-space-700/60 pb-2">
              <Calculator className="w-4 h-4 text-nasa-cyan" />
              <span>FEATURE COORDINATE EXTRACTION (Cᵢ = [xᵢ, yᵢ])</span>
            </h3>

            {/* Crater A Selection */}
            <div className="p-3.5 rounded-xl bg-space-850/80 border border-nasa-emerald/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-nasa-emerald flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-nasa-emerald" />
                  CRATER A (ORIGIN)
                </span>
                <select
                  value={craterAIndex}
                  onChange={(e) => setCraterAIndex(parseInt(e.target.value))}
                  className="bg-space-950 border border-space-700 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-nasa-emerald"
                >
                  {craters.map((c) => (
                    <option key={c.index} value={c.index}>
                      Crater #{c.index.toString().padStart(2, '0')} ({c.confidence.toFixed(1)}%)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1 text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 block">X Coords:</span>
                  <span className="font-bold text-white">{craterA?.x.toFixed(1)} px</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Y Coords:</span>
                  <span className="font-bold text-white">{craterA?.y.toFixed(1)} px</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Radius:</span>
                  <span className="font-bold text-white">{craterA?.radius.toFixed(1)} px</span>
                </div>
              </div>
            </div>

            {/* Crater B Selection */}
            <div className="p-3.5 rounded-xl bg-space-850/80 border border-nasa-amber/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-nasa-amber flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-nasa-amber" />
                  CRATER B (TARGET)
                </span>
                <select
                  value={craterBIndex}
                  onChange={(e) => setCraterBIndex(parseInt(e.target.value))}
                  className="bg-space-950 border border-space-700 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-nasa-amber"
                >
                  {craters.map((c) => (
                    <option key={c.index} value={c.index}>
                      Crater #{c.index.toString().padStart(2, '0')} ({c.confidence.toFixed(1)}%)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1 text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 block">X Coords:</span>
                  <span className="font-bold text-white">{craterB?.x.toFixed(1)} px</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Y Coords:</span>
                  <span className="font-bold text-white">{craterB?.y.toFixed(1)} px</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Radius:</span>
                  <span className="font-bold text-white">{craterB?.radius.toFixed(1)} px</span>
                </div>
              </div>
            </div>

            {/* Resolution Calibration Slider */}
            <div className="pt-2 border-t border-space-700/60 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Resolution Scale (m/px):</span>
                <span className="text-nasa-cyan font-bold">{resolutionMeters} m/px</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="100"
                step="0.5"
                value={resolutionMeters}
                onChange={(e) => setResolutionMeters(parseFloat(e.target.value))}
                className="w-full accent-nasa-cyan bg-space-800 rounded h-1.5 cursor-pointer"
              />
            </div>
          </div>

          {/* Geological Density & Centroid Telemetry Card */}
          <div className="glass-panel p-5 rounded-2xl space-y-3 font-mono text-xs">
            <h3 className="font-bold text-white border-b border-space-700/60 pb-2 flex items-center justify-between">
              <span>TERRAIN SPATIAL DENSITY</span>
              <span className="text-nasa-cyan text-[10px]">SURFACE GEOMETRY</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-space-850/60 border border-space-700/50">
                <span className="text-slate-400 text-[10.5px] block">Crater Density:</span>
                <span className="text-white font-bold text-sm block mt-0.5">
                  {density.toFixed(4)} / km²
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-space-850/60 border border-space-700/50">
                <span className="text-slate-400 text-[10.5px] block">Mean Centroid:</span>
                <span className="text-white font-bold text-sm block mt-0.5">
                  [{activeAnalysis.centroid_x?.toFixed(0) || '425'}, {activeAnalysis.centroid_y?.toFixed(0) || '425'}]
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pairwise Distance Matrix Table */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-space-700/60 pb-3">
          <div>
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-nasa-cyan" />
              <span>Pairwise Spatial Geodesic Distance Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive geometric triangulation across all detected crater centroids.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {activeAnalysis.measurements?.length || 0} PAIRS COMPUTED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-space-700/80 text-slate-400 bg-space-850/40">
                <th className="py-2.5 px-4 font-semibold">Crater Pair</th>
                <th className="py-2.5 px-4 font-semibold">Crater A (x, y)</th>
                <th className="py-2.5 px-4 font-semibold">Crater B (x, y)</th>
                <th className="py-2.5 px-4 font-semibold">Pixel Dist.</th>
                <th className="py-2.5 px-4 font-semibold">Ground Dist. (km)</th>
                <th className="py-2.5 px-4 font-semibold">Ground Dist. (m)</th>
                <th className="py-2.5 px-4 font-semibold">Bearing</th>
                <th className="py-2.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-800/80 text-slate-300">
              {(activeAnalysis.measurements || []).slice(0, 10).map((m, idx) => (
                <tr key={idx} className="hover:bg-space-800/40 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-nasa-cyan">
                    #{m.crater_a_index.toString().padStart(2, '0')} &rarr; #{m.crater_b_index.toString().padStart(2, '0')}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    [{m.crater_a_x.toFixed(0)}, {m.crater_a_y.toFixed(0)}]
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    [{m.crater_b_x.toFixed(0)}, {m.crater_b_y.toFixed(0)}]
                  </td>
                  <td className="py-2.5 px-4">{m.pixel_distance.toFixed(1)} px</td>
                  <td className="py-2.5 px-4 font-bold text-white">
                    {((m.pixel_distance * resolutionMeters) / 1000).toFixed(2)} km
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    {(m.pixel_distance * resolutionMeters).toLocaleString(undefined, { maximumFractionDigits: 0 })} m
                  </td>
                  <td className="py-2.5 px-4 text-nasa-amber">{m.bearing_deg || 0}°</td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => {
                        setCraterAIndex(m.crater_a_index);
                        setCraterBIndex(m.crater_b_index);
                      }}
                      className="px-2 py-1 rounded bg-space-800 hover:bg-space-700 text-nasa-cyan text-[11px] border border-space-700"
                    >
                      Focus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

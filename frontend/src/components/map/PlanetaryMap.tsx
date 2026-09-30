import React, { useState, useRef, useEffect } from 'react';
import {
  Globe2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  MapPin,
  Layers,
  Crosshair,
  Maximize2,
  Navigation,
  Sparkles
} from 'lucide-react';
import { SampleImage } from '../../types';

interface PlanetaryMapProps {
  selectedPlanet: string;
  setSelectedPlanet: (planet: string) => void;
  samples: SampleImage[];
  onSelectSampleForAnalysis: (sample: SampleImage) => void;
}

export const PlanetaryMap: React.FC<PlanetaryMapProps> = ({
  selectedPlanet,
  setSelectedPlanet,
  samples,
  onSelectSampleForAnalysis
}) => {
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showPins, setShowPins] = useState<boolean>(true);
  const [selectedPin, setSelectedPin] = useState<any | null>(null);
  const [mouseCoords, setMouseCoords] = useState<{ lat: string; lon: string }>({
    lat: '00.00°N',
    lon: '00.00°E'
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pre-configured geological points of interest for Moon and Mars
  const lunarPOIs = [
    { id: 'poi-1', name: 'Mare Tranquillitatis (Apollo 11)', x: 0.32, y: 0.35, lat: '0.67°N', lon: '23.47°E', type: 'Mare Basalt Plain' },
    { id: 'poi-2', name: 'Tycho Crater Complex', x: 0.50, y: 0.72, lat: '43.31°S', lon: '11.36°W', type: 'Impact Crater & Rays' },
    { id: 'poi-3', name: 'Copernicus Crater', x: 0.38, y: 0.45, lat: '9.62°N', lon: '20.08°W', type: 'Terraced Basin' },
    { id: 'poi-4', name: 'Oceanus Procellarum', x: 0.22, y: 0.40, lat: '18.40°N', lon: '57.40°W', type: 'Vast Basalt Ocean' },
    { id: 'poi-5', name: 'Shackleton Crater (South Pole)', x: 0.50, y: 0.88, lat: '89.90°S', lon: '0.00°E', type: 'Permanently Shadowed Crater' },
  ];

  const martianPOIs = [
    { id: 'm-poi-1', name: 'Jezero Crater (Perseverance)', x: 0.62, y: 0.42, lat: '18.38°N', lon: '77.58°E', type: 'Ancient Lake Delta' },
    { id: 'm-poi-2', name: 'Gale Crater & Mount Sharp', x: 0.70, y: 0.55, lat: '5.40°S', lon: '137.80°E', type: 'Curiosity Rover Exploration' },
    { id: 'm-poi-3', name: 'Olympus Mons Caldera', x: 0.28, y: 0.42, lat: '18.65°N', lon: '133.80°W', type: 'Massive Shield Volcano' },
    { id: 'm-poi-4', name: 'Valles Marineris', x: 0.44, y: 0.58, lat: '13.90°S', lon: '59.20°W', type: 'Planetary Canyon System' },
    { id: 'm-poi-5', name: 'Gusev Crater (Spirit)', x: 0.74, y: 0.62, lat: '14.57°S', lon: '175.47°E', type: 'Impact Crater Plain' },
  ];

  const pois = selectedPlanet === 'Mars' ? martianPOIs : lunarPOIs;

  const currentSample = samples.find(
    (s) => s.planet.toLowerCase() === selectedPlanet.toLowerCase()
  ) || samples[0];

  // Draw Planetary Map Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 900;
    canvas.height = 600;

    const w = canvas.width;
    const h = canvas.height;

    // Background planet surface base
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Planetary texture background gradient
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w / 1.5);
    if (selectedPlanet === 'Mars') {
      bgGrad.addColorStop(0, '#5a2215');
      bgGrad.addColorStop(0.5, '#3b160e');
      bgGrad.addColorStop(1, '#1a0906');
    } else {
      bgGrad.addColorStop(0, '#2c3545');
      bgGrad.addColorStop(0.5, '#19202c');
      bgGrad.addColorStop(1, '#0c1017');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Procedural terrain relief lines
    ctx.strokeStyle = selectedPlanet === 'Mars' ? 'rgba(255, 120, 80, 0.15)' : 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let r = 80; r < w; r += 70) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Coordinate Grid (Latitude / Longitude lines)
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);

      // Latitudes (Horizontal)
      for (let y = 60; y < h; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        const latDeg = Math.round(90 - (y / h) * 180);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.font = '9px monospace';
        ctx.fillText(`${Math.abs(latDeg)}°${latDeg >= 0 ? 'N' : 'S'}`, 8, y - 3);
      }

      // Longitudes (Vertical)
      for (let x = 75; x < w; x += 75) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();

        const lonDeg = Math.round((x / w) * 360 - 180);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.font = '9px monospace';
        ctx.fillText(`${Math.abs(lonDeg)}°${lonDeg >= 0 ? 'E' : 'W'}`, x + 3, 14);
      }
      ctx.setLineDash([]);
    }

    // Crater & Landmark Pins
    if (showPins) {
      pois.forEach((poi) => {
        const px = poi.x * w;
        const py = poi.y * h;
        const isSelected = selectedPin?.id === poi.id;

        // Pin Outer Pulse
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, isSelected ? 12 : 7, 0, 2 * Math.PI);
        ctx.strokeStyle = isSelected ? '#ffaa00' : '#00f0ff';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();
        ctx.fillStyle = isSelected ? 'rgba(255, 170, 0, 0.3)' : 'rgba(0, 240, 255, 0.2)';
        ctx.fill();

        // Pin Center Dot
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Label
        ctx.font = 'bold 10px monospace';
        const labelW = ctx.measureText(poi.name).width;
        ctx.fillStyle = 'rgba(6, 9, 19, 0.85)';
        ctx.fillRect(px + 10, py - 8, labelW + 8, 16);
        ctx.strokeStyle = isSelected ? '#ffaa00' : 'rgba(0, 240, 255, 0.4)';
        ctx.strokeRect(px + 10, py - 8, labelW + 8, 16);

        ctx.fillStyle = isSelected ? '#ffaa00' : '#ffffff';
        ctx.fillText(poi.name, px + 14, py + 4);
        ctx.restore();
      });
    }

    ctx.restore();

    // HUD Scale Bar in Bottom Right (Stationary overlay)
    const scaleBarPx = 80 * zoom;
    const kmPerScale = 50; // nominal 50km scale bar
    ctx.save();
    ctx.fillStyle = 'rgba(6, 9, 19, 0.75)';
    ctx.fillRect(w - 180, h - 45, 160, 32);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.strokeRect(w - 180, h - 45, 160, 32);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(w - 170, h - 25, scaleBarPx, 3);
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`${kmPerScale} KM SCALE`, w - 170, h - 30);
    ctx.restore();
  }, [selectedPlanet, zoom, pan, showGrid, showPins, selectedPin]);

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }

    // Calculate Latitude & Longitude from mouse position
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - pan.x) / zoom;
    const my = (e.clientY - rect.top - pan.y) / zoom;

    const latVal = Math.round(90 - (my / canvas.height) * 180);
    const lonVal = Math.round((mx / canvas.width) * 360 - 180);

    setMouseCoords({
      lat: `${Math.abs(latVal).toString().padStart(2, '0')}.${Math.abs(Math.round((my % 10) * 10))}°${latVal >= 0 ? 'N' : 'S'}`,
      lon: `${Math.abs(lonVal).toString().padStart(3, '0')}.${Math.abs(Math.round((mx % 10) * 10))}°${lonVal >= 0 ? 'E' : 'W'}`
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Click on pin
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - pan.x) / zoom;
    const my = (e.clientY - rect.top - pan.y) / zoom;

    let clicked: any = null;
    for (const p of pois) {
      const px = p.x * canvas.width;
      const py = p.y * canvas.height;
      const d = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
      if (d <= 20) {
        clicked = p;
        break;
      }
    }
    setSelectedPin(clicked);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-space-700/60">
        <div>
          <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <span>PLANETARY CARTOGRAPHY & SATELLITE BASEMAP</span>
            <span className="text-xs px-2 py-0.5 rounded bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/30 font-mono">
              {selectedPlanet.toUpperCase()} GEODESY
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Explore lunar and martian surface geology, coordinate grids, and historical impact basin landing sites.
          </p>
        </div>

        {/* Planet Toggle Buttons */}
        <div className="flex items-center gap-2 bg-space-850 p-1 rounded-lg border border-space-700">
          <button
            onClick={() => setSelectedPlanet('Moon')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
              selectedPlanet === 'Moon'
                ? 'bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🌕 Moon Mode
          </button>
          <button
            onClick={() => setSelectedPlanet('Mars')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
              selectedPlanet === 'Mars'
                ? 'bg-nasa-red/20 text-nasa-red border border-nasa-red/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔴 Mars Mode
          </button>
        </div>
      </div>

      {/* Main Map Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Map Viewport (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel p-4 rounded-2xl border border-space-700/80 overflow-hidden relative">
            {/* Map Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-space-700/60 text-xs font-mono">
              <div className="flex items-center gap-4">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Globe2 className="w-4 h-4 text-nasa-cyan" />
                  <span>{selectedPlanet} Planetary Basemap</span>
                </span>
                <span className="text-nasa-cyan font-mono text-[11px]">
                  CURSOR: {mouseCoords.lat}, {mouseCoords.lon}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${
                    showGrid
                      ? 'bg-nasa-cyan/15 text-nasa-cyan border-nasa-cyan/40'
                      : 'bg-space-800 text-slate-400 border-space-700'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setShowPins(!showPins)}
                  className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${
                    showPins
                      ? 'bg-nasa-cyan/15 text-nasa-cyan border-nasa-cyan/40'
                      : 'bg-space-800 text-slate-400 border-space-700'
                  }`}
                >
                  Markers
                </button>

                <div className="flex items-center gap-1 bg-space-850 p-1 rounded border border-space-700">
                  <button
                    onClick={() => setZoom((z) => Math.min(3.0, z + 0.25))}
                    className="p-1 hover:text-nasa-cyan text-slate-400"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoom((z) => Math.max(0.7, z - 0.25))}
                    className="p-1 hover:text-nasa-cyan text-slate-400"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setZoom(1.0);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="p-1 hover:text-white text-slate-400"
                    title="Reset View"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="relative overflow-hidden bg-black/95 rounded-xl my-3 border border-space-800 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={handleCanvasClick}
                className="cursor-grab active:cursor-grabbing max-w-full block"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-space-700/60">
              <span>Click and drag to pan • Scroll / use zoom controls to magnify</span>
              <span className="text-slate-300">Target Body: {selectedPlanet} Sphere</span>
            </div>
          </div>
        </div>

        {/* Right Landmarks & Geodetic Telemetry (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Feature Info Panel */}
          {selectedPin ? (
            <div className="glass-panel p-5 rounded-2xl space-y-3 border-l-4 border-l-nasa-amber">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-nasa-amber uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  FEATURE DETAILS
                </span>
                <span className="text-[10px] font-mono text-slate-400">GEODESY PIN</span>
              </div>
              <h3 className="text-base font-bold font-mono text-white">{selectedPin.name}</h3>
              <div className="space-y-1 text-xs font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Coordinates:</span>
                  <span className="text-white font-bold">{selectedPin.lat}, {selectedPin.lon}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Geological Type:</span>
                  <span className="text-nasa-cyan">{selectedPin.type}</span>
                </div>
              </div>

              {currentSample && (
                <div className="pt-2">
                  <button
                    onClick={() => onSelectSampleForAnalysis(currentSample)}
                    className="w-full py-2 px-3 rounded-lg bg-nasa-cyan text-space-950 font-bold font-mono text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Analysis on Area</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-5 rounded-2xl space-y-2 text-center text-xs font-mono text-slate-400">
              <MapPin className="w-6 h-6 text-slate-500 mx-auto" />
              <p>Click on any marker pin on the map to inspect planetary coordinates and geological details.</p>
            </div>
          )}

          {/* Geological Point-of-Interest Roster */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold font-mono text-white flex items-center justify-between border-b border-space-700/60 pb-2">
              <span>{selectedPlanet.toUpperCase()} SATELLITE STATIONS ({pois.length})</span>
              <span className="text-[10px] font-mono text-nasa-cyan">GLOBAL MAPPING</span>
            </h3>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {pois.map((poi) => (
                <div
                  key={poi.id}
                  onClick={() => setSelectedPin(poi)}
                  className={`p-2.5 rounded-lg border text-xs font-mono cursor-pointer transition-all ${
                    selectedPin?.id === poi.id
                      ? 'bg-nasa-cyan/15 border-nasa-cyan text-white shadow-sm'
                      : 'bg-space-850/60 border-space-700/70 hover:border-slate-500 text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-white truncate">{poi.name}</div>
                  <div className="flex justify-between items-center text-[10.5px] text-slate-400 mt-1">
                    <span>{poi.lat}, {poi.lon}</span>
                    <span className="text-nasa-cyan">{poi.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

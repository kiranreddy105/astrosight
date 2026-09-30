import React, { useState, useRef, useEffect } from 'react';
import {
  Crosshair,
  Sliders,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckSquare,
  Square,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';
import { AnalysisRecord, Crater } from '../../types';

interface CraterDetectionProps {
  activeAnalysis: AnalysisRecord | null;
  onNavigate: (tab: string) => void;
  onSelectCraterForSpatial?: (crater: Crater) => void;
}

export const CraterDetection: React.FC<CraterDetectionProps> = ({
  activeAnalysis,
  onNavigate,
  onSelectCraterForSpatial
}) => {
  // Toggle states
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [showBoundaries, setShowBoundaries] = useState<boolean>(true);
  const [showCenterPoints, setShowCenterPoints] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  
  // Interactive zoom & pan
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [hoveredCrater, setHoveredCrater] = useState<Crater | null>(null);
  const [selectedCrater, setSelectedCrater] = useState<Crater | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState<number>(50.0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const craters = (activeAnalysis?.craters || []).filter(
    (c) => c.confidence >= confidenceFilter
  );

  // Load image when activeAnalysis changes
  useEffect(() => {
    if (!activeAnalysis?.image_url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = activeAnalysis.image_url;
    img.onload = () => {
      imgRef.current = img;
      renderCanvas();
    };
  }, [activeAnalysis?.image_url]);

  // Redraw canvas whenever settings or hover/selection changes
  useEffect(() => {
    renderCanvas();
  }, [
    activeAnalysis,
    showOverlays,
    showBoundaries,
    showCenterPoints,
    showLabels,
    showBoundingBoxes,
    zoomLevel,
    hoveredCrater,
    selectedCrater,
    confidenceFilter
  ]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match natural image aspect
    const baseW = img.naturalWidth || 800;
    const baseH = img.naturalHeight || 800;
    canvas.width = baseW;
    canvas.height = baseH;

    // Clear and draw satellite base layer
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (!showOverlays) return;

    // Render each detected crater
    craters.forEach((c) => {
      const isHovered = hoveredCrater?.index === c.index;
      const isSelected = selectedCrater?.index === c.index;
      
      const strokeColor = isSelected ? '#ffaa00' : isHovered ? '#ffffff' : '#00f0ff';
      const lineWidth = isSelected ? 3 : isHovered ? 2.5 : 1.8;

      // 1. Crater Boundary Circle
      if (showBoundaries) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, 2 * Math.PI);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = strokeColor;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = isHovered || isSelected ? 12 : 5;
        ctx.stroke();

        // Subtle shaded translucent fill on hover/select
        if (isHovered || isSelected) {
          ctx.fillStyle = isSelected ? 'rgba(255, 170, 0, 0.15)' : 'rgba(0, 240, 255, 0.12)';
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Corner Reticles / Bounding Box
      if (showBoundingBoxes) {
        ctx.save();
        const r = c.radius;
        const x1 = c.x - r;
        const y1 = c.y - r;
        const x2 = c.x + r;
        const y2 = c.y + r;
        const retLen = Math.max(6, r * 0.28);

        ctx.strokeStyle = isSelected ? '#ffaa00' : 'rgba(0, 240, 255, 0.6)';
        ctx.lineWidth = 1.5;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(x1, y1 + retLen);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x1 + retLen, y1);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(x2 - retLen, y1);
        ctx.lineTo(x2, y1);
        ctx.lineTo(x2, y1 + retLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x1, y2 - retLen);
        ctx.lineTo(x1, y2);
        ctx.lineTo(x1 + retLen, y2);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x2 - retLen, y2);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x2, y2 - retLen);
        ctx.stroke();

        ctx.restore();
      }

      // 3. Center Crosshair Dot
      if (showCenterPoints) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(c.x, c.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = strokeColor;
        ctx.fill();

        // Cross ticks
        const tLen = 6;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(c.x - tLen, c.y);
        ctx.lineTo(c.x + tLen, c.y);
        ctx.moveTo(c.x, c.y - tLen);
        ctx.lineTo(c.x, c.y + tLen);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Aerospace HUD Label (#01 | 98.2%)
      if (showLabels) {
        ctx.save();
        const label = `#${c.index.toString().padStart(2, '0')} | ${c.confidence.toFixed(1)}%`;
        ctx.font = 'bold 11px ui-monospace, SFMono-Regular, monospace';
        const textWidth = ctx.measureText(label).width;
        
        const labelX = c.x - textWidth / 2;
        const labelY = Math.max(16, c.y - c.radius - 8);

        // Badge background
        ctx.fillStyle = 'rgba(4, 7, 17, 0.85)';
        ctx.fillRect(labelX - 4, labelY - 12, textWidth + 8, 16);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(labelX - 4, labelY - 12, textWidth + 8, 16);

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, labelX, labelY);
        ctx.restore();
      }
    });
  };

  // Canvas Mouse Move for Hover Detection
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Check if mouse is inside any crater circle
    let matched: Crater | null = null;
    for (const c of craters) {
      const dist = Math.sqrt((mouseX - c.x) ** 2 + (mouseY - c.y) ** 2);
      if (dist <= c.radius) {
        matched = c;
        break;
      }
    }
    setHoveredCrater(matched);
  };

  const handleCanvasClick = () => {
    if (hoveredCrater) {
      setSelectedCrater(hoveredCrater);
      if (onSelectCraterForSpatial) {
        onSelectCraterForSpatial(hoveredCrater);
      }
    } else {
      setSelectedCrater(null);
    }
  };

  if (!activeAnalysis) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12">
        <Crosshair className="w-12 h-12 text-slate-500 mx-auto animate-pulse" />
        <h3 className="text-lg font-bold font-mono text-white">No Planetary Analysis Loaded</h3>
        <p className="text-xs text-slate-400">
          Please run an analysis from the Image Analysis page or select a sample image to view crater detection overlays.
        </p>
        <button
          onClick={() => onNavigate('analysis')}
          className="px-5 py-2.5 rounded-lg bg-nasa-cyan text-space-950 font-bold font-mono text-xs uppercase tracking-wider hover:brightness-110 transition-all inline-flex items-center gap-2"
        >
          <span>Go to Image Analysis</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-space-700/60">
        <div>
          <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <span>CRATER DETECTION & HUD OVERLAYS</span>
            <span className="text-xs px-2 py-0.5 rounded bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/30 font-mono">
              {craters.length} CRATERS LOCALIZED
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Displaying satellite observation with multi-scale deep learning crater boundary regressions and confidence metrics.
          </p>
        </div>

        {/* Action button to Jump to Spatial Studio */}
        <button
          onClick={() => onNavigate('spatial')}
          className="px-4 py-2 rounded-lg bg-space-800 hover:bg-space-700 border border-nasa-cyan/40 text-nasa-cyan text-xs font-mono font-medium transition-all flex items-center gap-2"
        >
          <span>Open in Spatial Measurement Studio</span>
          <span>&rarr;</span>
        </button>
      </div>

      {/* Main Grid: Left Canvas Viewer (8 cols), Right Layer Toggles & Crater List (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas Visualizer Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel rounded-2xl p-4 border border-space-700/80 overflow-hidden relative">
            {/* Canvas Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-space-700/60 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-semibold">{activeAnalysis.filename}</span>
                <span className="text-slate-500">|</span>
                <span className="text-nasa-cyan">{activeAnalysis.resolution_m_px} m/px</span>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1.5 bg-space-850 p-1 rounded border border-space-700">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                  className="p-1 hover:text-nasa-cyan text-slate-400"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] px-1 text-slate-300">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                  className="p-1 hover:text-nasa-cyan text-slate-400"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1.0)}
                  className="p-1 hover:text-white text-slate-400"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Canvas Viewport */}
            <div className="relative overflow-auto max-h-[580px] bg-black/90 rounded-xl my-3 flex items-center justify-center border border-space-800">
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out'
                }}
              >
                <canvas
                  ref={canvasRef}
                  onMouseMove={handleCanvasMouseMove}
                  onClick={handleCanvasClick}
                  className="cursor-crosshair max-w-full block"
                />
              </div>

              {/* Hover Crater Telemetry Pip */}
              {hoveredCrater && (
                <div className="absolute bottom-4 left-4 px-3 py-2 rounded-lg bg-black/85 border border-nasa-cyan/60 text-xs font-mono shadow-2xl backdrop-blur-md pointer-events-none">
                  <div className="text-nasa-cyan font-bold">
                    {hoveredCrater.name || `Crater #${hoveredCrater.index.toString().padStart(2, '0')}`}
                  </div>
                  <div className="text-slate-300 text-[11px] mt-0.5 space-x-2">
                    <span>X: {hoveredCrater.x.toFixed(1)}</span>
                    <span>Y: {hoveredCrater.y.toFixed(1)}</span>
                    <span>R: {hoveredCrater.radius.toFixed(1)}px</span>
                    <span className="text-nasa-emerald font-bold">{hoveredCrater.confidence.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Telemetry Legend */}
            <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-space-700/60">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border border-nasa-cyan bg-nasa-cyan/20" />
                  Crater Boundary
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  Centroid Coordinates
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 border border-nasa-amber bg-nasa-amber/20" />
                  Selected Focus
                </span>
              </div>
              <span>Click on any crater to select and inspect</span>
            </div>
          </div>
        </div>

        {/* Right: Layer Toggles & Crater Catalog (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Layer Controls Panel */}
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold font-mono text-white flex items-center gap-1.5 border-b border-space-700/60 pb-2">
              <Sliders className="w-3.5 h-3.5 text-nasa-cyan" />
              <span>HUD DISPLAY LAYERS</span>
            </h3>

            <div className="space-y-2.5 font-mono text-xs">
              <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-space-800/40">
                <span className="text-slate-300">All Detection Overlays</span>
                <input
                  type="checkbox"
                  checked={showOverlays}
                  onChange={(e) => setShowOverlays(e.target.checked)}
                  className="rounded bg-space-800 border-space-600 text-nasa-cyan focus:ring-nasa-cyan"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-space-800/40">
                <span className="text-slate-300">Crater Boundaries (Circles)</span>
                <input
                  type="checkbox"
                  checked={showBoundaries}
                  onChange={(e) => setShowBoundaries(e.target.checked)}
                  className="rounded bg-space-800 border-space-600 text-nasa-cyan focus:ring-nasa-cyan"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-space-800/40">
                <span className="text-slate-300">Center Points (Crosshairs)</span>
                <input
                  type="checkbox"
                  checked={showCenterPoints}
                  onChange={(e) => setShowCenterPoints(e.target.checked)}
                  className="rounded bg-space-800 border-space-600 text-nasa-cyan focus:ring-nasa-cyan"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-space-800/40">
                <span className="text-slate-300">Confidence Scores & IDs</span>
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                  className="rounded bg-space-800 border-space-600 text-nasa-cyan focus:ring-nasa-cyan"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-space-800/40">
                <span className="text-slate-300">Bounding Reticles (Boxes)</span>
                <input
                  type="checkbox"
                  checked={showBoundingBoxes}
                  onChange={(e) => setShowBoundingBoxes(e.target.checked)}
                  className="rounded bg-space-800 border-space-600 text-nasa-cyan focus:ring-nasa-cyan"
                />
              </label>
            </div>

            {/* Confidence Threshold Slider */}
            <div className="pt-3 border-t border-space-700/60 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Min Confidence Filter:</span>
                <span className="text-nasa-cyan font-bold">{confidenceFilter}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(parseFloat(e.target.value))}
                className="w-full accent-nasa-cyan bg-space-800 rounded h-1.5 cursor-pointer"
              />
            </div>
          </div>

          {/* Catalog of Detected Geological Features */}
          <div className="glass-panel p-5 rounded-2xl space-y-3 flex flex-col max-h-[380px]">
            <div className="flex items-center justify-between border-b border-space-700/60 pb-2">
              <h3 className="text-xs font-bold font-mono text-white">
                FEATURE ROSTER ({craters.length})
              </h3>
              <span className="text-[10px] font-mono text-slate-400">SORT: CONFIDENCE</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {craters.map((c) => {
                const isSelected = selectedCrater?.index === c.index;
                const diamMeters = c.radius * 2 * activeAnalysis.resolution_m_px;
                return (
                  <div
                    key={c.index}
                    onClick={() => setSelectedCrater(c)}
                    className={`p-2.5 rounded-lg border text-xs font-mono cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-nasa-amber/15 border-nasa-amber text-white shadow-sm'
                        : 'bg-space-850/60 border-space-700/70 hover:border-nasa-cyan/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-nasa-cyan">
                        #{c.index.toString().padStart(2, '0')}
                      </span>
                      <span className="text-nasa-emerald font-semibold">
                        {c.confidence.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                      <span>Coords: [{c.x.toFixed(0)}, {c.y.toFixed(0)}]</span>
                      <span>D: {diamMeters >= 1000 ? `${(diamMeters / 1000).toFixed(2)} km` : `${diamMeters.toFixed(0)} m`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

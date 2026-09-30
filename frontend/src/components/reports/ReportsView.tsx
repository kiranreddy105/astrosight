import React from 'react';
import {
  FileText,
  FileDown,
  Printer,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  Ruler,
  Crosshair,
  ExternalLink
} from 'lucide-react';
import { AnalysisRecord } from '../../types';
import { api } from '../../services/api';

interface ReportsViewProps {
  activeAnalysis: AnalysisRecord | null;
  onNavigate: (tab: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  activeAnalysis,
  onNavigate
}) => {
  if (!activeAnalysis) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 font-mono text-xs">
        <FileText className="w-12 h-12 text-slate-500 mx-auto animate-pulse" />
        <h3 className="text-lg font-bold text-white">No Analysis Report Available</h3>
        <p className="text-slate-400">
          Generate an analysis from the Image Analysis page to compile a publication-grade scientific PDF dossier.
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

  const pdfUrl = api.getReportDownloadUrl(activeAnalysis.id);
  const craters = activeAnalysis.craters || [];
  const measurements = activeAnalysis.measurements || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-space-700/60">
        <div>
          <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <span>ASTROSIGHT PLANETARY ANALYSIS DOSSIER</span>
            <span className="text-xs px-2 py-0.5 rounded bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/30 font-mono">
              REPORT REF: {activeAnalysis.id.slice(0, 8).toUpperCase()}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated publication-grade scientific report with raw imagery, CNN detections, coordinates, and spatial calculations.
          </p>
        </div>

        {/* Prominent PDF Download Button */}
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-nasa-cyan to-blue-600 hover:brightness-110 text-space-950 font-bold font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-nasa-cyan/20 glow-border-cyan"
        >
          <FileDown className="w-4 h-4" />
          <span>DOWNLOAD SCIENTIFIC PDF REPORT</span>
        </a>
      </div>

      {/* Report Dossier Container */}
      <div className="glass-panel p-8 rounded-2xl border border-space-700/80 space-y-6 max-w-4xl mx-auto shadow-2xl">
        {/* Report Document Header */}
        <div className="border-b-2 border-nasa-cyan pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono text-nasa-cyan font-bold tracking-wider">
              ASTROSIGHT PLANETARY SURFACE INTELLIGENCE
            </div>
            <h1 className="text-2xl font-extrabold font-mono text-white tracking-tight mt-0.5">
              Crater Identification & Spatial Analysis Report
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Mission Operations AI Laboratory • Department of Planetary Geodesy
            </p>
          </div>

          <div className="text-right font-mono text-xs text-slate-400 space-y-0.5">
            <div>TARGET: <strong className="text-white">{activeAnalysis.planet.toUpperCase()}</strong></div>
            <div>STATUS: <strong className="text-nasa-emerald">ANALYSIS VERIFIED</strong></div>
            <div>DATE: {new Date(activeAnalysis.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Telemetry Summary Metadata Table (Section 21) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 rounded-lg bg-space-850/60 border border-space-700/60">
            <span className="text-[10.5px] text-slate-400 block">Source Image:</span>
            <span className="font-bold text-white block mt-0.5 truncate">{activeAnalysis.filename}</span>
          </div>
          <div className="p-3 rounded-lg bg-space-850/60 border border-space-700/60">
            <span className="text-[10.5px] text-slate-400 block">Spatial Resolution:</span>
            <span className="font-bold text-nasa-cyan block mt-0.5">{activeAnalysis.resolution_m_px} m / pixel</span>
          </div>
          <div className="p-3 rounded-lg bg-space-850/60 border border-space-700/60">
            <span className="text-[10.5px] text-slate-400 block">Detected Craters:</span>
            <span className="font-bold text-white block mt-0.5">{activeAnalysis.crater_count}</span>
          </div>
          <div className="p-3 rounded-lg bg-space-850/60 border border-space-700/60">
            <span className="text-[10.5px] text-slate-400 block">Mean Confidence:</span>
            <span className="font-bold text-nasa-emerald block mt-0.5">{activeAnalysis.average_confidence.toFixed(1)}%</span>
          </div>
        </div>

        {/* Satellite Imagery Visual Exhibits (Original & Annotated) */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold font-mono text-white tracking-wider uppercase flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-nasa-cyan" />
            <span>SATELLITE OBSERVATION EXHIBITS</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-56 bg-black rounded-xl overflow-hidden border border-space-700 flex items-center justify-center">
                <img
                  src={activeAnalysis.image_url}
                  alt="Raw Satellite Frame"
                  className="max-h-full w-full object-contain"
                />
              </div>
              <p className="text-[11px] font-mono text-slate-400 text-center">
                Exhibit A: Raw Planetary Satellite Image
              </p>
            </div>

            <div className="space-y-2">
              <div className="h-56 bg-black rounded-xl overflow-hidden border border-space-700 flex items-center justify-center">
                <img
                  src={activeAnalysis.annotated_image_url || activeAnalysis.image_url}
                  alt="CraterNet Annotations"
                  className="max-h-full w-full object-contain"
                />
              </div>
              <p className="text-[11px] font-mono text-nasa-cyan text-center">
                Exhibit B: CraterNet CNN Detection HUD Overlays
              </p>
            </div>
          </div>
        </div>

        {/* Crater Coordinates Table (Section 8 & 21) */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold font-mono text-white tracking-wider uppercase flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-nasa-cyan" />
            <span>DETECTED CRATER COORDINATE CATALOG (Cᵢ = [xᵢ, yᵢ])</span>
          </h3>

          <div className="overflow-x-auto rounded-xl border border-space-700">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-space-850/80 text-slate-400 border-b border-space-700">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Centroid X</th>
                  <th className="py-2.5 px-3">Centroid Y</th>
                  <th className="py-2.5 px-3">Radius (px)</th>
                  <th className="py-2.5 px-3">Diameter (m)</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-800 text-slate-300">
                {craters.slice(0, 8).map((c) => {
                  const diamM = c.radius * 2 * activeAnalysis.resolution_m_px;
                  return (
                    <tr key={c.index} className="hover:bg-space-800/40">
                      <td className="py-2 px-3 font-bold text-nasa-cyan">#{c.index.toString().padStart(2, '0')}</td>
                      <td className="py-2 px-3">{c.x.toFixed(1)}</td>
                      <td className="py-2 px-3">{c.y.toFixed(1)}</td>
                      <td className="py-2 px-3">{c.radius.toFixed(1)} px</td>
                      <td className="py-2 px-3">{diamM.toFixed(0)} m</td>
                      <td className="py-2 px-3 text-nasa-emerald font-semibold">{c.confidence.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-white font-medium">IMPACT CRATER</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Spatial Measurements Table (Section 21) */}
        {measurements.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold font-mono text-white tracking-wider uppercase flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-nasa-cyan" />
              <span>SPATIAL GEODESIC MEASUREMENTS (d = &radic;((x₂ - x₁)&sup2; + (y₂ - y₁)&sup2;))</span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-space-700">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-space-850/80 text-slate-400 border-b border-space-700">
                  <tr>
                    <th className="py-2.5 px-3">Feature Pair</th>
                    <th className="py-2.5 px-3">Crater A (x, y)</th>
                    <th className="py-2.5 px-3">Crater B (x, y)</th>
                    <th className="py-2.5 px-3">Pixel Dist.</th>
                    <th className="py-2.5 px-3">Ground Dist. (km)</th>
                    <th className="py-2.5 px-3">Bearing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-space-800 text-slate-300">
                  {measurements.slice(0, 6).map((m, idx) => (
                    <tr key={idx} className="hover:bg-space-800/40">
                      <td className="py-2 px-3 font-bold text-nasa-cyan">
                        #{m.crater_a_index.toString().padStart(2, '0')} &rarr; #{m.crater_b_index.toString().padStart(2, '0')}
                      </td>
                      <td className="py-2 px-3 text-slate-400">[{m.crater_a_x.toFixed(0)}, {m.crater_a_y.toFixed(0)}]</td>
                      <td className="py-2 px-3 text-slate-400">[{m.crater_b_x.toFixed(0)}, {m.crater_b_y.toFixed(0)}]</td>
                      <td className="py-2 px-3">{m.pixel_distance.toFixed(1)} px</td>
                      <td className="py-2 px-3 font-bold text-white">
                        {((m.pixel_distance * activeAnalysis.resolution_m_px) / 1000).toFixed(2)} km
                      </td>
                      <td className="py-2 px-3 text-nasa-amber">{m.bearing_deg || 0}°</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scientific Disclaimer Footer */}
        <div className="pt-4 border-t border-space-700/80 text-center text-[10px] font-mono text-slate-400 leading-relaxed">
          <p>
            <strong>Scientific Disclaimer:</strong> AstroSight is a research and educational prototype for automated planetary image analysis. Detection results depend on image quality, model performance, spatial resolution, and calibration parameters and should not be treated as authoritative scientific measurements without ground-truth validation.
          </p>
        </div>
      </div>
    </div>
  );
};

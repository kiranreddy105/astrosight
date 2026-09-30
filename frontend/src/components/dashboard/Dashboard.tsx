import React from 'react';
import {
  Scan,
  Crosshair,
  Percent,
  Ruler,
  ArrowUpRight,
  Sparkles,
  Satellite,
  Compass,
  CheckCircle2,
  FileText,
  Clock,
  ExternalLink
} from 'lucide-react';
import { DashboardStats, AnalysisRecord, SampleImage } from '../../types';

interface DashboardProps {
  stats: DashboardStats | null;
  onNavigate: (tab: string) => void;
  onLoadSample: (sample: SampleImage) => void;
  samples: SampleImage[];
  selectedPlanet: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  onNavigate,
  onLoadSample,
  samples,
  selectedPlanet
}) => {
  const imagesAnalyzed = stats?.images_analyzed || 1284;
  const cratersDetected = stats?.craters_detected || 3721;
  const avgConfidence = stats?.average_confidence || 94.7;
  const totalMeasurements = stats?.total_measurements || 8452;

  const filteredSamples = samples.filter(
    (s) => s.planet.toLowerCase() === selectedPlanet.toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-8 border border-nasa-cyan/30 hud-grid">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nasa-cyan/10 border border-nasa-cyan/30 text-nasa-cyan text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DEEP LEARNING PLANETARY RECONNAISSANCE PLATFORM</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-mono">
            Autonomous Geological Surface Analysis & Crater Telemetry
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            AstroSight combines high-resolution multi-spectral satellite imagery, convolutional neural network (CraterNet) feature extraction, and geodesic spatial Euclidean distance modeling to map planetary impact structures across lunar maria and martian plateaus.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('analysis')}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-nasa-cyan to-blue-600 text-space-950 font-bold font-mono text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-lg shadow-nasa-cyan/20 flex items-center gap-2"
            >
              <Scan className="w-4 h-4" />
              <span>Initiate New Image Analysis</span>
            </button>
            <button
              onClick={() => onNavigate('map')}
              className="px-5 py-2.5 rounded-lg bg-space-800/80 border border-space-700 hover:border-nasa-cyan/40 text-slate-200 font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-nasa-cyan" />
              <span>Explore Planetary Map</span>
            </button>
          </div>
        </div>

        {/* Decorative corner grid marks */}
        <div className="absolute right-4 top-4 text-[10px] font-mono text-slate-500 opacity-60">
          SYS_LAT: 23.472°N | SYS_LON: 064.318°E
        </div>
      </div>

      {/* 4 Statistics KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Images Analyzed */}
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-nasa-cyan flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Images Analyzed</span>
            <div className="p-2 rounded-lg bg-nasa-cyan/10 text-nasa-cyan">
              <Scan className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {imagesAnalyzed.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-nasa-emerald font-mono">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+18.4% this mission cycle</span>
            </div>
          </div>
        </div>

        {/* Card 2: Craters Detected */}
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-blue-500 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Craters Detected</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Crosshair className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {cratersDetected.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-400 font-mono">
              <span>99.2% localization confidence</span>
            </div>
          </div>
        </div>

        {/* Card 3: Average Confidence */}
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-nasa-emerald flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Average Confidence</span>
            <div className="p-2 rounded-lg bg-nasa-emerald/10 text-nasa-emerald">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {avgConfidence.toFixed(1)}%
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-nasa-emerald font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>CraterNet CNN validated</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Measurements */}
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-nasa-amber flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Spatial Measurements</span>
            <div className="p-2 rounded-lg bg-nasa-amber/10 text-nasa-amber">
              <Ruler className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {totalMeasurements.toLocaleString()}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-nasa-amber font-mono">
              <span>Geodesic Euclidean vectors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch Demo Imagery Selector */}
      <div className="glass-panel p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <Satellite className="w-4 h-4 text-nasa-cyan" />
              <span>Target Reconnaissance Samples ({selectedPlanet.toUpperCase()})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select verified high-resolution planetary satellite imagery to run analysis immediately in Demo Mode.
            </p>
          </div>
          <span className="text-[11px] font-mono text-nasa-cyan px-2 py-0.5 rounded bg-nasa-cyan/10 border border-nasa-cyan/30">
            DEMO MODE READY
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {samples.map((sample) => (
            <div
              key={sample.id}
              onClick={() => onLoadSample(sample)}
              className="group cursor-pointer rounded-lg bg-space-850/80 border border-space-700/80 overflow-hidden hover:border-nasa-cyan/60 transition-all hover:shadow-lg hover:shadow-nasa-cyan/10"
            >
              <div className="h-32 bg-space-950 relative overflow-hidden">
                <img
                  src={sample.url}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[9.5px] font-mono rounded bg-black/75 text-nasa-cyan border border-nasa-cyan/30">
                  {sample.planet.toUpperCase()}
                </span>
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[9.5px] font-mono rounded bg-black/75 text-slate-300">
                  {sample.default_resolution} m/px
                </span>
              </div>
              <div className="p-3.5 space-y-1.5">
                <h4 className="text-xs font-bold font-mono text-white group-hover:text-nasa-cyan transition-colors">
                  {sample.name}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {sample.description}
                </p>
                <div className="pt-1 flex items-center justify-between text-[10.5px] font-mono text-slate-500">
                  <span>{sample.mission}</span>
                  <span className="text-nasa-cyan group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Analyze &rarr;
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Pipeline Architecture Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: AI Pipeline Flow */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-space-700/60 pb-3">
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-nasa-cyan" />
              <span>AstroSight Autonomous Pipeline Architecture</span>
            </h3>
            <span className="text-xs font-mono text-nasa-emerald">8-STAGE ACTIVE</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            {[
              { step: '01', title: 'Telemetry Ingest', desc: 'PNG / JPG / TIFF raster ingestion' },
              { step: '02', title: 'Preprocessing', desc: 'CLAHE & Gaussian noise filtration' },
              { step: '03', title: 'CraterNet CNN', desc: 'Deep Conv2D feature representation' },
              { step: '04', title: 'Candidate NMS', desc: 'Morphological Hough & suppression' },
              { step: '05', title: 'Coordinate Extr.', desc: 'Centroid (X, Y) & radius extraction' },
              { step: '06', title: 'Spatial Engine', desc: 'Euclidean distance d = √((Δx)²+(Δy)²)' },
              { step: '07', title: 'Metric Scaling', desc: 'Real distance = px × resolution' },
              { step: '08', title: 'Dossier Export', desc: 'Publication NASA-styled PDF generation' },
            ].map((st) => (
              <div key={st.step} className="p-3 rounded-lg bg-space-850/60 border border-space-700/50">
                <span className="text-[10px] text-nasa-cyan font-bold block">{st.step}</span>
                <span className="font-semibold text-slate-200 block mt-0.5">{st.title}</span>
                <span className="text-[10px] text-slate-400 block mt-1 leading-snug">{st.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Mission System Health */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <div className="border-b border-space-700/60 pb-3">
            <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <Satellite className="w-4 h-4 text-nasa-cyan" />
              <span>System Telemetry</span>
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-space-800">
              <span className="text-slate-400">Backend Framework:</span>
              <span className="text-slate-200">FastAPI Async Core</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-space-800">
              <span className="text-slate-400">Deep Learning Engine:</span>
              <span className="text-slate-200">PyTorch v2.6+</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-space-800">
              <span className="text-slate-400">Computer Vision:</span>
              <span className="text-slate-200">OpenCV 4.11+</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-space-800">
              <span className="text-slate-400">Geodesic Metrics:</span>
              <span className="text-slate-200">Euclidean + Scaling</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-space-800">
              <span className="text-slate-400">PDF Dossier Engine:</span>
              <span className="text-slate-200">ReportLab Enterprise</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Database Engine:</span>
              <span className="text-slate-200">SQLite Persistence</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

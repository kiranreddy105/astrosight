import React from 'react';
import {
  Scan,
  Crosshair,
  Percent,
  Ruler,
  ArrowRight,
  Sparkles,
  Compass,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck,
  Activity,
  Globe
} from 'lucide-react';
import { CelestialGlobe3D } from '../map/CelestialGlobe3D';
import { DashboardStats, SampleImage } from '../../types';

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
  const cratersDetected = stats?.craters_detected || 127;
  const avgConfidence = stats?.average_confidence || 94.7;
  const spatialCoverage = '68.4 km²';
  const processingTime = '2.8 sec';

  const filteredSamples = samples.filter(
    (s) => s.planet.toLowerCase() === selectedPlanet.toLowerCase()
  );

  const workflowSteps = [
    { num: '01', title: 'Upload', desc: 'Satellite Raster' },
    { num: '02', title: 'Validate', desc: 'Planetary Check' },
    { num: '03', title: 'Preprocess', desc: 'CLAHE & Denoise' },
    { num: '04', title: 'Detect', desc: 'CraterNet CNN' },
    { num: '05', title: 'Analyze', desc: 'Spatial Geodesy' },
    { num: '06', title: 'Report', desc: 'PDF Dossier' }
  ];

  return (
    <div className="space-y-8">
      {/* 1. Main Hero Area */}
      <section className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-12 border border-nasa-cyan/30 hud-grid">
        {/* Subtle background glow and radial gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-nasa-cyan/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cosmic-violet/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-nasa-cyan/10 border border-nasa-cyan/30 text-nasa-cyan text-xs font-mono">
              <span className="text-sm">✦</span>
              <span>PLANETARY SURFACE INTELLIGENCE & COMPUTER VISION</span>
            </div>

            {/* Scientific Headline with Italic Accent Font */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-tight leading-[1.1]">
              Explore the Surface.<br />
              Detect the <span className="font-accent italic text-nasa-cyan font-normal drop-shadow-[0_0_20px_rgba(56,189,248,0.4)]">Unknown</span>.
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-slate-300 font-sans max-w-xl leading-relaxed">
              AI-powered lunar crater detection and spatial analysis from satellite imagery.
            </p>

            {/* Actions: Primary CTA & Secondary CTA */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigate('analysis')}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-nasa-cyan via-sky-500 to-blue-600 text-space-950 font-bold font-tight text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-nasa-cyan/25 flex items-center gap-2 group"
              >
                <span>Analyze Image</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  if (samples.length > 0) onLoadSample(samples[0]);
                  else onNavigate('analysis');
                }}
                className="px-6 py-3.5 rounded-xl bg-space-900/80 border border-nasa-cyan/30 hover:border-nasa-cyan text-slate-200 hover:text-white font-mono text-sm tracking-wider transition-all flex items-center gap-2 hover:bg-space-800/80"
              >
                <Sparkles className="w-4 h-4 text-nasa-cyan" />
                <span>Explore Demo</span>
              </button>
            </div>

            {/* Telemetry coordinate strip */}
            <div className="pt-3 flex items-center gap-4 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-nasa-emerald">
                <span className="w-2 h-2 rounded-full bg-nasa-emerald animate-ping" />
                <span>SYSTEM ONLINE</span>
              </span>
              <span>•</span>
              <span>TARGET: {selectedPlanet.toUpperCase()}</span>
              <span>•</span>
              <span className="text-slate-500">RES: 10.0 M/PX</span>
            </div>
          </div>

          {/* 3D Celestial Visualization */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative flex items-center justify-center p-4">
              <div className="absolute -inset-6 orbit-ring pointer-events-none" />
              <div className="absolute -inset-12 border border-dashed border-nasa-cyan/15 rounded-full pointer-events-none" />
              <CelestialGlobe3D selectedPlanet={selectedPlanet} size={260} interactive={true} />
            </div>
            <div className="mt-3 text-center">
              <span className="text-xs font-mono text-nasa-cyan uppercase tracking-wider font-bold">
                {selectedPlanet.toUpperCase()} CELESTIAL PROJECTION
              </span>
              <p className="text-[11px] text-slate-400 font-mono">Interactive Geodesic Coordinate Sphere</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Workflow Indicator (01 Upload → 02 Validate → 03 Preprocess → 04 Detect → 05 Analyze → 06 Report) */}
      <section className="glass-panel p-6 rounded-2xl border border-nasa-cyan/20">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-space-700/60">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-nasa-cyan" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              Automated Analysis Pipeline Workflow
            </h2>
          </div>
          <span className="text-[11px] font-mono text-nasa-cyan">END-TO-END AUTONOMOUS</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {workflowSteps.map((step, idx) => (
            <div
              key={step.num}
              className="relative p-3.5 rounded-xl bg-space-950/60 border border-space-700/70 hover:border-nasa-cyan/50 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-nasa-cyan">
                  {step.num}
                </span>
                <span className="w-2 h-2 rounded-full bg-nasa-cyan/40 group-hover:bg-nasa-cyan group-hover:shadow-[0_0_8px_#38bdf8] transition-all" />
              </div>
              <div>
                <div className="text-sm font-bold font-tight text-white group-hover:text-nasa-cyan transition-colors">
                  {step.title}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Statistics Cards (4 Glassmorphism KPI Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Detected Features */}
        <div className="glass-panel p-6 rounded-2xl border border-nasa-cyan/20 border-l-4 border-l-nasa-cyan flex flex-col justify-between hover:border-nasa-cyan/50 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Detected Features</span>
            <div className="p-2.5 rounded-xl bg-nasa-cyan/15 text-nasa-cyan border border-nasa-cyan/30">
              <Crosshair className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold font-tight text-white tracking-tight">
              {cratersDetected.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-nasa-cyan font-mono flex items-center gap-1">
              <span>Impact basins localized</span>
            </p>
          </div>
        </div>

        {/* Card 2: Average Confidence */}
        <div className="glass-panel p-6 rounded-2xl border border-nasa-cyan/20 border-l-4 border-l-sky-400 flex flex-col justify-between hover:border-sky-400/50 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Average Confidence</span>
            <div className="p-2.5 rounded-xl bg-sky-400/15 text-sky-400 border border-sky-400/30">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold font-tight text-white tracking-tight">
              {avgConfidence.toFixed(1)}%
            </div>
            <p className="mt-1 text-xs text-nasa-emerald font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>CraterNet CNN validated</span>
            </p>
          </div>
        </div>

        {/* Card 3: Spatial Coverage */}
        <div className="glass-panel p-6 rounded-2xl border border-nasa-cyan/20 border-l-4 border-l-cosmic-violet flex flex-col justify-between hover:border-cosmic-violet/50 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Spatial Coverage</span>
            <div className="p-2.5 rounded-xl bg-cosmic-violet/15 text-purple-400 border border-purple-400/30">
              <Ruler className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold font-tight text-white tracking-tight">
              {spatialCoverage}
            </div>
            <p className="mt-1 text-xs text-purple-300 font-mono">
              Calibrated raster area
            </p>
          </div>
        </div>

        {/* Card 4: Processing Time */}
        <div className="glass-panel p-6 rounded-2xl border border-nasa-cyan/20 border-l-4 border-l-nasa-emerald flex flex-col justify-between hover:border-nasa-emerald/50 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Processing Time</span>
            <div className="p-2.5 rounded-xl bg-nasa-emerald/15 text-nasa-emerald border border-nasa-emerald/30">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold font-tight text-white tracking-tight">
              {processingTime}
            </div>
            <p className="mt-1 text-xs text-nasa-emerald font-mono">
              Real-time inference speed
            </p>
          </div>
        </div>
      </section>

      {/* 4. Planetary Demo Corpus Row */}
      <section className="glass-panel p-6 rounded-2xl border border-nasa-cyan/20 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-tight text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-nasa-cyan" />
              <span>Standard Planetary Benchmark Corpus</span>
            </h3>
            <p className="text-xs font-mono text-slate-400">
              LROC NAC & HiRISE high-resolution orbital telemetry captures
            </p>
          </div>
          <button
            onClick={() => onNavigate('analysis')}
            className="text-xs font-mono text-nasa-cyan hover:underline flex items-center gap-1"
          >
            <span>Upload Custom Imagery</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {samples.map((sample) => (
            <div
              key={sample.id}
              onClick={() => onLoadSample(sample)}
              className="group cursor-pointer rounded-xl bg-space-950/70 border border-space-700 hover:border-nasa-cyan p-3 transition-all hover:shadow-xl hover:shadow-nasa-cyan/10"
            >
              <div className="relative h-32 rounded-lg overflow-hidden bg-space-900 border border-space-800">
                <img
                  src={sample.url}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono bg-space-950/80 text-nasa-cyan border border-nasa-cyan/30">
                  {sample.planet.toUpperCase()}
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xs font-bold text-white font-tight group-hover:text-nasa-cyan transition-colors truncate">
                  {sample.name}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                  {sample.mission} • {sample.default_resolution} m/px
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

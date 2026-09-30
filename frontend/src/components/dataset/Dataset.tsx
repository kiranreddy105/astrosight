import React, { useState, useEffect } from 'react';
import {
  Database,
  Layers,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  PieChart,
  HardDrive,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../../services/api';

export const Dataset: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  useEffect(() => {
    api.getDatasetStats()
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  const handleSimulatedDatasetUpload = () => {
    setIsUploading(true);
    setUploadSuccess(false);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    }, 1500);
  };

  const total = stats?.total_images || 10400;
  const craters = stats?.classes?.crater_images || 5200;
  const nonCraters = stats?.classes?.non_crater_images || 5200;
  const train = stats?.splits?.training || 7280;
  const val = stats?.splits?.validation || 1560;
  const test = stats?.splits?.testing || 1560;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-space-700/60">
        <div>
          <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <span>PLANETARY CRATER BENCHMARK DATASET</span>
            <span className="text-xs px-2 py-0.5 rounded bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/30 font-mono">
              PCB-10K CORPUS
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Curated training, validation, and testing partitions from Lunar Reconnaissance Orbiter (LROC) and Mars HiRISE.
          </p>
        </div>

        {/* Dataset Upload Trigger */}
        <button
          onClick={handleSimulatedDatasetUpload}
          disabled={isUploading}
          className="px-4 py-2 rounded-lg bg-space-800 hover:bg-space-700 text-nasa-cyan border border-nasa-cyan/40 text-xs font-mono font-medium transition-all flex items-center gap-2 shadow-sm"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{isUploading ? 'Ingesting Dataset Archive...' : 'Upload Training Batches'}</span>
        </button>
      </div>

      {uploadSuccess && (
        <div className="p-4 rounded-xl bg-nasa-emerald/15 border border-nasa-emerald/40 text-nasa-emerald text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Dataset archive successfully validated and queued for CNN incremental retraining.</span>
        </div>
      )}

      {/* Dataset Statistics Cards (Section 22) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Images', val: total.toLocaleString(), color: 'text-nasa-cyan', sub: '128x128 Planetary Patches' },
          { label: 'Crater Images', val: craters.toLocaleString(), color: 'text-emerald-400', sub: 'Positive Class (50%)' },
          { label: 'Non-Crater Images', val: nonCraters.toLocaleString(), color: 'text-blue-400', sub: 'Negative Regolith (50%)' },
          { label: 'Training Split', val: train.toLocaleString(), color: 'text-purple-400', sub: '70% Model Optimization' },
          { label: 'Validation Split', val: val.toLocaleString(), color: 'text-nasa-amber', sub: '15% Hyperparameter Tuning' },
          { label: 'Test Split', val: test.toLocaleString(), color: 'text-sky-400', sub: '15% Unseen Evaluation' },
        ].map((item, idx) => (
          <div key={idx} className="glass-panel p-4 rounded-xl border border-space-700/80 flex flex-col justify-between">
            <span className="text-[10.5px] font-mono text-slate-400 uppercase tracking-tight block">
              {item.label}
            </span>
            <div className="my-2">
              <span className={`text-2xl font-bold font-mono ${item.color} tracking-tight`}>
                {item.val}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{item.sub}</span>
          </div>
        ))}
      </div>

      {/* Dataset Distribution & Planetary Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Class Balance Visualizer (6 cols) */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2 border-b border-space-700/60 pb-3">
            <PieChart className="w-4 h-4 text-nasa-cyan" />
            <span>Class Balance & Split Breakdown</span>
          </h3>

          <div className="space-y-4 font-mono text-xs">
            {/* Binary Class Balance */}
            <div>
              <div className="flex justify-between items-center text-slate-300 pb-1.5">
                <span>Binary Classification Balance:</span>
                <span className="text-nasa-cyan font-bold">50.0% / 50.0% (Equally Balanced)</span>
              </div>
              <div className="h-3 w-full bg-space-950 rounded-full overflow-hidden flex border border-space-700">
                <div className="h-full bg-nasa-emerald" style={{ width: '50%' }} title="Crater Class (50%)" />
                <div className="h-full bg-blue-500" style={{ width: '50%' }} title="Non-Crater Regolith (50%)" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                <span className="text-nasa-emerald font-semibold">Crater Patches (5,200)</span>
                <span className="text-blue-400 font-semibold">Non-Crater Regolith (5,200)</span>
              </div>
            </div>

            {/* Split Breakdown */}
            <div className="pt-2">
              <div className="flex justify-between items-center text-slate-300 pb-1.5">
                <span>Partition Ratios:</span>
                <span className="text-slate-400">70% Train • 15% Val • 15% Test</span>
              </div>
              <div className="h-3 w-full bg-space-950 rounded-full overflow-hidden flex border border-space-700">
                <div className="h-full bg-purple-500" style={{ width: '70%' }} title="Training (70%)" />
                <div className="h-full bg-nasa-amber" style={{ width: '15%' }} title="Validation (15%)" />
                <div className="h-full bg-sky-400" style={{ width: '15%' }} title="Testing (15%)" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                <span>Training: 7,280</span>
                <span>Val: 1,560</span>
                <span>Test: 1,560</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Planetary Coverage Info (6 cols) */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2 border-b border-space-700/60 pb-3">
            <HardDrive className="w-4 h-4 text-nasa-cyan" />
            <span>Mission Sensor Calibration & Coverage</span>
          </h3>

          <div className="space-y-3 font-mono text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-space-850/70 border border-space-700/60 space-y-1">
              <span className="text-nasa-cyan font-bold block">🌕 Lunar Reconnaissance Orbiter (LROC)</span>
              <p className="text-[11px] text-slate-400">
                Narrow Angle Camera (NAC) photometric imagery covering Tycho Basin, Apollo 11 Mare Tranquillitatis, and Shackleton Crater.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-space-850/70 border border-space-700/60 space-y-1">
              <span className="text-nasa-red font-bold block">🔴 Mars Reconnaissance Orbiter (HiRISE & CTX)</span>
              <p className="text-[11px] text-slate-400">
                High-resolution Martian terrain surveys of Jezero Delta, Gale Crater, and Valles Marineris rim topography.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Sample Thumbnail Gallery */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-space-700/60 pb-3">
          <div>
            <h3 className="text-sm font-bold font-mono text-white">
              Dataset Patch Gallery Samples (128x128 Sub-Windows)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified ground-truth annotated training samples showing diverse illumination and planetary terrain types.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">STANDARDIZED SAMPLES</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {(stats?.sample_patches || []).map((p: any, idx: number) => {
            const isCrater = p.class === 'Crater';
            return (
              <div
                key={idx}
                className="rounded-xl bg-space-850 border border-space-700/80 overflow-hidden space-y-2 p-3 text-center"
              >
                <div className="h-24 w-full bg-space-950 rounded-lg flex items-center justify-center relative overflow-hidden border border-space-700">
                  {/* Procedural mini terrain patch */}
                  <div
                    className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center"
                    style={{
                      borderColor: isCrater ? '#00f0ff' : '#475569',
                      backgroundColor: isCrater ? 'rgba(0, 240, 255, 0.15)' : 'rgba(71, 85, 105, 0.15)'
                    }}
                  >
                    <span className="text-[10px] font-mono text-slate-300">
                      {isCrater ? 'Rim' : 'Flat'}
                    </span>
                  </div>
                  <span className="absolute top-1 left-1 px-1 text-[8.5px] font-mono rounded bg-black/80 text-nasa-cyan">
                    {p.planet}
                  </span>
                </div>
                <div>
                  <span
                    className={`text-xs font-mono font-bold block ${
                      isCrater ? 'text-nasa-emerald' : 'text-blue-400'
                    }`}
                  >
                    {p.class.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    Conf: {p.confidence}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Sparkles, Globe, Cpu, ShieldCheck, Database, Award } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="relative max-w-2xl w-full rounded-3xl glass-panel border border-nasa-cyan/40 p-6 sm:p-8 space-y-6 shadow-2xl hud-grid overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-space-800/80 hover:bg-space-700 text-slate-400 hover:text-white transition-colors"
          aria-label="Close About Dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-nasa-cyan/15 border border-nasa-cyan/40 flex items-center justify-center text-nasa-cyan shadow-[0_0_15px_rgba(56,189,248,0.3)]">
            <span className="text-xl font-bold">✦</span>
          </div>
          <div>
            <h2 id="about-modal-title" className="text-xl sm:text-2xl font-extrabold font-tight text-white">
              About AstroSight
            </h2>
            <p className="text-xs font-mono text-nasa-cyan">
              Autonomous Planetary Surface Intelligence System v2.0
            </p>
          </div>
        </div>

        {/* Body Description */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          <p>
            <strong>AstroSight</strong> is an advanced computer vision and spatial geodesy platform engineered for automated crater detection, morphological classification, and geospatial feature telemetry across high-resolution lunar and martian satellite imagery.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-space-950/70 border border-space-700/80 space-y-1">
              <div className="flex items-center gap-2 text-nasa-cyan font-bold">
                <Cpu className="w-4 h-4" />
                <span>CraterNet CNN</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Deep convolutional feature extractor calibrated against 10,400 benchmark orbital sub-windows.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-space-950/70 border border-space-700/80 space-y-1">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <Globe className="w-4 h-4" />
                <span>Geodesic Scaling</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Transforms pixel coordinate vectors into ground metric distances using LROC & HiRISE spatial scales.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-space-950/70 border border-space-700/80 space-y-1">
              <div className="flex items-center gap-2 text-nasa-emerald font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>IDOR & Role Security</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-tenant data isolation with cryptographic JWT tokens and enterprise rate limiting.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-space-950/70 border border-space-700/80 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Database className="w-4 h-4" />
                <span>Autonomous Reporting</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Streams publication-grade PDF telemetry dossiers and raw JSON analysis logs.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-space-700/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>BUILT FOR SCIENTIFIC EXPLORATION</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-nasa-cyan text-space-950 font-bold font-tight text-xs uppercase tracking-wider hover:brightness-110 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

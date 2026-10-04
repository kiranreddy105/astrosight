import React from 'react';

interface FooterProps {
  onNavigate?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="relative mt-20 border-t border-space-700/60 bg-space-950/80 backdrop-blur-md overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom,rgba(56,189,248,0.06),transparent_70%)]" />

      {/* Large low-opacity watermark */}
      <div 
        className="absolute left-1/2 -bottom-6 -translate-x-1/2 text-[14vw] font-black tracking-widest text-slate-500/5 select-none pointer-events-none whitespace-nowrap font-tight"
        aria-hidden="true"
      >
        ASTROSIGHT
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-8 z-10">
        {/* Brand & Supporting text */}
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-nasa-cyan font-bold text-lg">✦</span>
            <span className="font-tight font-extrabold text-lg tracking-wider text-white">ASTROSIGHT</span>
          </div>
          <p className="text-xs font-mono text-slate-400">
            AI-powered planetary surface intelligence
          </p>
          <p className="text-[11px] text-slate-500 max-w-md">
            Built for intelligent planetary exploration and geological analysis across Lunar and Martian reconnaissance imagery.
          </p>
        </div>

        {/* Links row */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-300">
          <button 
            onClick={() => onNavigate && onNavigate('about')} 
            className="hover:text-nasa-cyan transition-colors"
          >
            About AstroSight
          </button>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <button 
            onClick={() => onNavigate && onNavigate('model')} 
            className="hover:text-nasa-cyan transition-colors"
          >
            Research
          </button>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <button 
            onClick={() => onNavigate && onNavigate('dataset')} 
            className="hover:text-nasa-cyan transition-colors"
          >
            Methodology
          </button>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <a 
            href="/docs" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-nasa-cyan transition-colors"
          >
            Documentation
          </a>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <a 
            href="mailto:astrosight-mission@nasa.gov" 
            className="hover:text-nasa-cyan transition-colors"
          >
            Contact
          </a>
        </div>
      </div>

      {/* Bottom copyright line */}
      <div className="border-t border-space-800/80 py-4 px-6 text-center text-[10px] font-mono text-slate-500">
        <span>© {new Date().getFullYear()} AstroSight Autonomous Planetary Telemetry System. All rights reserved.</span>
      </div>
    </footer>
  );
};

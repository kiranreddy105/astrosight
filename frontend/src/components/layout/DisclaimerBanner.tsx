import React from 'react';
import { AlertCircle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-space-950/90 border-t border-space-800 py-2.5 px-6 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
      <AlertCircle className="w-3.5 h-3.5 text-nasa-cyan flex-shrink-0" />
      <span>
        <strong className="text-slate-300">SCIENTIFIC DISCLAIMER:</strong> AstroSight is a research and educational prototype for automated planetary image analysis. Detection results depend on image quality, model performance, spatial resolution, and calibration parameters and should not be treated as authoritative scientific measurements without validation.
      </span>
    </div>
  );
};

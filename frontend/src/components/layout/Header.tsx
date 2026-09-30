import React, { useState, useEffect } from 'react';
import {
  Clock,
  Activity,
  User as UserIcon,
  Shield,
  LogIn
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  selectedPlanet: string;
  setSelectedPlanet: (planet: string) => void;
  analyzedCount: number;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedPlanet,
  setSelectedPlanet,
  analyzedCount,
  isProcessing
}) => {
  const { user, isAuthenticated, openAuthModal, openAccountModal } = useAuth();
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-space-900/90 backdrop-blur-md border-b border-space-700/60 sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Title & Subtitle */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>AstroSight</span>
              <span className="text-xs font-mono font-normal text-slate-400">|</span>
              <span className="text-xs font-mono font-medium text-nasa-cyan uppercase tracking-wider">Mission Operations</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            AI-Powered Planetary Surface Intelligence & Crater Spatial Analysis
          </p>
        </div>
      </div>

      {/* Center: Planetary Target Selector */}
      <div className="flex items-center gap-2 bg-space-950/80 p-1 rounded-lg border border-space-700/80 shadow-inner">
        <button
          onClick={() => setSelectedPlanet('Moon')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium font-mono flex items-center gap-2 transition-all ${
            selectedPlanet === 'Moon'
              ? 'bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-sm">🌕</span>
          <span>MOON (LUNAR)</span>
        </button>

        <button
          onClick={() => setSelectedPlanet('Mars')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium font-mono flex items-center gap-2 transition-all ${
            selectedPlanet === 'Mars'
              ? 'bg-nasa-red/20 text-nasa-red border border-nasa-red/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-sm">🔴</span>
          <span>MARS (MARTIAN)</span>
        </button>
      </div>

      {/* Right: Live Telemetry, Mission Clock, and Auth Portal */}
      <div className="flex items-center gap-4 font-mono text-xs">
        {/* UTC Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-space-800/80 border border-space-700/60 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-nasa-cyan" />
          <span>{utcTime || '00:00:00 UTC'}</span>
        </div>

        {/* Processing / Status Pill */}
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-nasa-amber/15 text-nasa-amber border border-nasa-amber/30 text-xs font-mono animate-pulse">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>AI INFERENCE ACTIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-nasa-emerald/15 text-nasa-emerald border border-nasa-emerald/30 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-nasa-emerald animate-ping" />
              <span>READY</span>
            </div>
          )}
        </div>

        {/* User Badge / Quick Login */}
        <div className="border-l border-space-700/60 pl-3">
          {isAuthenticated && user ? (
            <button
              onClick={openAccountModal}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition-all cursor-pointer"
              title="Click to view Account Settings"
            >
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <UserIcon className="w-3 h-3" />
              </div>
              <span className="font-semibold text-xs">{user.full_name.split(' ')[0]}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                {user.role === 'admin' ? 'CDR' : 'SCI'}
              </span>
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-semibold text-xs transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>SIGN IN</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

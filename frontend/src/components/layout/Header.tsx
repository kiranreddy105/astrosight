import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Menu,
  X,
  ArrowRight,
  User as UserIcon,
  Shield,
  LogIn,
  Clock,
  Activity,
  Layers,
  Compass,
  FileText,
  Info,
  Scan,
  Crosshair
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedPlanet: string;
  setSelectedPlanet: (planet: string) => void;
  analyzedCount: number;
  isProcessing: boolean;
  onOpenAbout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedPlanet,
  setSelectedPlanet,
  analyzedCount,
  isProcessing,
  onOpenAbout
}) => {
  const { user, isAuthenticated, openAuthModal, openAccountModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analysis', label: 'Analyze Image' },
    { id: 'detection', label: 'Crater Detection' },
    { id: 'spatial', label: 'Spatial Analysis' },
    { id: 'reports', label: 'Reports' },
    { id: 'about', label: 'About' }
  ];

  const handleNavClick = (id: string) => {
    if (id === 'about') {
      if (onOpenAbout) onOpenAbout();
      else setActiveTab('about');
    } else {
      setActiveTab(id);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-6 py-3">
      {/* Floating Pill Navigation Container */}
      <div className="max-w-7xl mx-auto rounded-2xl bg-space-900/80 backdrop-blur-xl border border-nasa-cyan/20 shadow-2xl shadow-space-950/80 px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 group text-left focus:outline-none"
            aria-label="AstroSight Home"
          >
            <div className="w-8 h-8 rounded-lg bg-nasa-cyan/15 border border-nasa-cyan/40 flex items-center justify-center text-nasa-cyan group-hover:scale-105 group-hover:border-nasa-cyan transition-all shadow-[0_0_12px_rgba(56,189,248,0.25)]">
              <span className="text-base font-bold">✦</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-tight font-extrabold text-base tracking-wider text-white group-hover:text-nasa-cyan transition-colors">
                <span>AstroSight</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase block -mt-1">
                Planetary AI
              </span>
            </div>
          </button>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-space-950/60 p-1 rounded-xl border border-space-700/60" aria-label="Primary Navigation">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-space-800/60'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Target Selector, Status & Primary CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Target Planet Selector */}
          <div className="hidden sm:flex items-center gap-1 bg-space-950/80 p-0.5 rounded-lg border border-space-700/80">
            <button
              onClick={() => setSelectedPlanet('Moon')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium flex items-center gap-1 transition-all ${
                selectedPlanet === 'Moon'
                  ? 'bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🌕</span>
              <span>MOON</span>
            </button>
            <button
              onClick={() => setSelectedPlanet('Mars')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium flex items-center gap-1 transition-all ${
                selectedPlanet === 'Mars'
                  ? 'bg-nasa-red/20 text-nasa-red border border-nasa-red/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🔴</span>
              <span>MARS</span>
            </button>
          </div>

          {/* Primary CTA: Start Analysis */}
          <button
            onClick={() => setActiveTab('analysis')}
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-nasa-cyan via-sky-500 to-blue-600 text-space-950 font-bold font-tight text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md shadow-nasa-cyan/25 flex items-center gap-1.5"
          >
            <span>Start Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* User Auth Portal Icon */}
          {isAuthenticated && user ? (
            <button
              onClick={openAccountModal}
              className="w-8 h-8 rounded-lg bg-space-800 border border-space-700 hover:border-nasa-cyan/50 text-nasa-cyan flex items-center justify-center transition-all"
              title={`${user.full_name} (${user.role})`}
            >
              {user.role === 'admin' ? <Shield className="w-4 h-4 text-nasa-amber" /> : <UserIcon className="w-4 h-4" />}
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-800/80 border border-space-700 hover:border-nasa-cyan/40 text-slate-300 hover:text-white font-mono text-xs transition-all"
              title="Sign in for personal mission storage"
            >
              <LogIn className="w-3.5 h-3.5 text-nasa-cyan" />
              <span>Login</span>
            </button>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-space-800 border border-space-700 text-slate-300 hover:text-white"
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Navigation Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 max-w-7xl mx-auto rounded-2xl bg-space-900/95 backdrop-blur-2xl border border-nasa-cyan/30 p-5 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-space-700/60">
            <span className="text-xs font-mono text-slate-400">TARGET CELESTIAL BODY:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPlanet('Moon')}
                className={`px-3 py-1 rounded text-xs font-mono ${
                  selectedPlanet === 'Moon' ? 'bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/40' : 'text-slate-400'
                }`}
              >
                🌕 Moon
              </button>
              <button
                onClick={() => setSelectedPlanet('Mars')}
                className={`px-3 py-1 rounded text-xs font-mono ${
                  selectedPlanet === 'Mars' ? 'bg-nasa-red/20 text-nasa-red border border-nasa-red/40' : 'text-slate-400'
                }`}
              >
                🔴 Mars
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`px-4 py-2.5 rounded-lg text-left text-xs font-mono transition-all ${
                  activeTab === link.id
                    ? 'bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/40'
                    : 'bg-space-800/60 text-slate-300 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-nasa-cyan" />
              <span>{utcTime}</span>
            </div>
            {!isAuthenticated && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="text-nasa-cyan underline"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

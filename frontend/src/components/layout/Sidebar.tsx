import React from 'react';
import {
  LayoutDashboard,
  Scan,
  Crosshair,
  Ruler,
  Globe2,
  Cpu,
  Database,
  History,
  FileText,
  Radio,
  User as UserIcon,
  LogOut,
  Settings,
  Shield,
  LogIn,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemStatus: string;
  hasActiveAnalysis: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  systemStatus,
  hasActiveAnalysis
}) => {
  const { user, isAuthenticated, openAuthModal, openAccountModal, logout } = useAuth();

  const isCommander = user?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analysis', label: 'Image Analysis', icon: Scan },
    { id: 'detection', label: 'Crater Detection', icon: Crosshair, badge: hasActiveAnalysis ? 'Active' : undefined },
    { id: 'spatial', label: 'Spatial Analysis', icon: Ruler },
    { id: 'map', label: 'Planetary Map', icon: Globe2 },
    { id: 'performance', label: 'Model Performance', icon: Cpu },
    { id: 'dataset', label: 'Dataset', icon: Database },
    { id: 'history', label: 'Analysis History', icon: History },
    { id: 'reports', label: 'Reports', icon: FileText },
    ...(isCommander ? [{ id: 'personnel', label: 'Command Center', icon: Users, badge: 'CDR' }] : [])
  ];

  return (
    <aside className="w-64 bg-space-900 border-r border-space-700/60 flex flex-col h-screen fixed left-0 top-0 z-40 select-none">
      {/* Brand & Logo */}
      <div className="p-5 border-b border-space-700/60 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-nasa-cyan/20 to-nasa-blue flex items-center justify-center border border-nasa-cyan/40 shadow-lg shadow-nasa-cyan/10">
          <Crosshair className="w-6 h-6 text-nasa-cyan animate-pulse-subtle" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-wider text-white text-lg font-mono">ASTROSIGHT</span>
            <span className="text-[10px] px-1 py-0.5 rounded bg-nasa-cyan/20 text-nasa-cyan font-mono border border-nasa-cyan/30">v2.0</span>
          </div>
          <p className="text-[10.5px] text-slate-400 font-mono tracking-tight uppercase">Planetary Surface AI</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
          Mission Control
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-nasa-cyan/15 to-transparent text-nasa-cyan border-l-2 border-nasa-cyan font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-space-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-nasa-cyan' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/30 font-mono animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Authenticated User / Session Card */}
      <div className="px-3 py-2.5 border-t border-space-700/60 bg-space-950/40">
        {isAuthenticated && user ? (
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-white truncate">{user.full_name}</div>
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    <span>{user.role}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 pt-1 border-t border-slate-800">
              <button
                onClick={openAccountModal}
                title="Account Settings"
                className="flex-1 py-1 px-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-colors font-mono"
              >
                <Settings className="w-3 h-3 text-slate-400" />
                <span>Settings</span>
              </button>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 border border-red-500/20 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-2 px-3 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>COMMANDER LOGIN</span>
          </button>
        )}
      </div>

      {/* System Telemetry Readout */}
      <div className="p-3 border-t border-space-700/60 bg-space-950/70">
        <div className="space-y-1.5 text-[10.5px] font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-nasa-emerald animate-pulse" />
              SYSTEM STATUS:
            </span>
            <span className="text-nasa-emerald font-semibold">{systemStatus}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">AI MODEL:</span>
            <span className="text-nasa-cyan">CraterNet-v2</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">INFERENCE:</span>
            <span className="text-slate-300">PyTorch CNN</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

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
  Users,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemStatus: string;
  hasActiveAnalysis: boolean;
  isProcessing?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  systemStatus,
  hasActiveAnalysis,
  isProcessing = false
}) => {
  const { user, isAuthenticated, openAuthModal, openAccountModal, logout } = useAuth();

  const isCommander = user?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analysis', label: 'Image Analysis', icon: Scan },
    { id: 'detection', label: 'Crater Detection', icon: Crosshair, badge: hasActiveAnalysis ? 'Active' : undefined },
    { id: 'spatial', label: 'Spatial Analysis', icon: Ruler },
    { id: 'history', label: 'Analysis History', icon: History },
    { id: 'dataset', label: 'Dataset', icon: Database },
    { id: 'model', label: 'Model Performance', icon: Cpu },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'map', label: 'Planetary Map', icon: Globe2 },
    { id: 'settings', label: 'Settings', icon: Settings },
    ...(isCommander ? [{ id: 'personnel', label: 'Command Center', icon: Users, badge: 'CDR' }] : [])
  ];

  const handleItemClick = (id: string) => {
    if (id === 'settings') {
      openAccountModal();
    } else {
      setActiveTab(id);
    }
  };

  return (
    <aside className="w-64 bg-space-900 border-r border-space-700/60 flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand & Logo */}
      <div className="p-5 border-b border-space-700/60 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-nasa-cyan/15 flex items-center justify-center border border-nasa-cyan/40 shadow-lg shadow-nasa-cyan/10">
          <span className="text-xl font-bold text-nasa-cyan">✦</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-wider text-white text-lg font-tight">ASTROSIGHT</span>
            <span className="text-[10px] px-1 py-0.5 rounded bg-nasa-cyan/20 text-nasa-cyan font-mono border border-nasa-cyan/30">v2.0</span>
          </div>
          <p className="text-[10.5px] text-slate-400 font-mono tracking-tight uppercase">Planetary Surface AI</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto" aria-label="Mission Control Menu">
        <div className="px-3 pb-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
          Mission Control
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-nasa-cyan/15 to-transparent text-nasa-cyan border-l-2 border-nasa-cyan font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-space-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-nasa-cyan' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span className="font-mono text-xs">{item.label}</span>
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
          <div className="p-2.5 rounded-xl bg-space-900 border border-space-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-nasa-cyan/20 border border-nasa-cyan/40 flex items-center justify-center text-nasa-cyan flex-shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-white truncate">{user.full_name}</div>
                  <div className="text-[10px] font-mono text-nasa-cyan uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    <span>{user.role}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 pt-1 border-t border-space-800">
              <button
                onClick={openAccountModal}
                title="Account Settings"
                className="flex-1 py-1 px-2 rounded-lg bg-space-800 hover:bg-space-750 text-[11px] text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-colors font-mono"
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
            className="w-full py-2 px-3 bg-gradient-to-r from-nasa-cyan/20 to-blue-600/20 hover:from-nasa-cyan/35 hover:to-blue-600/35 border border-nasa-cyan/40 text-nasa-cyan rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm font-mono"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>COMMANDER LOGIN</span>
          </button>
        )}
      </div>

      {/* System Telemetry Readout */}
      <div className="p-3.5 border-t border-space-700/60 bg-space-950/80">
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
            <span className="text-nasa-cyan font-semibold">CraterNet-v2 (ONLINE)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">PROCESSING:</span>
            <span className={isProcessing ? 'text-amber-400 font-bold flex items-center gap-1' : 'text-slate-300'}>
              {isProcessing ? (
                <>
                  <Activity className="w-3 h-3 animate-spin" />
                  <span>ACTIVE</span>
                </>
              ) : (
                'READY'
              )}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

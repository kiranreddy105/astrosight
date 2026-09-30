import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Activity,
  UserCheck,
  TrendingUp,
  Globe,
  Radio,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Clock,
  Compass,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { AdminTelemetryResponse, ResearcherUserRecord, AuditEventRecord } from '../../types';

export const AdminPersonnel: React.FC = () => {
  const [data, setData] = useState<AdminTelemetryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'scientist' | 'admin'>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminTelemetry();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve mission telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const handleToggleStatus = async (user: ResearcherUserRecord) => {
    setUpdatingUserId(user.id);
    setStatusMessage(null);
    try {
      const newStatus = !user.is_active;
      await api.toggleUserStatus(user.id, newStatus);
      setStatusMessage(`Updated ${user.full_name}: account ${newStatus ? 'activated' : 'suspended'}.`);
      // Update local state
      if (data) {
        setData({
          ...data,
          researchers: data.researchers.map((r) =>
            r.id === user.id ? { ...r, is_active: newStatus } : r
          ),
        });
      }
    } catch (err: any) {
      setError(err.message || 'Status update failed.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredResearchers = data?.researchers.filter((r) => {
    const matchesSearch =
      r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'admin' && r.role === 'admin') ||
      (roleFilter === 'scientist' && r.role !== 'admin');
    return matchesSearch && matchesRole;
  }) || [];

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-mono text-slate-400">CONNECTING TO COMMANDER TELEMETRY STREAM...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 bg-red-950/30 border border-red-500/40 rounded-2xl text-center space-y-4 max-w-xl mx-auto">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="text-base font-bold text-white">COMMAND ACCESS DENIED</h3>
        <p className="text-xs text-red-300">{error}</p>
        <button
          onClick={fetchTelemetry}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
        >
          RETRY COMMAND HANDSHAKE
        </button>
      </div>
    );
  }

  const summary = data?.summary;
  const trend = data?.visitor_trend || [];
  const recentEvents = data?.recent_activity || [];

  // SVG Chart Dimensions
  const chartHeight = 120;
  const chartWidth = 600;
  const maxVisits = Math.max(...trend.map((p) => p.total_visits), 20);

  const getPoints = (key: 'total_visits' | 'unique_members') => {
    if (trend.length === 0) return '';
    const step = chartWidth / (trend.length - 1);
    return trend
      .map((p, idx) => {
        const x = idx * step;
        const y = chartHeight - (p[key] / maxVisits) * (chartHeight - 20) - 10;
        return `${x},${y}`;
      })
      .join(' ');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Ribbon */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 rounded-2xl p-6 shadow-xl shadow-cyan-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold tracking-wider uppercase">
              COMMAND CLEARANCE LEVEL 5
            </span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              TELEMETRY SYNCHRONIZED
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-cyan-400" />
            <span>MISSION PERSONNEL & GLOBAL ACCESS TELEMETRY</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real-time administrative ledger tracking planetary researcher account provisionings, daily authenticated member traffic, and operational security logs.
          </p>
        </div>

        <button
          onClick={fetchTelemetry}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>REFRESH LEDGER</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Researchers */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
              REGISTERED RESEARCHERS
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">
              {summary?.total_researchers ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {summary?.total_accounts ?? 0} total
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              +{summary?.new_researchers_this_week ?? 0} this week
            </span>
            <span className="text-slate-400">{summary?.total_admins ?? 1} Commander</span>
          </div>
        </div>

        {/* Card 2: Daily Active Members */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
              DAILY VISITING MEMBERS
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400">
              {summary?.today_active_members ?? 1}
            </span>
            <span className="text-xs text-slate-400 font-mono">signed-in today</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Authenticated Mission Personnel</span>
          </div>
        </div>

        {/* Card 3: Daily Total Platform Traffic */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
              DAILY GLOBAL TRAFFIC
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-indigo-300">
              {summary?.today_visitors_total ?? 1}
            </span>
            <span className="text-xs text-slate-400 font-mono">sessions today</span>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Members & Observers</span>
          </div>
        </div>

        {/* Card 4: Total Planetary Analyses */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
              PLATFORM ANALYSES
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-amber-300">
              {summary?.total_analyses_run ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-mono">runs</span>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-400">
            <span className="text-white font-semibold">
              {(summary?.total_craters_detected ?? 0).toLocaleString()}
            </span>{' '}
            craters classified
          </div>
        </div>
      </div>

      {/* 14-Day Visitor Trend Visualizer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>14-DAY MEMBER & VISITOR TELEMETRY TRENDLINE</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">CHRONOLOGICAL DAILY SESSIONS & ACTIVE RESEARCHERS</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-cyan-400 rounded-full" />
              <span className="text-slate-300">Total Visits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-emerald-400 rounded-full" />
              <span className="text-slate-300">Active Members</span>
            </div>
          </div>
        </div>

        {/* Responsive Area Chart */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px] h-[140px] relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="emeraldArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1={chartHeight - 10} x2={chartWidth} y2={chartHeight - 10} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1={(chartHeight - 10) / 2} x2={chartWidth} y2={(chartHeight - 10) / 2} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

              {/* Areas */}
              <polygon
                points={`0,${chartHeight - 10} ${getPoints('total_visits')} ${chartWidth},${chartHeight - 10}`}
                fill="url(#cyanArea)"
              />
              <polygon
                points={`0,${chartHeight - 10} ${getPoints('unique_members')} ${chartWidth},${chartHeight - 10}`}
                fill="url(#emeraldArea)"
              />

              {/* Polyline: Total Visits */}
              <polyline
                fill="none"
                stroke="#00f0ff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={getPoints('total_visits')}
              />

              {/* Polyline: Unique Members */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={getPoints('unique_members')}
              />

              {/* Points */}
              {trend.map((p, idx) => {
                const step = chartWidth / (trend.length - 1);
                const x = idx * step;
                const yVisits = chartHeight - (p.total_visits / maxVisits) * (chartHeight - 20) - 10;
                const yMembers = chartHeight - (p.unique_members / maxVisits) * (chartHeight - 20) - 10;
                return (
                  <g key={idx}>
                    <circle cx={x} cy={yVisits} r="3" fill="#00f0ff" />
                    <circle cx={x} cy={yMembers} r="3" fill="#10b981" />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Date Axis Labels */}
          <div className="min-w-[600px] flex justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">
            {trend.map((p, idx) => (
              <span key={idx} className="text-center w-8">
                {idx % 2 === 0 ? p.date : ''}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split: Researcher Directory Table + Live Event Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Researcher Roster */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>AUTHORIZED RESEARCHER DIRECTORY</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {filteredResearchers.length} registered personnel matching filters
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1 rounded transition-all ${
                  roleFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setRoleFilter('scientist')}
                className={`px-2.5 py-1 rounded transition-all ${
                  roleFilter === 'scientist' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                SCIENTISTS
              </button>
              <button
                onClick={() => setRoleFilter('admin')}
                className={`px-2.5 py-1 rounded transition-all ${
                  roleFilter === 'admin' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                COMMANDERS
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search researchers by name or email address..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-y border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Personnel</th>
                  <th className="py-2.5 px-3">Email & Focus</th>
                  <th className="py-2.5 px-3">Clearance</th>
                  <th className="py-2.5 px-3">Analyses</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredResearchers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No researchers found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredResearchers.map((r) => {
                    const isCommander = r.role === 'admin';
                    return (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white font-sans">{r.full_name}</div>
                          <div className="text-[10px] text-slate-500">
                            Joined {new Date(r.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-slate-300">{r.email}</div>
                          <div className="text-[10px] text-cyan-400 flex items-center gap-1">
                            <Compass className="w-2.5 h-2.5" />
                            <span>{r.planet_preference} Core</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isCommander
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            }`}
                          >
                            {isCommander ? 'COMMANDER' : 'SCIENTIST'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-white">
                          {r.analyses_count}
                        </td>
                        <td className="py-3 px-3">
                          {r.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-[10px]">
                              Suspended
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {!isCommander && (
                            <button
                              onClick={() => handleToggleStatus(r)}
                              disabled={updatingUserId === r.id}
                              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                r.is_active
                                  ? 'bg-red-950/30 hover:bg-red-900/50 text-red-400 border-red-500/30'
                                  : 'bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-400 border-emerald-500/30'
                              }`}
                              title={r.is_active ? 'Suspend Researcher Account' : 'Reactivate Researcher Account'}
                            >
                              {r.is_active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Live Security & Operational Event Feed */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4 flex flex-col">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>LIVE SECURITY AUDIT STREAM</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">REAL-TIME PLATFORM EVENT LEDGER</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[480px] pr-1 font-mono text-[11px]">
            {recentEvents.length === 0 ? (
              <p className="text-slate-500 text-center py-6">No recent events recorded.</p>
            ) : (
              recentEvents.map((evt) => {
                const isLogin = evt.action.includes('LOGIN');
                const isAnalysis = evt.action.includes('ANALYSIS');
                const isRegister = evt.action.includes('REGISTER');

                return (
                  <div
                    key={evt.id}
                    className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-bold px-1.5 py-0.2 rounded text-[9.5px] border ${
                          isLogin
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            : isAnalysis
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : isRegister
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {evt.action}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(evt.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-slate-300 truncate font-sans text-xs">
                      {evt.email}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>IP: {evt.ip_address}</span>
                      <span>ID #{evt.id}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

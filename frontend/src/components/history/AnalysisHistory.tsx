import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  Eye,
  FileDown,
  Calendar,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { AnalysisRecord } from '../../types';
import { api } from '../../services/api';

interface AnalysisHistoryProps {
  onSelectAnalysis: (analysis: AnalysisRecord) => void;
  onNavigate: (tab: string) => void;
}

export const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
  onSelectAnalysis,
  onNavigate
}) => {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [planetFilter, setPlanetFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [detailModal, setDetailModal] = useState<AnalysisRecord | null>(null);

  const fetchHistory = () => {
    setLoading(true);
    api.getHistory(searchTerm, planetFilter)
      .then((res) => {
        setAnalyses(res.analyses);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, [planetFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete analysis session ${id.slice(0, 8)}?`)) {
      return;
    }
    try {
      await api.deleteAnalysis(id);
      setAnalyses(analyses.filter((a) => a.id !== id));
      if (detailModal?.id === id) setDetailModal(null);
    } catch (err) {
      alert('Failed to delete analysis record.');
    }
  };

  const handleViewAnalysis = async (a: AnalysisRecord) => {
    try {
      const full = await api.getAnalysisById(a.id);
      onSelectAnalysis(full);
      onNavigate('detection');
    } catch (e) {
      onSelectAnalysis(a);
      onNavigate('detection');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-space-700/60">
        <div>
          <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <span>MISSION ANALYSIS ARCHIVE & TELEMETRY LOGS</span>
            <span className="text-xs px-2 py-0.5 rounded bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/30 font-mono">
              {analyses.length} SESSIONS RECORDED
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Searchable SQLite database storing all planetary surface observations, crater regressions, and spatial measurements.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by filename or analysis session ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-space-850 border border-space-700 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-nasa-cyan"
          />
        </form>

        {/* Planet Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="flex items-center gap-1 bg-space-850 p-1 rounded-lg border border-space-700">
            {['all', 'Moon', 'Mars'].map((p) => (
              <button
                key={p}
                onClick={() => setPlanetFilter(p)}
                className={`px-3 py-1 rounded text-xs font-mono capitalize transition-all ${
                  planetFilter.toLowerCase() === p.toLowerCase()
                    ? 'bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-space-700/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-space-700/80 text-slate-400 bg-space-850/60">
                <th className="py-3 px-4 font-semibold">ID</th>
                <th className="py-3 px-4 font-semibold">Filename</th>
                <th className="py-3 px-4 font-semibold">Target Body</th>
                <th className="py-3 px-4 font-semibold">Date & Time</th>
                <th className="py-3 px-4 font-semibold">Craters</th>
                <th className="py-3 px-4 font-semibold">Avg. Conf.</th>
                <th className="py-3 px-4 font-semibold">Resolution</th>
                <th className="py-3 px-4 font-semibold">Runtime</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-800/80 text-slate-300">
              {analyses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No historical analysis records found matching criteria.
                  </td>
                </tr>
              ) : (
                analyses.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleViewAnalysis(item)}
                    className="hover:bg-space-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-bold text-nasa-cyan">
                      {item.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white max-w-xs truncate">
                      {item.filename}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          item.planet.toLowerCase() === 'mars'
                            ? 'bg-nasa-red/20 text-nasa-red border border-nasa-red/30'
                            : 'bg-nasa-cyan/20 text-nasa-cyan border border-nasa-cyan/30'
                        }`}
                      >
                        {item.planet.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {item.crater_count}
                    </td>
                    <td className="py-3 px-4 text-nasa-emerald font-semibold">
                      {item.average_confidence.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {item.resolution_m_px} m/px
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {item.processing_time_ms.toFixed(0)} ms
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Download PDF Button */}
                        <a
                          href={api.getReportDownloadUrl(item.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded bg-space-800 hover:bg-space-700 text-nasa-cyan border border-space-700 hover:border-nasa-cyan transition-colors"
                          title="Download PDF Dossier"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </a>

                        {/* View in Inspector Button */}
                        <button
                          onClick={() => handleViewAnalysis(item)}
                          className="p-1.5 rounded bg-space-800 hover:bg-space-700 text-slate-300 border border-space-700 hover:text-white transition-colors"
                          title="View Analysis"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1.5 rounded bg-space-800 hover:bg-nasa-red/20 text-slate-400 hover:text-nasa-red border border-space-700 transition-colors"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

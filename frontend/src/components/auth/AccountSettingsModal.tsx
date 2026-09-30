import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Trash2, X, AlertTriangle, CheckCircle2, Shield, Save, KeyRound } from 'lucide-react';

export const AccountSettingsModal: React.FC = () => {
  const { user, accountModalOpen, closeAccountModal, updateProfile, changePassword, deleteAccount, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [planetPreference, setPlanetPreference] = useState<'Moon' | 'Mars'>(user?.planet_preference || 'Moon');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'danger'>('profile');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!accountModalOpen || !user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg(null);
    try {
      await updateProfile(fullName, planetPreference);
      setStatusMsg({ type: 'success', text: 'Planetary researcher credentials updated successfully.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setStatusMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setStatusMsg({ type: 'success', text: 'Passphrase successfully rotated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to change password. Verify current password.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsLoading(true);
    try {
      await deleteAccount();
      closeAccountModal();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to delete account.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">RESEARCHER ACCOUNT SETTINGS</h2>
              <p className="text-[11px] font-mono text-cyan-400">
                {user.role.toUpperCase()} // ID: {user.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <button
            onClick={closeAccountModal}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Pills */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-2 gap-2 text-xs">
          <button
            onClick={() => { setActiveTab('profile'); setStatusMsg(null); }}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Mission Profile
          </button>
          <button
            onClick={() => { setActiveTab('security'); setStatusMsg(null); }}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'security'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Change Passphrase
          </button>
          <button
            onClick={() => { setActiveTab('danger'); setStatusMsg(null); }}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'danger'
                ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Account Action
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start space-x-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/50 border border-red-500/40 text-red-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Institutional Email</label>
                <input
                  type="text"
                  disabled
                  value={user.email}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name & Scientific Rank</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Default Planetary Focus</label>
                <select
                  value={planetPreference}
                  onChange={(e) => setPlanetPreference(e.target.value as 'Moon' | 'Mars')}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="Moon">The Moon (Luna)</option>
                  <option value="Mars">Mars (Red Planet)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-600/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>SAVE PREFERENCES</span>
                </button>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Current Passphrase</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  placeholder="••••••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Passphrase</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  placeholder="Min 8 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Passphrase</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  placeholder="Repeat new passphrase"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-600/20"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>ROTATE PASSPHRASE</span>
                </button>
              </div>
            </form>
          )}

          {/* Danger Tab */}
          {activeTab === 'danger' && (
            <div className="space-y-4 p-4 bg-red-950/20 border border-red-500/30 rounded-xl">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>IRREVERSIBLE MISSION PURGE</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Deleting your researcher account will immediately destroy all linked satellite analyses, measurement dossiers, and private raster uploads. This action cannot be reversed.
              </p>

              {confirmDelete ? (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-red-950/60 border border-red-500 rounded-xl text-red-200 text-xs font-medium">
                    Are you absolutely certain you want to purge your AstroSight profile?
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                      className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl transition-colors"
                    >
                      CONFIRM PERMANENT DELETION
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="py-2 px-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>DELETE RESEARCHER ACCOUNT</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

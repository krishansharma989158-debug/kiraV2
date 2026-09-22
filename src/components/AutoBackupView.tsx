import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  RefreshCw,
  Clock,
  Trash2,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Play,
  Sliders,
  Sparkles,
  Database,
  Upload
} from 'lucide-react';
import { BackupItem, BackupConfig } from '../types';

interface AutoBackupViewProps {
  onBack?: () => void;
  onNavigate?: (tab: string) => void;
}

export const AutoBackupView: React.FC<AutoBackupViewProps> = ({ onBack, onNavigate }) => {
  const [config, setConfig] = useState<BackupConfig>({
    enabled: true,
    intervalMinutes: 60,
    maxBackups: 5,
    lastBackupAt: null,
    nextBackupAt: null
  });
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOfflineGuide, setShowOfflineGuide] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const formatInterval = (mins: number) => {
    if (mins < 60) return `${mins} mins`;
    const h = mins / 60;
    return `${h} hour${h > 1 ? 's' : ''}`;
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backups');
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig(data.config);
        if (data.backups) setBackups(data.backups);
      }
    } catch (err) {
      console.error('Error fetching backups:', err);
    }
  };

  useEffect(() => {
    fetchBackups();
    const interval = setInterval(fetchBackups, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = async (newConfig: Partial<BackupConfig>) => {
    setLoading(true);
    try {
      const res = await fetch('/api/backups/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, ...newConfig })
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setActionMessage({ type: 'success', text: 'Auto-backup settings updated!' });
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to save config' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManualBackup = async (format: 'zip' | 'mcworld' = 'zip') => {
    setLoading(true);
    setActionMessage({
      type: 'info',
      text: format === 'mcworld' ? 'Creating 1-click .mcworld archive...' : 'Creating offline world ZIP backup...'
    });
    try {
      const res = await fetch('/api/backups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });
      if (res.ok) {
        const data = await res.json();
        setActionMessage({
          type: 'success',
          text: `Backup "${data.filename}" created! Format: ${format.toUpperCase()}`
        });
        await fetchBackups();
      } else {
        throw new Error('Failed to create backup');
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to create backup' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`Restore world from "${filename}"? Current world will be replaced with this backup.`)) return;
    setLoading(true);
    setActionMessage({ type: 'info', text: `Restoring ${filename}...` });
    try {
      const res = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      if (res.ok) {
        setActionMessage({ type: 'success', text: `World restored from ${filename}!` });
        await fetchBackups();
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to restore' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Delete backup "${filename}"?`)) return;
    try {
      const res = await fetch(`/api/backups/${filename}`, { method: 'DELETE' });
      if (res.ok) {
        setBackups(prev => prev.filter(b => b.filename !== filename));
        setActionMessage({ type: 'success', text: 'Backup deleted.' });
        setTimeout(() => setActionMessage(null), 2500);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: 'Failed to delete backup' });
    }
  };

  const handleUploadZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setActionMessage({ type: 'info', text: `Uploading and restoring ZIP: ${file.name}...` });

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const res = await fetch('/api/backups/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, base64Data })
          });
          if (res.ok) {
            setActionMessage({ type: 'success', text: `World restored successfully from "${file.name}"!` });
            fetchBackups();
          } else {
            setActionMessage({ type: 'error', text: 'Failed to restore uploaded ZIP' });
          }
        } catch (e: any) {
          setActionMessage({ type: 'error', text: e.message || 'Upload error' });
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: 'Failed to read file' });
      setLoading(false);
    }
  };

  const handleDownloadZip = (filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/backups/download/${encodeURIComponent(filename)}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionMessage({ type: 'success', text: `Downloaded "${filename}" to your device!` });
    setTimeout(() => setActionMessage(null), 3000);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Toast message */}
      {actionMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : actionMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : actionMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 animate-spin" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Auto-Backup Engine Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Auto-Backup Engine</h2>
              <p className="text-[11px] text-slate-500">Continuous loop with auto-retention storage cleaner</p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => handleSaveConfig({ enabled: !config.enabled })}
            className={`w-12 h-6.5 rounded-full p-0.5 transition-colors relative flex items-center ${
              config.enabled ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                config.enabled ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Interval Selection (Minutes or Hours) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Backup Frequency (Loop)</span>
            <span className="font-bold text-emerald-700 font-mono">
              Every {formatInterval(config.intervalMinutes)}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[15, 30, 60, 120, 240, 360, 720, 1440].map((mins) => {
              const isSelected = config.intervalMinutes === mins;
              const label =
                mins === 15 ? '15m' :
                mins === 30 ? '30m' :
                mins === 60 ? '1 Hour' :
                mins === 120 ? '2 Hours' :
                mins === 240 ? '4 Hours' :
                mins === 360 ? '6 Hours' :
                mins === 720 ? '12 Hours' : '24 Hours';

              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleSaveConfig({ intervalMinutes: mins })}
                  className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Max Retention Limit (Storage Protection) */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-700 block">Storage Quota Protection</span>
              <span className="text-[10px] text-slate-400">
                New backup aane ke baad purane backups auto-delete ho jayenge taaki storage full na ho.
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
              Keep Max {config.maxBackups}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="range"
              min="2"
              max="15"
              value={config.maxBackups}
              onChange={(e) => handleSaveConfig({ maxBackups: parseInt(e.target.value, 10) })}
              className="flex-1 accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-600 w-8 text-right font-mono">
              {config.maxBackups}
            </span>
          </div>
        </div>

        {/* Manual Backup Trigger and Upload ZIP Button */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          {/* Create Offline ZIP */}
          <button
            type="button"
            onClick={() => handleCreateManualBackup('zip')}
            disabled={loading}
            className="flex-1 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-xs transition-all disabled:opacity-50"
            title="Create ZIP archive structured for Android minecraftWorlds folder"
          >
            <Database className="w-4 h-4" />
            <span>Create Offline ZIP</span>
          </button>

          {/* Create 1-Click .mcworld */}
          <button
            type="button"
            onClick={() => handleCreateManualBackup('mcworld')}
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-xs transition-all disabled:opacity-50"
            title="Create .mcworld archive for 1-tap import directly into Minecraft game"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create 1-Click .mcworld</span>
          </button>

          <label className="flex-1 cursor-pointer bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs border border-slate-300 transition-all">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Upload & Restore</span>
            <input
              type="file"
              accept=".zip,.mcworld"
              onChange={handleUploadZip}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={fetchBackups}
            title="Refresh Backups"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors self-center sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Links: Offline Guide & File Manager */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={() => setShowOfflineGuide(true)}
            className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
          >
            <span>📖 Offline Game Restore Guide</span>
          </button>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('files')}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
            >
              <span>📁 Open Backups in File Manager →</span>
            </button>
          )}
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900">
            Available World Backups ({backups.length})
          </h3>
          <span className="text-[10px] text-slate-400">
            Auto-rotates to max {config.maxBackups} (Offline ready)
          </span>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No backups stored yet. Click "Create Offline ZIP" or wait for the auto-backup loop.
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-800 text-[11px] truncate block max-w-[190px]">
                      {item.filename}
                    </span>
                    {item.isAuto ? (
                      <span className="text-[9px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded">
                        Auto
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded">
                        Manual
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                    <span>{item.sizeFormatted}</span>
                    <span>•</span>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownloadZip(item.filename)}
                    title="Download Backup File"
                    className="p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg font-bold flex items-center gap-1 text-[10px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRestoreBackup(item.filename)}
                    title="Restore This Backup"
                    className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-bold flex items-center gap-1 text-[10px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBackup(item.filename)}
                    title="Delete Backup"
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Offline Game Restore Guide Modal */}
      {showOfflineGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Offline Game Me World Kaise Restore Kare (Complete Guide)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowOfflineGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Method 1: 1-Click .mcworld (Sabse Asaan)</span>
                </div>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  <b>"Create 1-Click .mcworld"</b> banaye aur Download kare. Download hone ke baad file par ek baar click kare. Minecraft game apne aap open hoke world import kar lega!
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Method 2: Android Data Folder Me Direct Daalna</span>
                </div>
                <p className="text-amber-800 text-[11px]">
                  Offline Backup ZIP ko extract kare aur ZArchiver ya Mobile File Manager se is directory me copy/paste kare:
                </p>
                <div className="bg-white border border-amber-300 rounded-lg p-2 font-mono text-[11px] text-amber-950 select-all break-all">
                  Android/data/com.mojang.minecraftpe/files/games/com.mojang/minecraftWorlds/
                </div>
                <p className="text-[11px] text-amber-800">
                  Folder ke andar <code>levelname.txt</code>, <code>level.dat</code> aur <code>db/</code> folder zaroori hote hai, jo hamare backup structure me automatically add rehte hai.
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowOfflineGuide(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

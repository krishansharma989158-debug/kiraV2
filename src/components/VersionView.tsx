import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  PackageCheck,
  Check,
  Zap,
  Lock
} from 'lucide-react';
import { ServerData } from '../types';

interface VersionViewProps {
  serverData: ServerData | null;
  onRefresh: () => void;
}

export const VersionView: React.FC<VersionViewProps> = ({
  serverData,
  onRefresh
}) => {
  const currentActiveVersion = serverData?.activeVersion || '1.21.62.01';
  const availableVersions = serverData?.availableVersions || [
    '1.21.62.01',
    '1.21.61.01',
    '1.21.60.10',
    '1.21.51.02',
    '1.21.50.07',
    '1.21.44.01',
    '1.21.43.01',
    '1.21.30.03'
  ];

  const [selectedVersion, setSelectedVersion] = useState<string>(currentActiveVersion);
  const [manualVersion, setManualVersion] = useState<string>('');
  const [customZipUrl, setCustomZipUrl] = useState<string>('');
  const [mode, setMode] = useState<'preset' | 'manual'>('preset');
  const [updating, setUpdating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (serverData?.activeVersion) {
      setSelectedVersion(serverData.activeVersion);
    }
  }, [serverData?.activeVersion]);

  const handleVersionUpdate = async () => {
    const targetVersion = mode === 'preset' ? selectedVersion : manualVersion.trim();
    if (!targetVersion && !customZipUrl.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please select a version or enter a manual version number.'
      });
      return;
    }

    setUpdating(true);
    setStatusMessage({
      type: 'info',
      text: `Downloading and configuring Bedrock version v${targetVersion || 'custom'}...`
    });

    try {
      const res = await fetch('/api/version/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: targetVersion,
          customUrl: customZipUrl.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update version');
      }

      setStatusMessage({
        type: 'success',
        text: data.message || `Successfully updated to Bedrock v${targetVersion}!`
      });

      onRefresh();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error occurred while updating version.'
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 1. CURRENT ACTIVE VERSION HERO CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Bedrock Engine
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                v{currentActiveVersion}
              </h2>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Current Running Version
              </span>
            </div>
          </div>
          <button
            onClick={onRefresh}
            title="Refresh Version Status"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Display String
            </span>
            <span className="font-semibold text-slate-800 text-[11px] truncate block mt-0.5">
              {serverData?.version || `v${currentActiveVersion}`}
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Platform & Protocol
            </span>
            <span className="font-semibold text-slate-800 text-[11px] block mt-0.5">
              Bedrock UDP 19132
            </span>
          </div>
        </div>

        {/* Security & Restrictions Highlights requested by user */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-100 p-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-emerald-900">Cheats: OFF</p>
              <p className="text-[9px] text-emerald-700">Default disabled</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-100 p-2 rounded-xl">
            <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-indigo-900">Resource Packs: LOCKED</p>
              <p className="text-[9px] text-indigo-700">Members blocked from packs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : statusMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />
          )}
          <span className="font-medium leading-relaxed">{statusMessage.text}</span>
        </div>
      )}

      {/* 2. VERSION UPDATE SELECTION CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Update Server Version
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a verified Bedrock version or manually enter your desired version to fix version mismatch.
          </p>
        </div>

        {/* Tab selection: Preset vs Manual */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMode('preset')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'preset'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Select from List
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'manual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Manually Enter Version
          </button>
        </div>

        {/* MODE A: PRESET SELECT LIST */}
        {mode === 'preset' && (
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Available Bedrock Versions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableVersions.map((ver) => {
                const isCurrent = ver === currentActiveVersion;
                const isSelected = ver === selectedVersion;
                const isLatest = ver === '1.21.62.01';

                return (
                  <button
                    key={ver}
                    type="button"
                    onClick={() => setSelectedVersion(ver)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          v{ver}
                        </span>
                        {isLatest && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                            Latest
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {isLatest ? 'Recommended for latest PE clients' : 'Official Bedrock Dedicated'}
                      </p>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE B: MANUAL VERSION INPUT */}
        {mode === 'manual' && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Enter Exact Minecraft Bedrock Version
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={manualVersion}
                  onChange={(e) => setManualVersion(e.target.value)}
                  placeholder="e.g. 1.21.62.01 or 1.21.60.20"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Enter full release number (e.g. 1.21.62.01). The panel will automatically download and install official Linux Bedrock binaries.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Custom Download URL (Optional)
              </label>
              <input
                type="url"
                value={customZipUrl}
                onChange={(e) => setCustomZipUrl(e.target.value)}
                placeholder="https://.../bedrock-server-custom.zip"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Leave blank to automatically download from official Minecraft servers.
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleVersionUpdate}
            disabled={updating}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all text-xs disabled:opacity-50"
          >
            {updating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Updating Server Version...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>
                  Update to{' '}
                  {mode === 'preset'
                    ? `v${selectedVersion}`
                    : manualVersion
                    ? `v${manualVersion}`
                    : 'Custom Version'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. RAILWAY & PRESERVATION NOTICE */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <PackageCheck className="w-4 h-4 text-emerald-600" />
          <span>Automatic Railway Sync & World Protection</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-[11px]">
          1. <strong>Worlds and configs are 100% preserved</strong>: Updating the version will never delete your worlds, seed, whitelist, or server properties.
        </p>
        <p className="text-slate-600 leading-relaxed text-[11px]">
          2. <strong>Railway Cloud Sync</strong>: Updating here updates the internal <code>Dockerfile</code> and <code>version.json</code> so any subsequent Railway rebuild starts with your exact chosen version!
        </p>
      </div>
    </div>
  );
};

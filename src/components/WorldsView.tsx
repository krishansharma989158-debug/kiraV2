import React, { useState, useEffect } from 'react';
import {
  Globe,
  Upload,
  Download,
  RotateCcw,
  PlusCircle,
  HardDrive,
  Calendar,
  CheckCircle2,
  FileArchive,
  Layers,
  Sparkles,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { ServerData, BackupItem } from '../types';

interface WorldsViewProps {
  serverData: ServerData | null;
  onGenerateWorld?: (params: {
    name: string;
    seed: string;
    gamemode: string;
    difficulty: string;
  }) => Promise<void>;
  onUploadWorld?: (filename: string) => Promise<void>;
  onResetWorld?: () => Promise<void>;
  onBack?: () => void;
}

export const WorldsView: React.FC<WorldsViewProps> = ({
  serverData,
  onGenerateWorld,
  onUploadWorld,
  onResetWorld,
  onBack
}) => {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newName, setNewName] = useState('SurvivalWorld');
  const [newSeed, setNewSeed] = useState('');
  const [newGamemode, setNewGamemode] = useState('survival');
  const [newDifficulty, setNewDifficulty] = useState('normal');
  const [newLevelType, setNewLevelType] = useState('default');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backups');
      if (res.ok) {
        const data = await res.json();
        if (data.backups) setBackups(data.backups);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const world = serverData?.currentWorld || {
    name: 'BedrockLevel',
    seed: 'Random',
    sizeMb: 12.4,
    lastSaved: 'Just now'
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/world/generate-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldName: newName || 'BedrockLevel',
          seed: newSeed,
          gamemode: newGamemode,
          difficulty: newDifficulty,
          levelType: newLevelType
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessToast(`New world "${data.worldName}" generated from seed "${data.seed || 'Random'}"!`);
        setShowGenerateModal(false);
        fetchBackups();
      } else {
        setSuccessToast(`Error: ${data.error || 'Failed to generate world'}`);
      }
    } catch (err: any) {
      setSuccessToast('Failed to generate world.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSubmitting(true);
    setSuccessToast(`Uploading and restoring "${file.name}"...`);

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
            setSuccessToast(`World restored from ZIP archive "${file.name}"!`);
            fetchBackups();
          } else {
            setSuccessToast('Failed to upload/restore ZIP');
          }
        } catch (e: any) {
          setSuccessToast('Failed to process upload.');
        } finally {
          setIsSubmitting(false);
          setTimeout(() => setSuccessToast(null), 3500);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsSubmitting(false);
    }
  };

  const handleBackupDownload = async () => {
    setIsSubmitting(true);
    setSuccessToast('Generating fresh ZIP archive of current world...');
    try {
      const res = await fetch('/api/backups/create', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const link = document.createElement('a');
        link.href = `/api/backups/download/${encodeURIComponent(data.filename)}`;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSuccessToast(`ZIP backup "${data.filename}" downloaded!`);
        fetchBackups();
      }
    } catch (e) {
      setSuccessToast('Failed to download ZIP backup.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to restore world from "${filename}"? Current world will be replaced.`)) {
      return;
    }
    setIsSubmitting(true);
    setSuccessToast(`Restoring world from "${filename}"...`);
    try {
      const res = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      if (res.ok) {
        setSuccessToast(`World restored successfully from "${filename}"!`);
      }
    } catch (e) {
      setSuccessToast('Failed to restore backup.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const handleReset = async () => {
    if (
      confirm(
        'Are you sure you want to reset this world? Current chunks and builds will be cleared and replaced with a fresh seed.'
      )
    ) {
      setIsSubmitting(true);
      if (onResetWorld) {
        await onResetWorld();
      } else {
        await fetch('/api/world/generate-seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seed: Math.floor(Math.random() * 999999999).toString(), worldName: 'BedrockLevel' })
        });
      }
      setIsSubmitting(false);
      setSuccessToast('World reset to fresh Bedrock seed!');
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  return (
    <div className="space-y-3.5 pb-8 max-w-2xl mx-auto">
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Active World Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {world.name}
              </h2>
              <span className="text-[11px] text-slate-500">Active Bedrock Level</span>
            </div>
          </div>

          <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md border border-emerald-100">
            Loaded
          </span>
        </div>

        {/* World Details Grid */}
        <div className="grid grid-cols-2 gap-2.5 py-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px]">World Seed:</span>
            <span className="font-mono font-semibold text-slate-800 text-[11px] break-all">
              {world.seed || 'Random Seed'}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px]">World Size:</span>
            <span className="font-semibold text-slate-800 text-[11px]">
              {world.sizeMb} MB
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px]">Last Saved:</span>
            <span className="font-semibold text-slate-800 text-[11px]">
              {world.lastSaved}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px]">Dimensions:</span>
            <span className="font-semibold text-slate-800 text-[11px]">
              Overworld, Nether, End
            </span>
          </div>
        </div>

        {/* Primary World Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          {/* Upload & Restore ZIP */}
          <label className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload ZIP / .mcworld</span>
            <input
              type="file"
              accept=".zip,.mcworld"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>

          {/* Backup / Download ZIP */}
          <button
            onClick={handleBackupDownload}
            disabled={isSubmitting}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download World ZIP</span>
          </button>

          {/* Generate from Seed */}
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate from Seed</span>
          </button>

          {/* Reset World */}
          <button
            onClick={handleReset}
            disabled={isSubmitting}
            className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset World</span>
          </button>
        </div>
      </div>

      {/* Generate New World Form / Modal */}
      {showGenerateModal && (
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Generate New World From Seed</span>
            </h3>
            <button
              onClick={() => setShowGenerateModal(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-2.5 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                World Name
              </label>
              <input
                type="text"
                placeholder="e.g. MySurvivalWorld"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Minecraft Seed (e.g. 982347102 or custom word)
              </label>
              <input
                type="text"
                placeholder="Enter seed number or text (e.g. 782910384)"
                value={newSeed}
                onChange={(e) => setNewSeed(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Gamemode
                </label>
                <select
                  value={newGamemode}
                  onChange={(e) => setNewGamemode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-600 capitalize"
                >
                  <option value="survival">Survival</option>
                  <option value="creative">Creative</option>
                  <option value="adventure">Adventure</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={newDifficulty}
                  onChange={(e) => setNewDifficulty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-600 capitalize"
                >
                  <option value="peaceful">Peaceful</option>
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Terrain
                </label>
                <select
                  value={newLevelType}
                  onChange={(e) => setNewLevelType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-600 capitalize"
                >
                  <option value="default">Default / Infinite</option>
                  <option value="flat">Superflat</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Generating Seed World...' : 'Generate & Load Seed World'}
            </button>
          </form>
        </div>
      )}

      {/* World Backups List (Real ZIP archives) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <FileArchive className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-900">
              World ZIP Backups ({backups.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={fetchBackups}
            className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        {backups.length === 0 ? (
          <p className="text-center py-4 text-slate-400 text-xs">
            No ZIP archives created yet. Use "Download World ZIP" to make one.
          </p>
        ) : (
          <div className="space-y-2 text-xs">
            {backups.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-slate-800 block truncate">
                    {item.filename}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString()} • {item.sizeFormatted}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`/api/backups/download/${encodeURIComponent(item.filename)}`}
                    download={item.filename}
                    className="text-blue-700 hover:text-blue-800 font-semibold text-xs px-2 py-1 bg-white border border-blue-200 rounded-lg shadow-2xs"
                  >
                    Download ZIP
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRestoreBackup(item.filename)}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold text-xs px-2 py-1 bg-white border border-emerald-200 rounded-lg shadow-2xs"
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


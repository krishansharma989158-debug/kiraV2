import React, { useState } from 'react';
import {
  Sliders,
  Save,
  CheckCircle2,
  ShieldAlert,
  Gamepad2,
  Users,
  Eye,
  Clock,
  Sparkles
} from 'lucide-react';
import { ServerData } from '../types';

interface OptionsViewProps {
  serverData: ServerData | null;
  onSaveProperties: (props: any) => Promise<void>;
  onNavigate?: (tabId: string) => void;
}

export const OptionsView: React.FC<OptionsViewProps> = ({
  serverData,
  onSaveProperties,
  onNavigate
}) => {
  const [serverName, setServerName] = useState(serverData?.serverName || '');
  const [gamemode, setGamemode] = useState(serverData?.gamemode || 'survival');
  const [difficulty, setDifficulty] = useState(serverData?.difficulty || 'normal');
  const [allowCheats, setAllowCheats] = useState(serverData?.allowCheats ?? false);
  const [texturePackRequired, setTexturePackRequired] = useState(serverData?.texturePackRequired ?? true);
  const [onlineMode, setOnlineMode] = useState(serverData?.onlineMode ?? false);
  const [whitelistEnabled, setWhitelistEnabled] = useState(
    serverData?.whitelistEnabled ?? false
  );
  const [maxPlayers, setMaxPlayers] = useState(serverData?.maxPlayers || 10);
  const [viewDistance, setViewDistance] = useState(serverData?.viewDistance || 32);
  const [tickDistance, setTickDistance] = useState(serverData?.tickDistance || 4);
  const [idleTimeout, setIdleTimeout] = useState(serverData?.playerIdleTimeout || 30);

  const [isSaving, setIsSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSaveProperties({
      serverName,
      gamemode,
      difficulty,
      allowCheats,
      texturePackRequired,
      onlineMode,
      whitelistEnabled,
      maxPlayers,
      viewDistance,
      tickDistance,
      playerIdleTimeout: idleTimeout
    });
    setIsSaving(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="space-y-3.5 pb-6">
      {savedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Server options saved to server.properties!</span>
        </div>
      )}

      {/* Bedrock Version Banner with 1-Click Update */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
        <div className="min-w-0 pr-2">
          <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
            Current Minecraft Version
          </span>
          <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
            v{serverData?.activeVersion || '1.21.62.01'}{' '}
            <span className="text-[10px] font-normal text-slate-500">
              ({serverData?.version || 'Bedrock Dedicated'})
            </span>
          </p>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('version')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shrink-0 shadow-2xs"
          >
            Change Version
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* General Settings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900">
              Bedrock Server Options
            </h2>
          </div>

          {/* Server Name */}
          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-700">
              Server MOTD / Name
            </label>
            <input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Gamemode & Difficulty */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Gamemode</label>
              <select
                value={gamemode}
                onChange={(e) => setGamemode(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 capitalize"
              >
                <option value="survival">Survival</option>
                <option value="creative">Creative</option>
                <option value="adventure">Adventure</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 capitalize"
              >
                <option value="peaceful">Peaceful</option>
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Max Players */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">
                Max Players Slots
              </label>
              <span className="font-bold text-slate-900 font-mono">
                {maxPlayers}
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="30"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Gameplay & Access Toggles */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 pb-2 border-b border-slate-100">
            Gameplay & Security Toggles
          </h3>

          {/* Allow Cheats */}
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="font-semibold text-slate-800 block">
                Allow Cheats & Commands (Default: Off)
              </span>
              <span className="text-[11px] text-slate-400">
                Disabled by default. When off, players cannot use /give, /gamemode, or cheats.
              </span>
            </div>
            <input
              type="checkbox"
              checked={allowCheats}
              onChange={(e) => setAllowCheats(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          {/* Restrict Member Resource Packs */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100">
            <div className="pr-2">
              <span className="font-semibold text-slate-800 block">
                Restrict Member Resource Packs
              </span>
              <span className="text-[11px] text-slate-400">
                Enforces server texturepack. Prevents members from applying unapproved, custom, or X-Ray resource packs.
              </span>
            </div>
            <input
              type="checkbox"
              checked={texturePackRequired}
              onChange={(e) => setTexturePackRequired(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          {/* Online Mode (Xbox Live Auth) */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100">
            <div>
              <span className="font-semibold text-slate-800 block">
                Online Mode (Xbox Auth)
              </span>
              <span className="text-[11px] text-slate-400">
                Disable to allow offline / cracked Bedrock clients
              </span>
            </div>
            <input
              type="checkbox"
              checked={onlineMode}
              onChange={(e) => setOnlineMode(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          {/* Whitelist */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100">
            <div>
              <span className="font-semibold text-slate-800 block">
                Enable Whitelist
              </span>
              <span className="text-[11px] text-slate-400">
                Only players added to whitelist can join
              </span>
            </div>
            <input
              type="checkbox"
              checked={whitelistEnabled}
              onChange={(e) => setWhitelistEnabled(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Performance Settings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 pb-2 border-b border-slate-100">
            Performance & Distances
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                View Distance (Chunks)
              </label>
              <input
                type="number"
                min="8"
                max="32"
                value={viewDistance}
                onChange={(e) => setViewDistance(parseInt(e.target.value, 10))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                Tick Distance (4-12)
              </label>
              <input
                type="number"
                min="4"
                max="12"
                value={tickDistance}
                onChange={(e) => setTickDistance(parseInt(e.target.value, 10))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Options Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save server.properties'}</span>
        </button>
      </form>
    </div>
  );
};

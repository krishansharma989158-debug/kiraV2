import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle2, ShieldCheck, Gamepad2, Users, Eye, Sparkles } from 'lucide-react';
import { ServerData } from '../types';

interface PropertiesViewProps {
  serverData: ServerData | null;
  onSaveProperties: (props: any) => Promise<void>;
  onNavigate?: (tabId: string) => void;
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({
  serverData,
  onSaveProperties,
  onNavigate
}) => {
  const [config, setConfig] = useState({
    serverName: serverData?.serverName || 'Kira Bedrock Server',
    bedrockPort: serverData?.bedrockPort || 19132,
    gamemode: serverData?.gamemode || 'survival',
    difficulty: serverData?.difficulty || 'normal',
    maxPlayers: serverData?.maxPlayers || 8,
    onlineMode: serverData?.onlineMode ?? false,
    allowCheats: serverData?.allowCheats ?? false,
    texturePackRequired: serverData?.texturePackRequired ?? true,
    whitelistEnabled: serverData?.whitelistEnabled ?? false,
    viewDistance: serverData?.viewDistance || 10,
    tickDistance: serverData?.tickDistance || 4,
    playerIdleTimeout: serverData?.playerIdleTimeout || 15
  });

  const [isSaving, setIsSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (serverData) {
      setConfig({
        serverName: serverData.serverName,
        bedrockPort: serverData.bedrockPort,
        gamemode: serverData.gamemode,
        difficulty: serverData.difficulty,
        maxPlayers: serverData.maxPlayers,
        onlineMode: serverData.onlineMode,
        allowCheats: serverData.allowCheats,
        texturePackRequired: serverData.texturePackRequired ?? true,
        whitelistEnabled: serverData.whitelistEnabled,
        viewDistance: serverData.viewDistance || 10,
        tickDistance: serverData.tickDistance || 4,
        playerIdleTimeout: serverData.playerIdleTimeout || 15
      });
    }
  }, [serverData]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    await onSaveProperties(config);
    setIsSaving(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="space-y-3.5 pb-24 max-w-2xl mx-auto">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Server Settings & Config
              </h3>
              <p className="text-[11px] text-slate-500">
                Single place for all server.properties & gameplay rules
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>

        {savedToast && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Settings saved successfully to server.properties!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        {/* 1. GENERAL IDENTITY */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>1. Server Identity & Port</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Server Name (MOTD in MCPE)
            </label>
            <input
              type="text"
              value={config.serverName}
              onChange={(e) => setConfig({ ...config, serverName: e.target.value })}
              className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600"
              placeholder="e.g. Kira Bedrock Server"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Bedrock Port (UDP)
              </label>
              <input
                type="number"
                value={config.bedrockPort}
                onChange={(e) =>
                  setConfig({ ...config, bedrockPort: parseInt(e.target.value, 10) || 19132 })
                }
                className="w-full text-xs font-mono px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Max Players (Slot)
              </label>
              <input
                type="number"
                value={config.maxPlayers}
                onChange={(e) =>
                  setConfig({ ...config, maxPlayers: parseInt(e.target.value, 10) || 8 })
                }
                className="w-full text-xs font-mono px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* 2. GAMEPLAY SETTINGS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>2. Gamemode & Difficulty</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Gamemode
              </label>
              <select
                value={config.gamemode}
                onChange={(e) => setConfig({ ...config, gamemode: e.target.value as any })}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600 capitalize"
              >
                <option value="survival">Survival (सर्वाइवल)</option>
                <option value="creative">Creative (क्रिएटिव)</option>
                <option value="adventure">Adventure (एडवेंचर)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Difficulty
              </label>
              <select
                value={config.difficulty}
                onChange={(e) => setConfig({ ...config, difficulty: e.target.value as any })}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600 capitalize"
              >
                <option value="peaceful">Peaceful (शांतिपूर्ण)</option>
                <option value="easy">Easy (आसान)</option>
                <option value="normal">Normal (सामान्य)</option>
                <option value="hard">Hard (कठिन)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                View Distance
              </label>
              <input
                type="number"
                min="4"
                max="32"
                value={config.viewDistance}
                onChange={(e) =>
                  setConfig({ ...config, viewDistance: parseInt(e.target.value, 10) || 10 })
                }
                className="w-full text-xs font-mono px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block">Chunks</span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Tick Distance
              </label>
              <input
                type="number"
                min="4"
                max="12"
                value={config.tickDistance}
                onChange={(e) =>
                  setConfig({ ...config, tickDistance: parseInt(e.target.value, 10) || 4 })
                }
                className="w-full text-xs font-mono px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block">Sim. radius</span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Idle Timeout
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={config.playerIdleTimeout}
                onChange={(e) =>
                  setConfig({ ...config, playerIdleTimeout: parseInt(e.target.value, 10) || 15 })
                }
                className="w-full text-xs font-mono px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block">Minutes</span>
            </div>
          </div>
        </div>

        {/* 3. SECURITY & ACCESS CONTROL */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>3. Security, Cheats & Access</span>
          </div>

          {/* Texture Pack Lock / Anti-Xray */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="pr-2">
              <span className="text-xs font-bold text-slate-900 block">
                Lock Texture Pack (Anti-Xray)
              </span>
              <span className="text-[11px] text-slate-500 block leading-tight">
                Forces server textures. Blocks client-side X-Ray & cheat packs.
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.texturePackRequired}
              onChange={(e) => setConfig({ ...config, texturePackRequired: e.target.checked })}
              className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 shrink-0"
            />
          </div>

          {/* Cheats Default OFF */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="pr-2">
              <span className="text-xs font-bold text-slate-900 block">
                Allow Cheats (In-Game Commands)
              </span>
              <span className="text-[11px] text-slate-500 block leading-tight">
                OFF by default. Keeps survival fair and enables achievements.
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.allowCheats}
              onChange={(e) => setConfig({ ...config, allowCheats: e.target.checked })}
              className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 shrink-0"
            />
          </div>

          {/* Online Mode / Xbox Auth */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="pr-2">
              <span className="text-xs font-bold text-slate-900 block">
                Xbox Live Authentication (online-mode)
              </span>
              <span className="text-[11px] text-slate-500 block leading-tight">
                OFF allows non-Xbox & cracked PE clients to join smoothly.
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.onlineMode}
              onChange={(e) => setConfig({ ...config, onlineMode: e.target.checked })}
              className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 shrink-0"
            />
          </div>

          {/* Whitelist */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="pr-2">
              <span className="text-xs font-bold text-slate-900 block">
                Whitelist Only (white-list)
              </span>
              <span className="text-[11px] text-slate-500 block leading-tight">
                Only players approved in Whitelist can connect.
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.whitelistEnabled}
              onChange={(e) => setConfig({ ...config, whitelistEnabled: e.target.checked })}
              className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 shrink-0"
            />
          </div>
        </div>

        {/* Big Mobile Touch Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Writing to Disk...' : 'Save All Settings (server.properties)'}</span>
        </button>
      </form>
    </div>
  );
};

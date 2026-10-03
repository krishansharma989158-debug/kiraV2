import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle2, ShieldCheck, Gamepad2, Users, Eye, Sparkles, Zap } from 'lucide-react';
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
    playerIdleTimeout: serverData?.playerIdleTimeout || 15,
    fastBlockMode: serverData?.fastBlockMode ?? true
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
        playerIdleTimeout: serverData.playerIdleTimeout || 15,
        fastBlockMode: serverData.fastBlockMode ?? true
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
    <div className="space-y-3.5 max-w-2xl mx-auto">
      {/* Header Info */}
      <div className="bg-[#121118] border border-red-950/50 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-red-950/50 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Server Settings & Config
              </h3>
              <p className="text-[11px] text-slate-400">
                Single place for all server.properties & gameplay rules
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-red-950/40 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>

        {savedToast && (
          <div className="mt-3 p-2.5 bg-red-950/70 border border-red-800/60 rounded-xl text-xs font-semibold text-red-200 flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />
            <span>Settings saved successfully to server.properties!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        {/* 1. GENERAL IDENTITY */}
        <div className="bg-[#121118] border border-red-950/40 rounded-2xl p-4 shadow-md space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5 text-red-400" />
            <span>1. Server Identity & Port</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Server Name (MOTD in MCPE)
            </label>
            <input
              type="text"
              value={config.serverName}
              onChange={(e) => setConfig({ ...config, serverName: e.target.value })}
              className="w-full text-xs font-medium px-3 py-2.5 bg-[#0a0a0f] border border-zinc-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500/80 focus:ring-1 focus:ring-red-500/40"
              placeholder="e.g. Kira Bedrock Server"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Bedrock Port (UDP)
              </label>
              <input
                type="number"
                value={config.bedrockPort}
                onChange={(e) =>
                  setConfig({ ...config, bedrockPort: parseInt(e.target.value, 10) || 19132 })
                }
                className="w-full text-xs font-mono px-3 py-2.5 bg-[#0a0a0f] border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500/80 focus:ring-1 focus:ring-red-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Max Players (Slot)
              </label>
              <input
                type="number"
                value={config.maxPlayers}
                onChange={(e) =>
                  setConfig({ ...config, maxPlayers: parseInt(e.target.value, 10) || 8 })
                }
                className="w-full text-xs font-mono px-3 py-2.5 bg-[#0a0a0f] border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500/80 focus:ring-1 focus:ring-red-500/40"
              />
            </div>
          </div>
        </div>

        {/* 2. GAMEPLAY SETTINGS */}
        <div className="bg-[#121118] border border-red-950/40 rounded-2xl p-4 shadow-md space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            <span>2. Gamemode & Difficulty</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Gamemode
              </label>
              <select
                value={config.gamemode}
                onChange={(e) => setConfig({ ...config, gamemode: e.target.value as any })}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-[#0a0a0f] border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500/80 capitalize"
              >
                <option value="survival">Survival (सर्वाइवल)</option>
                <option value="creative">Creative (क्रिएटिव)</option>
                <option value="adventure">Adventure (एडवेंचर)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Difficulty
              </label>
              <select
                value={config.difficulty}
                onChange={(e) => setConfig({ ...config, difficulty: e.target.value as any })}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-[#0a0a0f] border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-red-500/80 capitalize"
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
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
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
                className="w-full text-xs font-mono px-2.5 py-2 bg-[#0a0a0f] border border-zinc-800 rounded-xl text-white"
              />
              <span className="text-[9px] text-slate-500 mt-0.5 block">Chunks</span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
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
                className="w-full text-xs font-mono px-2.5 py-2 bg-[#0a0a0f] border border-zinc-800 rounded-xl text-white"
              />
              <span className="text-[9px] text-slate-500 mt-0.5 block">Sim. radius</span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
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
                className="w-full text-xs font-mono px-2.5 py-2 bg-[#0a0a0f] border border-zinc-800 rounded-xl text-white"
              />
              <span className="text-[9px] text-slate-500 mt-0.5 block">Minutes</span>
            </div>
          </div>
        </div>

        {/* 3. SECURITY & ACCESS CONTROL */}
        <div className="bg-[#121118] border border-red-950/40 rounded-2xl p-4 shadow-md space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
            <span>3. Security, Cheats & Access</span>
          </div>

          {/* Texture Pack Lock / Anti-Xray */}
          <div className="flex items-center justify-between p-2.5 bg-[#0a0a0f] rounded-xl border border-zinc-800/80">
            <div className="pr-2">
              <span className="text-xs font-bold text-white block">
                Lock Texture Pack (Anti-Xray)
              </span>
              <span className="text-[11px] text-slate-400 block leading-tight">
                Forces server textures. Blocks client-side X-Ray & cheat packs.
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.texturePackRequired}
              onChange={(e) => setConfig({ ...config, texturePackRequired: e.target.checked })}
              className="w-5 h-5 accent-red-600 rounded-md shrink-0 cursor-pointer"
            />
          </div>

          {/* Cheats Default OFF */}
          <div className="flex items-center justify-between p-2.5 bg-[#0a0a0f] rounded-xl border border-zinc-800/80">
            <div className="pr-2">
              <span className="text-xs font-bold text-white block">
                Allow Cheats (In-Game Commands)
              </span>
              <span className="text-[11px] text-slate-400 block leading-tight">
                OFF by default. Keeps survival fair and enables achievements.
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.allowCheats}
              onChange={(e) => setConfig({ ...config, allowCheats: e.target.checked })}
              className="w-5 h-5 accent-red-600 rounded-md shrink-0 cursor-pointer"
            />
          </div>

          {/* Online Mode / Xbox Auth */}
          <div className="flex items-center justify-between p-2.5 bg-[#0a0a0f] rounded-xl border border-zinc-800/80">
            <div className="pr-2">
              <span className="text-xs font-bold text-white block">
                Xbox Live Authentication (online-mode)
              </span>
              <span className="text-[11px] text-slate-400 block leading-tight">
                OFF allows non-Xbox & cracked PE clients to join smoothly.
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.onlineMode}
              onChange={(e) => setConfig({ ...config, onlineMode: e.target.checked })}
              className="w-5 h-5 accent-red-600 rounded-md shrink-0 cursor-pointer"
            />
          </div>

          {/* Whitelist */}
          <div className="flex items-center justify-between p-2.5 bg-[#0a0a0f] rounded-xl border border-zinc-800/80">
            <div className="pr-2">
              <span className="text-xs font-bold text-white block">
                Whitelist Only (white-list)
              </span>
              <span className="text-[11px] text-slate-400 block leading-tight">
                Only players approved in Whitelist can connect.
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.whitelistEnabled}
              onChange={(e) => setConfig({ ...config, whitelistEnabled: e.target.checked })}
              className="w-5 h-5 accent-red-600 rounded-md shrink-0 cursor-pointer"
            />
          </div>
        </div>

        {/* 4. ANTI-LAG & ZERO-GLITCH BLOCK ENGINE */}
        <div className="bg-[#121118] border border-red-950/50 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              <span>4. Anti-Lag & Fast Block Engine (Zero Ghost Blocks)</span>
            </div>
            <span className="text-[10px] font-bold bg-red-950 text-red-300 border border-red-800/40 px-2 py-0.5 rounded-full">
              Recommended ON
            </span>
          </div>

          <div className="p-3 bg-[#0a0a0f] border border-red-950/60 rounded-xl flex items-start justify-between gap-3">
            <div className="pr-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white block">
                  Instant Fast Block Break & Place Mode
                </span>
                <span className="text-[10px] font-bold bg-red-950 text-red-300 border border-red-800/40 px-1.5 py-0.5 rounded">
                  Zero Delay
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                फास्ट ब्लॉक प्लेस या ब्रेक (माइनिंग) करते समय होने वाले <b>Delay, Ghost Blocks</b> (ब्लॉक टूटकर वापस आना) और <b>Rollback</b> को पूरी तरह ठीक करता है। Client-Auth मोड में ब्लॉक्स बिना किसी लैग के तुरंत प्लेस और डिस्ट्रॉय होते हैं।
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] font-mono bg-[#181622] text-red-300 px-1.5 py-0.5 rounded border border-red-950">
                  server-authoritative-block-breaking=false
                </span>
                <span className="text-[10px] font-mono bg-[#181622] text-red-300 px-1.5 py-0.5 rounded border border-red-950">
                  server-authoritative-movement=client-auth
                </span>
                <span className="text-[10px] font-mono bg-[#181622] text-red-300 px-1.5 py-0.5 rounded border border-red-950">
                  compression-threshold=512
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.fastBlockMode}
              onChange={(e) => setConfig({ ...config, fastBlockMode: e.target.checked })}
              className="w-5 h-5 accent-red-600 rounded-md shrink-0 mt-1 cursor-pointer"
            />
          </div>
        </div>

        {/* Big Mobile Touch Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg shadow-red-950/50 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Writing to Disk...' : 'Save All Settings (server.properties)'}</span>
        </button>
      </form>
    </div>
  );
};

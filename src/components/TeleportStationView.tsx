import React, { useState, useEffect } from 'react';
import {
  Compass,
  Terminal,
  Play,
  Copy,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Users,
  MapPin,
  RotateCw,
  CheckCircle2,
  Box,
  Layers,
  ArrowRight,
  Send,
  Zap,
  Radio
} from 'lucide-react';
import { TeleportStation, Player } from '../types';

interface TeleportStationViewProps {
  onBack: () => void;
  onlinePlayers?: Player[];
}

export const TeleportStationView: React.FC<TeleportStationViewProps> = ({
  onBack,
  onlinePlayers = []
}) => {
  const [stations, setStations] = useState<TeleportStation[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>(
    onlinePlayers[0]?.name || 'Steve'
  );
  const [customPlayerName, setCustomPlayerName] = useState('');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // New Station Form
  const [showAddStation, setShowAddStation] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newStationType, setNewStationType] = useState<'player' | 'coordinate' | 'spawn' | 'arena'>('coordinate');
  const [targetCoordX, setTargetCoordX] = useState('0');
  const [targetCoordY, setTargetCoordY] = useState('100');
  const [targetCoordZ, setTargetCoordZ] = useState('0');

  // Admin Kit Target State
  const [kitTarget, setKitTarget] = useState('@p');
  const [kitCustomName, setKitCustomName] = useState('');
  const [showKitCustom, setShowKitCustom] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchStations = async () => {
    try {
      const res = await fetch('/api/teleport/stations');
      if (res.ok) {
        const data = await res.json();
        if (data.stations) setStations(data.stations);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    if (onlinePlayers.length > 0 && !selectedPlayer) {
      setSelectedPlayer(onlinePlayers[0].name);
    }
  }, [onlinePlayers]);

  const effectivePlayerTarget = customPlayerName.trim() || selectedPlayer;
  const playerCommandSnippet = `tp @p[r=3] "${effectivePlayerTarget}"`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
    showToast('📋 Command copied to clipboard!');
  };

  const handleGiveAdminKit = async () => {
    const finalTarget = (showKitCustom && kitCustomName.trim()) ? kitCustomName.trim() : (kitTarget || '@p');
    setLoading(true);
    try {
      const res = await fetch('/api/teleport/give-admin-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: finalTarget })
      });
      if (res.ok) {
        showToast(`📦 Command Blocks & Redstone Kit given to "${finalTarget}" in-game!`);
      }
    } catch (e) {
      showToast('❌ Failed to give admin kit');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteCommand = async (cmd: string, name: string) => {
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      if (res.ok) {
        showToast(`⚡ Teleported to ${name}!`);
      }
    } catch (e) {
      showToast('❌ Teleport command failed');
    }
  };

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName.trim()) {
      showToast('⚠️ Station name is required');
      return;
    }

    const payload = {
      name: newStationName.trim(),
      type: newStationType,
      x: parseInt(targetCoordX, 10) || 0,
      y: parseInt(targetCoordY, 10) || 100,
      z: parseInt(targetCoordZ, 10) || 0,
      commandSnippet: `tp @p[r=3] ${targetCoordX} ${targetCoordY} ${targetCoordZ}`,
      buttonColor:
        newStationType === 'spawn'
          ? 'emerald'
          : newStationType === 'arena'
          ? 'rose'
          : 'indigo'
    };

    setLoading(true);
    try {
      const res = await fetch('/api/teleport/stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(`🏛️ Teleport station "${payload.name}" created!`);
        setShowAddStation(false);
        setNewStationName('');
        fetchStations();
      }
    } catch (e) {
      showToast('❌ Failed to create station');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStation = async (id: string) => {
    try {
      const res = await fetch(`/api/teleport/stations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('🗑️ Station removed');
        fetchStations();
      }
    } catch (e) {
      showToast('❌ Failed to delete station');
    }
  };

  return (
    <div className="space-y-3.5 pb-24 max-w-2xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs flex items-center gap-2 shadow-xs animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                <span>Teleport Stations & Command Block Hub</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
                  Admin Kit
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Command Block generators • Player-wise warps • Hub buttons
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchStations}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors active:scale-95"
            title="Refresh Stations"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* 1-Click Give Admin Kit Button with Target Selector */}
        <div className="mt-3 p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-950 block">
                1-Click Admin Command Block Kit (मैनुअल किट दें)
              </span>
              <span className="text-[11px] text-indigo-800/90 block">
                64x Command Block, Chain, Repeating + 64x Stone Buttons, Levers & Redstone.
              </span>
            </div>
            <span className="text-[10px] font-bold bg-indigo-200/70 text-indigo-900 px-2 py-0.5 rounded-full">
              Kit Delivery
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {showKitCustom ? (
              <input
                type="text"
                value={kitCustomName}
                onChange={(e) => setKitCustomName(e.target.value)}
                placeholder="Target Gamertag (e.g. Steve)"
                className="flex-1 text-xs font-semibold px-3 py-2 bg-white border border-indigo-200 rounded-xl focus:outline-indigo-600"
              />
            ) : (
              <select
                value={kitTarget}
                onChange={(e) => setKitTarget(e.target.value)}
                className="flex-1 text-xs font-semibold px-3 py-2 bg-white border border-indigo-200 rounded-xl focus:outline-indigo-600"
              >
                <option value="@p">Closest Player (@p)</option>
                <option value="@a">All Players (@a)</option>
                {onlinePlayers.map((p) => (
                  <option key={p.xuid || p.name} value={p.name}>
                    🎮 {p.name} (Online)
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setShowKitCustom(!showKitCustom)}
              className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-800 px-2 py-1 self-center"
            >
              {showKitCustom ? 'List' : 'Custom'}
            </button>

            <button
              type="button"
              onClick={handleGiveAdminKit}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all disabled:opacity-50 shrink-0"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Give Kit Now</span>
            </button>
          </div>

          {/* Quick Chat Commands */}
          <div className="flex items-center gap-2 pt-1 text-[11px] text-indigo-900 flex-wrap">
            <span className="font-semibold">In-Game Chat:</span>
            <button
              type="button"
              onClick={() => copyToClipboard('/give @s command_block 1', 'cmd-cb-s')}
              className="px-2 py-0.5 bg-white border border-indigo-200 hover:border-indigo-400 rounded text-[10px] font-mono font-bold flex items-center gap-1"
            >
              <span>/give @s command_block 1</span>
              {copiedCmd === 'cmd-cb-s' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
            </button>
            <button
              type="button"
              onClick={() => copyToClipboard('/give @s stone_button 1', 'cmd-btn-s')}
              className="px-2 py-0.5 bg-white border border-indigo-200 hover:border-indigo-400 rounded text-[10px] font-mono font-bold flex items-center gap-1"
            >
              <span>/give @s stone_button 1</span>
              {copiedCmd === 'cmd-btn-s' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. PLAYER-WISE TELEPORT COMMAND GENERATOR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Player-Wise Teleport Station Generator
            </h4>
          </div>
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
            Special Button
          </span>
        </div>

        <p className="text-[11px] text-slate-500">
          Command Block ke andar ye command daalein. Jab koi player button dabayega ya pressure plate par khada hoga, wo turant selected player ke paas teleport ho jayega!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Pick Online Player */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Select Online Player Target:
            </label>
            <select
              value={selectedPlayer}
              onChange={(e) => {
                setSelectedPlayer(e.target.value);
                setCustomPlayerName('');
              }}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-indigo-600"
            >
              {onlinePlayers.length === 0 && (
                <option value="Steve">Steve (Sample Player)</option>
              )}
              {onlinePlayers.map((p) => (
                <option key={p.xuid || p.name} value={p.name}>
                  🎮 {p.name} (Online)
                </option>
              ))}
            </select>
          </div>

          {/* Or Type Custom Player Gamertag */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Or Type Custom Gamertag:
            </label>
            <input
              type="text"
              value={customPlayerName}
              onChange={(e) => setCustomPlayerName(e.target.value)}
              placeholder="e.g. ProGamer99"
              className="w-full text-xs font-medium px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-indigo-600"
            />
          </div>
        </div>

        {/* Generated Command Box */}
        <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono flex items-center gap-1.5 text-indigo-400 font-bold">
              <Terminal className="w-3.5 h-3.5" />
              <span>Command Block Input Code:</span>
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
              Impulse • Unconditional
            </span>
          </div>

          <div className="p-2 bg-slate-950 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto selection:bg-emerald-800">
            {playerCommandSnippet}
          </div>

          <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Radius [r=3] ensures only the player pushing button teleports!</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(playerCommandSnippet, 'player-snippet')
                }
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {copiedCmd === 'player-snippet' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy Code</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleExecuteCommand(
                    `tp @p "${effectivePlayerTarget}"`,
                    effectivePlayerTarget
                  )
                }
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Test Teleport</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3-Step Setup Guide */}
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-600">
          <p className="font-bold text-slate-800">🛠️ In-Game Station Setup (आसान तरीका):</p>
          <p>1. Zameen par ek <b>Command Block</b> rakhein aur uspe right-click karein.</p>
          <p>2. "Command Input" me upar ka code paste karein aur "Needs Redstone" par rakhein.</p>
          <p>3. Command Block ke aage ya upar ek <b>Stone Button</b> ya Pressure Plate laga dein!</p>
        </div>
      </div>

      {/* 3. WARP STATIONS (SPAWN, BASES, NETHER, ARENA) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Warp Stations & Waypoints ({stations.length})
            </h4>
          </div>

          <button
            type="button"
            onClick={() => setShowAddStation(!showAddStation)}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Station</span>
          </button>
        </div>

        {/* New Station Form */}
        {showAddStation && (
          <form
            onSubmit={handleCreateStation}
            className="p-3 bg-slate-50 border border-emerald-200 rounded-xl space-y-2.5 animate-in fade-in duration-150"
          >
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Create New Teleport Destination</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Station Name
                </label>
                <input
                  type="text"
                  required
                  value={newStationName}
                  onChange={(e) => setNewStationName(e.target.value)}
                  placeholder="e.g. Spawn Warp Hub"
                  className="w-full text-xs font-semibold px-2.5 py-2 bg-white border border-slate-200 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Station Type
                </label>
                <select
                  value={newStationType}
                  onChange={(e) => setNewStationType(e.target.value as any)}
                  className="w-full text-xs font-semibold px-2.5 py-2 bg-white border border-slate-200 rounded-lg"
                >
                  <option value="coordinate">Custom Coordinates</option>
                  <option value="spawn">Spawn Hub</option>
                  <option value="arena">PVP Arena</option>
                </select>
              </div>
            </div>

            {/* Coordinates */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Destination Coordinates [X, Y, Z]
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={targetCoordX}
                  onChange={(e) => setTargetCoordX(e.target.value)}
                  placeholder="X"
                  className="w-full text-xs font-mono font-bold px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center"
                />
                <input
                  type="number"
                  value={targetCoordY}
                  onChange={(e) => setTargetCoordY(e.target.value)}
                  placeholder="Y (Height)"
                  className="w-full text-xs font-mono font-bold px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center"
                />
                <input
                  type="number"
                  value={targetCoordZ}
                  onChange={(e) => setTargetCoordZ(e.target.value)}
                  placeholder="Z"
                  className="w-full text-xs font-mono font-bold px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddStation(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Save Station</span>
              </button>
            </div>
          </form>
        )}

        {/* Stations List */}
        <div className="space-y-2">
          {stations.map((st) => (
            <div
              key={st.id}
              className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between gap-2 transition-colors"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{st.name}</span>
                  <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-semibold capitalize">
                    {st.type}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Code: <span className="text-slate-800 font-bold">{st.commandSnippet}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => copyToClipboard(st.commandSnippet, st.id)}
                  title="Copy Command"
                  className="p-2 bg-white hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-lg text-xs transition-colors active:scale-95"
                >
                  {copiedCmd === st.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteCommand(st.commandSnippet, st.name)}
                  title="Test Teleport"
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteStation(st.id)}
                  title="Delete Station"
                  className="p-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-lg text-xs transition-colors active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

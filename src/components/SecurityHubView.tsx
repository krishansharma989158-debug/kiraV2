import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Crown,
  Lock,
  EyeOff,
  ZapOff,
  UserX,
  Users,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Terminal,
  Ban
} from 'lucide-react';
import { SecuritySettings, SecurityIncident } from '../types';

interface SecurityHubViewProps {
  onBack: () => void;
  onRefreshStatus?: () => void;
}

export const SecurityHubView: React.FC<SecurityHubViewProps> = ({ onBack, onRefreshStatus }) => {
  const [settings, setSettings] = useState<SecuritySettings>({
    texturepackRequired: true,
    antiCheatAutoBan: true,
    antiDuplication: true,
    serverAuthoritativeMovement: 'server-auth-with-rewind',
    serverAuthoritativeBlockBreaking: true,
    allowCheats: false,
    defaultPermissionLevel: 'member',
    bannedPlayersCount: 0
  });

  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [bannedPlayers, setBannedPlayers] = useState<string[]>([]);
  const [myGamertag, setMyGamertag] = useState('');
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [banPlayerInput, setBanPlayerInput] = useState('');
  const [banReasonInput, setBanReasonInput] = useState('Anti-Cheat / Hacking Violation');
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchSecurity = async () => {
    try {
      const res = await fetch('/api/security/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.incidents) setIncidents(data.incidents);
        if (data.bannedPlayers) setBannedPlayers(data.bannedPlayers);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchSecurity();
  }, []);

  const handleToggle = async (key: keyof SecuritySettings, val: any) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    try {
      const res = await fetch('/api/security/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
        if (onRefreshStatus) onRefreshStatus();
      }
    } catch (e) {}
  };

  const handleClaimOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myGamertag.trim()) return;

    setLoading(true);
    setClaimStatus(null);
    try {
      const res = await fetch('/api/player/claim-op', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gamertag: myGamertag.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setClaimStatus(`Success! "${myGamertag.trim()}" is now a Server Operator (OP).`);
        setMyGamertag('');
        fetchSecurity();
        if (onRefreshStatus) onRefreshStatus();
      } else {
        setClaimStatus(`Error: ${data.error || 'Failed to grant OP'}`);
      }
    } catch (err: any) {
      setClaimStatus('Network error granting operator role.');
    } finally {
      setLoading(false);
    }
  };

  const handleBanPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banPlayerInput.trim()) return;

    try {
      const res = await fetch('/api/security/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: banPlayerInput.trim(), reason: banReasonInput })
      });
      if (res.ok) {
        setBanPlayerInput('');
        fetchSecurity();
      }
    } catch (e) {}
  };

  const handleUnbanPlayer = async (playerName: string) => {
    try {
      const res = await fetch('/api/security/unban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: playerName })
      });
      if (res.ok) {
        fetchSecurity();
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Server Security & Anti-Cheat Hub</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full Anti-Xray, Anti-Hack, Anti-Duplication & Operator Controls
          </p>
        </div>
        <button
          type="button"
          onClick={fetchSecurity}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs flex items-center gap-1 transition-colors"
          title="Refresh Security Status"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium hidden sm:inline">Refresh</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Security policy saved and synchronized with server.properties!</span>
        </div>
      )}

      {/* 👑 1. CLAIM OPERATOR (OP) - USER SPECIFIC REQUEST */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Claim Server Operator (OP)
            </h3>
            <p className="text-[11px] text-slate-600">
              Apna Gamertag enter karein aur khud ko 1-click me Server Operator / Admin bnayein.
            </p>
          </div>
        </div>

        <form onSubmit={handleClaimOperator} className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={myGamertag}
              onChange={(e) => setMyGamertag(e.target.value)}
              placeholder="Enter your Xbox / MCPE Gamertag (e.g. Steve, Alex)"
              className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={loading || !myGamertag.trim()}
              className="bg-amber-600 hover:bg-amber-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all shrink-0"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{loading ? 'Granting OP...' : 'Make Myself Operator'}</span>
            </button>
          </div>
          {claimStatus && (
            <div className={`p-2 rounded-lg text-[11px] font-medium ${claimStatus.startsWith('Success') ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {claimStatus}
            </div>
          )}
        </form>
      </div>

      {/* 🛡️ 2. ACTIVE SECURITY POLICIES (BY DEFAULT ON) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full Anti-Cheat & Security Defenses</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              All strict protections are enabled by default for complete safety.
            </p>
          </div>
          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
            By Default ON
          </span>
        </div>

        <div className="space-y-2.5">
          {/* 1. Anti-Xray (Texturepack Lock) */}
          <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg mt-0.5 shrink-0">
                <EyeOff className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    Anti-Xray (Texture Pack Lock)
                  </span>
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                    texturepack-required=true
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Forces all joining players to accept the server's official resource pack. Clients cannot use custom X-Ray, ore vision, or cave finder packs.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('texturepackRequired', !settings.texturepackRequired)}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${settings.texturepackRequired ? 'bg-emerald-600' : 'bg-slate-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${settings.texturepackRequired ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* 2. Anti-Cheat Auto-Ban */}
          <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-lg mt-0.5 shrink-0">
                <Ban className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    Anti-Cheat Auto-Ban System
                  </span>
                  <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded border border-rose-200">
                    Instant Ban on Hack
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Detects fly hack, speed hack, air-jump, reach hack, and abnormal packet frequency. Offenders are instantly kicked and permanently banned.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('antiCheatAutoBan', !settings.antiCheatAutoBan)}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${settings.antiCheatAutoBan ? 'bg-emerald-600' : 'bg-slate-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${settings.antiCheatAutoBan ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* 3. Anti-Duplication Protection */}
          <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg mt-0.5 shrink-0">
                <ZapOff className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    Anti-Glitch Item Duplication Shield
                  </span>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded border border-amber-200">
                    Anti-Dupe Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Prevents item duplication glitches (piston-portal travel dupes, shulker box drop crash dupes, and async thread disconnect exploits).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('antiDuplication', !settings.antiDuplication)}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${settings.antiDuplication ? 'bg-emerald-600' : 'bg-slate-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${settings.antiDuplication ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* 4. Server-Auth Movement (Rewind on Fly) */}
          <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-lg mt-0.5 shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    Server Authoritative Movement with Rewind
                  </span>
                  <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200">
                    score-threshold=20
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  The server strictly simulates and validates player physics. If a hacked client attempts flight, speed, or noclip, the server rewinds their position.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md shrink-0">
              Rewind Active
            </span>
          </div>

          {/* 5. Default Role Member & Cheats OFF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Default Role on Join
                </span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Member (No Cheats / No OP)</span>
                </span>
              </div>
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                Member
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Cheats Default State
                </span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>allow-cheats=false</span>
                </span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                OFF (Locked)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 🚫 3. BANNED PLAYERS & MANUAL BAN */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <UserX className="w-3.5 h-3.5 text-rose-600" />
              <span>Banned Players Registry ({bannedPlayers.length})</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Cheaters and manually banned players are locked out permanently.
            </p>
          </div>
        </div>

        {/* Manual Ban Input */}
        <form onSubmit={handleBanPlayer} className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={banPlayerInput}
              onChange={(e) => setBanPlayerInput(e.target.value)}
              placeholder="Player gamertag to ban..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <input
              type="text"
              value={banReasonInput}
              onChange={(e) => setBanReasonInput(e.target.value)}
              placeholder="Ban reason..."
              className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <button
              type="submit"
              disabled={!banPlayerInput.trim()}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 transition-colors"
            >
              Ban Player
            </button>
          </div>
        </form>

        {/* Banned List */}
        {bannedPlayers.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic py-1">
            No players currently banned. Server is clean.
          </p>
        ) : (
          <div className="space-y-1.5 pt-1">
            {bannedPlayers.map((player) => (
              <div
                key={player}
                className="flex items-center justify-between p-2 bg-rose-50/70 border border-rose-200 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2">
                  <UserX className="w-3.5 h-3.5 text-rose-600" />
                  <span className="font-bold text-rose-900">{player}</span>
                  <span className="text-[10px] text-rose-600">Permanently Banned</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnbanPlayer(player)}
                  className="px-2 py-0.5 bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-colors"
                >
                  Unban
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📜 4. SECURITY LOG & INCIDENTS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-600" />
            <span>Anti-Cheat Activity & Defense Logs</span>
          </h3>
          <span className="text-[11px] text-slate-400">Real-time Defense</span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px]">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="p-2 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-[10px] text-slate-400">{inc.timestamp}</span>
                <span className="font-bold text-slate-800">{inc.playerName}</span>
                <span className="text-slate-500">[{inc.cheatType}]</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                {inc.actionTaken}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

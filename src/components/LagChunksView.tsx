import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  AlertTriangle,
  RefreshCw,
  Layers,
  Sparkles,
  Users,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Sliders,
  Send,
  Radio,
  Clock,
  Compass,
  FileText,
  Volume2
} from 'lucide-react';
import { LagStatus, PlayerChunkIssue } from '../types';

interface LagChunksViewProps {
  onBack?: () => void;
  onlinePlayers?: { name: string; ping: number }[];
}

export const LagChunksView: React.FC<LagChunksViewProps> = ({ onBack, onlinePlayers = [] }) => {
  const [lagData, setLagData] = useState<LagStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'warn' | 'error'; text: string } | null>(null);

  // Warning broadcast input
  const [customWarning, setCustomWarning] = useState('⚠ Server Lag Spike! Auto-optimizing chunks & mob ticking...');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('ALL');

  const fetchLagStatus = async () => {
    try {
      const res = await fetch('/api/lag/status');
      if (res.ok) {
        const data = await res.json();
        setLagData(data);
      }
    } catch (err) {
      console.error('Failed to fetch lag status:', err);
    }
  };

  useEffect(() => {
    fetchLagStatus();
    const interval = setInterval(fetchLagStatus, 2500);
    return () => clearInterval(interval);
  }, []);

  const showToast = (type: 'success' | 'warn' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. In-Game Warning Broadcast
  const handleBroadcastWarning = async (msg?: string) => {
    const textToSend = msg || customWarning;
    if (!textToSend.trim()) return;
    setActionLoading('warn');
    try {
      const res = await fetch('/api/lag/warn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('warn', '📢 Warning broadcasted to in-game title & chat screens!');
        fetchLagStatus();
      } else {
        throw new Error(data.error || 'Failed to broadcast warning');
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 2. Clear Ground Items & Clutter
  const handleClearEntities = async () => {
    setActionLoading('clear-entities');
    try {
      const res = await fetch('/api/lag/clear-entities', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('success', '🧹 Ground items and XP orbs cleared! TPS restored to 20.');
        fetchLagStatus();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Fix Mob & Animal Animation Glitch
  const handleFixMobAnimations = async () => {
    setActionLoading('fix-mobs');
    try {
      const res = await fetch('/api/lag/fix-mob-animations', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('success', '✨ Mob and animal animations synchronized smoothly!');
        fetchLagStatus();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 4. Fix Single or All Player Chunks
  const handleFixPlayerChunks = async (playerName: string = 'ALL') => {
    setActionLoading(`fix-chunk-${playerName}`);
    try {
      const res = await fetch('/api/lag/fix-player-chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', `🔄 Chunks re-synchronized and reloaded for ${playerName === 'ALL' ? 'all players' : playerName}!`);
        fetchLagStatus();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 5. Optimize Server Properties for Zero-Lag Chunks
  const handleOptimizeSettings = async () => {
    setActionLoading('optimize-settings');
    try {
      const res = await fetch('/api/lag/optimize-settings', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('success', '⚡ View Distance set to 8 & Tick Distance to 4 (Zero-Lag Engine applied)!');
        fetchLagStatus();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 6. Toggle Auto Guard
  const handleToggleGuard = async (key: 'autoLagMitigation' | 'autoBroadcastWarning', currentVal: boolean) => {
    try {
      const res = await fetch('/api/lag/toggle-guard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: !currentVal })
      });
      if (res.ok) {
        fetchLagStatus();
        showToast('success', `Watchdog setting updated!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 7. Flush Chunks to disk
  const handleFlushChunks = async () => {
    setActionLoading('flush-chunks');
    try {
      const res = await fetch('/api/lag/flush-chunks', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('success', '💾 World chunks flushed to disk and RAM buffers cleared!');
        fetchLagStatus();
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const tps = lagData?.tps ?? 20.0;
  const isCritical = lagData?.lagSeverity === 'critical' || tps < 15.0;
  const isModerate = lagData?.lagSeverity === 'moderate' || (tps >= 15.0 && tps < 18.5);
  const isSmooth = !isCritical && !isModerate;

  const mobStatus = lagData?.mobAnimationStatus || 'smooth';

  const issuesList = lagData?.playerChunkIssues || [];

  return (
    <div className="space-y-4">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-md animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : toastMessage.type === 'warn'
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* 1. TOP LIVE HEALTH & ANIMATION STATUS BANNER */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 relative overflow-hidden transition-all shadow-sm ${
          isCritical
            ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/30'
            : isModerate
            ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30'
            : 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 border-emerald-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isCritical
                  ? 'bg-rose-600 text-white animate-pulse'
                  : isModerate
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              <Activity className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isCritical
                      ? 'bg-rose-200 text-rose-900 border border-rose-300'
                      : isModerate
                      ? 'bg-amber-200 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  {isCritical ? 'Critical Lag' : isModerate ? 'Moderate Latency' : 'Smooth 20 TPS'}
                </span>

                <span className="text-xs font-mono font-bold text-slate-700 bg-white/80 px-2 py-0.5 rounded-lg border border-slate-200">
                  TPS: <strong className={isCritical ? 'text-rose-600' : isModerate ? 'text-amber-600' : 'text-emerald-600'}>{tps.toFixed(1)} / 20.0</strong>
                </span>

                <span className="text-[11px] font-semibold text-slate-500">
                  View: {lagData?.viewDistance || 8} chunks • Tick: {lagData?.tickDistance || 4} chunks
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                {isCritical ? (
                  <>
                    <span className="text-rose-600">⚠ सर्वर पर लैग और एनिमेशन ग्लिच डिटेक्ट हुआ!</span>
                  </>
                ) : isModerate ? (
                  <>
                    <span className="text-amber-700">हल्का लैग: मॉब व जानवरों में देरी संभव</span>
                  </>
                ) : (
                  <>
                    <span className="text-emerald-700">सर्वर बिल्कुल स्मूथ चल रहा है (Zero Glitch)</span>
                  </>
                )}
              </h3>

              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {mobStatus === 'glitched'
                  ? 'जानवर और मॉब्स हवा में रुक रहे हैं या टेलीपोर्ट हो रहे हैं। नीचे "Fix Mob Animations" या "Reload Chunks" बटन दबाएं।'
                  : mobStatus === 'stuttering'
                  ? 'चंक लोडिंग की वजह से हल्का स्टटर है। सर्वर ऑटो-ऑप्टिमाइजेशन चालू है।'
                  : 'सभी मॉब्स, जानवर और प्लेयर्स के चंक्स 20 TPS पर बिना रुके स्मूथ रेंडर हो रहे हैं।'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={fetchLagStatus}
              className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all shadow-2xs active:scale-95"
              title="Refresh Live Metrics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleBroadcastWarning()}
              disabled={actionLoading === 'warn'}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              <span>{actionLoading === 'warn' ? 'Sending...' : 'Warn In-Game'}</span>
            </button>
          </div>
        </div>

        {/* Status mini bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200/60 text-xs">
          <div className="bg-white/80 p-2 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Mob Animation</span>
            <span
              className={`font-bold capitalize ${
                mobStatus === 'glitched'
                  ? 'text-rose-600'
                  : mobStatus === 'stuttering'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              ● {mobStatus}
            </span>
          </div>

          <div className="bg-white/80 p-2 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Stray Ground Items</span>
            <span className="font-bold text-slate-800">
              ~{lagData?.strayItemCountEst || 0} drops
            </span>
          </div>

          <div className="bg-white/80 p-2 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">24/7 Ticking Farms</span>
            <span className="font-bold text-indigo-700">
              {lagData?.activeTickingAreas || 0} active areas
            </span>
          </div>

          <div className="bg-white/80 p-2 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Last In-Game Alert</span>
            <span className="font-bold text-slate-700 truncate block">
              {lagData?.lastLagWarningTime || 'None recently'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. 1-CLICK QUICK ANTI-LAG REPAIRS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>1-Click Anti-Lag & Animation Repair Tools</span>
            </h4>
            <p className="text-xs text-slate-500">
              लैग या ग्लिच आने पर तुरंत 1-क्लिक में सर्वर रीफ्रेश करें
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Action 1: Fix Mob & Animal Animations */}
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                  🐴 Fix Mob & Animals Animation Glitch
                </span>
                <span className="text-[9px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/80 mt-1">
                जानवरों के अटकने, हवा में रुकने और रबरबैंडिंग को ठीक करता है। Entity tick rate को 20 TPS पर लॉक करता है।
              </p>
            </div>
            <button
              onClick={handleFixMobAnimations}
              disabled={actionLoading === 'fix-mobs'}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{actionLoading === 'fix-mobs' ? 'Synchronizing...' : 'Fix Mob Animations Now'}</span>
            </button>
          </div>

          {/* Action 2: Clear Stray Items & XP Drops */}
          <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1">
                  🧹 Clear Ground Items & XP Orbs
                </span>
                <span className="text-[9px] bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                  Instant TPS Boost
                </span>
              </div>
              <p className="text-[11px] text-rose-800/80 mt-1">
                जमीन पर गिरे बेकार आइटम्स, तीर और XP ड्रॉप्स को हटाता है। बिना किसी प्लेयर या जानवर को नुकसान पहुंचाए।
              </p>
            </div>
            <button
              onClick={handleClearEntities}
              disabled={actionLoading === 'clear-entities'}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{actionLoading === 'clear-entities' ? 'Clearing...' : 'Clear Ground Clutter'}</span>
            </button>
          </div>

          {/* Action 3: Reload All Player Chunks */}
          <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                  🔄 Reload All Players' Chunks
                </span>
                <span className="text-[9px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded font-bold">
                  Resync Packets
                </span>
              </div>
              <p className="text-[11px] text-indigo-800/80 mt-1">
                सभी ऑनलाइन खिलाड़ियों के आस-पास के चंक्स को रीलोड करता है और ब्लैक स्क्रीन/अटके हुए ब्लॉक्स ठीक करता है।
              </p>
            </div>
            <button
              onClick={() => handleFixPlayerChunks('ALL')}
              disabled={actionLoading === 'fix-chunk-ALL'}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{actionLoading === 'fix-chunk-ALL' ? 'Reloading...' : 'Reload All Chunks'}</span>
            </button>
          </div>

          {/* Action 4: Optimal Bedrock Config */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  ⚙️ Apply Zero-Lag Server Config
                </span>
                <span className="text-[9px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                  Config
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                View-Distance=8 और Tick-Distance=4 सेट करता है, जिससे मोबाइल फोन पर चंक लोडिंग लैग कभी नहीं होता।
              </p>
            </div>
            <button
              onClick={handleOptimizeSettings}
              disabled={actionLoading === 'optimize-settings'}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{actionLoading === 'optimize-settings' ? 'Applying...' : 'Enforce 8-Chunk View Distance'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. PER-PLAYER CHUNK INSPECTOR & UNSTUCK TOOL (USER'S EXACT PROBLEM SOLVER) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Single Player vs Server Chunk Diagnostic (सिंगल प्लेयर चंक जांच)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              कभी-कभार सबका लैग नहीं होता बल्कि किसी एक प्लेयर के कारण सर्वर अटकता है। यहां हर प्लेयर के चंक को अलग से फिक्स करें।
            </p>
          </div>

          <button
            onClick={() => handleFlushChunks()}
            disabled={actionLoading === 'flush-chunks'}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
            title="Flush world chunks to disk"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Flush World Chunks</span>
          </button>
        </div>

        {/* Educational Note */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 mb-4 leading-relaxed">
          <strong className="font-bold flex items-center gap-1 text-amber-950 mb-1">
            💡 ऐसा क्यों होता है? (Why single player causes chunk lag):
          </strong>
          जब कोई एक प्लेयर अपने मोबाइल में बहुत तेज भागकर नए अन-एक्सप्लोर चंक्स लोड करता है या हाई रेंडर डिस्टेंस रखता है, 
          तो बेडरॉक सर्वर केवल उस अकेले प्लेयर के चंक्स बनाने में बिजी हो जाता है। इससे बाकी खिलाड़ियों के जानवर और मॉब्स अटकने (Glitch) लगते हैं।
          नीचे दिए गए <strong>"Fix Chunks"</strong> बटन से उस प्लेयर के चंक्स तुरंत रि-सिंक हो जाते हैं!
        </div>

        {/* Players List Table / Cards */}
        {issuesList.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/60">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-600">No players currently online</p>
            <p className="text-[11px] text-slate-400">
              जब कोई खिलाड़ी सर्वर में जुड़ेगा, तो उसके चंक्स और पिंग की लाइव हेल्थ यहां दिखेगी।
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {issuesList.map((issue) => {
              const isHigh = issue.severity === 'high';
              const isMed = issue.severity === 'medium';

              return (
                <div
                  key={issue.playerName}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isHigh
                      ? 'bg-rose-50/60 border-rose-300'
                      : isMed
                      ? 'bg-amber-50/60 border-amber-300'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isHigh
                          ? 'bg-rose-500 text-white'
                          : isMed
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {issue.playerName.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {issue.playerName}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            issue.ping > 120
                              ? 'bg-rose-100 text-rose-800'
                              : issue.ping > 70
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {issue.ping}ms Ping
                        </span>

                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isHigh
                              ? 'bg-rose-200 text-rose-900'
                              : isMed
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {issue.severity} Latency
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {issue.issue} • <em>{issue.suggestedFix}</em>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleFixPlayerChunks(issue.playerName)}
                      disabled={actionLoading === `fix-chunk-${issue.playerName}`}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>
                        {actionLoading === `fix-chunk-${issue.playerName}` ? 'Fixing...' : 'Fix Chunks'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. IN-GAME WARNING BROADCAST HUB */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-amber-600" />
              <span>In-Game Lag Warning Broadcaster (गेम में चेतावनी भेजें)</span>
            </h4>
            <p className="text-xs text-slate-500">
              जब भी सर्वर में लैग हो, सभी खिलाड़ियों की स्क्रीन पर बड़ा चेतावनी बैनर दिखाएं
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={customWarning}
              onChange={(e) => setCustomWarning(e.target.value)}
              placeholder="Type warning message for players..."
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <button
              onClick={() => handleBroadcastWarning(customWarning)}
              disabled={actionLoading === 'warn' || !customWarning.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast</span>
            </button>
          </div>

          {/* Quick Preset Warning Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Presets:</span>
            {[
              '⚠ Server Lag Detected! Optimizing chunks & mob animations...',
              '🛑 High chunk load! Please do not run fast into unrendered areas.',
              '🧹 Clearing dropped ground items in 10 seconds to restore 20 TPS.',
              '✔ Lag cleared! Server running smooth at 20 TPS.'
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCustomWarning(preset);
                  handleBroadcastWarning(preset);
                }}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors border border-slate-200/80 active:scale-95"
              >
                {preset.split('!')[0] || preset.substring(0, 25)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. 24/7 AUTO-LAG WATCHDOG SETTINGS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>24/7 Automatic Lag Watchdog (ऑटो-लैग गार्ड)</span>
            </h4>
            <p className="text-xs text-slate-500">
              सर्वर खुद ब खुद लैग डिटेक्ट करके प्लेयर्स को वार्निंग देगा और कचरा साफ करेगा
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Toggle 1: Auto In-Game Warning */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                📢 Auto-Broadcast In-Game Warning on Lag Spike
              </span>
              <p className="text-[11px] text-slate-500">
                जब भी टिक रेट घटे या मॉब एनिमेशन रुके, सर्वर खुद प्लेयर्स की स्क्रीन पर वार्निंग दिखाएगा
              </p>
            </div>
            <button
              onClick={() => handleToggleGuard('autoBroadcastWarning', lagData?.autoBroadcastWarning ?? true)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                lagData?.autoBroadcastWarning ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  lagData?.autoBroadcastWarning ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Toggle 2: Auto-Clear Clutter on Lag */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                🧹 Auto-Mitigation (Auto-Clear Stray Items)
              </span>
              <p className="text-[11px] text-slate-500">
                लैग होने पर जमीन पर पड़े बेकार ड्रॉप्स और एक्स्ट्रा प्रोजेक्टाइल को अपने आप साफ करेगा
              </p>
            </div>
            <button
              onClick={() => handleToggleGuard('autoLagMitigation', lagData?.autoLagMitigation ?? true)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                lagData?.autoLagMitigation ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  lagData?.autoLagMitigation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 6. RECENT INCIDENTS LOG */}
      {lagData?.recentIncidents && lagData.recentIncidents.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Recent Lag & Chunk Incidents Log</span>
          </h4>

          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto font-mono text-[11px]">
            {lagData.recentIncidents.slice(0, 8).map((inc) => (
              <div key={inc.id} className="py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-400 shrink-0 font-sans text-[10px]">{inc.timestamp}</span>
                  <span className="font-semibold text-slate-800 truncate">{inc.message}</span>
                </div>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-sans font-bold shrink-0">
                  {inc.actionTaken}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

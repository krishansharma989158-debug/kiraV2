import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Compass,
  Plus,
  Trash2,
  Sparkles,
  Gift,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Eye,
  Lock,
  Skull,
  Send,
  Sliders,
  MapPin,
  Check,
  Copy,
  Terminal,
  Box,
  Flame,
  Bomb,
  Layers,
  Unlock,
  Radio,
  Clock
} from 'lucide-react';
import { BaseClaim, BaseProtectionConfig, Player } from '../types';

interface BaseProtectionViewProps {
  onBack: () => void;
  onlinePlayers?: Player[];
}

export const BaseProtectionView: React.FC<BaseProtectionViewProps> = ({
  onBack,
  onlinePlayers = []
}) => {
  const [config, setConfig] = useState<BaseProtectionConfig>({
    enabled: true,
    defaultRadius: 300,
    defaultAction: 'visitor',
    coreItem: 'lodestone',
    autoGiveCoreToNewPlayers: true,
    autoRestoreMemberOnExit: true,
    placeWithBlastAtOnce: false,
    blastFlatRadius: 100,
    blastFillBlock: 'grass_block'
  });

  const [bases, setBases] = useState<BaseClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form for new base registration
  const [showAddForm, setShowAddForm] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [baseName, setBaseName] = useState('');
  const [posX, setPosX] = useState('0');
  const [posY, setPosY] = useState('70');
  const [posZ, setPosZ] = useState('0');
  const [radiusInput, setRadiusInput] = useState('300');
  const [actionInput, setActionInput] = useState<'visitor' | 'kill' | 'teleport_spawn'>('visitor');
  const [trustedInput, setTrustedInput] = useState('');

  // Manual Block Giving State
  const [givePlayerTarget, setGivePlayerTarget] = useState('@p');
  const [customGamertag, setCustomGamertag] = useState('');
  const [useCustomGamertag, setUseCustomGamertag] = useState(false);
  const [blockQuantity, setBlockQuantity] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live Location & Instant 1-Click Auto Claim State
  const [playerLocations, setPlayerLocations] = useState<Record<string, { x: number; y: number; z: number }>>({});
  const [autoClaimRadius, setAutoClaimRadius] = useState<number>(300);
  const [autoClaimLoading, setAutoClaimLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/protection/player-locations');
      if (res.ok) {
        const d = await res.json();
        if (d.coordinates) setPlayerLocations(d.coordinates);
      }
    } catch (e) {}
  };

  const fetchProtectionData = async () => {
    try {
      const res = await fetch('/api/protection/bases');
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig(data.config);
        if (data.bases) setBases(data.bases);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProtectionData();
    fetchLocations();
    const interval = setInterval(() => {
      fetchLocations();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveConfig = async (updatedConfig: Partial<BaseProtectionConfig>) => {
    const merged = { ...config, ...updatedConfig };
    setConfig(merged);
    try {
      const res = await fetch('/api/protection/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged)
      });
      if (res.ok) {
        showToast('⚙️ Base protection settings updated!');
        fetchProtectionData();
      }
    } catch (e) {
      showToast('❌ Failed to update settings');
    }
  };

  const handleAutoClaim = async (targetPlayer: string) => {
    if (!targetPlayer) return;
    setAutoClaimLoading(true);
    try {
      const res = await fetch('/api/protection/auto-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: targetPlayer,
          baseName: `${targetPlayer}'s Sanctuary`,
          radius: autoClaimRadius,
          actionOnTrespass: config.defaultAction || 'visitor'
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `🛡️ Base claimed for ${targetPlayer}!`);
        fetchProtectionData();
        fetchLocations();
      } else {
        showToast(data.error || '❌ Failed to claim base');
      }
    } catch (e: any) {
      showToast('❌ Error claiming base');
    } finally {
      setAutoClaimLoading(false);
    }
  };

  const handleGiveCore = async (player?: string, count?: number) => {
    const finalPlayer = (useCustomGamertag && customGamertag.trim())
      ? customGamertag.trim()
      : (player || givePlayerTarget || '@p');
    const finalCount = count || blockQuantity || 1;

    setLoading(true);
    try {
      const res = await fetch('/api/protection/give-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: finalPlayer, count: finalCount })
      });
      if (res.ok) {
        showToast(`🎁 Gave ${finalCount}x Protection Block to "${finalPlayer}"!`);
      } else {
        showToast('❌ Failed to deliver block');
      }
    } catch (e) {
      showToast('❌ Could not give block');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !baseName.trim()) {
      showToast('⚠️ Owner Gamertag and Base Name are required');
      return;
    }

    const trustedList = trustedInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      ownerGamertag: ownerName.trim(),
      baseName: baseName.trim(),
      centerX: parseInt(posX, 10) || 0,
      centerY: parseInt(posY, 10) || 70,
      centerZ: parseInt(posZ, 10) || 0,
      radius: parseInt(radiusInput, 10) || 300,
      actionOnTrespass: actionInput,
      trustedMembers: trustedList
    };

    setLoading(true);
    try {
      const res = await fetch('/api/protection/bases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(`🛡️ Base "${payload.baseName}" protected with ${payload.radius}m shield!`);
        setShowAddForm(false);
        setOwnerName('');
        setBaseName('');
        setTrustedInput('');
        fetchProtectionData();
      }
    } catch (e) {
      showToast('❌ Error creating base shield');
    } finally {
      setLoading(false);
    }
  };

  // Admin-Only Removal of Protection Block from World & Database
  const handleRemoveBlockFromWorld = async (id: string, owner: string, x: number, y: number, z: number) => {
    if (!confirm(`Are you sure you want to remove the Protection Block for "${owner}" at [${x}, ${y}, ${z}]? This will delete the block from the Minecraft world!`)) {
      return;
    }

    setActionLoadingId(id);
    try {
      const res = await fetch('/api/protection/remove-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `🗑️ Protection block removed from world at [${x}, ${y}, ${z}]!`);
        fetchProtectionData();
      } else {
        showToast(data.error || '❌ Failed to remove block');
      }
    } catch (e) {
      showToast('❌ Error removing protection block');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Admin Manual Flat Blast Trigger
  const handleTriggerFlatBlast = async (id: string, radius?: number) => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/protection/trigger-blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, radius: radius || config.blastFlatRadius || 100 })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || '💥 Flat blast executed!');
        fetchProtectionData();
      } else {
        showToast(data.error || '❌ Blast failed');
      }
    } catch (e) {
      showToast('❌ Error triggering flat blast');
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyCommandText = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                <span>Base Protection & Anti-Theft Shield</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                  Anti-Grief
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                300-Block perimeter shield • Auto-Visitor Mode • Dedicated Protection Block
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchProtectionData}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors active:scale-95"
            title="Refresh Bases"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Unified Single Protection Block Explanation */}
        <div className="mt-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-950 leading-relaxed space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-emerald-900">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>सिंगल स्पेशल सुरक्षा ब्लॉक (Dedicated Protection Block):</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-normal">
            यहाँ कोई बीकन (Beacon) पिरामिड की जरूरत नहीं है! यह <b>100% सॉलिड Protection Block</b> है जिसे प्लेयर जमीन पर कहीं भी रख सकता है। इसके पास जाते ही गेम में <b>[PROTECTION BLOCK]</b> का फ्लोटिंग टेक्स्ट और ऑरा दिखता है, और 300 ब्लॉक के अंदर कोई भी अनजान प्लेयर न ब्लॉक तोड़ सकता है और न चेस्ट लूट सकता है!
          </p>
        </div>
      </div>

      {/* 2. ADMIN OPTION: PLACE WITH BLAST AT ONCE (FLAT BLAST & PERMANENT LOCK) */}
      <div className={`rounded-2xl p-4 border transition-all shadow-xs space-y-3.5 ${
        config.placeWithBlastAtOnce
          ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-500/20'
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
              config.placeWithBlastAtOnce ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <Bomb className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>Place with Blast at Once / तुरंत फ्लैट ब्लास्ट विकल्प</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  config.placeWithBlastAtOnce
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {config.placeWithBlastAtOnce ? '💥 ARMED (100-300m Flat + Locked)' : 'OFF (Player Can Break)'}
                </span>
              </h4>
              <p className="text-[10px] text-slate-500">
                ब्लॉक प्लेस होते ही 100-300 ब्लॉक का एरिया तुरंत सपाट (Flat) करें और ब्लॉक को परमानेंट लॉक करें
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={Boolean(config.placeWithBlastAtOnce)}
              onChange={(e) => handleSaveConfig({ placeWithBlastAtOnce: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Radius Selector for Flat Blast */}
        <div className="p-3 bg-white/80 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>Flat Blast Radius (कितने ब्लॉक तक जमीन सपाट होगी):</span>
            </span>
            <span className="font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
              {config.blastFlatRadius || 100} Blocks Radius
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[100, 150, 200, 300].map((rad) => (
              <button
                key={rad}
                type="button"
                onClick={() => handleSaveConfig({ blastFlatRadius: rad })}
                className={`py-2 px-1 text-xs font-mono font-bold rounded-lg border transition-all text-center ${
                  (config.blastFlatRadius || 100) === rad
                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {rad} Blocks
              </button>
            ))}
          </div>

          {/* Hindi Description Card */}
          <div className={`p-2.5 rounded-lg text-[11px] leading-relaxed border ${
            config.placeWithBlastAtOnce
              ? 'bg-amber-100/70 border-amber-300 text-amber-950 font-medium'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            {config.placeWithBlastAtOnce ? (
              <p>
                💥 <b>जब यह ऑप्शन ON है:</b> खिलाड़ी जैसे ही ब्लॉक लगाएगा, वहां से <b>{config.blastFlatRadius || 100} ब्लॉक</b> तक पहाड़, पेड़ और ऊंची जमीन पूरी तरह सपाट (Flat) हो जाएगी। साथ ही यह ब्लॉक <b>परमानेंट लॉक</b> हो जाएगा — खिलाड़ी इसे दोबारा कभी नहीं तोड़ पाएगा, केवल आप अपने <b>Admin Panel</b> से ही इसे हटा सकते हैं!
              </p>
            ) : (
              <p>
                🌿 <b>जब यह ऑप्शन OFF है:</b> इलाका फ्लैट नहीं होगा। खिलाड़ी जब चाहे इस ब्लॉक को कुदाल (Pickaxe) से तोड़कर अपनी मर्जी से किसी भी दूसरी जगह लगा सकता है।
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. ACTIVE PROTECTION BLOCKS LIST IN WORLD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
              🛡️
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Placed Protection Blocks / स्थापित सुरक्षा ब्लॉक्स की सूची ({bases.length})
              </h4>
              <p className="text-[10px] text-slate-500">
                गेम में यह ब्लॉक कहाँ-कहाँ लगे हैं और उनकी लाइव स्थिति
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Block Coords</span>
          </button>
        </div>

        {/* Add coordinates form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateBase}
            className="p-3.5 bg-slate-50 border border-emerald-200 rounded-xl space-y-2.5 animate-in fade-in duration-150"
          >
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Register New Protection Block Coordinates</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Owner Gamertag
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Steve or Gamer123"
                  className="w-full text-xs font-semibold px-2.5 py-2 bg-white border border-slate-200 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Base Name
                </label>
                <input
                  type="text"
                  required
                  value={baseName}
                  onChange={(e) => setBaseName(e.target.value)}
                  placeholder="e.g. Main Castle Base"
                  className="w-full text-xs font-semibold px-2.5 py-2 bg-white border border-slate-200 rounded-lg focus:outline-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Coordinates (X, Y, Z in Minecraft)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={posX}
                  onChange={(e) => setPosX(e.target.value)}
                  placeholder="X"
                  className="w-full text-xs font-mono font-bold px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center"
                />
                <input
                  type="number"
                  value={posY}
                  onChange={(e) => setPosY(e.target.value)}
                  placeholder="Y (60-80)"
                  className="w-full text-xs font-mono font-bold px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center"
                />
                <input
                  type="number"
                  value={posZ}
                  onChange={(e) => setPosZ(e.target.value)}
                  placeholder="Z"
                  className="w-full text-xs font-mono font-bold px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Shield Perimeter (Blocks)
                </label>
                <input
                  type="number"
                  value={radiusInput}
                  onChange={(e) => setRadiusInput(e.target.value)}
                  className="w-full text-xs font-mono font-bold px-2.5 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Intruder Penalty
                </label>
                <select
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value as any)}
                  className="w-full text-xs font-semibold px-2.5 py-2 bg-white border border-slate-200 rounded-lg"
                >
                  <option value="visitor">Visitor (Cannot break or steal)</option>
                  <option value="kill">Instant Kill Turret</option>
                  <option value="teleport_spawn">Teleport to World Spawn</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Save Block</span>
              </button>
            </div>
          </form>
        )}

        {/* Protection Blocks Table/Cards */}
        {bases.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">No protection blocks placed yet</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              प्लेयर को प्रोटेक्शन ब्लॉक दें या नीचे ऑनलाइन प्लेयर की लोकेशन पर 1-क्लिक में ब्लॉक लॉक करें।
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {bases.map((b, idx) => (
              <div
                key={b.id}
                className="p-3.5 bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <span className="text-emerald-700 font-mono">#{idx + 1}</span>
                      <span>{b.baseName}</span>
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      Owner: {b.ownerGamertag}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      b.locked
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {b.locked ? <Lock className="w-3 h-3 text-amber-700" /> : <Unlock className="w-3 h-3 text-slate-500" />}
                      <span>{b.locked ? 'Locked (Admin Only Removal)' : 'Player Removable'}</span>
                    </span>

                    {b.flattened && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-rose-600" />
                        <span>{b.flattenRadius || 100}m Flat Blasted</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>Coordinates: <b>[{b.centerX}, {b.centerY}, {b.centerZ}]</b></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-blue-500" />
                      <span>Shield: <b>{b.radius}m Radius</b></span>
                    </span>
                  </div>

                  {/* In-Game Hologram Indicator Notice */}
                  <div className="text-[10px] text-emerald-800 bg-emerald-50/70 border border-emerald-200 px-2 py-1 rounded-lg flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span><b>In-Game Display:</b> इस ब्लॉक के 6 ब्लॉक पास जाने पर <b>[PROTECTION BLOCK]</b> और ऑरा शो होता है।</span>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {/* Trigger Flat Blast */}
                  <button
                    type="button"
                    onClick={() => handleTriggerFlatBlast(b.id, config.blastFlatRadius || 100)}
                    disabled={actionLoadingId === b.id}
                    title="1-Click Flat Blast around this block"
                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-all disabled:opacity-50"
                  >
                    <Bomb className="w-3.5 h-3.5" />
                    <span>Blast Flat</span>
                  </button>

                  {/* Teleport to Block */}
                  <button
                    type="button"
                    onClick={() => copyCommandText(`tp @p ${b.centerX} ${b.centerY + 1} ${b.centerZ}`, b.id)}
                    title="Copy TP command"
                    className="p-1.5 bg-white hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-lg text-xs transition-colors active:scale-95"
                  >
                    {copiedId === b.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {/* Remove Block from World & Admin Panel */}
                  <button
                    type="button"
                    onClick={() => handleRemoveBlockFromWorld(b.id, b.ownerGamertag, b.centerX, b.centerY, b.centerZ)}
                    disabled={actionLoadingId === b.id}
                    title="Remove Protection Block from World (Admin Only)"
                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Block</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. INSTANT 1-CLICK BASE CLAIM FOR ONLINE PLAYERS */}
      <div className="bg-white border border-emerald-300 ring-2 ring-emerald-500/20 rounded-2xl p-4 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              ✨
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1-Click Live Location Claim / जहां खड़े हैं वहीं ब्लॉक लगाएं
              </h4>
              <p className="text-[10px] text-slate-500">
                प्लेयर की गेम में लाइव लोकेशन पर तुरंत Protection Block लॉक करें
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full animate-pulse">
            Live Tracker
          </span>
        </div>

        {/* Online Players Location & 1-Click Claim Buttons */}
        {onlinePlayers.length === 0 ? (
          <div className="p-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
            <Users className="w-6 h-6 text-slate-300 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-700">No players currently online</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              जैसे ही आप या कोई प्लेयर सर्वर में जॉइन करेंगे, यहां 1-क्लिक "Claim Shield Here" का बटन आ जाएगा!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-600 block">
              Online Players in World (लाइव खिलाड़ी):
            </span>

            {onlinePlayers.map((p) => {
              const loc = playerLocations[p.name] || { x: 0, y: 70, z: 0 };
              return (
                <div
                  key={p.xuid || p.name}
                  className="p-3 bg-slate-50/90 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs truncate">
                        🎮 {p.name}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        {p.ping || 25}ms
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span>Live Position: X: {loc.x}, Y: {loc.y}, Z: {loc.z}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleGiveCore(p.name, 1)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all active:scale-95"
                      title="Give 1x Protection Block in Hand"
                    >
                      Give Block
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAutoClaim(p.name)}
                      disabled={autoClaimLoading}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{autoClaimLoading ? 'Claiming...' : 'Claim 300m Shield Here'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. MANUAL BLOCK DISTRIBUTION & 1-CLICK ACTIONS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Give Protection Block / स्पेशल सुरक्षा ब्लॉक वितरण
            </h4>
          </div>
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
            Admin Controlled
          </span>
        </div>

        {/* Player Selector & Mode Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Target Player (किस प्लेयर को देना है):</span>
            </label>
            <button
              type="button"
              onClick={() => setUseCustomGamertag(!useCustomGamertag)}
              className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 underline"
            >
              {useCustomGamertag ? '← Select from list' : '✏️ Type Custom Gamertag'}
            </button>
          </div>

          {useCustomGamertag ? (
            <input
              type="text"
              value={customGamertag}
              onChange={(e) => setCustomGamertag(e.target.value)}
              placeholder="Enter exact Minecraft Gamertag (e.g. Steve or Gamer99)"
              className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-purple-600 shadow-2xs"
            />
          ) : (
            <select
              value={givePlayerTarget}
              onChange={(e) => setGivePlayerTarget(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-purple-600"
            >
              <option value="@p">Closest Player (@p)</option>
              <option value="@a">All Players in Server (@a)</option>
              {onlinePlayers.map((p) => (
                <option key={p.xuid || p.name} value={p.name}>
                  🎮 {p.name} (Online Player)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Quantity and Give Button Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">Quantity:</span>
            {[1, 4, 16, 64].map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => setBlockQuantity(qty)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                  blockQuantity === qty
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {qty}x
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleGiveCore()}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
          >
            <Gift className="w-4 h-4" />
            <span>Give {blockQuantity}x Protection Block Now</span>
          </button>
        </div>

        {/* Command Reference Buttons */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-600" />
              <span>In-Game Chat Commands (Click to Copy):</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">1-Click Copy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => copyCommandText('/give @s lodestone 1', 'cmd-give-lodestone')}
              className="p-2 bg-white border border-slate-200 hover:border-purple-300 rounded-lg text-left flex items-center justify-between group"
            >
              <div className="truncate">
                <span className="text-purple-600 font-bold">/give @s lodestone 1</span>
                <span className="block text-[10px] text-slate-400 font-sans">Self Protection Block</span>
              </div>
              {copiedId === 'cmd-give-lodestone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            <button
              type="button"
              onClick={() => copyCommandText(`/givecore ${useCustomGamertag && customGamertag ? customGamertag : '@p'}`, 'cmd-givecore')}
              className="p-2 bg-white border border-slate-200 hover:border-purple-300 rounded-lg text-left flex items-center justify-between group"
            >
              <div className="truncate">
                <span className="text-emerald-700 font-bold">/givecore @p</span>
                <span className="block text-[10px] text-slate-400 font-sans">Console Shortcut</span>
              </div>
              {copiedId === 'cmd-givecore' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* 6. GLOBAL SHIELD RULES & THRESHOLDS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Shield Protection Settings
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Panel Controlled</span>
        </div>

        {/* Protection Enable Toggle */}
        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Active Base Shield Engine
            </span>
            <span className="text-[11px] text-slate-500 block leading-tight">
              Runs 24/7 background perimeter detection against griefers.
            </span>
          </div>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => handleSaveConfig({ enabled: e.target.checked })}
            className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 shrink-0 cursor-pointer"
          />
        </div>

        {/* Default Radius (Slider 50m to 600m) */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Base Shield Perimeter Radius</span>
            </span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-xs">
              {config.defaultRadius} Blocks
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="600"
            step="25"
            value={config.defaultRadius}
            onChange={(e) =>
              handleSaveConfig({ defaultRadius: parseInt(e.target.value, 10) })
            }
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>50 Blocks (Small Base)</span>
            <span>300 Blocks (Default Empire)</span>
            <span>600 Blocks (Mega Territory)</span>
          </div>
        </div>

        {/* Trespasser Action */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Action When Other Player Enters Protected Zone:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* 1. VISITOR MODE */}
            <button
              type="button"
              onClick={() => handleSaveConfig({ defaultAction: 'visitor' })}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                config.defaultAction === 'visitor'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">1. Visitor Mode</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Cannot break blocks or loot chests. Returns to Member on exit.
              </p>
            </button>

            {/* 2. INSTANT KILL */}
            <button
              type="button"
              onClick={() => handleSaveConfig({ defaultAction: 'kill' })}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                config.defaultAction === 'kill'
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Skull className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-xs font-bold text-slate-900">2. Instant Kill</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Lethal defense turret. Eliminates unauthorized trespassers!
              </p>
            </button>

            {/* 3. WARP TO SPAWN */}
            <button
              type="button"
              onClick={() => handleSaveConfig({ defaultAction: 'teleport_spawn' })}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                config.defaultAction === 'teleport_spawn'
                  ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500/20'
                  : 'bg-white border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-600" />
                <span className="text-xs font-bold text-slate-900">3. Warp Spawn</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Teleports intruder safely back to world spawn point.
              </p>
            </button>
          </div>
        </div>

        {/* Auto-give to new players & auto-restore toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer">
            <span className="text-[11px] font-semibold text-slate-700">
              Auto-Give Protection Block on Join
            </span>
            <input
              type="checkbox"
              checked={config.autoGiveCoreToNewPlayers}
              onChange={(e) =>
                handleSaveConfig({ autoGiveCoreToNewPlayers: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer">
            <span className="text-[11px] font-semibold text-slate-700">
              Auto-Restore Member Mode on Exit
            </span>
            <input
              type="checkbox"
              checked={config.autoRestoreMemberOnExit}
              onChange={(e) =>
                handleSaveConfig({ autoRestoreMemberOnExit: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

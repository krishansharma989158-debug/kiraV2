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
  Info
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
    autoRestoreMemberOnExit: true
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
  const [selectedBlockType, setSelectedBlockType] = useState<string>('lodestone');
  const [blockQuantity, setBlockQuantity] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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
      }
    } catch (e) {
      showToast('❌ Failed to update settings');
    }
  };

  const handleGiveCore = async (player?: string, blockType?: string, count?: number) => {
    const finalPlayer = (useCustomGamertag && customGamertag.trim())
      ? customGamertag.trim()
      : (player || givePlayerTarget || '@p');
    const finalItem = blockType || selectedBlockType || config.coreItem;
    const finalCount = count || blockQuantity || 1;

    setLoading(true);
    try {
      const res = await fetch('/api/protection/give-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: finalPlayer, coreItem: finalItem, count: finalCount })
      });
      if (res.ok) {
        showToast(`🎁 Gave ${finalCount}x ${finalItem} to "${finalPlayer}"!`);
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

  const handleDeleteBase = async (id: string, name: string) => {
    if (!confirm(`Delete base protection shield for "${name}"?`)) return;
    try {
      const res = await fetch(`/api/protection/bases/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Base "${name}" shield removed.`);
        fetchProtectionData();
      }
    } catch (e) {
      showToast('❌ Failed to delete base');
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
                300-Block perimeter shield • Auto-Visitor Mode • Anti-Theft
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

        {/* Hindi explanation of features */}
        <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 leading-relaxed">
          <p className="font-semibold flex items-center gap-1.5 text-emerald-900 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>बेस प्रोटेक्टर कोर कैसे काम करता है:</span>
          </p>
          <p className="text-[11px] text-emerald-800">
            जब कोई नया प्लेयर जॉइन करता है, तो उसे एक <b>Base Protector Core</b> (Lodestone/Beacon) मिलता है। प्लेयर अपने बेस के बीच में इसे रखकर अपना बेस क्लेम कर सकता है। इसके <b>300 ब्लॉक्स</b> के अंदर अगर कोई अनजान प्लेयर आता है, तो वह <b>Visitor</b> बन जाएगा (ब्लॉक नहीं तोड़ सकता, चेस्ट नहीं खोल सकता, चोरी बंद), और बेस से बाहर निकलते ही वापस <b>Member</b> बन जाएगा!
          </p>
        </div>
      </div>

      {/* 2. MANUAL BLOCK DISTRIBUTION & 1-CLICK ACTIONS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Manually Give Block / मैनुअल ब्लॉक वितरण
            </h4>
          </div>
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
            Admin Controlled
          </span>
        </div>

        {/* Clear Hindi Answer Card */}
        <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-950 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-purple-900">
            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
            <span>हाँ! आप यह स्पेशल ब्लॉक किसी भी प्लेयर को मैन्युअली (Manually) भी दे सकते हैं:</span>
          </div>
          <p className="text-[11px] text-purple-800 leading-relaxed">
            चाहे नया प्लेयर हो या पुराना, आप नीचे से प्लेयर का नाम चुनकर या टाइप करके <b>1-Click</b> में ब्लॉक दे सकते हैं। साथ ही आप इन-गेम Minecraft चैट में <b>/give</b> कमांड या कंसोल में <b>/givecore</b> कमांड भी इस्तेमाल कर सकते हैं।
          </p>
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

        {/* Block Type Selection */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Box className="w-3.5 h-3.5 text-slate-500" />
            <span>Select Special Block to Give (कौन सा ब्लॉक देना है):</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'lodestone', name: 'Lodestone Core', tag: 'Base Shield', icon: '🛡️' },
              { id: 'beacon', name: 'Beacon Core', tag: 'High-Tech', icon: '🌟' },
              { id: 'command_block', name: 'Command Block', tag: 'Teleport Station', icon: '📦' },
              { id: 'stone_button', name: 'Stone Button', tag: 'Station Trigger', icon: '🔘' }
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedBlockType(item.id)}
                className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 ${
                  selectedBlockType === item.id
                    ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {item.name}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 block mt-1">
                  {item.tag}
                </span>
              </button>
            ))}
          </div>
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
            <span>Give {blockQuantity}x {selectedBlockType} Now</span>
          </button>
        </div>

        {/* 3. In-Game & Console Manual Commands Quick Reference */}
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-600" />
              <span>In-Game Chat & Console Commands (Click to Copy):</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">1-Click Copy</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {/* Command 1: give lodestone */}
            <button
              type="button"
              onClick={() =>
                copyCommandText(
                  `/give @s ${selectedBlockType} ${blockQuantity}`,
                  'cmd-give-self'
                )
              }
              className="p-2 bg-white border border-slate-200 hover:border-purple-300 rounded-lg text-left flex items-center justify-between group"
            >
              <div className="truncate">
                <span className="text-purple-600 font-bold">/give @s {selectedBlockType} {blockQuantity}</span>
                <span className="block text-[10px] text-slate-400 font-sans">Self give in-game chat</span>
              </div>
              {copiedId === 'cmd-give-self' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 shrink-0" />
              )}
            </button>

            {/* Command 2: givecore */}
            <button
              type="button"
              onClick={() =>
                copyCommandText(
                  `/givecore ${useCustomGamertag && customGamertag ? customGamertag : '@p'} ${selectedBlockType} ${blockQuantity}`,
                  'cmd-givecore'
                )
              }
              className="p-2 bg-white border border-slate-200 hover:border-purple-300 rounded-lg text-left flex items-center justify-between group"
            >
              <div className="truncate">
                <span className="text-emerald-700 font-bold">/givecore {useCustomGamertag && customGamertag ? customGamertag : '@p'}</span>
                <span className="block text-[10px] text-slate-400 font-sans">Server console shortcut</span>
              </div>
              {copiedId === 'cmd-givecore' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 shrink-0" />
              )}
            </button>

            {/* Command 3: commandblockkit */}
            <button
              type="button"
              onClick={() =>
                copyCommandText(
                  `/commandblockkit ${useCustomGamertag && customGamertag ? customGamertag : '@p'}`,
                  'cmd-cbkit'
                )
              }
              className="p-2 bg-white border border-slate-200 hover:border-purple-300 rounded-lg text-left flex items-center justify-between group"
            >
              <div className="truncate">
                <span className="text-blue-600 font-bold">/commandblockkit @p</span>
                <span className="block text-[10px] text-slate-400 font-sans">Command blocks & buttons kit</span>
              </div>
              {copiedId === 'cmd-cbkit' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 shrink-0" />
              )}
            </button>

            {/* Command 4: give command_block */}
            <button
              type="button"
              onClick={() =>
                copyCommandText(
                  `/give @s command_block 1`,
                  'cmd-cb-give'
                )
              }
              className="p-2 bg-white border border-slate-200 hover:border-purple-300 rounded-lg text-left flex items-center justify-between group"
            >
              <div className="truncate">
                <span className="text-amber-700 font-bold">/give @s command_block 1</span>
                <span className="block text-[10px] text-slate-400 font-sans">Teleport station block</span>
              </div>
              {copiedId === 'cmd-cb-give' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 shrink-0" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <span>Active Default Core: <b className="font-mono text-slate-800">{config.coreItem.toUpperCase()}</b></span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Auto-Give on Join: {config.autoGiveCoreToNewPlayers ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* 3. GLOBAL SHIELD RULES & THRESHOLDS */}
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

        {/* Default Radius (Slider 50m to 500m) */}
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
            <span>50 Blocks (Small Cottage)</span>
            <span>300 Blocks (Default Huge Base)</span>
            <span>600 Blocks (Empire)</span>
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
                Cannot break blocks, open chests or steal items. Returns to Member on exit.
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
                Lethal defense turret. Immediately eliminates unauthorized trespassers!
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
                Instantly teleports intruder safely back to world spawn point.
              </p>
            </button>
          </div>
        </div>

        {/* Auto-give to new players & auto-restore toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer">
            <span className="text-[11px] font-semibold text-slate-700">
              Auto-Give Core to New Players
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

      {/* 4. REGISTERED PLAYER BASES & SHIELDS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Protected Player Bases ({bases.length})
            </h4>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Claim Base Shield</span>
          </button>
        </div>

        {/* Register Base Modal / Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateBase}
            className="p-3.5 bg-slate-50 border border-emerald-200 rounded-xl space-y-2.5 animate-in fade-in duration-150"
          >
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Register New Base Core Coordinates</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Owner Gamertag (Owner can enter & build)
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
                  Base Name / Location
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

            {/* Coordinates X, Y, Z */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Core Coordinates (X, Y, Z in Minecraft)
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
                  Shield Radius (Blocks)
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
                  Action on Intruder
                </label>
                <select
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value as any)}
                  className="w-full text-xs font-semibold px-2.5 py-2 bg-white border border-slate-200 rounded-lg"
                >
                  <option value="visitor">Visitor (No break/steal)</option>
                  <option value="kill">Instant Kill Turret</option>
                  <option value="teleport_spawn">Teleport to Spawn</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Trusted Teammates (Comma-separated, safe to enter)
              </label>
              <input
                type="text"
                value={trustedInput}
                onChange={(e) => setTrustedInput(e.target.value)}
                placeholder="e.g. Friend1, Alex, TeamMate99"
                className="w-full text-xs font-medium px-2.5 py-2 bg-white border border-slate-200 rounded-lg"
              />
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
                <span>Save Shield</span>
              </button>
            </div>
          </form>
        )}

        {/* Bases List */}
        {bases.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">No bases claimed yet</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Give a player the Protector Core item, or click "Claim Base Shield" to protect coordinates from grief and stealing.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {bases.map((b) => (
              <div
                key={b.id}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-start justify-between gap-3 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{b.baseName}</span>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      Owner: {b.ownerGamertag}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        b.actionOnTrespass === 'kill'
                          ? 'bg-rose-100 text-rose-800'
                          : b.actionOnTrespass === 'teleport_spawn'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {b.actionOnTrespass}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap font-mono">
                    <span>
                      Coords: <b>[{b.centerX}, {b.centerY}, {b.centerZ}]</b>
                    </span>
                    <span>
                      Shield: <b>{b.radius}m Radius</b>
                    </span>
                  </div>

                  {b.trustedMembers && b.trustedMembers.length > 0 && (
                    <div className="text-[10px] text-slate-600 mt-1 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>Trusted: {b.trustedMembers.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      copyCommandText(
                        `tp @p ${b.centerX} ${b.centerY} ${b.centerZ}`,
                        b.id
                      )
                    }
                    title="Copy TP Command"
                    className="p-2 bg-white hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-lg text-xs transition-colors active:scale-95"
                  >
                    {copiedId === b.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteBase(b.id, b.baseName)}
                    className="p-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-lg text-xs transition-colors active:scale-95"
                    title="Remove Shield"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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

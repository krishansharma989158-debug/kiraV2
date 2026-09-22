import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Eye,
  Crown,
  Gift,
  Heart,
  Zap,
  MapPin,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  UserCheck,
  Ban,
  UserMinus,
  RefreshCw,
  Send,
  UserX,
  LogOut,
  ShieldAlert,
  Sword,
  Apple,
  Gem,
  Package
} from 'lucide-react';
import { Player } from '../types';

interface PlayerManagerViewProps {
  onlinePlayers?: Player[];
  onBack?: () => void;
}

export const PlayerManagerView: React.FC<PlayerManagerViewProps> = ({ onlinePlayers = [], onBack }) => {
  const [targetPlayer, setTargetPlayer] = useState('');
  const [operators, setOperators] = useState<string[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [bannedPlayers, setBannedPlayers] = useState<string[]>([]);
  const [customItem, setCustomItem] = useState('');
  const [customQty, setCustomQty] = useState(64);
  const [customCoords, setCustomCoords] = useState('0 65 0');
  const [kickReason, setKickReason] = useState('Kicked by administrator');
  const [showKickModal, setShowKickModal] = useState(false);
  const [itemCategory, setItemCategory] = useState<'all' | 'combat' | 'valuables' | 'food' | 'utility'>('all');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPlayerLists = async () => {
    try {
      const res = await fetch('/api/players');
      if (res.ok) {
        const data = await res.json();
        setOperators(data.operators || []);
        setWhitelist(data.whitelist || []);
        setBannedPlayers(data.bannedPlayers || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchPlayerLists();
    if (onlinePlayers.length > 0 && !targetPlayer) {
      setTargetPlayer(onlinePlayers[0].name);
    }
  }, [onlinePlayers]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSetRole = async (role: 'visitor' | 'member' | 'operator', specificPlayer?: string) => {
    const playerToTarget = (specificPlayer || targetPlayer).trim();
    if (!playerToTarget) {
      showToast('error', 'Please enter or select a player name first!');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/player/permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: playerToTarget, level: role })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', data.message || `Role updated to ${role}!`);
        await fetchPlayerLists();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast('error', e.message || 'Failed to update player role');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayerAction = async (action: string, specificPlayer?: string, extra?: { coordinates?: string; reason?: string }) => {
    const playerToTarget = (specificPlayer || targetPlayer).trim();
    if (!playerToTarget) {
      showToast('error', 'Please enter or select a player name first!');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/player/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: playerToTarget,
          action,
          coordinates: extra?.coordinates,
          reason: extra?.reason
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', data.message || `Action "${action}" executed!`);
        await fetchPlayerLists();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast('error', e.message || 'Action failed');
    } finally {
      setIsLoading(false);
      setShowKickModal(false);
    }
  };

  const handleGiveItem = async (itemName: string, amount: number) => {
    const cleanPlayer = targetPlayer.trim();
    if (!cleanPlayer) {
      showToast('error', 'Please enter or select a player name first!');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/player/give', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: cleanPlayer, item: itemName, amount })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', data.message || `Given ${amount}x ${itemName} to ${cleanPlayer}!`);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast('error', e.message || 'Failed to give item');
    } finally {
      setIsLoading(false);
    }
  };

  // Popular bedrock items categorized
  const catalogItems = [
    // Combat
    { id: 'netherite_sword', label: 'Netherite Sword', qty: 1, cat: 'combat', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'netherite_pickaxe', label: 'Netherite Pickaxe', qty: 1, cat: 'combat', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'netherite_helmet', label: 'Netherite Helmet', qty: 1, cat: 'combat', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'netherite_chestplate', label: 'Netherite Chestplate', qty: 1, cat: 'combat', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'bow', label: 'Hunting Bow', qty: 1, cat: 'combat', color: 'text-slate-700 bg-slate-50 border-slate-200' },
    { id: 'arrow', label: '64x Arrows', qty: 64, cat: 'combat', color: 'text-slate-700 bg-slate-50 border-slate-200' },
    { id: 'shield', label: 'Combat Shield', qty: 1, cat: 'combat', color: 'text-blue-700 bg-blue-50 border-blue-200' },

    // Valuables
    { id: 'diamond', label: '64x Diamonds', qty: 64, cat: 'valuables', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    { id: 'diamond_block', label: '16x Diamond Blocks', qty: 16, cat: 'valuables', color: 'text-cyan-700 bg-cyan-100 border-cyan-300' },
    { id: 'netherite_ingot', label: '16x Netherite Ingots', qty: 16, cat: 'valuables', color: 'text-purple-700 bg-purple-50 border-purple-200' },
    { id: 'emerald', label: '64x Emeralds', qty: 64, cat: 'valuables', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'totem_of_undying', label: '5x Totem of Undying', qty: 5, cat: 'valuables', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'elytra', label: 'Elytra Wings', qty: 1, cat: 'valuables', color: 'text-teal-600 bg-teal-50 border-teal-200' },

    // Food
    { id: 'enchanted_golden_apple', label: '16x God Apples', qty: 16, cat: 'food', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
    { id: 'golden_carrot', label: '64x Golden Carrots', qty: 64, cat: 'food', color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { id: 'cooked_beef', label: '64x Cooked Steaks', qty: 64, cat: 'food', color: 'text-rose-700 bg-rose-50 border-rose-200' },

    // Utility & Materials
    { id: 'iron_ingot', label: '64x Iron Ingots', qty: 64, cat: 'utility', color: 'text-slate-600 bg-slate-50 border-slate-200' },
    { id: 'firework_rocket', label: '64x Fireworks', qty: 64, cat: 'utility', color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'ender_pearl', label: '16x Ender Pearls', qty: 16, cat: 'utility', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'experience_bottle', label: '64x XP Bottles', qty: 64, cat: 'utility', color: 'text-lime-600 bg-lime-50 border-lime-200' },
    { id: 'oak_log', label: '64x Wood Logs', qty: 64, cat: 'utility', color: 'text-amber-800 bg-amber-50 border-amber-200' }
  ];

  const filteredItems = catalogItems.filter(item => itemCategory === 'all' || item.cat === itemCategory);

  const isTargetOp = operators.some(o => o.toLowerCase() === targetPlayer.toLowerCase());
  const isTargetBanned = bannedPlayers.some(b => b.toLowerCase() === targetPlayer.toLowerCase());
  const isTargetOnline = onlinePlayers.some(p => p.name.toLowerCase() === targetPlayer.toLowerCase());

  return (
    <div className="space-y-4 pb-24 max-w-2xl mx-auto">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 shadow-md transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
              : 'bg-rose-50 border-rose-200 text-rose-900 font-bold'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* 🎯 Target Player Selection & Status */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-900 text-white rounded-xl shadow-xs">
              <Users className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Target Player Selection</h2>
              <p className="text-[11px] text-slate-500">
                Choose an online player or type any Bedrock Gamertag to manage
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {onlinePlayers.length} Online
          </span>
        </div>

        {/* Online Player Quick Pills */}
        {onlinePlayers.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Active Players Online:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {onlinePlayers.map(p => (
                <button
                  key={p.xuid || p.name}
                  type="button"
                  onClick={() => setTargetPlayer(p.name)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all ${
                    targetPlayer.toLowerCase() === p.name.toLowerCase()
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-102'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{p.name}</span>
                  {operators.some(o => o.toLowerCase() === p.name.toLowerCase()) && (
                    <Crown className="w-3 h-3 text-amber-300" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Gamertag */}
        <div className="relative">
          <input
            type="text"
            value={targetPlayer}
            onChange={(e) => setTargetPlayer(e.target.value)}
            placeholder="Type player gamertag (e.g. Steve, Alex, krishan)..."
            className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-emerald-600 focus:bg-white transition-colors"
          />
          {targetPlayer && (
            <button
              type="button"
              onClick={() => setTargetPlayer('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Target Status Bar */}
        {targetPlayer && (
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Selected:</span>
              <span className="font-bold text-slate-900">{targetPlayer}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {isTargetOnline && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-300">
                  Online
                </span>
              )}
              {isTargetOp ? (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md border border-amber-300 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  <span>Operator</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md">
                  Member
                </span>
              )}
              {isTargetBanned && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md border border-rose-300">
                  Banned
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ⚡ Core Moderation Controls (OP, DeOP, Kick, Ban) */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              <span>Moderation & OP Controls</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Direct actions for <span className="font-bold text-slate-800">{targetPlayer || 'Selected Player'}</span>
            </p>
          </div>
        </div>

        {/* 4 Main Action Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* OP Button */}
          <button
            type="button"
            disabled={isLoading || !targetPlayer.trim()}
            onClick={() => handlePlayerAction('op')}
            className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-95 ${
              isTargetOp
                ? 'bg-amber-100/70 border-amber-300 text-amber-900 shadow-2xs'
                : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
            }`}
          >
            <div>
              <div className="flex items-center gap-1 font-bold text-xs">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>Make OP</span>
              </div>
              <span className="text-[10px] text-amber-700 block mt-0.5">
                Grant admin permissions
              </span>
            </div>
            {isTargetOp && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
          </button>

          {/* DeOP Button */}
          <button
            type="button"
            disabled={isLoading || !targetPlayer.trim()}
            onClick={() => handlePlayerAction('deop')}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex items-center justify-between transition-all active:scale-95 text-slate-800"
          >
            <div>
              <div className="flex items-center gap-1 font-bold text-xs">
                <UserMinus className="w-4 h-4 text-slate-600" />
                <span>DeOP Player</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Demote to normal Member
              </span>
            </div>
          </button>

          {/* Kick Button */}
          <button
            type="button"
            disabled={isLoading || !targetPlayer.trim()}
            onClick={() => setShowKickModal(true)}
            className="p-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-2xl text-left flex items-center justify-between transition-all active:scale-95 text-orange-900"
          >
            <div>
              <div className="flex items-center gap-1 font-bold text-xs">
                <LogOut className="w-4 h-4 text-orange-600" />
                <span>Kick Player</span>
              </div>
              <span className="text-[10px] text-orange-700 block mt-0.5">
                Disconnect from server
              </span>
            </div>
          </button>

          {/* Ban / Unban Button */}
          {isTargetBanned ? (
            <button
              type="button"
              disabled={isLoading || !targetPlayer.trim()}
              onClick={() => handlePlayerAction('unban')}
              className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-left flex items-center justify-between transition-all active:scale-95 text-emerald-900"
            >
              <div>
                <div className="flex items-center gap-1 font-bold text-xs">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Unban Player</span>
                </div>
                <span className="text-[10px] text-emerald-700 block mt-0.5">
                  Allow joining server
                </span>
              </div>
            </button>
          ) : (
            <button
              type="button"
              disabled={isLoading || !targetPlayer.trim()}
              onClick={() => {
                if (confirm(`Are you sure you want to BAN "${targetPlayer}" from the server?`)) {
                  handlePlayerAction('ban');
                }
              }}
              className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl text-left flex items-center justify-between transition-all active:scale-95 text-rose-900"
            >
              <div>
                <div className="flex items-center gap-1 font-bold text-xs">
                  <Ban className="w-4 h-4 text-rose-600" />
                  <span>Ban Player</span>
                </div>
                <span className="text-[10px] text-rose-700 block mt-0.5">
                  Block entry completely
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Role Permissions (Visitor / Member) */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            disabled={isLoading || !targetPlayer.trim()}
            onClick={() => handleSetRole('visitor')}
            className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Set Visitor (No Break)</span>
          </button>
          <button
            type="button"
            disabled={isLoading || !targetPlayer.trim()}
            onClick={() => handleSetRole('member')}
            className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Set Standard Member</span>
          </button>
        </div>
      </div>

      {/* 🎁 Item Giver Engine */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-emerald-600" />
              <span>Give Items to {targetPlayer || 'Selected Player'}</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              1-click delivery directly into player inventory
            </p>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'combat', label: 'Weapons & Armor' },
            { id: 'valuables', label: 'Valuables & Rares' },
            { id: 'food', label: 'Food & Apples' },
            { id: 'utility', label: 'Utility & XP' }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setItemCategory(cat.id as any)}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg border whitespace-nowrap transition-all ${
                itemCategory === cat.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={isLoading || !targetPlayer.trim()}
              onClick={() => handleGiveItem(item.id, item.qty)}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all active:scale-95 disabled:opacity-50 ${item.color}`}
            >
              <div>
                <span className="font-bold text-xs block">{item.label}</span>
                <span className="text-[10px] opacity-75 block font-mono">
                  {item.qty}x count
                </span>
              </div>
              <Sparkles className="w-3.5 h-3.5 opacity-60" />
            </button>
          ))}
        </div>

        {/* Custom Item Delivery Form */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <span className="text-[11px] font-bold text-slate-700 block">
            Custom Item Delivery:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customItem}
              onChange={(e) => setCustomItem(e.target.value)}
              placeholder="Custom item (e.g. beacon, trident, tnt, shulker_box)..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-emerald-600"
            />
            <div className="flex items-center gap-1">
              {[1, 16, 64].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setCustomQty(q)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold border ${
                    customQty === q
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {q}x
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={isLoading || !targetPlayer.trim() || !customItem.trim()}
              onClick={() => customItem.trim() && handleGiveItem(customItem.trim(), customQty)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Deliver</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🚀 Fast In-Game Actions */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span>Quick Player Actions for {targetPlayer || 'Selected Player'}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            disabled={isLoading || !targetPlayer.trim()}
            onClick={() => handlePlayerAction('heal')}
            className="p-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs text-rose-800 active:scale-95 disabled:opacity-50"
          >
            <Heart className="w-4 h-4 text-rose-600" />
            <span>Full Health</span>
          </button>

          <button
            type="button"
            disabled={isLoading || !targetPlayer.trim()}
            onClick={() => handlePlayerAction('feed')}
            className="p-2.5 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs text-orange-800 active:scale-95 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-orange-600" />
            <span>Full Food</span>
          </button>

          <button
            type="button"
            disabled={isLoading || !targetPlayer.trim()}
            onClick={() => handlePlayerAction('teleport_spawn')}
            className="p-2.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs text-blue-800 active:scale-95 disabled:opacity-50"
          >
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Teleport Spawn</span>
          </button>

          <button
            type="button"
            disabled={isLoading || !targetPlayer.trim()}
            onClick={() => handlePlayerAction('clear')}
            className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs text-slate-800 active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 text-slate-600" />
            <span>Clear Inventory</span>
          </button>
        </div>

        {/* Teleport Coordinates */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={customCoords}
            onChange={(e) => setCustomCoords(e.target.value)}
            placeholder="Coordinates X Y Z (e.g. 100 65 200)"
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono"
          />
          <button
            type="button"
            disabled={isLoading || !targetPlayer.trim()}
            onClick={() => handlePlayerAction('teleport_custom', undefined, { coordinates: customCoords })}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>TP Coords</span>
          </button>
        </div>
      </div>

      {/* 👑 Manage Active Server Operators & Bans */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-500" />
            <span>Active Operators ({operators.length})</span>
          </h3>
          <button
            type="button"
            onClick={fetchPlayerLists}
            className="text-slate-400 hover:text-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {operators.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No operators configured yet.</p>
        ) : (
          <div className="space-y-1.5">
            {operators.map((op) => (
              <div
                key={op}
                className="flex items-center justify-between bg-amber-50/50 border border-amber-200 rounded-xl px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-bold text-slate-900">{op}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTargetPlayer(op)}
                    className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-bold rounded-lg"
                  >
                    Select
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handlePlayerAction('deop', op)}
                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-lg"
                  >
                    DeOP
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Banned Players */}
        {bannedPlayers.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5" />
              <span>Banned Players ({bannedPlayers.length})</span>
            </h4>
            <div className="space-y-1">
              {bannedPlayers.map((banName) => (
                <div
                  key={banName}
                  className="flex items-center justify-between bg-rose-50/50 border border-rose-200 rounded-xl px-3 py-1.5 text-xs"
                >
                  <span className="font-mono text-rose-900 font-bold">{banName}</span>
                  <button
                    type="button"
                    onClick={() => handlePlayerAction('unban', banName)}
                    className="px-2.5 py-1 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-[10px] font-bold rounded-lg"
                  >
                    Unban
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 🚪 Kick Player Modal */}
      {showKickModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-orange-100 text-orange-700 rounded-xl">
                <LogOut className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Kick Player from Server</h3>
                <p className="text-xs text-slate-500">Player: <span className="font-bold text-slate-800">{targetPlayer}</span></p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">Kick Reason (shown to player):</label>
              <input
                type="text"
                value={kickReason}
                onChange={(e) => setKickReason(e.target.value)}
                placeholder="Reason (e.g. Rule violation, AFK)..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowKickModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handlePlayerAction('kick', targetPlayer, { reason: kickReason })}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-xs"
              >
                Confirm Kick
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

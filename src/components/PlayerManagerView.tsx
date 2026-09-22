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
  Send
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
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    setTimeout(() => setToast(null), 3000);
  };

  const handleSetRole = async (role: 'visitor' | 'member' | 'operator') => {
    if (!targetPlayer.trim()) {
      showToast('error', 'Please enter or select a player name first!');
      return;
    }
    try {
      const res = await fetch('/api/player/permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: targetPlayer.trim(), level: role })
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
    }
  };

  const handleGiveItem = async (itemName: string, amount: number) => {
    if (!targetPlayer.trim()) {
      showToast('error', 'Please enter or select a player name first!');
      return;
    }
    try {
      const res = await fetch('/api/player/give', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: targetPlayer.trim(), item: itemName, amount })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', data.message || `Given ${amount}x ${itemName}!`);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast('error', e.message || 'Failed to give item');
    }
  };

  const handlePlayerAction = async (action: string, coordinates?: string) => {
    if (!targetPlayer.trim()) {
      showToast('error', 'Please enter or select a player name first!');
      return;
    }
    try {
      const res = await fetch('/api/player/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: targetPlayer.trim(), action, coordinates })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', data.message || 'Action executed successfully!');
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast('error', e.message || 'Action failed');
    }
  };

  // Popular bedrock items catalog
  const popularItems = [
    { id: 'netherite_sword', label: 'Netherite Sword', qty: 1, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'netherite_pickaxe', label: 'Netherite Pickaxe', qty: 1, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'elytra', label: 'Elytra Wings', qty: 1, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    { id: 'firework_rocket', label: 'Fireworks', qty: 64, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'totem_of_undying', label: 'Totem of Undying', qty: 5, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'enchanted_golden_apple', label: 'God Apple', qty: 16, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
    { id: 'diamond', label: '64x Diamonds', qty: 64, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    { id: 'iron_ingot', label: '64x Iron Ingots', qty: 64, color: 'text-slate-600 bg-slate-50 border-slate-200' },
    { id: 'ender_pearl', label: '16x Ender Pearls', qty: 16, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'experience_bottle', label: '64x XP Bottles', qty: 64, color: 'text-lime-600 bg-lime-50 border-lime-200' },
    { id: 'golden_carrot', label: '64x Golden Carrots', qty: 64, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { id: 'oak_log', label: '64x Wood Logs', qty: 64, color: 'text-amber-700 bg-amber-50 border-amber-200' }
  ];

  return (
    <div className="space-y-4 pb-24 max-w-2xl mx-auto">
      {toast && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 shadow-xs ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
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

      {/* 👑 Claim Operator (Make Myself OP) Card */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Make Myself Operator (OP)</h3>
            <p className="text-[11px] text-slate-600">
              By default all players join as Members. You can manually grant OP to your own gamertag.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <input
            type="text"
            value={targetPlayer}
            onChange={(e) => setTargetPlayer(e.target.value)}
            placeholder="Enter your Gamertag (e.g. Steve, MyName)..."
            className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={() => handleSetRole('operator')}
            className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all shrink-0"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Make Myself OP</span>
          </button>
        </div>
      </div>

      {/* Target Player Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900">Select or Enter Player</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {onlinePlayers.length} online
          </span>
        </div>

        {/* Online Player Quick Pills */}
        {onlinePlayers.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 font-semibold">Active:</span>
            {onlinePlayers.map(p => (
              <button
                key={p.xuid || p.name}
                type="button"
                onClick={() => setTargetPlayer(p.name)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${
                  targetPlayer.toLowerCase() === p.name.toLowerCase()
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <input
            type="text"
            value={targetPlayer}
            onChange={(e) => setTargetPlayer(e.target.value)}
            placeholder="Type player gamertag (e.g. Steve, Alex, Radha)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-emerald-600"
          />
        </div>
      </div>

      {/* Role Management (Visitor / Member / Operator) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Player Permission Role (Visitor vs Member vs OP)
            </h3>
            <p className="text-[11px] text-slate-500">
              Griefer se bachane ke liye player ko Visitor bna sakte ho ya regular Member!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Visitor Card */}
          <button
            type="button"
            onClick={() => handleSetRole('visitor')}
            className="p-3 bg-amber-50/60 hover:bg-amber-100/60 border border-amber-200 rounded-xl flex flex-col items-center gap-1.5 text-center transition-all active:scale-95"
          >
            <Eye className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-bold text-amber-900">Make Visitor</span>
            <span className="text-[10px] text-amber-700 leading-tight">
              View only. Cannot break or place blocks.
            </span>
          </button>

          {/* Member Card */}
          <button
            type="button"
            onClick={() => handleSetRole('member')}
            className="p-3 bg-emerald-50/60 hover:bg-emerald-100/60 border border-emerald-200 rounded-xl flex flex-col items-center gap-1.5 text-center transition-all active:scale-95"
          >
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-900">Make Member</span>
            <span className="text-[10px] text-emerald-700 leading-tight">
              Normal player. Can mine, craft, and build.
            </span>
          </button>

          {/* Operator Card */}
          <button
            type="button"
            onClick={() => handleSetRole('operator')}
            className="p-3 bg-indigo-50/60 hover:bg-indigo-100/60 border border-indigo-200 rounded-xl flex flex-col items-center gap-1.5 text-center transition-all active:scale-95"
          >
            <Crown className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-900">Make Operator</span>
            <span className="text-[10px] text-indigo-700 leading-tight">
              Server admin with commands access.
            </span>
          </button>
        </div>
      </div>

      {/* Quick Player In-Game Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100">
          Fast In-Game Actions for {targetPlayer || 'Selected Player'}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handlePlayerAction('heal')}
            className="p-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs text-rose-800 active:scale-95 transition-all"
          >
            <Heart className="w-4 h-4 text-rose-600" />
            <span>Full Health</span>
          </button>

          <button
            type="button"
            onClick={() => handlePlayerAction('feed')}
            className="p-2.5 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs text-orange-800 active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4 text-orange-600" />
            <span>Full Food</span>
          </button>

          <button
            type="button"
            onClick={() => handlePlayerAction('teleport_spawn')}
            className="p-2.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs text-blue-800 active:scale-95 transition-all"
          >
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Teleport Spawn</span>
          </button>

          <button
            type="button"
            onClick={() => handlePlayerAction('clear')}
            className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs text-slate-800 active:scale-95 transition-all"
          >
            <Trash2 className="w-4 h-4 text-slate-600" />
            <span>Clear Inventory</span>
          </button>
        </div>

        {/* Teleport to Custom Coordinates */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={customCoords}
            onChange={(e) => setCustomCoords(e.target.value)}
            placeholder="X Y Z (e.g. 100 64 250)"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono"
          />
          <button
            type="button"
            onClick={() => handlePlayerAction('teleport_custom', customCoords)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Teleport</span>
          </button>
        </div>
      </div>

      {/* Give Player Items Catalog */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-emerald-600" />
              <span>Give Items to {targetPlayer || 'Player'}</span>
            </h3>
            <p className="text-[10px] text-slate-500">1-click item delivery straight to player inventory</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {popularItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleGiveItem(item.id, item.qty)}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all active:scale-95 ${item.color}`}
            >
              <div>
                <span className="font-bold text-xs block">{item.label}</span>
                <span className="text-[10px] opacity-75 block font-mono">
                  {item.qty}x item
                </span>
              </div>
              <Sparkles className="w-3.5 h-3.5 opacity-60" />
            </button>
          ))}
        </div>

        {/* Custom Item Give Form */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={customItem}
            onChange={(e) => setCustomItem(e.target.value)}
            placeholder="Custom item (e.g. beacon, trident, shulker_box)..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono"
          />
          <input
            type="number"
            value={customQty}
            onChange={(e) => setCustomQty(parseInt(e.target.value, 10) || 1)}
            min="1"
            max="64"
            className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-mono text-center"
          />
          <button
            type="button"
            onClick={() => customItem && handleGiveItem(customItem, customQty)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Give</span>
          </button>
        </div>
      </div>
    </div>
  );
};

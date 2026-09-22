import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  UserPlus,
  Trash2,
  CheckCircle2
} from 'lucide-react';

interface PlayersViewProps {
  onPlayerAction: (
    type: 'operator' | 'whitelist' | 'ban',
    action: 'add' | 'remove',
    player: string
  ) => Promise<void>;
  initialData?: {
    operators: string[];
    whitelist: string[];
    bannedPlayers: string[];
  };
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  onPlayerAction,
  initialData = {
    operators: ['AlexCraft_99', 'AdminUser'],
    whitelist: ['AlexCraft_99', 'SteveMaster', 'CreeperHunter'],
    bannedPlayers: ['TrollGamer99']
  }
}) => {
  const [activeCategory, setActiveCategory] = useState<
    'operator' | 'whitelist' | 'ban'
  >('operator');

  const [inputName, setInputName] = useState('');
  const [loading, setLoading] = useState(false);
  const [operators, setOperators] = useState<string[]>(initialData.operators);
  const [whitelist, setWhitelist] = useState<string[]>(initialData.whitelist);
  const [bannedPlayers, setBannedPlayers] = useState<string[]>(
    initialData.bannedPlayers
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim() || loading) return;

    const name = inputName.trim();
    setLoading(true);
    await onPlayerAction(activeCategory, 'add', name);

    if (activeCategory === 'operator' && !operators.includes(name)) {
      setOperators([...operators, name]);
    } else if (activeCategory === 'whitelist' && !whitelist.includes(name)) {
      setWhitelist([...whitelist, name]);
    } else if (activeCategory === 'ban' && !bannedPlayers.includes(name)) {
      setBannedPlayers([...bannedPlayers, name]);
    }

    setInputName('');
    setLoading(false);
  };

  const handleRemove = async (name: string) => {
    setLoading(true);
    await onPlayerAction(activeCategory, 'remove', name);

    if (activeCategory === 'operator') {
      setOperators(operators.filter((o) => o !== name));
    } else if (activeCategory === 'whitelist') {
      setWhitelist(whitelist.filter((w) => w !== name));
    } else if (activeCategory === 'ban') {
      setBannedPlayers(bannedPlayers.filter((b) => b !== name));
    }

    setLoading(false);
  };

  const currentList =
    activeCategory === 'operator'
      ? operators
      : activeCategory === 'whitelist'
      ? whitelist
      : bannedPlayers;

  return (
    <div className="space-y-3.5 pb-6">
      {/* Category selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs grid grid-cols-3 gap-1">
        <button
          onClick={() => setActiveCategory('operator')}
          className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
            activeCategory === 'operator'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Operators</span>
        </button>

        <button
          onClick={() => setActiveCategory('whitelist')}
          className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
            activeCategory === 'whitelist'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Whitelist</span>
        </button>

        <button
          onClick={() => setActiveCategory('ban')}
          className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
            activeCategory === 'ban'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserX className="w-3.5 h-3.5" />
          <span>Banned</span>
        </button>
      </div>

      {/* Add Player Input Form */}
      <form
        onSubmit={handleAdd}
        className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2"
      >
        <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
          <span>
            {activeCategory === 'operator'
              ? 'Add Server Operator (Admin)'
              : activeCategory === 'whitelist'
              ? 'Add Player to Whitelist'
              : 'Ban Player from Server'}
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            Bedrock Gamertag
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="Enter player name (e.g. GamerSteve)..."
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
          />
          <button
            type="submit"
            disabled={!inputName.trim() || loading}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1 transition-all disabled:opacity-40"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </form>

      {/* Player List Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900">
            {activeCategory === 'operator'
              ? 'Server Operators (OP)'
              : activeCategory === 'whitelist'
              ? 'Whitelisted Players'
              : 'Banned Players'}
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            {currentList.length} total
          </span>
        </div>

        {currentList.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No entries in this list yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {currentList.map((player) => (
              <div
                key={player}
                className="flex items-center justify-between py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                    {player.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-800">{player}</span>
                </div>

                <button
                  onClick={() => handleRemove(player)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

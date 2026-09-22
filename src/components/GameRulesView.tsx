import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sun,
  Moon,
  CloudRain,
  Zap,
  Shield,
  Eye,
  Crosshair,
  Flame,
  Skull,
  Search,
  CheckCircle2,
  Sparkles,
  Heart,
  Sword,
  Compass,
  RefreshCw,
  Package
} from 'lucide-react';

interface GameRulesViewProps {
  onBack?: () => void;
}

export const GameRulesView: React.FC<GameRulesViewProps> = ({ onBack }) => {
  const [gamerules, setGamerules] = useState<Record<string, any>>({
    showcoordinates: true,
    keepinventory: false,
    naturalregeneration: true,
    pvp: true,
    mobgriefing: true,
    dofiretick: true,
    tntexplodes: true,
    falldamage: true,
    drowningdamage: true,
    firedamage: true,
    domobspawning: true,
    dodaylightcycle: true,
    doweathercycle: true,
    doimmediaterespawn: false,
    doentitydrops: true,
    showdeathmessages: true,
    randomtickspeed: 1,
    spawnradius: 5
  });

  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/gamerules');
      if (res.ok) {
        const data = await res.json();
        if (data.gamerules) setGamerules(data.gamerules);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleRule = async (ruleKey: string, currentVal: boolean) => {
    const newVal = !currentVal;
    setGamerules(prev => ({ ...prev, [ruleKey]: newVal }));
    try {
      const res = await fetch('/api/gamerules/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: ruleKey, value: newVal })
      });
      if (res.ok) {
        setToast(`Rule "${ruleKey}" set to ${newVal ? 'TRUE' : 'FALSE'}`);
        setTimeout(() => setToast(null), 2500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetNumberRule = async (ruleKey: string, val: number) => {
    setGamerules(prev => ({ ...prev, [ruleKey]: val }));
    try {
      const res = await fetch('/api/gamerules/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: ruleKey, value: val })
      });
      if (res.ok) {
        setToast(`Rule "${ruleKey}" set to ${val}`);
        setTimeout(() => setToast(null), 2500);
      }
    } catch (e) {}
  };

  const handleSetTime = async (time: string) => {
    try {
      await fetch('/api/world/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time })
      });
      setToast(`World time changed to ${time.toUpperCase()}!`);
      setTimeout(() => setToast(null), 2500);
    } catch (e) {}
  };

  const handleSetWeather = async (weather: string) => {
    try {
      await fetch('/api/world/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weather })
      });
      setToast(`Weather changed to ${weather.toUpperCase()}!`);
      setTimeout(() => setToast(null), 2500);
    } catch (e) {}
  };

  // Rule definitions
  const allRules = [
    {
      id: 'showcoordinates',
      name: 'Show Coordinates',
      description: 'Players can view exact X, Y, Z coordinates on screen without cheats.',
      category: 'Gameplay'
    },
    {
      id: 'keepinventory',
      name: 'Keep Inventory On Death',
      description: 'Players do not lose their items, weapons, or XP when dying.',
      category: 'Player'
    },
    {
      id: 'naturalregeneration',
      name: 'Natural Health Regeneration',
      description: 'Players naturally heal hearts when hunger food bar is full.',
      category: 'Player'
    },
    {
      id: 'pvp',
      name: 'Player vs Player (PvP)',
      description: 'Enable or disable combat and weapon attacks between players.',
      category: 'Gameplay'
    },
    {
      id: 'mobgriefing',
      name: 'Mob Griefing Protection',
      description: 'Turn off so Creepers and Endermen cannot destroy blocks or steal dirt.',
      category: 'Mobs'
    },
    {
      id: 'dofiretick',
      name: 'Fire Spread (Fire Tick)',
      description: 'Turn off so fire does not burn down wooden houses or forests.',
      category: 'World'
    },
    {
      id: 'tntexplodes',
      name: 'TNT Explosions',
      description: 'Whether placed TNT blocks explode when ignited by redstone or flint.',
      category: 'World'
    },
    {
      id: 'falldamage',
      name: 'Fall Damage',
      description: 'Players take damage when jumping or falling from high heights.',
      category: 'Damage'
    },
    {
      id: 'drowningdamage',
      name: 'Drowning Damage',
      description: 'Players take damage when air bubbles run out underwater.',
      category: 'Damage'
    },
    {
      id: 'firedamage',
      name: 'Fire & Lava Damage',
      description: 'Players take damage when caught in fire or falling in lava.',
      category: 'Damage'
    },
    {
      id: 'domobspawning',
      name: 'Natural Mob Spawning',
      description: 'Whether zombies, skeletons, and animals naturally spawn at night.',
      category: 'Mobs'
    },
    {
      id: 'dodaylightcycle',
      name: 'Daylight Sun Cycle',
      description: 'Whether the sun and moon cycle progresses or time stays frozen.',
      category: 'World'
    },
    {
      id: 'doweathercycle',
      name: 'Weather Cycle',
      description: 'Whether rain, thunderstorms, and clear weather cycle automatically.',
      category: 'World'
    },
    {
      id: 'doimmediaterespawn',
      name: 'Instant Respawn',
      description: 'Players immediately respawn at bed without clicking the "You Died" screen.',
      category: 'Player'
    },
    {
      id: 'doentitydrops',
      name: 'Entity & Mob Drops',
      description: 'Whether killed mobs drop raw items, leather, and loot.',
      category: 'Mobs'
    },
    {
      id: 'showdeathmessages',
      name: 'Show Death Chat Messages',
      description: 'Broadcast player death causes in server chat when someone dies.',
      category: 'Gameplay'
    }
  ];

  const filteredRules = allRules.filter(
    r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-8">
      {toast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* World Time & Weather Quick Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>In-Game Environment Fast Controls</span>
          <span className="text-[10px] text-emerald-600 font-semibold">1-Click Live Sync</span>
        </h3>

        {/* Time Selector */}
        <div>
          <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
            World Time
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { id: 'day', label: 'Sunrise', icon: Sun, color: 'text-amber-500' },
              { id: 'noon', label: 'Noon', icon: Sun, color: 'text-amber-600' },
              { id: 'sunset', label: 'Sunset', icon: Sun, color: 'text-orange-500' },
              { id: 'night', label: 'Night', icon: Moon, color: 'text-indigo-600' },
              { id: 'midnight', label: 'Midnight', icon: Moon, color: 'text-indigo-900' }
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSetTime(t.id)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center gap-1 transition-all text-center active:scale-95"
                >
                  <Icon className={`w-4 h-4 ${t.color}`} />
                  <span className="text-[10px] font-bold text-slate-700">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Weather Selector */}
        <div className="pt-1">
          <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
            World Weather
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'clear', label: 'Clear Sky', icon: Sun, color: 'text-amber-500 bg-amber-50/50 border-amber-200' },
              { id: 'rain', label: 'Rain Storm', icon: CloudRain, color: 'text-blue-500 bg-blue-50/50 border-blue-200' },
              { id: 'thunder', label: 'Thunderstorm', icon: Zap, color: 'text-purple-600 bg-purple-50/50 border-purple-200' }
            ].map(w => {
              const Icon = w.icon;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => handleSetWeather(w.id)}
                  className={`p-2.5 border rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all active:scale-95 ${w.color}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{w.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search Bar for Game Rules */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search 50+ game rules (coordinates, keep inventory, creeper, tnt, pvp)..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs placeholder:text-slate-400 shadow-2xs font-medium focus:outline-emerald-600"
        />
      </div>

      {/* Rules Toggles Grid */}
      <div className="space-y-2">
        {filteredRules.map((rule) => {
          const isEnabled = Boolean(gamerules[rule.id]);

          return (
            <div
              key={rule.id}
              className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs transition-all"
            >
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900">
                    {rule.name}
                  </span>
                  <span className="text-[9px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                    {rule.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {rule.description}
                </p>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => handleToggleRule(rule.id, isEnabled)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 relative flex items-center ${
                  isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Additional Engine Options: Tick Speed & Spawn Radius */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100">
          Advanced Engine Mechanics
        </h3>

        <div className="flex items-center justify-between text-xs py-1">
          <div>
            <span className="font-semibold text-slate-700 block">Random Tick Speed</span>
            <span className="text-[10px] text-slate-400">Default is 1. Higher value speeds up crop growth.</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 5, 10, 20].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => handleSetNumberRule('randomtickspeed', speed)}
                className={`px-2 py-1 text-xs font-bold rounded-lg border ${
                  gamerules.randomtickspeed === speed
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs py-1 border-t border-slate-100 pt-2">
          <div>
            <span className="font-semibold text-slate-700 block">World Spawn Protection Radius</span>
            <span className="text-[10px] text-slate-400">Blocks around spawn protected from griefing</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[0, 5, 10, 16, 32].map((rad) => (
              <button
                key={rad}
                type="button"
                onClick={() => handleSetNumberRule('spawnradius', rad)}
                className={`px-2 py-1 text-xs font-bold rounded-lg border ${
                  gamerules.spawnradius === rad
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {rad}m
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

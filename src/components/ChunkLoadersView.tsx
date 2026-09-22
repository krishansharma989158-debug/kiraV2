import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Zap,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  Info,
  ShieldCheck,
  Compass,
  Sparkles,
  MapPin,
  Layers
} from 'lucide-react';
import { TickingArea } from '../types';

interface ChunkLoadersViewProps {
  onBack?: () => void;
}

export const ChunkLoadersView: React.FC<ChunkLoadersViewProps> = ({ onBack }) => {
  const [tickingAreas, setTickingAreas] = useState<TickingArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for custom chunk loader
  const [customName, setCustomName] = useState('');
  const [dimension, setDimension] = useState<'overworld' | 'nether' | 'the_end'>('overworld');
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(64);
  const [z, setZ] = useState<number>(0);
  const [radius, setRadius] = useState<number>(4);
  const [purpose, setPurpose] = useState('');

  const fetchTickingAreas = async () => {
    try {
      const res = await fetch('/api/tickingareas');
      if (res.ok) {
        const data = await res.json();
        setTickingAreas(data.tickingAreas || []);
      }
    } catch (err) {
      console.error('Failed to fetch ticking areas:', err);
    }
  };

  useEffect(() => {
    fetchTickingAreas();
  }, []);

  const handleAddArea = async (params: {
    name: string;
    type: 'circle' | 'box';
    dimension: 'overworld' | 'nether' | 'the_end';
    centerX: number;
    centerY: number;
    centerZ: number;
    radius: number;
    farmPurpose?: string;
  }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/tickingareas/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (res.ok) {
        setTickingAreas(data.tickingAreas || []);
        setStatusMessage({
          type: 'success',
          text: `Chunk Loader "${params.name}" activated! Farmland & machines will run 24/7.`
        });
        setCustomName('');
        setPurpose('');
      } else {
        throw new Error(data.error || 'Failed to add ticking area');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error activating chunk loader' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveArea = async (name: string) => {
    if (!confirm(`Remove chunk loader "${name}"? Chunks will unload when players leave.`)) return;
    try {
      const res = await fetch('/api/tickingareas/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (res.ok) {
        setTickingAreas(data.tickingAreas || []);
        setStatusMessage({ type: 'success', text: `Chunk loader "${name}" removed.` });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Popular Farm Presets
  const farmPresets = [
    {
      id: 'iron_farm',
      title: 'Iron Golem Farm',
      purpose: 'Iron Ingot 24/7 Automation',
      x: 0,
      y: 64,
      z: 0,
      radius: 4,
      dim: 'overworld' as const,
      color: 'border-emerald-200 bg-emerald-50/50'
    },
    {
      id: 'mob_grinder',
      title: 'Mob Grinder & XP Farm',
      purpose: 'Continuous Gunpowder & XP drop',
      x: 100,
      y: 190,
      z: 100,
      radius: 3,
      dim: 'overworld' as const,
      color: 'border-purple-200 bg-purple-50/50'
    },
    {
      id: 'villager_hall',
      title: 'Villager Trading Center',
      purpose: 'Enchantment Book & Emerald Farm',
      x: 50,
      y: 64,
      z: -50,
      radius: 3,
      dim: 'overworld' as const,
      color: 'border-amber-200 bg-amber-50/50'
    },
    {
      id: 'crop_farm',
      title: 'Sugarcane & Bamboo Farm',
      purpose: 'Paper & Fuel Continuous Production',
      x: -100,
      y: 64,
      z: 100,
      radius: 4,
      dim: 'overworld' as const,
      color: 'border-blue-200 bg-blue-50/50'
    },
    {
      id: 'nether_gold',
      title: 'Nether Gold & XP Farm',
      purpose: 'Zombie Piglin Gold Dropper',
      x: 0,
      y: 128,
      z: 0,
      radius: 4,
      dim: 'nether' as const,
      color: 'border-rose-200 bg-rose-50/50'
    }
  ];

  return (
    <div className="space-y-4 pb-8">
      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Explanatory Hero Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Permanent Farm Chunks (Ticking Areas)
            </h2>
            <p className="text-xs text-slate-500">
              Farms automatically run 24/7 without needing physical chunk loader portals or player presence!
            </p>
          </div>
        </div>

        <div className="mt-3 bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 text-[11px] text-emerald-900 leading-relaxed space-y-1">
          <p>
            ✅ <strong>Player bina bhi farm chalega</strong>: Bedrock dedicated <code>/tickingarea</code> engine selected chunks ko hamesha memory me load rakhta hai.
          </p>
          <p>
            ✅ Iron Golem farms, mob grinders, villager breeders aur sugarcane machines all time work karti rahengi.
          </p>
        </div>
      </div>

      {/* 1-Click Fast Farm Presets */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900">
            1-Click Farm Presets
          </h3>
          <span className="text-[10px] text-slate-400">Instant Activate</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {farmPresets.map((preset) => (
            <div
              key={preset.id}
              className={`p-3 rounded-xl border ${preset.color} flex items-center justify-between transition-all`}
            >
              <div className="min-w-0 pr-2">
                <span className="font-bold text-slate-900 text-xs block">
                  {preset.title}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  {preset.purpose}
                </span>
                <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">
                  XYZ: {preset.x}, {preset.y}, {preset.z} · Radius: {preset.radius} chunks
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleAddArea({
                    name: preset.id,
                    type: 'circle',
                    dimension: preset.dim,
                    centerX: preset.x,
                    centerY: preset.y,
                    centerZ: preset.z,
                    radius: preset.radius,
                    farmPurpose: preset.title
                  })
                }
                disabled={loading}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] rounded-lg shrink-0 shadow-2xs transition-all"
              >
                Set Loader
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Coordinates Loader Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100">
          Add Custom Farm Chunk Loader
        </h3>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Loader / Farm Name
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. my_raid_farm"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Dimension
            </label>
            <select
              value={dimension}
              onChange={(e) => setDimension(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
            >
              <option value="overworld">Overworld</option>
              <option value="nether">The Nether</option>
              <option value="the_end">The End</option>
            </select>
          </div>
        </div>

        {/* Coordinates X, Y, Z */}
        <div>
          <label className="font-semibold text-slate-700 text-xs block mb-1">
            Center Coordinates (X, Y, Z)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 block">X</span>
              <input
                type="number"
                value={x}
                onChange={(e) => setX(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Y</span>
              <input
                type="number"
                value={y}
                onChange={(e) => setY(parseInt(e.target.value, 10) || 64)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Z</span>
              <input
                type="number"
                value={z}
                onChange={(e) => setZ(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Chunk Radius (1 to 4) */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div>
            <span className="font-semibold text-slate-700 block">Chunk Radius</span>
            <span className="text-[10px] text-slate-400">1 to 4 chunks (16 to 64 blocks radius)</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadius(r)}
                className={`w-7 h-7 rounded-lg text-xs font-bold border transition-colors ${
                  radius === r
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            handleAddArea({
              name: customName || 'custom_farm_' + Math.floor(Math.random() * 1000),
              type: 'circle',
              dimension,
              centerX: x,
              centerY: y,
              centerZ: z,
              radius,
              farmPurpose: purpose || 'Custom Machine'
            })
          }
          disabled={loading}
          className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow-xs transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Keep These Chunks Loaded Forever</span>
        </button>
      </div>

      {/* Active Loaders List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900">
            Active Permanent Chunks ({tickingAreas.length})
          </h3>
          <button
            onClick={fetchTickingAreas}
            className="text-[10px] text-emerald-700 font-bold flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        {tickingAreas.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No ticking areas configured yet. Select a preset above to keep farm chunks running 24/7!
          </div>
        ) : (
          <div className="space-y-2">
            {tickingAreas.map((area) => (
              <div
                key={area.id || area.name}
                className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {area.name}
                    </span>
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded capitalize">
                      {area.dimension}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {area.farmPurpose || 'Continuous Farm Machine'}
                  </p>
                  <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                    Pos: [{area.centerX ?? 0}, {area.centerY ?? 64}, {area.centerZ ?? 0}] · {area.radius || 4} Chunks
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveArea(area.name)}
                  title="Remove Ticking Area"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

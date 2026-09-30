import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Compass,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Eye,
  Send,
  MapPin,
  Check,
  Clock,
  Edit3,
  ArrowUpDown,
  Shield,
  ArrowLeft,
  Navigation,
  UserPlus,
  X
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
    autoRestoreMemberOnExit: true
  });

  const [bases, setBases] = useState<BaseClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual Coordinates Base Form State
  const [editingBaseId, setEditingBaseId] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [baseName, setBaseName] = useState('');
  const [posX, setPosX] = useState('0');
  const [posY, setPosY] = useState('70');
  const [posZ, setPosZ] = useState('0');
  const [radiusInput, setRadiusInput] = useState('300');
  const [actionInput, setActionInput] = useState<'visitor' | 'kill' | 'teleport_spawn'>('visitor');
  
  // Multi-partner state (2 or more players with full base access)
  const [partners, setPartners] = useState<string[]>([]);
  const [newPartnerInput, setNewPartnerInput] = useState('');

  // Quick partner addition state for existing bases
  const [quickPartnerBaseId, setQuickPartnerBaseId] = useState<string | null>(null);
  const [quickPartnerName, setQuickPartnerName] = useState('');

  // Live Location Tracker State
  const [playerLocations, setPlayerLocations] = useState<Record<string, { x: number; y: number; z: number }>>({});
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

  // Partner management in Form
  const handleAddPartnerToForm = (gamertag: string) => {
    const clean = gamertag.trim();
    if (!clean) return;
    if (clean.toLowerCase() === ownerName.trim().toLowerCase()) {
      showToast('⚠️ Owner cannot be added as a partner');
      return;
    }
    if (partners.some(p => p.toLowerCase() === clean.toLowerCase())) {
      showToast(`⚠️ "${clean}" is already in partners list`);
      return;
    }
    setPartners([...partners, clean]);
    setNewPartnerInput('');
    showToast(`🤝 Added "${clean}" as base partner!`);
  };

  const handleRemovePartnerFromForm = (gamertag: string) => {
    setPartners(partners.filter(p => p.toLowerCase() !== gamertag.toLowerCase()));
  };

  // Quick partner management on existing active bases
  const handleAddPartnerToExistingBase = async (baseId: string, partnerName: string) => {
    const clean = partnerName.trim();
    if (!clean) return;
    const targetBase = bases.find(b => b.id === baseId);
    if (!targetBase) return;

    if (clean.toLowerCase() === targetBase.ownerGamertag.toLowerCase()) {
      showToast('⚠️ Owner already has full access');
      return;
    }

    const currentPartners = targetBase.trustedMembers || [];
    if (currentPartners.some(p => p.toLowerCase() === clean.toLowerCase())) {
      showToast(`⚠️ "${clean}" already has partner access`);
      return;
    }

    const updated = [...currentPartners, clean];
    try {
      const res = await fetch(`/api/protection/bases/${baseId}/partners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partners: updated })
      });
      if (res.ok) {
        showToast(`🤝 "${clean}" added as partner to "${targetBase.baseName}"!`);
        setQuickPartnerBaseId(null);
        setQuickPartnerName('');
        fetchProtectionData();
      } else {
        showToast('❌ Failed to add partner');
      }
    } catch (e) {
      showToast('❌ Error adding partner');
    }
  };

  const handleRemovePartnerFromExistingBase = async (baseId: string, partnerName: string) => {
    const targetBase = bases.find(b => b.id === baseId);
    if (!targetBase) return;

    const updated = (targetBase.trustedMembers || []).filter(
      p => p.toLowerCase() !== partnerName.toLowerCase()
    );

    try {
      const res = await fetch(`/api/protection/bases/${baseId}/partners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partners: updated })
      });
      if (res.ok) {
        showToast(`🗑️ Removed partner "${partnerName}" from "${targetBase.baseName}"`);
        fetchProtectionData();
      } else {
        showToast('❌ Failed to remove partner');
      }
    } catch (e) {
      showToast('❌ Error removing partner');
    }
  };

  // Submit Manual Coordinate Base (Create or Update)
  const handleSaveManualBase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !baseName.trim()) {
      showToast('⚠️ Owner Gamertag and Base Name are required');
      return;
    }

    const payload = {
      id: editingBaseId || undefined,
      ownerGamertag: ownerName.trim(),
      baseName: baseName.trim(),
      centerX: parseInt(posX, 10) || 0,
      centerY: parseInt(posY, 10) || 70,
      centerZ: parseInt(posZ, 10) || 0,
      radius: parseInt(radiusInput, 10) || 300,
      actionOnTrespass: actionInput,
      trustedMembers: partners
    };

    setLoading(true);
    try {
      const res = await fetch('/api/protection/bases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(
          editingBaseId
            ? `✏️ Base "${payload.baseName}" updated with ${partners.length} partner(s)!`
            : `🛡️ Base "${payload.baseName}" activated with ${partners.length} partner(s) & ${payload.radius}m Full-Height Shield!`
        );
        resetForm();
        fetchProtectionData();
      } else {
        showToast('❌ Failed to save base');
      }
    } catch (e) {
      showToast('❌ Error saving base protection');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingBaseId(null);
    setOwnerName('');
    setBaseName('');
    setPosX('0');
    setPosY('70');
    setPosZ('0');
    setRadiusInput('300');
    setActionInput('visitor');
    setPartners([]);
    setNewPartnerInput('');
  };

  const handleEditBase = (b: BaseClaim) => {
    setEditingBaseId(b.id);
    setOwnerName(b.ownerGamertag);
    setBaseName(b.baseName);
    setPosX(String(b.centerX));
    setPosY(String(b.centerY));
    setPosZ(String(b.centerZ));
    setRadiusInput(String(b.radius));
    setActionInput(b.actionOnTrespass || 'visitor');
    setPartners(b.trustedMembers || []);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Quick fill from player live location
  const handleFillPlayerCoords = (p: Player) => {
    const loc = playerLocations[p.name] || { x: 0, y: 70, z: 0 };
    setOwnerName(p.name);
    setBaseName(`${p.name}'s Fortress`);
    setPosX(String(loc.x));
    setPosY(String(loc.y));
    setPosZ(String(loc.z));
    showToast(`📍 Loaded live coordinates for ${p.name}: [${loc.x}, ${loc.y}, ${loc.z}]`);
  };

  // Delete Base Claim
  const handleDeleteBase = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove protection for "${name}"?`)) {
      return;
    }

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/protection/bases/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast(`🗑️ Base protection for "${name}" removed!`);
        fetchProtectionData();
        if (editingBaseId === id) resetForm();
      } else {
        showToast('❌ Failed to remove base');
      }
    } catch (e) {
      showToast('❌ Error removing base');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Teleport to Base
  const handleTeleportToBase = async (b: BaseClaim) => {
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: `tp @p ${b.centerX} ${b.centerY + 1} ${b.centerZ}` })
      });
      if (res.ok) {
        showToast(`🚀 Teleported closest player to ${b.baseName} [${b.centerX}, ${b.centerY}, ${b.centerZ}]`);
      }
    } catch (e) {
      showToast('❌ Teleport failed');
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-3xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs flex items-center gap-2 shadow-xs animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER & MASTER SWITCH */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Base Protection (बेस सुरक्षा)
                </h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  config.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {config.enabled ? '● Active' : '○ Paused'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                मैन्युअल कोऑर्डिनेट्स + 2 या अधिक पार्टनर्स (Partners Access) + 3D फुल-हाइट सुरक्षा
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-slate-700">Master Shield:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => handleSaveConfig({ enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                fetchProtectionData();
                fetchLocations();
              }}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="Refresh Bases"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Pillars Explanatory Notice */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-900 text-xs">
              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>पार्टनर सिस्टम (2+ खिलाड़ी)</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              एक बेस में 2 या 2 से ज्यादा पार्टनर्स जोड़ सकते हैं। सभी को ब्लॉक लगाने, तोड़ने और चेस्ट खोलने का पूरा एक्सेस मिलता है।
            </p>
          </div>

          <div className="p-3 bg-sky-50/90 border border-sky-200 rounded-xl space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-sky-900 text-xs">
              <ArrowUpDown className="w-4 h-4 text-sky-600 shrink-0" />
              <span>3D बॉर्डर (बेडरॉक से आसमान)</span>
            </div>
            <p className="text-[11px] text-sky-800 leading-relaxed">
              सुरक्षा <b>Y: -64</b> (बेडरॉक) से <b>Y: 320</b> (आसमान) तक फैली है। कोई अंडरग्राउंड सुरंग खोदकर भी नहीं आ सकता।
            </p>
          </div>

          <div className="p-3 bg-purple-50/90 border border-purple-200 rounded-xl space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-purple-900 text-xs">
              <Eye className="w-4 h-4 text-purple-600 shrink-0" />
              <span>विज़िटर मोड + छोटा अलर्ट</span>
            </div>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              अनधिकृत खिलाड़ी को विज़िटर + एडवेंचर मोड मिलता है और छोटी पट्टी में एक्शनबार वार्निंग दिखती है।
            </p>
          </div>
        </div>
      </div>

      {/* 2. MANUAL BASE PROTECTION FORM */}
      <div className="bg-white border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{editingBaseId ? '✏️ बेस और पार्टनर्स एडिट करें (Edit Base)' : '📍 नया बेस सुरक्षित करें (Add Manual Base)'}</span>
                {editingBaseId && (
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                    Editing Mode
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-500">
                मालिक, पार्टनर्स, कोऑर्डिनेट्स और रेडियस डालकर सुरक्षित दायरा एक्टिव करें
              </p>
            </div>
          </div>

          {editingBaseId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-600 hover:text-slate-900 font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSaveManualBase} className="space-y-4 pt-1">
          {/* Row 1: Owner Gamertag & Base Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Main Owner Gamertag (मालिक का नाम) *
                </label>
                {onlinePlayers.length > 0 && (
                  <span className="text-[10px] text-slate-500">
                    Active: {onlinePlayers.length}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="उदा. Krishna77779814"
                  className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600"
                />
                {onlinePlayers.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const p = onlinePlayers.find((x) => x.name === e.target.value);
                        if (p) handleFillPlayerCoords(p);
                      }
                    }}
                    value=""
                    className="text-xs px-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold cursor-pointer hover:bg-slate-200"
                    title="Choose from online players"
                  >
                    <option value="" disabled>
                      🎮 Pick
                    </option>
                    {onlinePlayers.map((p) => (
                      <option key={p.xuid || p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Base Name (बेस का नाम) *
              </label>
              <input
                type="text"
                required
                value={baseName}
                onChange={(e) => setBaseName(e.target.value)}
                placeholder="उदा. Krishna's Fortress"
                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600"
              />
            </div>
          </div>

          {/* DEDICATED PARTNERS & CO-OWNERS SECTION */}
          <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Base Partners / Co-Builders (पार्टनर और साथी खिलाड़ी - 2 या अधिक)</span>
              </label>
              <span className="text-[10px] font-bold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full">
                {partners.length} Partner(s) Added
              </span>
            </div>

            <p className="text-[11px] text-emerald-800 leading-normal">
              🤝 अगर 2 या अधिक लोग मिलकर बेस बना रहे हैं, तो नीचे अपने सभी पार्टनर्स जोड़ें। इन सभी को बेस में पूरा अधिकार रहेगा और कोई विज़िटर मोड नहीं लगेगा।
            </p>

            {/* Partner Badges */}
            <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
              {ownerName.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs">
                  <span>👑 {ownerName.trim()} (Owner)</span>
                </span>
              )}

              {partners.map((partner) => (
                <span
                  key={partner}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-emerald-300 text-emerald-900 text-[11px] font-bold rounded-lg shadow-2xs animate-in fade-in"
                >
                  <span>🤝 {partner}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePartnerFromForm(partner)}
                    className="p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title={`Remove ${partner}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}

              {partners.length === 0 && !ownerName.trim() && (
                <span className="text-[11px] text-slate-500 italic">
                  कोई पार्टनर अभी नहीं जुड़ा है। नीचे से पार्टनर का नाम जोड़ें।
                </span>
              )}
            </div>

            {/* Add Partner Inputs */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="flex-1 flex gap-1.5">
                <input
                  type="text"
                  value={newPartnerInput}
                  onChange={(e) => setNewPartnerInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPartnerToForm(newPartnerInput);
                    }
                  }}
                  placeholder="पार्टनर का Minecraft Gamertag लिखें..."
                  className="w-full text-xs font-semibold px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:outline-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => handleAddPartnerToForm(newPartnerInput)}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Partner</span>
                </button>
              </div>

              {onlinePlayers.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddPartnerToForm(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="text-xs px-3 py-2 bg-white border border-emerald-300 rounded-xl text-emerald-900 font-bold cursor-pointer hover:bg-emerald-50 shrink-0"
                >
                  <option value="" disabled>
                    + Pick from Online Players
                  </option>
                  {onlinePlayers
                    .filter((p) => p.name.toLowerCase() !== ownerName.toLowerCase())
                    .map((p) => (
                      <option key={p.xuid || p.name} value={p.name}>
                        🎮 {p.name}
                      </option>
                    ))}
                </select>
              )}
            </div>
          </div>

          {/* Row 2: Center Coordinates X, Y, Z */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>बेस के केंद्र कोऑर्डिनेट्स (Center Coordinates: X, Y, Z) *</span>
              </label>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setPosX('0');
                    setPosY('70');
                    setPosZ('0');
                  }}
                  className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded"
                >
                  [0, 70, 0]
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">X:</span>
                <input
                  type="number"
                  required
                  value={posX}
                  onChange={(e) => setPosX(e.target.value)}
                  className="w-full text-xs font-mono font-bold pl-8 pr-2 py-2 bg-white border border-slate-200 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Y:</span>
                <input
                  type="number"
                  required
                  value={posY}
                  onChange={(e) => setPosY(e.target.value)}
                  className="w-full text-xs font-mono font-bold pl-8 pr-2 py-2 bg-white border border-slate-200 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Z:</span>
                <input
                  type="number"
                  required
                  value={posZ}
                  onChange={(e) => setPosZ(e.target.value)}
                  className="w-full text-xs font-mono font-bold pl-8 pr-2 py-2 bg-white border border-slate-200 rounded-lg focus:outline-emerald-600"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              💡 यह केंद्र बिंदु है। इसके चारों ओर सुरक्षा चक्र बेडरॉक (Y: -64) से आसमान (Y: 320) तक लागू होगा।
            </p>
          </div>

          {/* Row 3: Radius (दायरा) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Protection Radius (सुरक्षा दायरा) : <span className="text-emerald-700 font-mono font-bold">{radiusInput} Blocks</span>
              </label>
              <div className="flex items-center gap-1">
                {['50', '100', '200', '300', '500'].map((rad) => (
                  <button
                    key={rad}
                    type="button"
                    onClick={() => setRadiusInput(rad)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                      radiusInput === rad
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {rad}m
                  </button>
                ))}
              </div>
            </div>

            <input
              type="range"
              min="20"
              max="600"
              step="10"
              value={radiusInput}
              onChange={(e) => setRadiusInput(e.target.value)}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Row 4: Action on Trespass */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Action on Trespass (घुसपैठिए के साथ क्या हो?)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`p-3 rounded-xl border text-xs cursor-pointer flex flex-col justify-between transition-all ${
                  actionInput === 'visitor'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="trespassAction"
                    value="visitor"
                    checked={actionInput === 'visitor'}
                    onChange={() => setActionInput('visitor')}
                    className="accent-emerald-600"
                  />
                  <span>👁️ Visitor Mode (सुझाया गया)</span>
                </div>
                <span className="text-[10px] font-normal text-slate-500 mt-1 block">
                  न ब्लॉक तोड़ सकता है न लूट। बाहर जाने पर सर्वाइवल मोड वापस मिल जाता है।
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border text-xs cursor-pointer flex flex-col justify-between transition-all ${
                  actionInput === 'teleport_spawn'
                    ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-1 ring-amber-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="trespassAction"
                    value="teleport_spawn"
                    checked={actionInput === 'teleport_spawn'}
                    onChange={() => setActionInput('teleport_spawn')}
                    className="accent-amber-600"
                  />
                  <span>🚀 Push Back (बाहर धकेलें)</span>
                </div>
                <span className="text-[10px] font-normal text-slate-500 mt-1 block">
                  सुरक्षित रूप से सीमा के ठीक बाहर टेलीपोर्ट करता है (नो फॉल डैमेज)।
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border text-xs cursor-pointer flex flex-col justify-between transition-all ${
                  actionInput === 'kill'
                    ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold ring-1 ring-rose-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="trespassAction"
                    value="kill"
                    checked={actionInput === 'kill'}
                    onChange={() => setActionInput('kill')}
                    className="accent-rose-600"
                  />
                  <span>⚔️ Turret / Kill (खत्म करें)</span>
                </div>
                <span className="text-[10px] font-normal text-slate-500 mt-1 block">
                  बेस में प्रवेश करते ही तुरंत न्यूट्रलाइज / किल कर देता है।
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {editingBaseId
                ? '💾 अपडेट करें (Update Base & Partners)'
                : `🛡️ सुरक्षित करें (Activate Base with ${partners.length} Partner(s))`}
            </span>
          </button>
        </form>
      </div>

      {/* 3. ACTIVE PROTECTED BASES LIST */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              सक्रिय सुरक्षित बेस (Active Protected Bases)
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
              {bases.length}
            </span>
          </div>

          <span className="text-[11px] text-slate-500">
            24/7 ऑटोमैटिक पेरिमीटर सुरक्षा चालू
          </span>
        </div>

        {bases.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
            <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">अभी तक कोई बेस सुरक्षित नहीं है</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              ऊपर दिए गए फॉर्म में अपने बेस के कोऑर्डिनेट्स (X, Y, Z) और पार्टनर्स डालकर &apos;सुरक्षित करें&apos; बटन दबाएं।
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bases.map((b) => (
              <div
                key={b.id}
                className="p-3.5 sm:p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        🏰 {b.baseName}
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        👑 Owner: {b.ownerGamertag}
                      </span>
                      <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                        Y: -64 to 320 (Full 3D)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1 font-mono">
                      <span>Center: [{b.centerX}, {b.centerY}, {b.centerZ}]</span>
                      <span>Radius: {b.radius}m</span>
                      <span className="text-emerald-700 font-sans font-bold">
                        Mode: {b.actionOnTrespass === 'visitor' ? '👁️ Visitor' : b.actionOnTrespass === 'kill' ? '⚔️ Turret Kill' : '🚀 Push Outside'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleTeleportToBase(b)}
                      className="px-2.5 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                      title="Teleport to Base"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Visit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditBase(b)}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                      title="Edit Coordinates & Partners"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBase(b.id, b.baseName)}
                      disabled={actionLoadingId === b.id}
                      className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                      title="Delete Protection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* PARTNERS ROW FOR ACTIVE BASE */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Base Partners (पार्टनर्स / साथी बिल्डर्स):</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-mono">
                        {(b.trustedMembers || []).length} Partners
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setQuickPartnerBaseId(quickPartnerBaseId === b.id ? null : b.id);
                        setQuickPartnerName('');
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>{quickPartnerBaseId === b.id ? 'Cancel' : '+ Add Partner'}</span>
                    </button>
                  </div>

                  {/* Partner Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[11px] font-bold rounded-md">
                      👑 {b.ownerGamertag} (Owner)
                    </span>

                    {(b.trustedMembers || []).map((partner) => (
                      <span
                        key={partner}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-semibold rounded-md group"
                      >
                        <span>🤝 {partner}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePartnerFromExistingBase(b.id, partner)}
                          className="text-slate-400 hover:text-rose-600 ml-0.5"
                          title={`Remove ${partner} from partners`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                    {(!b.trustedMembers || b.trustedMembers.length === 0) && (
                      <span className="text-[11px] text-slate-400 italic">
                        कोई पार्टनर नहीं है। &apos;+ Add Partner&apos; दबाकर जोड़ें।
                      </span>
                    )}
                  </div>

                  {/* Quick Add Partner Dropdown / Input on Card */}
                  {quickPartnerBaseId === b.id && (
                    <div className="pt-1.5 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 flex gap-1.5">
                        <input
                          type="text"
                          value={quickPartnerName}
                          onChange={(e) => setQuickPartnerName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddPartnerToExistingBase(b.id, quickPartnerName);
                            }
                          }}
                          placeholder="पार्टनर का नाम लिखें..."
                          className="w-full text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddPartnerToExistingBase(b.id, quickPartnerName)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shrink-0 shadow-2xs"
                        >
                          Confirm Add
                        </button>
                      </div>

                      {onlinePlayers.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddPartnerToExistingBase(b.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                          className="text-xs px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold cursor-pointer"
                        >
                          <option value="" disabled>
                            🎮 Online Players
                          </option>
                          {onlinePlayers
                            .filter(
                              (p) =>
                                p.name.toLowerCase() !== b.ownerGamertag.toLowerCase() &&
                                !(b.trustedMembers || []).some(
                                  (t) => t.toLowerCase() === p.name.toLowerCase()
                                )
                            )
                            .map((p) => (
                              <option key={p.xuid || p.name} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. ONLINE PLAYERS & LIVE COORDINATES HELPER */}
      {onlinePlayers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                ऑनलाइन खिलाड़ी और लाइव कोऑर्डिनेट्स (Live Player Locations)
              </h4>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
              {onlinePlayers.length} Active
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            खिलाड़ी के लाइव कोऑर्डिनेट्स को 1-क्लिक में ऊपर फॉर्म में भरकर नया बेस बनाएं:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {onlinePlayers.map((p) => {
              const loc = playerLocations[p.name] || { x: 0, y: 70, z: 0 };
              return (
                <div
                  key={p.xuid || p.name}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">
                        🎮 {p.name}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span>[{loc.x}, {loc.y}, {loc.z}]</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleFillPlayerCoords(p)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1"
                      title="Use coordinates in form"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Use Coords</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddPartnerToForm(p.name)}
                      className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                      title="Add as Partner in form"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Partner</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

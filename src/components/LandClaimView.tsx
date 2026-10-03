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
  HelpCircle,
  Lock,
  Sparkles,
  UserPlus,
  UserMinus,
  Crown,
  Hammer,
  Box,
  Flame,
  Bomb,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Gift,
  Coins,
  ArrowRightLeft,
  TrendingUp,
  Sliders,
  X
} from 'lucide-react';
import { LandClaim, LandClaimConfig, LandClaimMember, Player, PlayerClaimBlocks } from '../types';
import { HelpModal } from './HelpModal';

interface LandClaimViewProps {
  onBack: () => void;
  onlinePlayers?: Player[];
}

export const LandClaimView: React.FC<LandClaimViewProps> = ({
  onBack,
  onlinePlayers = []
}) => {
  const [config, setConfig] = useState<LandClaimConfig>({
    enabled: true,
    defaultRadius: 100,
    maxClaimsPerPlayer: 5,
    defaultAction: 'visitor',
    autoChestLock: true,
    autoRestoreOnExit: true,
    particleBoundaries: true,
    initialClaimBlocks: 100,
    accrualRatePerHour: 100,
    maxAccruedBlocks: 10000,
    allowPlayerTransfer: true
  });

  const [claims, setClaims] = useState<LandClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTopic, setHelpTopic] = useState('landclaim');

  // Claim Blocks System state
  const [playerBlocks, setPlayerBlocks] = useState<PlayerClaimBlocks[]>([]);
  const [blocksConfig, setBlocksConfig] = useState({
    initialClaimBlocks: 100,
    accrualRatePerHour: 100,
    maxAccruedBlocks: 10000,
    allowPlayerTransfer: true
  });

  // Transfer modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('50');
  const [transferring, setTransferring] = useState(false);

  // Admin Grant modal state
  const [adminGrantModalOpen, setAdminGrantModalOpen] = useState(false);
  const [adminGrantTarget, setAdminGrantTarget] = useState('');
  const [adminGrantAmount, setAdminGrantAmount] = useState('100');
  const [granting, setGranting] = useState(false);

  // Blocks Config drawer state
  const [blocksConfigOpen, setBlocksConfigOpen] = useState(false);
  const [tempInitialBlocks, setTempInitialBlocks] = useState(100);
  const [tempAccrualRate, setTempAccrualRate] = useState(100);
  const [tempMaxAccrued, setTempMaxAccrued] = useState(10000);
  const [tempAllowTransfer, setTempAllowTransfer] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  // Claim Tool Kit (Golden Shovel + Stick) state
  const [kitTarget, setKitTarget] = useState(onlinePlayers[0]?.name || '@p');
  const [givingKit, setGivingKit] = useState(false);

  const handleGiveKit = async (playerTarget?: string) => {
    const target = playerTarget || kitTarget || '@p';
    setGivingKit(true);
    try {
      const res = await fetch('/api/landclaims/give-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gamertag: target })
      });
      if (res.ok) {
        showToast(`🎁 Golden Shovel & Inspection Stick sent to ${target} in game!`);
      } else {
        showToast('Could not deliver claim kit');
      }
    } catch (e) {
      showToast('Failed to give claim kit');
    } finally {
      setGivingKit(false);
    }
  };

  // Form states for creating/editing claim
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [claimName, setClaimName] = useState('');
  const [ownerGamertag, setOwnerGamertag] = useState('');
  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(70);
  const [centerZ, setCenterZ] = useState(0);
  const [radius, setRadius] = useState(100);
  const [actionOnTrespass, setActionOnTrespass] = useState<'visitor' | 'bounce' | 'turret'>('visitor');
  const [preventChestOpening, setPreventChestOpening] = useState(true);
  const [preventBlockBreak, setPreventBlockBreak] = useState(true);
  const [preventBlockPlace, setPreventBlockPlace] = useState(true);
  const [preventDoorInteraction, setPreventDoorInteraction] = useState(true);
  const [preventPvP, setPreventPvP] = useState(true);
  const [preventExplosions, setPreventExplosions] = useState(true);
  const [showBorderParticles, setShowBorderParticles] = useState(true);

  // Partner input
  const [selectedClaimForPartners, setSelectedClaimForPartners] = useState<LandClaim | null>(null);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerRole, setNewPartnerRole] = useState<'co_owner' | 'builder' | 'container'>('co_owner');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openHelp = (topic: string) => {
    setHelpTopic(topic);
    setHelpOpen(true);
  };

  // Fetch land claims from server
  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/landclaims');
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig(data.config);
        if (data.claims) setClaims(data.claims);
      }
    } catch (err) {
      console.warn('Could not fetch land claims:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch player claim blocks & accrual stats
  const fetchClaimBlocks = async () => {
    try {
      const res = await fetch('/api/landclaims/blocks');
      if (res.ok) {
        const data = await res.json();
        if (data.players) {
          setPlayerBlocks(data.players);
          if (!transferFrom && data.players.length > 0) {
            setTransferFrom(data.players[0].gamertag);
          }
          if (!transferTo && data.players.length > 1) {
            setTransferTo(data.players[1].gamertag);
          }
          if (!adminGrantTarget && data.players.length > 0) {
            setAdminGrantTarget(data.players[0].gamertag);
          }
        }
        if (data.config) {
          setBlocksConfig(data.config);
          setTempInitialBlocks(data.config.initialClaimBlocks || 100);
          setTempAccrualRate(data.config.accrualRatePerHour || 100);
          setTempMaxAccrued(data.config.maxAccruedBlocks || 10000);
          setTempAllowTransfer(data.config.allowPlayerTransfer !== false);
        }
      }
    } catch (err) {
      console.warn('Could not fetch claim blocks:', err);
    }
  };

  useEffect(() => {
    fetchClaims();
    fetchClaimBlocks();
    const interval = setInterval(() => {
      fetchClaims();
      fetchClaimBlocks();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Transfer claim blocks between players
  const handleTransferBlocks = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amountNum = parseInt(transferAmount, 10);
    if (!transferFrom.trim() || !transferTo.trim() || isNaN(amountNum) || amountNum <= 0) {
      showToast('From, To Player and valid amount required!');
      return;
    }
    if (transferFrom.toLowerCase() === transferTo.toLowerCase()) {
      showToast('Cannot transfer claim blocks to the same player!');
      return;
    }

    setTransferring(true);
    try {
      const res = await fetch('/api/landclaims/transfer-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPlayer: transferFrom.trim(),
          toPlayer: transferTo.trim(),
          amount: amountNum
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`✔ Transferred ${amountNum} Claim Blocks from ${transferFrom} to ${transferTo}!`);
        setTransferModalOpen(false);
        fetchClaimBlocks();
      } else {
        showToast(data.error || 'Failed to transfer claim blocks');
      }
    } catch (e) {
      showToast('Error transferring claim blocks');
    } finally {
      setTransferring(false);
    }
  };

  // Admin Grant Bonus Blocks
  const handleAdminGiveBlocks = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amountNum = parseInt(adminGrantAmount, 10);
    if (!adminGrantTarget.trim() || isNaN(amountNum) || amountNum <= 0) {
      showToast('Target player and valid amount required!');
      return;
    }

    setGranting(true);
    try {
      const res = await fetch('/api/landclaims/admin-give-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPlayer: adminGrantTarget.trim(),
          amount: amountNum
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`👑 Admin granted +${amountNum} Claim Blocks to ${adminGrantTarget}!`);
        setAdminGrantModalOpen(false);
        fetchClaimBlocks();
      } else {
        showToast(data.error || 'Failed to grant bonus blocks');
      }
    } catch (e) {
      showToast('Error granting bonus blocks');
    } finally {
      setGranting(false);
    }
  };

  // Save Blocks Configuration
  const handleSaveBlocksConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await fetch('/api/landclaims/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialClaimBlocks: Number(tempInitialBlocks),
          accrualRatePerHour: Number(tempAccrualRate),
          maxAccruedBlocks: Number(tempMaxAccrued),
          allowPlayerTransfer: Boolean(tempAllowTransfer)
        })
      });
      if (res.ok) {
        showToast('✔ Claim block configuration saved!');
        setBlocksConfigOpen(false);
        fetchClaimBlocks();
      } else {
        showToast('Failed to save configuration');
      }
    } catch (e) {
      showToast('Error saving configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  // Update master config
  const handleToggleMaster = async () => {
    try {
      const updatedConfig = { ...config, enabled: !config.enabled };
      setConfig(updatedConfig);
      const res = await fetch('/api/landclaims/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      if (res.ok) {
        showToast(updatedConfig.enabled ? '✔ Land Claim Plugin Activated!' : '✖ Land Claim Plugin Disabled');
        fetchClaims();
      }
    } catch (err) {
      showToast('Failed to toggle Land Claim plugin');
    }
  };

  // Save new or edited claim
  const handleSaveClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerGamertag.trim() || !claimName.trim()) {
      showToast('Owner Gamertag aur Claim Name zaroori hai!');
      return;
    }

    try {
      const payload: Partial<LandClaim> = {
        id: editingClaimId || undefined,
        claimName: claimName.trim(),
        ownerGamertag: ownerGamertag.trim(),
        centerX: Number(centerX),
        centerY: Number(centerY),
        centerZ: Number(centerZ),
        radius: Number(radius),
        actionOnTrespass,
        preventChestOpening,
        preventBlockBreak,
        preventBlockPlace,
        preventDoorInteraction,
        preventPvP,
        preventExplosions,
        showBorderParticles,
        active: true
      };

      const res = await fetch('/api/landclaims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingClaimId ? `✔ Claim '${claimName}' updated!` : `✔ Land Claim '${claimName}' created!`);
        resetForm();
        fetchClaims();
      }
    } catch (err) {
      showToast('Error saving land claim');
    }
  };

  // Delete claim
  const handleDeleteClaim = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove Land Claim '${name}'?`)) return;
    try {
      const res = await fetch(`/api/landclaims/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`🗑️ Land Claim '${name}' removed`);
        if (selectedClaimForPartners?.id === id) setSelectedClaimForPartners(null);
        fetchClaims();
      }
    } catch (err) {
      showToast('Failed to delete claim');
    }
  };

  // Add Partner
  const handleAddPartner = async () => {
    if (!selectedClaimForPartners || !newPartnerName.trim()) return;
    const cleanName = newPartnerName.trim();

    const existing = selectedClaimForPartners.trustedMembers || [];
    if (existing.some(m => m.gamertag.toLowerCase() === cleanName.toLowerCase())) {
      showToast(`${cleanName} is already trusted in this claim!`);
      return;
    }

    const updatedMembers: LandClaimMember[] = [
      ...existing,
      { gamertag: cleanName, role: newPartnerRole, addedAt: new Date().toLocaleTimeString() }
    ];

    try {
      const res = await fetch(`/api/landclaims/${selectedClaimForPartners.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: updatedMembers })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedClaimForPartners(data.claim);
        setNewPartnerName('');
        showToast(`✔ Added ${cleanName} as ${newPartnerRole} to claim!`);
        fetchClaims();
      }
    } catch (err) {
      showToast('Failed to add partner');
    }
  };

  // Remove Partner (Instant revoke & visitor mode)
  const handleRemovePartner = async (gamertagToRemove: string) => {
    if (!selectedClaimForPartners) return;
    const updatedMembers = (selectedClaimForPartners.trustedMembers || []).filter(
      m => m.gamertag.toLowerCase() !== gamertagToRemove.toLowerCase()
    );

    try {
      const res = await fetch(`/api/landclaims/${selectedClaimForPartners.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: updatedMembers })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedClaimForPartners(data.claim);
        showToast(`🚫 Revoked ${gamertagToRemove}'s access immediately!`);
        fetchClaims();
      }
    } catch (err) {
      showToast('Failed to remove partner');
    }
  };

  const handleEditClaim = (claim: LandClaim) => {
    setEditingClaimId(claim.id);
    setClaimName(claim.claimName);
    setOwnerGamertag(claim.ownerGamertag);
    setCenterX(claim.centerX);
    setCenterY(claim.centerY);
    setCenterZ(claim.centerZ);
    setRadius(claim.radius);
    setActionOnTrespass(claim.actionOnTrespass);
    setPreventChestOpening(claim.preventChestOpening);
    setPreventBlockBreak(claim.preventBlockBreak);
    setPreventBlockPlace(claim.preventBlockPlace);
    setPreventDoorInteraction(claim.preventDoorInteraction);
    setPreventPvP(claim.preventPvP);
    setPreventExplosions(claim.preventExplosions);
    setShowBorderParticles(claim.showBorderParticles);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingClaimId(null);
    setClaimName('');
    setOwnerGamertag(onlinePlayers[0]?.name || '');
    setCenterX(0);
    setCenterY(70);
    setCenterZ(0);
    setRadius(100);
    setActionOnTrespass('visitor');
  };

  const handleUsePlayerCoords = (player: Player) => {
    setOwnerGamertag(player.name);
    // Fetch live coords or estimate
    fetch(`/api/protection/player-locations`)
      .then(r => r.json())
      .then(d => {
        const coords = d.coordinates?.[player.name];
        if (coords) {
          setCenterX(Math.round(coords.x));
          setCenterY(Math.round(coords.y));
          setCenterZ(Math.round(coords.z));
          showToast(`✔ Loaded live coords for ${player.name}`);
        } else {
          showToast(`Using player ${player.name} as owner`);
        }
      })
      .catch(() => showToast(`Selected ${player.name}`));
  };

  return (
    <div className="space-y-4 text-slate-100 animate-in fade-in duration-150">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 p-3 bg-red-950/90 border border-red-500/50 rounded-xl text-xs font-semibold text-white shadow-xl shadow-red-950/40 flex items-center gap-2 animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-red-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner: Land Claim Engine Status with Dark + Red Theme */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/60 via-[#181622] to-[#121118] border border-red-950/60 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-md shadow-red-950/50">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Land Claim & Grief Prevention
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800/40 font-bold">
                  BDS PRO
                </span>
                {/* Dedicated Question Mark for this Feature */}
                <button
                  type="button"
                  onClick={() => openHelp('landclaim')}
                  title="इसका क्या उपयोग है और कैसे use करें?"
                  className="p-1 rounded-full bg-red-950/80 hover:bg-red-800/80 text-red-400 hover:text-white border border-red-700/50 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-400">
                100% Anti-Theft Protection • Full-Height Y: -64 to 320 • Chest & Container Lock
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMaster}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                config.enabled
                  ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950'
                  : 'bg-zinc-900 text-slate-400 border-zinc-800'
              }`}
            >
              {config.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              <span>{config.enabled ? 'PLUGIN ACTIVE' : 'PLUGIN DISABLED'}</span>
            </button>

            <button
              onClick={fetchClaims}
              className="p-2 rounded-xl bg-[#181622] hover:bg-zinc-800 border border-zinc-800 text-slate-400 hover:text-white transition-colors"
              title="Refresh Claims"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-red-950/40 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0e0d14]/70 border border-red-950/30">
            <Lock className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">Chest Protection</p>
              <p className="font-bold text-slate-200">100% Anti-Theft</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0e0d14]/70 border border-red-950/30">
            <Users className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">Multi-Partners</p>
              <p className="font-bold text-slate-200">2+ Co-Builders</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0e0d14]/70 border border-red-950/30">
            <Compass className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">Active Claims</p>
              <p className="font-bold text-red-400 font-mono">{claims.length} Protected</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0e0d14]/70 border border-red-950/30">
            <Sparkles className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">Perimeter</p>
              <p className="font-bold text-slate-200">Bedrock to Sky</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 GOLDEN SHOVEL & STICK CLAIMING SYSTEM HERO CARD */}
      <div className="bg-[#121118] border-2 border-amber-600/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-black flex items-center justify-center font-bold text-xl shadow-lg shadow-amber-950/60 border border-amber-400 shrink-0">
              ⛏️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Golden Shovel & Stick Claim System</span>
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded-full font-bold">
                    GriefPrevention Bedrock
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                गोल्डन फावड़ा से जमीन क्लेम करें & लकड़ी की छड़ी (Stick) से जमीन का मालिक चेक करें
              </p>
            </div>
          </div>

          {/* 1-Click Give Kit Action */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={kitTarget}
              onChange={(e) => setKitTarget(e.target.value)}
              className="bg-[#0a0a0f] border border-zinc-800 text-xs font-semibold text-white px-2.5 py-2 rounded-xl focus:outline-none focus:border-amber-500"
            >
              <option value="@p">Nearest Player (@p)</option>
              <option value="@a">All Online Players (@a)</option>
              {onlinePlayers.map((p) => (
                <option key={p.xuid || p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleGiveKit()}
              disabled={givingKit}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-extrabold text-xs rounded-xl shadow-md shadow-amber-950/60 flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 shrink-0"
              title="Give Golden Shovel & Stick Kit to target in Minecraft"
            >
              <Gift className="w-4 h-4 text-black" />
              <span>{givingKit ? 'Sending...' : '🎁 Give Claim Kit'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Explanation: Golden Shovel on Left, Stick on Right */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* 1. Golden Shovel */}
          <div className="p-3 bg-[#0a0a0f] border border-amber-900/50 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span>🌟 Golden Shovel (गोल्डन फावड़ा)</span>
              </span>
              <span className="text-[10px] font-mono bg-amber-950/80 text-amber-400 px-1.5 py-0.5 rounded border border-amber-800/40">
                Claiming Tool
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              हाथ में गोल्डन फावड़ा लेकर <b>कोना 1 (Corner 1)</b> पर टैप करें, फिर <b>कोना 2 (Corner 2)</b> पर टैप करें — दोनों कोनों के बीच का पूरा इलाका आपका क्लेम बन जाएगा!
            </p>
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <code className="text-[10px] font-mono bg-[#181622] text-amber-300 px-1.5 py-0.5 rounded border border-zinc-800">
                /kit claim
              </code>
              <code className="text-[10px] font-mono bg-[#181622] text-amber-300 px-1.5 py-0.5 rounded border border-zinc-800">
                /claim [radius]
              </code>
              <code className="text-[10px] font-mono bg-[#181622] text-amber-300 px-1.5 py-0.5 rounded border border-zinc-800">
                /unclaim
              </code>
            </div>
          </div>

          {/* 2. Stick */}
          <div className="p-3 bg-[#0a0a0f] border border-zinc-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span>🪵 Stick (लकड़ी की छड़ी)</span>
              </span>
              <span className="text-[10px] font-mono bg-zinc-900 text-slate-300 px-1.5 py-0.5 rounded border border-zinc-700">
                Inspector Tool
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              हाथ में Stick लेकर किसी भी ब्लॉक पर राइट-क्लिक या टैप करें। यह तुरंत बता देगा कि यह जमीन किसकी है (Owner Gamertag), रेडियस कितना है और कौन-कौन पार्टनर है!
            </p>
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <code className="text-[10px] font-mono bg-[#181622] text-slate-300 px-1.5 py-0.5 rounded border border-zinc-800">
                /claiminfo
              </code>
              <code className="text-[10px] font-mono bg-[#181622] text-slate-300 px-1.5 py-0.5 rounded border border-zinc-800">
                /claimslist
              </code>
              <code className="text-[10px] font-mono bg-[#181622] text-slate-300 px-1.5 py-0.5 rounded border border-zinc-800">
                /trust &lt;player&gt;
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* 🪙 CLAIM BLOCKS ECONOMY, 100 INITIAL BLOCKS, ACCRUAL & TRANSFER HUB */}
      <div className="bg-[#121118] border-2 border-emerald-600/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-black flex items-center justify-center font-bold text-xl shadow-lg shadow-emerald-950/60 border border-emerald-400 shrink-0">
              <Coins className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Claim Blocks Economy & Playtime Accrual</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full font-bold">
                    GriefPrevention
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                शुरुआती 100 ब्लॉक • समय के साथ बढ़ोतरी (Playtime Accrual) • खिलाड़ी आपस में ब्लॉक दे सकते हैं (Transfer)
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (playerBlocks.length > 0) {
                  setTransferFrom(playerBlocks[0].gamertag);
                  if (playerBlocks.length > 1) setTransferTo(playerBlocks[1].gamertag);
                }
                setTransferModalOpen(true);
              }}
              className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-950/50 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>🔄 Transfer Blocks</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (playerBlocks.length > 0) setAdminGrantTarget(playerBlocks[0].gamertag);
                setAdminGrantModalOpen(true);
              }}
              className="px-3 py-2 bg-[#181622] hover:bg-zinc-800 border border-amber-700/50 text-amber-300 hover:text-amber-200 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>👑 +Bonus</span>
            </button>

            <button
              type="button"
              onClick={() => setBlocksConfigOpen(!blocksConfigOpen)}
              className="p-2 bg-[#181622] hover:bg-zinc-800 border border-zinc-800 text-slate-400 hover:text-white rounded-xl transition-all"
              title="Claim Blocks Settings & Rules"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Pillars Explaining the 3 user points in Hindi & English */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
          {/* Pillar 1: Initial 100 Blocks */}
          <div className="p-3.5 bg-[#0a0a0f] border border-emerald-900/50 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span>🎁 1. शुरुआती 100 ब्लॉक</span>
              </span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/50 font-bold">
                {blocksConfig.initialClaimBlocks || 100} Blocks
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              हर नए खिलाड़ी को पहली बार सर्वर जॉइन करते ही <b>100 Claim Blocks</b> मुफ़्त मिलते हैं। इससे खिलाड़ी तुरंत अपना 10×10 साइज का सुरक्षित घर या चेस्ट एरिया क्लेम कर सकता है।
            </p>
            <div className="text-[10px] text-slate-400 font-mono pt-0.5">
              100 blocks = 10×10 Area (Radius 5)
            </div>
          </div>

          {/* Pillar 2: Playtime Accrual - How it increases over time */}
          <div className="p-3.5 bg-[#0a0a0f] border border-teal-900/50 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                <span>⏳ 2. समय के साथ कैसे बढ़ते हैं?</span>
              </span>
              <span className="text-[10px] font-mono bg-teal-950 text-teal-300 px-1.5 py-0.5 rounded border border-teal-800/50 font-bold">
                +{blocksConfig.accrualRatePerHour || 100} / Hour
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              खिलाड़ी जितना ज्यादा सर्वर पर एक्टिव खेलते हैं, उनके क्लेम ब्लॉक्स <b>अपने आप बढ़ते रहते हैं (Playtime Accrual)</b>! हर 6 मिनट पर +10 ब्लॉक्स (1 घंटे में +100 ब्लॉक्स) मिलते हैं, अधिकतम {blocksConfig.maxAccruedBlocks?.toLocaleString() || '10,000'} ब्लॉक्स तक।
            </p>
            <div className="text-[10px] text-slate-400 font-mono pt-0.5">
              ऑटोमैटिक • बिना चीट या पैसे दिए
            </div>
          </div>

          {/* Pillar 3: Player-to-Player Transfer */}
          <div className="p-3.5 bg-[#0a0a0f] border border-amber-900/50 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span>🤝 3. अपने ब्लॉक दूसरे को देना</span>
              </span>
              <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/50 font-bold">
                /giveblocks
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              खिलाड़ी अपने खाली ब्लॉक्स किसी भी दोस्त या टीममेट को <b>गिफ़्ट / ट्रांसफर</b> कर सकते हैं! गेम में चैट में लिखें:
              <br />
              <code className="text-amber-300 font-mono">/giveblocks &lt;player&gt; &lt;amount&gt;</code>
              <br />
              या नीचे दिए गए <b>Transfer Blocks</b> बटन से तुरंत भेजें।
            </p>
          </div>
        </div>

        {/* Settings Drawer (Collapsible) */}
        {blocksConfigOpen && (
          <form onSubmit={handleSaveBlocksConfig} className="p-4 bg-[#0a0a0f] border border-zinc-800 rounded-xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Claim Blocks Rules & Configuration (सर्वर नियम सेटिंग्स)</span>
              </span>
              <button
                type="button"
                onClick={() => setBlocksConfigOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  शुरुआती ब्लॉक्स (Initial Blocks)
                </label>
                <input
                  type="number"
                  min={0}
                  max={5000}
                  value={tempInitialBlocks}
                  onChange={(e) => setTempInitialBlocks(Number(e.target.value))}
                  className="w-full bg-[#181622] border border-zinc-800 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  प्रति घंटा बढ़ोतरी (Accrual / Hour)
                </label>
                <input
                  type="number"
                  min={0}
                  max={2000}
                  value={tempAccrualRate}
                  onChange={(e) => setTempAccrualRate(Number(e.target.value))}
                  className="w-full bg-[#181622] border border-zinc-800 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  अधिकतम सीमा (Max Accrued Cap)
                </label>
                <input
                  type="number"
                  min={100}
                  max={100000}
                  value={tempMaxAccrued}
                  onChange={(e) => setTempMaxAccrued(Number(e.target.value))}
                  className="w-full bg-[#181622] border border-zinc-800 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  खिलाड़ी ट्रांसफर (Allow Transfers)
                </label>
                <button
                  type="button"
                  onClick={() => setTempAllowTransfer(!tempAllowTransfer)}
                  className={`w-full py-1.5 px-3 rounded-xl font-bold text-xs border transition-colors flex items-center justify-center gap-1.5 ${
                    tempAllowTransfer
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700/50'
                      : 'bg-zinc-900 text-slate-400 border-zinc-800'
                  }`}
                >
                  {tempAllowTransfer ? '✔ Transfers Enabled' : '✖ Transfers Disabled'}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={savingConfig}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50"
              >
                {savingConfig ? 'Saving...' : 'Save Rules'}
              </button>
            </div>
          </form>
        )}

        {/* Live Players Claim Blocks Balance Table */}
        <div className="space-y-2 pt-1 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Live Players Claim Blocks Balances ({playerBlocks.length} Players)</span>
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>Default Starting: <b className="text-emerald-400">{blocksConfig.initialClaimBlocks || 100}</b></span>
              <span>Rate: <b className="text-teal-400">+{blocksConfig.accrualRatePerHour || 100}/hr</b></span>
            </div>
          </div>

          {playerBlocks.length === 0 ? (
            <div className="p-3 bg-[#0a0a0f] border border-zinc-800 rounded-xl text-center text-xs text-slate-400">
              कोई खिलाड़ी पंजीकृत नहीं है। खिलाड़ी के सर्वर जॉइन करते ही उसे 100 ब्लॉक्स तुरंत मिल जाएंगे।
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {playerBlocks.map((p) => {
                const totalGross = (p.initialBlocks || 100) + (p.accruedBlocks || 0) + (p.bonusBlocks || 0);
                const used = p.usedBlocks || 0;
                const avail = Math.max(0, totalGross - used);
                const isOnline = onlinePlayers.some(op => op.name.toLowerCase() === p.gamertag.toLowerCase());

                return (
                  <div
                    key={p.gamertag}
                    className="p-3 bg-[#0a0a0f] border border-zinc-800/80 hover:border-emerald-600/40 rounded-xl space-y-2 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                        <span className="font-bold text-white text-xs tracking-tight">{p.gamertag}</span>
                        {isOnline && (
                          <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1 py-0.2 rounded font-mono font-semibold">
                            ONLINE
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {p.playtimeMinutes || 0}m played
                      </span>
                    </div>

                    {/* Balance Breakdown Grid */}
                    <div className="grid grid-cols-3 gap-1 text-[10px] bg-[#181622] p-2 rounded-lg border border-zinc-800/60 font-mono">
                      <div>
                        <span className="text-slate-400 block text-[9px]">Available</span>
                        <strong className="text-emerald-400 text-xs">{avail}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">Accrued</span>
                        <strong className="text-teal-400 text-xs">+{p.accruedBlocks || 0}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">Used in Claim</span>
                        <strong className="text-amber-400 text-xs">{used}</strong>
                      </div>
                    </div>

                    {/* Quick Row Actions */}
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setTransferFrom(p.gamertag);
                          const other = playerBlocks.find(pl => pl.gamertag !== p.gamertag);
                          if (other) setTransferTo(other.gamertag);
                          setTransferModalOpen(true);
                        }}
                        className="flex-1 py-1 px-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Give Blocks</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAdminGrantTarget(p.gamertag);
                          setAdminGrantModalOpen(true);
                        }}
                        className="py-1 px-2 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                        title="Admin bonus blocks grant"
                      >
                        <Crown className="w-3 h-3" />
                        <span>+Bonus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* In-Game Command Helpers */}
        <div className="p-2.5 rounded-xl bg-[#0a0a0f] border border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-semibold">Game Chat Commands:</span>
            <code className="text-[10px] font-mono bg-[#181622] text-emerald-400 px-1.5 py-0.5 rounded border border-zinc-800">
              /claimblocks
            </code>
            <code className="text-[10px] font-mono bg-[#181622] text-amber-400 px-1.5 py-0.5 rounded border border-zinc-800">
              /giveblocks &lt;player&gt; &lt;amount&gt;
            </code>
            <code className="text-[10px] font-mono bg-[#181622] text-teal-400 px-1.5 py-0.5 rounded border border-zinc-800">
              /adminclaimblocks &lt;player&gt; &lt;amount&gt;
            </code>
          </div>
          <span className="text-[10px] text-slate-500 italic">
            Playtime accrual runs 24/7 in background
          </span>
        </div>
      </div>

      {/* 🔄 TRANSFER BLOCKS MODAL */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#121118] border-2 border-emerald-600/50 rounded-2xl p-5 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Transfer Claim Blocks</h3>
                  <p className="text-[11px] text-slate-400">खिलाड़ी अपने ब्लॉक किसी दूसरे को गिफ़्ट/भेजें</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferBlocks} className="space-y-3.5">
              {/* From Player */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  From Player (किस खिलाड़ी के खाते से काटें)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={transferFrom}
                    onChange={(e) => setTransferFrom(e.target.value)}
                    required
                    placeholder="Sender Gamertag"
                    className="flex-1 bg-[#0a0a0f] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  {playerBlocks.length > 0 && (
                    <select
                      value={transferFrom}
                      onChange={(e) => setTransferFrom(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs text-slate-300"
                    >
                      {playerBlocks.map(p => (
                        <option key={p.gamertag} value={p.gamertag}>
                          {p.gamertag} (Avail: {Math.max(0, (p.initialBlocks + p.accruedBlocks + p.bonusBlocks) - (p.usedBlocks || 0))})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* To Player */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  To Player (किस खिलाड़ी को ट्रांसफर करें)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    required
                    placeholder="Recipient Gamertag"
                    className="flex-1 bg-[#0a0a0f] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  {playerBlocks.length > 0 && (
                    <select
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs text-slate-300"
                    >
                      <option value="">Choose recipient...</option>
                      {playerBlocks.filter(p => p.gamertag.toLowerCase() !== transferFrom.toLowerCase()).map(p => (
                        <option key={p.gamertag} value={p.gamertag}>
                          {p.gamertag}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    Amount of Claim Blocks (कितने ब्लॉक भेजने हैं)
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {transferAmount} Blocks
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  required
                  className="w-full bg-[#0a0a0f] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
                {/* Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  {['25', '50', '100', '250', '500'].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTransferAmount(amt)}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[10px] font-mono text-slate-300 transition-colors"
                    >
                      +{amt}
                    </button>
                  ))}
                  {/* Max available button */}
                  {transferFrom && (
                    <button
                      type="button"
                      onClick={() => {
                        const s = playerBlocks.find(p => p.gamertag.toLowerCase() === transferFrom.toLowerCase());
                        if (s) {
                          const av = Math.max(0, (s.initialBlocks + s.accruedBlocks + s.bonusBlocks) - (s.usedBlocks || 0));
                          setTransferAmount(String(av));
                        }
                      }}
                      className="px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-lg text-[10px] font-mono font-bold"
                    >
                      Max
                    </button>
                  )}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 rounded-xl bg-[#0a0a0f] border border-zinc-800 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Sender: <strong className="text-white">{transferFrom || 'Select'}</strong></span>
                  <span>Recipient: <strong className="text-white">{transferTo || 'Select'}</strong></span>
                </div>
                <div className="text-[10px] text-slate-500 italic pt-1">
                  The recipient will receive an in-game titleraw & tellraw message declaring the gift!
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferring}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{transferring ? 'Transferring...' : 'Confirm Transfer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 👑 ADMIN GRANT BONUS MODAL */}
      {adminGrantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#121118] border-2 border-amber-600/50 rounded-2xl p-5 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Admin Grant Bonus Blocks</h3>
                  <p className="text-[11px] text-slate-400">एडमिन द्वारा किसी भी खिलाड़ी को मुफ़्त बोनस ब्लॉक देना</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminGrantModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminGiveBlocks} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Target Player (खिलाड़ी का नाम)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminGrantTarget}
                    onChange={(e) => setAdminGrantTarget(e.target.value)}
                    required
                    placeholder="Player Gamertag"
                    className="flex-1 bg-[#0a0a0f] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  {playerBlocks.length > 0 && (
                    <select
                      value={adminGrantTarget}
                      onChange={(e) => setAdminGrantTarget(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs text-slate-300"
                    >
                      {playerBlocks.map(p => (
                        <option key={p.gamertag} value={p.gamertag}>
                          {p.gamertag}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Bonus Blocks Amount (कितने बोनस ब्लॉक देने हैं)
                </label>
                <input
                  type="number"
                  min={1}
                  value={adminGrantAmount}
                  onChange={(e) => setAdminGrantAmount(e.target.value)}
                  required
                  className="w-full bg-[#0a0a0f] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
                <div className="flex items-center gap-1.5 mt-2">
                  {['100', '250', '500', '1000', '5000'].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAdminGrantAmount(amt)}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[10px] font-mono text-amber-300 transition-colors"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdminGrantModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={granting}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-950/50 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Crown className="w-4 h-4 text-black" />
                  <span>{granting ? 'Granting...' : 'Grant Bonus Blocks'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Left is Claim Form, Right is Active Claims List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Claim Form (7 cols on desktop) */}
        <div className="lg:col-span-7 bg-[#121118] border border-red-950/50 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-red-600/20 text-red-400">
                <Plus className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white">
                {editingClaimId ? '✏️ Edit Land Claim' : '+ New Land Claim (नया लैंड क्लेम)'}
              </h2>
            </div>
            {editingClaimId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSaveClaim} className="space-y-3.5">
            {/* 1. Claim Name & Owner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Claim Name (बेस/जमीन का नाम)
                </label>
                <input
                  type="text"
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  placeholder="e.g. Dragon Fortress, Krishna Base"
                  required
                  className="w-full bg-[#0a0a0f] border border-zinc-800 focus:border-red-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Owner Gamertag (मालिक का नाम)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={ownerGamertag}
                    onChange={(e) => setOwnerGamertag(e.target.value)}
                    placeholder="e.g. Krishna77779814"
                    required
                    className="flex-1 bg-[#0a0a0f] border border-zinc-800 focus:border-red-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500/30"
                  />
                  {onlinePlayers.length > 0 && (
                    <select
                      onChange={(e) => {
                        const p = onlinePlayers.find(pl => pl.name === e.target.value);
                        if (p) handleUsePlayerCoords(p);
                      }}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1 text-xs text-slate-300"
                    >
                      <option value="">Online...</option>
                      {onlinePlayers.map(p => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Live Coords Autofill */}
            {onlinePlayers.length > 0 && (
              <div className="p-2.5 rounded-xl bg-[#181622] border border-zinc-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  खिलाड़ी की लाइव लोकेशन से भरें:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {onlinePlayers.slice(0, 3).map(p => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleUsePlayerCoords(p)}
                      className="px-2 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-[10px] font-semibold flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3 text-red-400" />
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Coordinates: X, Y, Z & Radius */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <span>Center Coordinates & Radius (X, Y, Z, रेडियस)</span>
                  <button
                    type="button"
                    onClick={() => openHelp('landclaim')}
                    className="text-red-400 hover:text-white"
                  >
                    <HelpCircle className="w-3 h-3" />
                  </button>
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-400">
                    रेडियस: <strong className="text-red-400 font-mono">{radius}m</strong> ({radius * 2}×{radius * 2}m zone)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40 font-semibold" title="Total claim blocks required">
                    {(radius * 2) * (radius * 2)} Blocks
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400">X Coord</span>
                  <input
                    type="number"
                    value={centerX}
                    onChange={(e) => setCenterX(Number(e.target.value))}
                    className="w-full bg-[#0a0a0f] border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Y Coord</span>
                  <input
                    type="number"
                    value={centerY}
                    onChange={(e) => setCenterY(Number(e.target.value))}
                    className="w-full bg-[#0a0a0f] border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Z Coord</span>
                  <input
                    type="number"
                    value={centerZ}
                    onChange={(e) => setCenterZ(Number(e.target.value))}
                    className="w-full bg-[#0a0a0f] border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Radius slider & quick pills */}
              <div className="mt-2.5 space-y-1.5">
                <input
                  type="range"
                  min={5}
                  max={250}
                  step={5}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full accent-red-600 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between">
                  {[5, 10, 25, 50, 100, 200].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRadius(r)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        radius === r
                          ? 'bg-red-600 text-white font-bold'
                          : 'bg-zinc-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {r === 5 ? '5m (100 blk)' : `${r}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Action on Trespass */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <span>Action on Trespass (अनधिकृत खिलाड़ी घुसने पर क्या हो?)</span>
                  <button
                    type="button"
                    onClick={() => openHelp('chestlock')}
                    className="text-red-400 hover:text-white"
                  >
                    <HelpCircle className="w-3 h-3" />
                  </button>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActionOnTrespass('visitor')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    actionOnTrespass === 'visitor'
                      ? 'bg-red-950/60 border-red-500 text-white shadow-md shadow-red-950'
                      : 'bg-[#181622] border-zinc-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-red-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Visitor + Chest Lock</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    एडवेंचर मोड + चेस्ट/कंटेनर पूरी तरह लॉक! तोड़फोड़ व चोरी असंभव।
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActionOnTrespass('bounce')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    actionOnTrespass === 'bounce'
                      ? 'bg-red-950/60 border-red-500 text-white shadow-md shadow-red-950'
                      : 'bg-[#181622] border-zinc-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-red-400">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Forcefield Bounce</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    जैसे ही कोई घुसेगा, सीमा के बाहर सुरक्षित धकेल दिया जाएगा।
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActionOnTrespass('turret')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    actionOnTrespass === 'turret'
                      ? 'bg-red-950/60 border-red-500 text-white shadow-md shadow-red-950'
                      : 'bg-[#181622] border-zinc-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-red-400">
                    <Bomb className="w-3.5 h-3.5" />
                    <span>Turret Neutralize</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    घुसपैठिए को तुरंत न्यूट्रलाइज (kill) कर दिया जाएगा।
                  </p>
                </button>
              </div>
            </div>

            {/* 4. Fine-Grained Protection Rules */}
            <div className="p-3 rounded-xl bg-[#0a0a0f] border border-red-950/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300">
                  Advanced Grief Protection Rules (नियम)
                </span>
                <span className="text-[10px] text-red-400 font-semibold">Active Engine</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={preventChestOpening}
                    onChange={(e) => setPreventChestOpening(e.target.checked)}
                    className="accent-red-600 rounded"
                  />
                  <span className="text-[11px]">Lock Chests & Containers</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={preventBlockBreak}
                    onChange={(e) => setPreventBlockBreak(e.target.checked)}
                    className="accent-red-600 rounded"
                  />
                  <span className="text-[11px]">Prevent Block Breaking</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={preventDoorInteraction}
                    onChange={(e) => setPreventDoorInteraction(e.target.checked)}
                    className="accent-red-600 rounded"
                  />
                  <span className="text-[11px]">Lock Doors & Levers</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={preventExplosions}
                    onChange={(e) => setPreventExplosions(e.target.checked)}
                    className="accent-red-600 rounded"
                  />
                  <span className="text-[11px]">Prevent TNT & Creeper</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-red-950 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{editingClaimId ? 'Update Land Claim' : '+ Create Land Claim (लैंड क्लेम सुरक्षित करें)'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Active Claims List & Partner Manager (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Claims Card */}
          <div className="bg-[#121118] border border-red-950/50 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-red-500" />
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  Active Land Claims ({claims.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => openHelp('trustedpartners')}
                className="text-slate-400 hover:text-red-400 flex items-center gap-1 text-[11px]"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Partner Guide</span>
              </button>
            </div>

            {claims.length === 0 ? (
              <div className="p-8 text-center space-y-2 border border-dashed border-zinc-800 rounded-xl">
                <ShieldAlert className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">कोई लैंड क्लेम अभी तक नहीं बना है</p>
                <p className="text-[11px] text-slate-500">बाएं फॉर्म से अपना पहला बेस क्लेम सुरक्षित करें।</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {claims.map((claim) => {
                  const isSelected = selectedClaimForPartners?.id === claim.id;
                  const partnerCount = claim.trustedMembers?.length || 0;

                  return (
                    <div
                      key={claim.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-[#181622] border-red-500 shadow-lg shadow-red-950/40'
                          : 'bg-[#14131d] border-zinc-800/90 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs">{claim.claimName}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950/80 text-red-400 border border-red-800/30">
                              {claim.radius}m
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            ओनर: <span className="font-semibold text-slate-200">{claim.ownerGamertag}</span>
                          </p>
                          <p className="text-[10px] font-mono text-slate-500">
                            Coords: [{claim.centerX}, {claim.centerY}, {claim.centerZ}]
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditClaim(claim)}
                            title="Edit Claim"
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-slate-300 hover:text-white"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClaim(claim.id, claim.claimName)}
                            title="Delete Claim"
                            className="p-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Partners Count & Manage Button */}
                      <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Users className="w-3 h-3 text-red-400" />
                          <span>{partnerCount > 0 ? `${partnerCount} Partners Active` : 'No Partners'}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedClaimForPartners(claim)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            isSelected
                              ? 'bg-red-600 text-white'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-red-400 border border-red-950/60'
                          }`}
                        >
                          👥 Manage Partners →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trusted Partners Manager Modal / Drawer */}
          {selectedClaimForPartners && (
            <div className="bg-[#121118] border border-red-500/50 rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-red-950/40">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Partners & Co-Owners: {selectedClaimForPartners.claimName}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      2 या अधिक पार्टनर्स को एक्सेस दें या तुरंत एक्सेस वापस लें
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClaimForPartners(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Add Partner Form */}
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newPartnerName}
                    onChange={(e) => setNewPartnerName(e.target.value)}
                    placeholder="Enter friend's Gamertag..."
                    className="flex-1 bg-[#0a0a0f] border border-zinc-800 focus:border-red-500/60 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-500"
                  />
                  <select
                    value={newPartnerRole}
                    onChange={(e) => setNewPartnerRole(e.target.value as any)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="co_owner">👑 Co-Owner</option>
                    <option value="builder">🔨 Builder</option>
                    <option value="container">📦 Container</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddPartner}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                  >
                    Add
                  </button>
                </div>

                {/* Quick Add from Online Players */}
                {onlinePlayers.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto text-[10px]">
                    <span className="text-slate-500">Quick:</span>
                    {onlinePlayers.map(p => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setNewPartnerName(p.name)}
                        className="px-1.5 py-0.5 rounded bg-zinc-900 text-slate-300 hover:bg-zinc-800"
                      >
                        +{p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Partners List with 1-Click Revoke */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Authorized Partners ({selectedClaimForPartners.trustedMembers?.length || 0})
                </span>

                {(!selectedClaimForPartners.trustedMembers || selectedClaimForPartners.trustedMembers.length === 0) ? (
                  <p className="text-xs text-slate-500 italic p-2 bg-[#0a0a0f] rounded-lg">
                    अभी कोई पार्टनर नहीं जुड़ा है। सिर्फ ओनर ({selectedClaimForPartners.ownerGamertag}) के पास एक्सेस है।
                  </p>
                ) : (
                  <div className="space-y-1 max-h-[160px] overflow-y-auto">
                    {selectedClaimForPartners.trustedMembers.map((member) => (
                      <div
                        key={member.gamertag}
                        className="p-2 rounded-lg bg-[#0a0a0f] border border-zinc-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {member.role === 'co_owner' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                          {member.role === 'builder' && <Hammer className="w-3.5 h-3.5 text-blue-400" />}
                          {member.role === 'container' && <Box className="w-3.5 h-3.5 text-emerald-400" />}
                          <span className="font-semibold text-white">{member.gamertag}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({member.role})</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePartner(member.gamertag)}
                          title="तुरंत एक्सेस छीनें (Revoke Access)"
                          className="px-2 py-0.5 rounded bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/40 text-[10px] font-bold transition-colors flex items-center gap-1"
                        >
                          <UserMinus className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* In-Game Commands Cheat-Sheet */}
          <div className="p-3.5 rounded-2xl bg-[#0e0d14] border border-red-950/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                <span>⌨️ इन-गेम लैंड क्लेम कमांड्स</span>
              </span>
              <button
                type="button"
                onClick={() => openHelp('landclaim')}
                className="text-[10px] text-slate-400 hover:text-white"
              >
                All Commands →
              </button>
            </div>
            <div className="space-y-1 font-mono text-[11px] text-slate-300">
              <div className="p-1.5 rounded bg-zinc-950 border border-zinc-800/60">
                <code>/claim [radius]</code> - खड़े होने की जगह क्लेम करें
              </div>
              <div className="p-1.5 rounded bg-zinc-950 border border-zinc-800/60">
                <code>/trust &lt;player&gt;</code> - दोस्त को पार्टनर बनाएं
              </div>
              <div className="p-1.5 rounded bg-zinc-950 border border-zinc-800/60">
                <code>/untrust &lt;player&gt;</code> - तुरंत दोस्त को हटाएं
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        initialTopicId={helpTopic}
      />
    </div>
  );
};

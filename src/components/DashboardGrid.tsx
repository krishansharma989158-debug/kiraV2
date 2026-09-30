import React, { useState, useMemo } from 'react';
import {
  Terminal,
  Radio,
  Sliders,
  Globe,
  Users,
  Monitor,
  Rocket,
  Play,
  Square,
  RotateCw,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Cpu,
  HardDrive,
  ChevronRight,
  Download,
  Search,
  Database,
  Zap,
  Sun,
  Moon,
  CloudRain,
  CheckCircle2,
  MapPin,
  Shield,
  Skull,
  Folder,
  AlertTriangle,
  Compass,
  Box,
  Activity
} from 'lucide-react';
import { ServerData, LogEntry } from '../types';

interface DashboardGridProps {
  serverData: ServerData | null;
  logs: LogEntry[];
  onNavigate: (tabId: string) => void;
  onServerAction: (action: 'start' | 'stop' | 'restart' | 'kill' | 'fix-sync') => void;
  loading: boolean;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  serverData,
  logs,
  onNavigate,
  onServerAction,
  loading
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPort, setCopiedPort] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'commands' | 'security' | 'players' | 'settings' | 'storage'>('all');
  const [quickToast, setQuickToast] = useState<string | null>(null);

  const data = serverData || {
    status: 'offline',
    serverName: 'Kira Bedrock Server',
    version: '1.21.62.01 Bedrock Dedicated Server',
    activeVersion: '1.21.62.01',
    bedrockPort: 19132,
    uptimeSeconds: 0,
    tps: 20.0,
    cpuPercent: 0,
    ramUsageMb: 32,
    maxRamMb: 1024,
    playerCount: 0,
    maxPlayers: 8,
    players: [],
    gamemode: 'survival',
    difficulty: 'normal',
    allowCheats: false,
    currentWorld: { name: 'BedrockLevel', sizeMb: 5 },
    playit: { claimStatus: 'claimed', tunnelAddress: 'kira-pe.playit.gg', tunnelPort: 19132 }
  } as unknown as ServerData;

  const isOnline = data.status === 'online';
  const isStarting = data.status === 'starting';
  const isStopping = data.status === 'stopping';

  const isPlayitClaimed = data.playit?.claimStatus === 'claimed';
  const displayHost = isPlayitClaimed ? data.playit.tunnelAddress : '0.0.0.0';
  const displayPort = isPlayitClaimed ? data.playit.tunnelPort : data.bedrockPort;
  const connectionAddress = `${displayHost}:${displayPort}`;

  const copyConnection = () => {
    navigator.clipboard.writeText(connectionAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const copyPortOnly = () => {
    navigator.clipboard.writeText(String(displayPort));
    setCopiedPort(true);
    setTimeout(() => setCopiedPort(false), 2000);
  };

  const handleQuickCommand = async (cmd: string, msg: string) => {
    try {
      await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      setQuickToast(msg);
      setTimeout(() => setQuickToast(null), 2500);
    } catch (e) {}
  };

  // 14 Unique Non-Duplicate Options
  const gridOptions = [
    {
      id: 'lag',
      title: 'Lag & Chunks Optimizer',
      categoryType: 'settings',
      category: 'Anti-Lag Engine',
      subtitle: 'Fix mob/animal animation glitch, reload player chunks & broadcast lag warning',
      badge: data.lagAlert ? '⚠ Lag Spike' : '20 TPS Smooth',
      badgeColor: data.lagAlert
        ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse'
        : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
      iconBg: 'bg-amber-600',
      icon: Activity,
      imageBg: 'from-amber-500/10 to-orange-500/10',
      tag: 'lag chunks optimizer mob animation animal glitch tps warning tick distance single player unstuck items clear'
    },
    {
      id: 'protection',
      title: 'Base Protection Shield',
      categoryType: 'security',
      category: 'Anti-Theft Shield',
      subtitle: 'Manual Coordinates Base Shield • Full-Height Anti-Grief (Y: -64 to 320) • Visitor Mode',
      badge: '3D Full-Height Shield',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
      iconBg: 'bg-emerald-600',
      icon: ShieldCheck,
      imageBg: 'from-emerald-500/10 to-teal-500/10',
      tag: 'base protection shield 300 blocks visitor anti-theft grief claim core lodestone coordinates height'
    },
    {
      id: 'teleport',
      title: 'Teleport Stations & Cmds',
      categoryType: 'commands',
      category: 'Command Blocks',
      subtitle: 'Command block generator, player-wise buttons & spawn warp hubs',
      badge: 'Admin Kit',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold',
      iconBg: 'bg-indigo-600',
      icon: Compass,
      imageBg: 'from-indigo-500/10 to-purple-500/10',
      tag: 'teleport station command block player warp spawn button impulse repeating chain'
    },
    {
      id: 'mastercommands',
      title: '55 Master Commands',
      categoryType: 'commands',
      category: 'Master Control Hub',
      subtitle: 'Farm loader, spy, freeze, mute, reset, roles & diagnostics',
      badge: '55 Commands',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
      iconBg: 'bg-emerald-700',
      icon: Terminal,
      imageBg: 'from-emerald-500/10 to-teal-500/10',
      tag: '55 commands master panel loadchunk spy freeze mute unfreeze propertyprotection chestlock resetserver killmobs cmd shell'
    },
    {
      id: 'security',
      title: 'Security & Anti-Cheat',
      categoryType: 'security',
      category: 'Shield & Anti-Hack',
      subtitle: 'Anti-Xray, Auto-Ban Hacks, Anti-Dupe, Operator OP',
      badge: 'Protected',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
      iconBg: 'bg-emerald-600',
      icon: ShieldCheck,
      imageBg: 'from-emerald-500/10 to-teal-500/10',
      tag: 'security anti-cheat xray auto ban dupe operator op member hack cheat glitch'
    },
    {
      id: 'players',
      title: 'Players & Roles',
      categoryType: 'players',
      category: 'Player Admin',
      subtitle: 'Member to Visitor, Operator OP, Give Netherite/Elytra',
      badge: `${data.players?.length || 0} Online`,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      iconBg: 'bg-purple-600',
      icon: Users,
      imageBg: 'from-purple-500/10 to-pink-500/10',
      tag: 'player visitor member operator op give items diamond netherite elytra kick ban mute'
    },
    {
      id: 'chunkloaders',
      title: '24/7 Farm Loaders',
      categoryType: 'commands',
      category: 'Automation',
      subtitle: 'Keep iron, mob & crop farms active 24/7 without players',
      badge: 'Always Loaded',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-600',
      icon: Zap,
      imageBg: 'from-emerald-500/10 to-lime-500/10',
      tag: 'chunk loader farm ticking area iron mob grinder 24/7 load automation'
    },
    {
      id: 'gamerules',
      title: 'Game Rules (50+)',
      categoryType: 'settings',
      category: 'Game Settings',
      subtitle: 'Coordinates ON, KeepInv, Creeper grief off, PvP & TNT',
      badge: '50+ Rules',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-600',
      icon: Sliders,
      imageBg: 'from-blue-500/10 to-indigo-500/10',
      tag: 'game rules coordinates keep inventory creeper tnt pvp fall damage mob griefing'
    },
    {
      id: 'backups',
      title: 'Auto-Backup & Storage',
      categoryType: 'storage',
      category: 'Storage Protection',
      subtitle: 'Loop timer (15m/1h/24h), retention quota & restore ZIP',
      badge: 'Auto-Save',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      iconBg: 'bg-teal-600',
      icon: Database,
      imageBg: 'from-teal-500/10 to-emerald-500/10',
      tag: 'backup storage minutes hours loop delete zip restore snapshot'
    },
    {
      id: 'worlds',
      title: 'World Manager & Seeds',
      categoryType: 'storage',
      category: 'World Data',
      subtitle: `${data.currentWorld?.name || 'BedrockLevel'} · Seed generator & Upload`,
      badge: `${data.currentWorld?.sizeMb || 5} MB`,
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      iconBg: 'bg-sky-600',
      icon: Globe,
      imageBg: 'from-sky-500/10 to-blue-500/10',
      tag: 'world level seed upload mcworld reset dimension'
    },
    {
      id: 'version',
      title: 'Bedrock Engine Version',
      categoryType: 'settings',
      category: 'Server Engine',
      subtitle: `v${data.activeVersion || '1.21.62.01'} active · Update or switch`,
      badge: `v${data.activeVersion || '1.21.62.01'}`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-mono',
      iconBg: 'bg-emerald-700',
      icon: Download,
      imageBg: 'from-emerald-500/10 to-teal-500/10',
      tag: 'version bedrock update download engine 1.21 update'
    },
    {
      id: 'playit',
      title: 'Playit Public Tunnel',
      categoryType: 'settings',
      category: 'Networking',
      subtitle: isPlayitClaimed ? 'Connected · Friends can join' : 'Claim link ready to activate',
      badge: isPlayitClaimed ? 'Active Tunnel' : 'Needs Claim',
      badgeColor: isPlayitClaimed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
      iconBg: 'bg-emerald-600',
      icon: Radio,
      imageBg: 'from-emerald-500/10 to-cyan-500/10',
      tag: 'playit tunnel port ip public claim domain connection'
    },
    {
      id: 'properties',
      title: 'Server Settings & Config',
      categoryType: 'settings',
      category: 'Configuration',
      subtitle: 'Gamemode, difficulty, max players, port, cheats & motd',
      badge: 'server.properties',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      iconBg: 'bg-slate-700',
      icon: Sliders,
      imageBg: 'from-slate-500/10 to-slate-600/10',
      tag: 'properties config port max-players view-distance cheats settings options'
    },
    {
      id: 'files',
      title: 'Server File Manager',
      categoryType: 'storage',
      category: 'File Browser',
      subtitle: 'Browse worlds, offline folders, edit properties & upload archives',
      badge: 'File Manager',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
      iconBg: 'bg-amber-600',
      icon: Folder,
      imageBg: 'from-amber-500/10 to-orange-500/10',
      tag: 'files file manager worlds folders configs offline explorer upload download text editor code'
    },
    {
      id: 'console',
      title: 'Live Terminal & Commands',
      categoryType: 'commands',
      category: 'Console',
      subtitle: `${logs.length} live logs · Interactive Bedrock command prompt`,
      badge: isOnline ? 'Online' : 'Offline',
      badgeColor: isOnline ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200',
      iconBg: 'bg-indigo-600',
      icon: Terminal,
      imageBg: 'from-indigo-500/10 to-purple-500/10',
      tag: 'console terminal logs commands /op /kick /time /weather shell'
    }
  ];

  // Filter options based on user search and category filter
  const filteredOptions = useMemo(() => {
    let list = gridOptions;
    if (categoryFilter !== 'all') {
      list = list.filter(opt => opt.categoryType === categoryFilter);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      opt =>
        opt.title.toLowerCase().includes(q) ||
        opt.subtitle.toLowerCase().includes(q) ||
        opt.category.toLowerCase().includes(q) ||
        opt.tag.toLowerCase().includes(q)
    );
  }, [searchQuery, categoryFilter]);

  return (
    <div className="space-y-3 pb-24 max-w-2xl mx-auto">
      {/* Quick Action Toast */}
      {quickToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 shadow-xs animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{quickToast}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP GLOBAL SEARCH BAR (MOBILE FRIENDLY) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search commands, rules, backup, players, version..."
          className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 font-medium shadow-2xs focus:outline-emerald-600 focus:border-emerald-600 transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold p-0.5"
          >
            ✕
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SERVER STATUS CARD (IP, PORT, BEDROCK ENGINE, START/STOP) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
        {/* Header: Server Name, Minecraft Version, Status */}
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="min-w-0 pr-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                {data.serverName || 'Kira Bedrock Server'}
              </span>
              <button
                type="button"
                onClick={() => onNavigate('version')}
                title="Change or Update Bedrock Version"
                className="text-[10px] font-mono font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-md transition-colors"
              >
                v{data.activeVersion || '1.21.62.01'}
              </button>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
              Bedrock Engine · Cheats OFF · Texture Locked (Anti-Xray)
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isStarting || isStopping
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline
                  ? 'bg-emerald-500 animate-pulse'
                  : isStarting || isStopping
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <span className="capitalize text-[11px]">{data.status}</span>
          </div>
        </div>

        {/* IP Address & Bedrock Port Copy Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Host/IP */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Server IP Address
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 truncate block mt-0.5">
                {displayHost}
              </span>
            </div>
            <button
              type="button"
              onClick={copyConnection}
              className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 shadow-2xs transition-colors shrink-0 active:scale-95"
            >
              {copiedAddress ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 text-[10px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px]">Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Port */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Bedrock Port (UDP)
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 truncate block mt-0.5">
                {displayPort}
              </span>
            </div>
            <button
              type="button"
              onClick={copyPortOnly}
              className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 shadow-2xs transition-colors shrink-0 active:scale-95"
            >
              {copiedPort ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 text-[10px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px]">Copy Port</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Desync Warning Alert (if server is running in Minecraft but web panel detached) */}
        {data.isDesynced && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-start gap-2 text-xs text-amber-950 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">⚠️ Process Sync Detached (Server Active in Game!)</p>
                <p className="text-[11px] font-normal text-amber-800">
                  Bedrock server is running in Minecraft PE, but the web panel control handle is detached. Click <b>Fix & Sync Controls</b> to restore Day/Night and Give commands!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onServerAction('fix-sync')}
              disabled={loading}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-2xs transition-all shrink-0 flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Fix & Sync Controls</span>
            </button>
          </div>
        )}

        {/* Server Start, Stop, Restart, Fix-Sync Buttons (Large mobile touch targets) */}
        <div className="flex items-center gap-2 pt-0.5">
          {!isOnline && !isStarting ? (
            <>
              <button
                type="button"
                onClick={() => onServerAction('start')}
                disabled={loading || isStopping}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all text-xs sm:text-sm disabled:opacity-50 min-h-[46px]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{loading ? 'Starting Bedrock...' : 'Start Server'}</span>
              </button>

              <button
                type="button"
                onClick={() => onServerAction('fix-sync')}
                disabled={loading}
                title="Fix & Resync Process (Clears port conflict & connects commands)"
                className="px-3 py-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 active:scale-95 text-amber-800 rounded-xl font-bold transition-all min-h-[46px] flex items-center justify-center gap-1.5 text-xs shadow-2xs"
              >
                <RotateCw className="w-4 h-4 text-amber-700" />
                <span className="hidden sm:inline">Fix & Resync</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onServerAction('stop')}
                disabled={loading || isStopping}
                className="flex-1 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all text-xs sm:text-sm disabled:opacity-50 min-h-[46px]"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>{isStopping ? 'Stopping Server...' : 'Stop Server'}</span>
              </button>

              <button
                type="button"
                onClick={() => onServerAction('restart')}
                disabled={loading || isStopping}
                title="Restart Server Process"
                className="p-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl font-bold transition-all min-h-[46px] min-w-[46px] flex items-center justify-center"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onServerAction('fix-sync')}
                disabled={loading}
                title="Force Resync Process (Fix commands & controls)"
                className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 active:scale-95 text-amber-800 rounded-xl font-bold transition-all min-h-[46px] min-w-[46px] flex items-center justify-center"
              >
                <RotateCw className="w-4 h-4 text-amber-600" />
              </button>
            </>
          )}
        </div>

        {/* Real Metrics: RAM & CPU */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span className="flex items-center gap-1 font-medium">
                <HardDrive className="w-3 h-3 text-slate-400" />
                RAM
              </span>
              <span className="font-semibold text-slate-700">
                {data.ramUsageMb} / {data.maxRamMb} MB
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (data.ramUsageMb / data.maxRamMb) * 100)}%`
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span className="flex items-center gap-1 font-medium">
                <Cpu className="w-3 h-3 text-slate-400" />
                CPU & TPS
              </span>
              <span className="font-semibold text-slate-700">
                {data.cpuPercent}% · {isOnline ? '20 TPS' : '0 TPS'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, data.cpuPercent)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2.5 LIVE MOB ANIMATION & CHUNK HEALTH MONITOR */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`border rounded-2xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
          data.lagAlert
            ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-400/20'
            : isOnline
            ? 'bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/70 border-emerald-200'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              data.lagAlert
                ? 'bg-rose-500 text-white animate-pulse'
                : isOnline
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-300 text-slate-600'
            }`}
          >
            <Activity className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900">
                {data.lagAlert
                  ? '⚠ Mob/Animal Lag Detected!'
                  : isOnline
                  ? 'Mob & Animals Sync: Smooth (20 TPS)'
                  : 'Anti-Lag Engine Ready'}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                  data.lagAlert
                    ? 'bg-rose-200 text-rose-900'
                    : isOnline
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {data.lagAlert ? 'Action Needed' : 'Zero Glitch'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {data.lagAlert
                ? 'Chunk desync or mob freeze detected! 1-click repair available.'
                : 'View: 8 chunks • Tick: 4 chunks • No rubberbanding'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch('/api/lag/fix-mob-animations', { method: 'POST' });
                if (res.ok) {
                  const d = await res.json();
                  setQuickToast(d.message || '✨ Mob animations synchronized!');
                }
              } catch (e) {}
            }}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all shadow-2xs"
            title="Fix Mob & Animal Animation Glitch"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fix Mobs</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('lag')}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 active:scale-95 font-bold text-xs rounded-xl flex items-center gap-1 transition-all shadow-2xs"
            title="Open Lag & Chunks Optimizer"
          >
            <span>Chunks & Lag Hub →</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. 1-CLICK QUICK CONTROLS BAR (EASY TO USE ON MOBILE) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>1-Click Quick Controls</span>
          </span>
          <span className="text-[10px] text-slate-400">Live Actions</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {/* Lag & Chunks Optimizer */}
          <button
            type="button"
            onClick={() => onNavigate('lag')}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-2xs"
          >
            <Activity className="w-3.5 h-3.5 text-amber-600" />
            <span>Lag & Chunks Hub</span>
          </button>

          {/* Base Shield */}
          <button
            type="button"
            onClick={() => onNavigate('protection')}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-2xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Base Shield (300m)</span>
          </button>

          {/* Teleport Hub */}
          <button
            type="button"
            onClick={() => onNavigate('teleport')}
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-900 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            <span>Teleport Hub</span>
          </button>

          {/* Clear RAM & Anti-Lag */}
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch('/api/performance/optimize-ram', { method: 'POST' });
                if (res.ok) {
                  const d = await res.json();
                  setQuickToast(d.message || '⚡ Freed RAM! Mob & item lag cleared.');
                  setTimeout(() => setQuickToast(null), 3000);
                }
              } catch (e) {}
            }}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Clear RAM</span>
          </button>

          {/* Day */}
          <button
            type="button"
            onClick={() => handleQuickCommand('time set day', '☀️ Time changed to Day!')}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-2xs"
          >
            <Sun className="w-3.5 h-3.5 text-amber-600" />
            <span>Day</span>
          </button>

          {/* Night */}
          <button
            type="button"
            onClick={() => handleQuickCommand('time set night', '🌙 Time changed to Night!')}
            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-2xs"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Night</span>
          </button>

          {/* Clear Weather */}
          <button
            type="button"
            onClick={() => handleQuickCommand('weather clear', '🌤️ Weather cleared!')}
            className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-2xs"
          >
            <CloudRain className="w-3.5 h-3.5 text-sky-600" />
            <span>Clear Weather</span>
          </button>

          {/* Coordinates ON */}
          <button
            type="button"
            onClick={() => handleQuickCommand('gamerule showcoordinates true', '📍 Show Coordinates turned ON!')}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-2xs"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Coords ON</span>
          </button>

          {/* Keep Inventory */}
          <button
            type="button"
            onClick={() => handleQuickCommand('gamerule keepinventory true', '🛡️ Keep Inventory turned ON!')}
            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-2xs"
          >
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            <span>KeepInv ON</span>
          </button>

          {/* Kill Hostile Mobs */}
          <button
            type="button"
            onClick={() => handleQuickCommand('kill @e[type=!player]', '💀 Hostile mobs cleared!')}
            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-2xs"
          >
            <Skull className="w-3.5 h-3.5 text-rose-600" />
            <span>Kill Mobs</span>
          </button>

          {/* 24/7 Farm Loaders */}
          <button
            type="button"
            onClick={() => onNavigate('chunkloaders')}
            className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            <span>24/7 Farm</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. CATEGORY FILTER TABS FOR QUICK NAVIGATION */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 px-0.5">
        {[
          { id: 'all', label: 'All Options' },
          { id: 'commands', label: '⚡ Commands' },
          { id: 'security', label: '🛡️ Security' },
          { id: 'players', label: '👥 Players' },
          { id: 'settings', label: '⚙️ Settings' },
          { id: 'storage', label: '💾 Storage' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategoryFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all active:scale-95 ${
              categoryFilter === tab.id
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. 2-COLUMN BALANCED GRIDVIEW (NO DUPLICATES, MOBILE OPTIMIZED) */}
      {/* ------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Server Features & Tools
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">
            {filteredOptions.length} Categories
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {filteredOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onNavigate(opt.id)}
                className={`bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-3 sm:p-3.5 shadow-2xs hover:shadow-sm active:scale-[0.98] transition-all flex flex-col justify-between text-left min-h-[120px] sm:min-h-[130px] relative overflow-hidden group bg-linear-to-br ${opt.imageBg}`}
              >
                {/* Top Row: Icon Container + Category / Badge */}
                <div className="flex items-start justify-between w-full">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${opt.iconBg} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0`}
                  >
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${opt.badgeColor} max-w-[85px] truncate`}
                  >
                    {opt.badge}
                  </span>
                </div>

                {/* Bottom Row: Category Eyebrow, Title & Subtitle */}
                <div className="mt-2 min-w-0 w-full">
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                    {opt.category}
                  </span>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                      {opt.title}
                    </h4>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-0.5" />
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 leading-tight">
                    {opt.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

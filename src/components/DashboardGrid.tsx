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
  Activity,
  HelpCircle,
  Package,
  Lock
} from 'lucide-react';
import { ServerData, LogEntry } from '../types';
import { HelpModal } from './HelpModal';

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
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedHelpTopic, setSelectedHelpTopic] = useState('landclaim');

  const openHelp = (topicId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedHelpTopic(topicId);
    setHelpOpen(true);
  };

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

  // 15 Distinct Dashboard Options with Land Claim & Plugin Store
  const gridOptions = [
    {
      id: 'landclaim',
      title: 'Land Claim & Grief Guard',
      categoryType: 'security',
      category: 'Land Protection Plugin',
      subtitle: 'Anti-Theft Protection • Chest Lock • Co-Owners • /claim',
      badge: 'Plugin Applied',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800/60 font-bold',
      iconBg: 'bg-red-600',
      icon: ShieldCheck,
      helpTopicId: 'landclaim',
      tag: 'land claim protection grief chest lock trust partner co-owner /claim claimblocks'
    },
    {
      id: 'pluginstore',
      title: 'Plugin & Addon Store',
      categoryType: 'settings',
      category: 'Marketplace',
      subtitle: 'Browse, 1-Click Install & Configure 10+ BDS Bedrock Plugins',
      badge: '10 Plugins',
      badgeColor: 'bg-red-950 text-red-300 border-red-800/50 font-bold',
      iconBg: 'bg-red-700',
      icon: Package,
      helpTopicId: 'pluginstore',
      tag: 'plugin store addons market install download landclaim economy clans anticheat warps'
    },
    {
      id: 'lag',
      title: 'Lag & Chunks Optimizer',
      categoryType: 'settings',
      category: 'Anti-Lag Engine',
      subtitle: 'Fix mob/animal animation glitch, reload player chunks & clear lag',
      badge: data.lagAlert ? '⚠ Lag Spike' : '20 TPS Smooth',
      badgeColor: data.lagAlert
        ? 'bg-rose-950 text-rose-300 border-rose-800 font-bold animate-pulse'
        : 'bg-red-950 text-red-300 border-red-800/40 font-bold',
      iconBg: 'bg-amber-600',
      icon: Activity,
      helpTopicId: 'lagoptimizer',
      tag: 'lag chunks optimizer mob animation animal glitch tps warning tick distance single player unstuck items clear'
    },
    {
      id: 'mastercommands',
      title: '55 Master Commands',
      categoryType: 'commands',
      category: 'Control Hub',
      subtitle: 'Farm loader, spy, freeze, mute, reset, roles & diagnostics',
      badge: '55 Commands',
      badgeColor: 'bg-red-950 text-red-300 border-red-800/40 font-bold',
      iconBg: 'bg-red-800',
      icon: Terminal,
      helpTopicId: 'console',
      tag: '55 commands master panel loadchunk spy freeze mute unfreeze chestlock resetserver killmobs cmd shell'
    },
    {
      id: 'security',
      title: 'Security & Anti-Cheat Hub',
      categoryType: 'security',
      category: 'Anti-Hack Shield',
      subtitle: 'Anti-Xray, Auto-Ban Hacks, Anti-Dupe, Operator OP Security',
      badge: 'Protected',
      badgeColor: 'bg-red-950 text-red-300 border-red-800/40 font-bold',
      iconBg: 'bg-red-600',
      icon: ShieldCheck,
      helpTopicId: 'anticheat',
      tag: 'security anti-cheat xray auto ban dupe operator op member hack cheat glitch'
    },
    {
      id: 'players',
      title: 'Players & Roles Admin',
      categoryType: 'players',
      category: 'Player Admin',
      subtitle: 'Member to Visitor, Operator OP, Give Netherite/Elytra',
      badge: `${data.players?.length || 0} Online`,
      badgeColor: 'bg-purple-950 text-purple-300 border-purple-800/40',
      iconBg: 'bg-purple-700',
      icon: Users,
      helpTopicId: 'trustedpartners',
      tag: 'player visitor member operator op give items diamond netherite elytra kick ban mute'
    },
    {
      id: 'teleport',
      title: 'Teleport Stations & Cmds',
      categoryType: 'commands',
      category: 'Command Blocks',
      subtitle: 'Command block generator, player-wise buttons & spawn warp hubs',
      badge: 'Admin Kit',
      badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800/40 font-bold',
      iconBg: 'bg-indigo-700',
      icon: Compass,
      helpTopicId: 'landclaim',
      tag: 'teleport station command block player warp spawn button impulse repeating chain'
    },
    {
      id: 'chunkloaders',
      title: '24/7 Farm Loaders',
      categoryType: 'commands',
      category: 'Automation',
      subtitle: 'Keep iron, mob & crop farms active 24/7 without players online',
      badge: 'Always Loaded',
      badgeColor: 'bg-red-950 text-red-300 border-red-800/40',
      iconBg: 'bg-red-600',
      icon: Zap,
      helpTopicId: 'chunkloaders',
      tag: 'chunk loader farm ticking area iron mob grinder 24/7 load automation'
    },
    {
      id: 'gamerules',
      title: 'Game Rules (50+ Settings)',
      categoryType: 'settings',
      category: 'Game Rules',
      subtitle: 'Coordinates ON, KeepInv, Creeper grief off, PvP & TNT',
      badge: '50+ Rules',
      badgeColor: 'bg-blue-950 text-blue-300 border-blue-800/40',
      iconBg: 'bg-blue-700',
      icon: Sliders,
      helpTopicId: 'chestlock',
      tag: 'game rules coordinates keep inventory creeper tnt pvp fall damage mob griefing'
    },
    {
      id: 'backups',
      title: 'Auto-Backup & Retention',
      categoryType: 'storage',
      category: 'Backup Manager',
      subtitle: 'Loop timer (15m/1h/24h), retention quota & restore ZIP',
      badge: 'Auto-Save',
      badgeColor: 'bg-teal-950 text-teal-300 border-teal-800/40',
      iconBg: 'bg-teal-700',
      icon: Database,
      helpTopicId: 'landclaim',
      tag: 'backup storage minutes hours loop delete zip restore snapshot'
    },
    {
      id: 'worlds',
      title: 'World Manager & Seeds',
      categoryType: 'storage',
      category: 'World Data',
      subtitle: `${data.currentWorld?.name || 'BedrockLevel'} · Seed generator & Upload`,
      badge: `${data.currentWorld?.sizeMb || 5} MB`,
      badgeColor: 'bg-sky-950 text-sky-300 border-sky-800/40',
      iconBg: 'bg-sky-700',
      icon: Globe,
      helpTopicId: 'landclaim',
      tag: 'world level seed upload mcworld reset dimension'
    },
    {
      id: 'version',
      title: 'Bedrock Engine Version',
      categoryType: 'settings',
      category: 'Server Engine',
      subtitle: `v${data.activeVersion || '1.21.62.01'} active · Update or switch`,
      badge: `v${data.activeVersion || '1.21.62.01'}`,
      badgeColor: 'bg-red-950 text-red-300 border-red-800/40 font-mono',
      iconBg: 'bg-red-800',
      icon: Download,
      helpTopicId: 'console',
      tag: 'version bedrock update download engine 1.21 update'
    },
    {
      id: 'playit',
      title: 'Playit Public Tunnel',
      categoryType: 'settings',
      category: 'Networking',
      subtitle: isPlayitClaimed ? 'Connected · Friends can join' : 'Claim link ready to activate',
      badge: isPlayitClaimed ? 'Active Tunnel' : 'Needs Claim',
      badgeColor: isPlayitClaimed ? 'bg-red-950 text-red-300 border-red-800/40' : 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse',
      iconBg: 'bg-red-600',
      icon: Radio,
      helpTopicId: 'console',
      tag: 'playit tunnel port ip public claim domain connection'
    },
    {
      id: 'properties',
      title: 'Server Settings & Config',
      categoryType: 'settings',
      category: 'Configuration',
      subtitle: 'Gamemode, difficulty, max players, port, cheats & motd',
      badge: 'server.properties',
      badgeColor: 'bg-zinc-900 text-slate-300 border-zinc-800',
      iconBg: 'bg-zinc-700',
      icon: Sliders,
      helpTopicId: 'chestlock',
      tag: 'properties config port max-players view-distance cheats settings options'
    },
    {
      id: 'files',
      title: 'Server File Manager',
      categoryType: 'storage',
      category: 'File Browser',
      subtitle: 'Browse worlds, offline folders, edit properties & upload archives',
      badge: 'File Manager',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800/40 font-bold',
      iconBg: 'bg-amber-700',
      icon: Folder,
      helpTopicId: 'console',
      tag: 'files file manager worlds folders configs offline explorer upload download text editor code'
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
  }, [categoryFilter, searchQuery, gridOptions]);

  return (
    <div className="space-y-3.5 text-slate-100">
      {/* Quick Action Toast */}
      {quickToast && (
        <div className="fixed top-16 right-4 z-50 p-3 bg-red-950/90 border border-red-500/50 rounded-xl text-xs font-semibold text-white shadow-xl shadow-red-950/40 flex items-center gap-2 animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-red-400 shrink-0" />
          <span>{quickToast}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP GLOBAL SEARCH BAR & PROMINENT QUESTION MARK (?) GUIDE */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commands, land claims, plugins, rules, players..."
            className="w-full bg-[#121118] border border-red-950/50 focus:border-red-500/60 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-slate-500 font-medium shadow-lg focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white font-bold p-0.5"
            >
              ✕
            </button>
          )}
        </div>

        {/* Global Help Guide Button with (?) */}
        <button
          type="button"
          onClick={() => openHelp('landclaim')}
          className="px-3 py-2.5 bg-red-950/70 hover:bg-red-900/80 text-red-300 hover:text-white border border-red-800/50 rounded-2xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-md shadow-red-950/40 active:scale-95 shrink-0"
          title="गाइड और मदद: इसका क्या उपयोग है और कैसे use करें?"
        >
          <HelpCircle className="w-4 h-4 text-red-400" />
          <span className="hidden sm:inline">❓ Help Guide</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SERVER STATUS CARD IN DARK + RED THEME */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#121118] border border-red-950/50 rounded-2xl p-3.5 sm:p-4 shadow-xl space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header: Server Name, Minecraft Version, Status */}
        <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-zinc-800/80 relative z-10">
          <div className="min-w-0 pr-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-white leading-tight truncate">
                {data.serverName || 'Kira Bedrock Server'}
              </span>
              <button
                type="button"
                onClick={() => onNavigate('version')}
                title="Change or Update Bedrock Version"
                className="text-[10px] font-mono font-bold bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-800/40 px-1.5 py-0.5 rounded-md transition-colors"
              >
                v{data.activeVersion || '1.21.62.01'}
              </button>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <span>Bedrock Engine</span>
              <span className="text-zinc-600">·</span>
              <span>Land Claim Active</span>
              <span className="text-zinc-600">·</span>
              <span className="text-red-400 font-semibold">100% Anti-Theft</span>
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
              isOnline
                ? 'bg-red-950/70 text-red-300 border-red-800/50'
                : isStarting || isStopping
                ? 'bg-amber-950/70 text-amber-300 border-amber-800/50'
                : 'bg-zinc-900 text-slate-400 border-zinc-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline
                  ? 'bg-red-500 animate-pulse'
                  : isStarting || isStopping
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-zinc-600'
              }`}
            />
            <span className="capitalize text-[11px]">{data.status}</span>
          </div>
        </div>

        {/* IP Address & Bedrock Port Copy Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 relative z-10">
          {/* Host/IP */}
          <div className="bg-[#0a0a0f] border border-red-950/30 rounded-xl p-2.5 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Server IP Address
              </span>
              <span className="text-xs font-mono font-bold text-white truncate block mt-0.5">
                {displayHost}
              </span>
            </div>
            <button
              type="button"
              onClick={copyConnection}
              className="p-1.5 bg-[#181622] hover:bg-[#221f30] border border-zinc-800 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors shrink-0 active:scale-95"
            >
              {copiedAddress ? (
                <>
                  <Check className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-400 text-[10px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px]">Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Port */}
          <div className="bg-[#0a0a0f] border border-red-950/30 rounded-xl p-2.5 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Bedrock Port (UDP)
              </span>
              <span className="text-xs font-mono font-bold text-white truncate block mt-0.5">
                {displayPort}
              </span>
            </div>
            <button
              type="button"
              onClick={copyPortOnly}
              className="p-1.5 bg-[#181622] hover:bg-[#221f30] border border-zinc-800 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors shrink-0 active:scale-95"
            >
              {copiedPort ? (
                <>
                  <Check className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-400 text-[10px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px]">Copy Port</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Desync Warning Alert */}
        {data.isDesynced && (
          <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-start gap-2 text-xs text-amber-200 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">⚠️ Process Sync Detached (Server Active in Game!)</p>
                <p className="text-[11px] font-normal text-amber-300/80">
                  Bedrock server is running in Minecraft PE, but web handle is detached. Click <b>Fix & Sync Controls</b>!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onServerAction('fix-sync')}
              disabled={loading}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Fix & Sync</span>
            </button>
          </div>
        )}

        {/* Server Start, Stop, Restart Buttons */}
        <div className="flex items-center gap-2 pt-0.5 relative z-10">
          {!isOnline && !isStarting ? (
            <>
              <button
                type="button"
                onClick={() => onServerAction('start')}
                disabled={loading || isStopping}
                className="flex-1 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition-all text-xs sm:text-sm disabled:opacity-50 min-h-[46px]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{loading ? 'Starting Bedrock...' : 'Start Server'}</span>
              </button>

              <button
                type="button"
                onClick={() => onServerAction('fix-sync')}
                disabled={loading}
                title="Fix & Resync Process"
                className="px-3 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 active:scale-95 text-amber-400 rounded-xl font-bold transition-all min-h-[46px] flex items-center justify-center gap-1.5 text-xs shadow-md"
              >
                <RotateCw className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Fix & Resync</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onServerAction('stop')}
                disabled={loading || isStopping}
                className="flex-1 bg-rose-700 hover:bg-rose-600 active:scale-[0.98] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-950/60 transition-all text-xs sm:text-sm disabled:opacity-50 min-h-[46px]"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>{isStopping ? 'Stopping Server...' : 'Stop Server'}</span>
              </button>

              <button
                type="button"
                onClick={() => onServerAction('restart')}
                disabled={loading || isStopping}
                title="Restart Server Process"
                className="p-3 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-slate-300 rounded-xl font-bold transition-all min-h-[46px] min-w-[46px] flex items-center justify-center border border-zinc-800"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onServerAction('fix-sync')}
                disabled={loading}
                title="Force Resync Process"
                className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 active:scale-95 text-amber-400 rounded-xl font-bold transition-all min-h-[46px] min-w-[46px] flex items-center justify-center"
              >
                <RotateCw className="w-4 h-4 text-amber-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. 1-CLICK QUICK CONTROLS BAR (DARK + RED THEME) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#121118] border border-red-950/40 rounded-2xl p-2.5 sm:p-3 shadow-lg space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-red-500" />
            <span>1-Click Quick Server Controls</span>
          </span>
          <span className="text-[10px] text-red-400 font-mono">Instant Apply</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {/* Land Claim Hub */}
          <button
            type="button"
            onClick={() => onNavigate('landclaim')}
            className="px-2.5 py-1.5 bg-red-950/70 hover:bg-red-900/80 border border-red-800/50 text-red-300 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-md shadow-red-950/30"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
            <span>🛡️ Land Claims</span>
          </button>

          {/* Plugin Store */}
          <button
            type="button"
            onClick={() => onNavigate('pluginstore')}
            className="px-2.5 py-1.5 bg-red-950/70 hover:bg-red-900/80 border border-red-800/50 text-red-300 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all shadow-md shadow-red-950/30"
          >
            <Package className="w-3.5 h-3.5 text-red-400" />
            <span>📦 Plugin Store</span>
          </button>

          {/* Day */}
          <button
            type="button"
            onClick={() => handleQuickCommand('time set day', '☀️ Time changed to Day!')}
            className="px-2.5 py-1.5 bg-[#181622] hover:bg-[#221f30] border border-zinc-800 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Day</span>
          </button>

          {/* Night */}
          <button
            type="button"
            onClick={() => handleQuickCommand('time set night', '🌙 Time changed to Night!')}
            className="px-2.5 py-1.5 bg-[#181622] hover:bg-[#221f30] border border-zinc-800 text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Night</span>
          </button>

          {/* Clear Weather */}
          <button
            type="button"
            onClick={() => handleQuickCommand('weather clear', '🌤️ Weather cleared!')}
            className="px-2.5 py-1.5 bg-[#181622] hover:bg-[#221f30] border border-zinc-800 text-sky-300 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all"
          >
            <CloudRain className="w-3.5 h-3.5 text-sky-400" />
            <span>Clear Weather</span>
          </button>

          {/* Coordinates ON */}
          <button
            type="button"
            onClick={() => handleQuickCommand('gamerule showcoordinates true', '📍 Show Coordinates turned ON!')}
            className="px-2.5 py-1.5 bg-[#181622] hover:bg-[#221f30] border border-zinc-800 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Coords ON</span>
          </button>

          {/* Keep Inventory */}
          <button
            type="button"
            onClick={() => handleQuickCommand('gamerule keepinventory true', '🛡️ Keep Inventory turned ON!')}
            className="px-2.5 py-1.5 bg-[#181622] hover:bg-[#221f30] border border-zinc-800 text-purple-300 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>KeepInv ON</span>
          </button>

          {/* Kill Hostile Mobs */}
          <button
            type="button"
            onClick={() => handleQuickCommand('kill @e[type=!player]', '💀 Hostile mobs cleared!')}
            className="px-2.5 py-1.5 bg-[#181622] hover:bg-[#221f30] border border-zinc-800 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all"
          >
            <Skull className="w-3.5 h-3.5 text-rose-400" />
            <span>Kill Mobs</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. CATEGORY FILTER TABS FOR QUICK NAVIGATION */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 px-0.5">
        {[
          { id: 'all', label: 'All Features' },
          { id: 'security', label: '🛡️ Land & Security' },
          { id: 'commands', label: '⚡ Commands' },
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
                ? 'bg-red-600 text-white shadow-md shadow-red-950 font-bold'
                : 'bg-[#121118] text-slate-400 border border-zinc-800 hover:text-white hover:border-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. 2-COLUMN BALANCED GRIDVIEW WITH QUESTION MARK (?) BUTTONS */}
      {/* ------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>Server Features & Tools</span>
          </h3>
          <span className="text-[11px] font-semibold text-red-400 font-mono">
            {filteredOptions.length} Categories
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {filteredOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <div
                key={opt.id}
                onClick={() => onNavigate(opt.id)}
                className="bg-[#121118] border border-red-950/40 hover:border-red-600/50 rounded-2xl p-3 sm:p-3.5 shadow-md hover:shadow-xl hover:shadow-red-950/20 active:scale-[0.98] transition-all flex flex-col justify-between text-left min-h-[125px] sm:min-h-[135px] relative overflow-hidden group cursor-pointer"
              >
                {/* Top Row: Icon Container + Badge + Dedicated Question Mark (?) Button */}
                <div className="flex items-start justify-between w-full gap-1">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${opt.iconBg} text-white flex items-center justify-center shadow-md shadow-red-950/50 group-hover:scale-105 transition-transform shrink-0`}
                  >
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${opt.badgeColor} max-w-[80px] truncate`}
                    >
                      {opt.badge}
                    </span>

                    {/* DEDICATED QUESTION MARK (?) ON THIS FEATURE CARD */}
                    <button
                      type="button"
                      onClick={(e) => openHelp(opt.helpTopicId || 'landclaim', e)}
                      title="इसका क्या उपयोग है और कैसे use करें?"
                      className="p-1 rounded-md bg-zinc-900/90 hover:bg-red-900/80 text-slate-400 hover:text-white border border-zinc-800 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Category Eyebrow, Title & Subtitle */}
                <div className="mt-2 min-w-0 w-full">
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-500 block truncate">
                    {opt.category}
                  </span>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-[13px] font-bold text-white group-hover:text-red-400 transition-colors truncate">
                      {opt.title}
                    </h4>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-0.5" />
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 leading-tight">
                    {opt.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Question Mark Help Modal */}
      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        initialTopicId={selectedHelpTopic}
      />
    </div>
  );
};

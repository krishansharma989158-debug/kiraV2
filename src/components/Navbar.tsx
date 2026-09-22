import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, Terminal, ChevronDown } from 'lucide-react';
import { ServerData } from '../types';

interface NavbarProps {
  serverData: ServerData | null;
  onRefresh: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  logCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  serverData,
  onRefresh,
  activeTab,
  setActiveTab,
  logCount = 0
}) => {
  const status = serverData?.status || 'offline';
  const isHome = activeTab === 'dashboard' || activeTab === 'server';
  const onlinePlayers = serverData?.players || [];
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);

  // Map subpage titles
  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    mastercommands: { title: '55 Master Commands Hub', subtitle: 'Farms, Spy, Freeze, Roles & Diagnostics' },
    security: { title: 'Security & Anti-Cheat Hub', subtitle: 'Anti-Xray, Auto-Ban Hacks, Anti-Dupe, Operator OP' },
    players: { title: 'Players & Roles Manager', subtitle: 'Visitor/Member/OP roles, give items & teleport' },
    backups: { title: 'Auto-Backup & Storage', subtitle: 'Loop timer, retention quota & restore ZIP' },
    chunkloaders: { title: '24/7 Farm Chunk Loaders', subtitle: 'Ticking areas for 24/7 automation' },
    gamerules: { title: 'Game Rules & 50+ Settings', subtitle: 'Coordinates, keep inventory, creeper grief, PvP' },
    version: { title: 'Bedrock Version Manager', subtitle: 'Update, select or manually type version' },
    console: { title: 'Live Console & Logs', subtitle: 'Bedrock log stream & commands' },
    playit: { title: 'Playit Public Tunnel', subtitle: 'Public Bedrock address & claim' },
    worlds: { title: 'World Manager & Seeds', subtitle: 'World stats, seed generator & upload' },
    properties: { title: 'Server Settings & Config', subtitle: 'Gamemode, difficulty, max players, port, cheats' },
    desktop: { title: 'Ubuntu GUI Desktop', subtitle: 'noVNC web display (Port 6080)' },
    files: { title: 'Server File Manager', subtitle: 'Manage worlds, offline game folders & configs' },
    filemanager: { title: 'Server File Manager', subtitle: 'Manage worlds, offline game folders & configs' },
    deploy: { title: 'Railway Deployment', subtitle: 'Cloud container setup guide' }
  };

  const currentPage = pageTitles[activeTab];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 py-2 sm:px-4 sm:py-2.5 shadow-2xs">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
        {isHome ? (
          <>
            {/* 1. TOP-LEFT: PANEL NAME */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                ⛏️
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-1">
                  <span className="truncate max-w-[130px] sm:max-w-none">{serverData?.serverName || 'Kira MCPE Panel'}</span>
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded">
                    PE
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">Bedrock Dedicated</p>
              </div>
            </div>

            {/* 2. RIGHT OF PANEL NAME: ACTIVE PLAYER LIST & NAME */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (onlinePlayers.length > 0) {
                    setShowPlayerDropdown(!showPlayerDropdown);
                  } else {
                    setActiveTab('players');
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 flex items-center gap-1.5 text-xs transition-colors active:scale-95"
                title="Active Players List"
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    onlinePlayers.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span className="font-bold text-slate-800 text-[11px] whitespace-nowrap">
                  {onlinePlayers.length > 0
                    ? `${onlinePlayers.length} Active`
                    : '0 Players'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {/* Active Players Dropdown Popover */}
              {showPlayerDropdown && onlinePlayers.length > 0 && (
                <div className="absolute top-full mt-1.5 left-0 z-40 bg-white border border-slate-200 rounded-xl p-2 shadow-lg min-w-[180px] space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-0.5 uppercase tracking-wider">
                    Online Players ({onlinePlayers.length})
                  </div>
                  {onlinePlayers.map(p => (
                    <div
                      key={p.xuid || p.name}
                      onClick={() => {
                        setShowPlayerDropdown(false);
                        setActiveTab('players');
                      }}
                      className="px-2 py-1.5 hover:bg-slate-50 rounded-lg flex items-center justify-between text-xs cursor-pointer"
                    >
                      <span className="font-semibold text-slate-800 truncate mr-2">{p.name}</span>
                      <span className="text-[10px] font-mono text-emerald-600 shrink-0">{p.ping || 24}ms</span>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlayerDropdown(false);
                      setActiveTab('players');
                    }}
                    className="w-full text-left text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg border-t border-slate-100 mt-1"
                  >
                    Manage Roles & Give Items →
                  </button>
                </div>
              )}
            </div>

            {/* 3. RIGHT OF PLAYERS: LOGS OPTION & REFRESH */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('console')}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs active:scale-95"
                title="View Server Logs & Console"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Logs</span>
                {logCount > 0 && (
                  <span className="text-[9px] bg-indigo-200/80 text-indigo-900 px-1 rounded-full font-mono">
                    {logCount > 99 ? '99+' : logCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onRefresh}
                title="Refresh Status"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          /* SUBPAGE HEADER WITH PROMINENT MOBILE BACK BUTTON TO DASHBOARD */
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="p-1.5 -ml-1 text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-all flex items-center gap-1 font-bold text-xs shrink-0 active:scale-95"
                title="Back to Home Dashboard"
              >
                <ArrowLeft className="w-4 h-4 text-slate-800" />
                <span className="hidden sm:inline">Home</span>
              </button>
              <div className="border-l border-slate-200 pl-2 min-w-0">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
                  {currentPage?.title || 'Control View'}
                </h2>
                <p className="text-[10px] text-slate-500 truncate hidden xs:block">
                  {currentPage?.subtitle || 'Bedrock Server Panel'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  status === 'online'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span className="capitalize">{status}</span>
              </div>
              <button
                type="button"
                onClick={onRefresh}
                title="Refresh"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

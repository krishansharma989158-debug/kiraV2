import React, { useState } from 'react';
import {
  Play,
  Square,
  RotateCw,
  Copy,
  Check,
  Users,
  Cpu,
  HardDrive,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { ServerData } from '../types';

interface ServerViewProps {
  serverData: ServerData | null;
  onAction: (action: 'start' | 'stop' | 'restart' | 'kill') => void;
  onNavigateToTunnel: () => void;
  loading: boolean;
}

export const ServerView: React.FC<ServerViewProps> = ({
  serverData,
  onAction,
  onNavigateToTunnel,
  loading
}) => {
  const [copiedIp, setCopiedIp] = useState(false);
  const [copiedPort, setCopiedPort] = useState(false);

  if (!serverData) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm">
        Loading server information...
      </div>
    );
  }

  const isOnline = serverData.status === 'online';
  const isStarting = serverData.status === 'starting';
  const isStopping = serverData.status === 'stopping';

  const connectionAddress =
    serverData.playit.claimStatus === 'claimed'
      ? serverData.playit.tunnelAddress
      : 'playit.gg claim pending';

  const connectionPort =
    serverData.playit.claimStatus === 'claimed'
      ? serverData.playit.tunnelPort
      : serverData.bedrockPort;

  const copyToClipboard = (text: string, type: 'ip' | 'port') => {
    navigator.clipboard.writeText(text);
    if (type === 'ip') {
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 2000);
    } else {
      setCopiedPort(true);
      setTimeout(() => setCopiedPort(false), 2000);
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-3.5 pb-6">
      {/* Playit Tunnel Notice if unclaimed */}
      {serverData.playit.claimStatus === 'waiting_claim' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 shadow-xs">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-amber-900">
              Playit Tunnel Link Ready to Claim!
            </h4>
            <p className="text-[11px] text-amber-700 mt-0.5 leading-snug">
              Tunnel claim link generate ho chuka hai. Tunnel tab me jaakar claim link open karein aur Done par click karein.
            </p>
          </div>
          <button
            onClick={onNavigateToTunnel}
            className="text-xs font-semibold bg-amber-600 text-white px-2.5 py-1 rounded-lg shrink-0 hover:bg-amber-700 transition-colors"
          >
            Claim Link
          </button>
        </div>
      )}

      {/* Main Server Status Card (Aternos Style) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
              Minecraft Bedrock Edition
            </span>
            <h2 className="text-base font-bold text-slate-900 leading-snug">
              {serverData.serverName}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
              v{serverData.activeVersion || '1.21.62.01'}
            </span>
          </div>
        </div>

        {/* Start / Stop Action Buttons */}
        <div className="py-4 flex items-center gap-2">
          {!isOnline && !isStarting ? (
            <button
              onClick={() => onAction('start')}
              disabled={loading || isStopping}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all text-sm disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Server</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => onAction('stop')}
                disabled={loading || isStarting || isStopping}
                className="flex-1 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all text-sm disabled:opacity-50"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Stop</span>
              </button>

              <button
                onClick={() => onAction('restart')}
                disabled={loading || isStarting || isStopping}
                className="bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-sm disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Restart</span>
              </button>
            </>
          )}

          {isOnline && (
            <button
              onClick={() => {
                if (confirm('Force kill the server process immediately?')) {
                  onAction('kill');
                }
              }}
              title="Force Kill Server"
              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bedrock Address & Port (Ready for Minecraft PE Add Server) */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Server IP / Address:</span>
            <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-900">
              <span>{connectionAddress}</span>
              <button
                onClick={() => copyToClipboard(connectionAddress, 'ip')}
                title="Copy Address"
                className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
              >
                {copiedIp ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
            <span className="text-slate-500 font-medium">Bedrock Port:</span>
            <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-900">
              <span>{connectionPort}</span>
              <button
                onClick={() => copyToClipboard(connectionPort.toString(), 'port')}
                title="Copy Port"
                className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
              >
                {copiedPort ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Metrics Grid (Mobile Optimized) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* RAM Usage */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
              RAM Usage
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-700">
              {serverData.ramUsageMb} MB
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  (serverData.ramUsageMb / serverData.maxRamMb) * 100
                )}%`
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Allocated: {serverData.maxRamMb} MB
          </p>
        </div>

        {/* CPU Usage */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-500" />
              CPU Load
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-700">
              {serverData.cpuPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, serverData.cpuPercent)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            TPS: {serverData.tps.toFixed(1)} / 20.0
          </p>
        </div>
      </div>

      {/* Players Online Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900">
              Players Online ({serverData.players.length}/{serverData.maxPlayers})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Gamemode: <span className="capitalize font-semibold text-slate-700">{serverData.gamemode}</span>
          </span>
        </div>

        {serverData.players.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">
            {isOnline
              ? 'No players online right now. Share the IP & Port with friends!'
              : 'Server is currently offline.'}
          </p>
        ) : (
          <div className="divide-y divide-slate-100 pt-1">
            {serverData.players.map((p) => (
              <div
                key={p.xuid || p.name}
                className="flex items-center justify-between py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">{p.name}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">
                      XUID: {p.xuid.substring(0, 8)}...
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-emerald-600 font-semibold text-[11px]">
                    {p.ping} ms
                  </span>
                  <span className="block text-[10px] text-slate-400">{p.joinedAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Summary Info Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs text-xs space-y-2">
        <h4 className="font-bold text-slate-900 text-xs">Active World & Details</h4>
        <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
          <div>
            <span className="text-slate-400 block">World Name:</span>
            <span className="font-semibold text-slate-800">
              {serverData.currentWorld.name}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Difficulty:</span>
            <span className="font-semibold text-slate-800 capitalize">
              {serverData.difficulty}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Uptime:</span>
            <span className="font-semibold text-slate-800">
              {isOnline ? formatUptime(serverData.uptimeSeconds) : '0m'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Cheats:</span>
            <span className="font-semibold text-slate-800">
              {serverData.allowCheats ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

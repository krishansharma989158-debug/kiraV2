import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Send,
  Trash2,
  Search,
  CheckCircle,
  AlertTriangle,
  Flame,
  CornerDownLeft,
  RotateCw
} from 'lucide-react';
import { LogEntry } from '../types';

interface ConsoleViewProps {
  logs: LogEntry[];
  onSendCommand: (command: string) => Promise<string | void>;
  onClearLogs: () => Promise<void>;
  isOnline: boolean;
  isDesynced?: boolean;
  onFixSync?: () => void;
}

export const ConsoleView: React.FC<ConsoleViewProps> = ({
  logs,
  onSendCommand,
  onClearLogs,
  isOnline,
  isDesynced,
  onFixSync
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [filterText, setFilterText] = useState('');
  const [sending, setSending] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const quickCommands = [
    { label: '/list', cmd: '/list' },
    { label: 'Time Day', cmd: '/time set day' },
    { label: 'Clear Weather', cmd: '/weather clear' },
    { label: 'Creative', cmd: '/gamemode creative' },
    { label: 'Survival', cmd: '/gamemode survival' },
    { label: '/help', cmd: '/help' },
    { label: '/say Broadcast', cmd: '/say Welcome to Bedrock Server!' },
    { label: '/me Action', cmd: '/me welcomes all players to the server' },
    { label: '⚡ Fix Lag', cmd: '/fixlag' },
    { label: '🔄 Fix Chunks', cmd: '/fixchunks ALL' },
    { label: '🐴 Fix Mobs', cmd: '/fixmobs' },
    { label: '📢 Lag Warn', cmd: '/lagwarn Server lag detected! Optimizing chunks.' }
  ];

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || sending) return;

    setSending(true);
    await onSendCommand(commandInput.trim());
    setCommandInput('');
    setSending(false);
  };

  const handleQuickCommand = async (cmd: string) => {
    setSending(true);
    await onSendCommand(cmd);
    setSending(false);
  };

  const filteredLogs = logs.filter((log) => {
    if (!filterText) return true;
    return (
      log.message.toLowerCase().includes(filterText.toLowerCase()) ||
      log.level.toLowerCase().includes(filterText.toLowerCase())
    );
  });

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {/* Console Controls Card */}
      <div className="bg-[#121118] border border-red-950/50 rounded-2xl p-3 shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-red-500" />
            <h2 className="text-xs font-bold text-white tracking-tight">
              Live Bedrock Console
            </h2>
            <span className="text-[10px] bg-red-950/70 text-red-300 border border-red-800/40 px-1.5 py-0.5 rounded font-mono">
              {logs.length} logs
            </span>
          </div>

          <button
            onClick={onClearLogs}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-950/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Filter search bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search console logs..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#0a0a0f] border border-zinc-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500/80 focus:ring-1 focus:ring-red-500/40"
          />
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-[#09090b] border border-red-950/60 rounded-2xl p-3 shadow-xl">
        <div
          ref={logContainerRef}
          className="h-80 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 select-text scrollbar-thin scrollbar-thumb-zinc-800"
        >
          {filteredLogs.length === 0 ? (
            <p className="text-slate-500 italic text-center py-10">
              No logs matching filter.
            </p>
          ) : (
            filteredLogs.map((log) => {
              let levelColor = 'text-red-400';
              if (log.level === 'WARN') levelColor = 'text-amber-400';
              if (log.level === 'ERROR') levelColor = 'text-rose-400 font-bold';
              if (log.level === 'COMMAND') levelColor = 'text-red-300 font-bold';

              return (
                <div key={log.id} className="flex items-start gap-1.5 break-all">
                  <span className="text-slate-500 select-none text-[10px]">
                    [{log.timestamp}]
                  </span>
                  <span className={`select-none font-bold text-[10px] ${levelColor}`}>
                    [{log.level}]
                  </span>
                  <span className="text-slate-200 flex-1">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Desync Warning Banner */}
      {isDesynced && (
        <div className="p-2.5 bg-amber-950/40 border border-amber-800/50 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-200 shadow-md">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Minecraft is active in-game, but stdin console handle is detached.</span>
          </div>
          {onFixSync && (
            <button
              type="button"
              onClick={onFixSync}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs rounded-lg transition-all shrink-0 flex items-center gap-1 shadow-md"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Fix & Sync Controls</span>
            </button>
          )}
        </div>
      )}

      {/* Quick Command Chips */}
      <div className="overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
            Quick:
          </span>
          {quickCommands.map((qc) => (
            <button
              key={qc.cmd}
              onClick={() => handleQuickCommand(qc.cmd)}
              disabled={(!isOnline && !isDesynced) || sending}
              className="text-[11px] font-mono font-medium bg-[#14131d] hover:bg-red-950/60 hover:text-red-300 hover:border-red-800/50 active:scale-95 text-slate-300 border border-zinc-800 px-2 py-1 rounded-lg transition-all disabled:opacity-40"
            >
              {qc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Command Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            disabled={(!isOnline && !isDesynced) || sending}
            placeholder={
              isOnline || isDesynced
                ? 'Type Bedrock command (e.g. /time set day, /gamemode creative)...'
                : 'Server is offline. Start server to execute commands.'
            }
            className="w-full bg-[#121118] border border-zinc-800 focus:border-red-600 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-600 disabled:bg-[#0a0a0f] disabled:text-slate-600"
          />
        </div>

        {(!isOnline && !isDesynced && onFixSync) && (
          <button
            type="button"
            onClick={onFixSync}
            title="Fix & Sync Process"
            className="px-2.5 py-2 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 active:scale-95 text-amber-300 text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-1"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Fix Sync</span>
          </button>
        )}

        <button
          type="submit"
          disabled={(!isOnline && !isDesynced) || !commandInput.trim() || sending}
          className="bg-red-600 hover:bg-red-500 active:scale-95 text-white p-2.5 rounded-xl transition-all disabled:opacity-40 shrink-0 shadow-lg shadow-red-950/50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

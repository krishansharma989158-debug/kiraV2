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
    <div className="space-y-3 pb-24 max-w-2xl mx-auto">
      {/* Console Controls Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900">
              Live Bedrock Console
            </h2>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
              {logs.length} logs
            </span>
          </div>

          <button
            onClick={onClearLogs}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 px-2 py-1 rounded-md hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Filter search bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search console logs..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
        <div
          ref={logContainerRef}
          className="h-80 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 select-text scrollbar-thin scrollbar-thumb-slate-700"
        >
          {filteredLogs.length === 0 ? (
            <p className="text-slate-500 italic text-center py-10">
              No logs matching filter.
            </p>
          ) : (
            filteredLogs.map((log) => {
              let levelColor = 'text-emerald-400';
              if (log.level === 'WARN') levelColor = 'text-amber-400';
              if (log.level === 'ERROR') levelColor = 'text-rose-400';
              if (log.level === 'COMMAND') levelColor = 'text-sky-400 font-bold';

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
        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Minecraft is active in-game, but stdin console handle is detached.</span>
          </div>
          {onFixSync && (
            <button
              type="button"
              onClick={onFixSync}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-lg transition-all shrink-0 flex items-center gap-1 shadow-2xs"
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
              className="text-[11px] font-mono font-medium bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 active:scale-95 text-slate-700 border border-slate-200 px-2 py-1 rounded-lg transition-all disabled:opacity-40"
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
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-100 disabled:text-slate-400"
          />
        </div>

        {(!isOnline && !isDesynced && onFixSync) && (
          <button
            type="button"
            onClick={onFixSync}
            title="Fix & Sync Process"
            className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 active:scale-95 text-amber-800 text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-1"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Fix Sync</span>
          </button>
        )}

        <button
          type="submit"
          disabled={(!isOnline && !isDesynced) || !commandInput.trim() || sending}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white p-2 rounded-xl transition-all disabled:opacity-40 shrink-0 shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

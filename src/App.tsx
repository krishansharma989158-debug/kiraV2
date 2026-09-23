import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DashboardGrid } from './components/DashboardGrid';
import { ConsoleView } from './components/ConsoleView';
import { PlayitTunnelView } from './components/PlayitTunnelView';
import { WorldsView } from './components/WorldsView';
import { DesktopView } from './components/DesktopView';
import { RailwayDeployView } from './components/RailwayDeployView';
import { PropertiesView } from './components/PropertiesView';
import { VersionView } from './components/VersionView';
import { AutoBackupView } from './components/AutoBackupView';
import { ChunkLoadersView } from './components/ChunkLoadersView';
import { GameRulesView } from './components/GameRulesView';
import { PlayerManagerView } from './components/PlayerManagerView';
import { SecurityHubView } from './components/SecurityHubView';
import { MasterCommandsView } from './components/MasterCommandsView';
import { FileManagerView } from './components/FileManagerView';
import { ServerData, LogEntry } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

const DEFAULT_SERVER_DATA: ServerData = {
  status: 'offline',
  serverName: 'Kira Bedrock Server',
  version: '1.21.62.01 Bedrock Dedicated Server',
  activeVersion: '1.21.62.01',
  availableVersions: [
    '1.21.62.01',
    '1.21.61.01',
    '1.21.60.10',
    '1.21.51.02',
    '1.21.50.07',
    '1.21.44.01',
    '1.21.43.01',
    '1.21.30.03'
  ],
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
  onlineMode: false,
  whitelistEnabled: false,
  texturePackRequired: true,
  viewDistance: 10,
  tickDistance: 4,
  playerIdleTimeout: 15,
  currentWorld: {
    name: 'BedrockLevel',
    seed: '73921849182',
    sizeMb: 5.2,
    lastSaved: 'Just now',
    dimensionCount: 3
  },
  playit: {
    claimStatus: 'claimed',
    claimCode: 'mcpe-kira',
    claimUrl: 'https://playit.gg/claim',
    tunnelAddress: 'kira-pe.playit.gg',
    tunnelPort: 19132,
    protocol: 'UDP',
    pingMs: 28,
    lastUpdated: 'Just now'
  },
  desktopUrl: '/desktop',
  railwayDomain: 'railway.app'
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [serverData, setServerData] = useState<ServerData>(DEFAULT_SERVER_DATA);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch status and logs from real backend
  const fetchStatus = useCallback(async () => {
    try {
      const [resStatus, resLogs] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/logs')
      ]);

      if (resStatus.ok) {
        const data = await resStatus.json();
        setServerData(data);
        setFetchError(null);
      }

      if (resLogs.ok) {
        const dataLogs = await resLogs.json();
        setLogs(dataLogs.logs || []);
      }
    } catch (err: any) {
      console.warn('Could not fetch server status:', err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Server Actions (Start, Stop, Restart, Kill, Fix-Sync)
  const handleServerAction = async (action: 'start' | 'stop' | 'restart' | 'kill' | 'fix-sync') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/server/${action}`, { method: 'POST' });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error(`Failed to ${action} server:`, err);
    } finally {
      setLoading(false);
    }
  };

  // Console Command
  const handleSendCommand = async (command: string) => {
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error('Failed to send command:', err);
    }
  };

  // Clear Logs
  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/logs/clear', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  // Playit Claim Done
  const handleDoneClaim = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/playit/claim/done', { method: 'POST' });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error('Failed to confirm claim:', err);
    } finally {
      setLoading(false);
    }
  };

  // Playit Claim Change (Re-generate fresh token)
  const handleChangeClaim = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/playit/claim/change', { method: 'POST' });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error('Failed to change claim link:', err);
    } finally {
      setLoading(false);
    }
  };

  // World Actions
  const handleGenerateWorld = async (params: any) => {
    try {
      const res = await fetch('/api/worlds/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error('Failed to generate world:', err);
    }
  };

  const handleUploadWorld = async (filename: string) => {
    try {
      const res = await fetch('/api/worlds/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error('Failed to upload world:', err);
    }
  };

  const handleResetWorld = async () => {
    try {
      const res = await fetch('/api/worlds/reset', { method: 'POST' });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error('Failed to reset world:', err);
    }
  };

  // Server Properties Save
  const handleSaveProperties = async (props: any) => {
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(props)
      });
      if (res.ok) {
        await fetchStatus();
      }
    } catch (err) {
      console.error('Failed to save properties:', err);
    }
  };

  const isHome = activeTab === 'dashboard' || activeTab === 'server';

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 font-sans antialiased selection:bg-emerald-200">
      {/* Light Clean Centered Layout - Mobile Optimized */}
      <div className="w-full max-w-2xl bg-slate-50 min-h-screen flex flex-col border-x border-slate-200/90 shadow-sm relative">
        {/* Top Header: Panel Name on Left, Active Players in Middle, Logs on Right */}
        <Navbar
          serverData={serverData}
          onRefresh={fetchStatus}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          logCount={logs.length}
        />

        {/* Tab / Page Content Body with padding for bottom mobile navigation bar */}
        <main className="flex-1 p-3 sm:p-4 pb-24">
          {fetchError && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Syncing with server process...</span>
              </div>
              <button
                onClick={fetchStatus}
                className="p-1 hover:bg-amber-100 rounded text-amber-900 active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 1. HOME DASHBOARD: TOP SEARCH BAR, STATS CARD, 1-CLICK CONTROLS, 2-COLUMN GRID */}
          {isHome && (
            <DashboardGrid
              serverData={serverData}
              logs={logs}
              onNavigate={(tabId) => setActiveTab(tabId)}
              onServerAction={handleServerAction}
              loading={loading}
            />
          )}

          {/* 2. MASTER 55 COMMANDS CONTROL PANEL */}
          {activeTab === 'mastercommands' && <MasterCommandsView />}

          {/* 3. FULL SECURITY & ANTI-CHEAT HUB */}
          {activeTab === 'security' && (
            <SecurityHubView
              onBack={() => setActiveTab('dashboard')}
              onRefreshStatus={fetchStatus}
            />
          )}

          {/* 4. PLAYER ROLES, ITEMS & MODERATION (Single unified view, no duplicate) */}
          {(activeTab === 'players' || activeTab === 'playermanager') && (
            <PlayerManagerView
              onlinePlayers={serverData?.players}
              onBack={() => setActiveTab('dashboard')}
            />
          )}

          {/* 5. 24/7 FARM CHUNK LOADERS (TICKING AREAS) */}
          {activeTab === 'chunkloaders' && <ChunkLoadersView />}

          {/* 6. GAME RULES & 50+ ENVIRONMENT SETTINGS */}
          {activeTab === 'gamerules' && <GameRulesView />}

          {/* 7. AUTO-BACKUP & RETENTION STORAGE MANAGER */}
          {activeTab === 'backups' && (
            <AutoBackupView
              onBack={() => setActiveTab('dashboard')}
              onNavigate={(tabId) => setActiveTab(tabId)}
            />
          )}

          {/* 8. WORLD MANAGER & SEED GENERATOR */}
          {activeTab === 'worlds' && (
            <WorldsView
              serverData={serverData}
              onGenerateWorld={handleGenerateWorld}
              onUploadWorld={handleUploadWorld}
              onResetWorld={handleResetWorld}
              onBack={() => setActiveTab('dashboard')}
              onNavigate={(tabId) => setActiveTab(tabId)}
            />
          )}

          {/* 8B. IN-APP SERVER FILE MANAGER */}
          {(activeTab === 'files' || activeTab === 'filemanager') && (
            <FileManagerView onBack={() => setActiveTab('dashboard')} />
          )}

          {/* 9. BEDROCK VERSION MANAGER */}
          {activeTab === 'version' && (
            <VersionView
              serverData={serverData}
              onRefresh={fetchStatus}
            />
          )}

          {/* 10. PLAYIT.GG PUBLIC TUNNEL */}
          {activeTab === 'playit' && (
            <PlayitTunnelView
              serverData={serverData}
              onDoneClaim={handleDoneClaim}
              onChangeClaim={handleChangeClaim}
              loading={loading}
            />
          )}

          {/* 11. SERVER SETTINGS & PROPERTIES (Unified single view, replaces duplicate OptionsView) */}
          {(activeTab === 'properties' || activeTab === 'options') && (
            <PropertiesView
              serverData={serverData}
              onSaveProperties={handleSaveProperties}
              onNavigate={(tabId) => setActiveTab(tabId)}
            />
          )}

          {/* 12. LIVE CONSOLE & LOGS */}
          {activeTab === 'console' && (
            <ConsoleView
              logs={logs}
              onSendCommand={handleSendCommand}
              onClearLogs={handleClearLogs}
              isOnline={serverData?.status === 'online'}
              isDesynced={serverData?.isDesynced}
              onFixSync={() => handleServerAction('fix-sync')}
            />
          )}

          {/* 13. UBUNTU GUI WEB DESKTOP */}
          {activeTab === 'desktop' && (
            <DesktopView
              desktopUrl={serverData?.desktopUrl}
              isOnline={serverData?.status === 'online'}
            />
          )}

          {/* 14. RAILWAY CLOUD DEPLOYMENT */}
          {activeTab === 'deploy' && <RailwayDeployView />}
        </main>

        {/* Fixed Mobile Bottom Navigation Bar (Home, 55 Cmds, Players, Console, Settings) */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onlinePlayerCount={serverData?.players?.length || 0}
          playitClaimStatus={serverData?.playit?.claimStatus}
        />
      </div>
    </div>
  );
}

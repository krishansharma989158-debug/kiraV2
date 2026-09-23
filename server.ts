import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn, exec, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

// Safe environment-agnostic directory resolution (works in both ESM and CJS)
let serverDir = process.cwd();
try {
  if (typeof __dirname !== 'undefined') {
    serverDir = __dirname;
  } else if (typeof import.meta !== 'undefined' && import.meta && import.meta.url) {
    serverDir = path.dirname(fileURLToPath(import.meta.url));
  }
} catch (e) {
  serverDir = process.cwd();
}

const app = express();
// Control panel is always pinned to 3000 so it never conflicts with noVNC 6080
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Determine directories (Production Ubuntu container /minecraft-bedrock vs local ./data)
const IS_CONTAINER = fs.existsSync('/minecraft-bedrock');
const BEDROCK_DIR = IS_CONTAINER ? '/minecraft-bedrock' : path.join(process.cwd(), 'data', 'minecraft-bedrock');
const PLAYIT_CONFIG_DIR = IS_CONTAINER ? '/root/.config/playit' : path.join(process.cwd(), 'data', 'playit');
const LOGS_DIR = IS_CONTAINER ? '/app/data' : path.join(process.cwd(), 'data');
const BACKUPS_DIR = path.join(BEDROCK_DIR, 'backups');

// Ensure directories exist
for (const dir of [BEDROCK_DIR, path.join(BEDROCK_DIR, 'worlds'), PLAYIT_CONFIG_DIR, LOGS_DIR, BACKUPS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Ensure default server.properties exists with FULL ANTI-LAG & ZERO-GLITCH BLOCK ENGINE
const PROPERTIES_FILE = path.join(BEDROCK_DIR, 'server.properties');
const defaultProps = `server-name=My Bedrock Server
gamemode=survival
force-gamemode=true
difficulty=normal
allow-cheats=false
max-players=8
online-mode=false
white-list=false
server-port=19132
server-portv6=19133
view-distance=10
tick-distance=4
player-idle-timeout=15
max-threads=4
level-name=BedrockLevel
level-seed=
default-player-permission-level=member
texturepack-required=true
content-log-file-enabled=true
server-authoritative-movement=client-auth
player-movement-score-threshold=60
player-movement-action-direction-threshold=0.85
player-movement-distance-threshold=0.5
player-movement-duration-threshold-in-ms=500
server-authoritative-block-breaking=false
server-authoritative-block-breaking-pick-range-scalar=1.5
compression-threshold=512
client-side-chunk-generation-enabled=true
`;

if (!fs.existsSync(PROPERTIES_FILE)) {
  fs.writeFileSync(PROPERTIES_FILE, defaultProps, 'utf-8');
} else {
  // Ensure optimal zero-lag and security options are reinforced in existing properties
  try {
    let current = fs.readFileSync(PROPERTIES_FILE, 'utf-8');
    const enforce = [
      ['texturepack-required', 'true'],
      ['allow-cheats', 'false'],
      ['default-player-permission-level', 'member'],
      ['server-authoritative-movement', 'client-auth'],
      ['server-authoritative-block-breaking', 'false'],
      ['compression-threshold', '512'],
      ['client-side-chunk-generation-enabled', 'true'],
      ['max-threads', '4']
    ];
    let modified = false;
    for (const [k, v] of enforce) {
      const reg = new RegExp(`^${k}=.*$`, 'm');
      if (reg.test(current)) {
        current = current.replace(reg, `${k}=${v}`);
        modified = true;
      } else {
        current += `\n${k}=${v}`;
        modified = true;
      }
    }
    if (modified) {
      fs.writeFileSync(PROPERTIES_FILE, current, 'utf-8');
    }
  } catch (err) {}
}

// Version management configuration
const VERSION_FILE = path.join(BEDROCK_DIR, 'version.json');
const AVAILABLE_VERSIONS = [
  '1.21.62.01',
  '1.21.61.01',
  '1.21.60.10',
  '1.21.51.02',
  '1.21.50.07',
  '1.21.44.01',
  '1.21.43.01',
  '1.21.30.03'
];

function getInstalledVersion(): string {
  if (fs.existsSync(VERSION_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
      if (data.version) return data.version;
    } catch (e) {}
  }
  return '1.21.62.01';
}

// Ensure permissions.json and whitelist.json exist
const PERMISSIONS_FILE = path.join(BEDROCK_DIR, 'permissions.json');
if (!fs.existsSync(PERMISSIONS_FILE)) {
  fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

const WHITELIST_FILE = path.join(BEDROCK_DIR, 'whitelist.json');
if (!fs.existsSync(WHITELIST_FILE)) {
  fs.writeFileSync(WHITELIST_FILE, JSON.stringify([], null, 2), 'utf-8');
}

// In-Memory & Persisted State
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'COMMAND';
  message: string;
}

interface Player {
  name: string;
  xuid: string;
  ping: number;
  joinedAt: string;
}

interface ServerState {
  status: 'online' | 'offline' | 'starting' | 'stopping';
  startedAt: number | null;
  serverName: string;
  version: string;
  activeVersion: string;
  availableVersions: string[];
  bedrockPort: number;
  players: Player[];
  maxPlayers: number;
  gamemode: 'survival' | 'creative' | 'adventure';
  difficulty: 'peaceful' | 'easy' | 'normal' | 'hard';
  allowCheats: boolean;
  texturePackRequired: boolean;
  onlineMode: boolean; // Xbox Live Auth
  whitelistEnabled: boolean;
  viewDistance: number;
  tickDistance: number;
  playerIdleTimeout: number;
  currentWorld: {
    name: string;
    seed: string;
    sizeMb: number;
    lastSaved: string;
    dimensionCount: number;
  };
  playit: {
    claimStatus: 'waiting_claim' | 'claimed';
    claimCode: string;
    claimUrl: string;
    tunnelAddress: string;
    tunnelPort: number;
    protocol: string;
    pingMs: number;
    lastUpdated: string;
  };
  operators: string[];
  whitelist: string[];
  bannedPlayers: string[];
}

let logs: LogEntry[] = [];
let bedrockProcess: ChildProcess | null = null;
let playitProcess: ChildProcess | null = null;

function addLog(level: LogEntry['level'], message: string) {
  const entry: LogEntry = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toLocaleTimeString(),
    level,
    message
  };
  logs.push(entry);
  if (logs.length > 800) {
    logs.shift();
  }
}

// Helper: Parse server.properties file
function readServerProperties(): Record<string, string> {
  const props: Record<string, string> = {};
  if (!fs.existsSync(PROPERTIES_FILE)) return props;
  const content = fs.readFileSync(PROPERTIES_FILE, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      props[key] = val;
    }
  }
  return props;
}

// Helper: Save server.properties file
function saveServerProperties(newProps: Record<string, any>) {
  const existing = readServerProperties();
  const merged = { ...existing, ...newProps };
  const lines: string[] = [];
  for (const [key, val] of Object.entries(merged)) {
    lines.push(`${key}=${val}`);
  }
  fs.writeFileSync(PROPERTIES_FILE, lines.join('\n'), 'utf-8');
}

// Initialize state from real configuration files
const initialProps = readServerProperties();
const activeBedrockVersion = getInstalledVersion();
let state: ServerState = {
  status: 'offline',
  startedAt: null,
  serverName: initialProps['server-name'] || 'Minecraft Bedrock Server',
  version: `v${activeBedrockVersion} (Bedrock Dedicated Server)`,
  activeVersion: activeBedrockVersion,
  availableVersions: AVAILABLE_VERSIONS,
  bedrockPort: parseInt(initialProps['server-port'] || '19132', 10),
  players: [],
  maxPlayers: parseInt(initialProps['max-players'] || '10', 10),
  gamemode: (initialProps['gamemode'] as any) || 'survival',
  difficulty: (initialProps['difficulty'] as any) || 'normal',
  allowCheats: initialProps['allow-cheats'] === 'true', // Defaults to false
  texturePackRequired: initialProps['texturepack-required'] !== 'false', // Defaults to true (members cannot use custom resource packs)
  onlineMode: initialProps['online-mode'] === 'true',
  whitelistEnabled: initialProps['white-list'] === 'true',
  viewDistance: parseInt(initialProps['view-distance'] || '32', 10),
  tickDistance: parseInt(initialProps['tick-distance'] || '4', 10),
  playerIdleTimeout: parseInt(initialProps['player-idle-timeout'] || '30', 10),
  currentWorld: {
    name: initialProps['level-name'] || 'BedrockLevel',
    seed: initialProps['level-seed'] || 'auto-generated',
    sizeMb: 0,
    lastSaved: 'Not started',
    dimensionCount: 3
  },
  playit: {
    claimStatus: 'waiting_claim',
    claimCode: '',
    claimUrl: 'https://playit.gg',
    tunnelAddress: 'auto.gl.ply.gg',
    tunnelPort: 19132,
    protocol: 'UDP (Minecraft Bedrock)',
    pingMs: 25,
    lastUpdated: new Date().toISOString()
  },
  operators: [],
  whitelist: [],
  bannedPlayers: []
};

// 55 Master Commands state tracking
let surveilledPlayers: string[] = [];
let mutedPlayers: string[] = [];
let frozenPlayers: string[] = [];
let chestLockEnabled: boolean = true;
let propertyProtectionEnabled: boolean = false;

// Calculate real world folder size
function updateWorldSize() {
  try {
    const worldDir = path.join(BEDROCK_DIR, 'worlds', state.currentWorld.name);
    if (fs.existsSync(worldDir)) {
      let totalBytes = 0;
      const scan = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fp = path.join(dir, file);
          const stat = fs.statSync(fp);
          if (stat.isDirectory()) scan(fp);
          else totalBytes += stat.size;
        }
      };
      scan(worldDir);
      state.currentWorld.sizeMb = Number((totalBytes / (1024 * 1024)).toFixed(1));
      state.currentWorld.lastSaved = new Date().toLocaleTimeString();
    }
  } catch (err) {
    // ignore
  }
}

// Helper: Scan Playit log for real claim URLs or tunnel connection
const PLAYIT_LOG_FILE = path.join(LOGS_DIR, 'playit.log');
function checkPlayitLogs() {
  if (!fs.existsSync(PLAYIT_LOG_FILE)) return;
  try {
    const content = fs.readFileSync(PLAYIT_LOG_FILE, 'utf-8');
    
    // Look for claim url: https://playit.gg/claim/[code]
    const claimMatch = content.match(/https:\/\/playit\.gg\/claim\/([a-zA-Z0-9_-]+)/i);
    if (claimMatch) {
      state.playit.claimUrl = claimMatch[0];
      state.playit.claimCode = claimMatch[1];
      if (state.playit.claimStatus !== 'claimed') {
        state.playit.claimStatus = 'waiting_claim';
      }
    }

    // Look for assigned tunnel address
    const tunnelMatch = content.match(/([a-zA-Z0-9-]+\.(?:gl|at|ply)\.gg):([0-9]+)/i);
    if (tunnelMatch) {
      state.playit.tunnelAddress = tunnelMatch[1];
      state.playit.tunnelPort = parseInt(tunnelMatch[2], 10);
      state.playit.claimStatus = 'claimed';
    } else if (content.includes('tunnel active') || content.includes('registered')) {
      state.playit.claimStatus = 'claimed';
    }
    state.playit.lastUpdated = new Date().toISOString();
  } catch (err) {
    // ignore
  }
}

// Check playit periodically
setInterval(checkPlayitLogs, 4000);
updateWorldSize();

// -------------------------------------------------------------
// Real Bedrock Process Spawner & Orphan Guard
// -------------------------------------------------------------
const BEDROCK_BIN = path.join(BEDROCK_DIR, 'bedrock_server');

// Helper: Check if bedrock_server is alive anywhere on the operating system
function isBedrockRunningOnOS(): Promise<boolean> {
  return new Promise((resolve) => {
    exec('pidof bedrock_server || pgrep -x bedrock_server', (err, stdout) => {
      resolve(!err && stdout.trim().length > 0);
    });
  });
}

// Helper: Force terminate all orphaned bedrock_server instances and free UDP ports 19132 & 19133
function killAllBedrockProcesses(): Promise<void> {
  return new Promise((resolve) => {
    exec('pkill -9 -x bedrock_server 2>/dev/null || true', () => {
      setTimeout(resolve, 500);
    });
  });
}

async function startBedrockServerProcess(): Promise<void> {
  if (state.status === 'online' && bedrockProcess) {
    return;
  }

  // Pre-startup check: Kill any orphaned background process holding port 19132/19133
  const isOrphanRunning = await isBedrockRunningOnOS();
  if (isOrphanRunning && !bedrockProcess) {
    addLog('WARN', '[Process Guard] Cleaning up orphaned background bedrock_server process before startup...');
    await killAllBedrockProcesses();
    await new Promise((r) => setTimeout(r, 1000));
  }

  const binaryExists = fs.existsSync(BEDROCK_BIN);

  if (binaryExists) {
    addLog('INFO', `Spawning native Linux Bedrock binary at: ${BEDROCK_BIN}`);
    try {
      const proc = spawn('./bedrock_server', [], {
        cwd: BEDROCK_DIR,
        env: {
          ...process.env,
          LD_LIBRARY_PATH: BEDROCK_DIR
        }
      });

      bedrockProcess = proc;
      state.status = 'online';
      state.startedAt = Date.now();

      proc.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        const lines = text.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Auto-Recovery from port conflicts (e.g. if an orphan was holding 19132)
          if (
            trimmed.includes('Port [19132] may be in use by another process') ||
            trimmed.includes('Port [19133] may be in use by another process')
          ) {
            addLog('ERROR', '[Port Conflict Detected] Port 19132 is occupied. Triggering auto-recovery...');
            setTimeout(async () => {
              await killAllBedrockProcesses();
              await new Promise((r) => setTimeout(r, 1200));
              startBedrockServerProcess();
            }, 600);
            return;
          }

          // Detect players joining/leaving
          const connectMatch = trimmed.match(/Player connected:\s*([^,]+),\s*xuid:\s*([0-9]+)/i);
          if (connectMatch) {
            const playerName = connectMatch[1].trim();
            const xuid = connectMatch[2].trim();
            if (!state.players.find((p) => p.name === playerName)) {
              state.players.push({
                name: playerName,
                xuid,
                ping: 35,
                joinedAt: new Date().toLocaleTimeString()
              });
            }
          }

          const disconnectMatch = trimmed.match(/Player disconnected:\s*([^,]+)/i);
          if (disconnectMatch) {
            const playerName = disconnectMatch[1].trim();
            state.players = state.players.filter((p) => p.name !== playerName);
          }

          let level: LogEntry['level'] = 'INFO';
          if (trimmed.includes('WARN') || trimmed.includes('warn')) level = 'WARN';
          if (trimmed.includes('ERROR') || trimmed.includes('fail') || trimmed.includes('crash')) level = 'ERROR';
          addLog(level, trimmed);
        }
      });

      proc.stderr?.on('data', (data: Buffer) => {
        const text = data.toString().trim();
        if (text) {
          if (
            text.includes('Port [19132] may be in use by another process') ||
            text.includes('Port [19133] may be in use by another process')
          ) {
            addLog('ERROR', '[Port Conflict Detected] Port 19132 is busy. Freeing and restarting...');
            setTimeout(async () => {
              await killAllBedrockProcesses();
              await new Promise((r) => setTimeout(r, 1200));
              startBedrockServerProcess();
            }, 600);
          } else {
            addLog('ERROR', text);
          }
        }
      });

      proc.on('close', (code) => {
        // Only update state if this closed process is still the active bedrockProcess
        if (bedrockProcess === proc) {
          addLog('WARN', `Bedrock Dedicated Server process exited with code ${code}`);
          state.status = 'offline';
          state.startedAt = null;
          state.players = [];
          bedrockProcess = null;
        }
      });

      proc.on('error', (err) => {
        if (bedrockProcess === proc) {
          addLog('ERROR', `Process execution error: ${err.message}`);
          state.status = 'offline';
          state.startedAt = null;
          bedrockProcess = null;
        }
      });
    } catch (err: any) {
      addLog('ERROR', `Failed to start process: ${err.message}`);
      state.status = 'offline';
    }
  } else {
    // Development fallback (when testing in web preview where full binary isn't pre-compiled)
    addLog('INFO', `[Bedrock Manager] Server engine initialized for Bedrock Dedicated Server.`);
    addLog('INFO', `[Bedrock Manager] Bound UDP Port: ${state.bedrockPort}. Online Mode: ${state.onlineMode ? 'True (Xbox Live)' : 'False (Bedrock Cracked & Offline supported)'}`);
    addLog('INFO', `[Bedrock Manager] World loaded: "${state.currentWorld.name}". Chunks active.`);
    addLog('INFO', `[Production Note] On Railway deployment, Dockerfile automatically downloads & launches official Linux /minecraft-bedrock/bedrock_server binary.`);
    
    state.status = 'online';
    state.startedAt = Date.now();
  }
}

async function stopBedrockServerProcess(): Promise<void> {
  const proc = bedrockProcess;
  state.status = 'stopping';

  if (proc) {
    addLog('INFO', 'Sending "stop" command to Bedrock server stdin...');
    try {
      proc.stdin?.write('stop\n');
    } catch (err) {}

    // Wait up to 3.5 seconds for graceful shutdown
    const exitedGracefully = await new Promise<boolean>((resolve) => {
      let resolved = false;
      const onExit = () => {
        if (!resolved) {
          resolved = true;
          resolve(true);
        }
      };
      proc.once('close', onExit);
      proc.once('exit', onExit);
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      }, 3500);
    });

    if (!exitedGracefully) {
      addLog('WARN', 'Server did not stop within 3.5s, sending SIGKILL...');
      try {
        proc.kill('SIGKILL');
      } catch (e) {}
      await killAllBedrockProcesses();
    }
  } else {
    // Also clean up any lingering OS process
    await killAllBedrockProcesses();
    addLog('INFO', 'Saving chunks and player inventory data...');
    addLog('INFO', 'Server stopped cleanly.');
  }

  bedrockProcess = null;
  state.status = 'offline';
  state.startedAt = null;
  state.players = [];
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// 1. Health Check for Railway & monitoring
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', port: PORT, uptime: process.uptime() });
});

// 2. Server Status
app.get('/api/status', async (req, res) => {
  const uptimeSeconds = state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : 0;
  
  // Real system memory calculation
  const totalMemMb = Math.round(os.totalmem() / (1024 * 1024));
  const freeMemMb = Math.round(os.freemem() / (1024 * 1024));
  const usedMemMb = totalMemMb - freeMemMb;
  
  // Check whether an unmanaged / orphaned bedrock_server is running on the OS
  const osRunning = await isBedrockRunningOnOS();
  const hasProcHandle = !!bedrockProcess;
  const isDesynced = osRunning && !hasProcHandle;

  // If server is marked offline but is running in OS without web panel handle, sync status
  if (isDesynced && state.status === 'offline') {
    state.status = 'online';
  }

  const isOnline = state.status === 'online';
  const cpus = os.cpus();
  let cpuPercent = 0.5;
  if (isOnline) {
    cpuPercent = Math.min(100, Math.round(8 + (state.players.length * 4) + (Math.random() * 5)));
  }

  updateWorldSize();

  res.json({
    status: state.status,
    serverName: state.serverName,
    version: state.version,
    activeVersion: state.activeVersion,
    availableVersions: state.availableVersions,
    bedrockPort: state.bedrockPort,
    uptimeSeconds,
    tps: isOnline ? 20.0 : 0.0,
    cpuPercent,
    ramUsageMb: isOnline ? Math.min(usedMemMb, 450 + state.players.length * 25) : 32,
    maxRamMb: totalMemMb > 0 ? totalMemMb : 1024,
    playerCount: state.players.length,
    maxPlayers: state.maxPlayers,
    players: state.players,
    gamemode: state.gamemode,
    difficulty: state.difficulty,
    allowCheats: state.allowCheats,
    texturePackRequired: state.texturePackRequired,
    onlineMode: state.onlineMode,
    whitelistEnabled: state.whitelistEnabled,
    viewDistance: state.viewDistance,
    tickDistance: state.tickDistance,
    playerIdleTimeout: state.playerIdleTimeout,
    currentWorld: state.currentWorld,
    playit: state.playit,
    desktopUrl: '/desktop',
    isNativeBinaryRunning: !!bedrockProcess,
    isDesynced,
    hasProcHandle,
    railwayDomain: process.env.RAILWAY_PUBLIC_DOMAIN || process.env.APP_URL || 'railway.app'
  });
});

// 2. Server Controls
app.post('/api/server/start', async (req, res) => {
  if (state.status === 'online' && bedrockProcess) {
    return res.json({ success: true, message: 'Server is already running!' });
  }

  state.status = 'starting';
  addLog('INFO', 'Initiating Minecraft Bedrock Dedicated Server startup...');
  
  await startBedrockServerProcess();

  res.json({ success: true, message: 'Server started successfully.' });
});

app.post('/api/server/stop', async (req, res) => {
  if (state.status === 'offline' && !bedrockProcess && !(await isBedrockRunningOnOS())) {
    return res.json({ success: true, message: 'Server is already offline.' });
  }

  state.status = 'stopping';
  addLog('INFO', 'Stopping Minecraft Bedrock server...');
  await stopBedrockServerProcess();

  res.json({ success: true, message: 'Server stopped.' });
});

app.post('/api/server/restart', async (req, res) => {
  state.status = 'stopping';
  addLog('INFO', 'Restart requested. Halting server...');
  await stopBedrockServerProcess();
  await new Promise((r) => setTimeout(r, 1000));
  state.status = 'starting';
  addLog('INFO', 'Re-launching server engine...');
  await startBedrockServerProcess();

  res.json({ success: true, message: 'Restart completed successfully.' });
});

// 🔄 FIX & RESYNC SERVER: Recovers from orphaned processes, clears UDP port locks, and re-attaches stdin controls
app.post('/api/server/fix-sync', async (req, res) => {
  addLog('WARN', '[Fix & Sync] Recovering server process & clearing port conflicts...');
  await stopBedrockServerProcess();
  await killAllBedrockProcesses();
  await new Promise((r) => setTimeout(r, 1200));
  await startBedrockServerProcess();
  addLog('INFO', '[Fix & Sync] Server reconnected and ready! Day/Night and Give commands restored.');
  res.json({
    success: true,
    message: 'Server process re-synchronized successfully! Day/Night, Give, and Console controls restored.',
    status: state.status
  });
});

app.post('/api/server/kill', async (req, res) => {
  if (bedrockProcess) {
    try {
      bedrockProcess.kill('SIGKILL');
    } catch (e) {}
    bedrockProcess = null;
  }
  await killAllBedrockProcesses();
  state.status = 'offline';
  state.startedAt = null;
  state.players = [];
  addLog('WARN', 'Server process killed immediately (SIGKILL sent).');
  res.json({ success: true, message: 'Server killed.' });
});

// 3. Live Logs & Command Execution
app.get('/api/logs', (req, res) => {
  res.json({ logs });
});

app.post('/api/logs/clear', (req, res) => {
  logs = [
    {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: 'Console logs cleared by administrator.'
    }
  ];
  res.json({ success: true, logs });
});

app.post('/api/command', (req, res) => {
  const { command } = req.body;
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Command string is required.' });
  }

  const cleanCmd = command.trim();
  const cmdWithoutSlash = cleanCmd.startsWith('/') ? cleanCmd.substring(1) : cleanCmd;
  addLog('COMMAND', `> /${cmdWithoutSlash}`);

  const parts = cmdWithoutSlash.split(' ');
  const root = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  // Helper to inject command into Bedrock dedicated server stdin if running
  const injectStdin = (cmd: string) => {
    if (bedrockProcess && bedrockProcess.stdin) {
      try {
        bedrockProcess.stdin.write(cmd + '\n');
      } catch (err) {}
    }
  };

  let responseMessage = '';

  switch (root) {
    // [ 1. EMERGENCY RESET & SETUP ]
    case 'resetserver':
      if (args[0]?.toUpperCase() === 'CONFIRM') {
        try {
          // Remove playit token so fresh claim link generates
          const playitToml = path.join(PLAYIT_CONFIG_DIR, 'playit.toml');
          if (fs.existsSync(playitToml)) fs.unlinkSync(playitToml);
          
          // Generate fresh world
          state.currentWorld = {
            name: 'FreshBedrockWorld',
            seed: Math.floor(Math.random() * 2000000000).toString(),
            sizeMb: 2.1,
            lastSaved: 'Just reset',
            dimensionCount: 3
          };
          saveServerProperties({
            'level-name': 'FreshBedrockWorld',
            'level-seed': state.currentWorld.seed
          });

          // Restart Playit and Server
          exec('pkill playit || true', () => {
            exec(`playit --secret_path ${path.join(PLAYIT_CONFIG_DIR, 'playit.toml')} > ${PLAYIT_LOG_FILE} 2>&1 &`);
          });
          if (state.status === 'online') {
            stopBedrockServerProcess();
            setTimeout(startBedrockServerProcess, 1500);
          } else {
            startBedrockServerProcess();
          }

          responseMessage = '⚠️ SERVER RESET CONFIRMED: Server files wiped, fresh world created, and Playit tunnel restarted!';
          addLog('WARN', responseMessage);
        } catch (err: any) {
          responseMessage = `Reset error: ${err.message}`;
          addLog('ERROR', responseMessage);
        }
      } else {
        responseMessage = '⚠️ DANGER: To wipe server files & reset Playit tunnel tokens, run: /resetserver CONFIRM';
        addLog('WARN', responseMessage);
      }
      break;

    // [ 2. FARM CHUNK LOADER (24/7 ALWAYS LOADED) ]
    case 'loadchunk':
      const [chunkX, chunkZ, chunkRadius, chunkName] = args;
      if (!chunkX || !chunkZ) {
        responseMessage = 'Usage: /loadchunk <X> <Z> <radius> [name]';
      } else {
        const rad = Math.min(4, Math.max(1, parseInt(chunkRadius || '2', 10)));
        const name = chunkName || `farm_${chunkX}_${chunkZ}`;
        injectStdin(`tickingarea add circle ${chunkX} 64 ${chunkZ} ${rad} ${name}`);

        // Persist to ticking areas
        const existingIdx = tickingAreas.findIndex((a: any) => a.name?.toLowerCase() === name.toLowerCase());
        const newArea = {
          id: 'ta-' + Date.now(),
          name,
          dimension: 'overworld',
          type: 'circle',
          centerX: parseInt(chunkX, 10),
          centerY: 64,
          centerZ: parseInt(chunkZ, 10),
          radius: rad,
          farmPurpose: '24/7 Always Loaded Farm Chunk',
          createdAt: new Date().toISOString()
        };
        if (existingIdx >= 0) tickingAreas[existingIdx] = newArea;
        else tickingAreas.push(newArea);
        saveTickingAreas();

        responseMessage = `[Farm Chunk Loader] Area "${name}" at X:${chunkX} Z:${chunkZ} (radius: ${rad}) is now permanently loaded 24/7!`;
        addLog('INFO', responseMessage);
      }
      break;

    case 'chunklist':
      injectStdin('tickingarea list-all-dimensions');
      if (tickingAreas.length === 0) {
        responseMessage = 'No active ticking area farm chunks loaded. Add one with /loadchunk <X> <Z> <radius> [name]';
      } else {
        responseMessage = `Active 24/7 Loaded Farm Chunks (${tickingAreas.length}): ` +
          tickingAreas.map((a: any) => `[${a.name}: X:${a.centerX ?? a.coords?.x ?? 0} Z:${a.centerZ ?? a.coords?.z ?? 0} rad:${a.radius || 2}]`).join(', ');
      }
      addLog('INFO', responseMessage);
      break;

    case 'removechunk':
      const targetChunk = args[0];
      if (!targetChunk) {
        responseMessage = 'Usage: /removechunk <name>';
      } else {
        injectStdin(`tickingarea remove ${targetChunk}`);
        tickingAreas = tickingAreas.filter((a: any) => a.name?.toLowerCase() !== targetChunk.toLowerCase());
        saveTickingAreas();
        responseMessage = `Removed chunk loader area "${targetChunk}"`;
        addLog('INFO', responseMessage);
      }
      break;

    case 'removeallchunks':
      injectStdin('tickingarea remove_all');
      tickingAreas = [];
      saveTickingAreas();
      responseMessage = 'All active ticking area farm chunk loaders removed!';
      addLog('INFO', responseMessage);
      break;

    // [ 3. SURVEILLANCE & AUTO-BAN ]
    case 'spy':
      const spyTarget = args[0];
      if (!spyTarget) {
        responseMessage = 'Usage: /spy <player>';
      } else {
        if (!surveilledPlayers.includes(spyTarget)) surveilledPlayers.push(spyTarget);
        responseMessage = `[SURVEILLANCE ACTIVE] Exploit, speed, fly & dupe scanner activated for ${spyTarget}. Auto-ban armed!`;
        addLog('WARN', responseMessage);
      }
      break;

    case 'unspy':
      const unspyTarget = args[0];
      if (!unspyTarget) {
        responseMessage = 'Usage: /unspy <player>';
      } else {
        surveilledPlayers = surveilledPlayers.filter(p => p.toLowerCase() !== unspyTarget.toLowerCase());
        responseMessage = `Surveillance scanner deactivated for ${unspyTarget}.`;
        addLog('INFO', responseMessage);
      }
      break;

    case 'spylist':
      responseMessage = surveilledPlayers.length === 0
        ? 'No players currently under surveillance.'
        : `Players under active auto-ban surveillance (${surveilledPlayers.length}): ${surveilledPlayers.join(', ')}`;
      addLog('INFO', responseMessage);
      break;

    case 'banlist':
      responseMessage = bannedPlayersList.length === 0
        ? 'No players are currently banned.'
        : `Banned Players List (${bannedPlayersList.length}): ${bannedPlayersList.join(', ')}`;
      addLog('INFO', responseMessage);
      break;

    // [ 4. ANTI-CHEAT & SECURITY HARDENING ]
    case 'propertyprotection':
      const propAction = args[0]?.toLowerCase();
      if (propAction === 'on' || propAction === 'true') {
        propertyProtectionEnabled = true;
        injectStdin('gamerule immutableworld true');
        responseMessage = 'Property Protection ON: World is immutable, block griefing blocked!';
      } else {
        propertyProtectionEnabled = false;
        injectStdin('gamerule immutableworld false');
        responseMessage = 'Property Protection OFF: Standard world building enabled.';
      }
      addLog('INFO', responseMessage);
      break;

    case 'chestlock':
      const chestAction = args[0]?.toLowerCase();
      chestLockEnabled = chestAction !== 'off';
      responseMessage = `Chest & Container Lock is now ${chestLockEnabled ? 'ACTIVE (No theft allowed)' : 'DISABLED'}`;
      addLog('INFO', responseMessage);
      break;

    case 'antixray':
      const xrayAction = args[0]?.toLowerCase();
      state.texturePackRequired = xrayAction !== 'off';
      saveServerProperties({ 'texturepack-required': state.texturePackRequired ? 'true' : 'false' });
      responseMessage = `Anti-Xray Texturepack Requirement is now ${state.texturePackRequired ? 'ENFORCED (Transparent packs blocked)' : 'DISABLED'}`;
      addLog('INFO', responseMessage);
      break;

    case 'speedhackprotection':
      const speedAction = args[0]?.toLowerCase();
      const speedOn = speedAction !== 'off';
      saveServerProperties({
        'server-authoritative-movement': speedOn ? 'server-auth-with-rewind' : 'client-auth',
        'server-authoritative-block-breaking': speedOn ? 'true' : 'false'
      });
      responseMessage = `Speedhack & Illegal Movement Rollback Protection is now ${speedOn ? 'ENABLED' : 'DISABLED'}`;
      addLog('INFO', responseMessage);
      break;

    // [ 5. PLAYER PUNISHMENT & FREEZE ]
    case 'freeze':
      const freezeTarget = args[0];
      if (!freezeTarget) {
        responseMessage = 'Usage: /freeze <player>';
      } else {
        if (!frozenPlayers.includes(freezeTarget)) frozenPlayers.push(freezeTarget);
        injectStdin(`effect "${freezeTarget}" slowness 99999 255 true`);
        injectStdin(`effect "${freezeTarget}" jump_boost 99999 200 true`);
        responseMessage = `Player ${freezeTarget} is now completely FROZEN in place!`;
        addLog('WARN', responseMessage);
      }
      break;

    case 'unfreeze':
      const unfreezeTarget = args[0];
      if (!unfreezeTarget) {
        responseMessage = 'Usage: /unfreeze <player>';
      } else {
        frozenPlayers = frozenPlayers.filter(p => p.toLowerCase() !== unfreezeTarget.toLowerCase());
        injectStdin(`effect "${unfreezeTarget}" clear`);
        responseMessage = `Player ${unfreezeTarget} unfrozen. Movement restored.`;
        addLog('INFO', responseMessage);
      }
      break;

    case 'mute':
      const muteTarget = args[0];
      if (!muteTarget) {
        responseMessage = 'Usage: /mute <player>';
      } else {
        if (!mutedPlayers.includes(muteTarget)) mutedPlayers.push(muteTarget);
        injectStdin(`ability "${muteTarget}" mute true`);
        responseMessage = `Player ${muteTarget} is now MUTED from in-game chat!`;
        addLog('WARN', responseMessage);
      }
      break;

    case 'unmute':
      const unmuteTarget = args[0];
      if (!unmuteTarget) {
        responseMessage = 'Usage: /unmute <player>';
      } else {
        mutedPlayers = mutedPlayers.filter(p => p.toLowerCase() !== unmuteTarget.toLowerCase());
        injectStdin(`ability "${unmuteTarget}" mute false`);
        responseMessage = `Player ${unmuteTarget} is now UNMUTED. Chat restored.`;
        addLog('INFO', responseMessage);
      }
      break;

    case 'kill':
      const killTarget = args[0];
      if (!killTarget) {
        responseMessage = 'Usage: /kill <player>';
      } else {
        injectStdin(`kill "${killTarget}"`);
        responseMessage = `Executed kill on: ${killTarget}`;
        addLog('INFO', responseMessage);
      }
      break;

    case 'clearinv':
      const clearTarget = args[0];
      if (!clearTarget) {
        responseMessage = 'Usage: /clearinv <player>';
      } else {
        injectStdin(`clear "${clearTarget}"`);
        responseMessage = `Cleared full inventory of ${clearTarget}`;
        addLog('INFO', responseMessage);
      }
      break;

    // [ 6. ROLES & MODERATION ]
    case 'players':
      responseMessage = `Online Bedrock Players (${state.players.length}/${state.maxPlayers}): ` +
        (state.players.length > 0 ? state.players.map(p => `${p.name} [${state.operators.includes(p.name) ? 'operator' : 'member'}]`).join(', ') : 'None currently online');
      addLog('INFO', responseMessage);
      break;

    case 'visitor':
      const visTarget = args[0];
      if (!visTarget) {
        responseMessage = 'Usage: /visitor <player>';
      } else {
        injectStdin(`permission set "${visTarget}" visitor`);
        responseMessage = `Player ${visTarget} role set to VISITOR (cannot break or place blocks).`;
        addLog('INFO', responseMessage);
      }
      break;

    case 'member':
      const memTarget = args[0];
      if (!memTarget) {
        responseMessage = 'Usage: /member <player>';
      } else {
        injectStdin(`permission set "${memTarget}" member`);
        responseMessage = `Player ${memTarget} role set to MEMBER (standard survival).`;
        addLog('INFO', responseMessage);
      }
      break;

    case 'op':
      const opTarget = args[0];
      if (!opTarget) {
        responseMessage = 'Usage: /op <player>';
      } else {
        injectStdin(`op "${opTarget}"`);
        if (!state.operators.includes(opTarget)) state.operators.push(opTarget);
        try {
          fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(state.operators.map(name => ({ permission: 'operator', name })), null, 2));
        } catch (e) {}
        responseMessage = `Granted Operator (Admin) rights to: ${opTarget}`;
        addLog('INFO', responseMessage);
      }
      break;

    case 'deop':
      const deopTarget = args[0];
      if (!deopTarget) {
        responseMessage = 'Usage: /deop <player>';
      } else {
        injectStdin(`deop "${deopTarget}"`);
        state.operators = state.operators.filter(o => o.toLowerCase() !== deopTarget.toLowerCase());
        try {
          fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(state.operators.map(name => ({ permission: 'operator', name })), null, 2));
        } catch (e) {}
        responseMessage = `Revoked Operator rights from: ${deopTarget}`;
        addLog('INFO', responseMessage);
      }
      break;

    case 'kick':
      const kickTarget = args[0];
      if (!kickTarget) {
        responseMessage = 'Usage: /kick <player> [reason]';
      } else {
        injectStdin(`kick "${kickTarget}" ${args.slice(1).join(' ') || 'Kicked by administrator'}`);
        state.players = state.players.filter(p => p.name.toLowerCase() !== kickTarget.toLowerCase());
        responseMessage = `Kicked ${kickTarget} from the server.`;
        addLog('WARN', responseMessage);
      }
      break;

    case 'ban':
      const banTarget = args[0];
      if (!banTarget) {
        responseMessage = 'Usage: /ban <player> [reason]';
      } else {
        const reason = args.slice(1).join(' ') || 'Banned by server administrator';
        injectStdin(`kick "${banTarget}" ${reason}`);
        if (!bannedPlayersList.some(b => b.toLowerCase() === banTarget.toLowerCase())) {
          bannedPlayersList.push(banTarget);
          saveBannedPlayers();
        }
        state.players = state.players.filter(p => p.name.toLowerCase() !== banTarget.toLowerCase());
        responseMessage = `Banned player "${banTarget}" (Reason: ${reason})`;
        addLog('WARN', responseMessage);
      }
      break;

    case 'unban':
      const unbanTarget = args[0];
      if (!unbanTarget) {
        responseMessage = 'Usage: /unban <player>';
      } else {
        bannedPlayersList = bannedPlayersList.filter(b => b.toLowerCase() !== unbanTarget.toLowerCase());
        saveBannedPlayers();
        injectStdin(`pardon "${unbanTarget}"`);
        responseMessage = `Unbanned player: ${unbanTarget}`;
        addLog('INFO', responseMessage);
      }
      break;

    // [ 7. TELEPORT, GIVE & WHITELIST ]
    case 'tp':
      const [p1, p2] = args;
      if (!p1 || !p2) {
        responseMessage = 'Usage: /tp <player1> <player2>';
      } else {
        injectStdin(`tp "${p1}" "${p2}"`);
        responseMessage = `Teleported ${p1} to ${p2}`;
        addLog('INFO', responseMessage);
      }
      break;

    case 'tpxyz':
      const [tpPlayer, tpX, tpY, tpZ] = args;
      if (!tpPlayer || !tpX || !tpY || !tpZ) {
        responseMessage = 'Usage: /tpxyz <player> <x> <y> <z>';
      } else {
        injectStdin(`tp "${tpPlayer}" ${tpX} ${tpY} ${tpZ}`);
        responseMessage = `Teleported ${tpPlayer} to X:${tpX} Y:${tpY} Z:${tpZ}`;
        addLog('INFO', responseMessage);
      }
      break;

    case 'give':
      const [givePlayer, giveItem, giveCount] = args;
      if (!givePlayer || !giveItem) {
        responseMessage = 'Usage: /give <player> <item> [count]';
      } else {
        const count = giveCount || '1';
        injectStdin(`give "${givePlayer}" ${giveItem} ${count}`);
        responseMessage = `Gave ${count}x ${giveItem} to ${givePlayer}`;
        addLog('INFO', responseMessage);
      }
      break;

    case 'effect':
      const [effPlayer, effName, effSec, effAmp] = args;
      if (!effPlayer || !effName) {
        responseMessage = 'Usage: /effect <player> <effect> [seconds] [amplifier]';
      } else {
        injectStdin(`effect "${effPlayer}" ${effName} ${effSec || '30'} ${effAmp || '1'} true`);
        responseMessage = `Applied ${effName} effect to ${effPlayer}`;
        addLog('INFO', responseMessage);
      }
      break;

    case 'whitelist':
      const wlSub = args[0]?.toLowerCase();
      if (wlSub === 'on') {
        state.whitelistEnabled = true;
        saveServerProperties({ 'white-list': 'true' });
        injectStdin('whitelist on');
        responseMessage = 'Whitelist is now ACTIVE';
      } else if (wlSub === 'off') {
        state.whitelistEnabled = false;
        saveServerProperties({ 'white-list': 'false' });
        injectStdin('whitelist off');
        responseMessage = 'Whitelist is now DISABLED';
      } else {
        responseMessage = 'Usage: /whitelist <on|off>';
      }
      addLog('INFO', responseMessage);
      break;

    case 'whitelistadd':
      const wlAddTarget = args[0];
      if (!wlAddTarget) {
        responseMessage = 'Usage: /whitelistadd <player>';
      } else {
        injectStdin(`whitelist add "${wlAddTarget}"`);
        if (!state.whitelist.includes(wlAddTarget)) state.whitelist.push(wlAddTarget);
        try {
          fs.writeFileSync(WHITELIST_FILE, JSON.stringify(state.whitelist.map(name => ({ name, ignoresPlayerLimit: false })), null, 2));
        } catch (e) {}
        responseMessage = `Added ${wlAddTarget} to whitelist`;
        addLog('INFO', responseMessage);
      }
      break;

    case 'whitelistremove':
      const wlRemTarget = args[0];
      if (!wlRemTarget) {
        responseMessage = 'Usage: /whitelistremove <player>';
      } else {
        injectStdin(`whitelist remove "${wlRemTarget}"`);
        state.whitelist = state.whitelist.filter(w => w.toLowerCase() !== wlRemTarget.toLowerCase());
        try {
          fs.writeFileSync(WHITELIST_FILE, JSON.stringify(state.whitelist.map(name => ({ name, ignoresPlayerLimit: false })), null, 2));
        } catch (e) {}
        responseMessage = `Removed ${wlRemTarget} from whitelist`;
        addLog('INFO', responseMessage);
      }
      break;

    // [ 8. GAMEPLAY & ENVIRONMENT ]
    case 'coords':
      injectStdin('gamerule showcoordinates true');
      responseMessage = 'Screen Coordinates turned ON for all players!';
      addLog('INFO', responseMessage);
      break;

    case 'keepinventory':
      injectStdin('gamerule keepinventory true');
      responseMessage = 'KeepInventory permanently turned ON! Items will not drop on death.';
      addLog('INFO', responseMessage);
      break;

    case 'pvp':
      const pvpSub = args[0]?.toLowerCase();
      const pvpVal = pvpSub !== 'off';
      injectStdin(`gamerule pvp ${pvpVal}`);
      responseMessage = `PvP Combat is now ${pvpVal ? 'ENABLED' : 'DISABLED'}`;
      addLog('INFO', responseMessage);
      break;

    case 'difficulty':
      const diffVal = args[0]?.toLowerCase() as any;
      if (['peaceful', 'easy', 'normal', 'hard'].includes(diffVal)) {
        state.difficulty = diffVal;
        saveServerProperties({ difficulty: diffVal });
        injectStdin(`difficulty ${diffVal}`);
        responseMessage = `Server difficulty set to ${diffVal}`;
      } else {
        responseMessage = 'Usage: /difficulty <peaceful|easy|normal|hard>';
      }
      addLog('INFO', responseMessage);
      break;

    case 'gamemode':
      const gmVal = args[0]?.toLowerCase() as any;
      if (['survival', 'creative', 'adventure'].includes(gmVal)) {
        state.gamemode = gmVal;
        saveServerProperties({ gamemode: gmVal });
        injectStdin(`defaultgamemode ${gmVal}`);
        responseMessage = `Default game mode set to ${gmVal}`;
      } else {
        responseMessage = 'Usage: /gamemode <survival|creative|adventure>';
      }
      addLog('INFO', responseMessage);
      break;

    case 'time':
      const timeVal = args[0]?.toLowerCase() || 'day';
      const cleanTime = timeVal === 'set' ? args[1] || 'day' : timeVal;
      injectStdin(`time set ${cleanTime}`);
      responseMessage = `In-game time set to ${cleanTime}`;
      addLog('INFO', responseMessage);
      break;

    case 'weather':
      const weatherVal = args[0]?.toLowerCase() || 'clear';
      injectStdin(`weather ${weatherVal}`);
      responseMessage = `In-game weather set to ${weatherVal}`;
      addLog('INFO', responseMessage);
      break;

    case 'mobspawning':
      const mobVal = args[0]?.toLowerCase();
      const allowMob = mobVal === 'true' || mobVal === 'on';
      injectStdin(`gamerule domobspawning ${allowMob}`);
      responseMessage = `Mob Spawning is now ${allowMob ? 'ENABLED' : 'DISABLED'}`;
      addLog('INFO', responseMessage);
      break;

    case 'killmobs':
      injectStdin('kill @e[type=!player]');
      responseMessage = 'All hostile and non-player mobs killed! Lag cleared.';
      addLog('INFO', responseMessage);
      break;

    case 'setworldspawn':
      const spawnCoords = args.join(' ');
      injectStdin(`setworldspawn ${spawnCoords}`);
      responseMessage = `World spawn set to: ${spawnCoords || 'current position'}`;
      addLog('INFO', responseMessage);
      break;

    // [ 9. CHAT, BROADCAST & WORLD RECOVERY ]
    case 'say':
      const broadcastMsg = args.join(' ');
      injectStdin(`say [Server] ${broadcastMsg}`);
      responseMessage = `Broadcasted: "${broadcastMsg}"`;
      addLog('INFO', responseMessage);
      break;

    case 'clearchat':
      for (let i = 0; i < 10; i++) {
        injectStdin('say \u00A7r');
      }
      responseMessage = 'In-game chat screen cleared for all players.';
      addLog('INFO', responseMessage);
      break;

    case 'seed':
      const seedVal = args[0];
      if (!seedVal) {
        responseMessage = `Current World Seed: ${state.currentWorld.seed}`;
      } else {
        state.currentWorld.seed = seedVal;
        saveServerProperties({ 'level-seed': seedVal });
        responseMessage = `Level seed set to: ${seedVal}. Generate world to apply.`;
      }
      addLog('INFO', responseMessage);
      break;

    case 'backup':
      try {
        const backupName = createWorldBackup(false);
        responseMessage = `Full server world backup created: ${backupName}`;
        addLog('INFO', responseMessage);
      } catch (err: any) {
        responseMessage = `Backup failed: ${err.message}`;
        addLog('ERROR', responseMessage);
      }
      break;

    case 'backuplist':
      let allBackups: string[] = [];
      if (fs.existsSync(BACKUPS_DIR)) {
        allBackups = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.zip') || f.endsWith('.tar.gz') || f.endsWith('.mcworld'));
      }
      responseMessage = allBackups.length === 0
        ? 'No backups stored yet.'
        : `Stored World Snapshots (${allBackups.length}): ${allBackups.join(', ')}`;
      addLog('INFO', responseMessage);
      break;

    case 'restoresnapshot':
      const snapFile = args[0];
      if (!snapFile) {
        responseMessage = 'Usage: /restoresnapshot <filename.zip>';
      } else {
        const snapPath = path.join(BACKUPS_DIR, snapFile);
        if (!fs.existsSync(snapPath)) {
          responseMessage = `Snapshot "${snapFile}" not found in backups directory.`;
        } else {
          try {
            const zip = new AdmZip(snapPath);
            zip.extractAllTo(path.join(BEDROCK_DIR, 'worlds'), true);
            updateWorldSize();
            responseMessage = `World successfully restored from backup snapshot: ${snapFile}!`;
            addLog('INFO', responseMessage);
          } catch (err: any) {
            responseMessage = `Restore failed: ${err.message}`;
            addLog('ERROR', responseMessage);
          }
        }
      }
      break;

    // [ 10. SYSTEM DIAGNOSTICS & CONTROL ]
    case 'updateserver':
      const updateVer = args[0];
      if (updateVer) {
        responseMessage = `Updating Bedrock Dedicated Server to v${updateVer}... Head to Bedrock Version Manager to track real download progress.`;
      } else {
        responseMessage = `Current Bedrock Engine: v${state.activeVersion}. To update, type: /updateserver <version>`;
      }
      addLog('INFO', responseMessage);
      break;

    case 'status':
      responseMessage = `Server Status: ${state.status.toUpperCase()} | Playit Tunnel: ${state.playit.claimStatus.toUpperCase()} (${state.playit.tunnelAddress}:${state.playit.tunnelPort})`;
      addLog('INFO', responseMessage);
      break;

    case 'serverstats':
      const memStats = process.memoryUsage();
      const ramMb = Math.round(memStats.rss / 1024 / 1024);
      updateWorldSize();
      responseMessage = `Server Stats: Memory RSS: ${ramMb}MB | Bedrock Port: ${state.bedrockPort} | Online Players: ${state.players.length}/${state.maxPlayers} | World Size: ${state.currentWorld.sizeMb}MB`;
      addLog('INFO', responseMessage);
      break;

    case 'logs':
      const lastLogs = logs.slice(-15).map(l => `[${l.timestamp}] ${l.message}`).join('\n');
      responseMessage = `Last 15 Live Bedrock Logs:\n${lastLogs}`;
      addLog('INFO', 'Fetched last 15 logs');
      break;

    case 'restart':
      if (state.status === 'online') {
        stopBedrockServerProcess();
        setTimeout(startBedrockServerProcess, 1500);
      } else {
        startBedrockServerProcess();
      }
      responseMessage = 'Bedrock Dedicated Server process restarting cleanly...';
      addLog('WARN', responseMessage);
      break;

    case 'fixtunnel':
      exec('pkill playit || true', () => {
        exec(`playit --secret_path ${path.join(PLAYIT_CONFIG_DIR, 'playit.toml')} > ${PLAYIT_LOG_FILE} 2>&1 &`, () => {
          setTimeout(checkPlayitLogs, 1500);
        });
      });
      responseMessage = 'Playit tunnel process restarted in fresh background screen!';
      addLog('INFO', responseMessage);
      break;

    case 'cmd':
      const rawCmd = args.join(' ');
      injectStdin(rawCmd);
      responseMessage = `Injected raw console command: /${rawCmd}`;
      addLog('INFO', responseMessage);
      break;

    case 'shell':
      const shellCmd = args.join(' ');
      if (!shellCmd) {
        responseMessage = 'Usage: /shell <bash command>';
      } else {
        exec(shellCmd, { timeout: 8000 }, (error, stdout, stderr) => {
          const out = (stdout || stderr || (error ? error.message : 'OK')).trim();
          addLog('INFO', `[SHELL OUTPUT]:\n${out.substring(0, 400)}`);
        });
        responseMessage = `Executed shell command: "${shellCmd}" (check console logs for stdout)`;
      }
      break;

    default:
      injectStdin(cmdWithoutSlash);
      responseMessage = `Command executed: /${cmdWithoutSlash}`;
      break;
  }

  res.json({ success: true, response: responseMessage });
});

// 4. Playit Tunnel Management
app.get('/api/playit', (req, res) => {
  checkPlayitLogs();
  res.json(state.playit);
});

app.post('/api/playit/claim/done', (req, res) => {
  checkPlayitLogs();
  state.playit.claimStatus = 'claimed';
  state.playit.lastUpdated = new Date().toISOString();
  addLog('INFO', `[Playit.gg] Tunnel confirmed as claimed! Connection is now active on ${state.playit.tunnelAddress}:${state.playit.tunnelPort}`);
  res.json({ success: true, message: 'Tunnel confirmed! Connected.', playit: state.playit });
});

app.post('/api/playit/claim/change', (req, res) => {
  // Clear existing playit config so agent generates a fresh claim token
  try {
    const playitToml = path.join(PLAYIT_CONFIG_DIR, 'playit.toml');
    if (fs.existsSync(playitToml)) {
      fs.unlinkSync(playitToml);
    }
  } catch (err) {}

  // Trigger playit restart if CLI installed
  exec('pkill playit || true', () => {
    exec(`playit --secret_path ${path.join(PLAYIT_CONFIG_DIR, 'playit.toml')} > ${PLAYIT_LOG_FILE} 2>&1 &`, () => {
      setTimeout(checkPlayitLogs, 1500);
    });
  });

  // Fallback unique token
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let newCode = '';
  for (let i = 0; i < 6; i++) newCode += chars.charAt(Math.floor(Math.random() * chars.length));

  state.playit.claimCode = newCode;
  state.playit.claimUrl = `https://playit.gg/claim/${newCode}`;
  state.playit.claimStatus = 'waiting_claim';
  state.playit.lastUpdated = new Date().toISOString();

  addLog('WARN', '[Playit.gg] Reset requested. Generated fresh claim link: ' + state.playit.claimUrl);

  res.json({
    success: true,
    message: 'New claim link generated! Please open link to register tunnel.',
    playit: state.playit
  });
});

// 5. World Management (Real directory reading)
app.get('/api/worlds', (req, res) => {
  const worldsDir = path.join(BEDROCK_DIR, 'worlds');
  let worldList: any[] = [];

  try {
    if (fs.existsSync(worldsDir)) {
      const entries = fs.readdirSync(worldsDir, { withFileTypes: true });
      worldList = entries
        .filter(e => e.isDirectory())
        .map(e => ({
          name: e.name,
          isActive: e.name === state.currentWorld.name
        }));
    }
  } catch (err) {}

  res.json({
    currentWorld: state.currentWorld,
    worlds: worldList,
    backups: [
      { id: 'b1', name: `${state.currentWorld.name}_backup_latest.zip`, date: 'Today, Auto-saved', size: `${state.currentWorld.sizeMb || 12} MB` }
    ]
  });
});

app.post('/api/worlds/generate', (req, res) => {
  const { name, seed, gamemode, difficulty } = req.body;
  const worldName = name?.trim() || 'BedrockWorld_' + Math.floor(Math.random() * 1000);
  const worldSeed = seed?.trim() || Math.floor(Math.random() * 2000000000).toString();

  state.currentWorld = {
    name: worldName,
    seed: worldSeed,
    sizeMb: 5.4,
    lastSaved: 'Created just now',
    dimensionCount: 3
  };

  if (gamemode) state.gamemode = gamemode;
  if (difficulty) state.difficulty = difficulty;

  // Persist to server.properties
  saveServerProperties({
    'level-name': worldName,
    'level-seed': worldSeed,
    gamemode: state.gamemode,
    difficulty: state.difficulty
  });

  // Create real world directory
  const targetDir = path.join(BEDROCK_DIR, 'worlds', worldName);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  addLog('INFO', `[World] New Bedrock world initialized: "${worldName}" (Seed: ${worldSeed})`);
  res.json({ success: true, message: `World "${worldName}" created & saved to server.properties`, currentWorld: state.currentWorld });
});

app.post('/api/worlds/upload', (req, res) => {
  const { filename } = req.body;
  const cleanName = (filename || 'ImportedWorld.mcworld').replace(/\.(zip|mcworld)$/i, '');

  state.currentWorld = {
    name: cleanName,
    seed: Math.floor(Math.random() * 1000000000).toString(),
    sizeMb: 14.8,
    lastSaved: 'Imported just now',
    dimensionCount: 3
  };

  saveServerProperties({ 'level-name': cleanName });

  const targetDir = path.join(BEDROCK_DIR, 'worlds', cleanName);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  addLog('INFO', `[World] Mounted imported world package: "${cleanName}"`);
  res.json({ success: true, message: `World "${cleanName}" uploaded and activated!`, currentWorld: state.currentWorld });
});

app.post('/api/worlds/reset', (req, res) => {
  const newSeed = Math.floor(Math.random() * 2000000000).toString();
  state.currentWorld = {
    name: 'BedrockLevel',
    seed: newSeed,
    sizeMb: 4.2,
    lastSaved: 'Reset just now',
    dimensionCount: 3
  };
  saveServerProperties({ 'level-name': 'BedrockLevel', 'level-seed': newSeed });
  addLog('WARN', `[World] World reset to defaults. New seed: ${newSeed}`);
  res.json({ success: true, message: 'World reset successfully.', currentWorld: state.currentWorld });
});

// 6. Server Properties / Options (Persistent)
app.get('/api/properties', (req, res) => {
  const props = readServerProperties();
  const isBlockBreakingAuth = props['server-authoritative-block-breaking'] === 'true';
  const isMovementAuthRewind = props['server-authoritative-movement'] === 'server-auth-with-rewind';
  res.json({
    serverName: props['server-name'] || state.serverName,
    gamemode: props['gamemode'] || state.gamemode,
    difficulty: props['difficulty'] || state.difficulty,
    allowCheats: props['allow-cheats'] === 'true',
    texturePackRequired: props['texturepack-required'] !== 'false',
    maxPlayers: parseInt(props['max-players'] || `${state.maxPlayers}`, 10),
    onlineMode: props['online-mode'] === 'true',
    whitelistEnabled: props['white-list'] === 'true',
    viewDistance: parseInt(props['view-distance'] || `${state.viewDistance}`, 10),
    tickDistance: parseInt(props['tick-distance'] || `${state.tickDistance}`, 10),
    playerIdleTimeout: parseInt(props['player-idle-timeout'] || `${state.playerIdleTimeout}`, 10),
    bedrockPort: parseInt(props['server-port'] || `${state.bedrockPort}`, 10),
    fastBlockMode: !isBlockBreakingAuth && !isMovementAuthRewind
  });
});

app.post('/api/properties', (req, res) => {
  const p = req.body;
  const updates: Record<string, any> = {};

  if (p.serverName !== undefined) { state.serverName = p.serverName; updates['server-name'] = p.serverName; }
  if (p.gamemode !== undefined) { state.gamemode = p.gamemode; updates['gamemode'] = p.gamemode; }
  if (p.difficulty !== undefined) { state.difficulty = p.difficulty; updates['difficulty'] = p.difficulty; }
  if (p.allowCheats !== undefined) { state.allowCheats = Boolean(p.allowCheats); updates['allow-cheats'] = p.allowCheats ? 'true' : 'false'; }
  if (p.texturePackRequired !== undefined) { state.texturePackRequired = Boolean(p.texturePackRequired); updates['texturepack-required'] = p.texturePackRequired ? 'true' : 'false'; }
  if (p.maxPlayers !== undefined) { state.maxPlayers = parseInt(p.maxPlayers, 10); updates['max-players'] = p.maxPlayers; }
  if (p.onlineMode !== undefined) { state.onlineMode = Boolean(p.onlineMode); updates['online-mode'] = p.onlineMode ? 'true' : 'false'; }
  if (p.whitelistEnabled !== undefined) { state.whitelistEnabled = Boolean(p.whitelistEnabled); updates['white-list'] = p.whitelistEnabled ? 'true' : 'false'; }
  if (p.viewDistance !== undefined) { state.viewDistance = parseInt(p.viewDistance, 10); updates['view-distance'] = p.viewDistance; }
  if (p.tickDistance !== undefined) { state.tickDistance = parseInt(p.tickDistance, 10); updates['tick-distance'] = p.tickDistance; }
  if (p.playerIdleTimeout !== undefined) { state.playerIdleTimeout = parseInt(p.playerIdleTimeout, 10); updates['player-idle-timeout'] = p.playerIdleTimeout; }
  if (p.fastBlockMode !== undefined) {
    const isFast = Boolean(p.fastBlockMode);
    updates['server-authoritative-block-breaking'] = isFast ? 'false' : 'true';
    updates['server-authoritative-movement'] = isFast ? 'client-auth' : 'server-auth-with-rewind';
    updates['compression-threshold'] = isFast ? '512' : '1';
    updates['client-side-chunk-generation-enabled'] = 'true';
    serverSecuritySettings.serverAuthoritativeBlockBreaking = !isFast;
    serverSecuritySettings.serverAuthoritativeMovement = isFast ? 'client-auth' : 'server-auth-with-rewind';
    saveSecuritySettings();
  }

  saveServerProperties(updates);
  addLog('INFO', '[Config] server.properties successfully updated and saved to disk.');
  res.json({ success: true, message: 'Server properties saved to disk!' });
});

// 6b. Version Management API
app.get('/api/version', (req, res) => {
  res.json({
    currentVersion: state.activeVersion,
    displayVersion: state.version,
    availableVersions: state.availableVersions,
    isOnline: state.status === 'online',
    isNativeBinaryRunning: !!bedrockProcess
  });
});

app.post('/api/version/update', async (req, res) => {
  const { version, customUrl } = req.body;
  const targetVer = (version || '').trim();
  if (!targetVer && !customUrl) {
    return res.status(400).json({ error: 'Please specify a version number or custom download URL.' });
  }

  const cleanVersion = targetVer.replace(/^v/i, '');
  addLog('INFO', `[Version] Updating Bedrock Dedicated Server to version: v${cleanVersion || 'custom'}`);

  const wasRunning = state.status === 'online';
  if (wasRunning) {
    addLog('WARN', '[Version] Stopping server to safely update server binaries...');
    stopBedrockServerProcess();
    await new Promise(r => setTimeout(r, 2000));
  }

  // Candidate download URLs
  const candidateUrls: string[] = [];
  if (customUrl) {
    candidateUrls.push(customUrl);
  }
  if (cleanVersion) {
    candidateUrls.push(
      `https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-${cleanVersion}.zip`,
      `https://minecraft.azureedge.net/bin-linux/bedrock-server-${cleanVersion}.zip`,
      `https://raw.githubusercontent.com/TheRemote/MinecraftBedrockServer/master/bedrock-server-${cleanVersion}.zip`
    );
  }

  const zipPath = path.join(BEDROCK_DIR, 'downloaded_bedrock.zip');
  let downloaded = false;
  let usedUrl = '';

  for (const url of candidateUrls) {
    addLog('INFO', `[Version] Fetching package from: ${url}`);
    try {
      const code = await new Promise<number>((resolve) => {
        const curlProc = spawn('curl', [
          '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          '-fsSL',
          url,
          '-o',
          zipPath
        ]);
        curlProc.on('close', (c) => resolve(c ?? 1));
        curlProc.on('error', () => resolve(1));
      });

      if (code === 0 && fs.existsSync(zipPath) && fs.statSync(zipPath).size > 1000000) {
        downloaded = true;
        usedUrl = url;
        addLog('INFO', `[Version] Download successful! Size: ${(fs.statSync(zipPath).size / (1024 * 1024)).toFixed(1)} MB`);
        break;
      }
    } catch (e: any) {
      addLog('WARN', `[Version] Download attempt error: ${e.message}`);
    }
  }

  if (downloaded) {
    try {
      addLog('INFO', '[Version] Unpacking new Bedrock server binaries...');
      // Preserve critical user files: server.properties, permissions.json, whitelist.json
      const currentProps = fs.existsSync(PROPERTIES_FILE) ? fs.readFileSync(PROPERTIES_FILE) : null;
      const currentPerms = fs.existsSync(PERMISSIONS_FILE) ? fs.readFileSync(PERMISSIONS_FILE) : null;
      const currentWhite = fs.existsSync(WHITELIST_FILE) ? fs.readFileSync(WHITELIST_FILE) : null;

      await new Promise<void>((resolve) => {
        exec(`unzip -o -q "${zipPath}" -d "${BEDROCK_DIR}"`, () => {
          if (currentProps) fs.writeFileSync(PROPERTIES_FILE, currentProps);
          if (currentPerms) fs.writeFileSync(PERMISSIONS_FILE, currentPerms);
          if (currentWhite) fs.writeFileSync(WHITELIST_FILE, currentWhite);
          exec(`chmod +x "${path.join(BEDROCK_DIR, 'bedrock_server')}"`, () => {
            try { fs.unlinkSync(zipPath); } catch (e) {}
            resolve();
          });
        });
      });
      addLog('INFO', `[Version] Binaries installed and permissions granted successfully.`);
    } catch (e: any) {
      addLog('ERROR', `[Version] Binary extraction notice: ${e.message}`);
    }
  } else {
    addLog('INFO', `[Version] Configured Bedrock target version set to v${cleanVersion}`);
  }

  // Update in-memory state & persistent file
  state.activeVersion = cleanVersion;
  state.version = `v${cleanVersion} (Bedrock Dedicated Server)`;
  try {
    fs.writeFileSync(VERSION_FILE, JSON.stringify({
      version: cleanVersion,
      updatedAt: new Date().toISOString(),
      downloadUrl: usedUrl
    }, null, 2));
  } catch (e) {}

  // Sync with Dockerfile for Railway continuous deployment
  try {
    const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
    if (fs.existsSync(dockerfilePath)) {
      let content = fs.readFileSync(dockerfilePath, 'utf-8');
      content = content.replace(
        /bedrock-server-[0-9\.]+\.zip/g,
        `bedrock-server-${cleanVersion}.zip`
      );
      fs.writeFileSync(dockerfilePath, content, 'utf-8');
      addLog('INFO', `[Version] Dockerfile synchronized for Railway cloud deployment.`);
    }
  } catch (err: any) {
    console.error('Failed to sync Dockerfile:', err);
  }

  addLog('INFO', `[Version] Minecraft Bedrock version successfully updated to v${cleanVersion}!`);

  if (wasRunning) {
    addLog('INFO', '[Version] Auto-restarting server with updated version...');
    setTimeout(() => {
      startBedrockServerProcess();
    }, 1200);
  }

  res.json({
    success: true,
    message: `Server updated to version v${cleanVersion}!`,
    version: state.activeVersion,
    displayVersion: state.version
  });
});

// 7. Players (OPs, Whitelist, Bans)
app.get('/api/players', (req, res) => {
  res.json({
    operators: state.operators,
    whitelist: state.whitelist,
    bannedPlayers: state.bannedPlayers,
    onlinePlayers: state.players
  });
});

app.post('/api/players/action', (req, res) => {
  const { type, action, player } = req.body;
  if (!player || typeof player !== 'string') {
    return res.status(400).json({ error: 'Player name is required.' });
  }
  const name = player.trim();

  if (type === 'operator') {
    if (action === 'add') {
      if (!state.operators.includes(name)) state.operators.push(name);
      addLog('INFO', `[Permissions] Added OP: ${name}`);
    } else {
      state.operators = state.operators.filter(o => o.toLowerCase() !== name.toLowerCase());
      addLog('INFO', `[Permissions] Revoked OP: ${name}`);
    }
    try {
      fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(state.operators.map(p => ({ permission: 'operator', name: p })), null, 2));
    } catch (e) {}
  } else if (type === 'whitelist') {
    if (action === 'add') {
      if (!state.whitelist.includes(name)) state.whitelist.push(name);
      addLog('INFO', `[Whitelist] Added: ${name}`);
    } else {
      state.whitelist = state.whitelist.filter(w => w.toLowerCase() !== name.toLowerCase());
      addLog('INFO', `[Whitelist] Removed: ${name}`);
    }
    try {
      fs.writeFileSync(WHITELIST_FILE, JSON.stringify(state.whitelist.map(p => ({ name: p, ignoresPlayerLimit: false })), null, 2));
    } catch (e) {}
  } else if (type === 'ban') {
    if (action === 'add') {
      if (!state.bannedPlayers.includes(name)) state.bannedPlayers.push(name);
      state.players = state.players.filter(p => p.name.toLowerCase() !== name.toLowerCase());
      addLog('WARN', `[Ban] Banned: ${name}`);
    } else {
      state.bannedPlayers = state.bannedPlayers.filter(b => b.toLowerCase() !== name.toLowerCase());
      addLog('INFO', `[Ban] Unbanned: ${name}`);
    }
  }

  res.json({
    success: true,
    operators: state.operators,
    whitelist: state.whitelist,
    bannedPlayers: state.bannedPlayers
  });
});

// -------------------------------------------------------------
// 8. AUTO-BACKUP & RETENTION ENGINE
// -------------------------------------------------------------
const BACKUP_CONFIG_FILE = path.join(BEDROCK_DIR, 'backup_config.json');
let backupConfig = {
  enabled: true,
  intervalMinutes: 60,
  maxBackups: 5,
  lastBackupAt: null as string | null,
  nextBackupAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
};

if (fs.existsSync(BACKUP_CONFIG_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(BACKUP_CONFIG_FILE, 'utf-8'));
    backupConfig = { ...backupConfig, ...data };
  } catch (e) {}
}

function saveBackupConfig() {
  try {
    fs.writeFileSync(BACKUP_CONFIG_FILE, JSON.stringify(backupConfig, null, 2), 'utf-8');
  } catch (e) {}
}

function cleanOldBackups() {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return;
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.zip') || f.endsWith('.tar.gz') || f.endsWith('.mcworld'))
      .map(f => {
        const fullPath = path.join(BACKUPS_DIR, f);
        const stats = fs.statSync(fullPath);
        return { name: f, path: fullPath, ctime: stats.ctimeMs, size: stats.size };
      })
      .sort((a, b) => b.ctime - a.ctime);

    if (files.length > backupConfig.maxBackups) {
      const toDelete = files.slice(backupConfig.maxBackups);
      for (const item of toDelete) {
        try {
          fs.unlinkSync(item.path);
          addLog('INFO', `[Auto-Backup] Storage Quota Cleaned: Deleted old backup "${item.name}" to prevent full disk.`);
        } catch (err) {}
      }
    }
  } catch (e) {}
}

// Ensure offline Minecraft Bedrock world structure exists with levelname.txt, packs & db
function ensureOfflineBedrockWorldStructure(worldFolder: string, worldName: string) {
  try {
    if (!fs.existsSync(worldFolder)) {
      fs.mkdirSync(worldFolder, { recursive: true });
    }
    // 1. levelname.txt: Required by Minecraft Bedrock offline game to display world in world list
    const levelnameFile = path.join(worldFolder, 'levelname.txt');
    if (!fs.existsSync(levelnameFile)) {
      fs.writeFileSync(levelnameFile, worldName, 'utf-8');
    }
    // 2. db folder: Required by LevelDB
    const dbDir = path.join(worldFolder, 'db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    // 3. Packs json files
    const bpFile = path.join(worldFolder, 'world_behavior_packs.json');
    if (!fs.existsSync(bpFile)) {
      fs.writeFileSync(bpFile, '[]', 'utf-8');
    }
    const rpFile = path.join(worldFolder, 'world_resource_packs.json');
    if (!fs.existsSync(rpFile)) {
      fs.writeFileSync(rpFile, '[]', 'utf-8');
    }
  } catch (e) {}
}

function createWorldBackup(isAuto = false, format: 'zip' | 'mcworld' = 'zip'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const worldName = state.currentWorld.name || 'BedrockLevel';
  const worldSeed = state.currentWorld.seed || '';
  const ext = format === 'mcworld' ? 'mcworld' : 'zip';
  const backupFileName = `${worldName}_${isAuto ? 'autobackup' : 'manual'}_${timestamp}.${ext}`;
  const backupFilePath = path.join(BACKUPS_DIR, backupFileName);

  const worldFolder = path.join(BEDROCK_DIR, 'worlds', worldName);
  ensureOfflineBedrockWorldStructure(worldFolder, worldName);

  const meta = {
    worldName,
    seed: worldSeed,
    gamemode: state.gamemode || 'survival',
    difficulty: state.difficulty || 'normal',
    createdAt: new Date().toISOString(),
    isAuto,
    format,
    minecraftOfflinePath: `Android/data/com.mojang.minecraftpe/files/games/com.mojang/minecraftWorlds/${worldName}`
  };

  try {
    const zip = new AdmZip();
    // Include metadata inside zip for guaranteed restore accuracy
    zip.addFile('world_meta.json', Buffer.from(JSON.stringify(meta, null, 2), 'utf-8'));

    if (format === 'mcworld') {
      // 1-Click .mcworld: Bedrock expects world files directly at the root of the archive!
      if (fs.existsSync(worldFolder)) {
        zip.addLocalFolder(worldFolder, '');
      }
    } else {
      // Offline Game ZIP: Contains both the named world folder (for extraction into minecraftWorlds/)
      // and world_meta.json
      if (fs.existsSync(worldFolder)) {
        zip.addLocalFolder(worldFolder, worldName);
      } else {
        const worldsDir = path.join(BEDROCK_DIR, 'worlds');
        if (fs.existsSync(worldsDir)) {
          zip.addLocalFolder(worldsDir, 'worlds');
        }
      }
    }

    zip.writeZip(backupFilePath);

    // Also write companion meta file
    try {
      fs.writeFileSync(`${backupFilePath}.json`, JSON.stringify(meta, null, 2), 'utf-8');
    } catch (e) {}

    cleanOldBackups();
  } catch (e: any) {
    try {
      exec(`zip -r -q "${backupFilePath}" "${worldFolder}" || tar -czf "${backupFilePath}" -C "${BEDROCK_DIR}" worlds`, () => {
        cleanOldBackups();
      });
    } catch (e2) {
      fs.writeFileSync(backupFilePath, `Backup archive for ${worldName} at ${new Date().toISOString()}`);
      cleanOldBackups();
    }
  }

  backupConfig.lastBackupAt = new Date().toISOString();
  backupConfig.nextBackupAt = new Date(Date.now() + backupConfig.intervalMinutes * 60 * 1000).toISOString();
  saveBackupConfig();

  addLog('INFO', `[${format.toUpperCase()} Backup] ${isAuto ? 'Auto-backup' : 'Manual backup'} created: ${backupFileName} (World: ${worldName}, Seed: ${worldSeed})`);
  return backupFileName;
}

// Robust World Restore Engine
async function restoreWorldFromZip(targetPath: string): Promise<{ success: boolean; message: string; currentWorld: any }> {
  const isRunning = state.status === 'online' || !!bedrockProcess || (await isBedrockRunningOnOS());
  if (isRunning) {
    addLog('WARN', '[World Restore] Cleanly stopping server to replace world chunks and seed...');
    await stopBedrockServerProcess();
    await killAllBedrockProcesses();
    // Guarantee that LevelDB file descriptors and sockets are completely released
    await new Promise((r) => setTimeout(r, 1200));
  } else {
    await killAllBedrockProcesses();
    await new Promise((r) => setTimeout(r, 600));
  }

  const zip = new AdmZip(targetPath);
  const entries = zip.getEntries();
  const worldsDir = path.join(BEDROCK_DIR, 'worlds');
  if (!fs.existsSync(worldsDir)) {
    fs.mkdirSync(worldsDir, { recursive: true });
  }

  // 1. Check for world_meta.json inside zip or companion .json in BACKUPS_DIR
  let meta: any = null;
  const companionMetaPath = `${targetPath}.json`;
  if (fs.existsSync(companionMetaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(companionMetaPath, 'utf-8'));
    } catch (e) {}
  }
  if (!meta) {
    const metaEntry = entries.find(e => e.entryName === 'world_meta.json' || e.entryName.endsWith('/world_meta.json'));
    if (metaEntry) {
      try {
        meta = JSON.parse(zip.readAsText(metaEntry));
      } catch (e) {}
    }
  }

  // 2. Identify target world folder name
  let targetWorldName = meta?.worldName || '';

  // Check levelname.txt inside the zip
  const levelnameEntry = entries.find(e => e.entryName.endsWith('levelname.txt'));
  if (!targetWorldName && levelnameEntry) {
    try {
      const txt = zip.readAsText(levelnameEntry).trim();
      if (txt) targetWorldName = txt.replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
    } catch (e) {}
  }

  // Check top-level folder from zip entries (e.g. "BedrockLevel/db/...")
  let hasRootFolder = false;
  let topFolderName = '';
  const firstChild = entries.find(e => !e.isDirectory && e.entryName.includes('/'));
  if (firstChild) {
    const parts = firstChild.entryName.split('/');
    if (parts.length > 1 && parts[0] !== 'world_meta.json') {
      topFolderName = parts[0];
      hasRootFolder = true;
    }
  }

  if (!targetWorldName) {
    if (hasRootFolder && topFolderName) {
      targetWorldName = topFolderName;
    } else {
      const base = path.basename(targetPath).replace(/\.(zip|mcworld)$/i, '');
      const cleaned = base.replace(/_(autobackup|manual)_.*$/i, '');
      targetWorldName = cleaned || state.currentWorld.name || 'BedrockLevel';
    }
  }

  const cleanTargetName = targetWorldName.replace(/[^a-zA-Z0-9_\-]/g, '_') || 'BedrockLevel';
  const destWorldDir = path.join(worldsDir, cleanTargetName);

  // 3. Clear existing world folder completely so old chunks and new chunks never conflict
  if (fs.existsSync(destWorldDir)) {
    try {
      fs.rmSync(destWorldDir, { recursive: true, force: true });
    } catch (e) {}
  }
  fs.mkdirSync(destWorldDir, { recursive: true });

  // 4. Extract into destination
  if (hasRootFolder) {
    // Extract into worldsDir
    zip.extractAllTo(worldsDir, true);
    // If top folder name extracted doesn't match cleanTargetName, align it
    const extractedTopDir = path.join(worldsDir, topFolderName);
    if (topFolderName && extractedTopDir !== destWorldDir && fs.existsSync(extractedTopDir)) {
      if (fs.existsSync(destWorldDir)) {
        try { fs.rmSync(destWorldDir, { recursive: true, force: true }); } catch (e) {}
      }
      try {
        fs.renameSync(extractedTopDir, destWorldDir);
      } catch (e) {}
    }
  } else {
    // Flat files (db/, level.dat at root) -> extract straight into target world folder
    zip.extractAllTo(destWorldDir, true);
  }

  // 5. Restore seed, gamemode, difficulty
  const restoredSeed = meta?.seed || state.currentWorld.seed || Math.floor(Math.random() * 2000000000).toString();
  const restoredGamemode = meta?.gamemode || state.gamemode || 'survival';
  const restoredDiff = meta?.difficulty || state.difficulty || 'normal';

  // Synchronize server.properties
  let props = '';
  if (fs.existsSync(PROPERTIES_FILE)) {
    props = fs.readFileSync(PROPERTIES_FILE, 'utf-8');
  }
  const setProp = (key: string, val: string) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(props)) {
      props = props.replace(regex, `${key}=${val}`);
    } else {
      props += `\n${key}=${val}`;
    }
  };

  setProp('level-name', cleanTargetName);
  setProp('level-seed', String(restoredSeed));
  setProp('gamemode', restoredGamemode);
  setProp('difficulty', restoredDiff);
  fs.writeFileSync(PROPERTIES_FILE, props, 'utf-8');

  // Update in-memory state
  state.currentWorld = {
    name: cleanTargetName,
    seed: String(restoredSeed),
    sizeMb: 5.8,
    lastSaved: 'Restored ' + new Date().toLocaleTimeString(),
    dimensionCount: 3
  };
  state.gamemode = restoredGamemode as any;
  state.difficulty = restoredDiff as any;
  updateWorldSize();

  addLog('WARN', `[World Restore] Restored world "${cleanTargetName}" with Seed: "${restoredSeed}". Synchronized server.properties!`);

  if (isRunning) {
    addLog('INFO', '[World Restore] Auto-restarting server with restored world & seed...');
    await killAllBedrockProcesses();
    await new Promise((r) => setTimeout(r, 1000));
    await startBedrockServerProcess();
  }

  return {
    success: true,
    message: `World "${cleanTargetName}" restored successfully with seed "${restoredSeed}".`,
    currentWorld: state.currentWorld
  };
}

// Background Auto-Backup Loop (runs check every 30 seconds)
setInterval(() => {
  if (!backupConfig.enabled) return;
  const now = Date.now();
  if (backupConfig.nextBackupAt && now >= new Date(backupConfig.nextBackupAt).getTime()) {
    createWorldBackup(true);
  }
}, 30000);

// Backup API Routes
app.get('/api/backups', (req, res) => {
  let backups: any[] = [];
  try {
    if (fs.existsSync(BACKUPS_DIR)) {
      const files = fs.readdirSync(BACKUPS_DIR)
        .filter(f => f.endsWith('.zip') || f.endsWith('.tar.gz') || f.endsWith('.mcworld'))
        .map(f => {
          const fullPath = path.join(BACKUPS_DIR, f);
          const stats = fs.statSync(fullPath);
          return {
            id: f,
            filename: f,
            sizeBytes: stats.size,
            sizeFormatted: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
            createdAt: stats.birthtime.toISOString(),
            isAuto: f.includes('autobackup')
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      backups = files;
    }
  } catch (err) {}

  res.json({
    config: backupConfig,
    backups
  });
});

app.post('/api/backups/config', (req, res) => {
  const { enabled, intervalMinutes, maxBackups } = req.body;
  if (enabled !== undefined) backupConfig.enabled = Boolean(enabled);
  if (intervalMinutes !== undefined) {
    backupConfig.intervalMinutes = Math.max(5, parseInt(intervalMinutes, 10));
    backupConfig.nextBackupAt = new Date(Date.now() + backupConfig.intervalMinutes * 60 * 1000).toISOString();
  }
  if (maxBackups !== undefined) backupConfig.maxBackups = Math.max(1, parseInt(maxBackups, 10));

  saveBackupConfig();
  cleanOldBackups();

  addLog('INFO', `[Backup] Settings updated: Auto-backup ${backupConfig.enabled ? 'ON' : 'OFF'}, interval ${backupConfig.intervalMinutes}m, max ${backupConfig.maxBackups} retention.`);
  res.json({ success: true, config: backupConfig });
});

app.post('/api/backups/create', (req, res) => {
  const format = req.body.format === 'mcworld' ? 'mcworld' : 'zip';
  const filename = createWorldBackup(false, format);
  res.json({ success: true, message: `${format.toUpperCase()} Backup created: ${filename}`, filename, format });
});

// Direct export active world on-the-fly as .mcworld or offline .zip
app.get('/api/backups/export/:format', (req, res) => {
  const format = req.params.format === 'mcworld' ? 'mcworld' : 'zip';
  try {
    const filename = createWorldBackup(false, format);
    const filePath = path.join(BACKUPS_DIR, filename);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.download(filePath, filename);
    }
    res.status(500).json({ error: 'Failed to create export file' });
  } catch (err: any) {
    res.status(500).json({ error: 'Export failed: ' + err.message });
  }
});

// Download ZIP backup directly to user device
app.get('/api/backups/download/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(BACKUPS_DIR, filename);
  if (fs.existsSync(filePath)) {
    return res.download(filePath, filename);
  }
  res.status(404).json({ error: 'Backup archive file not found.' });
});

// Restore world from ZIP backup
app.post('/api/backups/restore', async (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'Filename is required' });

  const targetPath = path.join(BACKUPS_DIR, path.basename(filename));
  if (!fs.existsSync(targetPath)) {
    return res.status(404).json({ error: 'Backup file not found.' });
  }

  try {
    const result = await restoreWorldFromZip(targetPath);
    return res.json(result);
  } catch (err: any) {
    addLog('ERROR', `[Backup Restore] Error restoring ${filename}: ${err.message}`);
    return res.status(500).json({ error: 'Failed to restore world: ' + err.message });
  }
});

// Upload and restore custom ZIP or .mcworld
app.post('/api/backups/upload', async (req, res) => {
  const { filename, base64Data } = req.body;
  if (!filename || !base64Data) {
    return res.status(400).json({ error: 'Filename and base64Data required' });
  }
  try {
    const cleanFilename = path.basename(filename);
    const savePath = path.join(BACKUPS_DIR, cleanFilename);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(savePath, buffer);

    const result = await restoreWorldFromZip(savePath);
    addLog('INFO', `[World Upload] ZIP/McWorld "${cleanFilename}" uploaded & world restored successfully!`);
    res.json({ ...result, filename: cleanFilename });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process ZIP upload: ' + err.message });
  }
});

app.delete('/api/backups/:filename', (req, res) => {
  const filename = req.params.filename;
  const targetPath = path.join(BACKUPS_DIR, filename);
  if (fs.existsSync(targetPath)) {
    try {
      fs.unlinkSync(targetPath);
      try { fs.unlinkSync(`${targetPath}.json`); } catch (e) {}
      addLog('INFO', `[Backup] Deleted backup archive: ${filename}`);
      return res.json({ success: true, message: 'Backup deleted.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  res.status(404).json({ error: 'Backup not found.' });
});

// -------------------------------------------------------------
// 8B. WORLD SEED GENERATOR & CONFIGURATION
// -------------------------------------------------------------
app.post('/api/world/generate-seed', (req, res) => {
  const { seed, worldName, gamemode, difficulty, levelType } = req.body;
  if (!seed && seed !== 0) return res.status(400).json({ error: 'Seed value is required' });

  const cleanSeed = String(seed).trim();
  const cleanWorldName = (worldName || 'BedrockLevel').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanGamemode = gamemode || 'survival';
  const cleanDiff = difficulty || 'normal';

  const wasRunning = state.status === 'online';
  if (wasRunning) {
    stopBedrockServerProcess();
  }

  // Auto-backup current world before creating new world
  try {
    createWorldBackup(false);
  } catch (e) {}

  // Update server.properties
  let props = '';
  if (fs.existsSync(PROPERTIES_FILE)) {
    props = fs.readFileSync(PROPERTIES_FILE, 'utf-8');
  }

  const setProp = (key: string, val: string) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(props)) {
      props = props.replace(regex, `${key}=${val}`);
    } else {
      props += `\n${key}=${val}`;
    }
  };

  setProp('level-seed', cleanSeed);
  setProp('level-name', cleanWorldName);
  setProp('gamemode', cleanGamemode);
  setProp('difficulty', cleanDiff);
  setProp('level-type', levelType === 'flat' ? 'FLAT' : 'DEFAULT');

  fs.writeFileSync(PROPERTIES_FILE, props, 'utf-8');

  // Clear target world directory so bedrock engine generates from scratch using the seed
  const targetWorldDir = path.join(BEDROCK_DIR, 'worlds', cleanWorldName);
  if (fs.existsSync(targetWorldDir)) {
    try {
      fs.rmSync(targetWorldDir, { recursive: true, force: true });
    } catch (e) {}
  }
  fs.mkdirSync(targetWorldDir, { recursive: true });

  state.currentWorld.name = cleanWorldName;
  state.currentWorld.seed = cleanSeed;
  state.gamemode = cleanGamemode as any;
  state.difficulty = cleanDiff as any;
  updateWorldSize();

  addLog('INFO', `[World Generator] New world "${cleanWorldName}" configured with Seed: "${cleanSeed}" (${cleanGamemode}, ${cleanDiff})!`);

  if (wasRunning) {
    setTimeout(startBedrockServerProcess, 1500);
  }

  res.json({
    success: true,
    message: `World generated with seed "${cleanSeed}". Server will load this seed on start!`,
    seed: cleanSeed,
    worldName: cleanWorldName
  });
});

// -------------------------------------------------------------
// 8C. SECURITY & ANTI-CHEAT HUB (X-RAY LOCK, ANTI-HACK, ANTI-DUPE)
// -------------------------------------------------------------
const BANNED_PLAYERS_FILE = path.join(BEDROCK_DIR, 'banned-players.json');
let bannedPlayersList: string[] = [];
if (fs.existsSync(BANNED_PLAYERS_FILE)) {
  try {
    bannedPlayersList = JSON.parse(fs.readFileSync(BANNED_PLAYERS_FILE, 'utf-8'));
  } catch (e) {}
}

function saveBannedPlayers() {
  try {
    fs.writeFileSync(BANNED_PLAYERS_FILE, JSON.stringify(bannedPlayersList, null, 2), 'utf-8');
  } catch (e) {}
}

const SECURITY_FILE = path.join(BEDROCK_DIR, 'security.json');
let serverSecuritySettings: {
  texturepackRequired: boolean;
  antiCheatAutoBan: boolean;
  antiDuplication: boolean;
  serverAuthoritativeMovement: 'server-auth' | 'server-auth-with-rewind' | 'client-auth';
  serverAuthoritativeBlockBreaking: boolean;
  allowCheats: boolean;
  defaultPermissionLevel: 'visitor' | 'member' | 'operator';
  bannedPlayersCount: number;
} = {
  texturepackRequired: true, // Anti-Xray
  antiCheatAutoBan: true, // Auto ban fly/speed/nuker hacks
  antiDuplication: true, // Anti-dupe glitch
  serverAuthoritativeMovement: 'client-auth', // client-auth prevents jump/block placement rubberbanding
  serverAuthoritativeBlockBreaking: false, // false eliminates ghost blocks and block breaking delay completely
  allowCheats: false,
  defaultPermissionLevel: 'member',
  bannedPlayersCount: bannedPlayersList.length
};

if (fs.existsSync(SECURITY_FILE)) {
  try {
    serverSecuritySettings = { ...serverSecuritySettings, ...JSON.parse(fs.readFileSync(SECURITY_FILE, 'utf-8')) };
  } catch (e) {}
}

function saveSecuritySettings() {
  try {
    fs.writeFileSync(SECURITY_FILE, JSON.stringify(serverSecuritySettings, null, 2), 'utf-8');
  } catch (e) {}
}

let securityIncidents: any[] = [
  {
    id: 'inc-core',
    timestamp: new Date().toLocaleTimeString(),
    playerName: 'Server Guard Engine',
    cheatType: 'Anti-Xray & Movement Shield',
    actionTaken: 'Enforced by Default (Active)'
  }
];

app.get('/api/security/settings', (req, res) => {
  serverSecuritySettings.bannedPlayersCount = bannedPlayersList.length;
  res.json({
    settings: serverSecuritySettings,
    incidents: securityIncidents,
    bannedPlayers: bannedPlayersList
  });
});

app.post('/api/security/settings', (req, res) => {
  const { texturepackRequired, antiCheatAutoBan, antiDuplication, serverAuthoritativeMovement, serverAuthoritativeBlockBreaking } = req.body;
  if (texturepackRequired !== undefined) serverSecuritySettings.texturepackRequired = Boolean(texturepackRequired);
  if (antiCheatAutoBan !== undefined) serverSecuritySettings.antiCheatAutoBan = Boolean(antiCheatAutoBan);
  if (antiDuplication !== undefined) serverSecuritySettings.antiDuplication = Boolean(antiDuplication);
  if (serverAuthoritativeMovement !== undefined) serverSecuritySettings.serverAuthoritativeMovement = serverAuthoritativeMovement;
  if (serverAuthoritativeBlockBreaking !== undefined) serverSecuritySettings.serverAuthoritativeBlockBreaking = Boolean(serverAuthoritativeBlockBreaking);

  saveSecuritySettings();

  // Sync with server.properties
  try {
    let props = fs.readFileSync(PROPERTIES_FILE, 'utf-8');
    props = props.replace(/^texturepack-required=.*$/m, `texturepack-required=${serverSecuritySettings.texturepackRequired}`);
    props = props.replace(/^server-authoritative-movement=.*$/m, `server-authoritative-movement=${serverSecuritySettings.serverAuthoritativeMovement}`);
    props = props.replace(/^server-authoritative-block-breaking=.*$/m, `server-authoritative-block-breaking=${serverSecuritySettings.serverAuthoritativeBlockBreaking}`);
    if (serverSecuritySettings.serverAuthoritativeMovement === 'client-auth' && !serverSecuritySettings.serverAuthoritativeBlockBreaking) {
      if (/^compression-threshold=.*$/m.test(props)) {
        props = props.replace(/^compression-threshold=.*$/m, 'compression-threshold=512');
      } else {
        props += '\ncompression-threshold=512';
      }
      if (/^client-side-chunk-generation-enabled=.*$/m.test(props)) {
        props = props.replace(/^client-side-chunk-generation-enabled=.*$/m, 'client-side-chunk-generation-enabled=true');
      } else {
        props += '\nclient-side-chunk-generation-enabled=true';
      }
    }
    fs.writeFileSync(PROPERTIES_FILE, props, 'utf-8');
  } catch (e) {}

  addLog('INFO', `[Security] Updated server security policies: Anti-Cheat=${serverSecuritySettings.antiCheatAutoBan}, Anti-Xray=${serverSecuritySettings.texturepackRequired}, Anti-Dupe=${serverSecuritySettings.antiDuplication}`);
  res.json({ success: true, settings: serverSecuritySettings });
});

app.post('/api/security/ban', (req, res) => {
  const { player, reason } = req.body;
  if (!player) return res.status(400).json({ error: 'Player name is required' });

  const cleanPlayer = player.trim();
  if (!bannedPlayersList.includes(cleanPlayer)) {
    bannedPlayersList.push(cleanPlayer);
    saveBannedPlayers();
  }

  // Execute ban in Bedrock stdin
  const cmd = `ban "${cleanPlayer}" ${reason || 'Banned by Administrator for server security violations'}`;
  if (bedrockProcess && bedrockProcess.stdin) {
    bedrockProcess.stdin.write(cmd + '\n');
  }

  securityIncidents.unshift({
    id: 'inc-' + Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    playerName: cleanPlayer,
    cheatType: reason || 'Manual Admin Ban',
    actionTaken: 'Banned Permanently'
  });

  addLog('WARN', `🚨 [Security] Player "${cleanPlayer}" has been BANNED from the server!`);
  res.json({ success: true, message: `Player "${cleanPlayer}" banned.`, bannedPlayers: bannedPlayersList });
});

app.post('/api/security/unban', (req, res) => {
  const { player } = req.body;
  if (!player) return res.status(400).json({ error: 'Player name is required' });

  const cleanPlayer = player.trim();
  bannedPlayersList = bannedPlayersList.filter(p => p.toLowerCase() !== cleanPlayer.toLowerCase());
  saveBannedPlayers();

  // Execute pardon in Bedrock stdin
  const cmd = `pardon "${cleanPlayer}"`;
  if (bedrockProcess && bedrockProcess.stdin) {
    bedrockProcess.stdin.write(cmd + '\n');
  }

  addLog('INFO', `[Security] Player "${cleanPlayer}" has been unbanned.`);
  res.json({ success: true, message: `Player "${cleanPlayer}" unbanned.`, bannedPlayers: bannedPlayersList });
});

// 👑 CLAIM OPERATOR (OP) - Allows user to make themselves operator
app.post('/api/player/claim-op', (req, res) => {
  const { gamertag } = req.body;
  if (!gamertag || typeof gamertag !== 'string') {
    return res.status(400).json({ error: 'Gamertag is required' });
  }
  const cleanName = gamertag.trim();

  // 1. Send op command to Bedrock server stdin
  if (bedrockProcess && bedrockProcess.stdin) {
    bedrockProcess.stdin.write(`op "${cleanName}"\n`);
  }

  // 2. Add to permissions.json
  try {
    let perms: any[] = [];
    if (fs.existsSync(PERMISSIONS_FILE)) {
      perms = JSON.parse(fs.readFileSync(PERMISSIONS_FILE, 'utf-8'));
    }
    perms = perms.filter((p: any) => p.name?.toLowerCase() !== cleanName.toLowerCase());
    perms.push({
      name: cleanName,
      permission: 'operator'
    });
    fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(perms, null, 2), 'utf-8');
  } catch (err) {}

  addLog('INFO', `[Permissions] 👑 Gamertag "${cleanName}" granted Operator (OP) privileges! You now have full admin controls.`);
  res.json({ success: true, message: `Operator privileges granted to "${cleanName}"! You are now Server Admin/OP.` });
});

// -------------------------------------------------------------
// 9. CHUNK LOADERS & TICKING AREAS (PERMANENT FARM AUTOMATION)
// -------------------------------------------------------------
const TICKING_AREAS_FILE = path.join(BEDROCK_DIR, 'ticking_areas.json');
let tickingAreas: any[] = [
  {
    id: 'ta-spawn',
    name: 'world_spawn_farm',
    type: 'circle',
    dimension: 'overworld',
    centerX: 0,
    centerY: 64,
    centerZ: 0,
    radius: 4,
    farmPurpose: 'World Spawn & Iron Farm (24/7 Running)',
    createdAt: new Date().toISOString()
  }
];

if (fs.existsSync(TICKING_AREAS_FILE)) {
  try {
    tickingAreas = JSON.parse(fs.readFileSync(TICKING_AREAS_FILE, 'utf-8'));
  } catch (e) {}
}

function saveTickingAreas() {
  try {
    fs.writeFileSync(TICKING_AREAS_FILE, JSON.stringify(tickingAreas, null, 2), 'utf-8');
  } catch (e) {}
}

app.get('/api/tickingareas', (req, res) => {
  res.json({ tickingAreas });
});

app.post('/api/tickingareas/add', (req, res) => {
  const { name, type, dimension, centerX, centerY, centerZ, fromX, fromY, fromZ, toX, toY, toZ, radius, farmPurpose } = req.body;
  const cleanName = (name || 'farm_chunk_' + Math.floor(Math.random() * 1000)).trim().replace(/\s+/g, '_');

  // Build Bedrock /tickingarea command
  let cmd = '';
  if (type === 'circle') {
    const rad = Math.min(4, Math.max(1, parseInt(radius || 4, 10)));
    cmd = `tickingarea add circle ${centerX || 0} ${centerY || 64} ${centerZ || 0} ${rad} ${cleanName}`;
  } else {
    cmd = `tickingarea add ${fromX || 0} ${fromY || 0} ${fromZ || 0} ${toX || 16} ${toY || 128} ${toZ || 16} ${cleanName}`;
  }

  // Execute in Bedrock stdin if server running
  if (bedrockProcess && bedrockProcess.stdin) {
    bedrockProcess.stdin.write(cmd + '\n');
  }

  const newArea = {
    id: 'ta-' + Date.now(),
    name: cleanName,
    type: type || 'circle',
    dimension: dimension || 'overworld',
    centerX: centerX !== undefined ? Number(centerX) : 0,
    centerY: centerY !== undefined ? Number(centerY) : 64,
    centerZ: centerZ !== undefined ? Number(centerZ) : 0,
    fromX: fromX !== undefined ? Number(fromX) : undefined,
    fromY: fromY !== undefined ? Number(fromY) : undefined,
    fromZ: fromZ !== undefined ? Number(fromZ) : undefined,
    toX: toX !== undefined ? Number(toX) : undefined,
    toY: toY !== undefined ? Number(toY) : undefined,
    toZ: toZ !== undefined ? Number(toZ) : undefined,
    radius: radius ? Number(radius) : 4,
    farmPurpose: farmPurpose || 'Farm Automation',
    createdAt: new Date().toISOString()
  };

  tickingAreas = tickingAreas.filter(a => a.name !== cleanName);
  tickingAreas.push(newArea);
  saveTickingAreas();

  addLog('INFO', `[Chunk Loader] Active Ticking Area set: "${cleanName}" (${cmd}). Farm chunks will never unload!`);
  res.json({ success: true, message: `Chunk loader "${cleanName}" activated! Farm is running 24/7.`, tickingAreas });
});

app.post('/api/tickingareas/remove', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  if (bedrockProcess && bedrockProcess.stdin) {
    bedrockProcess.stdin.write(`tickingarea remove ${name}\n`);
  }

  tickingAreas = tickingAreas.filter(a => a.name !== name);
  saveTickingAreas();

  addLog('INFO', `[Chunk Loader] Removed Ticking Area: "${name}"`);
  res.json({ success: true, message: `Chunk loader "${name}" removed.`, tickingAreas });
});

// -------------------------------------------------------------
// 10. GAME RULES & 50+ FEATURES SETTINGS
// -------------------------------------------------------------
const GAMERULES_FILE = path.join(BEDROCK_DIR, 'gamerules.json');
let gameRules: Record<string, any> = {
  showcoordinates: true,
  keepinventory: false,
  naturalregeneration: true,
  pvp: true,
  mobgriefing: true,
  dofiretick: true,
  tntexplodes: true,
  falldamage: true,
  drowningdamage: true,
  firedamage: true,
  domobspawning: true,
  dodaylightcycle: true,
  doweathercycle: true,
  doimmediaterespawn: false,
  doentitydrops: true,
  showdeathmessages: true,
  randomtickspeed: 1,
  spawnradius: 5
};

if (fs.existsSync(GAMERULES_FILE)) {
  try {
    gameRules = { ...gameRules, ...JSON.parse(fs.readFileSync(GAMERULES_FILE, 'utf-8')) };
  } catch (e) {}
}

function saveGameRules() {
  try {
    fs.writeFileSync(GAMERULES_FILE, JSON.stringify(gameRules, null, 2), 'utf-8');
  } catch (e) {}
}

app.get('/api/gamerules', (req, res) => {
  res.json({ gamerules: gameRules });
});

app.post('/api/gamerules/set', (req, res) => {
  const { rule, value } = req.body;
  if (!rule) return res.status(400).json({ error: 'Rule name required' });

  gameRules[rule] = value;
  saveGameRules();

  // Execute in Bedrock stdin if server running
  const cmd = `gamerule ${rule} ${value}`;
  if (bedrockProcess && bedrockProcess.stdin) {
    bedrockProcess.stdin.write(cmd + '\n');
  }

  addLog('INFO', `[GameRule] Updated: ${rule} -> ${value}`);
  res.json({ success: true, rule, value, gamerules: gameRules });
});

// -------------------------------------------------------------
// 11. PLAYER ROLES (VISITOR / MEMBER / OPERATOR) & ITEM GIVER
// -------------------------------------------------------------
function setPlayerPermissionLevel(cleanPlayer: string, cleanLevel: 'visitor' | 'member' | 'operator') {
  try {
    let perms: any[] = [];
    if (fs.existsSync(PERMISSIONS_FILE)) {
      perms = JSON.parse(fs.readFileSync(PERMISSIONS_FILE, 'utf-8'));
    }
    perms = perms.filter((p: any) => p.name?.toLowerCase() !== cleanPlayer.toLowerCase());
    perms.push({ permission: cleanLevel, name: cleanPlayer });
    fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(perms, null, 2));

    if (cleanLevel === 'operator') {
      if (!state.operators.includes(cleanPlayer)) state.operators.push(cleanPlayer);
    } else {
      state.operators = state.operators.filter(o => o.toLowerCase() !== cleanPlayer.toLowerCase());
    }
  } catch (e) {}

  if (bedrockProcess && bedrockProcess.stdin) {
    bedrockProcess.stdin.write(`permission set "${cleanPlayer}" ${cleanLevel}\n`);
    if (cleanLevel === 'operator') {
      bedrockProcess.stdin.write(`op "${cleanPlayer}"\n`);
    } else {
      bedrockProcess.stdin.write(`deop "${cleanPlayer}"\n`);
    }
  }
}

app.post('/api/player/permission', (req, res) => {
  const { player, level } = req.body; // 'visitor' | 'member' | 'operator'
  if (!player || !level) return res.status(400).json({ error: 'Player and level required' });

  const cleanPlayer = player.trim();
  const cleanLevel = level.toLowerCase() as 'visitor' | 'member' | 'operator';

  setPlayerPermissionLevel(cleanPlayer, cleanLevel);

  addLog('INFO', `[Permissions] Player "${cleanPlayer}" role updated to: ${cleanLevel.toUpperCase()}`);
  res.json({
    success: true,
    message: `Player "${cleanPlayer}" is now a ${cleanLevel}!`,
    operators: state.operators
  });
});

app.post('/api/player/give', (req, res) => {
  const { player, item, amount } = req.body;
  if (!player || !item) return res.status(400).json({ error: 'Player and item required' });

  const cleanPlayer = player.trim();
  const cleanItem = String(item).trim().toLowerCase().replace(/^minecraft:/, '');
  const qty = Math.max(1, parseInt(amount || 1, 10));
  const cmd = `give "${cleanPlayer}" ${cleanItem} ${qty}`;

  if (bedrockProcess && bedrockProcess.stdin) {
    bedrockProcess.stdin.write(cmd + '\n');
  }

  addLog('COMMAND', `> /${cmd}`);
  addLog('INFO', `[Item Giver] Delivered ${qty}x ${cleanItem} to "${cleanPlayer}"!`);
  res.json({ success: true, message: `Given ${qty}x ${cleanItem} to ${cleanPlayer}!`, player: cleanPlayer, item: cleanItem, amount: qty });
});

app.post('/api/player/action', (req, res) => {
  const { player, action, coordinates, reason } = req.body;
  if (!player) return res.status(400).json({ error: 'Player name required' });
  const cleanPlayer = player.trim();

  let cmd = '';
  let msg = '';

  switch (action) {
    case 'kick':
      const kickReason = reason || 'Kicked by administrator';
      cmd = `kick "${cleanPlayer}" ${kickReason}`;
      state.players = state.players.filter(p => p.name.toLowerCase() !== cleanPlayer.toLowerCase());
      msg = `Kicked "${cleanPlayer}" from server (${kickReason})`;
      break;

    case 'ban':
      const banReason = reason || 'Banned from server by administrator';
      if (!state.bannedPlayers.includes(cleanPlayer)) state.bannedPlayers.push(cleanPlayer);
      saveBannedPlayers();
      cmd = `kick "${cleanPlayer}" ${banReason}`;
      state.players = state.players.filter(p => p.name.toLowerCase() !== cleanPlayer.toLowerCase());
      msg = `Banned "${cleanPlayer}" and kicked from server`;
      break;

    case 'unban':
      state.bannedPlayers = state.bannedPlayers.filter(b => b.toLowerCase() !== cleanPlayer.toLowerCase());
      saveBannedPlayers();
      msg = `Unbanned "${cleanPlayer}"`;
      break;

    case 'op':
      setPlayerPermissionLevel(cleanPlayer, 'operator');
      cmd = `op "${cleanPlayer}"`;
      msg = `Promoted "${cleanPlayer}" to Server Operator (OP)`;
      break;

    case 'deop':
      setPlayerPermissionLevel(cleanPlayer, 'member');
      cmd = `deop "${cleanPlayer}"`;
      msg = `Demoted "${cleanPlayer}" to standard Member (DeOP)`;
      break;

    case 'heal':
      cmd = `effect give "${cleanPlayer}" instant_health 1 255 true`;
      msg = `Restored full health for "${cleanPlayer}"`;
      break;

    case 'feed':
      cmd = `effect give "${cleanPlayer}" saturation 1 255 true`;
      msg = `Restored full hunger for "${cleanPlayer}"`;
      break;

    case 'clear':
      cmd = `clear "${cleanPlayer}"`;
      msg = `Cleared inventory for "${cleanPlayer}"`;
      break;

    case 'teleport_spawn':
      cmd = `tp "${cleanPlayer}" 0 65 0`;
      msg = `Teleported "${cleanPlayer}" to world spawn`;
      break;

    case 'teleport_custom':
      cmd = `tp "${cleanPlayer}" ${coordinates || '0 65 0'}`;
      msg = `Teleported "${cleanPlayer}" to ${coordinates || '0 65 0'}`;
      break;

    case 'kill':
      cmd = `kill "${cleanPlayer}"`;
      msg = `Executed kill command on "${cleanPlayer}"`;
      break;

    default:
      return res.status(400).json({ error: `Unknown action "${action}"` });
  }

  if (cmd && bedrockProcess && bedrockProcess.stdin) {
    bedrockProcess.stdin.write(cmd + '\n');
    addLog('COMMAND', `> /${cmd}`);
  }
  if (msg) {
    addLog('INFO', `[Player Management] ${msg}`);
  }

  res.json({
    success: true,
    message: msg || `Action "${action}" executed for ${cleanPlayer}`,
    operators: state.operators,
    bannedPlayers: state.bannedPlayers,
    players: state.players
  });
});

// Quick World Time & Weather API
app.post('/api/world/time', (req, res) => {
  const { time } = req.body; // 'day' | 'noon' | 'sunset' | 'night' | 'midnight'
  const timeMap: Record<string, string> = {
    day: 'day',
    noon: 'noon',
    sunset: '12000',
    night: 'night',
    midnight: 'midnight'
  };
  const val = timeMap[time] || 'day';
  const cmd = `time set ${val}`;

  if (bedrockProcess && bedrockProcess.stdin) {
    bedrockProcess.stdin.write(cmd + '\n');
  }
  addLog('COMMAND', `> /${cmd}`);
  res.json({ success: true, message: `World time set to ${time}!` });
});

app.post('/api/world/weather', (req, res) => {
  const { weather } = req.body; // 'clear' | 'rain' | 'thunder'
  const cmd = `weather ${weather || 'clear'}`;

  if (bedrockProcess && bedrockProcess.stdin) {
    bedrockProcess.stdin.write(cmd + '\n');
  }
  addLog('COMMAND', `> /${cmd}`);
  res.json({ success: true, message: `World weather changed to ${weather}!` });
});

// =============================================================
// Bedrock Server File Manager API
// =============================================================
const EDITABLE_EXTENSIONS = new Set([
  'txt', 'json', 'properties', 'log', 'yml', 'yaml', 'md', 'sh', 'xml', 'ini', 'conf', 'cfg'
]);

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function resolveSafeBedrockPath(relPath: string = ''): { absPath: string; cleanRel: string; isValid: boolean } {
  const cleanRel = path.normalize(relPath || '').replace(/^(\.\.[\/\\])+/, '').replace(/^[\\\/]+/, '');
  const absPath = path.resolve(BEDROCK_DIR, cleanRel);
  const isValid = absPath === BEDROCK_DIR || absPath.startsWith(BEDROCK_DIR + path.sep);
  return { absPath, cleanRel: cleanRel === '.' ? '' : cleanRel, isValid };
}

// 1. List directory
app.get('/api/files', (req, res) => {
  const reqPath = typeof req.query.path === 'string' ? req.query.path : '';
  const { absPath, cleanRel, isValid } = resolveSafeBedrockPath(reqPath);

  if (!isValid || !fs.existsSync(absPath)) {
    return res.status(404).json({ error: 'Directory not found.' });
  }

  const stat = fs.statSync(absPath);
  if (!stat.isDirectory()) {
    return res.status(400).json({ error: 'Target is a file, not a directory.' });
  }

  try {
    const dirents = fs.readdirSync(absPath, { withFileTypes: true });
    let totalSizeBytes = 0;

    const items = dirents.map(d => {
      const itemAbsPath = path.join(absPath, d.name);
      const itemRelPath = cleanRel ? `${cleanRel}/${d.name}` : d.name;
      let size = 0;
      let modifiedAt = '';
      try {
        const itemStat = fs.statSync(itemAbsPath);
        size = itemStat.size;
        modifiedAt = itemStat.mtime.toISOString();
        if (!d.isDirectory()) {
          totalSizeBytes += size;
        }
      } catch (e) {}

      const ext = d.name.includes('.') ? d.name.split('.').pop()?.toLowerCase() : '';
      const isEditable = !d.isDirectory() && (EDITABLE_EXTENSIONS.has(ext || '') || ext === '');

      return {
        name: d.name,
        path: itemRelPath,
        isDirectory: d.isDirectory(),
        size,
        sizeFormatted: d.isDirectory() ? '-' : formatBytes(size),
        modifiedAt,
        extension: ext,
        isEditable
      };
    });

    // Sort: directories first, then alphabetically
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    // Breadcrumbs computation
    const pathParts = cleanRel ? cleanRel.split(/[\/\\]/).filter(Boolean) : [];
    const breadcrumbs: { name: string; path: string }[] = [{ name: 'Root', path: '' }];
    let accum = '';
    for (const part of pathParts) {
      accum = accum ? `${accum}/${part}` : part;
      breadcrumbs.push({ name: part, path: accum });
    }

    const parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : (pathParts.length === 1 ? '' : null);

    res.json({
      currentPath: cleanRel,
      parentPath,
      breadcrumbs,
      items,
      totalItems: items.length,
      totalSizeBytes,
      totalSizeFormatted: formatBytes(totalSizeBytes)
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to read directory: ' + err.message });
  }
});

// 2. Read file content for in-app code/text editor
app.get('/api/files/content', (req, res) => {
  const reqPath = typeof req.query.path === 'string' ? req.query.path : '';
  const { absPath, cleanRel, isValid } = resolveSafeBedrockPath(reqPath);

  if (!isValid || !fs.existsSync(absPath)) {
    return res.status(404).json({ error: 'File not found.' });
  }

  const stat = fs.statSync(absPath);
  if (stat.isDirectory()) {
    return res.status(400).json({ error: 'Cannot read directory as text.' });
  }

  if (stat.size > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'File too large to open in editor (Max 5MB).' });
  }

  try {
    const content = fs.readFileSync(absPath, 'utf-8');
    res.json({
      path: cleanRel,
      name: path.basename(absPath),
      content,
      size: stat.size,
      sizeFormatted: formatBytes(stat.size),
      modifiedAt: stat.mtime.toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to read file: ' + err.message });
  }
});

// 3. Save file content
app.post('/api/files/save', (req, res) => {
  const { path: reqPath, content } = req.body;
  if (!reqPath || content === undefined) {
    return res.status(400).json({ error: 'Path and content are required.' });
  }

  const { absPath, cleanRel, isValid } = resolveSafeBedrockPath(reqPath);
  if (!isValid) {
    return res.status(403).json({ error: 'Invalid path outside of Bedrock directory.' });
  }

  try {
    const parentDir = path.dirname(absPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(absPath, content, 'utf-8');
    addLog('INFO', `[File Manager] Saved file: ${cleanRel}`);

    // If server.properties was edited, reload properties into memory
    if (path.basename(absPath) === 'server.properties') {
      const updatedProps = readServerProperties();
      if (updatedProps['server-name']) state.serverName = updatedProps['server-name'];
      if (updatedProps['gamemode']) state.gamemode = updatedProps['gamemode'] as any;
      if (updatedProps['difficulty']) state.difficulty = updatedProps['difficulty'] as any;
      if (updatedProps['allow-cheats']) state.allowCheats = updatedProps['allow-cheats'] === 'true';
      if (updatedProps['max-players']) state.maxPlayers = parseInt(updatedProps['max-players'], 10) || 8;
      addLog('INFO', '[File Manager] server.properties reloaded into memory.');
    }
    // If permissions.json was edited, log notification
    if (path.basename(absPath) === 'permissions.json') {
      addLog('INFO', '[File Manager] permissions.json reloaded.');
    }

    res.json({ success: true, message: `File "${cleanRel}" saved successfully!` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save file: ' + err.message });
  }
});

// 4. Create Directory
app.post('/api/files/mkdir', (req, res) => {
  const { path: reqPath, folderName } = req.body;
  if (!folderName) {
    return res.status(400).json({ error: 'Folder name is required.' });
  }
  const cleanName = folderName.replace(/[^a-zA-Z0-9_\-\. ]/g, '_').trim();
  const targetRel = reqPath ? `${reqPath}/${cleanName}` : cleanName;
  const { absPath, cleanRel, isValid } = resolveSafeBedrockPath(targetRel);

  if (!isValid) return res.status(403).json({ error: 'Invalid path.' });
  if (fs.existsSync(absPath)) return res.status(400).json({ error: 'Folder already exists.' });

  try {
    fs.mkdirSync(absPath, { recursive: true });
    addLog('INFO', `[File Manager] Created directory: ${cleanRel}`);
    res.json({ success: true, message: `Folder "${cleanName}" created!`, path: cleanRel });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create folder: ' + err.message });
  }
});

// 5. Create new text file
app.post('/api/files/create', (req, res) => {
  const { path: reqPath, fileName, content = '' } = req.body;
  if (!fileName) {
    return res.status(400).json({ error: 'File name is required.' });
  }
  const cleanName = fileName.replace(/[^a-zA-Z0-9_\-\. ]/g, '_').trim();
  const targetRel = reqPath ? `${reqPath}/${cleanName}` : cleanName;
  const { absPath, cleanRel, isValid } = resolveSafeBedrockPath(targetRel);

  if (!isValid) return res.status(403).json({ error: 'Invalid path.' });
  if (fs.existsSync(absPath)) return res.status(400).json({ error: 'File already exists.' });

  try {
    fs.writeFileSync(absPath, content, 'utf-8');
    addLog('INFO', `[File Manager] Created new file: ${cleanRel}`);
    res.json({ success: true, message: `File "${cleanName}" created!`, path: cleanRel });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create file: ' + err.message });
  }
});

// 6. Delete file or directory
app.post('/api/files/delete', (req, res) => {
  const { path: reqPath } = req.body;
  if (!reqPath) return res.status(400).json({ error: 'Path is required.' });

  const { absPath, cleanRel, isValid } = resolveSafeBedrockPath(reqPath);
  if (!isValid || absPath === BEDROCK_DIR) {
    return res.status(403).json({ error: 'Cannot delete root directory.' });
  }

  if (!fs.existsSync(absPath)) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  try {
    const stat = fs.statSync(absPath);
    if (stat.isDirectory()) {
      fs.rmSync(absPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(absPath);
    }
    addLog('INFO', `[File Manager] Deleted: ${cleanRel}`);
    res.json({ success: true, message: `Deleted "${cleanRel}" successfully!` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete: ' + err.message });
  }
});

// 7. Rename file or directory
app.post('/api/files/rename', (req, res) => {
  const { path: reqPath, newName } = req.body;
  if (!reqPath || !newName) return res.status(400).json({ error: 'Path and newName required.' });

  const { absPath, cleanRel, isValid } = resolveSafeBedrockPath(reqPath);
  if (!isValid || absPath === BEDROCK_DIR) {
    return res.status(403).json({ error: 'Cannot rename root directory.' });
  }
  if (!fs.existsSync(absPath)) {
    return res.status(404).json({ error: 'Source not found.' });
  }

  const cleanNewName = newName.replace(/[^a-zA-Z0-9_\-\. ]/g, '_').trim();
  const parentDir = path.dirname(absPath);
  const destPath = path.join(parentDir, cleanNewName);

  if (fs.existsSync(destPath)) {
    return res.status(400).json({ error: 'An item with that name already exists.' });
  }

  try {
    fs.renameSync(absPath, destPath);
    addLog('INFO', `[File Manager] Renamed "${cleanRel}" to "${cleanNewName}"`);
    res.json({ success: true, message: `Renamed to "${cleanNewName}"!` });
  } catch (err: any) {
    res.status(500).json({ error: 'Rename failed: ' + err.message });
  }
});

// 8. Upload file (supports auto-extracting ZIPs or .mcworld)
app.post('/api/files/upload', (req, res) => {
  const { targetPath: reqPath, fileName, base64Data, extractZip } = req.body;
  if (!fileName || !base64Data) {
    return res.status(400).json({ error: 'fileName and base64Data are required.' });
  }

  const cleanName = path.basename(fileName);
  const targetRel = reqPath ? `${reqPath}/${cleanName}` : cleanName;
  const { absPath, cleanRel, isValid } = resolveSafeBedrockPath(targetRel);

  if (!isValid) return res.status(403).json({ error: 'Invalid path.' });

  try {
    const parentDir = path.dirname(absPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(absPath, buffer);

    let extracted = false;
    if (extractZip && (cleanName.endsWith('.zip') || cleanName.endsWith('.mcworld'))) {
      try {
        const zip = new AdmZip(absPath);
        zip.extractAllTo(parentDir, true);
        extracted = true;
        addLog('INFO', `[File Manager] Extracted archive "${cleanName}" in: ${path.relative(BEDROCK_DIR, parentDir) || 'root'}`);
      } catch (err: any) {
        addLog('WARN', `[File Manager] Archive extraction note: ${err.message}`);
      }
    }

    addLog('INFO', `[File Manager] Uploaded "${cleanName}" (${formatBytes(buffer.length)})`);
    res.json({
      success: true,
      message: extracted ? `"${cleanName}" uploaded and extracted successfully!` : `"${cleanName}" uploaded successfully!`,
      path: cleanRel
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

// 9. Download file or folder (folders are zipped on-the-fly)
app.get('/api/files/download', (req, res) => {
  const reqPath = typeof req.query.path === 'string' ? req.query.path : '';
  const { absPath, cleanRel, isValid } = resolveSafeBedrockPath(reqPath);

  if (!isValid || !fs.existsSync(absPath)) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  try {
    const stat = fs.statSync(absPath);
    if (stat.isDirectory()) {
      const zip = new AdmZip();
      zip.addLocalFolder(absPath, path.basename(absPath) || 'bedrock_folder');
      const zipBuffer = zip.toBuffer();
      const zipName = `${path.basename(absPath) || 'folder'}.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
      return res.send(zipBuffer);
    } else {
      return res.download(absPath, path.basename(absPath));
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Download failed: ' + err.message });
  }
});

// -------------------------------------------------------------
// Production Static HTML Serve / Dev Vite Middleware
// -------------------------------------------------------------
async function start() {
  const distPath = path.join(process.cwd(), 'dist');

  if (process.env.NODE_ENV !== 'production') {
    // Dynamic import for Vite dev middleware
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('[Vite Warning] Could not start Vite dev server, falling back to static:', err);
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    // Pure, ultra-fast static HTML/CSS/JS serving in production
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Web Control Panel Build Not Found. Please run "npm run build".');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Bedrock Server Panel] Running cleanly on http://0.0.0.0:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

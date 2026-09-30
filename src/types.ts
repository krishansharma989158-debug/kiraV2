export interface Player {
  name: string;
  xuid: string;
  ping: number;
  joinedAt: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'COMMAND';
  message: string;
}

export interface ServerData {
  status: 'online' | 'offline' | 'starting' | 'stopping';
  serverName: string;
  version: string;
  bedrockPort: number;
  uptimeSeconds: number;
  tps: number;
  cpuPercent: number;
  ramUsageMb: number;
  maxRamMb: number;
  playerCount: number;
  maxPlayers: number;
  players: Player[];
  gamemode: 'survival' | 'creative' | 'adventure';
  difficulty: 'peaceful' | 'easy' | 'normal' | 'hard';
  allowCheats: boolean;
  onlineMode: boolean;
  whitelistEnabled: boolean;
  viewDistance?: number;
  tickDistance?: number;
  playerIdleTimeout?: number;
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
  desktopUrl: string;
  railwayDomain: string;
  texturePackRequired?: boolean;
  activeVersion?: string;
  availableVersions?: string[];
  isDesynced?: boolean;
  hasProcHandle?: boolean;
  isNativeBinaryRunning?: boolean;
  fastBlockMode?: boolean;
  lagAlert?: boolean;
  lagSeverity?: 'smooth' | 'moderate' | 'critical';
  mobAnimationStatus?: 'smooth' | 'stuttering' | 'glitched';
}

export interface PlayerChunkIssue {
  playerName: string;
  ping: number;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  suggestedFix: string;
  lastChecked: string;
}

export interface LagStatus {
  tps: number;
  lagSeverity: 'smooth' | 'moderate' | 'critical';
  mobAnimationStatus: 'smooth' | 'stuttering' | 'glitched';
  lastLagWarningTime: string | null;
  autoLagMitigation: boolean;
  autoBroadcastWarning: boolean;
  strayItemCountEst: number;
  viewDistance: number;
  tickDistance: number;
  activeTickingAreas: number;
  playerChunkIssues: PlayerChunkIssue[];
  recentIncidents: {
    id: string;
    timestamp: string;
    type: 'tps_drop' | 'mob_animation_stutter' | 'chunk_overload' | 'player_chunk_desync';
    message: string;
    actionTaken: string;
  }[];
}

export interface ServerProperties {
  serverName: string;
  gamemode: string;
  difficulty: string;
  allowCheats: boolean;
  texturePackRequired?: boolean;
  maxPlayers: number;
  onlineMode: boolean;
  whitelistEnabled: boolean;
  viewDistance: number;
  tickDistance: number;
  playerIdleTimeout: number;
  bedrockPort: number;
  fastBlockMode?: boolean;
}

export interface VersionInfo {
  currentVersion: string;
  availableVersions: string[];
  lastUpdated?: string;
  status?: string;
}

export interface BackupItem {
  id: string;
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  isAuto: boolean;
}

export interface BackupConfig {
  enabled: boolean;
  intervalMinutes: number; // e.g. 15, 30, 60, 120, 360, 720, 1440
  maxBackups: number; // Auto-rotate: keep only last N backups to save storage
  lastBackupAt: string | null;
  nextBackupAt: string | null;
}

export interface TickingArea {
  id: string;
  name: string;
  type: 'box' | 'circle';
  dimension: 'overworld' | 'nether' | 'the_end';
  fromX?: number;
  fromY?: number;
  fromZ?: number;
  toX?: number;
  toY?: number;
  toZ?: number;
  centerX?: number;
  centerY?: number;
  centerZ?: number;
  radius?: number; // 1-4 chunks
  farmPurpose?: string; // e.g. 'Iron Farm', 'Mob Grinder', 'Crops', 'Custom'
  createdAt: string;
}

export interface GameRuleSetting {
  id: string;
  name: string;
  category: 'gameplay' | 'drops' | 'spawning' | 'damage' | 'world';
  description: string;
  value: boolean | number;
  type: 'boolean' | 'number';
  command: string;
}

export interface SecuritySettings {
  texturepackRequired: boolean;
  antiCheatAutoBan: boolean;
  antiDuplication: boolean;
  serverAuthoritativeMovement: 'server-auth' | 'server-auth-with-rewind' | 'client-auth';
  serverAuthoritativeBlockBreaking: boolean;
  allowCheats: boolean;
  defaultPermissionLevel: 'visitor' | 'member' | 'operator';
  bannedPlayersCount: number;
}

export interface SecurityIncident {
  id: string;
  timestamp: string;
  playerName: string;
  cheatType: string;
  actionTaken: string;
}

export interface WorldGenConfig {
  seed: string;
  worldName: string;
  gamemode: 'survival' | 'creative' | 'adventure';
  difficulty: 'peaceful' | 'easy' | 'normal' | 'hard';
  levelType: 'default' | 'flat';
}

export interface FileBreadcrumb {
  name: string;
  path: string;
}

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  sizeFormatted: string;
  modifiedAt: string;
  extension?: string;
  isEditable?: boolean;
}

export interface DirectoryResponse {
  currentPath: string;
  parentPath: string | null;
  breadcrumbs: FileBreadcrumb[];
  items: FileItem[];
  totalItems: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
}

export interface BaseClaim {
  id: string;
  ownerGamertag: string;
  baseName: string;
  centerX: number;
  centerY: number;
  centerZ: number;
  radius: number; // e.g. 300 blocks
  actionOnTrespass: 'visitor' | 'kill' | 'teleport_spawn';
  trustedMembers: string[];
  createdAt: string;
  active: boolean;
  locked?: boolean; // When true: unbreakable by player, only admin can remove from panel
  placedBlockType?: string; // Standard single Protection Block ('lodestone')
}

export interface BaseProtectionConfig {
  enabled: boolean;
  defaultRadius: number; // 300
  defaultAction: 'visitor' | 'kill' | 'teleport_spawn';
  autoRestoreMemberOnExit: boolean;
  coreItem?: string;
  autoGiveCoreToNewPlayers?: boolean;
}

export interface TeleportStation {
  id: string;
  name: string;
  type: 'player' | 'coordinate' | 'spawn' | 'arena';
  targetPlayer?: string;
  x?: number;
  y?: number;
  z?: number;
  commandSnippet: string;
  buttonColor: string;
  createdAt: string;
}



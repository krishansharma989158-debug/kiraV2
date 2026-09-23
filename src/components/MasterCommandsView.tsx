import React, { useState } from 'react';
import {
  Terminal,
  Search,
  Copy,
  Check,
  Play,
  RotateCw,
  Shield,
  Eye,
  Zap,
  Users,
  Radio,
  Clock,
  Compass,
  Database,
  Sliders,
  AlertTriangle,
  Lock,
  Flame,
  VolumeX,
  UserCheck,
  Send,
  Sparkles,
  Info
} from 'lucide-react';

interface CommandDef {
  id: string;
  category: string;
  categoryIndex: number;
  command: string;
  usage: string;
  description: string;
  hindiDescription: string;
  danger?: boolean;
  params?: {
    name: string;
    placeholder: string;
    defaultValue?: string;
  }[];
}

const MASTER_55_COMMANDS: CommandDef[] = [
  // [ 1. EMERGENCY RESET & SETUP ]
  {
    id: 'resetserver-warn',
    category: '1. Emergency Reset',
    categoryIndex: 1,
    command: '/resetserver',
    usage: '/resetserver',
    description: 'Server files wipe and fresh setup warning message.',
    hindiDescription: 'Galat command ya crash par reset warning aur confirmation maangta hai.',
    danger: true
  },
  {
    id: 'resetserver-confirm',
    category: '1. Emergency Reset',
    categoryIndex: 1,
    command: '/resetserver CONFIRM',
    usage: '/resetserver CONFIRM',
    description: 'Completely wipe server & old Playit tunnel tokens, fresh install.',
    hindiDescription: 'Poora server aur purane Playit tunnel tokens delete karke fresh install karna.',
    danger: true
  },

  // [ 2. FARM CHUNK LOADER (24/7 ALWAYS LOADED) ]
  {
    id: 'loadchunk',
    category: '2. Farm Chunk Loader',
    categoryIndex: 2,
    command: '/loadchunk',
    usage: '/loadchunk <X> <Z> <radius> [name]',
    description: 'Keep farm chunks loaded 24/7 without requiring players to stay nearby.',
    hindiDescription: 'Farm ke center coordinates aur radius se chunks ko background me 24/7 load rakhna.',
    params: [
      { name: 'X', placeholder: 'X (e.g. 100)', defaultValue: '100' },
      { name: 'Z', placeholder: 'Z (e.g. 200)', defaultValue: '200' },
      { name: 'radius', placeholder: 'Radius chunks (1-4)', defaultValue: '2' },
      { name: 'name', placeholder: 'Farm Name', defaultValue: 'iron_farm' }
    ]
  },
  {
    id: 'chunklist',
    category: '2. Farm Chunk Loader',
    categoryIndex: 2,
    command: '/chunklist',
    usage: '/chunklist',
    description: 'List all active 24/7 ticking area loaded farm chunks.',
    hindiDescription: 'Server me chal rahe sabhi ticking areas/farms ki coordinates aur dimensions dekhna.'
  },
  {
    id: 'removechunk',
    category: '2. Farm Chunk Loader',
    categoryIndex: 2,
    command: '/removechunk',
    usage: '/removechunk <name>',
    description: 'Remove a specific loaded farm chunk area.',
    hindiDescription: 'Kisi specific loaded farm area ko unregister/stop karna.',
    params: [
      { name: 'name', placeholder: 'Farm Area Name', defaultValue: 'iron_farm' }
    ]
  },
  {
    id: 'removeallchunks',
    category: '2. Farm Chunk Loader',
    categoryIndex: 2,
    command: '/removeallchunks',
    usage: '/removeallchunks',
    description: 'Stop all background chunk loaders to save RAM and CPU.',
    hindiDescription: 'Sabhi loaded farm ticking areas ko ek saath stop karke RAM/CPU bachana.'
  },

  // [ 3. SURVEILLANCE & AUTO-BAN ]
  {
    id: 'spy',
    category: '3. Surveillance & Auto-Ban',
    categoryIndex: 3,
    command: '/spy',
    usage: '/spy <player>',
    description: 'Activate real-time speed, fly, exploit and dupe scanning on player.',
    hindiDescription: 'Player ke movement, fly hack, aur dupe suspicious activity par real-time scanner on karna.',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' }
    ]
  },
  {
    id: 'unspy',
    category: '3. Surveillance & Auto-Ban',
    categoryIndex: 3,
    command: '/unspy',
    usage: '/unspy <player>',
    description: 'Deactivate surveillance scanner from player.',
    hindiDescription: 'Player se surveillance scanner deactivate karna.',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' }
    ]
  },
  {
    id: 'spylist',
    category: '3. Surveillance & Auto-Ban',
    categoryIndex: 3,
    command: '/spylist',
    usage: '/spylist',
    description: 'Show all players currently being surveilled.',
    hindiDescription: 'Kaun-kaun se players par active scanner monitor kar raha hai unki list dekhna.'
  },
  {
    id: 'banlist',
    category: '3. Surveillance & Auto-Ban',
    categoryIndex: 3,
    command: '/banlist',
    usage: '/banlist',
    description: 'View list of all banned players and reasons.',
    hindiDescription: 'Server se ban hue sabhi hackers aur rule breakers ki list reason ke sath.'
  },

  // [ 4. ANTI-CHEAT & SECURITY HARDENING ]
  {
    id: 'propertyprotection',
    category: '4. Anti-Cheat & Security',
    categoryIndex: 4,
    command: '/propertyprotection',
    usage: '/propertyprotection <on|off>',
    description: 'Block world griefing and unauthorized block breaking/placing.',
    hindiDescription: 'Spawn aur world me bina permission block break ya place karna block karna.',
    params: [
      { name: 'state', placeholder: 'on or off', defaultValue: 'on' }
    ]
  },
  {
    id: 'chestlock',
    category: '4. Anti-Cheat & Security',
    categoryIndex: 4,
    command: '/chestlock',
    usage: '/chestlock <on|off>',
    description: 'Prevent other players from stealing chests, barrels, and hoppers.',
    hindiDescription: 'Chest aur storage containers ko unauthorized loot hone se bachana.',
    params: [
      { name: 'state', placeholder: 'on or off', defaultValue: 'on' }
    ]
  },
  {
    id: 'antixray',
    category: '4. Anti-Cheat & Security',
    categoryIndex: 4,
    command: '/antixray',
    usage: '/antixray <on|off>',
    description: 'Force server texture pack to block transparent X-ray resource packs.',
    hindiDescription: 'Transparent X-ray texture pack lagana block karna taaki koi ores na dekh sake.',
    params: [
      { name: 'state', placeholder: 'on or off', defaultValue: 'on' }
    ]
  },
  {
    id: 'speedhackprotection',
    category: '4. Anti-Cheat & Security',
    categoryIndex: 4,
    command: '/speedhackprotection',
    usage: '/speedhackprotection <on|off>',
    description: 'Server authoritative movement rewind to cancel speed/fly hacks.',
    hindiDescription: 'Speedhack aur illegal fast movement ko server rewind se cancel karna.',
    params: [
      { name: 'state', placeholder: 'on or off', defaultValue: 'on' }
    ]
  },

  // [ 5. PLAYER PUNISHMENT & FREEZE ]
  {
    id: 'freeze',
    category: '5. Punishment & Freeze',
    categoryIndex: 5,
    command: '/freeze',
    usage: '/freeze <player>',
    description: 'Completely freeze a player in place with max slowness & jump lock.',
    hindiDescription: 'Player ko ek jagah freeze kar dena taaki wo move ya bhaag na sake.',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' }
    ]
  },
  {
    id: 'unfreeze',
    category: '5. Punishment & Freeze',
    categoryIndex: 5,
    command: '/unfreeze',
    usage: '/unfreeze <player>',
    description: 'Unfreeze a player and restore normal movement.',
    hindiDescription: 'Player ka freeze hatana aur normal movement restore karna.',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' }
    ]
  },
  {
    id: 'mute',
    category: '5. Punishment & Freeze',
    categoryIndex: 5,
    command: '/mute',
    usage: '/mute <player>',
    description: 'Mute player from typing in in-game chat.',
    hindiDescription: 'Player ka in-game chat mute karna (spam ya abusive language rokne ke liye).',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' }
    ]
  },
  {
    id: 'unmute',
    category: '5. Punishment & Freeze',
    categoryIndex: 5,
    command: '/unmute',
    usage: '/unmute <player>',
    description: 'Unmute player to restore chat abilities.',
    hindiDescription: 'Mute hatana taaki player dobara chat kar sake.',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' }
    ]
  },
  {
    id: 'kill',
    category: '5. Punishment & Freeze',
    categoryIndex: 5,
    command: '/kill',
    usage: '/kill <player>',
    description: 'Instantly eliminate a player from server.',
    hindiDescription: 'Kisi player ko instantly eliminate karna.',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' }
    ]
  },
  {
    id: 'clearinv',
    category: '5. Punishment & Freeze',
    categoryIndex: 5,
    command: '/clearinv',
    usage: '/clearinv <player>',
    description: 'Wipe all items from player inventory (removes duped items).',
    hindiDescription: 'Player ka poora inventory clear karna (hacked ya duped items hatane ke liye).',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' }
    ]
  },

  // [ 6. ROLES & MODERATION ]
  {
    id: 'players',
    category: '6. Roles & Moderation',
    categoryIndex: 6,
    command: '/players',
    usage: '/players',
    description: 'List all currently connected online players and roles.',
    hindiDescription: 'Server me online sabhi players ki list aur unke roles dekhna.'
  },
  {
    id: 'visitor',
    category: '6. Roles & Moderation',
    categoryIndex: 6,
    command: '/visitor',
    usage: '/visitor <player>',
    description: 'Set player role to Visitor (cannot break or place any blocks).',
    hindiDescription: 'Player ko Visitor banana (sirf ghoom sakta hai, kuch tod ya rakh nahi sakta).',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' }
    ]
  },
  {
    id: 'member',
    category: '6. Roles & Moderation',
    categoryIndex: 6,
    command: '/member',
    usage: '/member <player>',
    description: 'Set player role to standard Member (normal survival permissions).',
    hindiDescription: 'Player ko standard Member banana (normal survival gameplay).',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' }
    ]
  },
  {
    id: 'op',
    category: '6. Roles & Moderation',
    categoryIndex: 6,
    command: '/op',
    usage: '/op <player>',
    description: 'Grant Operator (full admin command access) to player.',
    hindiDescription: 'Player ko Operator (admin) banana taaki wo server commands chala sake.',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' }
    ]
  },
  {
    id: 'deop',
    category: '6. Roles & Moderation',
    categoryIndex: 6,
    command: '/deop',
    usage: '/deop <player>',
    description: 'Revoke Operator rights from player.',
    hindiDescription: 'Player se Operator (admin) rights wapas lena.',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' }
    ]
  },
  {
    id: 'kick',
    category: '6. Roles & Moderation',
    categoryIndex: 6,
    command: '/kick',
    usage: '/kick <player> [reason]',
    description: 'Disconnect player from the server session.',
    hindiDescription: 'Player ko server se disconnect/kick karna.',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' },
      { name: 'reason', placeholder: 'Reason', defaultValue: 'Rule violation' }
    ]
  },
  {
    id: 'ban',
    category: '6. Roles & Moderation',
    categoryIndex: 6,
    command: '/ban',
    usage: '/ban <player> [reason]',
    description: 'Permanently ban player from reconnecting to server.',
    hindiDescription: 'Player ko permanently ban karna taaki wo dobara server join na kar sake.',
    danger: true,
    params: [
      { name: 'player', placeholder: 'Player Gamertag' },
      { name: 'reason', placeholder: 'Reason', defaultValue: 'Hacking / Duplication' }
    ]
  },
  {
    id: 'unban',
    category: '6. Roles & Moderation',
    categoryIndex: 6,
    command: '/unban',
    usage: '/unban <player>',
    description: 'Unban player and allow them to join server again.',
    hindiDescription: 'Banned player ko maaf karke unban karna.',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' }
    ]
  },

  // [ 7. TELEPORT, GIVE & WHITELIST ]
  {
    id: 'tp',
    category: '7. Teleport, Give & Whitelist',
    categoryIndex: 7,
    command: '/tp',
    usage: '/tp <player1> <player2>',
    description: 'Teleport player 1 directly to player 2.',
    hindiDescription: 'Ek player ko doosre player ke paas teleport karna.',
    params: [
      { name: 'player1', placeholder: 'Player 1' },
      { name: 'player2', placeholder: 'Player 2' }
    ]
  },
  {
    id: 'tpxyz',
    category: '7. Teleport, Give & Whitelist',
    categoryIndex: 7,
    command: '/tpxyz',
    usage: '/tpxyz <player> <x> <y> <z>',
    description: 'Teleport player to specific exact coordinates.',
    hindiDescription: 'Player ko specific coordinates (X Y Z) par teleport karna.',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' },
      { name: 'x', placeholder: 'X', defaultValue: '0' },
      { name: 'y', placeholder: 'Y', defaultValue: '70' },
      { name: 'z', placeholder: 'Z', defaultValue: '0' }
    ]
  },
  {
    id: 'give',
    category: '7. Teleport, Give & Whitelist',
    categoryIndex: 7,
    command: '/give',
    usage: '/give <player> <item> [count]',
    description: 'Give any Minecraft item and amount to player.',
    hindiDescription: 'Player ko koi bhi item aur uski quantity dena (e.g. diamond 64).',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' },
      { name: 'item', placeholder: 'Item (e.g. diamond)', defaultValue: 'diamond' },
      { name: 'count', placeholder: 'Count', defaultValue: '64' }
    ]
  },
  {
    id: 'effect',
    category: '7. Teleport, Give & Whitelist',
    categoryIndex: 7,
    command: '/effect',
    usage: '/effect <player> <effect> [seconds] [amplifier]',
    description: 'Give potion effect (speed, strength, night_vision, etc.).',
    hindiDescription: 'Player ko potion effect dena jaise night vision ya speed.',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' },
      { name: 'effect', placeholder: 'Effect (e.g. night_vision)', defaultValue: 'night_vision' },
      { name: 'seconds', placeholder: 'Seconds', defaultValue: '300' },
      { name: 'amplifier', placeholder: 'Amplifier (1-5)', defaultValue: '1' }
    ]
  },
  {
    id: 'whitelist',
    category: '7. Teleport, Give & Whitelist',
    categoryIndex: 7,
    command: '/whitelist',
    usage: '/whitelist <on|off>',
    description: 'Enable or disable server whitelist protection.',
    hindiDescription: 'Whitelist enable ya disable karna taaki sirf allowed log join karein.',
    params: [
      { name: 'state', placeholder: 'on or off', defaultValue: 'on' }
    ]
  },
  {
    id: 'whitelistadd',
    category: '7. Teleport, Give & Whitelist',
    categoryIndex: 7,
    command: '/whitelistadd',
    usage: '/whitelistadd <player>',
    description: 'Add approved player to server whitelist.',
    hindiDescription: 'Player ko whitelist me add karna.',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' }
    ]
  },
  {
    id: 'whitelistremove',
    category: '7. Teleport, Give & Whitelist',
    categoryIndex: 7,
    command: '/whitelistremove',
    usage: '/whitelistremove <player>',
    description: 'Remove player from whitelist.',
    hindiDescription: 'Player ko whitelist se hatana.',
    params: [
      { name: 'player', placeholder: 'Player Gamertag' }
    ]
  },

  // [ 8. GAMEPLAY & ENVIRONMENT ]
  {
    id: 'coords',
    category: '8. Gameplay & Environment',
    categoryIndex: 8,
    command: '/coords',
    usage: '/coords',
    description: 'Display coordinates on screen for all players permanently.',
    hindiDescription: 'Sabhi players ke screen par live coordinates on karna.'
  },
  {
    id: 'keepinventory',
    category: '8. Gameplay & Environment',
    categoryIndex: 8,
    command: '/keepinventory',
    usage: '/keepinventory',
    description: 'Prevent players from dropping items upon death.',
    hindiDescription: 'Player marne par uske items drop na ho (Keep Inventory on).'
  },
  {
    id: 'pvp',
    category: '8. Gameplay & Environment',
    categoryIndex: 8,
    command: '/pvp',
    usage: '/pvp <on|off>',
    description: 'Enable or disable player-versus-player combat.',
    hindiDescription: 'Players ke aapas me ladne ko on ya off karna.',
    params: [
      { name: 'state', placeholder: 'on or off', defaultValue: 'on' }
    ]
  },
  {
    id: 'difficulty',
    category: '8. Gameplay & Environment',
    categoryIndex: 8,
    command: '/difficulty',
    usage: '/difficulty <peaceful|easy|normal|hard>',
    description: 'Change server game difficulty level.',
    hindiDescription: 'Server ki difficulty peaceful, easy, normal ya hard set karna.',
    params: [
      { name: 'diff', placeholder: 'peaceful|easy|normal|hard', defaultValue: 'normal' }
    ]
  },
  {
    id: 'gamemode',
    category: '8. Gameplay & Environment',
    categoryIndex: 8,
    command: '/gamemode',
    usage: '/gamemode <survival|creative|adventure>',
    description: 'Set default server game mode.',
    hindiDescription: 'Default game mode survival, creative ya adventure set karna.',
    params: [
      { name: 'mode', placeholder: 'survival|creative|adventure', defaultValue: 'survival' }
    ]
  },
  {
    id: 'time',
    category: '8. Gameplay & Environment',
    categoryIndex: 8,
    command: '/time',
    usage: '/time <day|night|noon|midnight>',
    description: 'Change world time instantly.',
    hindiDescription: 'Duniya ka time badalna (day, night, noon ya midnight).',
    params: [
      { name: 'time', placeholder: 'day|night|noon|midnight', defaultValue: 'day' }
    ]
  },
  {
    id: 'weather',
    category: '8. Gameplay & Environment',
    categoryIndex: 8,
    command: '/weather',
    usage: '/weather <clear|rain|thunder>',
    description: 'Change world weather conditions.',
    hindiDescription: 'Mausam saaf karna ya barish/toofan lagana.',
    params: [
      { name: 'weather', placeholder: 'clear|rain|thunder', defaultValue: 'clear' }
    ]
  },
  {
    id: 'mobspawning',
    category: '8. Gameplay & Environment',
    categoryIndex: 8,
    command: '/mobspawning',
    usage: '/mobspawning <true|false>',
    description: 'Toggle natural monster and mob spawning.',
    hindiDescription: 'Zombies aur monsters ka paida hona on ya off karna.',
    params: [
      { name: 'state', placeholder: 'true or false', defaultValue: 'true' }
    ]
  },
  {
    id: 'killmobs',
    category: '8. Gameplay & Environment',
    categoryIndex: 8,
    command: '/killmobs',
    usage: '/killmobs',
    description: 'Instantly eliminate all non-player entities to clear server lag.',
    hindiDescription: 'Server se sabhi mobs ko clear karke lag khatam karna.'
  },
  {
    id: 'setworldspawn',
    category: '8. Gameplay & Environment',
    categoryIndex: 8,
    command: '/setworldspawn',
    usage: '/setworldspawn [x y z]',
    description: 'Set custom coordinates for server world spawn point.',
    hindiDescription: 'Naye players ka default spawn point coordinates set karna.',
    params: [
      { name: 'coords', placeholder: 'X Y Z (or leave empty for current)', defaultValue: '0 70 0' }
    ]
  },

  // [ 9. CHAT, BROADCAST & WORLD RECOVERY ]
  {
    id: 'say',
    category: '9. Chat & World Recovery',
    categoryIndex: 9,
    command: '/say',
    usage: '/say <message>',
    description: 'Broadcast official server announcement to all players.',
    hindiDescription: 'Poore server me sabhi players ko official announcement bhejna.',
    params: [
      { name: 'message', placeholder: 'Announcement text', defaultValue: 'Welcome to our Bedrock Server!' }
    ]
  },
  {
    id: 'clearchat',
    category: '9. Chat & World Recovery',
    categoryIndex: 9,
    command: '/clearchat',
    usage: '/clearchat',
    description: 'Clear chat screen for all players to remove spam or spoilers.',
    hindiDescription: 'Sabhi players ki chat screen clear karna.'
  },
  {
    id: 'seed',
    category: '9. Chat & World Recovery',
    categoryIndex: 9,
    command: '/seed',
    usage: '/seed [number]',
    description: 'View or set world generation seed number.',
    hindiDescription: 'World ka seed number dekhna ya custom seed se naya world banana.',
    params: [
      { name: 'seed', placeholder: 'Seed Number (optional)' }
    ]
  },
  {
    id: 'backup',
    category: '9. Chat & World Recovery',
    categoryIndex: 9,
    command: '/backup',
    usage: '/backup',
    description: 'Create an instant downloadable .zip snapshot of the entire world.',
    hindiDescription: 'Poore world aur inventory ka turant ZIP backup snapshot banana.'
  },
  {
    id: 'backuplist',
    category: '9. Chat & World Recovery',
    categoryIndex: 9,
    command: '/backuplist',
    usage: '/backuplist',
    description: 'List all stored server world backup snapshots.',
    hindiDescription: 'Server me maujood sabhi purane backups ki list dekhna.'
  },
  {
    id: 'restoresnapshot',
    category: '9. Chat & World Recovery',
    categoryIndex: 9,
    command: '/restoresnapshot',
    usage: '/restoresnapshot <file.zip>',
    description: 'Restore entire world from a specific saved backup snapshot.',
    hindiDescription: 'Griefing ya crash hone par purane backup snapshot se world restore karna.',
    params: [
      { name: 'file', placeholder: 'Backup filename.zip' }
    ]
  },

  // [ 10. SYSTEM DIAGNOSTICS & CONTROL ]
  {
    id: 'updateserver',
    category: '10. Diagnostics & System',
    categoryIndex: 10,
    command: '/updateserver',
    usage: '/updateserver [version]',
    description: 'Check active engine or switch Bedrock version.',
    hindiDescription: 'Bedrock Dedicated Server ka engine update ya version switch karna.',
    params: [
      { name: 'version', placeholder: 'Version (e.g. 1.21.62.01)' }
    ]
  },
  {
    id: 'status',
    category: '10. Diagnostics & System',
    categoryIndex: 10,
    command: '/status',
    usage: '/status',
    description: 'View live server status, port, and Playit tunnel connection.',
    hindiDescription: 'Server online hai ya offline aur Playit tunnel status dekhna.'
  },
  {
    id: 'serverstats',
    category: '10. Diagnostics & System',
    categoryIndex: 10,
    command: '/serverstats',
    usage: '/serverstats',
    description: 'Inspect live CPU%, RAM usage, TPS, and world disk size.',
    hindiDescription: 'RAM, CPU, TPS aur disk memory ka live diagnostic report.'
  },
  {
    id: 'logs',
    category: '10. Diagnostics & System',
    categoryIndex: 10,
    command: '/logs',
    usage: '/logs',
    description: 'Fetch the latest 15 live Bedrock console logs.',
    hindiDescription: 'Server ke aakhri 15 live console logs dekhna.'
  },
  {
    id: 'restart',
    category: '10. Diagnostics & System',
    categoryIndex: 10,
    command: '/restart',
    usage: '/restart',
    description: 'Safely restart Bedrock Dedicated Server process.',
    hindiDescription: 'Server ko bina corrupt kiye surakshit restart karna.'
  },
  {
    id: 'fixtunnel',
    category: '10. Diagnostics & System',
    categoryIndex: 10,
    command: '/fixtunnel',
    usage: '/fixtunnel',
    description: 'Restart Playit tunnel service to fix unreachable connection.',
    hindiDescription: 'Playit tunnel restart karke connection drop ya ping issue theek karna.'
  },
  {
    id: 'cmd',
    category: '10. Diagnostics & System',
    categoryIndex: 10,
    command: '/cmd',
    usage: '/cmd <command>',
    description: 'Inject raw Bedrock console command directly to server stdin.',
    hindiDescription: 'Direct console me koi bhi Bedrock command inject karna.',
    params: [
      { name: 'raw', placeholder: 'Bedrock command without slash', defaultValue: 'list' }
    ]
  },
  {
    id: 'shell',
    category: '10. Diagnostics & System',
    categoryIndex: 10,
    command: '/shell',
    usage: '/shell <command>',
    description: 'Run native Linux terminal shell command.',
    hindiDescription: 'Container ke Linux bash terminal me system command run karna.',
    params: [
      { name: 'sh', placeholder: 'Bash command (e.g. df -h)', defaultValue: 'df -h' }
    ]
  }
];

const CATEGORIES = [
  'All (55)',
  '1. Emergency Reset',
  '2. Farm Chunk Loader',
  '3. Surveillance & Auto-Ban',
  '4. Anti-Cheat & Security',
  '5. Punishment & Freeze',
  '6. Roles & Moderation',
  '7. Teleport, Give & Whitelist',
  '8. Gameplay & Environment',
  '9. Chat & World Recovery',
  '10. Diagnostics & System'
];

export const MasterCommandsView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All (55)');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paramValues, setParamValues] = useState<Record<string, Record<string, string>>>({});
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastOutput, setLastOutput] = useState<{ command: string; response: string; time: string; ok: boolean } | null>(null);
  const [customCmd, setCustomCmd] = useState<string>('');

  const handleParamChange = (cmdId: string, paramName: string, val: string) => {
    setParamValues(prev => ({
      ...prev,
      [cmdId]: {
        ...(prev[cmdId] || {}),
        [paramName]: val
      }
    }));
  };

  const getFullCommand = (cmd: CommandDef): string => {
    if (!cmd.params || cmd.params.length === 0) return cmd.command;
    const values = paramValues[cmd.id] || {};
    const filledArgs = cmd.params
      .map(p => values[p.name] !== undefined ? values[p.name] : (p.defaultValue || ''))
      .filter(v => v.trim().length > 0);

    return `${cmd.command} ${filledArgs.join(' ')}`.trim();
  };

  const executeCommand = async (cmdString: string, id?: string) => {
    if (id) setExecutingId(id);
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmdString })
      });
      const data = await res.json();
      setLastOutput({
        command: cmdString,
        response: data.response || data.message || 'Command executed.',
        time: new Date().toLocaleTimeString(),
        ok: data.success !== false
      });
    } catch (err: any) {
      setLastOutput({
        command: cmdString,
        response: `Execution error: ${err.message}`,
        time: new Date().toLocaleTimeString(),
        ok: false
      });
    } finally {
      if (id) setExecutingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const filteredCommands = MASTER_55_COMMANDS.filter(cmd => {
    const matchesCat = selectedCategory === 'All (55)' || cmd.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCat;
    
    const paramsText = cmd.params ? cmd.params.map(p => `${p.name} ${p.placeholder}`).join(' ').toLowerCase() : '';
    const matchesQuery =
      cmd.command.toLowerCase().includes(q) ||
      cmd.usage.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.hindiDescription.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.id.toLowerCase().includes(q) ||
      paramsText.includes(q);

    // If searching, allow finding across all categories if none match in current category,
    // or if the user is on 'All (55)'
    return (selectedCategory === 'All (55)' ? matchesQuery : (matchesCat && matchesQuery));
  });

  const QUICK_SEARCH_TAGS = [
    { label: 'Give Items', query: 'give' },
    { label: 'Day / Night', query: 'time' },
    { label: 'Clear Weather', query: 'weather' },
    { label: 'GameMode', query: 'gamemode' },
    { label: 'Kick & Ban', query: 'kick' },
    { label: 'OP / Admin', query: 'operator' },
    { label: 'Freeze Player', query: 'freeze' },
    { label: 'Teleport', query: 'teleport' },
    { label: 'Farm Loader', query: 'tickingarea' },
    { label: 'World Reset', query: 'resetserver' },
    { label: 'Whitelist', query: 'whitelist' },
    { label: 'Difficulty', query: 'difficulty' }
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-24">
      {/* 🔍 TOP PRIORITY: Search 55 Commands Sticky Bar */}
      <div className="bg-white border-2 border-emerald-500/30 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Search className="w-4 h-4" />
            </span>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Search Master Commands</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-300">
                  55 Total
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">
                Type any command name, argument, or description (Hindi & English supported)
              </p>
            </div>
          </div>

          {searchQuery && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
              Found {filteredCommands.length}
            </span>
          )}
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type command to search (e.g. give, kick, op, freeze, kill, seed, reload)..."
            className="w-full bg-slate-50 border border-slate-300 focus:bg-white rounded-2xl pl-10 pr-9 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 font-medium shadow-2xs focus:outline-emerald-600 focus:border-emerald-600 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700 font-bold p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Search Keyword Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] text-slate-400 font-semibold shrink-0">Quick:</span>
          {QUICK_SEARCH_TAGS.map(tag => (
            <button
              key={tag.label}
              type="button"
              onClick={() => {
                setSearchQuery(tag.query);
                setSelectedCategory('All (55)');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
                searchQuery.toLowerCase() === tag.query.toLowerCase()
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Category Filter Pills */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Raw Command / Quick Runner Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 w-full sm:w-auto">
          <Terminal className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Quick Raw Command:</span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customCmd.trim()) {
              executeCommand(customCmd);
              setCustomCmd('');
            }
          }}
          className="flex items-center gap-1.5 w-full sm:flex-1 max-w-md"
        >
          <input
            type="text"
            value={customCmd}
            onChange={(e) => setCustomCmd(e.target.value)}
            placeholder="Type any raw command (e.g. /gamemode creative)..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-emerald-600 focus:border-emerald-600"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors shrink-0 shadow-xs active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Run</span>
          </button>
        </form>
      </div>

      {/* Live Response Card if available */}
      {lastOutput && (
        <div
          className={`p-4 rounded-2xl border text-xs shadow-xs transition-all ${
            lastOutput.ok
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/90 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono font-bold flex items-center gap-1.5">
              <span className={lastOutput.ok ? 'text-emerald-700' : 'text-rose-700'}>●</span>
              {lastOutput.command}
            </span>
            <span className="text-[10px] text-slate-600">{lastOutput.time}</span>
          </div>
          <p className="font-mono text-xs whitespace-pre-wrap leading-relaxed opacity-95">
            {lastOutput.response}
          </p>
        </div>
      )}

      {/* Count Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Showing <b>{filteredCommands.length}</b> of 55 commands</span>
        {selectedCategory !== 'All (55)' && (
          <button
            type="button"
            onClick={() => setSelectedCategory('All (55)')}
            className="text-emerald-700 hover:underline font-bold"
          >
            Show All
          </button>
        )}
      </div>

      {/* Commands Grid */}
      {filteredCommands.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No commands found matching "{searchQuery}"</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try searching for common commands like <span className="font-mono text-emerald-700 font-bold">give</span>, <span className="font-mono text-emerald-700 font-bold">time</span>, <span className="font-mono text-emerald-700 font-bold">weather</span>, <span className="font-mono text-emerald-700 font-bold">freeze</span>, or <span className="font-mono text-emerald-700 font-bold">tp</span>.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All (55)');
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95"
            >
              Clear Search & Show All 55
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredCommands.map((cmd) => {
          const fullCmd = getFullCommand(cmd);
          const isDanger = cmd.danger;

          return (
            <div
              key={cmd.id}
              className={`bg-white border rounded-2xl p-4 shadow-2xs flex flex-col justify-between transition-all hover:shadow-xs ${
                isDanger ? 'border-rose-200/90 hover:border-rose-300' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                      {cmd.command}
                    </span>
                    {isDanger && (
                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md border border-rose-200">
                        DANGER
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    {cmd.category.split('. ')[1] || cmd.category}
                  </span>
                </div>

                {/* Usage preview */}
                <div className="font-mono text-[11px] text-emerald-800 font-semibold mb-2 bg-emerald-50/70 border border-emerald-100 px-2 py-1 rounded-lg break-all">
                  {cmd.usage}
                </div>

                {/* Descriptions */}
                <p className="text-xs text-slate-700 font-medium mb-1 leading-snug">
                  {cmd.description}
                </p>
                <p className="text-[11px] text-slate-500 italic mb-3 leading-snug">
                  {cmd.hindiDescription}
                </p>

                {/* Interactive Parameter Inputs */}
                {cmd.params && cmd.params.length > 0 && (
                  <div className="space-y-1.5 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Command Arguments
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {cmd.params.map(p => {
                        const val = paramValues[cmd.id]?.[p.name] !== undefined
                          ? paramValues[cmd.id][p.name]
                          : (p.defaultValue || '');

                        return (
                          <input
                            key={p.name}
                            type="text"
                            value={val}
                            onChange={(e) => handleParamChange(cmd.id, p.name, e.target.value)}
                            placeholder={p.placeholder}
                            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-emerald-600 focus:border-emerald-600"
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(fullCmd, cmd.id)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200"
                  title="Copy command string"
                >
                  {copiedId === cmd.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => executeCommand(fullCmd, cmd.id)}
                  disabled={executingId === cmd.id}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 ${
                    isDanger
                      ? 'bg-rose-700 hover:bg-rose-800 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {executingId === cmd.id ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Execute</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};

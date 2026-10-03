import React, { useState, useEffect } from 'react';
import {
  Package,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Search,
  Sliders,
  Settings2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Coins,
  Users,
  Compass,
  Lock,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Star,
  RotateCw,
  Terminal,
  BookOpen
} from 'lucide-react';
import { PluginItem } from '../types';
import { HelpModal } from './HelpModal';

interface PluginStoreViewProps {
  onBack: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const INITIAL_PLUGINS: PluginItem[] = [
  {
    id: 'landclaim-pro',
    name: 'Land Claim & Grief Prevention Pro',
    version: 'v3.2.0',
    category: 'security',
    description: '100% Anti-Theft territorial land protection with Golden Shovel claiming wand and Stick inspection tool.',
    detailedUse: 'यह खिलाड़ियों के बेस, घर और फार्म को गैर-अधिकृत लोगों की तोड़फोड़ और लूट से बचाता है। इसमें Golden Shovel (गोल्डन फावड़ा) से जमीन क्लेम करने और Stick (स्टिक) से जमीन का मालिक व सीमाएं चेक करने का सिस्टम इन-बिल्ट है।',
    howToUse: [
      '1. चैट में /kit claim टाइप करें या पैनल से "🎁 Give Claim Kit" दबाएं।',
      '2. Golden Shovel लेकर कोना 1 और कोना 2 पर टैप करें (या /claim चलाएं)।',
      '3. Stick लेकर किसी भी ब्लॉक पर टैप करें और जमीन का मालिक व स्टेटस चेक करें (/claiminfo)।',
      '4. दोस्तों को /trust <player> के जरिए पार्टनर बनाएं और जब चाहें /untrust करें।'
    ],
    commands: [
      { command: '/kit claim', description: 'गोल्डन फावड़ा और स्टिक क्लेम किट प्राप्त करें', role: 'Player' },
      { command: '/claim [radius]', description: 'अपनी जगह पर लैंड क्लेम बनाएं', role: 'Player' },
      { command: '/claiminfo', description: 'स्टिक की तरह जमीन के ओनर व सीमाओं की जानकारी देखें', role: 'Player' },
      { command: '/trust <player>', description: 'दोस्त को पार्टनर का एक्सेस दें', role: 'Owner' },
      { command: '/untrust <player>', description: 'पार्टनर का एक्सेस तुरंत छीन लें', role: 'Owner' }
    ],
    installed: true,
    enabled: true,
    sizeMb: 2.4,
    author: 'Bedrock Security Lab',
    badge: 'Installed & Active',
    rating: 5.0
  },
  {
    id: 'warden-anticheat',
    name: 'Warden Anti-Cheat Guard',
    version: 'v2.8.4',
    category: 'security',
    description: 'Real-time anti-speed, anti-fly, packet exploit patcher, and anti-xray diamond shield.',
    detailedUse: 'यह सर्वर में हैकिंग करने वाले खिलाड़ियों (Speed hack, Fly hack, X-Ray, Auto-Clicker) को अपने-आप पकड़कर फ्रीज या बैन करता है।',
    howToUse: [
      '1. प्लगइन को इनेबल रखें।',
      '2. जब भी कोई हैक का उपयोग करेगा तो कंसोल में रेड अलर्ट आएगा।',
      '3. चैट में /freeze <player> या /ban <player> का उपयोग करके हैकर्स को रोकें।'
    ],
    commands: [
      { command: '/freeze <player>', description: 'हैक करने वाले खिलाड़ी को एक जगह जमा दें', role: 'Admin' },
      { command: '/unfreeze <player>', description: 'खिलाड़ी को अनफ्रीज करें', role: 'Admin' },
      { command: '/anticheat status', description: 'एंटी-चीट मॉनिटरिंग रिपोर्ट देखें', role: 'Admin' }
    ],
    installed: true,
    enabled: true,
    sizeMb: 1.8,
    author: 'Mojang BDS Security',
    badge: 'Core Guard',
    rating: 4.9
  },
  {
    id: 'economy-shop',
    name: 'Economy & Shopkeepers PE',
    version: 'v4.1.2',
    category: 'economy',
    description: 'Scoreboard virtual emerald economy, player wallet balances, and customizable NPC trader shops.',
    detailedUse: 'सर्वर में पैसे (Coins/Emeralds) की अर्थव्यवस्था चालू करने के लिए। खिलाड़ी ब्लॉक बेचकर पैसे कमा सकते हैं और शॉप से दुर्लभ सामान खरीद सकते हैं।',
    howToUse: [
      '1. चैट में /balance से अपना बैलेंस देखें।',
      '2. /pay <player> <amount> से दोस्त को पैसे ट्रांसफर करें।',
      '3. /shop से सर्वर का वर्चुअल मार्केट खोलें।'
    ],
    commands: [
      { command: '/balance', description: 'अपना कुल बैलेंस देखें', role: 'Player' },
      { command: '/pay <player> <amount>', description: 'दूसरे खिलाड़ी को पैसे भेजें', role: 'Player' },
      { command: '/eco give <player> <amount>', description: 'एडमिन द्वारा खिलाड़ी को पैसे देना', role: 'Admin' }
    ],
    installed: true,
    enabled: true,
    sizeMb: 3.1,
    author: 'CraftEconomy Team',
    badge: 'SMP Economy',
    rating: 4.8
  },
  {
    id: 'clan-factions',
    name: 'Clan & Faction Wars',
    version: 'v2.5.0',
    category: 'gameplay',
    description: 'Create player guilds, alliances, clan private chat, and team war rankings.',
    detailedUse: 'खिलाड़ियों को अपनी टीम या क्लैन बनाने, क्लैन चैट करने और दूसरी टीमों के साथ मुकाबला करने की सुविधा देता है।',
    howToUse: [
      '1. /clan create <name> से अपना नया क्लैन बनाएं।',
      '2. /clan invite <player> से दोस्तों को क्लैन में जोड़ें।',
      '3. /clan chat से सिर्फ अपनी टीम से बात करें।'
    ],
    commands: [
      { command: '/clan create <name>', description: 'नया क्लैन रजिस्टर करें', role: 'Player' },
      { command: '/clan invite <player>', description: 'दोस्त को क्लैन में न्योता दें', role: 'Leader' },
      { command: '/clan list', description: 'सर्वर के सभी क्लैन्स देखें', role: 'Player' }
    ],
    installed: false,
    enabled: false,
    sizeMb: 4.2,
    author: 'Bedrock Guilds',
    badge: 'Multiplayer',
    rating: 4.7
  },
  {
    id: 'fastbuilder-we',
    name: 'FastBuilder & WorldEdit Bedrock',
    version: 'v5.0.1',
    category: 'world',
    description: 'Instant sphere generation, //set block commands, brush tools, and fast mass building.',
    detailedUse: 'बड़े-बड़े महल, दीवारें या गड्ढे चुटकियों में बनाने के लिए। एक-एक ब्लॉक लगाने की जरूरत नहीं होती।',
    howToUse: [
      '1. चैट में //wand टाइप करके सेलेक्शन कुल्हाड़ी प्राप्त करें।',
      '2. दो कोनों पर क्लिक करके एरिया सेलेक्ट करें।',
      '3. //set stone या //sphere glass 10 कमांड चलाएं।'
    ],
    commands: [
      { command: '//wand', description: 'सेलेक्शन टूल प्राप्त करें', role: 'Admin' },
      { command: '//set <block>', description: 'चुने गए एरिया को तुरंत ब्लॉक से भरें', role: 'Admin' },
      { command: '//sphere <block> <radius>', description: 'गोल गोलाकार संरचना बनाएं', role: 'Admin' }
    ],
    installed: true,
    enabled: true,
    sizeMb: 5.6,
    author: 'BuilderCraft PE',
    badge: 'Creative & Admin',
    rating: 4.9
  },
  {
    id: 'essentials-warps',
    name: 'Essentials & Teleport Warps',
    version: 'v3.7.0',
    category: 'admin',
    description: '/home, /spawn, /tpa, /tpaccept, and player back-to-death teleportation system.',
    detailedUse: 'खिलाड़ियों को अपने घर सेट करने (/sethome), स्पॉन पर जाने (/spawn) और एक-दूसरे के पास टेलीपोर्ट होने (/tpa) की सुविधा देता है।',
    howToUse: [
      '1. अपने घर पर खड़े होकर /sethome लिखें।',
      '2. कहीं भी भटकने पर /home लिखकर तुरंत घर लौट आएं।',
      '3. दोस्त के पास जाने के लिए /tpa <friend> भेजें।'
    ],
    commands: [
      { command: '/sethome [name]', description: 'मौजूदा जगह को होम सेट करें', role: 'Player' },
      { command: '/home [name]', description: 'अपने होम पर तुरंत टेलीपोर्ट हों', role: 'Player' },
      { command: '/spawn', description: 'सर्वर के मुख्य स्पॉन पर जाएं', role: 'Player' },
      { command: '/tpa <player>', description: 'टेलीपोर्ट की रिक्वेस्ट भेजें', role: 'Player' }
    ],
    installed: true,
    enabled: true,
    sizeMb: 2.1,
    author: 'EssentialsBedrock',
    badge: 'Must Have',
    rating: 5.0
  },
  {
    id: 'clearlag-optimizer',
    name: 'Auto-Clear Lag & Entity Sweeper',
    version: 'v2.2.1',
    category: 'optimization',
    description: 'Automatic ground item cleaner, mob animation lag patcher, and TPS stabilizer.',
    detailedUse: 'सर्वर से लैग खत्म करने के लिए। जब जमीन पर बहुत ज्यादा ब्लॉक्स या मॉब जमा हो जाते हैं तो यह उन्हें साफ करके टीपीएस 20 पर रखता है।',
    howToUse: [
      '1. यह हर 15 मिनट में ऑटोमैटिकली वार्निंग देकर जमीन का कचरा हटाता है।',
      '2. कभी भी तुरंत लैग हटाने के लिए चैट में /clearlag चलाएं।'
    ],
    commands: [
      { command: '/clearlag', description: 'जमीन पर गिरे आवारा सामान तुरंत साफ करें', role: 'Admin' },
      { command: '/tps', description: 'लाइव सर्वर स्पीड (Ticks Per Second) जांचें', role: 'Player' }
    ],
    installed: true,
    enabled: true,
    sizeMb: 1.2,
    author: 'LagFree Devs',
    badge: 'Performance',
    rating: 4.8
  },
  {
    id: 'death-gravestone',
    name: 'GraveStone & Death Loot Keeper',
    version: 'v1.9.0',
    category: 'gameplay',
    description: 'Spawns a locked tombstone on player death with GPS death coordinates to prevent item despawn.',
    detailedUse: 'जब कोई खिलाड़ी मर जाता है, तो उसका सामान जमीन पर बिखर कर खोता नहीं है, बल्कि एक सुरक्षित ग्रेव चेस्ट में बंद हो जाता है जिसे सिर्फ वही खोल सकता है।',
    howToUse: [
      '1. मरने पर चैट में तुरंत डेथ लोकेशन का X, Y, Z कोऑर्डिनेट्स दिखेगा।',
      '2. वहां जाकर अपनी कब्र (Gravestone) पर क्लिक करें, सारा सामान वापस मिल जाएगा।'
    ],
    commands: [
      { command: '/grave locate', description: 'अपनी आखिरी मौत की जगह का रास्ता देखें', role: 'Player' }
    ],
    installed: false,
    enabled: false,
    sizeMb: 1.5,
    author: 'GraveGuard Studios',
    badge: 'Anti-Rage',
    rating: 4.6
  }
];

export const PluginStoreView: React.FC<PluginStoreViewProps> = ({
  onBack,
  onNavigateToTab
}) => {
  const [plugins, setPlugins] = useState<PluginItem[]>(INITIAL_PLUGINS);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPluginForHelp, setSelectedPluginForHelp] = useState<PluginItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTopic, setHelpTopic] = useState('pluginstore');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openGlobalHelp = () => {
    setHelpTopic('pluginstore');
    setHelpOpen(true);
  };

  // Fetch plugins state from server
  const fetchPlugins = async () => {
    try {
      const res = await fetch('/api/plugins');
      if (res.ok) {
        const data = await res.json();
        if (data.plugins && Array.isArray(data.plugins)) {
          setPlugins(data.plugins);
        }
      }
    } catch (e) {
      console.warn('Could not load plugins from server:', e);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  // Install / Uninstall plugin
  const handleToggleInstall = async (plugin: PluginItem) => {
    setLoadingAction(plugin.id);
    const action = plugin.installed ? 'uninstall' : 'install';
    try {
      const res = await fetch(`/api/plugins/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plugin.id })
      });
      if (res.ok) {
        setPlugins(prev =>
          prev.map(p =>
            p.id === plugin.id
              ? { ...p, installed: !plugin.installed, enabled: !plugin.installed }
              : p
          )
        );
        showToast(
          plugin.installed
            ? `🗑️ Uninstalled ${plugin.name}`
            : `✔ Successfully Installed ${plugin.name}!`
        );
      }
    } catch (e) {
      showToast('Plugin action failed');
    } finally {
      setLoadingAction(null);
    }
  };

  // Toggle active/inactive
  const handleToggleEnable = async (plugin: PluginItem) => {
    if (!plugin.installed) return;
    setLoadingAction(plugin.id);
    try {
      const res = await fetch('/api/plugins/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plugin.id, enabled: !plugin.enabled })
      });
      if (res.ok) {
        setPlugins(prev =>
          prev.map(p =>
            p.id === plugin.id ? { ...p, enabled: !plugin.enabled } : p
          )
        );
        showToast(
          !plugin.enabled
            ? `✔ ${plugin.name} is now ACTIVE`
            : `⏸️ ${plugin.name} DISABLED`
        );
      }
    } catch (e) {
      showToast('Toggle failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const categories = [
    { id: 'all', label: 'All Plugins' },
    { id: 'security', label: 'Security & Land' },
    { id: 'admin', label: 'Admin & Essentials' },
    { id: 'economy', label: 'Economy & Money' },
    { id: 'optimization', label: 'Anti-Lag' },
    { id: 'world', label: 'World & Building' },
    { id: 'gameplay', label: 'RPG & Gameplay' }
  ];

  const filteredPlugins = plugins.filter(p => {
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchQuery =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.detailedUse.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="space-y-4 text-slate-100 animate-in fade-in duration-150">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 p-3 bg-red-950/90 border border-red-500/50 rounded-xl text-xs font-semibold text-white shadow-xl shadow-red-950/40 flex items-center gap-2 animate-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-red-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Hero Banner in Dark + Red Theme */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/60 via-[#181622] to-[#121118] border border-red-950/60 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 shadow-md shadow-red-950/50">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Minecraft Bedrock Plugin Store
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800/40 font-bold">
                  ADDONS HUB
                </span>
                {/* Global Question Mark */}
                <button
                  type="button"
                  onClick={openGlobalHelp}
                  title="प्लगइन स्टोर का क्या उपयोग है और कैसे use करें?"
                  className="p-1 rounded-full bg-red-950/80 hover:bg-red-800 text-red-400 hover:text-white border border-red-700/50 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-400">
                1-Click Addons • Land Claim, Anti-Cheat, Economy, FastBuilder & Teleport
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchPlugins}
              className="p-2 rounded-xl bg-[#181622] hover:bg-zinc-800 border border-zinc-800 text-slate-400 hover:text-white transition-colors"
              title="Refresh Plugins"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('landclaim')}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-950 transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Open Land Claims</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar & Quick Categories */}
        <div className="mt-4 pt-3 border-t border-red-950/40 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plugins by name, feature or command (e.g. claim, economy, lag, anticheat)..."
              className="w-full bg-[#0a0a0f] border border-zinc-800 focus:border-red-500/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500/30"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const isSelected = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-md shadow-red-950'
                      : 'bg-[#181622] text-slate-400 hover:text-slate-200 border border-zinc-800/80'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Plugins Grid (2 Columns on tablet/desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredPlugins.map((plugin) => {
          const isLoading = loadingAction === plugin.id;

          return (
            <div
              key={plugin.id}
              className={`p-4 rounded-2xl bg-[#121118] border transition-all flex flex-col justify-between ${
                plugin.installed
                  ? 'border-red-950/80 shadow-md shadow-red-950/20'
                  : 'border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Card Header: Icon, Name, Version, Question Mark (?) Button */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#181622] border border-red-950/50 flex items-center justify-center text-red-500 font-bold shrink-0">
                      {plugin.category === 'security' && <ShieldCheck className="w-5 h-5 text-red-400" />}
                      {plugin.category === 'economy' && <Coins className="w-5 h-5 text-amber-400" />}
                      {plugin.category === 'admin' && <Terminal className="w-5 h-5 text-blue-400" />}
                      {plugin.category === 'optimization' && <Zap className="w-5 h-5 text-emerald-400" />}
                      {plugin.category === 'world' && <Layers className="w-5 h-5 text-purple-400" />}
                      {plugin.category === 'gameplay' && <Sparkles className="w-5 h-5 text-pink-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                          {plugin.name}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-400">
                          {plugin.version}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        By {plugin.author} • {plugin.sizeMb} MB
                      </p>
                    </div>
                  </div>

                  {/* PROMINENT QUESTION MARK (?) FOR THIS PLUGIN */}
                  <button
                    type="button"
                    onClick={() => setSelectedPluginForHelp(plugin)}
                    title={`इसका क्या उपयोग है और कैसे use करें? (${plugin.name})`}
                    className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-400 hover:text-white border border-red-800/50 transition-colors flex items-center gap-1 text-[11px] font-bold shrink-0"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span className="hidden xs:inline">Use Guide</span>
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {plugin.description}
                </p>

                {/* Quick In-Game Command preview */}
                {plugin.commands && plugin.commands[0] && (
                  <div className="p-2 rounded-lg bg-[#0a0a0f] border border-zinc-800/80 mb-3 text-[11px] font-mono text-red-300 flex items-center justify-between">
                    <code>{plugin.commands[0].command}</code>
                    <span className="text-[10px] text-slate-500 font-sans">{plugin.commands[0].description}</span>
                  </div>
                )}
              </div>

              {/* Card Footer: Status & Actions */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      plugin.installed
                        ? plugin.enabled ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                        : 'bg-zinc-600'
                    }`}
                  />
                  <span className="text-[11px] font-bold text-slate-300">
                    {plugin.installed
                      ? plugin.enabled ? 'Active in BDS' : 'Disabled'
                      : 'Available to Install'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {plugin.installed ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleEnable(plugin)}
                        disabled={isLoading}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          plugin.enabled
                            ? 'bg-zinc-900 hover:bg-zinc-800 text-slate-300'
                            : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/40'
                        }`}
                      >
                        {plugin.enabled ? 'Disable' : 'Enable'}
                      </button>

                      {plugin.id === 'landclaim-pro' && onNavigateToTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateToTab('landclaim')}
                          className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                        >
                          Manage
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleInstall(plugin)}
                        disabled={isLoading}
                        title="Uninstall Plugin"
                        className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleInstall(plugin)}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-red-950"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Install Plugin</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dedicated Plugin Help Modal when (?) is clicked on any plugin */}
      {selectedPluginForHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#121118] border border-red-950/60 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl shadow-red-950/40 overflow-hidden text-slate-100">
            {/* Header */}
            <div className="p-4 bg-[#181622] border-b border-red-950/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 font-bold">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {selectedPluginForHelp.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    प्लगइन गाइड: उपयोग और इन-गेम कमांड्स
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPluginForHelp(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Iska Kya Use Hai? */}
              <div className="p-3.5 rounded-xl bg-[#181622] border border-red-950/40 space-y-1.5">
                <span className="font-bold text-red-400 flex items-center gap-1.5 text-xs sm:text-[13px]">
                  <Sparkles className="w-4 h-4" />
                  <span>❓ इसका क्या उपयोग है? (What is its use?)</span>
                </span>
                <p className="text-slate-200 leading-relaxed pl-5 border-l-2 border-red-600/50">
                  {selectedPluginForHelp.detailedUse}
                </p>
              </div>

              {/* Kaise Use Karna Hai? */}
              <div className="p-3.5 rounded-xl bg-[#181622] border border-zinc-800/80 space-y-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs sm:text-[13px]">
                  <BookOpen className="w-4 h-4" />
                  <span>🛠️ इसे कैसे उपयोग करें? (Step-by-Step Instructions)</span>
                </span>
                <div className="space-y-1.5 pl-2">
                  {selectedPluginForHelp.howToUse.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* In-game Commands */}
              {selectedPluginForHelp.commands && selectedPluginForHelp.commands.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#0a0a0f] border border-red-950/30 space-y-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-red-400" />
                    <span>⌨️ उपलब्ध चैट कमांड्स (In-Game Commands)</span>
                  </span>
                  <div className="space-y-1.5">
                    {selectedPluginForHelp.commands.map((cmd, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-[#14131d] border border-zinc-800/80 flex items-center justify-between font-mono text-[11px]"
                      >
                        <code className="text-red-300">{cmd.command}</code>
                        <span className="text-slate-400 font-sans text-[10px]">{cmd.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#181622] border-t border-red-950/50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Status: {selectedPluginForHelp.installed ? 'Installed' : 'Ready to Install'}
              </span>
              <button
                onClick={() => setSelectedPluginForHelp(null)}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-md shadow-red-950"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Help Modal */}
      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        initialTopicId={helpTopic}
      />
    </div>
  );
};

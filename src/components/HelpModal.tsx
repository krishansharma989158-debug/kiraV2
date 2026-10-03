import React, { useState } from 'react';
import { HelpCircle, X, Search, CheckCircle, Terminal, AlertTriangle, ShieldCheck, Zap, Lock, Users, Sparkles, BookOpen } from 'lucide-react';
import { HelpTopic } from '../types';

export const DEFAULT_HELP_TOPICS: Record<string, HelpTopic> = {
  landclaim: {
    id: 'landclaim',
    title: 'Land Claim & Grief Prevention (Golden Shovel & Stick System)',
    category: 'Security & Land',
    useCase: 'यह आपके बेस, चेस्ट, फॉर्म और घरों को दूसरे खिलाड़ियों की चोरी, तोड़फोड़ (griefing) और लूट से 100% सुरक्षित रखता है। इसमें क्लासिक Minecraft GriefPrevention का Golden Shovel (गोल्डन फावड़ा) और Stick (स्टिक) सिस्टम शामिल है। कोई भी अनट्रस्टेड खिलाड़ी आपकी जमीन पर न तो चेस्ट खोल सकेगा, न ब्लॉक तोड़ सकेगा!',
    howToUse: [
      '1. 🌟 Golden Shovel (गोल्डन फावड़ा - Claim Wand): हाथ में गोल्डन फावड़ा लेकर कोना 1 और कोना 2 पर टैप करें, या पैनल से X, Y, Z डालकर "+ Create Land Claim" दबाएं।',
      '2. 🪵 Stick (स्टिक / लकड़ी की छड़ी - Claim Inspector): किसी भी ब्लॉक पर Stick से राइट-क्लिक या टैप करें — यह तुरंत बता देगा कि जमीन किसकी है, क्लेम सुरक्षित है या नहीं।',
      '3. 🎁 Give Claim Kit: पैनल में बने "🎁 Give Claim Kit" बटन से या चैट में /kit claim टाइप करके तुरंत गोल्डन फावड़ा और स्टिक प्राप्त करें।',
      '4. पार्टनर्स जोड़ना: "Manage Trusted Partners" में दोस्त का नाम डालकर रोल (Co-Owner, Builder या Container) दें।',
      '5. पार्टनर हटाना: लाल "Remove" बटन दबाएं — उसका सारा एक्सेस गेम में तुरंत उसी सेकंड रद्द हो जाएगा!'
    ],
    commands: [
      '/kit claim - गोल्डन फावड़ा और स्टिक क्लेम किट प्राप्त करें',
      '/claim [radius] - अपने खड़े होने की जगह पर तुरंत लैंड क्लेम बनाएं',
      '/unclaim - मौजूदा क्लेम को हटाएं',
      '/claiminfo - स्टिक की तरह मौजूदा ब्लॉक के ओनर व सीमाओं की जानकारी देखें',
      '/trust <player> [co_owner|builder|container] - खिलाड़ी को अनुमति दें',
      '/untrust <player> - खिलाड़ी का एक्सेस तुरंत छीन लें'
    ],
    proTip: 'Golden Shovel से जमीन क्लेम करने पर Y: -64 (बेडरॉक) से लेकर Y: 320 (आसमान) तक पूरी ऊंचाई 100% लॉक हो जाती है, जिससे छत या नीचे से भी चोरी नामुमकिन है!'
  },
  chestlock: {
    id: 'chestlock',
    title: 'Anti-Theft & Chest Protection',
    category: 'Security',
    useCase: 'सर्वर में मौजूद चेस्ट, बैरल, फर्नेस, हॉपर और शुल्कर बॉक्स को चोरी से सुरक्षित रखना। केवल आप और आपके ट्रस्टेड पार्टनर्स ही चेस्ट खोल सकेंगे।',
    howToUse: [
      '1. Land Claim के अंदर "Lock All Chests & Containers" को ऑन रखें।',
      '2. अगर किसी दोस्त को सिर्फ सामान निकालने देना है तो उसे "Container Role" में जोड़ें।',
      '3. अगर कोई अजनबी खिलाड़ी चेस्ट खोलने की कोशिश करेगा, तो गेम उसे तुरंत "Access Denied" का संदेश देगा और चेस्ट नहीं खुलेगा।'
    ],
    proTip: 'Visitor मोड में Bedrock engine "ability opencontainers false" लागू करता है, जिससे क्लाइंट साइड पर चेस्ट GUI खुलना नामुमकिन हो जाता है।'
  },
  trustedpartners: {
    id: 'trustedpartners',
    title: 'Multi-Partner & Co-Owners System',
    category: 'Land Claim',
    useCase: 'एक ही बेस में 2 या उससे अधिक पार्टनर्स को अलग-अलग अधिकारों (Permissions) के साथ जोड़ना और जब चाहें तब एक क्लिक में हटाना।',
    howToUse: [
      '1. Co-Owner: आपके जैसा पूरा अधिकार (नियम बदलने, नए पार्टनर जोड़ने व सब कुछ तोड़ने/बनाने की छूट)।',
      '2. Builder: सिर्फ ब्लॉक्स तोड़ने और लगाने की छूट, प्राइवेट चेस्ट सुरक्षित रहेंगे।',
      '3. Container: चेस्ट और इन्वेंटरी इस्तेमाल करने की छूट, पर ब्लॉक्स नहीं तोड़ सकता।',
      '4. हटाने के लिए: पार्टनर के नाम के आगे बने रिमूव बटन पर क्लिक करें। गेम में तुरंत उसका टैग हट जाएगा और वह विजिटर बन जाएगा।'
    ],
    proTip: 'पार्टनर हटाते ही सर्वर तुरंत "tag remove" और "gamemode adventure" चलाता है, जिससे वह दोबारा बेस में नहीं घुस सकता!'
  },
  pluginstore: {
    id: 'pluginstore',
    title: 'Plugin & Addon Store',
    category: 'Plugins',
    useCase: 'Minecraft Bedrock Dedicated Server के लिए जरूरी प्लगइन्स (Land Claim, Anti-Cheat, Economy, Clan, FastBuilder, ClearLag, ChestLock) को 1-क्लिक में इंस्टॉल, अनइंस्टॉल या कॉन्फ़िगर करने के लिए।',
    howToUse: [
      '1. प्लगइन स्टोर में कैटेगरी चुनें (Security, Admin, Economy, Optimization, World)।',
      '2. जिस प्लगइन को इंस्टॉल करना है उसके सामने "Install Plugin" बटन पर क्लिक करें।',
      '3. इंस्टॉल होने के बाद आप उसे कभी भी On/Off टॉगल कर सकते हैं या "Settings" बटन दबाकर नियम बदल सकते हैं।',
      '4. प्रत्येक प्लगइन कार्ड पर बने "?" (क्वेश्चन मार्क) पर क्लिक करके उस प्लगइन का सटीक उपयोग और कमांड्स सीख सकते हैं।'
    ],
    commands: [
      '/plugins - सर्वर में सक्रिय सभी प्लगइन्स की लिस्ट देखें'
    ],
    proTip: 'Land Claim Pro और Warden Anti-Cheat को हमेशा सक्रिय रखें ताकि आपका सर्वर हैकर्स और चोरों से सुरक्षित रहे।'
  },
  anticheat: {
    id: 'anticheat',
    title: 'Warden Anti-Cheat Guard',
    category: 'Security',
    useCase: 'Speed hack, Fly hack, X-Ray, Auto-Clicker और Duplication ग्लिच का इस्तेमाल करने वाले हैकर्स को अपने-आप पकड़ना और जेल या बैन करना।',
    howToUse: [
      '1. Security Hub या Plugin Store से Warden Anti-Cheat ऑन रखें।',
      '2. अगर कोई खिलाड़ी असामान्य गति से उड़ता या भागता है, तो सर्वर उसे तुरंत फ्रीज कर देगा।',
      '3. आप पैनल से किसी भी खिलाड़ी को 1-क्लिक में /freeze, /kick या /ban कर सकते हैं।'
    ],
    proTip: 'Anti-Xray को ऑन रखने से नेदराइट और डायमंड माइनर्स के एक्स-रे टेक्सचर पैक्स बेकार हो जाते हैं।'
  },
  lagoptimizer: {
    id: 'lagoptimizer',
    title: 'Lag & Chunks Optimizer',
    category: 'Performance',
    useCase: 'जब सर्वर पर जानवर या मॉब अटक जाते हैं (animation glitch), टीपीएस गिरता है या कोई खिलाड़ी चंक में फंस जाता है, तो उसे तुरंत ठीक करना।',
    howToUse: [
      '1. अगर ऊपर लाल "⚠ Lag Alert" दिखे तो उस पर क्लिक करें।',
      '2. "1-Click Clear Stray Ground Items" दबाएं ताकि जमीन पर पड़ा गैर-जरूरी कचरा साफ हो जाए।',
      '3. "Reload Stuck Player Chunks" दबाएं ताकि फंसे हुए खिलाड़ी का चंक रीफ्रेश हो जाए।'
    ],
    proTip: 'Tick Distance को 4 पर रखें, इससे सर्वर पर लोड कम पड़ता है और टीपीएस 20.0 पर स्थिर रहता है।'
  },
  chunkloaders: {
    id: 'chunkloaders',
    title: '24/7 Farm Loaders (Ticking Areas)',
    category: 'Automation',
    useCase: 'आयरन फार्म, मॉब ग्राइंडर या फसल फार्म को 24 घंटे चालू रखना, भले ही उस जगह कोई खिलाड़ी ऑनलाइन न हो।',
    howToUse: [
      '1. अपने फार्म के कोऑर्डिनेट्स पर खड़े हों।',
      '2. Chunk Loaders पेज पर जाकर फार्म का नाम लिखें और "+ Create 24/7 Ticking Area" पर क्लिक करें।',
      '3. अब वह चंक सर्वर मेमोरी में हमेशा लोडेड रहेगा और बिना खिलाड़ी के भी फार्म काम करेगा।'
    ]
  },
  console: {
    id: 'console',
    title: 'Live Terminal & Bedrock Console',
    category: 'Admin',
    useCase: 'Bedrock Dedicated Server के लाइव लॉग्स देखना और डायरेक्ट ओपी कमांड्स (/op, /gamemode, /weather, /time, /give) भेजना।',
    howToUse: [
      '1. नीचे बने इनपुट बार में कोई भी कमांड टाइप करें (जैसे: op Krishna77779814 या time set day)।',
      '2. "Send Command" दबाएं या Enter दबाएं।',
      '3. ऊपर काली स्क्रीन पर तुरंत सर्वर का रिस्पॉन्स दिखेगा।'
    ]
  }
};

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopicId?: string;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  initialTopicId = 'landclaim'
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const topicsList = Object.values(DEFAULT_HELP_TOPICS);
  const filteredTopics = topicsList.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.useCase.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentTopic = DEFAULT_HELP_TOPICS[selectedTopicId] || topicsList[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121118] border border-red-950/60 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-red-950/30 overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 bg-[#181622] border-b border-red-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>सर्वर गाइड & हेल्प हब (Help & Usage Guide)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/40">
                  ❓ Guide
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                फीचर का क्या उपयोग है और गेम में कैसे इस्तेमाल करना है
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-[#14131d] border-b border-zinc-800/80 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="किसी भी फीचर या सवाल को सर्च करें (Search guide)..."
              className="w-full bg-[#0a0a0f] border border-zinc-800 focus:border-red-500/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500/30"
            />
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Select Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {filteredTopics.map((topic) => {
              const isSelected = topic.id === selectedTopicId;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-md shadow-red-950'
                      : 'bg-[#181622] text-slate-400 hover:text-slate-200 border border-zinc-800/80'
                  }`}
                >
                  <span>{topic.title}</span>
                </button>
              );
            })}
          </div>

          {currentTopic && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Card 1: Iska Kya Use Hai? */}
              <div className="p-3.5 rounded-xl bg-[#181622] border border-red-950/40 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-red-600/20 text-red-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-red-400 tracking-wide">
                    ❓ इसका क्या उपयोग है? (What is its use?)
                  </h3>
                </div>
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-200 pl-6 border-l-2 border-red-600/50">
                  {currentTopic.useCase}
                </p>
              </div>

              {/* Card 2: Kaise Use Karna Hai? */}
              <div className="p-3.5 rounded-xl bg-[#181622] border border-zinc-800/80 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-emerald-600/20 text-emerald-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-emerald-400 tracking-wide">
                    🛠️ इसे कैसे उपयोग करें? (Step-by-Step Guide)
                  </h3>
                </div>
                <div className="space-y-2 pl-2">
                  {currentTopic.howToUse.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: In-Game Commands */}
              {currentTopic.commands && currentTopic.commands.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#0e0d14] border border-red-950/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-red-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-white">
                      ⌨️ इन-गेम चैट कमांड्स (Minecraft Commands)
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    {currentTopic.commands.map((cmd, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-[#07060b] border border-zinc-800/70 font-mono text-[11px] sm:text-xs text-red-300 flex items-center justify-between"
                      >
                        <code>{cmd}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card 4: Pro-Tip */}
              {currentTopic.proTip && (
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">ज़रूरी टिप्स (Pro-Tip): </span>
                    <span>{currentTopic.proTip}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#181622] border-t border-red-950/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            किसी भी कार्ड पर बना <span className="text-red-400 font-bold">?</span> आइकन दबाकर तुरंत मदद लें
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-md shadow-red-950"
          >
            समझ आ गया (Got it)
          </button>
        </div>
      </div>
    </div>
  );
};

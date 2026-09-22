import React from 'react';
import {
  Server,
  Terminal,
  Radio,
  Globe,
  Sliders,
  Users,
  Monitor,
  Rocket
} from 'lucide-react';

interface MobileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  playitClaimStatus?: 'waiting_claim' | 'claimed';
}

export const MobileTabs: React.FC<MobileTabsProps> = ({
  activeTab,
  setActiveTab,
  playitClaimStatus
}) => {
  const tabs = [
    { id: 'server', label: 'Server', icon: Server },
    { id: 'console', label: 'Console', icon: Terminal },
    {
      id: 'playit',
      label: 'Tunnel',
      icon: Radio,
      badge: playitClaimStatus === 'waiting_claim' ? 'Claim' : null
    },
    { id: 'worlds', label: 'Worlds', icon: Globe },
    { id: 'options', label: 'Options', icon: Sliders },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'desktop', label: 'GUI Desktop', icon: Monitor },
    { id: 'deploy', label: 'Railway Deploy', icon: Rocket }
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-[53px] z-20 overflow-x-auto no-scrollbar shadow-xs">
      <div className="max-w-md mx-auto flex items-center px-2 py-1.5 space-x-1 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 relative ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                    isActive
                      ? 'bg-amber-400 text-amber-950'
                      : 'bg-amber-100 text-amber-800 animate-pulse'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

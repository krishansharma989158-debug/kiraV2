import React from 'react';
import { LayoutGrid, Zap, Users, Terminal, Sliders } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onlinePlayerCount?: number;
  playitClaimStatus?: 'waiting_claim' | 'claimed';
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onlinePlayerCount = 0,
  playitClaimStatus
}) => {
  const isHome = activeTab === 'dashboard' || activeTab === 'server';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutGrid,
      badge: null
    },
    {
      id: 'mastercommands',
      label: '55 Cmds',
      icon: Zap,
      badge: '55'
    },
    {
      id: 'players',
      label: 'Players',
      icon: Users,
      badge: onlinePlayerCount > 0 ? String(onlinePlayerCount) : null
    },
    {
      id: 'console',
      label: 'Console',
      icon: Terminal,
      badge: null
    },
    {
      id: 'properties',
      label: 'Settings',
      icon: Sliders,
      badge: null
    }
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl z-40 bg-[#09090b]/95 backdrop-blur-md border-t border-x border-red-950/50 py-1 px-2 shadow-2xl">
      <div className="w-full flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.id === 'dashboard' ? isHome : activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[48px] rounded-xl transition-all active:scale-95 relative ${
                isActive
                  ? 'text-red-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-red-950/90 text-red-400 border border-red-800/40 shadow-md shadow-red-950/50'
                    : 'hover:bg-zinc-900/60 text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold text-red-400' : 'font-medium'}`}>
                {item.label}
              </span>

              {item.badge && (
                <span
                  className={`absolute top-1 right-[22%] text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-none shadow-2xs font-mono ${
                    isActive
                      ? 'bg-red-600 text-white'
                      : 'bg-red-950 text-red-400 border border-red-800/40'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

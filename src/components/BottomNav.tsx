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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1 px-2 shadow-lg safe-area-bottom">
      <div className="max-w-2xl mx-auto flex items-center justify-around">
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
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 shadow-2xs'
                    : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold text-emerald-800' : 'font-medium'}`}>
                {item.label}
              </span>

              {item.badge && (
                <span
                  className={`absolute top-1 right-[22%] text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-none shadow-2xs ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
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

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Home, Trophy, Swords, Wallet, User } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const { t } = useAuth();

  const navItems = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'tournaments', label: t.tournaments, icon: Trophy },
    { id: 'my-matches', label: t.myMatches, icon: Swords },
    { id: 'wallet', label: t.wallet, icon: Wallet },
    { id: 'profile', label: t.profile, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-lg border-t border-[#DCE8F7] dark:border-slate-800/90 pb-safe shadow-xs dark:shadow-[0_-4px_25px_rgba(0,0,0,0.7)] transition-colors">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={`${item.id}-${idx}`}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center select-none transition-all group cursor-pointer"
            >
              <div 
                className={`flex items-center justify-center w-12 h-8 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#176BFF] to-indigo-600 dark:from-[#00F0FF] dark:to-[#176BFF] text-white dark:text-black shadow-md shadow-blue-600/30 dark:shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-105' 
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-[#00F0FF] group-hover:bg-blue-50/60 dark:group-hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
              </div>
              <span 
                className={`text-[11px] mt-0.5 tracking-tight ${
                  isActive 
                    ? 'font-black text-blue-600 dark:text-[#00F0FF]' 
                    : 'font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-slate-200'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

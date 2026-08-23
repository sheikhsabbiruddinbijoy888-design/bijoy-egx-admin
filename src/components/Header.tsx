import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './ProfileModal';
import { 
  Bell, 
  Wallet as WalletIcon, 
  User as UserIcon, 
  Moon, 
  Sun, 
  LogOut,
  X,
  Trophy,
  CheckCircle,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentView }) => {
  const { 
    user, 
    language, 
    setLanguage, 
    t, 
    isDarkMode, 
    toggleDarkMode, 
    unreadNotifsCount, 
    notifications,
    markNotificationsAsRead,
    logout 
  } = useAuth();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Outside click listener for profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleNotificationClick = () => {
    setShowNotifs(!showNotifs);
    setShowUserMenu(false);
    if (!showNotifs && unreadNotifsCount > 0) {
      markNotificationsAsRead();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#0B0F19] border-b border-[#DCE8F7] dark:border-slate-800 shadow-sm transition-all duration-300">
      <div className="w-full max-w-full px-3 py-2 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => onNavigate('home')} 
          className="flex items-center gap-2 flex-shrink-0 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#176BFF] to-[#0B3FA8] dark:from-[#00F0FF] dark:to-[#176BFF] flex items-center justify-center text-white dark:text-black font-extrabold text-xs tracking-wider shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all flex-shrink-0">
            FF
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight text-[#10213A] dark:text-white leading-none">
              EGX FF
            </span>
            <span className="text-[9px] font-bold tracking-widest text-[#176BFF] dark:text-[#00F0FF] leading-tight">
              TOURNAMENT
            </span>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="flex-shrink-0 h-8 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase"
            title="Toggle Language"
          >
            {language === 'bn' ? 'ENG' : 'BN'}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20 dark:hover:text-amber-400 transition-all border border-slate-200 dark:border-slate-700 active:scale-90"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Wallet Balance */}
          <button
            onClick={() => onNavigate('wallet')}
            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 dark:bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-blue-500/50"
          >
            <WalletIcon className="w-3.5 h-3.5 text-blue-200" />
            <span className="text-[11px] font-black tracking-tight whitespace-nowrap">
              ৳{user ? user.balance : 0}
            </span>
          </button>

          {/* Notifications */}
          <div className="relative flex-shrink-0">
            <button
              onClick={handleNotificationClick}
              className="group relative w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Notifications"
            >
              {unreadNotifsCount > 0 && (
                <span className="absolute inset-0 rounded-lg bg-blue-500/20 dark:bg-blue-400/20 animate-ping duration-[3s]" />
              )}
              <motion.div
                animate={unreadNotifsCount > 0 ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
                transition={{ repeat: unreadNotifsCount > 0 ? Infinity : 0, duration: 2, repeatDelay: 3 }}
              >
                <Bell className="w-4 h-4" />
              </motion.div>
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center border border-white dark:border-[#0B0F19] z-10">
                  {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Notification Drawer - Panel Style Overlay */}
            <AnimatePresence>
              {showNotifs && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowNotifs(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="fixed right-2 top-14 w-[calc(100vw-16px)] sm:w-96 bg-white dark:bg-[#111827] shadow-[0_20px_60px_rgba(0,0,0,0.4)] z-[9999] border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden max-h-[80vh]"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.notifications}</h2>
                      </div>
                      <button onClick={() => setShowNotifs(false)} className="w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600 transition-colors flex items-center justify-center">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center">
                          <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                          <p className="text-xs text-slate-500 font-medium">{t.noNotifications}</p>
                        </div>
                      ) : (
                        notifications.map((n, idx) => (
                          <div key={`${n.id}-${idx}`} className={`p-3 rounded-xl border ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/50' : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'}`}>
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                {n.type === 'WINNING' ? <Trophy className="w-4 h-4 text-emerald-600" /> : <Bell className="w-4 h-4 text-blue-600" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{n.title}</h4>
                                  <span className="text-[9px] text-slate-400 whitespace-nowrap">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">{n.message}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Section */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Admin Toggle Badge (Visible to admins only) */}
            {(user?.email?.toLowerCase() === 'joyshakib689@gmail.com' || user?.role?.toUpperCase() === 'ADMIN') && (
              <button
                onClick={() => onNavigate('admin')}
                className="relative group flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 transition-all"
                title="Admin Panel"
              >
                <motion.div
                  animate={{ 
                    opacity: [0.3, 0.5, 0.3],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 rounded-lg bg-orange-500/20 blur-md z-0"
                />
                <div className="relative z-10 w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 overflow-hidden text-white font-black text-[10px] flex items-center justify-center shadow-md border border-amber-400/30">
                  AD
                </div>
              </button>
            )}

            <div className="relative group flex items-center justify-center flex-shrink-0" ref={menuRef}>
            {/* Premium Glow Effect */}
            <motion.div
              animate={{ 
                opacity: shouldReduceMotion ? 0.2 : [0.2, 0.4, 0.2],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-blue-500/10 blur-md z-0"
            />

            {/* Secondary Orbit (CCW) */}
            <motion.div
              animate={shouldReduceMotion ? { rotate: 0 } : { rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0.5 rounded-full border border-dashed border-indigo-400/20 z-0"
            />

            {/* Main Rotating Ring (CW) */}
            <motion.div
              animate={shouldReduceMotion ? { rotate: 0 } : { rotate: 360 }}
              transition={{ 
                duration: 8, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="absolute inset-0 rounded-full border border-transparent border-t-blue-500/40 z-0 group-hover:border-t-blue-500/70 transition-colors"
            >
              {/* Light Highlight */}
              {!shouldReduceMotion && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_#fff] blur-[0.2px]" />
              )}
            </motion.div>

            <button
              onClick={() => {
                if (!user) onNavigate('login');
                else setShowUserMenu(!showUserMenu);
              }}
              className="relative z-10 w-9 h-9 rounded-full overflow-hidden border border-[#DCE8F7] dark:border-slate-700 hover:border-blue-500 transition-all active:scale-95 flex-shrink-0 bg-white dark:bg-slate-900"
            >
              {user?.profileImage || user?.avatar_url ? (
                <img src={user.profileImage || user.avatar_url} alt="P" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-black">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {showUserMenu && user && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-48 max-w-[220px] bg-white dark:bg-[#111827] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 p-2 z-[9999] overflow-hidden"
                >
                  <div className="px-3 py-2.5 border-b border-slate-50 dark:border-slate-800 mb-1 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg">
                    <p className="text-[11px] font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{user.fullName}</p>
                    <p className="text-[9px] font-bold text-slate-500 truncate">{user.email}</p>
                  </div>
                  
                  <div className="space-y-0.5">
                    <button 
                      onClick={() => { setShowUserMenu(false); setShowProfileModal(true); }} 
                      className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors group/item"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400 group-hover/item:text-blue-500" /> 
                      <span>{t.profile}</span>
                    </button>
                    
                    <button 
                      onClick={() => { setShowUserMenu(false); onNavigate('wallet'); }} 
                      className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors group/item"
                    >
                      <WalletIcon className="w-4 h-4 text-slate-400 group-hover/item:text-blue-500" /> 
                      <span>Wallet & History</span>
                    </button>
                    
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                    
                    <button 
                      onClick={() => { setShowUserMenu(false); logout(); }} 
                      className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 transition-colors group/item"
                    >
                      <LogOut className="w-4 h-4 text-rose-400 group-hover/item:text-rose-600" /> 
                      <span>{t.logout}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
        </div>
      </div>
    </div>
  </header>
  );
};

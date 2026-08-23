import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Receipt, 
  Trophy, 
  Swords, 
  Medal, 
  Users2, 
  Home, 
  Image as ImageIcon, 
  Grid, 
  Megaphone, 
  Bell, 
  CreditCard, 
  Globe, 
  Headphones, 
  UserCheck, 
  ScrollText, 
  LogOut, 
  ChevronRight, 
  Menu, 
  X, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Music,
  Gamepad2,
  Mail,
  Phone,
  Wallet,
  CheckCircle2,
  History,
  Shield
} from 'lucide-react';
import { UserLoginEvent } from '../types';
import { safeFetchJson } from '../lib/api';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onExitAdmin,
  children
}) => {
  const { user, logout, token } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const [pendingStats, setPendingStats] = useState<{ deposits: number; withdrawals: number }>({ deposits: 0, withdrawals: 0 });
  const [toasts, setToasts] = useState<{ id: string; message: string; type: string }[]>([]);
  const [recentLogins, setRecentLogins] = useState<UserLoginEvent[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [showLoginsModal, setShowLoginsModal] = useState(false);
  const [selectedUserStats, setSelectedUserStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch initial logins
  const fetchLogins = async () => {
    const res = await safeFetchJson<UserLoginEvent[]>('/api/admin/logins', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok && res.data) {
      setRecentLogins(res.data);
    }
  };

  useEffect(() => {
    if (showLoginsModal) {
      fetchLogins();
    }
  }, [showLoginsModal]);

  useEffect(() => {
    // Connect to SSE for real-time events
    const eventSource = new EventSource('/api/events');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ADMIN_LOGIN_ALERT') {
          // Add notification toast
          const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          setToasts(prev => [{ id, message: data.message, type: 'LOGIN_ALERT' }, ...prev]);
          
          const newLogin: UserLoginEvent = {
            id: `log-${Date.now()}`,
            userId: data.userId || 'N/A',
            fullName: data.fullName || 'Unknown',
            username: data.username || 'Unknown',
            email: data.email || 'N/A',
            mobile: data.mobile || 'N/A',
            freeFireUid: data.freeFireUid || 'N/A',
            freeFireIgn: data.freeFireIgn || 'N/A',
            timestamp: data.timestamp
          };

          setRecentLogins(prev => [newLogin, ...prev].slice(0, 50));
          setUnreadNotifsCount(prev => prev + 1);
          
          // Auto remove toast
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
          }, 6000);
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    return () => eventSource.close();
  }, []);

  const handleViewUserDetails = async (userId: string) => {
    setLoadingStats(true);
    const res = await safeFetchJson<any>(`/api/admin/users/${userId}/details`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setLoadingStats(false);
    if (res.ok && res.data) {
      setSelectedUserStats(res.data);
    }
  };

  useEffect(() => {
    // Fetch live pending items for badges
    const fetchBadges = async () => {
      try {
        const res = await fetch('/api/admin/metrics');
        if (res.ok) {
          const data = await res.json();
          setPendingStats({
            deposits: data.pendingDeposits || data.pendingCounts?.deposits || 0,
            withdrawals: data.pendingWithdrawals || data.pendingCounts?.withdrawals || 0
          });
        }
      } catch (e) {
        // quiet ignore
      }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 15000);
    return () => clearInterval(interval);
  }, []);

  const navGroups = [
    {
      group: 'Core Operations',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'users', label: 'Users Directory', icon: Users },
        { id: 'user-payments', label: 'User Payments (Bonus)', icon: DollarSign }
      ]
    },
    {
      group: 'Financial Center',
      items: [
        { 
          id: 'deposits', 
          label: 'Deposits', 
          icon: ArrowDownCircle,
          badge: pendingStats.deposits > 0 ? pendingStats.deposits : undefined,
          badgeColor: 'bg-emerald-500 text-white'
        },
        { 
          id: 'withdrawals', 
          label: 'Withdrawals', 
          icon: ArrowUpCircle,
          badge: pendingStats.withdrawals > 0 ? pendingStats.withdrawals : undefined,
          badgeColor: 'bg-amber-500 text-white'
        },
        { id: 'transactions', label: 'Financial Ledger', icon: Receipt }
      ]
    },
    {
      group: 'Tournaments & Matches',
      items: [
        { id: 'tournaments', label: 'Tournaments', icon: Trophy },
        { id: 'matches', label: 'Match Rooms & IDs', icon: Swords },
        { id: 'results', label: 'Match Results & Payouts', icon: Medal },
        { id: 'participants', label: 'Participants', icon: Users2 }
      ]
    },
    {
      group: 'Content & Media',
      items: [
        { id: 'homepage', label: 'Homepage Settings', icon: Home },
        { id: 'banner-management', label: 'Banner & Video Media', icon: ImageIcon },
        { id: 'music-management', label: 'Music Management', icon: Music },
        { id: 'categories', label: 'Categories', icon: Grid },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        { id: 'notifications', label: 'Notifications Hub', icon: Bell }
      ]
    },
    {
      group: 'System Settings',
      items: [
        { id: 'payment-settings', label: 'Payment Settings', icon: CreditCard },
        { id: 'website-settings', label: 'Website Settings', icon: Globe },
        { id: 'support-settings', label: 'Support Settings', icon: Headphones },
        { id: 'admin-profile', label: 'Admin Profile', icon: UserCheck },
        { id: 'audit-logs', label: 'Audit Logs', icon: ScrollText }
      ]
    }
  ];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] dark:bg-[#070B14] text-[#10213A] dark:text-slate-100 flex flex-col font-sans selection:bg-[#176BFF] selection:text-white">
      {/* Top Bar for Admin */}
      <header className="sticky top-0 z-50 bg-white dark:bg-[#0B132B] border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="w-full max-w-full px-3 py-2 flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 flex-shrink-0"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#176BFF] to-blue-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-xs flex-shrink-0">
                EGX
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-black text-sm text-[#10213A] dark:text-white tracking-tight uppercase">
                  EGX FF ADMIN
                </span>
                <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  Master Control
                </span>
              </div>
            </div>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            <button
              onClick={() => setShowLoginsModal(true)}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-all border border-slate-200 dark:border-slate-700 active:scale-95"
              title="Recent Logins"
            >
              <UserCheck className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                onSelectTab('notifications');
                setUnreadNotifsCount(0);
              }}
              className="flex-shrink-0 relative w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all border border-slate-200 dark:border-slate-700 active:scale-95"
            >
              <Bell className={`w-4 h-4 ${unreadNotifsCount > 0 ? 'animate-bounce text-blue-600 dark:text-blue-400' : ''}`} />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center border border-white dark:border-[#0B132B] shadow-sm">
                  {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                </span>
              )}
            </button>

            <button
              onClick={onExitAdmin}
              className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-black transition-all hover:scale-105 active:scale-95 shadow-md shadow-blue-500/20"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Exit</span>
            </button>

            {/* Admin Profile - Click to Exit */}
            <button
              onClick={onExitAdmin}
              className="relative group flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-95 transition-all"
              title="Exit to Player View"
            >
              {/* Premium Glow Effect */}
              <motion.div
                animate={{ 
                  opacity: shouldReduceMotion ? 0.2 : [0.2, 0.4, 0.2],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-amber-500/10 blur-md z-0"
              />

              {/* Main Rotating Ring (CW) */}
              <motion.div
                animate={shouldReduceMotion ? { rotate: 0 } : { rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-transparent border-t-amber-500/40 z-0"
              >
                {!shouldReduceMotion && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_#fff]" />
                )}
              </motion.div>

              <div className="relative z-10 w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 overflow-hidden text-white font-black text-[10px] flex items-center justify-center shadow-md border border-slate-200 dark:border-slate-800">
                {user?.profileImage || user?.avatar_url ? (
                  <img src={user.profileImage || user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.fullName ? user.fullName[0].toUpperCase() : 'AD'
                )}
              </div>
            </button>
          </div>
        </div>
      </header>
      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0A1128] p-4 sticky top-[61px] h-[calc(100vh-61px)] overflow-y-auto custom-scrollbar">
          <nav className="space-y-6">
            {navGroups.map((group, gIdx) => (
              <div key={`desktop-group-${gIdx}`} className="space-y-1">
                <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.group}
                </p>
                <div className="space-y-0.5 pt-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={`desktop-nav-${item.id}`}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                          isActive
                            ? 'bg-[#176BFF] text-white shadow-md shadow-blue-500/25 font-black'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-[#10213A] dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${item.badgeColor || 'bg-red-500 text-white'}`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
              <button
                onClick={() => {
                  logout();
                  onExitAdmin();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Session</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#0A1128] h-full shadow-2xl p-4 flex flex-col justify-between overflow-y-auto z-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#176BFF] text-white font-black flex items-center justify-center text-xs">
                      EGX
                    </div>
                    <span className="font-black text-sm text-[#10213A] dark:text-white">Admin Navigation</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <nav className="space-y-6">
                  {navGroups.map((group, gIdx) => (
                    <div key={`mobile-group-${gIdx}`} className="space-y-1">
                      <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {group.group}
                      </p>
                      <div className="space-y-0.5 pt-1">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = currentTab === item.id;
                          return (
                            <button
                              key={`mobile-nav-${item.id}`}
                              onClick={() => handleNavClick(item.id)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                                isActive
                                  ? 'bg-[#176BFF] text-white shadow-md shadow-blue-500/25 font-black'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-[#10213A] dark:hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                <span className="truncate">{item.label}</span>
                              </div>
                              {item.badge !== undefined && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${item.badgeColor || 'bg-red-500 text-white'}`}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <button
                  onClick={onExitAdmin}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ExternalLink className="w-4 h-4 text-[#176BFF]" />
                  <span>Exit to Player Panel</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    onExitAdmin();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Toast Notifications / Alerts */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pointer-events-auto min-w-[320px] bg-white dark:bg-[#1E293B] p-4 rounded-2xl shadow-2xl border-l-4 border-blue-600 dark:border-blue-400 flex items-start gap-4 ring-1 ring-black/5"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white mb-0.5">
                  Live System Alert
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {toast.message}
                </p>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Recent Logins Modal */}
      <AnimatePresence>
        {showLoginsModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Recent Player Logins</h2>
                    <p className="text-xs text-slate-500 font-medium">Real-time session tracker</p>
                  </div>
                </div>
                <button onClick={() => setShowLoginsModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {recentLogins.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">No recent login events recorded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50">
                        <p className="text-[10px] uppercase font-black text-blue-600 dark:text-blue-400 mb-1">Live Count</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{recentLogins.length}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
                        <p className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 mb-1">Status</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">Active</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {recentLogins.map((login, idx) => (
                        <div key={`login-${login.id}-${idx}`} className="group p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
                                {idx + 1}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{login.fullName}</h4>
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                                    @{login.username}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-6 gap-y-1">
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                    <Gamepad2 className="w-3 h-3 text-blue-500" />
                                    <span className="font-bold">UID: {login.freeFireUid}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                    <Shield className="w-3 h-3 text-amber-500" />
                                    <span className="font-bold">IGN: {login.freeFireIgn}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                    <Mail className="w-3 h-3 text-emerald-500" />
                                    <span className="font-medium truncate max-w-[120px]">{login.email}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                    <Phone className="w-3 h-3 text-indigo-500" />
                                    <span className="font-medium">{login.mobile}</span>
                                  </div>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 pt-1">
                                  <History className="w-2.5 h-2.5" />
                                  Logged at: {new Date(login.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleViewUserDetails(login.userId)}
                              disabled={loadingStats}
                              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#176BFF] hover:bg-blue-600 text-white text-[10px] font-black transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                            >
                              {loadingStats ? 'Loading...' : 'View Details'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <button 
                  onClick={() => setShowLoginsModal(false)}
                  className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-xl transition-all active:scale-95"
                >
                  Close Monitor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Player Statistics Modal */}
      <AnimatePresence>
        {selectedUserStats && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserStats(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#0F172A] rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Profile Header Card */}
              <div className="p-8 pb-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" />
                
                <button 
                  onClick={() => setSelectedUserStats(null)}
                  className="absolute top-6 right-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-6 relative">
                  <div className="w-20 h-20 rounded-3xl bg-white p-1.5 shadow-2xl rotate-3">
                    <div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-2xl font-black text-blue-600 overflow-hidden">
                      {selectedUserStats.user.profileImage ? (
                        <img src={selectedUserStats.user.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        selectedUserStats.user.fullName[0]
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white leading-none">{selectedUserStats.user.fullName}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-white/70 text-xs font-bold tracking-wide">@{selectedUserStats.user.username}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        selectedUserStats.user.isVerified ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300'
                      }`}>
                        {selectedUserStats.user.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid Overlay */}
              <div className="px-8 -mt-6 pb-8 relative">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 text-center space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</p>
                    <p className="text-lg font-black text-[#176BFF] dark:text-blue-400 leading-none">৳{selectedUserStats.stats.balance}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 text-center space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matches</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{selectedUserStats.stats.totalMatches}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 text-center space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kills</p>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">{selectedUserStats.stats.totalKills}</p>
                  </div>
                </div>

                <div className="mt-8 space-y-6">
                  {/* Account Information */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-blue-500" />
                      Player Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Gaming Name (IGN)</label>
                        <p className="text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          {selectedUserStats.user.freeFireIgn || 'N/A'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Free Fire UID</label>
                        <p className="text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          {selectedUserStats.user.freeFireUid || 'N/A'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Email Address</label>
                        <p className="text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 truncate">
                          {selectedUserStats.user.email}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Phone Number</label>
                        <p className="text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          {selectedUserStats.user.mobile || selectedUserStats.user.mobileNumber || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Statistics */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Wallet className="w-3 h-3 text-amber-500" />
                      Financial Statistics
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider mb-1">Total Winnings</p>
                        <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">৳{selectedUserStats.stats.totalWinnings}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20">
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-wider mb-1">Total Deposits</p>
                        <p className="text-lg font-black text-blue-700 dark:text-blue-400">৳{selectedUserStats.stats.totalDeposits}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/20">
                        <p className="text-[9px] font-black text-red-600 uppercase tracking-wider mb-1">Total Withdrawals</p>
                        <p className="text-lg font-black text-red-700 dark:text-red-400">৳{selectedUserStats.stats.totalWithdrawals}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Entry Fees Paid</p>
                        <p className="text-lg font-black text-slate-700 dark:text-slate-200">৳{selectedUserStats.user.totalEntryFees || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-0 flex gap-3">
                <button 
                  onClick={() => setSelectedUserStats(null)}
                  className="flex-1 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Content View Container */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-full">
          <div className="max-w-6xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

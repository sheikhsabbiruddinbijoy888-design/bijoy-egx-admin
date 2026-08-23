import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Trophy, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  DollarSign, 
  Medal, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Flame, 
  Swords, 
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { safeFetchJson } from '../lib/api';

interface DashboardMetrics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    totalTournaments: number;
    activeTournaments: number;
    upcomingTournaments: number;
    liveTournaments: number;
    completedTournaments: number;
    totalDeposited: number;
    totalWithdrawn: number;
    totalPrizeDistributed: number;
    totalAdminBonuses: number;
  };
  pendingCounts: {
    deposits: number;
    withdrawals: number;
  };
  recentTournaments: any[];
  recentTransactions: any[];
  recentAuditLogs?: any[];
}

interface AdminDashboardProps {
  onNavigateTab?: (tab: string) => void;
  onNavigate?: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab, onNavigate }) => {
  const navigateTo = (tab: string) => {
    if (onNavigateTab) onNavigateTab(tab);
    else if (onNavigate) onNavigate(tab);
  };
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async () => {
    setRefreshing(true);
    try {
      const res = await safeFetchJson<any>('/api/admin/metrics');
      if (res.ok && res.data) {
        const data = res.data;
        setMetrics({
          overview: data.overview || {
            totalUsers: data.totalUsers || 0,
            activeUsers: data.activeUsers || 0,
            suspendedUsers: data.suspendedUsers || 0,
            totalTournaments: data.totalTournaments || 0,
            activeTournaments: (data.upcomingTournaments || 0) + (data.liveTournaments || 0),
            upcomingTournaments: data.upcomingTournaments || 0,
            liveTournaments: data.liveTournaments || 0,
            completedTournaments: data.completedTournaments || 0,
            totalDeposited: data.totalDeposits || 0,
            totalWithdrawn: data.totalWithdrawals || 0,
            totalPrizeDistributed: data.totalWinningPaid || 0,
            totalAdminBonuses: data.totalAdminBonuses || 0
          },
          pendingCounts: data.pendingCounts || {
            deposits: data.pendingDeposits || 0,
            withdrawals: data.pendingWithdrawals || 0
          },
          recentTournaments: data.recentTournaments || [],
          recentTransactions: data.recentTransactions || [],
          recentAuditLogs: data.recentAuditLogs || []
        });
      }
    } catch (err) {
      console.error('Failed to load admin metrics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const timer = setInterval(fetchMetrics, 20000);
    return () => clearInterval(timer);
  }, []);

  const overview = metrics?.overview || {
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalTournaments: 0,
    activeTournaments: 0,
    upcomingTournaments: 0,
    liveTournaments: 0,
    completedTournaments: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    totalPrizeDistributed: 0,
    totalAdminBonuses: 0
  };

  const pending = metrics?.pendingCounts || { deposits: 0, withdrawals: 0 };

  return (
    <div className="space-y-8">
      {/* Header Banner with Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#176BFF] text-[11px] font-black uppercase tracking-wider">
              Control Panel
            </span>
            <span className="text-xs text-slate-400 font-medium">Realtime Connected</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#10213A] dark:text-white tracking-tight mt-1">
            Tournament Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor real-time player balances, match allocations, and financial transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMetrics}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-[#10213A] dark:text-white text-xs font-black flex items-center gap-2 transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 text-[#176BFF] ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Updating...' : 'Sync Live'}</span>
          </button>
        </div>
      </div>

      {/* Critical Action Alerts if pending items exist */}
      {(pending.deposits > 0 || pending.withdrawals > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pending.deposits > 0 && (
            <div 
              onClick={() => navigateTo('deposits')}
              className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-all shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                    {pending.deposits} Pending Deposit{pending.deposits > 1 ? 's' : ''}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Awaiting verification and wallet credit
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center gap-1">
                Review <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          )}

          {pending.withdrawals > 0 && (
            <div 
              onClick={() => navigateTo('withdrawals')}
              className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-all shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                  <ArrowUpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    {pending.withdrawals} Pending Withdrawal{pending.withdrawals > 1 ? 's' : ''}
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Process user bKash/Nagad/Rocket payouts
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-amber-600 text-white text-xs font-black flex items-center gap-1">
                Review <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div 
          onClick={() => navigateTo('users')}
          className="bg-white dark:bg-[#0B132B] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Users</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#176BFF] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#10213A] dark:text-white mt-3">
            {overview.totalUsers}
          </p>
          <div className="flex items-center gap-3 text-xs mt-2 font-bold">
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> {overview.activeUsers} Active
            </span>
            {overview.suspendedUsers > 0 && (
              <span className="text-red-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" /> {overview.suspendedUsers} Suspended
              </span>
            )}
          </div>
        </div>

        {/* Tournaments Status */}
        <div 
          onClick={() => navigateTo('tournaments')}
          className="bg-white dark:bg-[#0B132B] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Tournaments</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#10213A] dark:text-white mt-3">
            {overview.totalTournaments}
          </p>
          <div className="flex items-center gap-2 text-xs mt-2 font-bold">
            <span className="text-blue-500">{overview.upcomingTournaments} Upcoming</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-red-500 animate-pulse">{overview.liveTournaments} Live</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-400">{overview.completedTournaments} Done</span>
          </div>
        </div>

        {/* Total Confirmed Deposits */}
        <div 
          onClick={() => navigateTo('deposits')}
          className="bg-white dark:bg-[#0B132B] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Deposits Verified</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-3 font-mono">
            ৳{overview.totalDeposited.toLocaleString()}
          </p>
          <div className="text-xs text-slate-400 mt-2 font-medium">
            Platform inflow via bKash / Nagad / Rocket
          </div>
        </div>

        {/* Total Withdrawals */}
        <div 
          onClick={() => navigateTo('withdrawals')}
          className="bg-white dark:bg-[#0B132B] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Withdrawals Paid</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-3 font-mono">
            ৳{overview.totalWithdrawn.toLocaleString()}
          </p>
          <div className="text-xs text-slate-400 mt-2 font-medium">
            Total completed player cashouts
          </div>
        </div>
      </div>

      {/* Secondary Financial Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-lg shadow-blue-500/15 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-blue-200">
              Total Prizes Awarded
            </span>
            <Medal className="w-6 h-6 text-amber-300" />
          </div>
          <div className="my-4">
            <h3 className="text-3xl sm:text-4xl font-black font-mono">
              ৳{overview.totalPrizeDistributed.toLocaleString()}
            </h3>
            <p className="text-xs text-blue-100 mt-1">
              Calculated across kill rewards, chicken dinners and rank placements.
            </p>
          </div>
          <button
            onClick={() => navigateTo('results')}
            className="w-full py-2.5 rounded-xl bg-white text-blue-700 font-black text-xs hover:bg-blue-50 transition-all flex items-center justify-center gap-1.5"
          >
            <Medal className="w-4 h-4" /> Manage Match Results
          </button>
        </div>

        <div className="bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Admin Direct Bonuses
            </span>
            <DollarSign className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="my-4">
            <h3 className="text-3xl sm:text-4xl font-black text-[#10213A] dark:text-white font-mono">
              ৳{overview.totalAdminBonuses.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Dispatched directly to user wallets for promotions & events.
            </p>
          </div>
          <button
            onClick={() => navigateTo('user-payments')}
            className="w-full py-2.5 rounded-xl bg-[#176BFF] text-white font-black text-xs hover:bg-blue-600 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <DollarSign className="w-4 h-4" /> Send User Bonus
          </button>
        </div>
      </div>

      {/* Quick Operations Matrix */}
      <div className="bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base font-black text-[#10213A] dark:text-white tracking-tight">
          Quick Operational Shortcuts
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigateTo('tournaments')}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 hover:border-blue-300 text-left transition-all group"
          >
            <Trophy className="w-5 h-5 text-[#176BFF] mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-black text-[#10213A] dark:text-white">Create Match</p>
            <p className="text-[10px] text-slate-400">Launch new room</p>
          </button>

          <button
            onClick={() => navigateTo('matches')}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 hover:border-blue-300 text-left transition-all group"
          >
            <Swords className="w-5 h-5 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-black text-[#10213A] dark:text-white">Room Passwords</p>
            <p className="text-[10px] text-slate-400">Set ID & Pass</p>
          </button>

          <button
            onClick={() => navigateTo('banner-management')}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 hover:border-blue-300 text-left transition-all group"
          >
            <TrendingUp className="w-5 h-5 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-black text-[#10213A] dark:text-white">Banner Media</p>
            <p className="text-[10px] text-slate-400">Upload Video & Img</p>
          </button>

          <button
            onClick={() => navigateTo('payment-settings')}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 hover:border-blue-300 text-left transition-all group"
          >
            <Flame className="w-5 h-5 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-black text-[#10213A] dark:text-white">Payment Numbers</p>
            <p className="text-[10px] text-slate-400">Update bKash/Nagad</p>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { safeFetchJson } from '../lib/api';
import { 
  User, 
  LogOut, 
  Key, 
  Save, 
  Trophy, 
  Wallet, 
  Swords, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  Gamepad2,
  Lock,
  Phone,
  Mail,
  ShieldCheck,
  ShieldAlert,
  BadgeCheck,
  Sparkles,
  Crown,
  Shield,
  ArrowRight,
  Zap,
  Sliders,
  Camera
} from 'lucide-react';

interface ProfileViewProps {
  onOpenAuth: () => void;
  onNavigateToAdmin?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  onOpenAuth,
  onNavigateToAdmin
}) => {
  const { user, token, t, logout, refreshUserData } = useAuth();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [freeFireUid, setFreeFireUid] = useState('');
  const [freeFireIgn, setFreeFireIgn] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setUsername(user.username || '');
      setFreeFireUid(user.freeFireUid || '');
      setFreeFireIgn(user.freeFireIgn || '');
      setMobileNumber(user.mobile || user.mobileNumber || '');
      setWhatsappNumber(user.whatsapp || user.whatsappNumber || '');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-slate-800 text-[#176BFF] flex items-center justify-center mx-auto shadow-inner">
          <User className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-[#10213A] dark:text-white">
          Sign In to Your Account
        </h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Login or create an account with your Free Fire UID to join custom matches and win cash prizes!
        </p>
        <button
          onClick={onOpenAuth}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#176BFF] to-[#2687FF] text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
        >
          {t.login} / {t.signup}
        </button>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (mobileNumber && !bdPhoneRegex.test(mobileNumber.trim())) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)');
      setLoading(false);
      return;
    }

    if (whatsappNumber && !bdPhoneRegex.test(whatsappNumber.trim())) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)');
      setLoading(false);
      return;
    }

    try {
      const res = await safeFetchJson<any>('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName,
          username,
          freeFireUid,
          freeFireIgn,
          mobileNumber,
          whatsappNumber
        })
      });

      if (!res.ok || !res.data) {
        setErrorMsg(res.error || 'Failed to update profile');
      } else {
        setSuccessMsg(t.profileUpdated);
        await refreshUserData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    setPassLoading(true);
    try {
      const res = await safeFetchJson<any>('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (!res.ok || !res.data) {
        setErrorMsg(res.error || 'Failed to change password');
      } else {
        setSuccessMsg('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setPassLoading(false);
    }
  };

  const isSuspended = user?.status === 'SUSPENDED' || (user as any)?.account_status === 'SUSPENDED';
  const isVerified = Boolean(user?.isVerified || (user as any)?.is_verified || user?.verificationStatus === 'VERIFIED');
  const isAdmin = (user?.email && user.email.toLowerCase() === 'joyshakib689@gmail.com') || user?.role?.toUpperCase() === 'ADMIN';

  const handleAdminRedirect = () => {
    if (onNavigateToAdmin) {
      onNavigateToAdmin();
    } else {
      window.location.hash = 'admin/dashboard';
      window.history.pushState({}, '', '/admin');
      window.dispatchEvent(new Event('popstate'));
      window.dispatchEvent(new Event('hashchange'));
    }
  };

  return (
    <div className="w-full max-w-lg sm:max-w-2xl md:max-w-4xl mx-auto px-4 py-4 space-y-5 pb-24">
      {/* PROMINENT ACCOUNT SUSPENDED BANNER (WHEN USER IS SUSPENDED) */}
      {isSuspended && (
        <div className="w-full rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 p-5 text-white shadow-xl shadow-red-500/25 border-2 border-red-300/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xs sm:text-sm uppercase tracking-wider bg-white text-red-700 px-2.5 py-0.5 rounded-lg shadow-xs">
                  ACCOUNT SUSPENDED
                </span>
                <span className="text-xs font-mono bg-red-800/80 text-white px-2 py-0.5 rounded-md">
                  Status: Restricted
                </span>
              </div>
              <p className="text-xs text-white font-medium mt-1 leading-relaxed">
                Your player account has been suspended by administration. Tournament registrations and wallet deposits/withdrawals are currently restricted. Please contact EGX Support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EXCLUSIVE NEON ANIMATED ADMIN BUTTON (VISIBLE ONLY TO ADMIN: joyshakib689@gmail.com) */}
      {isAdmin && (
        <div className="relative group w-full rounded-2xl p-[2px] overflow-hidden transition-all duration-300 animate-neon-admin-glow hover:scale-[1.02] active:scale-[0.98]">
          {/* Animated gradient spinning/flowing border background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF] via-[#8B5CF6] to-[#2563EB] animate-neon-border opacity-90 blur-[1px]" />

          {/* Shimmer sweep effect */}
          <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none rounded-2xl">
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-25 animate-shimmer-sweep" />
          </div>

          <button
            id="admin-dashboard-exclusive-btn"
            onClick={handleAdminRedirect}
            className="relative z-20 w-full py-4 px-6 rounded-[14px] bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#7C3AED] hover:from-[#1D4ED8] hover:via-[#3B82F6] hover:to-[#8B5CF6] text-white flex items-center justify-between shadow-2xl cursor-pointer transition-all duration-300 border border-white/20 select-none group-hover:border-cyan-300/60"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-violet-400 p-[2px] shadow-lg shadow-cyan-500/40 shrink-0 flex items-center justify-center">
                <div className="w-full h-full bg-[#0F172A] rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-[#00F0FF] animate-pulse" />
                </div>
              </div>

              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black tracking-wider uppercase text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.7)] flex items-center gap-1.5 font-sans">
                    ADMIN DASHBOARD
                    <Crown className="w-4 h-4 text-amber-300 fill-amber-300 animate-bounce" />
                  </span>
                </div>
                <p className="text-[11px] font-medium text-cyan-200/90 font-mono tracking-tight flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-300 inline" /> Master Tournament & Finance Control
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-2">
              <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/15 backdrop-blur-md text-white border border-white/30 shadow-xs">
                Instant Access
              </span>
              <div className="w-8 h-8 rounded-full bg-white/15 group-hover:bg-white/25 flex items-center justify-center text-white transition-all transform group-hover:translate-x-1">
                <ArrowRight className="w-4 h-4 text-cyan-200" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="w-full rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 border border-[#DCE8F7] dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="relative shrink-0 p-1"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Premium Glow Effect */}
              <motion.div
                animate={{ 
                  opacity: shouldReduceMotion ? 0.3 : [0.3, 0.6, 0.3],
                  scale: isHovered ? [1.1, 1.2, 1.1] : [1, 1.1, 1]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl z-0"
              />

              {/* Secondary Orbit (Counter-Clockwise) */}
              <motion.div
                animate={shouldReduceMotion ? { rotate: 0 } : { rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-indigo-400/20 z-0"
              />

              {/* Main Rotating Ring (Clockwise) */}
              <motion.div
                animate={shouldReduceMotion ? { rotate: 0 } : { rotate: 360 }}
                transition={{ 
                  duration: isHovered ? 6 : 10, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500/60 border-l-blue-400/40 z-0"
              >
                {/* Light Particle Highlight */}
                {!shouldReduceMotion && (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_#fff] blur-[0.3px]" />
                )}
              </motion.div>

              {/* Inner Decorative Ring */}
              <div className="absolute inset-0.5 rounded-full border border-blue-500/10 z-0" />

              {/* Static Circular Profile Image */}
              <div className="relative z-10 w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#176BFF] to-[#0B3FA8] flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-500/20 border-4 border-white dark:border-slate-800">
                {user.profileImage || user.avatar_url ? (
                  <img 
                    src={user.profileImage || user.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <span>{user.fullName ? user.fullName[0].toUpperCase() : 'U'}</span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-[#10213A] dark:text-white truncate">
                  {user.fullName}
                </h3>
                {isVerified ? (
                  /* Glowing Green VERIFIED PROFILE Badge with Checkmark */
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.35)] animate-pulse">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20 shrink-0" />
                    VERIFIED PROFILE
                  </span>
                ) : isSuspended ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                    SUSPENDED
                  </span>
                ) : (
                  /* Neutral UNVERIFIED PROFILE Status */
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                    UNVERIFIED PROFILE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {user.email} • <span className="font-mono text-slate-500">@{user.username || 'user'}</span>
              </p>
              <p className="text-xs font-black text-[#176BFF] font-mono mt-0.5">
                Player ID: #{user.id}
              </p>
            </div>
          </div>

          {/* Verification Callout Box */}
          <div className="text-left sm:text-right">
            {isVerified ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Admin Verified Player</span>
              </div>
            ) : isSuspended ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                <span>Account Suspended</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Verification Pending</span>
              </div>
            )}
          </div>
        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-[#EAF4FF] dark:bg-slate-800/80 rounded-2xl p-2.5 text-center border border-[#DCE8F7] dark:border-slate-700">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#60708A] dark:text-slate-400 block">
              {t.currentBalance}
            </span>
            <span className="text-base font-black text-[#176BFF] dark:text-blue-400">
              ৳{user.balance}
            </span>
          </div>

          <div className="bg-[#EAF4FF] dark:bg-slate-800/80 rounded-2xl p-2.5 text-center border border-[#DCE8F7] dark:border-slate-700">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#60708A] dark:text-slate-400 block">
              {t.totalWinnings}
            </span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              ৳{user.totalWinnings || 0}
            </span>
          </div>

          <div className="bg-[#EAF4FF] dark:bg-slate-800/80 rounded-2xl p-2.5 text-center border border-[#DCE8F7] dark:border-slate-700">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#60708A] dark:text-slate-400 block">
              {t.totalMatches}
            </span>
            <span className="text-base font-black text-[#10213A] dark:text-white">
              {user.totalMatchesPlayed || user.totalMatches || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Edit Profile Form */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-[#DCE8F7] dark:border-slate-800 shadow-sm space-y-4">
        <h4 className="text-sm font-black text-[#10213A] dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-[#176BFF]" />
          Game & Contact Information
        </h4>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                {t.fullName}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl bg-[#F5F9FF] dark:bg-slate-800 border border-[#DCE8F7] dark:border-slate-700 text-sm font-bold text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                Username (@)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username"
                className="w-full px-4 py-3 rounded-2xl bg-[#F5F9FF] dark:bg-slate-800 border border-[#DCE8F7] dark:border-slate-700 text-sm font-bold font-mono text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                UID
              </label>
              <input
                type="text"
                value={freeFireUid}
                onChange={(e) => setFreeFireUid(e.target.value)}
                placeholder="e.g. 192837465"
                required
                className="w-full px-4 py-3 rounded-2xl bg-[#F5F9FF] dark:bg-slate-800 border border-[#DCE8F7] dark:border-slate-700 text-sm font-mono font-bold text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                Gaming Name
              </label>
              <input
                type="text"
                value={freeFireIgn}
                onChange={(e) => setFreeFireIgn(e.target.value)}
                placeholder="e.g. RAKIB_YT"
                required
                className="w-full px-4 py-3 rounded-2xl bg-[#F5F9FF] dark:bg-slate-800 border border-[#DCE8F7] dark:border-slate-700 text-sm font-bold text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                {t.mobileNumber} (11 Digits)
              </label>
              <input
                type="tel"
                value={mobileNumber}
                maxLength={11}
                minLength={11}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="01XXXXXXXXX"
                className="w-full px-4 py-3 rounded-2xl bg-[#F5F9FF] dark:bg-slate-800 border border-[#DCE8F7] dark:border-slate-700 text-sm font-bold font-mono text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                {t.whatsappNumber} (11 Digits)
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                maxLength={11}
                minLength={11}
                onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="01XXXXXXXXX"
                className="w-full px-4 py-3 rounded-2xl bg-[#F5F9FF] dark:bg-slate-800 border border-[#DCE8F7] dark:border-slate-700 text-sm font-bold font-mono text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-blue-600/35 hover:shadow-xl hover:shadow-blue-600/50 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border border-blue-400/30 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? 'Saving...' : t.saveChanges}</span>
          </button>
        </form>
      </div>

      {/* Change Password Box */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-[#DCE8F7] dark:border-slate-800 shadow-sm space-y-4">
        <h4 className="text-sm font-black text-[#10213A] dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#176BFF]" />
          {t.changePassword}
        </h4>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
              {t.currentPassword}
            </label>
            <div className="relative">
              <input
                type={showCurrentPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-10 rounded-2xl bg-[#F5F9FF] dark:bg-slate-800 border border-[#DCE8F7] dark:border-slate-700 text-sm font-bold text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
              {t.newPassword} (Min 6 characters)
            </label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-10 rounded-2xl bg-[#F5F9FF] dark:bg-slate-800 border border-[#DCE8F7] dark:border-slate-700 text-sm font-bold text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={passLoading}
            className="w-full py-4 px-4 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50"
          >
            {passLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Key className="w-4 h-4" />
            )}
            <span>{passLoading ? 'Updating Password...' : t.changePassword}</span>
          </button>
        </form>
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="w-full py-4 px-4 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 font-black text-xs sm:text-sm uppercase tracking-wider border border-red-200 dark:border-red-900/60 shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>{t.logout}</span>
      </button>
    </div>
  );
};
export default ProfileView;

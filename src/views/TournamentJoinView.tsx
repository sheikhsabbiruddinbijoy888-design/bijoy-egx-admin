import React, { useState, useEffect } from 'react';
import { Tournament } from '../types';
import { useAuth } from '../context/AuthContext';
import { safeFetchJson } from '../lib/api';
import { getBangladeshDateTime } from '../lib/timeUtils';
import { 
  Trophy, 
  Coins, 
  Crosshair, 
  Users, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft, 
  Wallet, 
  Gamepad2, 
  UserCheck, 
  Sparkles,
  Swords,
  Info
} from 'lucide-react';
import { PrizePoolModal } from '../components/PrizePoolModal';
import { RulesModal } from '../components/RulesModal';

interface TournamentJoinViewProps {
  tournament: Tournament;
  onBack: () => void;
  onSuccess: (tournament: Tournament) => void;
  onNavigateToWallet: () => void;
  onNavigateToProfile: () => void;
}

export const TournamentJoinView: React.FC<TournamentJoinViewProps> = ({
  tournament,
  onBack,
  onSuccess,
  onNavigateToWallet,
  onNavigateToProfile
}) => {
  const { user, token, refreshUserData, refreshBootstrap } = useAuth();

  const [freeFireUid, setFreeFireUid] = useState<string>(user?.freeFireUid || '');
  const [inGameName, setInGameName] = useState<string>(user?.freeFireIgn || user?.username || '');
  const [agreedToRules, setAgreedToRules] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [prizeModalOpen, setPrizeModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      if (!freeFireUid && user.freeFireUid) setFreeFireUid(user.freeFireUid);
      if (!inGameName && (user.freeFireIgn || user.username)) setInGameName(user.freeFireIgn || user.username || '');
    }
  }, [user]);

  const bstTime = getBangladeshDateTime(tournament.matchTimestamp || tournament.tournamentStartAt || Date.now());

  const userBalance = Number(user?.balance) || 0;
  const entryFee = Number(tournament.entryFee) || 0;
  const hasSufficientBalance = userBalance >= entryFee;
  const remainingSlots = Math.max(0, tournament.totalSlots - (tournament.joinedCount || tournament.participants.length));
  const isJoined = Boolean(user && tournament.participants.some(p => p.userId === user.id));

  const isSuspended = user?.status === 'SUSPENDED' || (user as any)?.account_status === 'SUSPENDED';

  const handleConfirmJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) {
      setErrorMsg('Please login to your account to join this tournament.');
      return;
    }

    if (isSuspended) {
      setErrorMsg('Your account has been suspended by administration. You cannot join tournaments.');
      return;
    }

    if (!freeFireUid.trim()) {
      setErrorMsg('Free Fire UID is mandatory. Please enter your valid Free Fire numeric Player UID.');
      return;
    }

    if (!inGameName.trim()) {
      setErrorMsg('In-Game Name (IGN) is mandatory. Please enter your exact Free Fire player nickname.');
      return;
    }

    if (!hasSufficientBalance) {
      setErrorMsg(`Insufficient wallet balance! Entry fee is ৳${entryFee}, but your balance is ৳${userBalance}. Please add money.`);
      return;
    }

    if (!agreedToRules) {
      setErrorMsg('Please review and accept the official tournament fair-play rules.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await safeFetchJson<any>(`/api/tournaments/${tournament.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          freeFireUid: freeFireUid.trim(),
          inGameName: inGameName.trim()
        })
      });

      if (!res.ok || !res.data?.success) {
        throw new Error(res.error || res.data?.error || 'Failed to join tournament');
      }

      setSuccessMsg(res.data.message || `Successfully registered for ${tournament.name}!`);
      await refreshUserData();
      await refreshBootstrap();

      // Short delay for the user to see the success confirmation, then navigate to My Matches
      setTimeout(() => {
        onSuccess(res.data.tournament || tournament);
      }, 1200);

    } catch (err: any) {
      setErrorMsg(err.message || 'Error joining tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg sm:max-w-2xl md:max-w-3xl mx-auto px-4 py-4 space-y-5 pb-28 animate-in fade-in duration-200">
      {/* Top Header with Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-black text-[#176BFF] hover:text-blue-700 dark:text-blue-400 p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tournaments</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrizeModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center gap-1.5 border border-amber-500/30 transition-all cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5" />
            Prize Pool
          </button>
          <button
            onClick={() => setRulesModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 text-[#176BFF] dark:text-blue-400 text-xs font-black flex items-center gap-1.5 border border-blue-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Rules
          </button>
        </div>
      </div>

      {/* Main Tournament Overview Banner Card */}
      <div className="bg-white dark:bg-[#0B132B] rounded-3xl border border-blue-200/80 dark:border-slate-800 overflow-hidden shadow-xs space-y-4">
        {/* Cover Photo */}
        <div className="relative aspect-21/9 w-full bg-slate-900 overflow-hidden">
          <img
            src={tournament.coverImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'}
            alt={tournament.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-black/40 to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-[#176BFF] text-white font-black text-xs uppercase tracking-wider shadow-md">
              {tournament.category}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-xs text-white font-bold text-xs border border-white/20">
              {tournament.map || 'Bermuda'}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h1 className="text-lg sm:text-xl font-black tracking-tight drop-shadow-md">
              {tournament.name}
            </h1>
            <p className="text-xs text-blue-200 font-bold mt-0.5">
              Tournament ID: #{tournament.id}
            </p>
          </div>
        </div>

        {/* Date, Time & Year Grid (Bangladesh Time BST) */}
        <div className="p-4 sm:p-6 pt-0 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-blue-50/70 dark:from-slate-800/60 dark:via-slate-800/30 dark:to-slate-800/60 p-4 rounded-2xl border border-blue-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#176BFF]" /> Match Date
              </span>
              <span className="text-xs sm:text-sm font-black text-[#10213A] dark:text-white mt-0.5 block">
                {bstTime.formattedDateUpper}
              </span>
              <span className="text-[10px] font-bold text-slate-400">Year {bstTime.year}</span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#176BFF]" /> Start Time
              </span>
              <span className="text-xs sm:text-sm font-black text-[#176BFF] dark:text-blue-400 mt-0.5 block">
                {bstTime.formattedTime12}
              </span>
              <span className="text-[10px] font-bold text-slate-400">Bangladesh (BST)</span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block flex items-center gap-1">
                <Coins className="w-3 h-3 text-emerald-500" /> Entry Fee
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block font-mono">
                ৳{tournament.entryFee}
              </span>
              <span className="text-[10px] font-bold text-slate-400">Per Player</span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-500" /> Slots Left
              </span>
              <span className="text-xs sm:text-sm font-black text-[#10213A] dark:text-white mt-0.5 block font-mono">
                {remainingSlots} / {tournament.totalSlots}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {tournament.joinedCount || tournament.participants.length} Registered
              </span>
            </div>
          </div>

          {/* Quick Prize Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 block">
                  Total Prize Pool
                </span>
                <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                  ৳{tournament.prizePool.toLocaleString()}
                </span>
              </div>
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-400 block">
                  Per Kill Bonus
                </span>
                <span className="text-base font-black text-rose-600 dark:text-rose-400 font-mono">
                  ৳{tournament.perKill || 0}
                </span>
              </div>
              <Crosshair className="w-6 h-6 text-rose-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Join Form & Validation Section */}
      <div className="bg-white dark:bg-[#0B132B] p-5 sm:p-6 rounded-3xl border border-blue-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-[#176BFF] flex items-center justify-center">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#10213A] dark:text-white">
                Player Registration Details
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Mandatory Free Fire in-game credentials for match room allocation.
              </p>
            </div>
          </div>
        </div>

        {/* User Balance Status Card */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          hasSufficientBalance
            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200'
            : 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 text-red-950 dark:text-red-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              hasSufficientBalance ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider block opacity-80">
                Your Current Wallet Balance
              </span>
              <div className="text-lg font-black font-mono flex items-center gap-2">
                <span>৳{userBalance}</span>
                <span className="text-xs font-bold opacity-75">
                  (Entry: ৳{entryFee})
                </span>
              </div>
            </div>
          </div>

          {!hasSufficientBalance ? (
            <button
              onClick={onNavigateToWallet}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-500/25 active:scale-95 transition-all cursor-pointer self-start sm:self-center"
            >
              Add Money Now →
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Balance Sufficient</span>
            </div>
          )}
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleConfirmJoin} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Free Fire UID Input */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Free Fire UID <span className="text-red-500">*</span></span>
                <span className="text-[10px] font-medium text-slate-400">Numeric Only</span>
              </label>
              <input
                type="text"
                required
                value={freeFireUid}
                onChange={(e) => setFreeFireUid(e.target.value)}
                placeholder="e.g. 1928471928"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold focus:border-[#176BFF] focus:outline-hidden dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Your numeric Free Fire Player ID found in your profile.
              </p>
            </div>

            {/* In-Game Name Input */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                <span>In-Game Name (IGN) <span className="text-red-500">*</span></span>
                <span className="text-[10px] font-medium text-slate-400">Exact Nickname</span>
              </label>
              <input
                type="text"
                required
                value={inGameName}
                onChange={(e) => setInGameName(e.target.value)}
                placeholder="e.g. ⚡SHAKIB_OP⚡"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:border-[#176BFF] focus:outline-hidden dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Your exact Free Fire character name.
              </p>
            </div>
          </div>

          {/* Rules Checkbox */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
            <input
              type="checkbox"
              id="rulesCheck"
              checked={agreedToRules}
              onChange={(e) => setAgreedToRules(e.target.checked)}
              className="w-4 h-4 rounded text-[#176BFF] mt-0.5 cursor-pointer accent-[#176BFF]"
            />
            <label htmlFor="rulesCheck" className="text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
              I agree to abide by the official Free Fire tournament regulations (Mobile only, no emulators, hacks, or teaming).
            </label>
          </div>

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="font-bold">{errorMsg}</span>
                {errorMsg.includes('balance') && (
                  <button 
                    type="button"
                    onClick={onNavigateToWallet}
                    className="block font-black underline text-red-700 dark:text-red-300 hover:text-red-800"
                  >
                    Add Balance via bKash/Nagad →
                  </button>
                )}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 animate-bounce" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
            >
              Cancel
            </button>

            {isJoined ? (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 opacity-90 shadow-md shadow-emerald-500/25"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                Already Registered
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !hasSufficientBalance || remainingSlots <= 0}
                className="w-full sm:w-auto px-10 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-[#176BFF] to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Processing Join...</span>
                  </>
                ) : (
                  <>
                    <Swords className="w-4 h-4" />
                    <span>Confirm Join (Pay ৳{entryFee})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Modals */}
      <PrizePoolModal
        tournament={tournament}
        isOpen={prizeModalOpen}
        onClose={() => setPrizeModalOpen(false)}
      />

      <RulesModal
        tournament={tournament}
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
      />
    </div>
  );
};

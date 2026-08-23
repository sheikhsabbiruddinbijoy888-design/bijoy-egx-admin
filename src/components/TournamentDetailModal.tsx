import React, { useState, useEffect } from 'react';
import { Tournament } from '../types';
import { useAuth } from '../context/AuthContext';
import { safeFetchJson } from '../lib/api';
import { getBangladeshDateTime, calculateCountdown } from '../lib/timeUtils';
import { 
  X, 
  Trophy, 
  Users, 
  Clock, 
  Shield, 
  Key, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle,
  Gamepad2,
  ChevronRight,
  Flame,
  Swords,
  Crown
} from 'lucide-react';
import { PrizePoolModal } from './PrizePoolModal';
import { RulesModal } from './RulesModal';

interface TournamentDetailModalProps {
  tournament: Tournament | null;
  onClose: () => void;
  onNavigateToWallet: () => void;
  onNavigateToProfile: () => void;
}

export const TournamentDetailModal: React.FC<TournamentDetailModalProps> = ({
  tournament,
  onClose,
  onNavigateToWallet,
  onNavigateToProfile
}) => {
  const { user, token, t, refreshUserData, refreshBootstrap } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<{ roomId?: string; roomPassword?: string; isReleased?: boolean } | null>(null);

  // Inline FF UID & IGN inputs if user profile doesn't have them
  const [freeFireUid, setFreeFireUid] = useState(user?.freeFireUid || '');
  const [freeFireIgn, setFreeFireIgn] = useState(user?.freeFireIgn || '');

  // Embedded auxiliary modals
  const [prizeModalOpen, setPrizeModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  // Live countdown
  const [countdown, setCountdown] = useState(() => 
    tournament ? calculateCountdown(tournament.matchTimestamp || tournament.tournamentStartAt) : { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, formatted: '00h 00m 00s' }
  );

  useEffect(() => {
    if (user) {
      if (user.freeFireUid && !freeFireUid) setFreeFireUid(user.freeFireUid);
      if (user.freeFireIgn && !freeFireIgn) setFreeFireIgn(user.freeFireIgn);
    }
  }, [user]);

  useEffect(() => {
    if (!tournament) return;
    const update = () => {
      setCountdown(calculateCountdown(tournament.matchTimestamp || tournament.tournamentStartAt));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [tournament]);

  useEffect(() => {
    if (!tournament || !token) return;

    const fetchRoom = async () => {
      try {
        const res = await safeFetchJson<{ roomId?: string; roomPassword?: string; isReleased?: boolean }>(
          `/api/tournaments/${tournament.id}/room`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok && res.data) {
          setRoomData(res.data);
        }
      } catch {
        // ignore
      }
    };

    fetchRoom();
    const pollInterval = setInterval(fetchRoom, 10000);
    return () => clearInterval(pollInterval);
  }, [tournament, token]);

  if (!tournament) return null;

  const isJoined = tournament.participants?.some(p => p.userId === user?.id) ?? false;
  const isAdmin = user?.role === 'admin';
  const bstTime = getBangladeshDateTime(tournament.matchTimestamp || tournament.tournamentStartAt || Date.now());

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleJoin = async () => {
    if (!user) {
      setErrorMsg('Please login to join this tournament.');
      return;
    }

    if (!freeFireUid.trim() || !freeFireIgn.trim()) {
      setErrorMsg('Please enter your Free Fire UID (Numeric) and In-Game Name (IGN) to participate.');
      return;
    }

    if (user.balance < tournament.entryFee) {
      setErrorMsg(`Insufficient wallet balance (৳${user.balance}). Tournament entry fee is ৳${tournament.entryFee}. Please add money.`);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await safeFetchJson<{ message: string; tournament: Tournament; newBalance: number }>(
        `/api/tournaments/${tournament.id}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            freeFireUid: freeFireUid.trim(),
            freeFireIgn: freeFireIgn.trim()
          })
        }
      );

      if (!res.ok) {
        throw new Error(res.error || 'Failed to join tournament');
      }

      setSuccessMsg('Successfully joined the tournament! Your slot has been reserved.');
      await refreshUserData();
      await refreshBootstrap();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg max-h-[92vh] bg-white dark:bg-[#0B132B] rounded-3xl overflow-hidden shadow-2xl border border-blue-100 dark:border-slate-800 flex flex-col">
          
          {/* Header with cover image */}
          <div className="relative h-44 sm:h-52 bg-slate-950 shrink-0">
            <img
              src={tournament.coverImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'}
              alt={tournament.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-black/40 to-transparent" />
            
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="absolute bottom-3 left-4 right-4 text-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-[#176BFF] text-white font-black text-[10px] uppercase tracking-wider">
                  {tournament.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-black/50 backdrop-blur-xs text-amber-300 font-black text-[10px] border border-white/10">
                  {tournament.map || 'Bermuda'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black leading-tight drop-shadow">
                {tournament.name}
              </h2>
              <p className="text-[11px] text-blue-200 font-bold mt-0.5">
                Match #{tournament.id} • {bstTime.formattedDateUpper} ({bstTime.year}) at {bstTime.formattedTime12} (BST)
              </p>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
            
            {/* Quick Metrics 3-Col */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-2xl bg-blue-50/70 dark:bg-slate-800/60 text-center border border-blue-100 dark:border-slate-700">
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block">
                  {t.entryFee}
                </span>
                <span className="text-lg font-black text-[#176BFF] dark:text-blue-400 font-mono">
                  ৳{tournament.entryFee}
                </span>
              </div>
              <div 
                onClick={() => setPrizeModalOpen(true)}
                className="p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 text-center border border-amber-200 dark:border-amber-900/60 cursor-pointer hover:bg-amber-100/60 transition-colors"
              >
                <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 flex items-center justify-center gap-0.5">
                  <span>{t.prizePool}</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                  ৳{tournament.prizePool}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 text-center border border-rose-200 dark:border-rose-900/60">
                <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 block">
                  {t.perKill}
                </span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
                  ৳{tournament.perKill || 0}
                </span>
              </div>
            </div>

            {/* Countdown & Slot Fill Box */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 font-bold block flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#176BFF]" /> STARTS IN
                </span>
                <span className="font-black text-[#176BFF] dark:text-blue-400 mt-0.5 block font-mono text-sm">
                  {countdown.formatted}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#176BFF]" /> SLOTS FILLED
                </span>
                <span className="font-black text-slate-800 dark:text-white mt-0.5 block font-mono text-sm">
                  {tournament.joinedCount || tournament.participants.length} / {tournament.totalSlots} Players
                </span>
              </div>
            </div>

            {/* Room Credentials Section (For Joined Players / Admin) */}
            {(isJoined || isAdmin) && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-850 border border-blue-200 dark:border-blue-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-[#176BFF]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#176BFF] dark:text-blue-400">
                      {t.roomDetails}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    Release: {tournament.roomReleaseMinutes || 2}m before match
                  </span>
                </div>

                {roomData?.isReleased || isAdmin ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Room ID */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{t.roomId}</span>
                        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono tracking-tight">
                          {roomData?.roomId || tournament.roomId || 'Pending'}
                        </span>
                      </div>
                      {(roomData?.roomId || tournament.roomId) && (
                        <button
                          onClick={() => handleCopy(roomData?.roomId || tournament.roomId || '', 'roomId')}
                          className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-slate-700 text-xs font-black flex items-center gap-1 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                        >
                          {copiedField === 'roomId' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'roomId' ? t.copied : t.copy}</span>
                        </button>
                      )}
                    </div>

                    {/* Room Pass */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">{t.roomPassword}</span>
                        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono tracking-tight">
                          {roomData?.roomPassword || tournament.roomPassword || 'Pending'}
                        </span>
                      </div>
                      {(roomData?.roomPassword || tournament.roomPassword) && (
                        <button
                          onClick={() => handleCopy(roomData?.roomPassword || tournament.roomPassword || '', 'roomPass')}
                          className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-slate-700 text-xs font-black flex items-center gap-1 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                        >
                          {copiedField === 'roomPass' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'roomPass' ? t.copied : t.copy}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-blue-900 dark:text-blue-300 font-medium py-1">
                    {t.roomAvailableSoon}
                  </div>
                )}
              </div>
            )}

            {/* Quick Modals Triggers: Prize Breakdown & Rules */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrizeModalOpen(true)}
                className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between text-left hover:bg-amber-100/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="text-xs font-black text-amber-900 dark:text-amber-300 block">Prize Pool</span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400">View rank distribution</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-500" />
              </button>

              <button
                type="button"
                onClick={() => setRulesModalOpen(true)}
                className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 flex items-center justify-between text-left hover:bg-blue-100/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#176BFF]" />
                  <div>
                    <span className="text-xs font-black text-blue-900 dark:text-blue-300 block">Match Rules</span>
                    <span className="text-[10px] text-blue-700 dark:text-blue-400">Fair play policy</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#176BFF]" />
              </button>
            </div>

            {/* If NOT Joined & NOT Complete: Show In-Game ID Confirmation Inputs */}
            {!isJoined && tournament.status !== 'COMPLETE' && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                  <Gamepad2 className="w-3.5 h-3.5 text-[#176BFF]" /> Free Fire In-Game Credentials
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      Free Fire UID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={freeFireUid}
                      onChange={(e) => setFreeFireUid(e.target.value)}
                      placeholder="e.g. 192847192"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-white focus:outline-hidden focus:border-[#176BFF]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      In-Game Name (IGN) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={freeFireIgn}
                      onChange={(e) => setFreeFireIgn(e.target.value)}
                      placeholder="e.g. ꧁EGX_SNIPER꧂"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-hidden focus:border-[#176BFF]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Participants List */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#176BFF]" />
                {t.participantsList} ({tournament.participants.length}/{tournament.totalSlots})
              </h4>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 p-1">
                {tournament.participants.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No players registered yet. Be the first to claim a slot!
                  </div>
                ) : (
                  tournament.participants.map((p, idx) => (
                    <div key={`${p.userId || 'p'}-${idx}`} className="p-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-slate-700 text-[#176BFF] text-[10px] font-bold flex items-center justify-center">
                          {p.slotNumber || idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">
                            {p.freeFireIgn || p.username}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            UID: {p.freeFireUid}
                          </span>
                        </div>
                      </div>
                      {p.isResultProcessed && (
                        <div className="text-right">
                          <span className="font-extrabold text-emerald-600 text-xs">
                            +৳{p.totalWinning || 0}
                          </span>
                          <span className="text-[9px] text-slate-400 block">
                            {p.kills || 0} Kills (Rank #{p.rank})
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Feedback alerts */}
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{errorMsg}</span>
                  {errorMsg.includes('balance') && (
                    <button 
                      onClick={() => { onClose(); onNavigateToWallet(); }}
                      className="block font-bold underline mt-1 text-blue-600 dark:text-blue-400 cursor-pointer"
                    >
                      Add Money via bKash / Nagad →
                    </button>
                  )}
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between gap-3">
            <div className="text-xs">
              <span className="text-slate-400 block">{t.currentBalance}</span>
              <span className="text-sm font-black text-[#176BFF] dark:text-blue-400 font-mono">
                ৳{user ? user.balance : 0}
              </span>
            </div>

            <div>
              {isJoined ? (
                <button
                  disabled
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 shadow-md shadow-emerald-600/30 border border-emerald-400/30"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-100 animate-pulse" />
                  <span>SLOT RESERVED</span>
                </button>
              ) : tournament.status === 'COMPLETE' ? (
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-white font-black text-xs sm:text-sm tracking-wider uppercase active:scale-95 transition-all cursor-pointer"
                >
                  Close
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={loading}
                  className="px-7 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-[#176BFF] to-indigo-600 hover:from-blue-500 hover:via-blue-600 hover:to-indigo-500 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-blue-600/35 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 border border-blue-400/20"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Swords className="w-4 h-4 text-amber-300" />
                      <span>{t.joinNow} (৳{tournament.entryFee})</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Embedded Prize Pool and Rules Modals */}
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
    </>
  );
};

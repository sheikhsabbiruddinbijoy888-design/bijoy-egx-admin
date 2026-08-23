import React, { useState, useEffect } from 'react';
import { Tournament } from '../types';
import { useAuth } from '../context/AuthContext';
import { calculateCountdown, getBangladeshDateTime } from '../lib/timeUtils';
import { 
  Users, 
  Clock, 
  Flame, 
  ShieldCheck, 
  CheckCircle, 
  Trophy, 
  Crosshair, 
  Calendar, 
  Swords, 
  ChevronRight,
  Eye
} from 'lucide-react';
import { PrizePoolModal } from './PrizePoolModal';
import { RulesModal } from './RulesModal';

interface TournamentCardProps {
  tournament: Tournament;
  onSelect: (tournament: Tournament) => void;
  onJoinDirect?: (tournament: Tournament) => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({ 
  tournament, 
  onSelect, 
  onJoinDirect 
}) => {
  const { user, t } = useAuth();
  const [countdown, setCountdown] = useState(() => calculateCountdown(tournament.matchTimestamp || tournament.tournamentStartAt));
  const [prizeModalOpen, setPrizeModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);

  const isJoined = tournament.participants?.some(p => p.userId === user?.id) ?? false;
  const isFull = (tournament.joinedCount || tournament.participants.length) >= tournament.totalSlots;

  // Server-synchronized live countdown timer
  useEffect(() => {
    const update = () => {
      setCountdown(calculateCountdown(tournament.matchTimestamp || tournament.tournamentStartAt));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [tournament.matchTimestamp, tournament.tournamentStartAt]);

  const bstTime = getBangladeshDateTime(tournament.matchTimestamp || tournament.tournamentStartAt || Date.now());

  const getStatusBadge = () => {
    switch (tournament.status) {
      case 'LIVE MATCH':
        return (
          <span className="px-3 py-1 rounded-full bg-red-600 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-red-600/30">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            LIVE MATCH
          </span>
        );
      case 'COMPLETE':
        return (
          <span className="px-3 py-1 rounded-full bg-slate-700 text-white font-black text-[11px] uppercase tracking-wider shadow-md">
            COMPLETED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-black text-[11px] uppercase tracking-wider shadow-md">
            CANCELLED
          </span>
        );
      case 'WAITING':
        return (
          <span className="px-3 py-1 rounded-full bg-indigo-600 text-white font-black text-[11px] uppercase tracking-wider shadow-md shadow-indigo-600/30">
            WAITING ROOM
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-[11px] uppercase tracking-wider shadow-md shadow-emerald-600/30">
            UPCOMING
          </span>
        );
    }
  };

  const progressPercent = Math.min(
    100, 
    Math.round(((tournament.joinedCount || tournament.participants.length) / tournament.totalSlots) * 100)
  );

  return (
    <>
      <div className="relative w-full rounded-3xl p-[2px] overflow-hidden transition-all duration-300 group dark:shadow-[0_0_25px_rgba(0,240,255,0.38)]">
        {/* Traveling Electric Neon Blue Border Glow (Dark Mode Only) */}
        <div 
          aria-hidden="true"
          className="hidden dark:block absolute -inset-[150%] bg-[conic-gradient(from_0deg,transparent_0_70%,rgba(0,240,255,0.25)_80%,#00F0FF_94%,#FFFFFF_98%,#00F0FF_100%)] animate-neon-border pointer-events-none z-0 will-change-transform" 
        />

        {/* Card Content Inner */}
        <div className="relative z-10 w-full h-full rounded-[calc(1.5rem-2px)] overflow-hidden bg-white dark:bg-[#111827] border border-blue-100/90 dark:border-transparent shadow-sm hover:shadow-xl transition-all duration-300">
          {/* Cover Image & Top Information */}
          <div 
            onClick={() => onSelect(tournament)}
            className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-950 cursor-pointer"
          >
          <img
            src={tournament.coverImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'}
            alt={tournament.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-black/40 to-transparent" />

          {/* Top Status & Category Tags */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <div>{getStatusBadge()}</div>
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-xl bg-[#176BFF] text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                {tournament.category}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                {tournament.map || 'Bermuda'}
              </span>
            </div>
          </div>

          {/* Prominent Bangladesh Date & Time Overlay Bar on Banner */}
          <div className="absolute bottom-3 left-3 right-3 z-10 text-white flex items-end justify-between">
            <div className="space-y-0.5 max-w-[70%]">
              <h3 className="text-base sm:text-lg font-black tracking-tight drop-shadow line-clamp-1">
                {tournament.name}
              </h3>
              <p className="text-[11px] text-blue-200 dark:text-cyan-200 font-bold flex items-center gap-1.5">
                <span>#{tournament.id}</span>
                <span>•</span>
                <span className="text-amber-300 font-black">{bstTime.formattedDateUpper} ({bstTime.year})</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-black text-slate-300 uppercase block tracking-wider">
                Start Time (BST)
              </span>
              <span className="text-xs sm:text-sm font-black text-white bg-black/50 px-2 py-0.5 rounded-lg backdrop-blur-xs border border-white/10 font-mono">
                {bstTime.formattedTime12}
              </span>
            </div>
          </div>
        </div>

        {/* Main Info Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* 3 Prominent Stat Boxes */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-blue-50/70 dark:bg-[#1E293B]/70 rounded-2xl p-2.5 text-center border border-blue-100/80 dark:border-slate-700/60">
              <span className="block text-lg sm:text-xl font-black text-[#176BFF] dark:text-[#00F0FF] leading-tight font-mono">
                ৳{tournament.entryFee}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t.entryFee}
              </span>
            </div>

            <div 
              onClick={() => setPrizeModalOpen(true)}
              className="bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl p-2.5 text-center border border-amber-200/80 dark:border-amber-900/60 hover:bg-amber-100/60 dark:hover:bg-amber-900/50 transition-all cursor-pointer"
              title="Click to view Prize Pool Breakdown"
            >
              <span className="block text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 leading-tight font-mono">
                ৳{tournament.prizePool}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center justify-center gap-0.5">
                <span>{t.prizePool}</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>

            <div className="bg-rose-50/70 dark:bg-rose-950/40 rounded-2xl p-2.5 text-center border border-rose-200/80 dark:border-rose-900/60">
              <span className="block text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 leading-tight font-mono">
                ৳{tournament.perKill || 0}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                {t.perKill}
              </span>
            </div>
          </div>

          {/* Players & Live Bangladesh Countdown Boxes */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Players Slot Progress */}
            <div className="bg-slate-50 dark:bg-[#1E293B]/50 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#176BFF] dark:text-[#00F0FF]" />
                  <span>SLOTS</span>
                </span>
                <span className="text-[10px] font-mono font-black text-slate-600 dark:text-slate-300">
                  {progressPercent}%
                </span>
              </div>
              <div className="mt-1">
                <span className="text-base sm:text-lg font-black text-[#10213A] dark:text-white font-mono">
                  {tournament.joinedCount || tournament.participants.length} / {tournament.totalSlots}
                </span>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#176BFF] to-emerald-500 dark:from-[#00F0FF] dark:to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Starts In Server-Authoritative Countdown */}
            <div className="bg-slate-50 dark:bg-[#1E293B]/50 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-[#176BFF] dark:text-[#00F0FF]" />
                <span>STARTS IN</span>
              </div>
              <div className="mt-1">
                <span className="text-base sm:text-lg font-black text-[#176BFF] dark:text-[#00F0FF] tracking-tight font-mono">
                  {countdown.formatted}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {bstTime.formattedTime12} (BST)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Auxiliary Actions: Prize Pool Breakdown & Rules */}
          <div className="flex items-center justify-between pt-0.5">
            <button
              type="button"
              onClick={() => setPrizeModalOpen(true)}
              className="text-xs font-black text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Prize Distribution</span>
            </button>

            <button
              type="button"
              onClick={() => setRulesModalOpen(true)}
              className="text-xs font-black text-[#176BFF] hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#176BFF]" />
              <span>Match Rules</span>
            </button>
          </div>

          {/* Action Button */}
          <div>
            {isJoined ? (
              <button
                onClick={() => onSelect(tournament)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
              >
                <CheckCircle className="w-4 h-4 text-emerald-100 animate-pulse" />
                <span>ALREADY JOINED · ROOM DETAILS</span>
              </button>
            ) : tournament.status === 'COMPLETE' ? (
              <button
                onClick={() => onSelect(tournament)}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs sm:text-sm uppercase tracking-wider border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
              >
                VIEW MATCH RESULTS
              </button>
            ) : isFull ? (
              <button
                disabled
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 font-black text-xs sm:text-sm uppercase tracking-wider cursor-not-allowed border border-slate-200 dark:border-slate-800"
              >
                ALL SLOTS FULL
              </button>
            ) : (
              <button
                onClick={() => (onJoinDirect ? onJoinDirect(tournament) : onSelect(tournament))}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-[#176BFF] to-indigo-600 hover:from-blue-500 hover:via-blue-600 hover:to-indigo-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-400/20"
              >
                <Swords className="w-4 h-4 text-amber-300" />
                <span>JOIN TOURNAMENT (৳{tournament.entryFee})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Embedded Modals */}
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

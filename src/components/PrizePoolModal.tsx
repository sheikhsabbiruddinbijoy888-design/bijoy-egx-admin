import React from 'react';
import { Tournament } from '../types';
import { Trophy, Crown, Medal, Award, Crosshair, X, Sparkles, ShieldCheck } from 'lucide-react';

interface PrizePoolModalProps {
  tournament: Tournament;
  isOpen: boolean;
  onClose: () => void;
}

export const PrizePoolModal: React.FC<PrizePoolModalProps> = ({
  tournament,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const prizePool = Number(tournament.prizePool) || 0;
  const perKill = Number(tournament.perKill) || 0;
  const winnerPrize = tournament.winnerPrize !== undefined ? Number(tournament.winnerPrize) : Math.round(prizePool * 0.5);
  const secondPrize = tournament.secondPrize !== undefined ? Number(tournament.secondPrize) : Math.round(prizePool * 0.25);
  const thirdPrize = tournament.thirdPrize !== undefined ? Number(tournament.thirdPrize) : Math.round(prizePool * 0.15);
  const fourthPrize = tournament.fourthPrize !== undefined ? Number(tournament.fourthPrize) : 0;
  const fifthPrize = tournament.fifthPrize !== undefined ? Number(tournament.fifthPrize) : 0;

  const prizeTiers = [
    {
      title: 'Winner (1st Position)',
      amount: winnerPrize,
      icon: Crown,
      badge: '1ST PLACE',
      bgClass: 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-400/40 dark:border-amber-500/30',
      iconColor: 'text-amber-500 bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700',
      textColor: 'text-amber-600 dark:text-amber-400',
      show: true
    },
    {
      title: '2nd Position',
      amount: secondPrize,
      icon: Medal,
      badge: 'RUNNER UP',
      bgClass: 'bg-gradient-to-r from-slate-400/10 via-slate-400/5 to-transparent border-slate-300 dark:border-slate-700',
      iconColor: 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600',
      textColor: 'text-slate-700 dark:text-slate-300',
      show: secondPrize > 0
    },
    {
      title: '3rd Position',
      amount: thirdPrize,
      icon: Award,
      badge: '3RD PLACE',
      bgClass: 'bg-gradient-to-r from-amber-700/10 via-amber-700/5 to-transparent border-amber-700/30 dark:border-amber-700/40',
      iconColor: 'text-amber-700 bg-amber-100 dark:bg-amber-950/60 border-amber-600 dark:border-amber-800',
      textColor: 'text-amber-800 dark:text-amber-300',
      show: thirdPrize > 0
    },
    {
      title: '4th Position',
      amount: fourthPrize,
      icon: Trophy,
      badge: '4TH PLACE',
      bgClass: 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800',
      iconColor: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
      textColor: 'text-slate-700 dark:text-slate-300',
      show: fourthPrize > 0
    },
    {
      title: '5th Position',
      amount: fifthPrize,
      icon: Trophy,
      badge: '5TH PLACE',
      bgClass: 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800',
      iconColor: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800',
      textColor: 'text-slate-700 dark:text-slate-300',
      show: fifthPrize > 0
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#0B132B] rounded-3xl border border-blue-200/80 dark:border-blue-900/50 max-w-md w-full overflow-hidden shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative p-5 bg-gradient-to-b from-blue-50 via-white to-white dark:from-blue-950/40 dark:via-[#0B132B] dark:to-[#0B132B] border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 flex items-center justify-center border border-amber-500/30 shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#10213A] dark:text-white tracking-tight flex items-center gap-1.5">
                Prize Distribution
              </h3>
              <p className="text-[11px] font-bold text-[#176BFF] dark:text-blue-400">
                {tournament.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Total Prize Pool Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-[#176BFF] to-indigo-600 text-white shadow-lg shadow-blue-500/25 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-100 block">
                Total Guaranteed Prize Pool
              </span>
              <div className="text-2xl font-black tracking-tight flex items-baseline gap-1">
                <span>৳{prizePool.toLocaleString()}</span>
                <span className="text-xs font-bold text-blue-200">BDT</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
          </div>

          {/* Per Kill Highlight Card */}
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                <Crosshair className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-rose-950 dark:text-rose-200 block">
                  Per Kill Reward
                </span>
                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                  Earn for every confirmed elimination
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-rose-600 dark:text-rose-400 font-mono">
                ৳{perKill}
              </span>
              <span className="text-[10px] font-bold text-slate-400 block">/ Kill</span>
            </div>
          </div>

          {/* Position Ranks Breakdown */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block px-1">
              Position Breakdown
            </span>

            {prizeTiers.filter(t => t.show).map((tier, idx) => {
              const Icon = tier.icon;
              return (
                <div
                  key={`${tier.title}-${idx}`}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${tier.bgClass}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${tier.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-white block">
                        {tier.title}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {tier.badge}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-black font-mono ${tier.textColor}`}>
                      ৳{tier.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Winnings are credited instantly to your wallet upon result verification by match referees.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#176BFF] hover:bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

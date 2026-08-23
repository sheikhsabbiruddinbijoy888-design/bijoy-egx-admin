import React from 'react';
import { Tournament } from '../types';
import { Shield, AlertTriangle, CheckCircle, X, HelpCircle, Swords, PhoneCall } from 'lucide-react';

interface RulesModalProps {
  tournament: Tournament;
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  tournament,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const defaultRules = [
    '1. Emulator strictly prohibited (Mobile devices only).',
    '2. Any third-party configs, scripts, headshot hacks, or file tampering will result in an immediate permanent ban without refund.',
    '3. Players must join with their registered Free Fire UID and IGN.',
    '4. Teaming up with opponents is strictly forbidden and punishable by disqualification.',
    '5. Room ID & Password will be provided inside match details before the match starts.',
    '6. Please take a final scoreboard screenshot at match completion for dispute verification.'
  ];

  const parsedRules = tournament.rules && tournament.rules.trim()
    ? tournament.rules.split('\n').filter(r => r.trim().length > 0)
    : defaultRules;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#0B132B] rounded-3xl border border-blue-200/80 dark:border-blue-900/50 max-w-md w-full overflow-hidden shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative p-5 bg-gradient-to-b from-blue-50 via-white to-white dark:from-blue-950/40 dark:via-[#0B132B] dark:to-[#0B132B] border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-[#176BFF] dark:bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#10213A] dark:text-white tracking-tight">
                Tournament Rules
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
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Tournament Quick Specs */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block">Category</span>
              <span className="text-xs font-black text-[#10213A] dark:text-white">{tournament.category}</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block">Map</span>
              <span className="text-xs font-black text-[#10213A] dark:text-white">{tournament.map || 'Bermuda'}</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block">Game</span>
              <span className="text-xs font-black text-[#10213A] dark:text-white">{tournament.game || 'Free Fire'}</span>
            </div>
          </div>

          {/* Rules List */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block px-1">
              Official Regulations & Code of Conduct
            </span>

            <div className="space-y-2">
              {parsedRules.map((rule, idx) => (
                <div
                  key={`rule-${idx}`}
                  className="p-3 rounded-2xl bg-blue-50/40 dark:bg-slate-800/50 border border-blue-100/80 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#176BFF] dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black font-mono">
                    {idx + 1}
                  </div>
                  <span className="flex-1 leading-relaxed font-medium">
                    {rule.replace(/^\d+[\.\)]\s*/, '')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fair Play Warning */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold block">Zero Tolerance Fair Play Policy</span>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                Admin decisions and referee match logs are final. Teaming, emulator bypass, or unfair conduct results in account termination.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#176BFF] hover:bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Tournament, TournamentCategory } from '../types';
import { TournamentCard } from './TournamentCard';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Users, 
  Flame, 
  Shield, 
  Trophy, 
  ChevronRight, 
  Sparkles,
  ArrowRight,
  Gamepad2
} from 'lucide-react';
import { getCategorySlug } from '../lib/categoryUtils';
import { safeFetchJson } from '../lib/api';

interface FilterItem {
  id: 'SOLO' | 'DUO' | 'BR' | 'SQUAD';
  label: string;
  categoryName: TournamentCategory;
  slug: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FILTER_ITEMS: FilterItem[] = [
  { id: 'SOLO', label: 'SOLO', categoryName: 'Solo', slug: 'SOLO', icon: User },
  { id: 'DUO', label: 'DUO', categoryName: 'Duo', slug: 'DUO', icon: Users },
  { id: 'BR', label: 'BR', categoryName: 'BR Match', slug: 'BR_MATCH', icon: Flame },
  { id: 'SQUAD', label: 'SQUAD', categoryName: 'Classic Squad', slug: 'CLASSIC_SQUAD', icon: Shield }
];

interface HomepageTournamentFilterProps {
  onSelectTournament: (tournament: Tournament) => void;
  onNavigateToCategory: (category: TournamentCategory) => void;
  onNavigateToAllTournaments: () => void;
}

export const HomepageTournamentFilter: React.FC<HomepageTournamentFilterProps> = ({
  onSelectTournament,
  onNavigateToCategory,
  onNavigateToAllTournaments
}) => {
  const { bootstrap, t, language } = useAuth();
  
  // DEFAULT HOMEPAGE STATE: No category is selected (null). Zero tournament cards shown by default.
  const [selectedCategoryId, setSelectedCategoryId] = useState<'SOLO' | 'DUO' | 'BR' | 'SQUAD' | null>(null);
  const [matchedTournament, setMatchedTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false);

  // When selectedCategoryId changes, fetch or compute the single tournament card
  useEffect(() => {
    if (!selectedCategoryId) {
      setMatchedTournament(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    // Call server-side filtered endpoint
    safeFetchJson<{ tournament: Tournament | null; category: string }>(
      `/api/tournaments/homepage?category=${selectedCategoryId}`
    ).then((res) => {
      if (!isMounted) return;
      if (res.ok && res.data) {
        setMatchedTournament(res.data.tournament);
      } else {
        // Fallback to local bootstrap filtering
        const allTournaments = bootstrap?.tournaments || [];
        const invalidStatuses = ['COMPLETE', 'CANCELLED', 'CLOSED', 'DELETED', 'REJECTED'];
        
        const filterItem = FILTER_ITEMS.find(f => f.id === selectedCategoryId);
        const targetCategory = filterItem?.categoryName;

        const candidates = allTournaments.filter(t => {
          if (!t.showOnHomepage) return false;
          if (invalidStatuses.includes(t.status)) return false;
          if (targetCategory && t.category === targetCategory) return true;
          if (selectedCategoryId === 'BR' && (t.category.includes('BR') || t.category === 'BR Match')) return true;
          if (selectedCategoryId === 'SQUAD' && (t.category.includes('Squad') || t.category === 'Classic Squad')) return true;
          return false;
        });

        candidates.sort((a, b) => {
          const pA = a.displayPriority !== undefined ? Number(a.displayPriority) : 999;
          const pB = b.displayPriority !== undefined ? Number(b.displayPriority) : 999;
          if (pA !== pB) return pA - pB;
          const tA = a.matchTimestamp || a.tournamentStartAt || 0;
          const tB = b.matchTimestamp || b.tournamentStartAt || 0;
          return tA - tB;
        });

        // Limit 1
        setMatchedTournament(candidates.length > 0 ? candidates[0] : null);
      }
      setLoading(false);
    }).catch(() => {
      if (isMounted) {
        setMatchedTournament(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCategoryId, bootstrap?.tournaments]);

  const activeFilterItem = FILTER_ITEMS.find(f => f.id === selectedCategoryId);

  return (
    <section className="space-y-3.5" aria-label="Tournament Filter Section">
      {/* Header with Title & Direct "View All" link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 text-[#176BFF]">
            <Trophy className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-[#10213A] dark:text-white tracking-tight">
            {t.tournamentMatches || 'Tournament Matches'}
          </h2>
        </div>

        <button
          type="button"
          onClick={onNavigateToAllTournaments}
          className="text-xs font-bold text-[#176BFF] hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-1 transition-colors group cursor-pointer"
        >
          <span>{t.viewAll || 'VIEW ALL'}</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Horizontal Tournament Filter Bar */}
      <div className="relative">
        <div 
          className="grid grid-cols-4 gap-2 sm:gap-3 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800"
          role="tablist"
          aria-label="Tournament Category Filters"
        >
          {FILTER_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isActive = selectedCategoryId === item.id;

            return (
              <button
                key={`${item.id}-${idx}`}
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategoryId(item.id)}
                className={`flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 cursor-pointer min-h-[44px] ${
                  isActive
                    ? 'bg-[#176BFF] text-white shadow-md shadow-blue-500/30 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#176BFF] dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tournament Display Area (Strictly Limit 1 card or clean empty/default state) */}
      <div className="transition-all duration-300 ease-out">
        {loading ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-[#176BFF] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400">Loading match...</p>
          </div>
        ) : selectedCategoryId === null ? (
          /* Default state: No category selected yet -> Friendly helper card */
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-900 dark:to-slate-900/40 border border-slate-200/70 dark:border-slate-800/80 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-[#176BFF] flex items-center justify-center mx-auto">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black text-[#10213A] dark:text-white">
                {language === 'bn' ? 'ক্যাটাগরি সিলেক্ট করুন' : 'Select a Category'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {t.selectCategoryPrompt || 'Tap SOLO, DUO, BR, or SQUAD above to view active tournaments.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToAllTournaments}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-[#176BFF] dark:text-blue-400 text-xs font-black uppercase tracking-wider border border-blue-100 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
            >
              <span>{t.viewAllTournaments || 'View All Tournaments'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : matchedTournament ? (
          /* When category is clicked & 1 tournament is available: Exactly 1 Card + View All CTA */
          <div className="space-y-3">
            <TournamentCard 
              tournament={matchedTournament} 
              onSelect={onSelectTournament} 
            />

            {/* Bottom View All Link for this category */}
            <div className="flex items-center justify-between pt-1 px-1">
              <span className="text-[11px] font-bold text-slate-400">
                Showing top active {activeFilterItem?.label} tournament
              </span>
              <button
                type="button"
                onClick={() => {
                  if (activeFilterItem) {
                    onNavigateToCategory(activeFilterItem.categoryName);
                  } else {
                    onNavigateToAllTournaments();
                  }
                }}
                className="text-xs font-black text-[#176BFF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{language === 'bn' ? `সবগুলো ${activeFilterItem?.label} টুর্নামেন্ট দেখুন` : `View All ${activeFilterItem?.label} Tournaments`}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Empty State when no tournament is available for the selected category */
          <div className="p-6 sm:p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black text-[#10213A] dark:text-white">
                {language === 'bn' 
                  ? `কোনো ${activeFilterItem?.label || ''} টুর্নামেন্ট বর্তমানে উপলব্ধ নেই` 
                  : `No ${activeFilterItem?.label || ''} tournament available right now.`
                }
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {language === 'bn'
                  ? 'নতুন টুর্নামেন্ট খুব শীঘ্রই যুক্ত করা হবে। অন্যান্য ক্যাটাগরি দেখতে পারেন।'
                  : 'New tournaments will be added shortly. You can explore all scheduled matches.'
                }
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onNavigateToAllTournaments}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#176BFF] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-500/25 transition-all cursor-pointer"
              >
                <span>{t.viewAllTournaments || 'VIEW ALL TOURNAMENTS'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

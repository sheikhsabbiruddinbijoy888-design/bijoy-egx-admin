import React, { useState, useEffect, useMemo } from 'react';
import { Tournament, TournamentCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { TournamentCard } from '../components/TournamentCard';
import { Search, Trophy, X, Sparkles } from 'lucide-react';
import { 
  normalizeCategory, 
  getCategorySlug, 
  CATEGORY_ALL_LIST, 
  matchesCategorySearch 
} from '../lib/categoryUtils';

interface TournamentsViewProps {
  initialCategory?: TournamentCategory | 'All';
  onSelectTournament: (tournament: Tournament) => void;
}

type StatusFilter = 'ALL' | 'COMING SOON' | 'LIVE' | 'COMPLETE';

export const TournamentsView: React.FC<TournamentsViewProps> = ({
  initialCategory = 'All',
  onSelectTournament
}) => {
  const { bootstrap, t } = useAuth();

  // Helper to read category from URL search params or fallback to initialCategory
  const getUrlCategory = (): TournamentCategory | 'All' => {
    try {
      const search = window.location.search || (window.location.hash.includes('?') ? '?' + window.location.hash.split('?')[1] : '');
      const searchParams = new URLSearchParams(search);
      const catParam = searchParams.get('category');
      if (catParam) {
        return normalizeCategory(catParam);
      }
    } catch {
      // ignore
    }
    return normalizeCategory(initialCategory) || 'All';
  };

  const [selectedCategory, setSelectedCategory] = useState<TournamentCategory | 'All'>(getUrlCategory);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize when initialCategory prop changes
  useEffect(() => {
    if (initialCategory) {
      const norm = normalizeCategory(initialCategory);
      setSelectedCategory(norm);
    }
  }, [initialCategory]);

  // Synchronize with browser Back/Forward navigation or manual URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      const currentUrlCat = getUrlCategory();
      setSelectedCategory(currentUrlCat);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleSelectCategory = (cat: TournamentCategory | 'All') => {
    setSelectedCategory(cat);
    const slug = getCategorySlug(cat);
    if (cat === 'All' || !slug) {
      window.history.pushState({}, '', '/tournaments');
    } else {
      window.history.pushState({}, '', `/tournaments?category=${slug}`);
    }
  };

  const rawTournaments = bootstrap?.tournaments || [];

  // Filter tournaments by Category, Status, and Search Query
  const filteredTournaments = useMemo(() => {
    const list = Array.isArray(rawTournaments) ? rawTournaments : [];

    return list.filter((tour) => {
      // 1. Category Filter (Exact Category match unless 'All')
      if (selectedCategory !== 'All') {
        const normTourCat = normalizeCategory(tour.category);
        if (normTourCat !== selectedCategory && tour.category !== selectedCategory) {
          return false;
        }
      }

      // 2. Status Filter
      if (selectedStatus === 'COMING SOON') {
        if (tour.status !== 'COMING SOON' && tour.status !== 'WAITING') {
          return false;
        }
      } else if (selectedStatus === 'LIVE') {
        if (tour.status !== 'LIVE MATCH' && tour.status !== 'LIVE') {
          return false;
        }
      } else if (selectedStatus === 'COMPLETE') {
        if (tour.status !== 'COMPLETE') {
          return false;
        }
      }

      // 3. Accurate Search Filter in Real-Time
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();

        const matchesName = tour.name.toLowerCase().includes(q);
        const matchesId = tour.id.toLowerCase().includes(q);
        const matchesMap = Boolean(tour.map && tour.map.toLowerCase().includes(q));
        const matchesGame = Boolean(tour.game && tour.game.toLowerCase().includes(q));
        const matchesCat = matchesCategorySearch(tour.category, q);

        if (!matchesName && !matchesId && !matchesMap && !matchesGame && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [rawTournaments, selectedCategory, selectedStatus, searchQuery]);

  // Counts for status tabs under the currently selected category
  const statusCounts = useMemo(() => {
    const list = (Array.isArray(rawTournaments) ? rawTournaments : []).filter((tour) => {
      if (selectedCategory === 'All') return true;
      const normTourCat = normalizeCategory(tour.category);
      return normTourCat === selectedCategory || tour.category === selectedCategory;
    });

    const allCount = list.length;
    const upcomingCount = list.filter((t) => t.status === 'COMING SOON' || t.status === 'WAITING').length;
    const liveCount = list.filter((t) => t.status === 'LIVE MATCH' || t.status === 'LIVE').length;
    const completeCount = list.filter((t) => t.status === 'COMPLETE').length;

    return {
      ALL: allCount,
      'COMING SOON': upcomingCount,
      LIVE: liveCount,
      COMPLETE: completeCount,
    };
  }, [rawTournaments, selectedCategory]);

  return (
    <div className="w-full max-w-lg sm:max-w-2xl md:max-w-4xl mx-auto px-4 py-4 space-y-4 pb-24">
      {/* Header with Title and Current Category Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#10213A] dark:text-white tracking-tight flex items-center gap-2">
            <span>{t.tournaments}</span>
            {selectedCategory !== 'All' && (
              <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#176BFF] dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                {selectedCategory}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {filteredTournaments.length} match{filteredTournaments.length === 1 ? '' : 'es'} available
          </p>
        </div>

        {selectedCategory !== 'All' && (
          <button
            id="view-all-categories-btn"
            onClick={() => handleSelectCategory('All')}
            className="text-xs font-black text-[#176BFF] hover:underline cursor-pointer uppercase tracking-wider"
          >
            Show All
          </button>
        )}
      </div>

      {/* Category Pills Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
          <span>Categories</span>
          <span className="text-slate-400">{selectedCategory}</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORY_ALL_LIST.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                id={`cat-pill-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleSelectCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all border cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-[#176BFF] text-white border-[#176BFF] shadow-md shadow-blue-500/25 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 hover:bg-blue-50/50 dark:hover:bg-slate-800'
                }`}
              >
                {cat === 'All' ? t.all : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar with Clear Button */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          id="tournaments-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search match by SOLO, DUO, Squad, map, ID, or title..."
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#176BFF] focus:ring-2 focus:ring-[#176BFF]/20 shadow-xs transition-all"
        />
        {searchQuery.trim().length > 0 && (
          <button
            id="clear-search-btn"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="grid grid-cols-4 gap-1.5 bg-[#EAF4FF] dark:bg-slate-900/80 p-1.5 rounded-2xl border border-[#DCE8F7] dark:border-slate-800">
        {(
          [
            { id: 'ALL', label: t.all, count: statusCounts.ALL },
            { id: 'COMING SOON', label: t.comingSoon, count: statusCounts['COMING SOON'] },
            { id: 'LIVE', label: t.live, count: statusCounts.LIVE },
            { id: 'COMPLETE', label: t.complete, count: statusCounts.COMPLETE },
          ] as const
        ).map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              id={`status-tab-${tab.id.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedStatus(tab.id)}
              className={`py-2 px-1 rounded-xl font-black text-[11px] tracking-wider uppercase transition-all flex flex-col items-center justify-center cursor-pointer ${
                isActive
                  ? tab.id === 'LIVE'
                    ? 'bg-white dark:bg-slate-800 text-red-600 shadow-sm border border-red-200 dark:border-red-900/40'
                    : 'bg-white dark:bg-slate-800 text-[#176BFF] dark:text-blue-400 shadow-sm border border-blue-100 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                ({tab.count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Tournament Cards List */}
      <div className="space-y-4 pt-1">
        {filteredTournaments.length === 0 ? (
          <div className="p-10 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-500 dark:text-blue-400 flex items-center justify-center mx-auto">
              <Trophy className="w-7 h-7" />
            </div>
            <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-white">
              No tournaments found
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
              {searchQuery
                ? `No matches found matching "${searchQuery}" in ${selectedCategory === 'All' ? 'any category' : selectedCategory}.`
                : `There are currently no ${selectedStatus !== 'ALL' ? selectedStatus.toLowerCase() : ''} matches in the ${selectedCategory} category.`}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Clear Search
                </button>
              )}
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => handleSelectCategory('All')}
                  className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#176BFF] dark:text-blue-400 text-xs font-black uppercase border border-blue-200 dark:border-blue-900 hover:bg-blue-100 cursor-pointer"
                >
                  View All Categories
                </button>
              )}
              {selectedStatus !== 'ALL' && (
                <button
                  onClick={() => setSelectedStatus('ALL')}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase hover:bg-slate-200 cursor-pointer"
                >
                  Show All Statuses
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredTournaments.map((tour, idx) => (
            <TournamentCard
              key={`${tour.id}-${idx}`}
              tournament={tour}
              onSelect={onSelectTournament}
            />
          ))
        )}
      </div>
    </div>
  );
};

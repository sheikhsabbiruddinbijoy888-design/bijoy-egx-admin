import React, { useState, useRef } from 'react';
import { Tournament, TournamentCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { HeroBanner } from '../components/HeroBanner';
import { DarkModeMusicBox } from '../components/DarkModeMusicBox';
import { AnnouncementTicker } from '../components/AnnouncementTicker';
import { CategoryGrid } from '../components/CategoryGrid';
import { HomepageTournamentFilter } from '../components/HomepageTournamentFilter';
import { SupportSection } from '../components/SupportSection';
import { RotateCw } from 'lucide-react';

interface HomeViewProps {
  onSelectTournament: (tournament: Tournament) => void;
  onNavigateToCategory: (category: TournamentCategory) => void;
  onNavigate: (view: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectTournament,
  onNavigateToCategory,
  onNavigate
}) => {
  const { bootstrap, t, refreshBootstrap } = useAuth();

  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef(0);

  const banners = bootstrap?.banners || [];
  const announcements = bootstrap?.announcements || [];
  const categories = bootstrap?.categories || [];

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && touchStartY.current > 0) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY.current;
      if (diff > 0) {
        setPulling(true);
        setPullY(Math.min(diff * 0.4, 70));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullY > 45 && !refreshing) {
      setRefreshing(true);
      setPullY(45);
      try {
        await refreshBootstrap();
      } finally {
        setTimeout(() => {
          setRefreshing(false);
          setPulling(false);
          setPullY(0);
        }, 500);
      }
    } else {
      setPulling(false);
      setPullY(0);
    }
    touchStartY.current = 0;
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full max-w-lg sm:max-w-2xl md:max-w-4xl mx-auto px-4 py-4 space-y-6 pb-24 relative"
    >
      {/* Pull to refresh indicator */}
      {(pulling || refreshing) && (
        <div 
          className="flex items-center justify-center transition-all duration-200"
          style={{ height: `${pullY}px`, opacity: pullY / 45 }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 shadow-md border border-blue-100 dark:border-slate-700 text-blue-600 text-xs font-black uppercase tracking-wider">
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Pull to refresh'}</span>
          </div>
        </div>
      )}

      {/* Hero Banner Slideshow */}
      <HeroBanner 
        banners={banners} 
        onActionClick={(link) => {
          if (link.includes('category=')) {
            try {
              const queryPart = link.includes('?') ? link.split('?')[1] : link;
              const searchParams = new URLSearchParams(queryPart);
              const cat = searchParams.get('category');
              if (cat) {
                onNavigateToCategory(cat as any);
                return;
              }
            } catch {
              // fallback
            }
          }
          if (link.includes('tournaments') || link.includes('Tournaments')) {
            onNavigate('tournaments');
          } else if (link.includes('wallet') || link.includes('Wallet')) {
            onNavigate('wallet');
          } else if (link.includes('my-matches')) {
            onNavigate('my-matches');
          } else if (link.includes('profile')) {
            onNavigate('profile');
          } else {
            onNavigate('tournaments');
          }
        }} 
      />

      {/* Dark Mode Equalizer & Music Player (Visible ONLY in Dark Mode) */}
      <DarkModeMusicBox />

      {/* Announcement Pill Ticker */}
      <AnnouncementTicker announcements={announcements} />

      {/* Tournament Categories (5 Exact Categories) */}
      <CategoryGrid 
        categories={categories} 
        onSelectCategory={onNavigateToCategory} 
      />

      {/* Homepage Tournament Filter Section (Strictly Limit 1 Card upon selection) */}
      <HomepageTournamentFilter 
        onSelectTournament={onSelectTournament}
        onNavigateToCategory={onNavigateToCategory}
        onNavigateToAllTournaments={() => onNavigate('tournaments')}
      />

      {/* Support Section */}
      <SupportSection />
    </div>
  );
};

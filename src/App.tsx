import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GlobalAudioProvider } from './context/GlobalAudioContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TournamentDetailModal } from './components/TournamentDetailModal';
import { TwoMinuteAlert } from './components/TwoMinuteAlert';
import { AuthModal } from './components/AuthModal';

// Views
import { HomeView } from './views/HomeView';
import { TournamentsView } from './views/TournamentsView';
import { MyMatchesView } from './views/MyMatchesView';
import { WalletView } from './views/WalletView';
import { ProfileView } from './views/ProfileView';

// Admin Master Panel
import { AdminApp } from './admin/AdminApp';

import { Tournament, TournamentCategory } from './types';
import { normalizeCategory, getCategorySlug } from './lib/categoryUtils';

const MainApp: React.FC = () => {
  const { user } = useAuth();

  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedCategory, setSelectedCategory] = useState<TournamentCategory | 'All'>('All');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const fullSearch = window.location.search || (hash.includes('?') ? '?' + hash.split('?')[1] : '');
      const searchParams = new URLSearchParams(fullSearch);
      const catParam = searchParams.get('category');

      if (path.startsWith('/admin') || hash.startsWith('#admin')) {
        setCurrentView('admin');
      } else if (path.startsWith('/tournaments') || hash.startsWith('#tournaments') || (path === '/' && catParam)) {
        setCurrentView('tournaments');
        if (catParam) {
          setSelectedCategory(normalizeCategory(catParam));
        }
      } else if (path.startsWith('/my-matches') || hash.startsWith('#my-matches')) {
        setCurrentView('my-matches');
      } else if (path.startsWith('/wallet') || hash.startsWith('#wallet')) {
        setCurrentView('wallet');
      } else if (path.startsWith('/profile') || hash.startsWith('#profile')) {
        setCurrentView('profile');
      } else {
        setCurrentView('home');
      }
    };

    handleUrlChange();
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const handleNavigate = (view: string, category?: string) => {
    setCurrentView(view);
    if (view === 'admin') {
      window.location.hash = 'admin/dashboard';
    } else if (view === 'tournaments') {
      if (category && category !== 'All') {
        const norm = normalizeCategory(category);
        setSelectedCategory(norm);
        const slug = getCategorySlug(norm);
        window.history.pushState({}, '', `/tournaments?category=${slug}`);
      } else {
        setSelectedCategory('All');
        window.history.pushState({}, '', '/tournaments');
      }
    } else if (view === 'home') {
      window.history.pushState({}, '', '/');
    } else {
      window.history.pushState({}, '', `/${view}`);
    }
  };

  const handleSelectTournament = (tour: Tournament) => {
    setSelectedTournament(tour);
  };

  const handleNavigateToCategory = (cat: TournamentCategory | string) => {
    const norm = normalizeCategory(cat);
    setSelectedCategory(norm);
    const slug = getCategorySlug(norm);
    setCurrentView('tournaments');
    window.history.pushState({}, '', `/tournaments?category=${slug}`);
  };

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  // If in Admin Mode, mount full AdminApp
  if (currentView === 'admin') {
    return <AdminApp onExitAdmin={() => handleNavigate('home')} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090d16] text-[#10213A] dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-[#176BFF] selection:text-white">
      {/* 2-Minute Imminent Match Alert Banner */}
      <TwoMinuteAlert onOpenTournament={handleSelectTournament} />

      {/* Main Sticky Header */}
      <Header onNavigate={handleNavigate} currentView={currentView} />

      {/* Main Content Body */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            onSelectTournament={handleSelectTournament}
            onNavigateToCategory={handleNavigateToCategory}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'tournaments' && (
          <TournamentsView
            initialCategory={selectedCategory}
            onSelectTournament={handleSelectTournament}
          />
        )}

        {currentView === 'my-matches' && (
          <MyMatchesView
            onSelectTournament={handleSelectTournament}
            onNavigateToTournaments={() => handleNavigate('tournaments')}
          />
        )}

        {currentView === 'wallet' && <WalletView />}

        {currentView === 'profile' && (
          <ProfileView
            onOpenAuth={() => handleOpenAuth('login')}
            onNavigateToAdmin={() => handleNavigate('admin')}
          />
        )}
      </main>

      {/* Tournament Detail & Room Credentials Modal */}
      <TournamentDetailModal
        tournament={selectedTournament}
        onClose={() => setSelectedTournament(null)}
        onNavigateToWallet={() => {
          setSelectedTournament(null);
          handleNavigate('wallet');
        }}
        onNavigateToProfile={() => {
          setSelectedTournament(null);
          handleNavigate('profile');
        }}
      />

      {/* Auth Modal (Login / Signup) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />

      {/* Bottom Sticky Navigation */}
      <BottomNav currentView={currentView} onNavigate={handleNavigate} />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <GlobalAudioProvider>
        <MainApp />
      </GlobalAudioProvider>
    </AuthProvider>
  );
}

export default App;

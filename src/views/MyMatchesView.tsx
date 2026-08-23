import React, { useState, useEffect } from 'react';
import { Tournament } from '../types';
import { useAuth } from '../context/AuthContext';
import { safeFetchJson } from '../lib/api';
import { TournamentCard } from '../components/TournamentCard';
import { Swords, Trophy, Clock, Key, Copy, Check } from 'lucide-react';

interface MyMatchesViewProps {
  onSelectTournament: (tournament: Tournament) => void;
  onNavigateToTournaments: () => void;
}

export const MyMatchesView: React.FC<MyMatchesViewProps> = ({
  onSelectTournament,
  onNavigateToTournaments
}) => {
  const { user, token, t, bootstrap } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'WAITING' | 'LIVE' | 'COMPLETE'>('WAITING');
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !user) return;

    const fetchMyMatches = async () => {
      setLoading(true);
      try {
        const res = await safeFetchJson<Tournament[]>('/api/user/my-matches', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok && Array.isArray(res.data)) {
          setMyTournaments(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyMatches();
  }, [token, user, bootstrap?.tournaments]);

  if (!user) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-slate-800 text-[#176BFF] flex items-center justify-center mx-auto">
          <Swords className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-[#10213A] dark:text-white">
          Please Login to view your matches
        </h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Join tournaments to compete, track room credentials, and win real cash prizes!
        </p>
      </div>
    );
  }

  const filteredMatches = (Array.isArray(myTournaments) ? myTournaments : []).filter((m) => {
    if (selectedTab === 'WAITING') {
      return m.status === 'COMING SOON' || m.status === 'WAITING';
    }
    if (selectedTab === 'LIVE') {
      return m.status === 'LIVE MATCH';
    }
    if (selectedTab === 'COMPLETE') {
      return m.status === 'COMPLETE' || m.status === 'CANCELLED';
    }
    return true;
  });

  return (
    <div className="w-full max-w-lg sm:max-w-2xl md:max-w-4xl mx-auto px-4 py-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-[#10213A] dark:text-white tracking-tight">
          {t.myMatches}
        </h2>
        <span className="text-xs font-bold text-[#176BFF] bg-[#EAF4FF] dark:bg-slate-800 px-3 py-1 rounded-full border border-[#DCE8F7] dark:border-slate-700">
          {myTournaments.length} Total Registered
        </span>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-[#EAF4FF] dark:bg-slate-800 p-1.5 rounded-2xl border border-[#DCE8F7] dark:border-slate-700">
        <button
          onClick={() => setSelectedTab('WAITING')}
          className={`py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all ${
            selectedTab === 'WAITING'
              ? 'bg-white dark:bg-slate-900 text-[#176BFF] dark:text-blue-400 shadow-sm'
              : 'text-[#60708A] dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {t.waiting}
        </button>
        <button
          onClick={() => setSelectedTab('LIVE')}
          className={`py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all ${
            selectedTab === 'LIVE'
              ? 'bg-white dark:bg-slate-900 text-red-600 shadow-sm'
              : 'text-[#60708A] dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {t.live}
        </button>
        <button
          onClick={() => setSelectedTab('COMPLETE')}
          className={`py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all ${
            selectedTab === 'COMPLETE'
              ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm'
              : 'text-[#60708A] dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {t.complete}
        </button>
      </div>

      {/* Matches List */}
      <div className="space-y-4 pt-1">
        {filteredMatches.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-[#DCE8F7] dark:border-slate-800 space-y-3">
            <Swords className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Nothing here yet
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              You have no {selectedTab.toLowerCase()} matches at the moment.
            </p>
            <button
              onClick={onNavigateToTournaments}
              className="px-6 py-2.5 rounded-2xl bg-[#176BFF] hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all inline-block cursor-pointer mt-2"
            >
              Browse Tournaments
            </button>
          </div>
        ) : (
          filteredMatches.map((tour, idx) => (
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

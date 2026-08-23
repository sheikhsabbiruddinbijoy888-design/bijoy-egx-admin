import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tournament } from '../types';
import { Bell, Key, X, ExternalLink } from 'lucide-react';

interface TwoMinuteAlertProps {
  onOpenTournament: (tournament: Tournament) => void;
}

export const TwoMinuteAlert: React.FC<TwoMinuteAlertProps> = ({ onOpenTournament }) => {
  const { user, bootstrap, t } = useAuth();
  const [imminentMatch, setImminentMatch] = useState<Tournament | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!user || !bootstrap?.tournaments) return;

    const checkImminentMatches = () => {
      const now = Date.now();
      const userTournaments = (Array.isArray(bootstrap.tournaments) ? bootstrap.tournaments : []).filter(tour => 
        (Array.isArray(tour.participants) ? tour.participants : []).some(p => p.userId === user.id) && tour.status !== 'COMPLETE' && tour.status !== 'CANCELLED'
      );

      // Check if any match is within 2 minutes (120,000 ms) and not passed by more than 15 minutes
      const match = userTournaments.find(tour => {
        const diff = tour.matchTimestamp - now;
        return diff > 0 && diff <= 2 * 60 * 1000;
      });

      if (match) {
        setImminentMatch(match);
      } else {
        setImminentMatch(null);
        setIsDismissed(false);
      }
    };

    checkImminentMatches();
    const interval = setInterval(checkImminentMatches, 15000);
    return () => clearInterval(interval);
  }, [user, bootstrap?.tournaments]);

  if (!imminentMatch || isDismissed) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-50 max-w-lg mx-auto bg-gradient-to-r from-amber-500 to-red-500 text-white p-4 rounded-2xl shadow-2xl border border-amber-300 animate-bounce">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-white animate-wiggle" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/30 px-2 py-0.5 rounded-md inline-block">
              {t.matchStarting2m}
            </span>
            <h4 className="text-sm font-black mt-1">
              {imminentMatch.name}
            </h4>
            <p className="text-xs text-amber-100 mt-0.5">
              Match starting at {imminentMatch.matchTime}. Check Room ID & Password now!
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="text-white/80 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-end">
        <button
          onClick={() => {
            setIsDismissed(true);
            onOpenTournament(imminentMatch);
          }}
          className="px-4 py-1.5 rounded-xl bg-white text-red-600 font-extrabold text-xs shadow-md hover:bg-amber-50 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Key className="w-3.5 h-3.5" />
          <span>Get Room Details</span>
        </button>
      </div>
    </div>
  );
};

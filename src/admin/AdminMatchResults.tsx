import React, { useState, useEffect } from 'react';
import { 
  Medal, 
  Trophy, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  User, 
  Image as ImageIcon, 
  RefreshCw,
  Eye,
  Check,
  Send
} from 'lucide-react';
import { safeFetchJson, getAuthToken } from '../lib/api';
import { Tournament, Participant } from '../types';
import { MediaUploadBox } from '../components/MediaUploadBox';

interface WinnerEntry {
  userId: string;
  userName: string;
  freeFireIgn?: string;
  rank: number;
  kills: number;
  placementPrize: number;
  killPrize: number;
  totalPrize: number;
}

export const AdminMatchResults: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  // Result Form State
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [winners, setWinners] = useState<WinnerEntry[]>([]);
  const [perKillRate, setPerKillRate] = useState<number>(10);
  const [notes, setNotes] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<Tournament[]>('/api/tournaments');
      if (res.ok && Array.isArray(res.data)) {
        setTournaments(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleSelectTournament = (t: Tournament) => {
    setSelectedTournament(t);
    setScreenshotUrl('');
    setPerKillRate(t.perKill || 0);
    setNotes(`Match results and prize payout for ${t.name}`);
    setFeedback(null);

    // Initialize winners array based on participants
    const initialWinners: WinnerEntry[] = (t.participants || []).map((p, idx) => ({
      userId: p.userId,
      userName: p.userName || `Player ${idx + 1}`,
      freeFireIgn: p.freeFireIgn,
      rank: idx + 1,
      kills: 0,
      placementPrize: idx === 0 ? (t.prizePool * 0.5) : idx === 1 ? (t.prizePool * 0.3) : idx === 2 ? (t.prizePool * 0.2) : 0,
      killPrize: 0,
      totalPrize: idx === 0 ? (t.prizePool * 0.5) : idx === 1 ? (t.prizePool * 0.3) : idx === 2 ? (t.prizePool * 0.2) : 0
    }));

    setWinners(initialWinners);
  };

  const handleUpdateWinner = (index: number, field: keyof WinnerEntry, value: any) => {
    setWinners(prev => {
      const updated = [...prev];
      const entry = { ...updated[index], [field]: value };

      if (field === 'kills' || field === 'placementPrize') {
        const kills = field === 'kills' ? Number(value) : entry.kills;
        const placement = field === 'placementPrize' ? Number(value) : entry.placementPrize;
        entry.killPrize = kills * perKillRate;
        entry.totalPrize = placement + entry.killPrize;
      }

      updated[index] = entry;
      return updated;
    });
  };

  const handleDistributePrizes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;
    if (winners.length === 0) {
      setFeedback({ type: 'error', message: 'No registered participants to distribute prizes to.' });
      return;
    }

    const totalPayout = winners.reduce((sum, w) => sum + (w.totalPrize || 0), 0);
    const confirmPayout = window.confirm(`Confirm publishing match results for "${selectedTournament.name}"?\n\nTotal prize payout: ৳${totalPayout}\nThis will automatically credit each winning player's wallet and set tournament to COMPLETE.`);
    if (!confirmPayout) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/tournaments/${selectedTournament.id}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          screenshotUrl,
          winners: winners.filter(w => w.totalPrize > 0 || w.kills > 0),
          notes
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit match results');
      }

      setFeedback({
        type: 'success',
        message: `Match results published and ৳${totalPayout} prize distributed to winners!`
      });

      // Update tournament locally
      setTournaments(prev => prev.map(t => t.id === selectedTournament.id ? { ...t, status: 'COMPLETE' as any } : t));
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error processing payouts' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalCalculatedPayout = winners.reduce((acc, w) => acc + (w.totalPrize || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-[#10213A] dark:text-white tracking-tight">
            Match Results & Automated Prize Payouts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit match scores, rank placements, kill counts, screenshot proofs, and credit player wallets instantly.
          </p>
        </div>

        <button
          onClick={fetchTournaments}
          className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#10213A] dark:text-white text-xs font-black flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tournament Selector */}
      <div className="bg-white dark:bg-[#0B132B] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Step 1: Choose Match to Settle
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tournaments.map((t, idx) => {
            const isSelected = selectedTournament?.id === t.id;
            return (
              <div
                key={`${t.id}-${idx}`}
                onClick={() => handleSelectTournament(t)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#176BFF] bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-[#176BFF] dark:text-blue-300 font-black text-[10px] uppercase">
                    {t.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    t.status === 'COMPLETE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <h4 className="font-black text-xs text-[#10213A] dark:text-white mt-2 line-clamp-1">
                  {t.name}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  Prize: ৳{t.prizePool} • {t.participants?.length || 0} Players
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settlement Section */}
      {selectedTournament && (
        <form onSubmit={handleDistributePrizes} className="space-y-6">
          {/* Screenshot Proof Box */}
          <div className="bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-[#10213A] dark:text-white uppercase tracking-wider">
              Step 2: Upload Free Fire Match Result Screenshot / Scorecard
            </h3>
            <MediaUploadBox
              label="Match Scorecard Proof (Device File Upload)"
              mediaType="image"
              currentUrl={screenshotUrl}
              onUploadComplete={(res) => setScreenshotUrl(res.url)}
              onRemove={() => setScreenshotUrl('')}
              helperText="Upload official in-game match result screenshot as proof for players."
            />
          </div>

          {/* Participant Placement & Kill Breakdown Table */}
          <div className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[#10213A] dark:text-white uppercase tracking-wider">
                  Step 3: Player Placements & Kill Rewards
                </h3>
                <p className="text-xs text-slate-400">
                  Total Prize Pool: ৳{selectedTournament.prizePool} • Per Kill Rate: ৳{perKillRate}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Payout Calculated</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ৳{totalCalculatedPayout}
                </p>
              </div>
            </div>

            {winners.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No participants found in this tournament to award prizes.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-black text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Player / Free Fire IGN</th>
                      <th className="py-3 px-4">Placement Prize (৳)</th>
                      <th className="py-3 px-4">Kills</th>
                      <th className="py-3 px-4">Kill Prize (৳)</th>
                      <th className="py-3 px-4 font-black text-emerald-600">Total Award (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {winners.map((w, idx) => (
                      <tr key={`${w.userId || 'winner'}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="1"
                            value={w.rank}
                            onChange={(e) => handleUpdateWinner(idx, 'rank', Number(e.target.value))}
                            className="w-16 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-center"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-black text-[#10213A] dark:text-white">{w.userName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{w.freeFireIgn || w.userId}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            value={w.placementPrize}
                            onChange={(e) => handleUpdateWinner(idx, 'placementPrize', Number(e.target.value))}
                            className="w-24 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            value={w.kills}
                            onChange={(e) => handleUpdateWinner(idx, 'kills', Number(e.target.value))}
                            className="w-16 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-center"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                          ৳{w.killPrize}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-black font-mono text-sm text-emerald-600 dark:text-emerald-400">
                            ৳{w.totalPrize}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Prizes will be instantly credited to each player's wallet balance via the financial ledger.
              </span>
              <button
                type="submit"
                disabled={submitting || winners.length === 0}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Payouts...</span>
                  </>
                ) : (
                  <>
                    <Medal className="w-4 h-4" />
                    <span>Confirm & Pay ৳{totalCalculatedPayout} to Players</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

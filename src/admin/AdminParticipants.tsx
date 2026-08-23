import React, { useState, useEffect } from 'react';
import { 
  Users2, 
  Search, 
  Trophy, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  User, 
  Gamepad2, 
  Clock, 
  DollarSign,
  ShieldAlert
} from 'lucide-react';
import { safeFetchJson, getAuthToken } from '../lib/api';
import { Tournament, Participant } from '../types';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export const AdminParticipants: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [participantToRemove, setParticipantToRemove] = useState<Participant | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<Tournament[]>('/api/tournaments');
      if (res.ok && Array.isArray(res.data)) {
        const data = res.data;
        setTournaments(data);
        if (data.length > 0 && !selectedTournament) {
          setSelectedTournament(data[0]);
        } else if (selectedTournament) {
          const updated = data.find(t => t.id === selectedTournament.id);
          if (updated) setSelectedTournament(updated);
        }
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

  const handleRemoveParticipant = (participant: Participant) => {
    setParticipantToRemove(participant);
  };

  const handleConfirmRemoveParticipant = async () => {
    if (!selectedTournament || !participantToRemove) return;

    setRemoveLoading(true);
    setFeedback(null);

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/tournaments/${selectedTournament.id}/participants/${participantToRemove.userId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to remove participant');
      }

      setFeedback({
        type: 'success',
        message: `Removed ${participantToRemove.userName} and refunded ৳${selectedTournament.entryFee} to their wallet.`
      });

      // Instant local state update
      setSelectedTournament(prev => {
        if (!prev) return null;
        return {
          ...prev,
          joinedParticipants: Math.max(0, (prev.joinedParticipants || 1) - 1),
          participants: (prev.participants || []).filter(p => p.userId !== participantToRemove.userId)
        };
      });

      setTournaments(prev => prev.map(t => {
        if (t.id === selectedTournament.id) {
          return {
            ...t,
            joinedParticipants: Math.max(0, (t.joinedParticipants || 1) - 1),
            participants: (t.participants || []).filter(p => p.userId !== participantToRemove.userId)
          };
        }
        return t;
      }));

      setParticipantToRemove(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Operation failed' });
    } finally {
      setRemoveLoading(false);
    }
  };

  const participants = Array.isArray(selectedTournament?.participants) ? selectedTournament!.participants : [];
  const filteredParticipants = participants.filter(p => 
    (p.userName && p.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.freeFireIgn && p.freeFireIgn.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.freeFireUid && p.freeFireUid.includes(searchTerm)) ||
    (p.userId && p.userId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-[#10213A] dark:text-white tracking-tight">
            Tournament Participants Roster
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Inspect player Free Fire UIDs, in-game nicknames, slot assignments, or process player removal with refund.
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

      {/* Select Tournament Dropdown / List */}
      <div className="bg-white dark:bg-[#0B132B] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Trophy className="w-5 h-5 text-[#176BFF]" />
          <select
            value={selectedTournament?.id || ''}
            onChange={(e) => {
              const t = tournaments.find(item => item.id === e.target.value);
              if (t) setSelectedTournament(t);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black text-[#10213A] dark:text-white focus:outline-hidden"
          >
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.joinedCount || t.participants?.length || 0}/{t.totalSlots} Players) - {t.category}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search IGN, UID, Player name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-hidden focus:border-[#176BFF]"
          />
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-black text-xs uppercase tracking-wider text-slate-400">
            Registered Players ({filteredParticipants.length} of {selectedTournament?.totalSlots || 0} Slots)
          </h3>
          <span className="text-xs font-bold text-[#176BFF]">
            Entry Fee: ৳{selectedTournament?.entryFee || 0}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-black text-[10px]">
              <tr>
                <th className="py-3 px-4">Slot #</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Free Fire IGN</th>
                <th className="py-3 px-4">Free Fire UID</th>
                <th className="py-3 px-4">Registered At</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No participants found for this tournament.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p, idx) => (
                  <tr key={`${p.userId || 'p'}-${p.slotNumber || idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#176BFF]">
                      #{idx + 1}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#176BFF] font-black text-xs flex items-center justify-center">
                          {(p.userName || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-[#10213A] dark:text-white">{p.userName || 'Player'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {p.userId}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-[#10213A] dark:text-slate-200 flex items-center gap-1">
                        <Gamepad2 className="w-3.5 h-3.5 text-[#176BFF]" />
                        {p.freeFireIgn || 'N/A'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-black text-slate-700 dark:text-slate-300">
                      {p.freeFireUid || 'N/A'}
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-400 font-mono">
                      {p.joinedAt ? new Date(p.joinedAt).toLocaleString() : '-'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRemoveParticipant(p)}
                        disabled={removeLoading}
                        className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-1 ml-auto transition-all cursor-pointer"
                        title="Remove participant and refund entry fee"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove & Refund
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SweetAlert Style Participant Removal Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(participantToRemove)}
        title="Remove Participant"
        message={`Are you sure you want to remove this player from "${selectedTournament?.name || 'the tournament'}"? Their entry fee of ৳${selectedTournament?.entryFee || 0} will be instantly refunded to their wallet balance.`}
        itemType="Player Registration"
        itemName={participantToRemove ? `${participantToRemove.userName} (IGN: ${participantToRemove.freeFireIgn || 'N/A'}, UID: ${participantToRemove.freeFireUid})` : undefined}
        loading={removeLoading}
        onConfirm={handleConfirmRemoveParticipant}
        onClose={() => {
          if (!removeLoading) setParticipantToRemove(null);
        }}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Swords, 
  Search, 
  Key, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw,
  Trophy,
  Users,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { safeFetchJson, getAuthToken } from '../lib/api';
import { Tournament } from '../types';

export const AdminMatches: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeMatch, setActiveMatch] = useState<Tournament | null>(null);
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [releaseMinutes, setReleaseMinutes] = useState(2);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<Tournament[]>('/api/tournaments');
      if (res.ok && Array.isArray(res.data)) setTournaments(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleSelectMatch = (t: Tournament) => {
    setActiveMatch(t);
    setRoomId(t.roomId || '');
    setRoomPassword(t.roomPassword || '');
    setReleaseMinutes(t.roomReleaseMinutes || 2);
    setFeedback(null);
  };

  const handleSaveRoomCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatch) return;
    if (!roomId.trim() || !roomPassword.trim()) {
      setFeedback({ type: 'error', message: 'Room ID and Password cannot be empty.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/tournaments/${activeMatch.id}/room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          roomId: roomId.trim(),
          roomPassword: roomPassword.trim(),
          roomReleaseMinutes: Number(releaseMinutes)
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update match credentials');
      }

      setFeedback({
        type: 'success',
        message: `Room ID and Password broadcasted to ${activeMatch.participants?.length || 0} registered players in "${activeMatch.name}"!`
      });

      setTournaments(prev => prev.map(t => t.id === activeMatch.id ? { 
        ...t, 
        roomId: roomId.trim(), 
        roomPassword: roomPassword.trim(), 
        roomReleaseMinutes: Number(releaseMinutes) 
      } : t));
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to publish room details' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filtered = (Array.isArray(tournaments) ? tournaments : []).filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-[#10213A] dark:text-white tracking-tight">
            Match Rooms & Credential Dispatch
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure custom Free Fire in-game Room IDs and passwords with instant realtime dispatch.
          </p>
        </div>

        <button
          onClick={fetchMatches}
          className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#10213A] dark:text-white text-xs font-black flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Matches
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Match Selection */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#0B132B] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Select Match
            </h3>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tournaments..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-hidden"
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {filtered.map(t => {
                const isSelected = activeMatch?.id === t.id;
                const hasRoom = Boolean(t.roomId && t.roomPassword);

                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectMatch(t)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#176BFF] bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-[#176BFF] dark:text-blue-300 font-black text-[10px] uppercase">
                        {t.category}
                      </span>
                      <span className={`text-[10px] font-black uppercase ${
                        hasRoom ? 'text-emerald-500 flex items-center gap-1' : 'text-slate-400'
                      }`}>
                        {hasRoom ? <><CheckCircle2 className="w-3 h-3" /> Credentials Set</> : 'No Room Info'}
                      </span>
                    </div>

                    <h4 className="font-black text-xs text-[#10213A] dark:text-white mt-1.5 line-clamp-1">
                      {t.name}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                      <span>{t.matchDate} • {t.matchTime}</span>
                      <span className="text-[#176BFF] font-bold">{t.joinedCount}/{t.totalSlots} Players</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Room Credentials Editor */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleSaveRoomCredentials} className="bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#10213A] dark:text-white uppercase tracking-wider">
                Room Access Credentials
              </h3>
              {activeMatch && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#176BFF] text-xs font-black">
                  #{activeMatch.id}
                </span>
              )}
            </div>

            {activeMatch ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900">
                <h4 className="font-black text-sm text-[#10213A] dark:text-white">{activeMatch.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Map: {activeMatch.map} • {activeMatch.matchDate} at {activeMatch.matchTime} • {activeMatch.participants?.length || 0} Registered Players
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                Select a match from the left list to edit room details.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
                  Free Fire Custom Room ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="e.g. 5928104"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono font-black focus:outline-hidden focus:border-[#176BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
                  Room Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono font-black focus:outline-hidden focus:border-[#176BFF]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
                Player Release Window (Minutes Before Start)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={releaseMinutes}
                  onChange={(e) => setReleaseMinutes(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-black"
                />
                <span className="text-xs text-slate-500">
                  Minutes prior to scheduled match time (e.g. 2-5 mins).
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!activeMatch || saving}
                className="w-full py-3 rounded-2xl bg-[#176BFF] hover:bg-blue-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Broadcasting to Players...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publish & Dispatch Room Credentials</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

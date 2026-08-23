import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Users, 
  DollarSign, 
  Calendar, 
  Clock, 
  Key, 
  ShieldAlert, 
  Sparkles, 
  AlertCircle, 
  X, 
  RefreshCw,
  Swords,
  MapPin,
  FileText,
  Crown,
  Medal,
  Award,
  Crosshair,
  Home
} from 'lucide-react';
import { safeFetchJson, getAuthToken } from '../lib/api';
import { Tournament, CategoryInfo } from '../types';
import { MediaUploadBox } from '../components/MediaUploadBox';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { getBangladeshDateTime } from '../lib/timeUtils';

export const AdminTournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [availableCategories, setAvailableCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Solo');
  const [game, setGame] = useState('Free Fire');
  const [map, setMap] = useState('Bermuda');
  const [coverImage, setCoverImage] = useState('');
  const [entryFee, setEntryFee] = useState<number | ''>(25);
  const [prizePool, setPrizePool] = useState<number | ''>(1000);
  const [perKill, setPerKill] = useState<number | ''>(10);
  const [winnerPrize, setWinnerPrize] = useState<number | ''>(500);
  const [secondPrize, setSecondPrize] = useState<number | ''>(250);
  const [thirdPrize, setThirdPrize] = useState<number | ''>(150);
  const [fourthPrize, setFourthPrize] = useState<number | ''>(0);
  const [fifthPrize, setFifthPrize] = useState<number | ''>(0);
  const [totalSlots, setTotalSlots] = useState<number | ''>(48);
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('08:00 PM');
  const [rules, setRules] = useState(
    '1. Emulator strictly prohibited (Mobile only).\n' +
    '2. Any third-party configs or hack scripts result in immediate ban.\n' +
    '3. Players must enter using registered Free Fire UID and IGN.\n' +
    '4. Teaming up is strictly forbidden.\n' +
    '5. Room ID & Password released before match time in Match Details.'
  );
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [roomReleaseMinutes, setRoomReleaseMinutes] = useState<number>(2);
  const [status, setStatus] = useState<'COMING SOON' | 'WAITING' | 'LIVE MATCH' | 'COMPLETE' | 'CANCELLED'>('COMING SOON');
  const [isFeatured, setIsFeatured] = useState(false);
  const [showOnHomepage, setShowOnHomepage] = useState(false);
  const [displayPriority, setDisplayPriority] = useState<number | ''>(1);

  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tournament | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchTournamentsAndCategories = async () => {
    setLoading(true);
    try {
      const [tournRes, catRes] = await Promise.all([
        safeFetchJson<Tournament[]>('/api/tournaments'),
        safeFetchJson<CategoryInfo[]>('/api/admin/categories')
      ]);
      if (tournRes.ok && Array.isArray(tournRes.data)) setTournaments(tournRes.data);
      if (catRes.ok && Array.isArray(catRes.data)) {
        setAvailableCategories(catRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentsAndCategories();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingTournament(null);
    setName('');
    setCategory('Solo');
    setGame('Free Fire');
    setMap('Bermuda');
    setCoverImage('');
    setEntryFee(25);
    setPrizePool(1000);
    setPerKill(10);
    setWinnerPrize(500);
    setSecondPrize(250);
    setThirdPrize(150);
    setFourthPrize(0);
    setFifthPrize(0);
    setTotalSlots(48);
    
    const nowBst = getBangladeshDateTime(Date.now());
    setMatchDate(nowBst.isoDate);
    setMatchTime('08:00 PM');
    setRules(
      '1. Emulator strictly prohibited (Mobile only).\n' +
      '2. Any third-party configs or hack scripts result in immediate ban.\n' +
      '3. Players must enter using registered Free Fire UID and IGN.\n' +
      '4. Teaming up is strictly forbidden.\n' +
      '5. Room ID & Password released before match time in Match Details.'
    );
    setRoomId('');
    setRoomPassword('');
    setRoomReleaseMinutes(2);
    setStatus('COMING SOON');
    setIsFeatured(false);
    setShowOnHomepage(false);
    setDisplayPriority(1);
    setFeedback(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (t: Tournament) => {
    setEditingTournament(t);
    setName(t.name);
    setCategory(t.category as any);
    setGame(t.game || 'Free Fire');
    setMap(t.map || 'Bermuda');
    setCoverImage(t.coverImage || '');
    setEntryFee(t.entryFee);
    setPrizePool(t.prizePool);
    setPerKill(t.perKill || 0);
    setWinnerPrize(t.winnerPrize !== undefined ? t.winnerPrize : Math.round(t.prizePool * 0.5));
    setSecondPrize(t.secondPrize !== undefined ? t.secondPrize : Math.round(t.prizePool * 0.25));
    setThirdPrize(t.thirdPrize !== undefined ? t.thirdPrize : Math.round(t.prizePool * 0.15));
    setFourthPrize(t.fourthPrize !== undefined ? t.fourthPrize : 0);
    setFifthPrize(t.fifthPrize !== undefined ? t.fifthPrize : 0);
    setTotalSlots(t.totalSlots);
    setMatchDate(t.matchDate || new Date().toISOString().split('T')[0]);
    setMatchTime(t.matchTime || '08:00 PM');
    setRules(t.rules || '');
    setRoomId(t.roomId || '');
    setRoomPassword(t.roomPassword || '');
    setRoomReleaseMinutes(t.roomReleaseMinutes || 2);
    setStatus(t.status as any);
    setIsFeatured(Boolean(t.isFeatured));
    setShowOnHomepage(Boolean(t.showOnHomepage));
    setDisplayPriority(t.displayPriority !== undefined ? t.displayPriority : 1);
    setFeedback(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || entryFee === '' || prizePool === '' || totalSlots === '') {
      setFeedback({ type: 'error', message: 'Please fill in all mandatory tournament details.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const payload = {
      name: name.trim(),
      category,
      game,
      map,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
      entryFee: Number(entryFee),
      prizePool: Number(prizePool),
      perKill: Number(perKill || 0),
      winnerPrize: Number(winnerPrize || 0),
      secondPrize: Number(secondPrize || 0),
      thirdPrize: Number(thirdPrize || 0),
      fourthPrize: Number(fourthPrize || 0),
      fifthPrize: Number(fifthPrize || 0),
      totalSlots: Number(totalSlots),
      matchDate,
      matchTime,
      rules,
      roomId: roomId.trim(),
      roomPassword: roomPassword.trim(),
      roomReleaseMinutes: Number(roomReleaseMinutes),
      status,
      isFeatured,
      showOnHomepage: Boolean(showOnHomepage),
      displayPriority: Number(displayPriority || 1)
    };

    try {
      const token = getAuthToken();
      const url = editingTournament ? `/api/admin/tournaments/${editingTournament.id}` : '/api/admin/tournaments';
      const method = editingTournament ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Operation failed');

      setFeedback({
        type: 'success',
        message: editingTournament ? `Tournament "${name}" updated!` : `Tournament "${name}" published successfully!`
      });

      fetchTournamentsAndCategories();
      setModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error saving tournament' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (t: Tournament) => {
    setDeleteTarget(t);
  };

  const handleConfirmHardDelete = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/tournaments/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete tournament');

      // Instant local state update
      setTournaments(prev => prev.filter(item => item.id !== deleteTarget.id));
      setFeedback({ type: 'success', message: 'Item deleted successfully!' });
      setDeleteTarget(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Delete failed' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleQuickStatusChange = async (t: Tournament, newStatus: string) => {
    if (newStatus === 'CANCELLED') {
      const confirmCancel = window.confirm(`Cancel tournament "${t.name}"? This will automatically refund the ৳${t.entryFee} entry fee to all ${t.participants.length} registered players!`);
      if (!confirmCancel) return;
    }

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/tournaments/${t.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update status');

      setTournaments(prev => prev.map(item => item.id === t.id ? { ...item, status: newStatus as any } : item));
      setFeedback({ type: 'success', message: `Tournament status updated to ${newStatus}` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Status update failed' });
    }
  };

  const handleToggleHomepage = async (t: Tournament) => {
    const nextVal = !t.showOnHomepage;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/tournaments/${t.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ showOnHomepage: nextVal })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update homepage status');

      setTournaments(prev => prev.map(item => item.id === t.id ? { ...item, showOnHomepage: nextVal } : item));
      setFeedback({ 
        type: 'success', 
        message: nextVal 
          ? `Tournament "${t.name}" enabled for Homepage filter!` 
          : `Tournament "${t.name}" removed from Homepage filter.` 
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Update failed' });
    }
  };

  const filteredTournaments = (Array.isArray(tournaments) ? tournaments : []).filter(t => {
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    const matchesSearch = 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.map?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-[#10213A] dark:text-white tracking-tight">
            Tournament Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Launch Free Fire tournaments, configure prize distributions, set Bangladesh timings (BST), and upload covers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTournamentsAndCategories}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#10213A] dark:text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-2xl bg-[#176BFF] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Tournament
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0B132B] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tournament name, ID, map..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-hidden focus:border-[#176BFF]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          {['ALL', ...Array.from(new Set([
            ...availableCategories.map(c => c.title || c.name || ''),
            'Solo', 'Duo', 'Classic Squad', '2v2 Lone Wolf', 'BR Match'
          ].filter(Boolean)))].map((cat, cIdx) => (
            <button
              key={`cat-filter-${cat}-${cIdx}`}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#176BFF] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tournaments Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTournaments.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800">
            No tournaments found matching current criteria.
          </div>
        ) : (
          filteredTournaments.map((t, idx) => {
            const isFull = t.joinedCount >= t.totalSlots;
            return (
              <div 
                key={`${t.id}-${idx}`} 
                className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Tournament Cover Box */}
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                    <img
                      src={t.coverImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'}
                      alt={t.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 max-w-[80%]">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#176BFF] text-white font-black text-[10px] uppercase tracking-wider shadow-md">
                        {t.category}
                      </span>
                      {t.showOnHomepage ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-black text-[10px] uppercase flex items-center gap-1 shadow-md">
                          <Home className="w-3 h-3" /> Homepage ON (P#{t.displayPriority || 1})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-700/80 text-slate-300 font-bold text-[10px] uppercase shadow-md">
                          Homepage OFF
                        </span>
                      )}
                      {t.isFeatured && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-black text-[10px] uppercase flex items-center gap-1 shadow-md">
                          <Sparkles className="w-3 h-3" /> Featured
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        t.status === 'LIVE MATCH' ? 'bg-red-600 text-white animate-pulse' :
                        t.status === 'COMPLETE' ? 'bg-emerald-600 text-white' :
                        t.status === 'CANCELLED' ? 'bg-slate-700 text-slate-300' :
                        'bg-blue-600/90 text-white backdrop-blur-xs'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <span className="font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" /> {t.map || 'Bermuda'}
                      </span>
                      <span className="font-mono text-emerald-400 font-black">
                        Fee: ৳{t.entryFee}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-black text-base text-[#10213A] dark:text-white line-clamp-1">
                        {t.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        #{t.id} • {t.matchDate} at {t.matchTime} (BST)
                      </p>
                    </div>

                    {/* Stats Ribbon */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 text-center text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">Prize Pool</span>
                        <span className="font-black text-amber-600 dark:text-amber-400 font-mono">৳{t.prizePool}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">Per Kill</span>
                        <span className="font-black text-rose-600 dark:text-rose-400 font-mono">৳{t.perKill || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">Slots</span>
                        <span className="font-black text-[#176BFF] dark:text-blue-400 font-mono">{t.joinedCount || t.participants.length}/{t.totalSlots}</span>
                      </div>
                    </div>

                    {/* Prize breakdown quick tags */}
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-blue-50/50 dark:bg-slate-800/40 p-2 rounded-xl">
                      <Crown className="w-3 h-3 text-amber-500" />
                      <span>1st: ৳{t.winnerPrize || Math.round(t.prizePool * 0.5)}</span>
                      <span>•</span>
                      <span>2nd: ৳{t.secondPrize || Math.round(t.prizePool * 0.25)}</span>
                      <span>•</span>
                      <span>3rd: ৳{t.thirdPrize || Math.round(t.prizePool * 0.15)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 space-y-2 mt-2">
                  <div className="flex items-center justify-between gap-2 pt-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleHomepage(t)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer ${
                          t.showOnHomepage 
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 hover:text-slate-800 border border-slate-200 dark:border-slate-700'
                        }`}
                        title={t.showOnHomepage ? "Currently shown on Homepage (Click to hide)" : "Currently hidden from Homepage (Click to show)"}
                      >
                        <Home className="w-3 h-3" />
                        {t.showOnHomepage ? 'Home: ON' : 'Home: OFF'}
                      </button>
                      <button
                        onClick={() => handleQuickStatusChange(t, 'LIVE MATCH')}
                        className="px-2 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-[10px] font-black uppercase cursor-pointer"
                        title="Set Live Match"
                      >
                        Live
                      </button>
                      <button
                        onClick={() => handleQuickStatusChange(t, 'COMPLETE')}
                        className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase cursor-pointer"
                        title="Mark Complete"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => handleQuickStatusChange(t, 'CANCELLED')}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase cursor-pointer"
                        title="Cancel tournament and refund players"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(t)}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-slate-600 dark:text-slate-300 hover:text-[#176BFF] transition-all cursor-pointer"
                        title="Edit Tournament"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 transition-all cursor-pointer"
                        title="Delete Tournament"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Tournament Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-[#10213A] dark:text-white">
                  {editingTournament ? `Edit Tournament #${editingTournament.id}` : 'Create Free Fire Tournament'}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Bangladesh Standard Time (BST, UTC+06:00) will be used for schedule calculations.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* REAL Media Upload Box for Cover Image (NO URL INPUT) */}
              <div>
                <MediaUploadBox
                  label="Tournament Cover Image (Upload Device File)"
                  mediaType="image"
                  currentUrl={coverImage}
                  onUploadComplete={(res) => setCoverImage(res.url)}
                  onRemove={() => setCoverImage('')}
                  helperText="Upload 16:9 HD tournament cover banner (JPG / PNG / WEBP)."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                    Tournament Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Bermuda Solo Night Royale"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:border-[#176BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  >
                    {Array.from(new Set([
                      ...availableCategories.filter(c => c.isActive !== false && c.active !== false).map(c => c.title || c.name || ''),
                      'Solo', 'Duo', 'Classic Squad', '2v2 Lone Wolf', 'BR Match'
                    ].filter(Boolean))).map(catName => (
                      <option key={catName} value={catName}>
                        {catName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Financial Breakdown & Slots */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                  Prize Pool & Financial Configuration
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Entry Fee (৳)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black font-mono text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Total Prize (৳)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={prizePool}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setPrizePool(val);
                        if (typeof val === 'number') {
                          setWinnerPrize(Math.round(val * 0.5));
                          setSecondPrize(Math.round(val * 0.25));
                          setThirdPrize(Math.round(val * 0.15));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black font-mono text-amber-600 dark:text-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Per Kill (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={perKill}
                      onChange={(e) => setPerKill(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black font-mono text-rose-600 dark:text-rose-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Total Slots</label>
                    <input
                      type="number"
                      required
                      min="2"
                      value={totalSlots}
                      onChange={(e) => setTotalSlots(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black font-mono"
                    />
                  </div>
                </div>

                {/* Specific Position Prizes */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">1st / Winner (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={winnerPrize}
                      onChange={(e) => setWinnerPrize(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">2nd Place (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={secondPrize}
                      onChange={(e) => setSecondPrize(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">3rd Place (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={thirdPrize}
                      onChange={(e) => setThirdPrize(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">4th Place (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={fourthPrize}
                      onChange={(e) => setFourthPrize(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">5th Place (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={fifthPrize}
                      onChange={(e) => setFifthPrize(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Map & Bangladesh Timezone Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Map</label>
                  <select
                    value={map}
                    onChange={(e) => setMap(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  >
                    <option value="Bermuda">Bermuda</option>
                    <option value="Purgatory">Purgatory</option>
                    <option value="Kalahari">Kalahari</option>
                    <option value="Alpine">Alpine</option>
                    <option value="Nextra">Nextra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Match Date (BST)</label>
                  <input
                    type="date"
                    required
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Match Time (BST)</label>
                  <input
                    type="text"
                    required
                    value={matchTime}
                    onChange={(e) => setMatchTime(e.target.value)}
                    placeholder="08:00 PM"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Room Security & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Custom Room ID</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="e.g. 8492041"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Room Password</label>
                  <input
                    type="text"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Release (Mins Before)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={roomReleaseMinutes}
                    onChange={(e) => setRoomReleaseMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Rules Multiline */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                  Official Match Rules & Regulations
                </label>
                <textarea
                  rows={4}
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs leading-relaxed"
                  placeholder="Enter tournament rules line by line..."
                />
              </div>

              {/* Homepage Display Settings (Explicit ON/OFF & Priority) */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-[#176BFF]" />
                    <h4 className="font-black text-xs uppercase tracking-wider text-[#10213A] dark:text-blue-200">
                      User Homepage Filter Visibility
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    Limit: 1 Match per Category
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <label className="flex items-center gap-2.5 text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/50">
                    <input
                      type="checkbox"
                      checked={showOnHomepage}
                      onChange={(e) => setShowOnHomepage(e.target.checked)}
                      className="w-4 h-4 rounded text-[#176BFF] accent-[#176BFF]"
                    />
                    <div>
                      <span className="block">Show on Homepage Filter</span>
                      <span className="text-[10px] font-normal text-slate-400 block">
                        {showOnHomepage ? 'Status: ENABLED (ON)' : 'Status: DISABLED (OFF - Default)'}
                      </span>
                    </div>
                  </label>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Display Priority (1 = Top Rank)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={displayPriority}
                      onChange={(e) => setDisplayPriority(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="1"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  • <strong>Rule:</strong> The user homepage displays <strong>MAXIMUM 1</strong> tournament card when a category is tapped. Only tournaments with <em>Show on Homepage = ON</em> are candidates.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[#176BFF] accent-[#176BFF]"
                  />
                  <span>Mark as Featured Tournament Badge</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase text-slate-400">Status:</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    <option value="COMING SOON">COMING SOON</option>
                    <option value="WAITING">WAITING</option>
                    <option value="LIVE MATCH">LIVE MATCH</option>
                    <option value="COMPLETE">COMPLETE</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#176BFF] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingTournament ? 'Update Tournament' : 'Publish Tournament')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SweetAlert Style Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Tournament"
        message="Are you sure you want to permanently delete this tournament? This will purge the tournament and all participant slot data from the database."
        itemType="Tournament"
        itemName={deleteTarget ? `${deleteTarget.name} (#${deleteTarget.id})` : undefined}
        loading={deleteLoading}
        onConfirm={handleConfirmHardDelete}
        onClose={() => {
          if (!deleteLoading) setDeleteTarget(null);
        }}
      />
    </div>
  );
};

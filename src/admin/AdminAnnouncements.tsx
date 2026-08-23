import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Edit3,
  Calendar,
  Sparkles
} from 'lucide-react';
import { safeFetchJson, getAuthToken } from '../lib/api';
import { Announcement } from '../types';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'INFO' | 'WARNING' | 'ALERT' | 'EVENT'>('INFO');
  const [active, setActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<Announcement[]>('/api/admin/announcements');
      if (res.ok && Array.isArray(res.data)) setAnnouncements(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingAnnouncement(null);
    setTitle('');
    setContent('');
    setType('INFO');
    setActive(true);
    setFeedback(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (a: Announcement) => {
    setEditingAnnouncement(a);
    setTitle(a.title);
    setContent(a.content);
    setType(a.type || 'INFO');
    setActive(a.active !== false);
    setFeedback(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFeedback({ type: 'error', message: 'Title and content cannot be empty.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const payload = {
      title: title.trim(),
      content: content.trim(),
      type,
      active
    };

    try {
      const token = getAuthToken();
      const url = editingAnnouncement ? `/api/admin/announcements/${editingAnnouncement.id}` : '/api/admin/announcements';
      const method = editingAnnouncement ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save announcement');

      setFeedback({
        type: 'success',
        message: editingAnnouncement ? 'Announcement updated!' : 'Announcement published to all players!'
      });

      fetchAnnouncements();
      setModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (a: Announcement) => {
    setAnnouncementToDelete(a);
  };

  const handleConfirmDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;

    setDeleteLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/announcements/${announcementToDelete.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error('Delete failed');
      setAnnouncements(prev => prev.filter(item => item.id !== announcementToDelete.id));
      setFeedback({ type: 'success', message: 'Item deleted successfully!' });
      setAnnouncementToDelete(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-[#10213A] dark:text-white tracking-tight">
            Broadcast Announcements
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Post news updates, maintenance alerts, tournament schedules, and rule clarifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnnouncements}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#10213A] dark:text-white text-xs font-black flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-2xl bg-[#176BFF] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Announcement
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

      {/* Announcements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {announcements.map((a, idx) => (
          <div 
            key={`${a.id}-${idx}`}
            className="bg-white dark:bg-[#0B132B] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-md font-black text-[10px] uppercase ${
                  a.type === 'ALERT' ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/50' :
                  a.type === 'WARNING' ? 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/50' :
                  a.type === 'EVENT' ? 'bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-950/50' :
                  'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/50'
                }`}>
                  {a.type || 'INFO'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h3 className="font-black text-sm text-[#10213A] dark:text-white">
                {a.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {a.content}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => handleOpenEditModal(a)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-blue-50 hover:text-[#176BFF]"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(a)}
                className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base text-[#10213A] dark:text-white">
                {editingAnnouncement ? 'Edit Announcement' : 'New Broadcast Announcement'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">Headline <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Free Fire Maintenance Update 8:00 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                >
                  <option value="INFO">General Information (Blue)</option>
                  <option value="EVENT">Special Event (Purple)</option>
                  <option value="WARNING">Warning (Amber)</option>
                  <option value="ALERT">Critical Alert (Red)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">Message Content <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write clear instructions or information for players..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#176BFF] text-white font-black text-xs uppercase"
                >
                  {submitting ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Announcement Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(announcementToDelete)}
        title="Delete Announcement"
        message="Are you sure you want to permanently delete this announcement? It will be removed from all active player notice boards."
        itemType="Announcement Notice"
        itemName={announcementToDelete ? announcementToDelete.title : undefined}
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteAnnouncement}
        onClose={() => {
          if (!deleteLoading) setAnnouncementToDelete(null);
        }}
      />
    </div>
  );
};

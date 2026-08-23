import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Users, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { safeFetchJson, getAuthToken } from '../lib/api';
import { User as UserType } from '../types';

export const AdminNotifications: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [targetType, setTargetType] = useState<'ALL' | 'INDIVIDUAL'>('ALL');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT'>('INFO');
  
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await safeFetchJson<UserType[]>('/api/admin/users');
        if (res.ok && Array.isArray(res.data)) {
          const data = res.data;
          setUsers(data);
          if (data.length > 0) setSelectedUserId(data[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadUsers();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setFeedback({ type: 'error', message: 'Notification title and message are required.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          targetType,
          userId: targetType === 'INDIVIDUAL' ? selectedUserId : undefined,
          title: title.trim(),
          message: message.trim(),
          type
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to dispatch notification');
      }

      setFeedback({
        type: 'success',
        message: targetType === 'ALL' ? `Broadcast sent to all players!` : `Direct notification delivered to player!`
      });

      setTitle('');
      setMessage('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Notification error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-[#10213A] dark:text-white tracking-tight">
            Notifications Center & Dispatch Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Send real-time alerts directly into players' notification drawers and event streams.
          </p>
        </div>
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

      <form onSubmit={handleSendNotification} className="bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 max-w-2xl">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            Target Audience
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTargetType('ALL')}
              className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${
                targetType === 'ALL'
                  ? 'border-[#176BFF] bg-blue-50/80 dark:bg-blue-950/50 text-[#176BFF]'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>All Registered Players</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetType('INDIVIDUAL')}
              className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${
                targetType === 'INDIVIDUAL'
                  ? 'border-[#176BFF] bg-blue-50/80 dark:bg-blue-950/50 text-[#176BFF]'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Specific Player</span>
            </button>
          </div>
        </div>

        {targetType === 'INDIVIDUAL' && (
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
              Select Player Recipient
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
            >
              {users.map((u, idx) => (
                <option key={`${u.id}-${idx}`} value={u.id}>
                  {u.fullName} ({u.email}) - FF: {u.freeFireIgn || u.freeFireUid || 'N/A'}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
            Notification Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['INFO', 'SUCCESS', 'WARNING', 'ALERT'] as const).map((t, idx) => (
              <button
                key={`${t}-${idx}`}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 rounded-xl text-xs font-black transition-all ${
                  type === t
                    ? 'bg-[#176BFF] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
            Notification Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Free Fire Tournament Starts in 10 Minutes!"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold focus:border-[#176BFF]"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
            Message Body <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Detailed alert notification text..."
            className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:border-[#176BFF]"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl bg-[#176BFF] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Dispatch Live Notification</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

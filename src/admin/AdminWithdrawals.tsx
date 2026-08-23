import React, { useState, useEffect } from 'react';
import { 
  ArrowUpCircle, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Copy, 
  Check, 
  AlertCircle, 
  RefreshCw,
  X,
  CreditCard,
  User,
  Phone,
  Receipt,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { safeFetchJson, getAuthToken } from '../lib/api';
import { WithdrawalRequest } from '../types';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export const AdminWithdrawals: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [withdrawalToDelete, setWithdrawalToDelete] = useState<WithdrawalRequest | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<WithdrawalRequest[]>('/api/admin/withdrawals');
      if (res.ok && Array.isArray(res.data)) setWithdrawals(res.data);
    } catch (e) {
      console.error('Failed to load withdrawals', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCompleteWithdrawal = async (wdr: WithdrawalRequest) => {
    const confirmPrompt = window.confirm(`Confirm that you have sent ৳${wdr.amount} to ${wdr.userName} (${wdr.method}: ${wdr.accountNumber})?`);
    if (!confirmPrompt) return;

    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await safeFetchJson<{success: boolean; error?: string}>(`/api/admin/withdrawals/${wdr.id}/complete`, {
        method: 'POST'
      });

      if (!res.ok || !res.data?.success) {
        throw new Error(res.error || 'Failed to complete withdrawal');
      }

      setFeedback({
        type: 'success',
        message: `Withdrawal #${wdr.id} marked as completed! User notified.`
      });

      setWithdrawals(prev => prev.map(w => w.id === wdr.id ? { ...w, status: 'COMPLETED' } : w));
      setModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Operation failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectWithdrawal = async (wdr: WithdrawalRequest) => {
    const reason = window.prompt(`Enter reason for rejecting withdrawal #${wdr.id} (This will refund ৳${wdr.amount} back to the user's wallet):`, 'Invalid payment number / account inaccessible');
    if (reason === null) return;

    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await safeFetchJson<{success: boolean; error?: string}>(`/api/admin/withdrawals/${wdr.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!res.ok || !res.data?.success) {
        throw new Error(res.error || 'Failed to cancel withdrawal');
      }

      setFeedback({
        type: 'success',
        message: `Withdrawal #${wdr.id} rejected. Balance was not deducted.`
      });

      setWithdrawals(prev => prev.map(w => w.id === wdr.id ? { ...w, status: 'REJECTED' } : w));
      setModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Operation failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteWithdrawal = (wdr: WithdrawalRequest) => {
    setWithdrawalToDelete(wdr);
  };

  const handleConfirmDeleteWithdrawal = async () => {
    if (!withdrawalToDelete) return;

    setDeleteLoading(true);
    try {
      const res = await safeFetchJson<{success: boolean; error?: string}>(`/api/admin/withdrawals/${withdrawalToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error(res.error || 'Failed to delete withdrawal record');

      // Instant local state purge
      setWithdrawals(prev => prev.filter(w => w.id !== withdrawalToDelete.id));
      if (selectedWithdrawal?.id === withdrawalToDelete.id) {
        setModalOpen(false);
        setSelectedWithdrawal(null);
      }
      setFeedback({ type: 'success', message: 'Item deleted successfully!' });
      setWithdrawalToDelete(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Delete operation failed' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredWithdrawals = (Array.isArray(withdrawals) ? withdrawals : []).filter(w => {
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    const matchesSearch = 
      w.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.accountNumber.includes(searchTerm) ||
      w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.method.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-[#10213A] dark:text-white tracking-tight">
            Withdrawals Processing Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Process player payout requests to bKash, Nagad, or Rocket accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchWithdrawals}
            className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#10213A] dark:text-white text-xs font-black flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
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
            placeholder="Search Account Number, Player Name, ID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-hidden focus:border-[#176BFF]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {(['PENDING', 'COMPLETED', 'REJECTED', 'ALL'] as const).map(status => {
            const count = (Array.isArray(withdrawals) ? withdrawals : []).filter(w => status === 'ALL' || w.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
                  statusFilter === status
                    ? 'bg-[#176BFF] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <span>{status}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === status ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Request / Player</th>
                <th className="py-3.5 px-4">Payout Method</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Destination Account</th>
                <th className="py-3.5 px-4">Requested At</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No withdrawals matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((w, idx) => (
                  <tr key={`${w.id}-${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-black text-[#10213A] dark:text-white">{w.userName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">#{w.id}</p>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        w.method === 'bKash' ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' :
                        w.method === 'Nagad' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                        'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                      }`}>
                        {w.method}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-black text-amber-600 dark:text-amber-400 font-mono text-sm">
                        ৳{w.amount}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#10213A] dark:text-slate-200">
                          {w.accountNumber}
                        </span>
                        <button
                          onClick={() => handleCopy(w.accountNumber, w.id)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                          title="Copy Account Number"
                        >
                          {copiedId === w.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-400 font-mono">
                      {new Date(w.createdAt).toLocaleDateString()} {new Date(w.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        w.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                        w.status === 'REJECTED' ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' :
                        'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse'
                      }`}>
                        {w.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {w.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleCompleteWithdrawal(w)}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Payout Sent
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(w)}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 rounded-xl bg-red-100 dark:bg-red-950/40 hover:bg-red-200 text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                              title="Reject and refund balance to player"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Refund
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(w);
                              setModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-blue-50 hover:text-[#176BFF]"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteWithdrawal(w)}
                          disabled={actionLoading}
                          title="Permanently Delete Withdrawal Record"
                          className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {modalOpen && selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base text-[#10213A] dark:text-white">Withdrawal Details #{selectedWithdrawal.id}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                <span className="text-slate-400">Player:</span>
                <span className="font-bold text-[#10213A] dark:text-white">{selectedWithdrawal.userName}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                <span className="text-slate-400">Payout Method & Amount:</span>
                <span className="font-black text-amber-600 dark:text-amber-400 font-mono text-sm">{selectedWithdrawal.method} • ৳{selectedWithdrawal.amount}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                <span className="text-slate-400">Destination Account:</span>
                <span className="font-mono font-bold text-[#10213A] dark:text-white">{selectedWithdrawal.accountNumber}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                <span className="text-slate-400">Status:</span>
                <span className="font-black uppercase">{selectedWithdrawal.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedWithdrawal) handleDeleteWithdrawal(selectedWithdrawal);
                }}
                className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>

              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SweetAlert Style Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(withdrawalToDelete)}
        title="Delete Withdrawal Record"
        message="Are you sure you want to permanently delete this withdrawal record? This will purge the payout ledger log from the system database."
        itemType="Withdrawal Record"
        itemName={withdrawalToDelete ? `${withdrawalToDelete.userName} - ৳${withdrawalToDelete.amount} (${withdrawalToDelete.method} to ${withdrawalToDelete.accountNumber})` : undefined}
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteWithdrawal}
        onClose={() => {
          if (!deleteLoading) setWithdrawalToDelete(null);
        }}
      />
    </div>
  );
};

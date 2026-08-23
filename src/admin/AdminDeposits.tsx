import React, { useState, useEffect } from 'react';
import { 
  ArrowDownCircle, 
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
  Trash2
} from 'lucide-react';
import { safeFetchJson, getAuthToken } from '../lib/api';
import { DepositRequest } from '../types';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ConfirmDepositModal } from './components/ConfirmDepositModal';
import { RejectDepositModal } from './components/RejectDepositModal';

export const AdminDeposits: React.FC = () => {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [depositToConfirm, setDepositToConfirm] = useState<DepositRequest | null>(null);
  const [depositToReject, setDepositToReject] = useState<DepositRequest | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [depositToDelete, setDepositToDelete] = useState<DepositRequest | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-clear feedback like a toast
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<DepositRequest[]>('/api/admin/deposits');
      if (res.ok && Array.isArray(res.data)) setDeposits(res.data);
    } catch (e) {
      console.error('Failed to load deposits', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInitiateConfirm = (dep: DepositRequest) => {
    setDepositToConfirm(dep);
  };

  const handleConfirmDeposit = async () => {
    if (!depositToConfirm) return;
    const dep = depositToConfirm;

    setProcessingId(dep.id);
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await safeFetchJson<{success: boolean; error?: string}>(`/api/admin/deposits/${dep.id}/confirm`, {
        method: 'POST'
      });
      
      if (!res.ok || !res.data?.success) {
        throw new Error(res.error || 'Failed to confirm deposit');
      }

      setFeedback({
        type: 'success',
        message: 'Deposit confirmed successfully.'
      });

      // Update local state then refresh from server for consistency
      setDeposits(prev => prev.map(d => d.id === dep.id ? { ...d, status: 'CONFIRMED' } : d));
      fetchDeposits();
      setDepositToConfirm(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Confirmation failed' });
    } finally {
      setActionLoading(false);
      setProcessingId(null);
    }
  };

  const handleInitiateReject = (dep: DepositRequest) => {
    setDepositToReject(dep);
  };

  const handleRejectDeposit = async (reason: string) => {
    if (!depositToReject) return;
    const dep = depositToReject;

    setProcessingId(dep.id);
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await safeFetchJson<{success: boolean; error?: string}>(`/api/admin/deposits/${dep.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!res.ok || !res.data?.success) {
        throw new Error(res.error || 'Failed to reject deposit');
      }

      setFeedback({
        type: 'success',
        message: 'Deposit request rejected successfully.'
      });

      // Update local state then refresh from server for consistency
      setDeposits(prev => prev.map(d => d.id === dep.id ? { ...d, status: 'REJECTED' } : d));
      fetchDeposits();
      setDepositToReject(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Rejection failed' });
    } finally {
      setActionLoading(false);
      setProcessingId(null);
    }
  };

  const handleDeleteDeposit = (dep: DepositRequest) => {
    setDepositToDelete(dep);
  };

  const handleConfirmDeleteDeposit = async () => {
    if (!depositToDelete) return;

    setDeleteLoading(true);
    try {
      const res = await safeFetchJson<{success: boolean; error?: string}>(`/api/admin/deposits/${depositToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error(res.error || 'Failed to delete deposit record');

      // Instant local state purge then refresh
      setDeposits(prev => prev.filter(d => d.id !== depositToDelete.id));
      fetchDeposits();
      if (selectedDeposit?.id === depositToDelete.id) {
        setModalOpen(false);
        setSelectedDeposit(null);
      }
      setFeedback({ type: 'success', message: 'Item deleted successfully!' });
      setDepositToDelete(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Delete failed' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredDeposits = (Array.isArray(deposits) ? deposits : []).filter(d => {
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchesSearch = 
      d.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.senderNumber.includes(searchTerm) ||
      d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.method.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-[#10213A] dark:text-white tracking-tight">
            Deposit Requests Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verify sender mobile numbers, transaction IDs, and credit player wallets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDeposits}
            className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#10213A] dark:text-white text-xs font-black flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {feedback && (
        <div className="fixed top-24 right-6 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-center justify-between gap-4 min-w-[320px] backdrop-blur-md ${
            feedback.type === 'success' 
              ? 'bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
              : 'bg-red-50/95 dark:bg-red-950/90 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-3">
              {feedback.type === 'success' ? (
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              )}
              <div>
                <p className="text-[13px] font-black leading-tight">
                  {feedback.type === 'success' ? 'Action Successful' : 'Action Failed'}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">{feedback.message}</p>
              </div>
            </div>
            <button onClick={() => setFeedback(null)} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
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
            placeholder="Search TrxID, Player Name, Mobile..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-hidden focus:border-[#176BFF]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {(['PENDING', 'CONFIRMED', 'REJECTED', 'ALL'] as const).map(status => {
            const count = (Array.isArray(deposits) ? deposits : []).filter(d => status === 'ALL' || d.status === status).length;
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

      {/* Deposits Table */}
      <div className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">Request / Player</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Method</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Amount</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Sender Number</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Transaction ID</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Date</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 text-right sticky right-0 bg-slate-50 dark:bg-slate-900 z-20 border-l border-slate-200 dark:border-slate-800">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No deposits matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((d, idx) => (
                  <tr key={`${d.id}-${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition-colors group">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-black text-[#10213A] dark:text-white">{d.userName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">#{d.id}</p>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        d.method === 'bKash' ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' :
                        d.method === 'Nagad' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                        'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                      }`}>
                        {d.method}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                        ৳{d.amount}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[#10213A] dark:text-slate-200">
                        {d.senderNumber}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                          {d.transactionId}
                        </span>
                        <button
                          onClick={() => handleCopy(d.transactionId, d.id)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                          title="Copy TrxID"
                        >
                          {copiedId === d.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-400 font-mono whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleDateString()} {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        d.status === 'CONFIRMED' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                        d.status === 'REJECTED' ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' :
                        'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse'
                      }`}>
                        {d.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right sticky right-0 z-[15] bg-white dark:bg-[#0B132B] group-hover:bg-slate-50 dark:group-hover:bg-slate-900 border-l border-slate-200/50 dark:border-slate-800/50 shadow-[-4px_0_12px_rgba(0,0,0,0.03)] pointer-events-auto">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap pointer-events-auto">
                        {d.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInitiateConfirm(d);
                              }}
                              disabled={actionLoading}
                              className="relative z-30 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                            >
                              {actionLoading && processingId === d.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              <span>Confirm</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInitiateReject(d);
                              }}
                              disabled={actionLoading}
                              className="relative z-30 px-3 py-2 rounded-xl bg-red-100 dark:bg-red-950/40 hover:bg-red-200 text-red-600 dark:text-red-400 font-bold text-[11px] flex items-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                            >
                              {actionLoading && processingId === d.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDeposit(d);
                              setModalOpen(true);
                            }}
                            className="relative z-30 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer hover:bg-blue-50 hover:text-[#176BFF] transition-all touch-manipulation"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDeposit(d);
                          }}
                          disabled={actionLoading}
                          title="Permanently Delete Deposit Record"
                          className="relative z-30 p-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 transition-all hover:scale-110 active:scale-90 cursor-pointer disabled:opacity-50 touch-manipulation"
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
      {modalOpen && selectedDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base text-[#10213A] dark:text-white">Deposit Details #{selectedDeposit.id}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                <span className="text-slate-400">Player:</span>
                <span className="font-bold text-[#10213A] dark:text-white">{selectedDeposit.userName}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                <span className="text-slate-400">Method & Amount:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">{selectedDeposit.method} • ৳{selectedDeposit.amount}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                <span className="text-slate-400">Sender Mobile:</span>
                <span className="font-mono font-bold text-[#10213A] dark:text-white">{selectedDeposit.senderNumber}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                <span className="text-slate-400">TrxID:</span>
                <span className="font-mono font-black text-blue-500">{selectedDeposit.transactionId}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                <span className="text-slate-400">Status:</span>
                <span className="font-black uppercase">{selectedDeposit.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedDeposit) handleDeleteDeposit(selectedDeposit);
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
        isOpen={Boolean(depositToDelete)}
        title="Delete Deposit Record"
        message="Are you sure you want to permanently delete this deposit record? This will purge the transaction log from the system database."
        itemType="Deposit Record"
        itemName={depositToDelete ? `${depositToDelete.userName} - ৳${depositToDelete.amount} (${depositToDelete.method} TrxID: ${depositToDelete.transactionId})` : undefined}
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteDeposit}
        onClose={() => {
          if (!deleteLoading) setDepositToDelete(null);
        }}
      />

      {/* Confirm Deposit Modal */}
      <ConfirmDepositModal
        isOpen={Boolean(depositToConfirm)}
        deposit={depositToConfirm}
        loading={actionLoading}
        onConfirm={handleConfirmDeposit}
        onClose={() => setDepositToConfirm(null)}
      />

      {/* Reject Deposit Modal */}
      <RejectDepositModal
        isOpen={Boolean(depositToReject)}
        deposit={depositToReject}
        loading={actionLoading}
        onConfirm={handleRejectDeposit}
        onClose={() => setDepositToReject(null)}
      />
    </div>
  );
};

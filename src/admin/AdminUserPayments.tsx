import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Search, 
  User, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Wallet, 
  ArrowRight,
  ShieldAlert,
  Send,
  RefreshCw,
  X,
  CreditCard,
  ShieldCheck,
  Check
} from 'lucide-react';
import { safeFetchJson, getAuthToken } from '../lib/api';
import { User as UserType } from '../types';
import { useAuth } from '../context/AuthContext';

export const AdminUserPayments: React.FC = () => {
  const { refreshBootstrap, refreshUserData } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  const [bonusTitle, setBonusTitle] = useState('Event Reward / Promotional Bonus');
  const [amount, setAmount] = useState<number | ''>(50);
  const [description, setDescription] = useState('Official EGX Community Tournament Bonus');
  
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const PRESET_AMOUNTS = [20, 50, 100, 200, 500, 1000];

  const fetchUsers = async () => {
    try {
      const res = await safeFetchJson<UserType[]>('/api/admin/users');
      if (res.ok && Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectUser = (u: UserType) => {
    setSelectedUser(u);
    setFeedback(null);
  };

  const handlePresetSelect = (preset: number) => {
    setAmount(preset);
    if (feedback?.type === 'error') setFeedback(null);
  };

  const handleOpenConfirm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUser) {
      setFeedback({ type: 'error', message: 'Please select a recipient player from the list first.' });
      return;
    }
    const num = Number(amount);
    if (!amount || isNaN(num) || num <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid positive credit amount.' });
      return;
    }
    if (!bonusTitle.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a title or reason for this credit.' });
      return;
    }

    setFeedback(null);
    setShowConfirmModal(true);
  };

  const executeCredit = async () => {
    if (!selectedUser) return;
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/user-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          target_user_id: selectedUser.id,
          bonusTitle: bonusTitle.trim(),
          amount: numAmount,
          description: description.trim()
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to dispatch balance credit');
      }

      const newBalance = json.user?.balance !== undefined 
        ? Number(json.user.balance) 
        : Number(selectedUser.balance) + numAmount;

      setFeedback({
        type: 'success',
        message: `Successfully credited ৳${numAmount} to ${selectedUser.fullName}'s account! (New Balance: ৳${newBalance})`
      });

      // Update local state
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, balance: newBalance } : u));
      setSelectedUser(prev => prev ? { ...prev, balance: newBalance } : null);
      setShowConfirmModal(false);

      // Refresh global context for real-time synchronization
      refreshBootstrap();
      refreshUserData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error executing payment' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter(u => 
    (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.freeFireUid && u.freeFireUid.includes(searchQuery)) ||
    (u.mobile && u.mobile.includes(searchQuery)) ||
    (u.id && u.id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#10213A] dark:text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-[#176BFF] dark:text-[#00F0FF]" />
            <span>Admin Balance Credit & Bonus</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Directly credit player wallets with real BDT funds, event rewards, and promotional bonuses via an auditable ledger.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchUsers}
          className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#10213A] dark:text-white text-xs font-black flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Users</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xs ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          )}
          <span className="leading-relaxed">{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Player Search & Selector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#0B132B] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#10213A] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#176BFF] dark:text-[#00F0FF]" />
                <span>1. Select Recipient Player</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                {filteredUsers.length} Players
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, UID, phone..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-hidden focus:border-[#176BFF]"
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {filteredUsers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8 font-medium">No players match your query.</p>
              ) : (
                filteredUsers.map(u => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[#176BFF] bg-blue-50/80 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-xs ${
                          isSelected 
                            ? 'bg-[#176BFF] text-white' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="truncate text-xs">
                          <p className="font-black text-[#10213A] dark:text-white truncate">{u.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">UID: {u.freeFireUid || 'N/A'}</p>
                          <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                          ৳{u.balance}
                        </span>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Balance</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Bonus & Credit Dispatch Form */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleOpenConfirm} className="bg-white dark:bg-[#0B132B] p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <h3 className="text-xs font-black text-[#10213A] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#176BFF] dark:text-[#00F0FF]" />
              <span>2. Transaction & Credit Details</span>
            </h3>

            {/* Selected User Header Card */}
            {selectedUser ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#176BFF] text-white font-black flex items-center justify-center text-base shadow-sm">
                    {selectedUser.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-[#10213A] dark:text-white flex items-center gap-1.5">
                      {selectedUser.fullName}
                      {selectedUser.isVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {selectedUser.email} • UID: {selectedUser.freeFireUid || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Current Balance</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">৳{selectedUser.balance}</span>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                Select a user from the list on the left to activate this form.
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Credit / Bonus Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bonusTitle}
                  onChange={(e) => setBonusTitle(e.target.value)}
                  placeholder="e.g. Event Reward, Tournament Bonus, Top-up Credit"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#10213A] dark:text-white focus:outline-hidden focus:border-[#176BFF]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Amount in BDT (৳) <span className="text-red-500">*</span>
                  </label>
                  {selectedUser && amount && Number(amount) > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      Projected Balance: ৳{Number(selectedUser.balance) + Number(amount)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-slate-400">৳</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAmount(val === '' ? '' : Number(val));
                      if (feedback?.type === 'error') setFeedback(null);
                    }}
                    placeholder="50"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-base font-black font-mono text-[#10213A] dark:text-white focus:outline-hidden focus:border-[#176BFF]"
                  />
                </div>
              </div>

              {/* Quick preset amount chips */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                  Select Preset Amount:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_AMOUNTS.map((preset) => {
                    const isActive = Number(amount) === preset;
                    return (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => handlePresetSelect(preset)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black font-mono transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#176BFF] text-white shadow-md shadow-blue-500/25 scale-105'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        ৳{preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Description / Audit Note
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Reason for payment or event notes..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-[#10213A] dark:text-white focus:outline-hidden focus:border-[#176BFF]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                id="confirm-and-credit-btn"
                type="submit"
                disabled={!selectedUser || submitting || !amount || Number(amount) <= 0}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#176BFF] to-blue-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Ledger Transaction...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>CONFIRM & CREDIT ৳{amount || 0} {selectedUser ? `to ${selectedUser.fullName}` : ''}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Interactive Modal Confirmation (Bypasses window.confirm iframe blocks) */}
      {showConfirmModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-6 h-6" />
                <h3 className="text-base font-black text-[#10213A] dark:text-white">
                  Confirm Wallet Credit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              You are about to credit real funds to the player's wallet balance. An immutable ledger entry will be recorded and their user panel will update in real-time.
            </p>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Recipient:</span>
                <span className="font-black text-[#10213A] dark:text-white">{selectedUser.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Free Fire UID:</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">{selectedUser.freeFireUid || 'N/A'}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 my-1 pt-1.5 flex justify-between items-center">
                <span className="text-slate-400">Current Balance:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">৳{selectedUser.balance}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Credit Amount:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">+৳{amount}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-1.5">
                <span className="font-bold text-[#10213A] dark:text-white">New Balance:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                  ৳{Number(selectedUser.balance) + Number(amount)}
                </span>
              </div>
              <div className="pt-1 text-[11px] text-slate-400">
                <span className="font-bold text-slate-500 dark:text-slate-400">Title: </span>
                {bonusTitle}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                CANCEL
              </button>
              <button
                id="modal-confirm-credit-btn"
                type="button"
                onClick={executeCredit}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>CONFIRM & CREDIT ৳{amount}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


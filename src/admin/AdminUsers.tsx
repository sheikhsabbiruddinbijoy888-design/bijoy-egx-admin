import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldAlert, 
  ShieldCheck, 
  Eye, 
  UserX, 
  UserCheck, 
  Mail, 
  Phone, 
  Gamepad2, 
  Wallet, 
  Calendar, 
  Trophy, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  X,
  RefreshCw,
  Receipt,
  BadgeCheck,
  Sparkles,
  Trash2,
  AlertTriangle,
  Send,
  Check
} from 'lucide-react';
import { safeFetchJson, getAuthToken } from '../lib/api';
import { User, Transaction } from '../types';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { useAuth } from '../context/AuthContext';

export const AdminUsers: React.FC = () => {
  const { refreshBootstrap, refreshUserData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Credit Balance Modal State
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [userToCredit, setUserToCredit] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState<number | ''>(50);
  const [creditTitle, setCreditTitle] = useState('Event Reward / Promotional Bonus');
  const [creditNote, setCreditNote] = useState('Official EGX Community Tournament Bonus');
  const [creditSubmitting, setCreditSubmitting] = useState(false);

  const PRESET_AMOUNTS = [20, 50, 100, 200, 500, 1000];

  const handleOpenCreditModal = (user: User) => {
    setUserToCredit(user);
    setCreditAmount(50);
    setCreditTitle('Event Reward / Promotional Bonus');
    setCreditNote('Admin Wallet Credit');
    setCreditModalOpen(true);
  };

  const handleExecuteCredit = async () => {
    if (!userToCredit) return;
    const num = Number(creditAmount);
    if (!creditAmount || isNaN(num) || num <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    setCreditSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/user-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: userToCredit.id,
          target_user_id: userToCredit.id,
          bonusTitle: creditTitle.trim() || 'Admin Credit',
          amount: num,
          description: creditNote.trim() || 'Wallet Balance Adjustment'
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to credit wallet balance');
      }

      const newBalance = json.user?.balance !== undefined 
        ? Number(json.user.balance) 
        : Number(userToCredit.balance) + num;

      setUsers(prev => prev.map(u => u.id === userToCredit.id ? { ...u, balance: newBalance } : u));
      if (selectedUser?.id === userToCredit.id) {
        setSelectedUser(prev => prev ? { ...prev, balance: newBalance } : null);
      }

      setFeedback({
        type: 'success',
        message: `Successfully credited ৳${num} to ${userToCredit.fullName}'s account! (New Balance: ৳${newBalance})`
      });

      setCreditModalOpen(false);
      refreshBootstrap();
      refreshUserData();
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Error processing credit' });
    } finally {
      setCreditSubmitting(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<User[]>('/api/admin/users');
      if (res.ok && Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const isMasterAdmin = (user?: User | null) => {
    if (!user) return false;
    return user.email?.toLowerCase() === 'joyshakib689@gmail.com' || user.role === 'ADMIN';
  };

  // 1. Verify User (sets is_verified = true, verificationStatus = 'VERIFIED', account_status = 'ACTIVE')
  const handleVerifyUser = async (user: User) => {
    setActionLoading(true);
    setFeedback(null);

    // Optimistic UI Update
    setUsers(prev => prev.map(u => u.id === user.id ? { 
      ...u, 
      isVerified: true, 
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      verifiedAt: new Date().toISOString()
    } : u));

    if (selectedUser?.id === user.id) {
      setSelectedUser(prev => prev ? { 
        ...prev, 
        isVerified: true, 
        verificationStatus: 'VERIFIED',
        status: 'ACTIVE',
        verifiedAt: new Date().toISOString()
      } : null);
    }

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/users/${user.id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ isVerified: true })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to verify profile');

      setFeedback({ 
        type: 'success', 
        message: `User ${user.fullName} verified successfully and account set to ACTIVE.` 
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Verification update failed' });
      fetchUsers(); // Revert on failure
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Unverify User (sets is_verified = false, verificationStatus = 'UNVERIFIED')
  const handleUnverifyUser = async (user: User) => {
    if (isMasterAdmin(user)) {
      setFeedback({ type: 'error', message: 'Master Administrator account is protected and cannot be unverified.' });
      return;
    }

    setActionLoading(true);
    setFeedback(null);

    // Optimistic UI Update
    setUsers(prev => prev.map(u => u.id === user.id ? { 
      ...u, 
      isVerified: false, 
      verificationStatus: 'UNVERIFIED',
      verifiedAt: undefined
    } : u));

    if (selectedUser?.id === user.id) {
      setSelectedUser(prev => prev ? { 
        ...prev, 
        isVerified: false, 
        verificationStatus: 'UNVERIFIED',
        verifiedAt: undefined
      } : null);
    }

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/users/${user.id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ isVerified: false })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to unverify user');

      setFeedback({ 
        type: 'success', 
        message: `Profile verification removed for ${user.fullName}.` 
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Unverify operation failed' });
      fetchUsers();
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Suspend User (sets account_status = 'SUSPENDED')
  const handleSuspendUser = async (user: User) => {
    if (isMasterAdmin(user)) {
      setFeedback({ type: 'error', message: 'Master Administrator account is protected and can never be suspended.' });
      return;
    }

    setActionLoading(true);
    setFeedback(null);

    // Optimistic UI Update
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'SUSPENDED' } : u));
    if (selectedUser?.id === user.id) {
      setSelectedUser(prev => prev ? { ...prev, status: 'SUSPENDED' } : null);
    }

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: 'SUSPENDED' })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to suspend user');

      setFeedback({ type: 'success', message: `Account for ${user.fullName} suspended successfully.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Suspend operation failed' });
      fetchUsers();
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Activate User (sets account_status = 'ACTIVE')
  const handleActivateUser = async (user: User) => {
    setActionLoading(true);
    setFeedback(null);

    // Optimistic UI Update
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'ACTIVE' } : u));
    if (selectedUser?.id === user.id) {
      setSelectedUser(prev => prev ? { ...prev, status: 'ACTIVE' } : null);
    }

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: 'ACTIVE' })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to activate user');

      setFeedback({ type: 'success', message: `Account for ${user.fullName} activated successfully.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Activate operation failed' });
      fetchUsers();
    } finally {
      setActionLoading(false);
    }
  };

  const handleInspectUser = async (user: User) => {
    setSelectedUser(user);
    setInspectModalOpen(true);
    setFeedback(null);

    try {
      const res = await safeFetchJson<Transaction[]>('/api/admin/transactions');
      if (res.ok && res.data) {
        setUserTransactions(res.data.filter(t => t.userId === user.id));
      }
    } catch (e) {
      // quiet
    }
  };

  const handleDeleteUser = (user: User) => {
    if (isMasterAdmin(user)) {
      setFeedback({ type: 'error', message: 'Master Administrator account is protected and cannot be deleted.' });
      return;
    }
    setUserToDelete(user);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete user account');

      // Instant local state purge
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      if (selectedUser?.id === userToDelete.id) {
        setInspectModalOpen(false);
        setSelectedUser(null);
      }
      setFeedback({ type: 'success', message: 'Item deleted successfully!' });
      setUserToDelete(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Delete operation failed' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.mobile && user.mobile.includes(searchTerm)) ||
      (user.freeFireUid && user.freeFireUid.includes(searchTerm)) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') matchesStatus = user.status === 'ACTIVE';
    else if (statusFilter === 'SUSPENDED') matchesStatus = user.status === 'SUSPENDED';
    else if (statusFilter === 'VERIFIED') matchesStatus = Boolean(user.isVerified);
    else if (statusFilter === 'UNVERIFIED') matchesStatus = !user.isVerified;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-[#10213A] dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#176BFF]" />
            User Accounts & Profile Verification
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage player accounts, approve manual profile verifications, and inspect Free Fire gaming records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#10213A] dark:text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Directory
          </button>
        </div>
      </div>

      {/* Global Feedback */}
      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
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
            placeholder="Search by Name, Gmail, Phone, UID, @username..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-hidden focus:border-[#176BFF]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Filter:</span>
          {(['ALL', 'VERIFIED', 'UNVERIFIED', 'ACTIVE', 'SUSPENDED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-[#176BFF] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Player / Profile</th>
                <th className="py-3.5 px-4">Verification Status</th>
                <th className="py-3.5 px-4">Free Fire Info</th>
                <th className="py-3.5 px-4">Contact (Gmail / Phone)</th>
                <th className="py-3.5 px-4">Balance</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No matching users found in directory.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr key={`${u.id}-${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 overflow-hidden text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 border border-slate-200 dark:border-slate-800">
                          {(u as any).profileImage || (u as any).avatar_url ? (
                            <img src={(u as any).profileImage || (u as any).avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            u.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-black text-[#10213A] dark:text-white">{u.fullName}</p>
                            {u.isVerified && (
                              <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                            {u.role === 'ADMIN' && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-extrabold text-[9px]">ADMIN</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">@{u.username || 'user'} • #{u.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Verification Status */}
                    <td className="py-3 px-4">
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                          UNVERIFIED
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-[#10213A] dark:text-slate-200 flex items-center gap-1">
                          <Gamepad2 className="w-3.5 h-3.5 text-[#176BFF]" />
                          {u.freeFireIgn || 'No IGN'}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">UID: {u.freeFireUid || 'Not Set'}</p>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-slate-700 dark:text-slate-300 font-medium">{u.email}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{u.mobile || u.mobileNumber || '-'}</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                        ৳{u.balance}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        u.status === 'ACTIVE' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                          : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isMasterAdmin(u) ? (
                          <>
                            {/* Protected Master Admin Badge */}
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#176BFF] dark:text-blue-400 font-black text-xs shadow-xs">
                              <ShieldCheck className="w-4 h-4 text-[#176BFF]" />
                              <span>Protected Admin</span>
                            </div>

                            {/* Inspect Details Button */}
                            <button
                              onClick={() => handleInspectUser(u)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-[#176BFF] font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> Inspect
                            </button>
                          </>
                        ) : (
                          <>
                            {/* 1-Click Verification Button */}
                            {u.isVerified ? (
                              <button
                                onClick={() => handleUnverifyUser(u)}
                                disabled={actionLoading}
                                title="Remove profile verification"
                                className="px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                                <span>Unverify</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleVerifyUser(u)}
                                disabled={actionLoading}
                                title="Verify profile and set ACTIVE"
                                className="px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 shadow-xs"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Verify</span>
                              </button>
                            )}

                            {/* Quick Credit Button */}
                            <button
                              onClick={() => handleOpenCreditModal(u)}
                              title="Credit balance or send bonus"
                              className="px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 shadow-xs"
                            >
                              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Credit</span>
                            </button>

                            {/* Inspect Details Button */}
                            <button
                              onClick={() => handleInspectUser(u)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-[#176BFF] font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> Inspect
                            </button>

                            {/* Suspend / Activate Status Button */}
                            {u.status === 'ACTIVE' ? (
                              <button
                                onClick={() => handleSuspendUser(u)}
                                disabled={actionLoading}
                                title="Suspend user account"
                                className="px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900"
                              >
                                <UserX className="w-3.5 h-3.5" /> Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateUser(u)}
                                disabled={actionLoading}
                                title="Activate user account"
                                className="px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Activate
                              </button>
                            )}

                            {/* Hard Delete User Button */}
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={actionLoading}
                              title="Permanently Delete User Account"
                              className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Inspector Modal */}
      {inspectModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#176BFF] to-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-md">
                  {selectedUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-[#10213A] dark:text-white">
                      {selectedUser.fullName}
                    </h3>
                    {selectedUser.isVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Verified Profile
                      </span>
                    )}
                    {selectedUser.status === 'SUSPENDED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        Suspended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Account ID: {selectedUser.id} • Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Master Admin Notice Banner if inspecting master admin */}
            {isMasterAdmin(selectedUser) && (
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#176BFF] shrink-0" />
                <span>Primary Master Administrator: This account is permanently protected against suspension, un-verification, and deletion.</span>
              </div>
            )}

            {/* Profile Verification & Account Status Action Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Profile Verification Control Card */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                selectedUser.isVerified 
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900' 
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-center gap-3">
                  {selectedUser.isVerified ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-slate-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-black text-[#10213A] dark:text-white uppercase tracking-wider">
                      {selectedUser.isVerified ? 'Profile Verified' : 'Unverified Profile'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isMasterAdmin(selectedUser) ? 'Permanent Master Admin Verified' : (selectedUser.isVerified ? 'Badge active on player profile' : 'Manual verification pending')}
                    </p>
                  </div>
                </div>

                {isMasterAdmin(selectedUser) ? (
                  <div className="w-full py-2 px-3 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-[#176BFF]" />
                    <span>Protected Master Admin</span>
                  </div>
                ) : selectedUser.isVerified ? (
                  <button
                    onClick={() => handleUnverifyUser(selectedUser)}
                    disabled={actionLoading}
                    className="w-full py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4 text-slate-500" />
                    Unverify Profile
                  </button>
                ) : (
                  <button
                    onClick={() => handleVerifyUser(selectedUser)}
                    disabled={actionLoading}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    VERIFY PROFILE NOW
                  </button>
                )}
              </div>

              {/* Account Security & Suspension Control Card */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                selectedUser.status === 'SUSPENDED'
                  ? 'bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-900'
                  : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900'
              }`}>
                <div className="flex items-center gap-3">
                  {selectedUser.status === 'SUSPENDED' ? (
                    <UserX className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0" />
                  ) : (
                    <UserCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-black text-[#10213A] dark:text-white uppercase tracking-wider">
                      Status: {selectedUser.status}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isMasterAdmin(selectedUser) ? 'Protected System Admin Account' : (selectedUser.status === 'SUSPENDED' ? 'Tournaments & deposits restricted' : 'Full system privileges active')}
                    </p>
                  </div>
                </div>

                {isMasterAdmin(selectedUser) ? (
                  <div className="w-full py-2 px-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Permanent Active Admin</span>
                  </div>
                ) : selectedUser.status === 'SUSPENDED' ? (
                  <button
                    onClick={() => handleActivateUser(selectedUser)}
                    disabled={actionLoading}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    Activate Account
                  </button>
                ) : (
                  <button
                    onClick={() => handleSuspendUser(selectedUser)}
                    disabled={actionLoading}
                    className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-red-500/20 transition-all cursor-pointer"
                  >
                    <UserX className="w-4 h-4" />
                    Suspend Account
                  </button>
                )}
              </div>
            </div>

            {/* Financial Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400">Current Balance</span>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">৳{selectedUser.balance}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenCreditModal(selectedUser)}
                  className="mt-2 py-1.5 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Credit / Bonus</span>
                </button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400">Total Deposited</span>
                <p className="text-lg font-black text-[#10213A] dark:text-white font-mono mt-1">৳{selectedUser.totalDeposited}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400">Total Winnings</span>
                <p className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono mt-1">৳{selectedUser.totalWinnings}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400">Total Withdrawn</span>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono mt-1">৳{selectedUser.totalWithdrawn}</p>
              </div>
            </div>

            {/* Profile Info Attributes */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 font-medium">Email:</span>
                  <p className="font-bold text-[#10213A] dark:text-white">{selectedUser.email}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Username:</span>
                  <p className="font-bold text-[#10213A] dark:text-white font-mono">@{selectedUser.username || 'user'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Mobile Number:</span>
                  <p className="font-bold text-[#10213A] dark:text-white">{selectedUser.mobile || selectedUser.mobileNumber || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">WhatsApp:</span>
                  <p className="font-bold text-[#10213A] dark:text-white">{selectedUser.whatsapp || selectedUser.whatsappNumber || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Free Fire UID:</span>
                  <p className="font-bold text-[#176BFF] font-mono">{selectedUser.freeFireUid || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Free Fire IGN:</span>
                  <p className="font-bold text-[#10213A] dark:text-white">{selectedUser.freeFireIgn || 'Not set'}</p>
                </div>
              </div>
            </div>

            {/* Recent User Transactions */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#176BFF]" />
                Recent User Ledger Transactions ({userTransactions.length})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {userTransactions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No transactions recorded for this account yet.</p>
                ) : (
                  userTransactions.slice(0, 8).map(trx => (
                    <div key={trx.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[#10213A] dark:text-white">{trx.reference}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{new Date(trx.timestamp).toLocaleString()}</p>
                      </div>
                      <span className={`font-black font-mono ${
                        trx.type === 'DEPOSIT' || trx.type === 'WINNING' || trx.type === 'REFUND' || trx.type === 'ADMIN_BONUS'
                          ? 'text-emerald-500'
                          : 'text-red-500'
                      }`}>
                        {trx.type === 'DEPOSIT' || trx.type === 'WINNING' || trx.type === 'REFUND' || trx.type === 'ADMIN_BONUS' ? '+' : '-'}৳{trx.amount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              {!isMasterAdmin(selectedUser) ? (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedUser) handleDeleteUser(selectedUser);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#176BFF]" />
                  <span>System Protected Account</span>
                </div>
              )}

              <button
                onClick={() => setInspectModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Balance / Bonus Modal */}
      {creditModalOpen && userToCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#10213A] dark:text-white">Credit Player Wallet</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Add balance or promotional bonus</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreditModalOpen(false)}
                disabled={creditSubmitting}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Player Card */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-[#10213A] dark:text-white">{userToCredit.fullName}</p>
                <p className="text-[11px] text-slate-500 font-mono">@{userToCredit.username || 'user'} • {userToCredit.email}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Current</span>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">৳{userToCredit.balance}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Preset Chips */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Select Quick Amount:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCreditAmount(amt)}
                      className={`py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        creditAmount === amt
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      ৳{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Amount in BDT (৳):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">৳</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Enter amount (e.g. 50)"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-[#10213A] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Title / Reason */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Transaction Title:
                </label>
                <input
                  type="text"
                  value={creditTitle}
                  onChange={(e) => setCreditTitle(e.target.value)}
                  placeholder="e.g. Event Reward / Promotional Bonus"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-[#10213A] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Note / Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Note / Admin Description:
                </label>
                <input
                  type="text"
                  value={creditNote}
                  onChange={(e) => setCreditNote(e.target.value)}
                  placeholder="Optional internal remark"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-[#10213A] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCreditModalOpen(false)}
                disabled={creditSubmitting}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCredit}
                disabled={creditSubmitting || !creditAmount || Number(creditAmount) <= 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {creditSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>CONFIRM & CREDIT ৳{creditAmount || 0}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User SweetAlert Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(userToDelete)}
        title="Delete User Account"
        message="Are you sure you want to permanently purge this user account? All associated transaction histories, match registrations, and ledger logs will be cascade deleted immediately."
        itemType="Player Account"
        itemName={userToDelete ? `${userToDelete.fullName} (${userToDelete.email})` : undefined}
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteUser}
        onClose={() => {
          if (!deleteLoading) setUserToDelete(null);
        }}
      />
    </div>
  );
};

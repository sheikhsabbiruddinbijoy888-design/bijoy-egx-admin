import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Trophy, 
  Medal, 
  DollarSign, 
  RotateCcw, 
  Copy, 
  Check, 
  Download, 
  RefreshCw 
} from 'lucide-react';
import { safeFetchJson } from '../lib/api';
import { Transaction } from '../types';

export const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<Transaction[]>('/api/admin/transactions');
      if (res.ok && Array.isArray(res.data)) setTransactions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return { label: 'Deposit', icon: ArrowDownCircle, color: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400' };
      case 'WITHDRAWAL':
        return { label: 'Withdrawal', icon: ArrowUpCircle, color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400' };
      case 'TOURNAMENT_ENTRY':
        return { label: 'Entry Fee', icon: Trophy, color: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400' };
      case 'WINNING':
        return { label: 'Prize Win', icon: Medal, color: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400' };
      case 'ADMIN_BONUS':
        return { label: 'Admin Bonus', icon: DollarSign, color: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400' };
      case 'REFUND':
        return { label: 'Refund', icon: RotateCcw, color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400' };
      default:
        return { label: type, icon: Receipt, color: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
  };

  const filteredTransactions = (Array.isArray(transactions) ? transactions : []).filter(t => {
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
    const matchesSearch = 
      (t.userName && t.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.userEmail && t.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.reference && t.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-[#10213A] dark:text-white tracking-tight">
            Financial Ledger & Audit Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable, audit-proof record of every financial transfer, fee, win, and bonus.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#10213A] dark:text-white text-xs font-black flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0B132B] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Trx ID, Player, Reference..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-hidden focus:border-[#176BFF]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'DEPOSIT', 'WITHDRAWAL', 'TOURNAMENT_ENTRY', 'WINNING', 'ADMIN_BONUS', 'REFUND'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                typeFilter === type
                  ? 'bg-[#176BFF] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Transaction ID</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4">Description / Reference</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Balance After</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t, idx) => {
                  const badge = getTransactionBadge(t.type);
                  const Icon = badge.icon;
                  const isCredit = t.type === 'DEPOSIT' || t.type === 'WINNING' || t.type === 'REFUND' || t.type === 'ADMIN_BONUS';

                  return (
                    <tr key={`${t.id}-${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-[#10213A] dark:text-slate-300">#{t.id}</span>
                          <button
                            onClick={() => handleCopy(t.id, t.id)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {copiedId === t.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 w-fit ${badge.color}`}>
                          <Icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          <p className="font-black text-[#10213A] dark:text-white">{t.userName || 'Player'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{t.userId}</p>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-xs">{t.reference}</p>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`font-black font-mono text-sm ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                          {isCredit ? '+' : '-'}৳{t.amount}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        ৳{t.balanceAfter !== undefined ? t.balanceAfter : '-'}
                      </td>

                      <td className="py-3 px-4 text-right text-[11px] text-slate-400 font-mono">
                        {new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

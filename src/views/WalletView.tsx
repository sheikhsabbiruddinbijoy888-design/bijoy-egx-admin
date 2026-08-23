import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Transaction, DepositRequest, WithdrawalRequest } from '../types';
import { safeFetchJson } from '../lib/api';
import { 
  Wallet, 
  Copy, 
  Check, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  AlertCircle, 
  CheckCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const WalletView: React.FC = () => {
  const { user, token, t, refreshUserData, bootstrap } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'ADD_MONEY' | 'WITHDRAW' | 'HISTORY'>('ADD_MONEY');
  const [selectedMethod, setSelectedMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');

  // Form states for Add Money
  const [depositAmount, setDepositAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');

  // Individual field errors
  const [amountError, setAmountError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [trxError, setTrxError] = useState<string | null>(null);

  // Form states for Withdraw
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Transactions list
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const paymentSettings = bootstrap?.paymentSettings || {
    bkashNumber: '01778999965',
    nagadNumber: '01778999965',
    rocketNumber: '01778999965',
    minDeposit: 20,
    minWithdraw: 50
  };

  const getMethodNumber = () => {
    switch (selectedMethod) {
      case 'bKash': return paymentSettings.bkashNumber;
      case 'Nagad': return paymentSettings.nagadNumber;
      case 'Rocket': return paymentSettings.rocketNumber;
      default: return paymentSettings.bkashNumber;
    }
  };

  const fetchWalletSummary = async () => {
    if (!token) return;
    const res = await safeFetchJson<any>('/api/wallet/summary', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok && res.data) {
      setTransactions(res.data.transactions || []);
    }
  };

  useEffect(() => {
    fetchWalletSummary();
  }, [token, user?.balance]);

  useEffect(() => {
    if (activeTab === 'HISTORY') {
      fetchWalletSummary();
    }
  }, [activeTab]);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(getMethodNumber());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isSuspended = user?.status === 'SUSPENDED' || (user as any)?.account_status === 'SUSPENDED';

  const validatePhone = (phone: string) => {
    const trimmed = phone.trim();
    if (!trimmed) return "Please enter your payment number.";
    if (!/^01[3-9]\d{8}$/.test(trimmed)) {
      return "Please enter a valid 11-digit payment number (e.g. 01XXXXXXXXX).";
    }
    return null;
  };

  const validateAmount = (amount: string) => {
    const num = Number(amount);
    if (!amount) return "Please enter a deposit amount.";
    if (isNaN(num) || num < paymentSettings.minDeposit) {
      return `Minimum deposit amount is ৳${paymentSettings.minDeposit}. Please enter ৳${paymentSettings.minDeposit} or more.`;
    }
    return null;
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear global messages
    setErrorMsg(null);
    setSuccessMsg(null);

    // Final validation
    const aErr = validateAmount(depositAmount);
    const pErr = validatePhone(senderNumber);
    const tErr = !transactionId.trim() ? "Please enter Transaction ID (TrxID)." : null;

    setAmountError(aErr);
    setPhoneError(pErr);
    setTrxError(tErr);

    if (aErr || pErr || tErr) {
      return;
    }

    if (isSuspended) {
      setErrorMsg('Your account is currently suspended. You cannot make deposits.');
      return;
    }

    setLoading(true);
    try {
      const res = await safeFetchJson<any>('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          method: selectedMethod,
          amount: Number(depositAmount),
          senderNumber: senderNumber.trim(),
          transactionId: transactionId.trim()
        })
      });

      if (!res.ok || !res.data) {
        setErrorMsg(res.error || 'Failed to submit deposit request');
      } else {
        setSuccessMsg(res.data.message || 'Deposit request submitted successfully!');
        setDepositAmount('');
        setTransactionId('');
        setSenderNumber('');
        setAmountError(null);
        setPhoneError(null);
        setTrxError(null);
        confetti({ particleCount: 50, spread: 50 });
        await fetchWalletSummary();
        await refreshUserData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isSuspended) {
      setErrorMsg('Your account is currently suspended. You cannot request withdrawals.');
      return;
    }

    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum < paymentSettings.minWithdraw) {
      setErrorMsg(`${t.minimumWithdraw}: ৳${paymentSettings.minWithdraw}`);
      return;
    }

    if (!accountNumber.trim()) {
      setErrorMsg('Please enter receiving account number.');
      return;
    }

    // Strict 11-Digit Bangladeshi Phone Validation
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(accountNumber.trim())) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)');
      return;
    }

    if ((user?.balance || 0) < amountNum) {
      setErrorMsg(t.insufficientBalance);
      return;
    }

    setLoading(true);
    try {
      const res = await safeFetchJson<any>('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          method: selectedMethod,
          accountNumber: accountNumber.trim(),
          amount: amountNum
        })
      });

      if (!res.ok || !res.data) {
        setErrorMsg(res.error || 'Failed to submit withdrawal request');
      } else {
        setSuccessMsg(res.data.message || 'Withdrawal request submitted!');
        setWithdrawAmount('');
        setAccountNumber('');
        await fetchWalletSummary();
        await refreshUserData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg sm:max-w-2xl md:max-w-4xl mx-auto px-4 py-4 space-y-5 pb-24">
      {/* Balance Summary Gradient Card */}
      <div className="w-full rounded-3xl bg-gradient-to-br from-[#176BFF] via-[#2687FF] to-[#0B3FA8] p-5 sm:p-6 text-white shadow-xl shadow-blue-500/20 border border-blue-400/30">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-100 block">
          {t.currentBalance}
        </span>
        <div className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
          ৳{user ? user.balance : 0}
        </div>

        {/* 2x2 Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-blue-100 block">
              {t.totalDeposited}
            </span>
            <span className="text-sm sm:text-base font-black mt-0.5 block">
              ৳{user ? user.totalDeposited : 0}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-blue-100 block">
              {t.totalWinnings}
            </span>
            <span className="text-sm sm:text-base font-black mt-0.5 block">
              ৳{user ? user.totalWinnings : 0}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-blue-100 block">
              {t.totalEntryFees}
            </span>
            <span className="text-sm sm:text-base font-black mt-0.5 block">
              ৳{user ? user.totalEntryFees : 0}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-blue-100 block">
              {t.totalWithdrawn}
            </span>
            <span className="text-sm sm:text-base font-black mt-0.5 block">
              ৳{user ? user.totalWithdrawn : 0}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => { setActiveTab('ADD_MONEY'); setErrorMsg(null); setSuccessMsg(null); }}
          className={`py-3 rounded-xl font-black text-xs tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === 'ADD_MONEY'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md shadow-slate-200/50 dark:shadow-none'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          {t.addMoney}
        </button>
        <button
          onClick={() => { setActiveTab('WITHDRAW'); setErrorMsg(null); setSuccessMsg(null); }}
          className={`py-3 rounded-xl font-black text-xs tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === 'WITHDRAW'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md shadow-slate-200/50 dark:shadow-none'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          {t.withdraw}
        </button>
        <button
          onClick={() => { setActiveTab('HISTORY'); setErrorMsg(null); setSuccessMsg(null); }}
          className={`py-3 rounded-xl font-black text-xs tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === 'HISTORY'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md shadow-slate-200/50 dark:shadow-none'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          {t.transactionHistory}
        </button>
      </div>

      {/* Notifications / Alerts */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: ADD MONEY */}
      {activeTab === 'ADD_MONEY' && (
        <div className="space-y-4 bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Method Selector */}
          <div className="grid grid-cols-3 gap-2.5">
            {(['bKash', 'Nagad', 'Rocket'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setSelectedMethod(method)}
                className={`py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border cursor-pointer ${
                  selectedMethod === method
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {/* Send Money Number Card with Copy */}
          <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                {t.sendMoneyTo} ({selectedMethod} Personal/Agent)
              </span>
              <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block tracking-tight">
                {getMethodNumber()}
              </span>
            </div>
            <button
              onClick={handleCopyNumber}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-blue-600/25 cursor-pointer"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? t.copied : t.copy}</span>
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
            {t.minimumDeposit}: <span className="text-blue-600 dark:text-blue-400 font-black">৳{paymentSettings.minDeposit}</span>
          </p>

          {/* Form */}
          <form onSubmit={handleDepositSubmit} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 px-1">
                {t.amount} (৳)
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => {
                  setDepositAmount(e.target.value);
                  setAmountError(validateAmount(e.target.value));
                }}
                placeholder="e.g. 50"
                min={paymentSettings.minDeposit}
                required
                className={`w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border ${amountError ? 'border-red-500 shadow-sm shadow-red-500/20' : 'border-slate-200 dark:border-slate-700'} text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:bg-white transition-all`}
              />
              {amountError && (
                <p className="mt-1.5 text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 px-1">
                  <AlertCircle className="w-3 h-3" />
                  {amountError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 px-1">
                {t.transactionId} (TrxID)
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => {
                  setTransactionId(e.target.value);
                  if (e.target.value.trim()) setTrxError(null);
                }}
                placeholder="e.g. 9J28SKL3"
                required
                className={`w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border ${trxError ? 'border-red-500 shadow-sm shadow-red-500/20' : 'border-slate-200 dark:border-slate-700'} text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:bg-white transition-all uppercase`}
              />
              {trxError && (
                <p className="mt-1.5 text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 px-1">
                  <AlertCircle className="w-3 h-3" />
                  {trxError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 px-1">
                {t.senderNumber}
              </label>
              <input
                type="text"
                value={senderNumber}
                maxLength={11}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setSenderNumber(val);
                  setPhoneError(validatePhone(val));
                }}
                placeholder="01XXXXXXXXX"
                required
                className={`w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border ${phoneError ? 'border-red-500 shadow-sm shadow-red-500/20' : 'border-slate-200 dark:border-slate-700'} text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:bg-white transition-all`}
              />
              {phoneError && (
                <p className="mt-1.5 text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 px-1">
                  <AlertCircle className="w-3 h-3" />
                  {phoneError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-600/35 hover:shadow-xl hover:shadow-blue-600/50 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 border border-blue-400/30"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Processing...</span>
                </>
              ) : (
                <span>{t.submit}</span>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            {t.depositNotice}
          </p>
        </div>
      )}

      {/* TAB 2: WITHDRAW */}
      {activeTab === 'WITHDRAW' && (
        <div className="space-y-4 bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Method Selector */}
          <div className="grid grid-cols-3 gap-2.5">
            {(['bKash', 'Nagad', 'Rocket'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setSelectedMethod(method)}
                className={`py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border cursor-pointer ${
                  selectedMethod === method
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
            {t.minimumWithdraw}: <span className="text-blue-600 dark:text-blue-400 font-black">৳{paymentSettings.minWithdraw}</span>
          </p>

          <form onSubmit={handleWithdrawSubmit} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 px-1">
                {t.amount} (৳)
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="e.g. 100"
                min={paymentSettings.minWithdraw}
                max={user?.balance || 0}
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 px-1">
                {t.accountNumber} ({selectedMethod})
              </label>
              <input
                type="text"
                value={accountNumber}
                maxLength={11}
                minLength={11}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="01XXXXXXXXX"
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || (user?.balance || 0) < paymentSettings.minWithdraw}
              className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-600/35 hover:shadow-xl hover:shadow-blue-600/50 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 border border-blue-400/30"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Processing...</span>
                </>
              ) : (
                <span>{t.submit}</span>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            {t.withdrawNotice}
          </p>
        </div>
      )}

      {/* TAB 3: TRANSACTION HISTORY */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-[#DCE8F7] dark:border-slate-800">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No transactions yet
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Your deposit, match win, and entry ledger records will appear here.
              </p>
            </div>
          ) : (
            transactions.map((trx, idx) => {
              const isCredit = trx.type === 'DEPOSIT' || trx.type === 'WINNING' || trx.type === 'REFUND' || trx.type === 'ADMIN_BONUS';

              return (
                <div
                  key={`${trx.id}-${idx}`}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#DCE8F7] dark:border-slate-800 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isCredit 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' 
                        : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                      {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#10213A] dark:text-white">
                          {trx.type.replace('_', ' ')}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          trx.status === 'CONFIRMED' || trx.status === 'COMPLETED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : trx.status === 'PENDING'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                        }`}>
                          {trx.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#60708A] dark:text-slate-400 mt-0.5 line-clamp-1">
                        {trx.reference}
                      </p>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        {new Date(trx.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-sm sm:text-base font-black ${
                      isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {isCredit ? '+' : '-'}৳{trx.amount}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Bal: ৳{trx.balanceAfter}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

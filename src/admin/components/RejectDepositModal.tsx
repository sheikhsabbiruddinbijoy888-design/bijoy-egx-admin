import React, { useState } from 'react';
import { XCircle, X, RefreshCw, AlertCircle } from 'lucide-react';
import { DepositRequest } from '../../types';

interface RejectDepositModalProps {
  isOpen: boolean;
  deposit: DepositRequest | null;
  loading: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export const RejectDepositModal: React.FC<RejectDepositModalProps> = ({
  isOpen,
  deposit,
  loading,
  onConfirm,
  onClose
}) => {
  const [reason, setReason] = useState('Invalid Transaction ID or payment not received');

  if (!isOpen || !deposit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0B132B] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 max-w-sm w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center border-4 border-red-50 dark:border-red-900/30 shadow-inner">
            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-black text-[#10213A] dark:text-white leading-tight">
              Reject Deposit Request?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This will decline the ৳{deposit.amount} request for {deposit.userName}. No money will be credited.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider ml-1">
                Rejection Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason..."
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-hidden focus:border-red-500 min-h-[100px] resize-none"
                required
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                <span>Confirm Rejection</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-750 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

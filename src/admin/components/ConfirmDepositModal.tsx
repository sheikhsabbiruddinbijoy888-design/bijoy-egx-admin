import React from 'react';
import { CheckCircle2, X, AlertCircle } from 'lucide-react';
import { DepositRequest } from '../../types';

interface ConfirmDepositModalProps {
  isOpen: boolean;
  deposit: DepositRequest | null;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDepositModal: React.FC<ConfirmDepositModalProps> = ({
  isOpen,
  deposit,
  loading,
  onConfirm,
  onClose
}) => {
  if (!isOpen || !deposit) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0B132B] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 max-w-sm w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center border-4 border-emerald-50 dark:border-emerald-900/30 shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-[#10213A] dark:text-white leading-tight">
              Confirm Deposit?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2">
              You are about to verify a deposit of <span className="font-bold text-emerald-600">৳{deposit.amount}</span> from <span className="font-bold text-slate-700 dark:text-slate-200">{deposit.userName}</span>.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-left space-y-2">
            <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <span>Method:</span>
              <span className="text-slate-600 dark:text-slate-300">{deposit.method}</span>
            </div>
            <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <span>TrxID:</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">{deposit.transactionId}</span>
            </div>
            <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <span>Sender:</span>
              <span className="text-slate-600 dark:text-slate-300 font-mono">{deposit.senderNumber}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              disabled={loading}
              onClick={onConfirm}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              <span>Verify & Credit Wallet</span>
            </button>
            <button
              disabled={loading}
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-750 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Re-add missing import for RefreshCw if needed but typically handled by parent or local
import { RefreshCw } from 'lucide-react';

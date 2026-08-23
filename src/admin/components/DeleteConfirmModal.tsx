import React from 'react';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  itemType?: string;
  loading?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title = 'Delete Category Image?',
  message = 'Are you sure you want to delete this category image? If currently published, it will be removed from the User Panel and revert to default artwork.',
  itemName,
  itemType,
  loading = false,
  confirmText = 'DELETE',
  cancelText = 'CANCEL',
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-[#0B132B] rounded-3xl border border-red-200 dark:border-red-900/50 max-w-md w-full p-6 shadow-2xl shadow-red-950/20 transform transition-all duration-200 animate-in zoom-in-95"
      >
        {/* Header / Icon */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm shrink-0">
            <Trash2 className="w-6 h-6 animate-pulse" />
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-2">
          <h3 className="text-lg font-black text-[#10213A] dark:text-white tracking-tight flex items-center gap-2">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {message}
          </p>

          {itemName && (
            <div className="mt-3 p-3 rounded-2xl bg-red-50/50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 text-left">
              {itemType && (
                <span className="text-[10px] font-black uppercase tracking-wider text-red-500 block mb-0.5">
                  Target {itemType}:
                </span>
              )}
              <span className="text-xs font-black text-[#10213A] dark:text-red-200 break-all font-mono">
                {itemName}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black transition-all cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            id="confirm-delete-button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

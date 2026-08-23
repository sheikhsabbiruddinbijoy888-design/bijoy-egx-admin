import React from 'react';
import { CheckCircle2, AlertTriangle, Loader2, X, Globe, EyeOff, Radio } from 'lucide-react';
import { CategoryInfo } from '../../types';

interface CategoryPublishModalProps {
  isOpen: boolean;
  category: CategoryInfo | null;
  mode: 'publish' | 'unpublish';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const CategoryPublishModal: React.FC<CategoryPublishModalProps> = ({
  isOpen,
  category,
  mode,
  loading = false,
  onConfirm,
  onClose
}) => {
  if (!isOpen || !category) return null;

  const isPublish = mode === 'publish';
  const stagedImg = category.draftImage || category.uploadedImage || category.coverImage;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs shrink-0 ${
            isPublish 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' 
              : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
          }`}>
            {isPublish ? <Globe className="w-6 h-6 animate-pulse" /> : <EyeOff className="w-6 h-6" />}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="text-lg font-black text-[#10213A] dark:text-white tracking-tight">
            {isPublish ? 'Are you sure you want to publish this category image?' : 'Are you sure you want to unpublish this category image?'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {isPublish ? (
              <>
                Publishing will make this category image active and visible on the <strong>User Panel</strong> for all players in real-time.
              </>
            ) : (
              <>
                Unpublishing will hide this image from the <strong>User Panel</strong> and revert to default artwork.
              </>
            )}
          </p>

          {/* Category Target Card */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            {stagedImg && (
              <img
                src={stagedImg}
                alt={category.title}
                className="w-14 h-10 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0"
              />
            )}
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Category:
              </span>
              <p className="text-sm font-black text-[#10213A] dark:text-white truncate">
                {category.title || category.name}
              </p>
              <span className="text-[10px] font-mono text-slate-400">
                Status: {category.published ? 'Published' : (category.draftImage ? 'Uploaded (Draft)' : 'Unpublished')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer ${
              isPublish
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/25'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isPublish ? 'Publishing...' : 'Unpublishing...'}</span>
              </>
            ) : (
              <>
                {isPublish ? <CheckCircle2 className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{isPublish ? 'PUBLISH' : 'UNPUBLISH'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

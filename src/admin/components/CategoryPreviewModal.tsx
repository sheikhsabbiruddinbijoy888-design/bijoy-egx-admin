import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Sun, 
  Moon, 
  Sparkles, 
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CategoryInfo } from '../../types';

interface CategoryPreviewModalProps {
  isOpen: boolean;
  category: CategoryInfo | null;
  onClose: () => void;
  onPublishClick?: () => void;
}

type ViewportMode = 'mobile-compact' | 'mobile-standard' | 'mobile-large' | 'tablet' | 'desktop';

export const CategoryPreviewModal: React.FC<CategoryPreviewModalProps> = ({
  isOpen,
  category,
  onClose,
  onPublishClick
}) => {
  const [viewport, setViewport] = useState<ViewportMode>('mobile-standard');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const [imageSource, setImageSource] = useState<'draft' | 'published'>('draft');

  if (!isOpen || !category) return null;

  const draftUrl = category.draftImage || category.uploadedImage;
  const publishedUrl = category.publishedImage || category.coverImage;
  
  // Decide which image to show based on user selection or availability
  const activeImage = imageSource === 'draft' && draftUrl 
    ? draftUrl 
    : (publishedUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80');

  const viewportWidths: Record<ViewportMode, { width: string; label: string; icon: any }> = {
    'mobile-compact': { width: 'max-w-[360px]', label: '360px Compact', icon: Smartphone },
    'mobile-standard': { width: 'max-w-[390px]', label: '390px iPhone', icon: Smartphone },
    'mobile-large': { width: 'max-w-[412px]', label: '412px Galaxy', icon: Smartphone },
    'tablet': { width: 'max-w-[600px]', label: 'Tablet View', icon: Tablet },
    'desktop': { width: 'max-w-[760px]', label: 'Desktop Grid', icon: Monitor }
  };

  const isBRMatch = category.title === 'BR Match' || category.name === 'BR Match';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full p-6 shadow-2xl space-y-6 my-auto max-h-[95vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#176BFF] dark:text-[#00F0FF]">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-[#10213A] dark:text-white tracking-tight flex items-center gap-2">
                User Panel Preview: {category.title || category.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exact replica of how tournament players see this category card.
              </p>
            </div>
          </div>

          {/* Controls: Viewport & Theme Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Image Version Selector */}
            {draftUrl && draftUrl !== publishedUrl && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setImageSource('draft')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    imageSource === 'draft'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
                  }`}
                >
                  Staged Draft
                </button>
                <button
                  type="button"
                  onClick={() => setImageSource('published')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    imageSource === 'published'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-500'
                  }`}
                >
                  Current Live
                </button>
              </div>
            )}

            {/* Dark / Light Theme Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setPreviewTheme('light')}
                className={`p-1.5 rounded-lg transition-all ${
                  previewTheme === 'light' ? 'bg-white text-amber-600 shadow-xs font-bold' : 'text-slate-400'
                }`}
                title="Preview Light Mode"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewTheme('dark')}
                className={`p-1.5 rounded-lg transition-all ${
                  previewTheme === 'dark' ? 'bg-slate-900 text-[#00F0FF] shadow-xs font-bold' : 'text-slate-400'
                }`}
                title="Preview Dark Mode (with Neon Glow)"
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Width Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-2">
            Responsive Simulation:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {(Object.keys(viewportWidths) as ViewportMode[]).map((vKey) => {
              const item = viewportWidths[vKey];
              const Icon = item.icon;
              return (
                <button
                  key={vKey}
                  type="button"
                  onClick={() => setViewport(vKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewport === vKey
                      ? 'bg-[#176BFF] text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Simulated Container */}
        <div className="flex-1 overflow-y-auto min-h-[300px] flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-950/80 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className={`w-full ${viewportWidths[viewport].width} transition-all duration-300`}>
            {/* Themed Wrapper simulating User Panel environment */}
            <div className={`p-4 rounded-3xl transition-colors ${previewTheme === 'dark' ? 'dark bg-[#080E1E] text-white' : 'bg-[#F4F8FC] text-slate-900'}`}>
              <div className="text-[11px] font-black text-slate-400 mb-2 uppercase tracking-wider flex items-center justify-between">
                <span>Category Card Simulation</span>
                <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {viewportWidths[viewport].width}
                </span>
              </div>

              {/* Exact Card Implementation replicating CategoryGrid.tsx */}
              {!isBRMatch ? (
                /* 2-per-row standard category card */
                <div className="grid grid-cols-2 gap-3">
                  <div className="group relative cursor-pointer rounded-2xl p-[2px] overflow-hidden transition-all active:scale-[0.98] select-none dark:shadow-[0_0_20px_rgba(0,240,255,0.32)]">
                    {/* Traveling Electric Neon Blue Border Glow (Dark Mode Only) */}
                    <div 
                      aria-hidden="true"
                      className="hidden dark:block absolute -inset-[150%] bg-[conic-gradient(from_0deg,transparent_0_70%,rgba(0,240,255,0.25)_80%,#00F0FF_94%,#FFFFFF_98%,#00F0FF_100%)] animate-neon-border pointer-events-none z-0 will-change-transform" 
                    />

                    {/* Inner Card */}
                    <div className="relative z-10 w-full h-full rounded-[calc(1rem-2px)] overflow-hidden bg-white dark:bg-[#111827] border border-[#DCE8F7] dark:border-transparent shadow-sm hover:shadow-md transition-all">
                      {/* Image Header */}
                      <div className="relative h-28 sm:h-36 overflow-hidden bg-slate-950">
                        <img
                          src={activeImage}
                          alt={category.title || category.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h4 className="text-sm font-black text-[#10213A] dark:text-white tracking-tight uppercase group-hover:text-[#176BFF] dark:group-hover:text-[#00F0FF] transition-colors truncate">
                          {category.title || category.name}
                        </h4>
                        <p className="text-[11px] font-bold text-[#176BFF] dark:text-[#00F0FF] mt-0.5">
                          {category.count || 3} Tournaments
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ghost adjacent card for realistic layout view */}
                  <div className="opacity-40 pointer-events-none rounded-2xl p-[2px] bg-white dark:bg-[#111827] border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Adjacent Category</span>
                  </div>
                </div>
              ) : (
                /* Full-width BR Match card */
                <div className="group relative cursor-pointer rounded-2xl p-[2px] overflow-hidden transition-all active:scale-[0.98] select-none dark:shadow-[0_0_25px_rgba(0,240,255,0.35)]">
                  {/* Traveling Electric Neon Blue Border Glow (Dark Mode Only) */}
                  <div 
                    aria-hidden="true"
                    className="hidden dark:block absolute -inset-[150%] bg-[conic-gradient(from_0deg,transparent_0_70%,rgba(0,240,255,0.25)_80%,#00F0FF_94%,#FFFFFF_98%,#00F0FF_100%)] animate-neon-border pointer-events-none z-0 will-change-transform" 
                  />

                  {/* Inner Card */}
                  <div className="relative z-10 w-full h-full rounded-[calc(1rem-2px)] overflow-hidden bg-white dark:bg-[#111827] border border-[#DCE8F7] dark:border-transparent shadow-sm hover:shadow-md transition-all">
                    <div className="relative h-32 sm:h-44 overflow-hidden bg-slate-950">
                      <img
                        src={activeImage}
                        alt={category.title || category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>

                    <div className="p-3.5 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-[#10213A] dark:text-white tracking-tight uppercase group-hover:text-[#176BFF] dark:group-hover:text-[#00F0FF] transition-colors">
                          {category.title || category.name}
                        </h4>
                        <p className="text-[11px] font-bold text-[#176BFF] dark:text-[#00F0FF] mt-0.5">
                          {category.count || 3} Tournaments
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#EAF4FF] dark:bg-slate-800 text-[#176BFF] dark:text-[#00F0FF] flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info & quick publish action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="font-bold">Image Status:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
              category.published
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
            }`}>
              {category.published ? 'LIVE ON USER PANEL' : 'DRAFT / UNPUBLISHED'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onPublishClick && !category.published && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPublishClick();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Publish This Image Now
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

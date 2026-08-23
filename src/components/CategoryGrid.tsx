import React from 'react';
import { CategoryInfo, TournamentCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, Gamepad2 } from 'lucide-react';

interface CategoryGridProps {
  categories: CategoryInfo[];
  onSelectCategory: (category: TournamentCategory) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, onSelectCategory }) => {
  const { t } = useAuth();

  const sortedCategories = [...(Array.isArray(categories) ? categories : [])]
    .filter(c => c && (c.isActive !== false && c.active !== false) && (c.published !== false && c.isPublished !== false))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (sortedCategories.length === 0) {
    return null;
  }

  // If we have 5 categories with BR Match or generic count:
  // We can render standard 2-col cards, with full width for featured / last odd cards if count is odd
  const isOdd = sortedCategories.length % 2 !== 0;
  const regularCategories = isOdd ? sortedCategories.slice(0, sortedCategories.length - 1) : sortedCategories;
  const featuredCategory = isOdd ? sortedCategories[sortedCategories.length - 1] : null;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-[#10213A] dark:text-white tracking-tight">
          {t.categories}
        </h3>
      </div>

      {/* Grid of 2-per-row categories */}
      {regularCategories.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {regularCategories.map((cat, idx) => {
            const cardId = `category-card-${(cat.title || cat.name || 'cat').toLowerCase().replace(/\s+/g, '-')}`;
            const cover = cat.publishedImage || cat.coverImage || cat.icon || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={`${cat.id || 'cat'}-${idx}`}
                id={cardId}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectCategory(cat.title || cat.name);
                  }
                }}
                onClick={() => onSelectCategory(cat.title || cat.name)}
                className="group relative cursor-pointer rounded-2xl p-[2px] overflow-hidden transition-all active:scale-[0.98] select-none dark:shadow-[0_0_20px_rgba(0,240,255,0.32)]"
              >
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
                      src={cover}
                      alt={cat.title || cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h4 className="text-sm font-black text-[#10213A] dark:text-white tracking-tight uppercase group-hover:text-[#176BFF] dark:group-hover:text-[#00F0FF] transition-colors truncate">
                      {cat.title || cat.name}
                    </h4>
                    <p className="text-[11px] font-bold text-[#176BFF] dark:text-[#00F0FF] mt-0.5">
                      {cat.count || 0} {t.tournaments}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Featured / Full-width Category Card (for odd total counts or BR Match) */}
      {featuredCategory && (
        <div
          id={`category-card-${(featuredCategory.title || featuredCategory.name || 'cat').toLowerCase().replace(/\s+/g, '-')}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectCategory(featuredCategory.title || featuredCategory.name);
            }
          }}
          onClick={() => onSelectCategory(featuredCategory.title || featuredCategory.name)}
          className="group relative cursor-pointer rounded-2xl p-[2px] overflow-hidden transition-all active:scale-[0.98] select-none dark:shadow-[0_0_25px_rgba(0,240,255,0.35)]"
        >
          {/* Traveling Electric Neon Blue Border Glow (Dark Mode Only) */}
          <div 
            aria-hidden="true"
            className="hidden dark:block absolute -inset-[150%] bg-[conic-gradient(from_0deg,transparent_0_70%,rgba(0,240,255,0.25)_80%,#00F0FF_94%,#FFFFFF_98%,#00F0FF_100%)] animate-neon-border pointer-events-none z-0 will-change-transform" 
          />

          {/* Inner Card */}
          <div className="relative z-10 w-full h-full rounded-[calc(1rem-2px)] overflow-hidden bg-white dark:bg-[#111827] border border-[#DCE8F7] dark:border-transparent shadow-sm hover:shadow-md transition-all">
            <div className="relative h-32 sm:h-44 overflow-hidden bg-slate-950">
              <img
                src={featuredCategory.publishedImage || featuredCategory.coverImage || featuredCategory.icon || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'}
                alt={featuredCategory.title || featuredCategory.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <div>
                <h4 className="text-sm sm:text-base font-black text-[#10213A] dark:text-white tracking-tight uppercase group-hover:text-[#176BFF] dark:group-hover:text-[#00F0FF] transition-colors">
                  {featuredCategory.title || featuredCategory.name}
                </h4>
                <p className="text-[11px] font-bold text-[#176BFF] dark:text-[#00F0FF] mt-0.5">
                  {featuredCategory.count || 0} {t.tournaments}
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
  );
};

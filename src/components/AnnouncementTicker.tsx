import React from 'react';
import { Announcement } from '../types';
import { Megaphone, AlertCircle } from 'lucide-react';

interface AnnouncementTickerProps {
  announcements: Announcement[];
}

export const AnnouncementTicker: React.FC<AnnouncementTickerProps> = ({ announcements }) => {
  const activeAnnouncements = (Array.isArray(announcements) ? announcements : []).filter(a => a && a.isPublished);

  if (activeAnnouncements.length === 0) return null;

  const current = activeAnnouncements[0];

  return (
    <div className="relative w-full rounded-2xl p-[2px] overflow-hidden transition-all duration-300 dark:shadow-[0_0_22px_rgba(0,240,255,0.35)]">
      {/* Traveling Electric Neon Blue Border Glow (Dark Mode Only) */}
      <div 
        aria-hidden="true"
        className="hidden dark:block absolute -inset-[150%] bg-[conic-gradient(from_0deg,transparent_0_70%,rgba(0,240,255,0.25)_80%,#00F0FF_94%,#FFFFFF_98%,#00F0FF_100%)] animate-neon-border pointer-events-none z-0 will-change-transform" 
      />

      <div className="relative z-10 w-full rounded-[calc(1rem-2px)] bg-[#EAF4FF] dark:bg-[#111827] border border-[#DCE8F7] dark:border-transparent p-4 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#176BFF]/10 text-[#176BFF] dark:bg-[#00F0FF]/15 dark:text-[#00F0FF] flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#176BFF] dark:text-[#00F0FF]">
                ANNOUNCEMENT
              </span>
            </div>
            <h4 className="text-sm font-black text-[#10213A] dark:text-white mt-0.5">
              {current.title}
            </h4>
            <p className="text-xs text-[#60708A] dark:text-slate-300 mt-1 leading-relaxed">
              {current.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Phone, Send, Play, X, ExternalLink, Film, Check, Copy, Sparkles } from 'lucide-react';
import { parseSupportVideoUrl } from '../lib/videoUtils';

export const SupportSection: React.FC = () => {
  const { t, bootstrap } = useAuth();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  const rawSupport = bootstrap?.supportSettings;
  const support = useMemo(() => {
    return {
      whatsappNumber: rawSupport?.whatsappNumber || '880177899965',
      whatsappLink: rawSupport?.whatsappLink || `https://wa.me/${rawSupport?.whatsappNumber || '880177899965'}`,
      telegramUsername: rawSupport?.telegramUsername || 'egxffofficial',
      telegramLink: rawSupport?.telegramLink || `https://t.me/${rawSupport?.telegramUsername || 'egxffofficial'}`,
      supportVideoUrl: rawSupport?.supportVideoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      supportVideoType: rawSupport?.supportVideoType || 'embed',
      isEnabled: rawSupport?.isEnabled !== false
    };
  }, [rawSupport]);

  // Parse media URL into normalized embed format and direct external link
  const mediaInfo = useMemo(() => {
    return parseSupportVideoUrl(support.supportVideoUrl);
  }, [support.supportVideoUrl]);

  const handleCopyLink = () => {
    if (!mediaInfo.directUrl) return;
    navigator.clipboard.writeText(mediaInfo.directUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!support.isEnabled) return null;

  return (
    <div className="w-full space-y-3 pt-2">
      <h3 className="text-lg font-black text-[#10213A] dark:text-white tracking-tight">
        {t.support}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* WhatsApp Card */}
        <a
          href={support.whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
            <Phone className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              {t.whatsappSupport}
            </span>
            <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              {support.whatsappNumber}
            </h4>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs group-hover:bg-emerald-600 group-hover:text-white transition-all flex items-center gap-1">
            Chat <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </a>

        {/* Telegram Card */}
        <a
          href={support.telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-900/40 shadow-xs hover:shadow-lg hover:shadow-sky-500/10 hover:border-sky-500 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-3.5 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
            <Send className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 block">
              {t.telegramSupport}
            </span>
            <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
              @{support.telegramUsername}
            </h4>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-extrabold text-xs group-hover:bg-sky-600 group-hover:text-white transition-all flex items-center gap-1">
            Join <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </a>
      </div>

      {/* Video Guide Card */}
      {support.supportVideoUrl && (
        <div
          id="support-video-guide-banner"
          onClick={() => {
            setIsVideoLoading(true);
            setShowVideoModal(true);
          }}
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-md shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/35 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer group border border-blue-400/30"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-white text-white group-hover:text-blue-600 transition-all shadow-md">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm sm:text-base font-black tracking-tight">{t.videoSupport}</h4>
                <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase tracking-wider text-white">
                  HD Guide
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">{t.videoSupportDesc}</p>
            </div>
          </div>
          <span className="text-xs font-black uppercase tracking-wider bg-white text-blue-700 px-4 py-2 rounded-xl shadow-sm group-hover:bg-blue-50 transition-colors flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Watch Guide</span>
          </span>
        </div>
      )}

      {/* Video Guide Modal */}
      {showVideoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowVideoModal(false);
          }}
        >
          <div className="relative w-full max-w-3xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[95vh]">
            
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-[#176BFF] flex items-center justify-center">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white tracking-tight flex items-center gap-2">
                    <span>EGX FF Tournament — Video Tutorial</span>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-900/60 text-[#176BFF] border border-blue-800 text-[10px] font-extrabold uppercase">
                      <Sparkles className="w-3 h-3" /> Official Guide
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {t.videoSupportDesc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Secondary External Browser Redirect Option */}
                {mediaInfo.directUrl && (
                  <a
                    href={mediaInfo.directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in YouTube / Browser"
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 mr-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Open in App</span>
                  </a>
                )}

                <button
                  onClick={() => setShowVideoModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Close tutorial video"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Frame Canvas */}
            <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
              {/* Buffering/Loading Indicator */}
              {isVideoLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 z-10 pointer-events-none">
                  <div className="w-9 h-9 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-slate-300">Loading Tutorial Stream...</span>
                </div>
              )}

              {mediaInfo.type === 'video' ? (
                <video
                  src={mediaInfo.embedUrl}
                  controls
                  autoPlay
                  playsInline
                  onLoadedData={() => setIsVideoLoading(false)}
                  onError={(e) => {
                    setIsVideoLoading(false);
                    console.warn('Direct video tutorial stream error:', mediaInfo.embedUrl);
                  }}
                  className="w-full h-full object-contain"
                />
              ) : (
                <iframe
                  src={mediaInfo.embedUrl}
                  title="EGX FF Tournament — Video Tutorial"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  onLoad={() => setIsVideoLoading(false)}
                  className="w-full h-full border-0"
                />
              )}
            </div>

            {/* Modal Actions & Guidance Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center gap-2">
                {/* Copy Link Button */}
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Link Copied!' : 'Share Video'}</span>
                </button>

                {/* Open in YouTube / Browser Button */}
                {mediaInfo.directUrl && (
                  <a
                    href={mediaInfo.directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in YouTube / Browser</span>
                  </a>
                )}
              </div>

              {/* Direct WhatsApp Contact button */}
              <a
                href={support.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Need Help? Chat on WhatsApp</span>
              </a>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};


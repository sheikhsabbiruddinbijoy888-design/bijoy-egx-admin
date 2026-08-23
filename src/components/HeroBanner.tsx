import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BannerMedia } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Sparkles
} from 'lucide-react';

interface HeroBannerProps {
  banners: BannerMedia[];
  onActionClick: (link: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ banners, onActionClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Filter and sort active banners: Videos first (by display order), then Images (by display order)
  const activeBanners = useMemo(() => {
    const list = (Array.isArray(banners) ? banners : []).filter(b => b && (b.isActive !== false && (b as any).active !== false));
    const videos = list
      .filter(b => b.type === 'video' || (b as any).mediaType === 'video' || Boolean(b.videoUrl))
      .sort((a, b) => (a.order || (a as any).displayOrder || 0) - (b.order || (b as any).displayOrder || 0));
    const images = list
      .filter(b => b.type !== 'video' && (b as any).mediaType !== 'video' && !b.videoUrl)
      .sort((a, b) => (a.order || (a as any).displayOrder || 0) - (b.order || (b as any).displayOrder || 0));
    
    // Complete playback loop order: ALL videos -> ALL images -> loops
    return [...videos, ...images];
  }, [banners]);

  // Keep currentIndex in bounds
  useEffect(() => {
    if (currentIndex >= activeBanners.length && activeBanners.length > 0) {
      setCurrentIndex(0);
    }
  }, [activeBanners.length, currentIndex]);

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];
  const isVideo = Boolean(
    currentBanner && (
      currentBanner.type === 'video' || 
      (currentBanner as any).mediaType === 'video' || 
      Boolean(currentBanner.videoUrl)
    )
  );
  const mediaUrl = currentBanner ? (currentBanner.url || currentBanner.imageUrl || currentBanner.videoUrl || '') : '';

  // Synchronize audio mute state with video ref
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, currentIndex]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (activeBanners.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  }, [activeBanners.length]);

  const handlePrev = useCallback(() => {
    if (activeBanners.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);

  // Automatic slide progression:
  // - VIDEO: plays uninterrupted until 100% completion (onEnded event). Timer is NEVER active.
  // - IMAGE: timer advances after durationSeconds (or default 5s).
  useEffect(() => {
    if (!currentBanner || activeBanners.length <= 1) return;

    if (isVideo) {
      // Handled strictly by onEnded
      return;
    }

    const duration = (currentBanner.durationSeconds || (currentBanner as any).videoDuration || 5) * 1000;
    const timer = setTimeout(() => {
      handleNext();
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, isVideo, currentBanner, activeBanners.length, handleNext]);

  // Video ended callback: 100% finished -> transition to next slide in playlist
  const handleVideoEnded = () => {
    handleNext();
  };

  // Video error fallback: advance to next slide if video fails to load
  const handleVideoError = () => {
    console.warn('Banner video failed to load or decode, advancing to next slide.');
    setIsVideoLoading(false);
    if (activeBanners.length > 1) {
      handleNext();
    }
  };

  // Sound toggle handler
  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((prev) => {
      const next = !prev;
      if (videoRef.current) {
        videoRef.current.muted = next;
      }
      return next;
    });
  };

  // Fallback if no active banners exist in database
  if (!currentBanner) {
    return null;
  }

  // Extract purely admin-provided content (NO default/placeholder fallbacks)
  const badgeText = (currentBanner.badge || (currentBanner as any).badgeText || '').trim();
  const titleText = (currentBanner.title || '').trim();
  const descriptionText = (currentBanner.description || currentBanner.subtitle || '').trim();
  const ctaText = (currentBanner.buttonText || '').trim();
  const targetLink = (currentBanner.buttonLink || (currentBanner as any).linkUrl || '').trim();

  const hasBadge = Boolean(badgeText);
  const hasTitle = Boolean(titleText);
  const hasDescription = Boolean(descriptionText);
  const hasCta = Boolean(ctaText);
  const hasAnyText = hasBadge || hasTitle || hasDescription || hasCta;

  const handleBannerClick = () => {
    if (targetLink && !hasCta) {
      onActionClick(targetLink);
    }
  };

  return (
    <div
      id="hero-banner-outer-frame"
      className="relative w-full rounded-3xl sm:rounded-[28px] md:rounded-[32px] p-[2px] overflow-hidden transition-all duration-300 dark:shadow-[0_0_28px_rgba(0,240,255,0.4)]"
    >
      {/* Traveling Electric Neon Blue Border Glow (Dark Mode Only) */}
      <div 
        aria-hidden="true"
        className="hidden dark:block absolute -inset-[150%] bg-[conic-gradient(from_0deg,transparent_0_70%,rgba(0,240,255,0.25)_80%,#00F0FF_94%,#FFFFFF_98%,#00F0FF_100%)] animate-neon-border pointer-events-none z-0 will-change-transform" 
      />

      <div
        id="hero-banner-master-container"
        onClick={handleBannerClick}
        className={`group relative z-10 w-full h-[230px] xs:h-[260px] sm:h-[320px] md:h-[360px] lg:h-[390px] rounded-[calc(1.5rem-2px)] sm:rounded-[calc(1.75rem-2px)] md:rounded-[calc(2rem-2px)] overflow-hidden shadow-2xl shadow-blue-950/20 border border-slate-200/80 dark:border-transparent bg-slate-950 isolate [transform:translateZ(0)] select-none ${
          targetLink && !hasCta ? 'cursor-pointer' : ''
        }`}
      >
      {/* 
        LAYER 1: MEDIA CLIPPING FRAME (z-0)
        Guarantees child video or image ALWAYS stays strictly within the master container.
        High-definition, direct source playback with object-fit: cover.
      */}
      <div 
        id="hero-banner-media-frame"
        className="absolute inset-0 w-full h-full overflow-hidden [transform:translateZ(0)] pointer-events-none z-0"
      >
        {isVideo && mediaUrl ? (
          <video
            key={`banner-video-${mediaUrl}`}
            ref={videoRef}
            src={mediaUrl}
            autoPlay
            muted={isMuted}
            playsInline
            preload="auto"
            onEnded={handleVideoEnded}
            onError={handleVideoError}
            onLoadStart={() => setIsVideoLoading(true)}
            onLoadedData={() => setIsVideoLoading(false)}
            onWaiting={() => setIsVideoLoading(true)}
            onPlaying={() => setIsVideoLoading(false)}
            className="w-full h-full object-cover block [transform:translateZ(0)]"
          />
        ) : mediaUrl ? (
          <img
            key={`banner-img-${mediaUrl}`}
            src={mediaUrl}
            alt={titleText || 'Tournament Banner'}
            className="w-full h-full object-cover block [transform:translateZ(0)] transition-transform duration-1000 group-hover:scale-[1.02]"
            referrerPolicy="no-referrer"
          />
        ) : null}
      </div>

      {/* Video Loading Indicator */}
      {isVideo && isVideoLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 pointer-events-none">
          <div className="w-8 h-8 rounded-full border-3 border-blue-500 border-t-transparent animate-spin" />
        </div>
      )}

      {/* 
        CONDITIONAL GRADIENT OVERLAY (z-10)
        Only rendered when text is present so video is 100% visible and bright when no text is set.
      */}
      {hasAnyText && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none z-10 [transform:translateZ(0)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-transparent pointer-events-none z-10 [transform:translateZ(0)]" />
        </>
      )}

      {/* 
        LAYER 2: SLIDE INDICATORS (z-15)
        Placed directly along the bottom center of the banner container.
        Positioned strictly BELOW the CTA button with dedicated bottom spacing.
      */}
      {activeBanners.length > 1 && (
        <div 
          id="hero-banner-indicators"
          className="absolute bottom-2.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-15 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 shadow-md pointer-events-auto"
        >
          {activeBanners.map((b, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={`${b.id || 'banner'}-${idx}`}
                id={`banner-indicator-dot-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'w-7 sm:w-8 bg-[#176BFF] shadow-sm shadow-blue-400'
                    : 'w-2 bg-white/40 hover:bg-white/80'
                }`}
                title={`Slide ${idx + 1}: ${b.title || b.type}`}
              />
            );
          })}
        </div>
      )}

      {/* 
        LAYER 3: TEXT OVERLAY & CTA BUTTON (z-25)
        Rendered ONLY when actual text was provided by Admin.
        No default placeholders or empty reserved space.
      */}
      {hasAnyText && (
        <div className="absolute inset-0 p-4 sm:p-7 md:p-8 flex flex-col justify-end text-white z-25 pointer-events-none">
          <div className="w-full max-w-lg sm:max-w-xl pb-7 sm:pb-8 md:pb-9">
            {/* Admin Badge */}
            {hasBadge && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-600/90 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider backdrop-blur-md border border-blue-400/40 shadow-sm w-fit mb-1.5 sm:mb-2 pointer-events-auto">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{badgeText}</span>
              </div>
            )}

            {/* Admin Title */}
            {hasTitle && (
              <h2 className="text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-md leading-tight line-clamp-1 xs:line-clamp-2">
                {titleText}
              </h2>
            )}

            {/* Admin Description */}
            {hasDescription && (
              <p className="text-[11px] sm:text-xs md:text-sm text-slate-200 mt-1 sm:mt-1.5 line-clamp-1 sm:line-clamp-2 font-medium drop-shadow-sm max-w-md sm:max-w-lg">
                {descriptionText}
              </p>
            )}

            {/* Admin CTA Button */}
            {hasCta && (
              <div className="mt-2.5 sm:mt-3.5 pointer-events-auto">
                <button
                  id="hero-banner-cta-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onActionClick(targetLink || '/tournaments');
                  }}
                  className="px-4.5 sm:px-6 py-2 sm:py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#176BFF] via-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black tracking-wider uppercase shadow-xl shadow-blue-600/40 hover:shadow-blue-600/60 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-blue-300/30 w-fit"
                >
                  <span>{ctaText}</span>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 
        LAYER 4: NAVIGATION & SOUND CONTROLS (z-30)
      */}
      {/* LEFT NAVIGATION BUTTON */}
      {activeBanners.length > 1 && (
        <button
          id="hero-banner-nav-prev"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          aria-label="Previous Slide"
          className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 active:scale-90 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-lg hover:border-white/40 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* RIGHT NAVIGATION BUTTON */}
      {activeBanners.length > 1 && (
        <button
          id="hero-banner-nav-next"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          aria-label="Next Slide"
          className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 active:scale-90 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-lg hover:border-white/40 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* SOUND / MUTE BUTTON (Bottom-Right Inside Banner) */}
      {isVideo && (
        <button
          id="hero-banner-mute-toggle"
          onClick={handleToggleSound}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          className="absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 z-30 p-2 sm:p-2.5 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5 text-slate-300" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5 text-emerald-400" />
          )}
        </button>
      )}
      </div>
    </div>
  );
};

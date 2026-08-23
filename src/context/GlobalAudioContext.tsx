import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface GlobalAudioContextType {
  isPlaying: boolean;
  isEnabled: boolean;
  trackTitle: string;
  artistName: string;
  audioUrl: string;
  volume: number;
  togglePlay: () => Promise<void>;
  startPlayback: () => Promise<void>;
  pausePlayback: () => void;
  getFrequencyData: (dataArray: Uint8Array) => void;
  setVolume: (volume: number) => void;
  tapPulse: boolean;
  triggerTapPulse: () => void;
}

const GlobalAudioContext = createContext<GlobalAudioContextType | undefined>(undefined);

export const GlobalAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDarkMode, bootstrap } = useAuth();

  const musicSettings = bootstrap?.musicSettings || bootstrap?.websiteSettings?.musicSettings;
  const rawMusicUrl = musicSettings?.backgroundMusicUrl || bootstrap?.websiteSettings?.backgroundMusicUrl || '';
  
  // High-fidelity fallback esports cyberpunk beat if no custom track is uploaded
  const defaultFallbackUrl = '/uploads/audio/default_tournament_beat.mp3';
  const effectiveAudioUrl = (rawMusicUrl && rawMusicUrl.trim()) ? rawMusicUrl.trim() : defaultFallbackUrl;
  
  const trackTitle = musicSettings?.musicTitle || bootstrap?.websiteSettings?.musicTitle || 'EGX Cyberpunk Tournament Beat';
  const artistName = musicSettings?.artistName || bootstrap?.websiteSettings?.artistName || 'EGX Esports Sound';
  const isEnabled = musicSettings?.isEnabled !== false;
  const autoPlayOnDarkMode = musicSettings?.autoPlayOnDarkMode !== false;
  const targetVolumeNumber = musicSettings?.volume !== undefined ? musicSettings.volume : 90;
  const normalizedVolume = Math.max(0, Math.min(1, targetVolumeNumber / 100));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  const userPausedRef = useRef<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [tapPulse, setTapPulse] = useState<boolean>(false);
  const [currentSourceUrl, setCurrentSourceUrl] = useState<string>(effectiveAudioUrl);

  // Sync state with prop/bootstrap changes
  useEffect(() => {
    if (effectiveAudioUrl && effectiveAudioUrl !== currentSourceUrl) {
      setCurrentSourceUrl(effectiveAudioUrl);
    }
  }, [effectiveAudioUrl]);

  // Safe fallback handler when an audio source is invalid or not suitable
  const handleAudioError = useCallback((e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const el = e.currentTarget;
    console.warn('Audio media load warning, falling back to default beat:', el.src);
    setIsPlaying(false);
    if (currentSourceUrl !== defaultFallbackUrl) {
      setCurrentSourceUrl(defaultFallbackUrl);
    }
  }, [currentSourceUrl, defaultFallbackUrl]);

  // Initialize Web Audio Graph safely
  const initAudioGraph = useCallback(() => {
    if (!audioRef.current) return;

    if (!audioContextRef.current) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.82;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(normalizedVolume, ctx.currentTime);

        try {
          const source = ctx.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          analyser.connect(gainNode);
          gainNode.connect(ctx.destination);
          sourceNodeRef.current = source;
        } catch {
          // If CORS prevents createMediaElementSource, fallback to standard HTML5 audio
        }

        audioContextRef.current = ctx;
        analyserRef.current = analyser;
        gainNodeRef.current = gainNode;
      } catch (e) {
        console.warn('AudioContext graph notice:', e);
      }
    } else if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
  }, [normalizedVolume]);

  const startPlayback = useCallback(async () => {
    if (!audioRef.current || !isEnabled) return;

    initAudioGraph();

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch {
        // AudioContext resume catch
      }
    }

    if (!audioRef.current) return;

    try {
      audioRef.current.volume = normalizedVolume;
      audioRef.current.loop = true;
      await audioRef.current.play();
      setIsPlaying(true);
      userPausedRef.current = false;
    } catch (err) {
      // Browser autoplay policy might block un-interacted audio
      console.warn('Autoplay waiting for user interaction:', err);
      setIsPlaying(false);
    }
  }, [isEnabled, normalizedVolume, initAudioGraph]);

  const pausePlayback = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {
        // ignore
      }
    }
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(async () => {
    triggerTapPulse();
    if (isPlaying) {
      userPausedRef.current = true;
      pausePlayback();
    } else {
      userPausedRef.current = false;
      await startPlayback();
    }
  }, [isPlaying, pausePlayback, startPlayback]);

  const triggerTapPulse = useCallback(() => {
    setTapPulse(true);
    setTimeout(() => setTapPulse(false), 260);
  }, []);

  const getFrequencyData = useCallback((dataArray: Uint8Array) => {
    let hasValues = false;
    if (analyserRef.current && isPlaying) {
      try {
        analyserRef.current.getByteFrequencyData(dataArray);
        for (let i = 0; i < dataArray.length; i++) {
          if (dataArray[i] > 5) {
            hasValues = true;
            break;
          }
        }
      } catch {
        hasValues = false;
      }
    }
    
    // If playing but no Web Audio analyser data (e.g. cross-origin track), generate rhythmic esports pulse
    if (isPlaying && !hasValues) {
      const now = Date.now() / 150;
      for (let i = 0; i < dataArray.length; i++) {
        const wave = Math.sin(now + i * 0.4) * 0.5 + 0.5;
        const wave2 = Math.cos(now * 0.7 + i * 0.25) * 0.5 + 0.5;
        dataArray[i] = Math.floor((wave * 0.7 + wave2 * 0.3) * 190);
      }
    } else if (!isPlaying) {
      dataArray.fill(0);
    }
  }, [isPlaying]);

  const setVolume = useCallback((vol: number) => {
    const norm = Math.max(0, Math.min(1, vol / 100));
    if (audioRef.current) {
      try {
        audioRef.current.volume = norm;
      } catch {
        // ignore
      }
    }
    if (gainNodeRef.current && audioContextRef.current) {
      try {
        gainNodeRef.current.gain.setValueAtTime(norm, audioContextRef.current.currentTime);
      } catch {
        // ignore
      }
    }
  }, []);

  // Update volume when settings change
  useEffect(() => {
    setVolume(targetVolumeNumber);
  }, [targetVolumeNumber, setVolume]);

  // Dark Mode reactive lifecycle
  useEffect(() => {
    if (!isEnabled) {
      pausePlayback();
      return;
    }

    if (isDarkMode) {
      if (autoPlayOnDarkMode && !userPausedRef.current) {
        // Delay slightly for DOM mount and smooth transition
        const timer = setTimeout(() => {
          startPlayback();
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      // Exiting Dark Mode turns off audio
      pausePlayback();
      userPausedRef.current = false;
    }
  }, [isDarkMode, isEnabled, autoPlayOnDarkMode, startPlayback, pausePlayback]);

  // Global user interaction listener to unlock AudioContext if initially blocked
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      if (isDarkMode && isEnabled && autoPlayOnDarkMode && !userPausedRef.current && !isPlaying) {
        startPlayback();
      }
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [isDarkMode, isEnabled, autoPlayOnDarkMode, isPlaying, startPlayback]);

  // Determine if CORS can be safely requested for local / same-origin files
  const isLocalOrigin = typeof window !== 'undefined' && (
    currentSourceUrl.startsWith('/') || 
    currentSourceUrl.startsWith('data:') ||
    currentSourceUrl.includes(window.location.hostname)
  );

  return (
    <GlobalAudioContext.Provider
      value={{
        isPlaying,
        isEnabled,
        trackTitle,
        artistName,
        audioUrl: currentSourceUrl,
        volume: targetVolumeNumber,
        togglePlay,
        startPlayback,
        pausePlayback,
        getFrequencyData,
        setVolume,
        tapPulse,
        triggerTapPulse
      }}
    >
      {/* 
        Persistent Global HTML5 Audio Element
        Lives at the root of the app and never unmounts during page route transitions 
      */}
      <audio
        ref={audioRef}
        src={currentSourceUrl}
        crossOrigin={isLocalOrigin ? 'anonymous' : undefined}
        preload="auto"
        loop
        onError={handleAudioError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      {children}
    </GlobalAudioContext.Provider>
  );
};

export const useGlobalAudio = (): GlobalAudioContextType => {
  const context = useContext(GlobalAudioContext);
  if (!context) {
    throw new Error('useGlobalAudio must be used within a GlobalAudioProvider');
  }
  return context;
};

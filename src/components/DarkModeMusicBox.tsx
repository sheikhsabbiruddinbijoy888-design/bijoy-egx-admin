import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGlobalAudio } from '../context/GlobalAudioContext';

interface DarkModeMusicBoxProps {
  className?: string;
}

export const DarkModeMusicBox: React.FC<DarkModeMusicBoxProps> = ({ className = '' }) => {
  const { isDarkMode } = useAuth();
  const { isPlaying, isEnabled, togglePlay, getFrequencyData, tapPulse } = useGlobalAudio();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const peakLevelsRef = useRef<number[]>([]);

  // Canvas Resize Observer
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;

    const resize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvas.width = Math.max(300, Math.floor(rect.width));
        canvas.height = 56;
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [isDarkMode]);

  // Render Ultra-Clean Cyberpunk Glowing Mirrored Waveform on Canvas
  useEffect(() => {
    if (!isDarkMode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const barCount = 48; // Dense, ultra-sleek high-tech equalizer bars
    const freqBuffer = new Uint8Array(64);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      let isLiveAudio = false;
      if (isPlaying) {
        getFrequencyData(freqBuffer);
        // Check if there is actual audio activity
        for (let j = 0; j < freqBuffer.length; j++) {
          if (freqBuffer[j] > 10) {
            isLiveAudio = true;
            break;
          }
        }
      }

      // 1. Center Glowing Baseline
      const lineGradient = ctx.createLinearGradient(0, centerY, width, centerY);
      lineGradient.addColorStop(0, 'rgba(0, 240, 255, 0)');
      lineGradient.addColorStop(0.15, 'rgba(0, 240, 255, 0.4)');
      lineGradient.addColorStop(0.35, 'rgba(0, 240, 255, 0.8)');
      lineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
      lineGradient.addColorStop(0.65, 'rgba(0, 240, 255, 0.8)');
      lineGradient.addColorStop(0.85, 'rgba(0, 240, 255, 0.4)');
      lineGradient.addColorStop(1, 'rgba(0, 240, 255, 0)');

      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = isPlaying ? 2 : 1.2;
      ctx.shadowColor = isPlaying ? 'rgba(0, 240, 255, 0.95)' : 'rgba(0, 240, 255, 0.4)';
      ctx.shadowBlur = isPlaying ? 16 : 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 2. Mirrored High-Tech Equalizer Frequency Bars
      const totalSpacing = width / barCount;
      const barWidth = Math.max(2.5, totalSpacing * 0.58);

      phase += isPlaying ? 0.08 : 0.025;

      for (let i = 0; i < barCount; i++) {
        let value = 0;

        if (isLiveAudio) {
          const sampleIdx = Math.floor((i / barCount) * (freqBuffer.length * 0.8));
          const rawFreq = freqBuffer[sampleIdx] || 0;
          if (rawFreq > 5) {
            const distFromCenter = Math.abs((i - barCount / 2) / (barCount / 2));
            const centerBoost = 1 - Math.pow(distFromCenter, 1.4) * 0.45;
            value = (rawFreq / 255) * (centerY * 0.92) * centerBoost;
          }
        }

        if (value < 3) {
          // Ambient breathing neon wave when idle or paused
          const w1 = Math.sin(phase + i * 0.3) * 0.5 + 0.5;
          const w2 = Math.cos(phase * 0.7 + i * 0.18) * 0.5 + 0.5;
          const ambient = (w1 * 0.65 + w2 * 0.35) * (centerY * 0.4);
          value = Math.max(3, ambient);
        }

        // Peak tracking
        if (!peakLevelsRef.current[i] || value > peakLevelsRef.current[i]) {
          peakLevelsRef.current[i] = value;
        } else {
          peakLevelsRef.current[i] = Math.max(0, peakLevelsRef.current[i] - 0.65);
        }

        const x = i * totalSpacing + (totalSpacing - barWidth) / 2;
        const currentPeak = peakLevelsRef.current[i];
        
        // TOP BARS (Moving upwards from center) - Pure Electric Cyan / White
        const topGrad = ctx.createLinearGradient(0, centerY, 0, centerY - value);
        topGrad.addColorStop(0, 'rgba(14, 116, 244, 0.85)');
        topGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.95)');
        topGrad.addColorStop(1, '#ffffff');

        ctx.fillStyle = topGrad;
        ctx.shadowColor = 'rgba(0, 240, 255, 0.9)';
        ctx.shadowBlur = isPlaying ? 12 : 4;

        ctx.beginPath();
        const topY = centerY - value;
        ctx.roundRect(x, topY, barWidth, value, [2, 2, 0, 0]);
        ctx.fill();

        // Top Peak Highlight Dot
        if (currentPeak > 4) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x + barWidth / 2, centerY - currentPeak - 1.5, Math.min(barWidth / 2, 1.3), 0, Math.PI * 2);
          ctx.fill();
        }

        // BOTTOM REFLECTION BARS (Mirrored downwards)
        const bottomGrad = ctx.createLinearGradient(0, centerY, 0, centerY + value * 0.7);
        bottomGrad.addColorStop(0, 'rgba(0, 240, 255, 0.65)');
        bottomGrad.addColorStop(0.6, 'rgba(14, 116, 244, 0.3)');
        bottomGrad.addColorStop(1, 'rgba(15, 23, 42, 0.05)');

        ctx.fillStyle = bottomGrad;
        ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
        ctx.shadowBlur = isPlaying ? 6 : 2;

        ctx.beginPath();
        ctx.roundRect(x, centerY, barWidth, value * 0.65, [0, 0, 2, 2]);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDarkMode, isPlaying, getFrequencyData]);

  // CRITICAL: Strictly hidden in Light Mode or if disabled
  if (!isDarkMode || !isEnabled) {
    return null;
  }

  return (
    <div className="relative w-full rounded-2xl p-[2px] overflow-hidden transition-all duration-300 shadow-[0_0_25px_rgba(0,240,255,0.4)]">
      {/* Traveling Electric Neon Blue Border Glow */}
      <div 
        aria-hidden="true"
        className="absolute -inset-[150%] bg-[conic-gradient(from_0deg,transparent_0_70%,rgba(0,240,255,0.25)_80%,#00F0FF_94%,#FFFFFF_98%,#00F0FF_100%)] animate-neon-border pointer-events-none z-0 will-change-transform" 
      />

      <div
        ref={containerRef}
        onClick={togglePlay}
        title="Tap anywhere to Play / Pause Equalizer"
        className={`relative z-10 w-full h-[54px] sm:h-[58px] rounded-[calc(1rem-2px)] bg-[#111827]/95 p-1.5 transition-all duration-300 overflow-hidden cursor-pointer select-none active:scale-[0.99] flex items-center justify-center ${
          tapPulse ? 'ring-2 ring-cyan-400/60 scale-[0.99]' : ''
        } ${className}`}
      >
        {/* Ambient Electric Cyan Neon Backlight Illumination */}
        <div 
          className={`absolute left-1/4 -top-8 w-40 h-24 bg-cyan-500/25 rounded-full blur-2xl pointer-events-none transition-opacity duration-500 ${
            isPlaying ? 'opacity-100' : 'opacity-40'
          }`} 
        />
        <div 
          className={`absolute right-1/4 -bottom-8 w-40 h-24 bg-[#00F0FF]/20 rounded-full blur-2xl pointer-events-none transition-opacity duration-500 ${
            isPlaying ? 'opacity-100' : 'opacity-30'
          }`} 
        />

        {/* Pure Full-Width Glowing Visualizer Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain relative z-10"
        />
      </div>
    </div>
  );
};

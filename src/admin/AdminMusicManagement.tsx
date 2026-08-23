import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Volume2, 
  VolumeX, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Play, 
  Pause, 
  Radio, 
  Sparkles, 
  Sliders, 
  ShieldCheck,
  Disc,
  Headphones,
  Zap
} from 'lucide-react';
import { safeFetchJson, getAuthToken } from '../lib/api';
import { AudioUploadBox } from '../components/AudioUploadBox';
import { useAuth } from '../context/AuthContext';

export const AdminMusicManagement: React.FC = () => {
  const { refreshBootstrap } = useAuth();

  const [musicUrl, setMusicUrl] = useState<string>('');
  const [musicTitle, setMusicTitle] = useState<string>('EGX Cyberpunk Tournament Beat');
  const [artistName, setArtistName] = useState<string>('EGX Esports Sound');
  const [autoPlayOnDarkMode, setAutoPlayOnDarkMode] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(90);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Preset tracks for quick admin selection
  const presetTracks = [
    {
      title: 'EGX Cyberpunk Battle Theme',
      artist: 'EGX Esports Sound',
      url: '/uploads/audio/default_tournament_beat.mp3',
      genre: 'Cyberpunk / Synthwave'
    },
    {
      title: 'Neon Tournament Rush',
      artist: 'Free Fire Beat Lab',
      url: '/uploads/audio/tournament_anthem.mp3',
      genre: 'High Energy Trap / Gaming'
    },
    {
      title: 'Esports Championship Anthem',
      artist: 'EGX Arena Sound',
      url: '/uploads/audio/Ride_It__Lyrics__-_Jay_sean____Hindi_Version_MP3_160K__1787391887433.mp3',
      genre: 'Epic Orchestral / Esports'
    }
  ];

  const fetchMusicSettings = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<{ success: boolean; musicSettings: any }>('/api/admin/music-settings', {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });

      if (res.ok && res.data?.musicSettings) {
        const ms = res.data.musicSettings;
        setMusicUrl(ms.backgroundMusicUrl || '');
        setMusicTitle(ms.musicTitle || 'EGX Cyberpunk Tournament Beat');
        setArtistName(ms.artistName || 'EGX Esports Sound');
        setAutoPlayOnDarkMode(ms.autoPlayOnDarkMode !== undefined ? ms.autoPlayOnDarkMode : true);
        setVolume(ms.volume !== undefined ? ms.volume : 90);
        setIsEnabled(ms.isEnabled !== undefined ? ms.isEnabled : true);
      }
    } catch (err) {
      console.error('Failed to load music settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMusicSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const token = getAuthToken();
      const payload = {
        backgroundMusicUrl: musicUrl,
        background_music_url: musicUrl,
        musicTitle: musicTitle.trim() || 'EGX Tournament Beat',
        title: musicTitle.trim() || 'EGX Tournament Beat',
        artistName: artistName.trim() || 'EGX Esports Sound',
        artist: artistName.trim() || 'EGX Esports Sound',
        autoPlayOnDarkMode,
        volume: Number(volume),
        isEnabled
      };

      const res = await fetch('/api/admin/music-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to save music settings');
      }

      setFeedback({
        type: 'success',
        message: 'Music settings updated successfully! Live User Panels updated.'
      });

      // Refresh global bootstrap state so all active tabs sync immediately
      if (refreshBootstrap) {
        await refreshBootstrap();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'An error occurred while saving music settings.'
      });
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof presetTracks[0]) => {
    setMusicTitle(preset.title);
    setArtistName(preset.artist);
    setMusicUrl(preset.url);
    setFeedback({
      type: 'success',
      message: `Selected preset: "${preset.title}". Click "Save Music Settings" to apply globally.`
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Headphones className="w-4 h-4" />
            Audio & Equalizer Management
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Background Music & Dark Mode Equalizer
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure the audio track that automatically plays with an interactive glowing equalizer when users activate Dark Mode.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchMusicSettings}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Music Settings
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-medium animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1 & 2: Audio File Upload & Track Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Audio Upload Box Section */}
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Music className="w-4 h-4 text-blue-500" />
              Upload Audio Track (MP3, WAV, AAC, OGG)
            </h3>
            
            <AudioUploadBox
              label="Background Music File"
              currentUrl={musicUrl}
              onUploadComplete={async (result) => {
                setMusicUrl(result.url);
                if (result.fileName && (!musicTitle || musicTitle === 'EGX Cyberpunk Tournament Beat' || musicTitle === 'EGX Tournament Beat')) {
                  const cleaned = result.fileName.replace(/\.[^/.]+$/, '').replace(/[_\-]/g, ' ');
                  setMusicTitle(cleaned);
                }
                setFeedback({
                  type: 'success',
                  message: `Audio track "${result.fileName || 'music'}" uploaded & saved to storage bucket! Global audio updated.`
                });
                if (refreshBootstrap) {
                  await refreshBootstrap();
                }
              }}
              onRemove={() => setMusicUrl('')}
              helperText="Upload any high-quality game theme music or enter an external direct audio link. Supports MP3, WAV, AAC, OGG, M4A, and FLAC up to 10 minutes and 100MB."
            />
          </div>

          {/* Track Metadata & Preferences */}
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-500" />
              Track Details & Playback Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Track Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Track Title / Song Name
                </label>
                <input
                  type="text"
                  value={musicTitle}
                  onChange={(e) => setMusicTitle(e.target.value)}
                  placeholder="e.g. Free Fire Champions Beat"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Artist / Producer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Artist / Subtitle
                </label>
                <input
                  type="text"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="e.g. EGX Official Sound"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Volume Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-blue-500" />
                  Default Master Volume Output
                </label>
                <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800/40">
                  {volume}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0% (Muted)</span>
                <span>50% (Comfortable)</span>
                <span>100% (Maximum Beat)</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* AutoPlay on Dark Mode */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-slate-200/50 dark:border-slate-700/50">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    Auto-Play on Dark Mode Activation
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Automatically triggers playback and equalizer wave as soon as a user enters Dark Mode.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoPlayOnDarkMode}
                  onChange={(e) => setAutoPlayOnDarkMode(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>

              {/* Master Enabled */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-slate-200/50 dark:border-slate-700/50">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                    Enable Music Box on Homepage
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Show the glowing audio equalizer box above the announcement section in Dark Mode.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Column 3: Quick Preset Library & Information */}
        <div className="space-y-6">
          
          {/* Quick Preset Library */}
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Disc className="w-4 h-4 text-blue-500" />
              Curated Gaming Presets
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any royalty-free esport sound preset below to instantly preview and test:
            </p>

            <div className="space-y-2.5">
              {presetTracks.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    musicUrl === preset.url
                      ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 dark:border-blue-500/60 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {preset.title}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                      {preset.genre}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {preset.artist}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Behavior Guidelines & Technical Rules */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-slate-900 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 space-y-3">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              Dark Mode Integration Rules
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span><strong>Dark Mode Exclusivity:</strong> The Music Box and equalizer are ONLY displayed when the user enables Dark Mode. In Light Mode, it is hidden.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span><strong>Homepage Position:</strong> Placed directly below the Hero Banner and directly above the Announcement box with matching dimensions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span><strong>One-Touch Play/Pause:</strong> Clicking anywhere on the Music Box toggles playback immediately.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};

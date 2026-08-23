import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save,
  Globe,
  Sliders
} from 'lucide-react';
import { safeFetchJson, getAuthToken } from '../lib/api';

export const AdminHomepage: React.FC = () => {
  const [heroHeading, setHeroHeading] = useState('EGX FF Competitive Arena');
  const [heroSubheading, setHeroSubheading] = useState('Join daily Free Fire tournaments, clash squads, and win verified cash prizes!');
  const [marqueeText, setMarqueeText] = useState('🔥 Welcome to EGX FF Tournament — Instant Deposit & Withdrawals 24/7 via bKash, Nagad & Rocket! 🔥');
  const [showLiveCounter, setShowLiveCounter] = useState(true);
  const [enableVideoBanners, setEnableVideoBanners] = useState(true);
  const [featuredCategory, setFeaturedCategory] = useState('Solo');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchHomepageSettings = async () => {
    try {
      const res = await safeFetchJson<any>('/api/settings');
      if (res.ok && res.data) {
        const data = res.data;
        if (data.heroHeading) setHeroHeading(data.heroHeading);
        if (data.heroSubheading) setHeroSubheading(data.heroSubheading);
        if (data.marqueeText) setMarqueeText(data.marqueeText);
        if (data.showLiveCounter !== undefined) setShowLiveCounter(data.showLiveCounter);
        if (data.enableVideoBanners !== undefined) setEnableVideoBanners(data.enableVideoBanners);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHomepageSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          heroHeading,
          heroSubheading,
          marqueeText,
          showLiveCounter,
          enableVideoBanners,
          featuredCategory
        })
      });

      if (!res.ok) throw new Error('Failed to save homepage settings');

      setFeedback({ type: 'success', message: 'Homepage layout and hero text updated successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-[#10213A] dark:text-white tracking-tight">
            Homepage & Layout Configuration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Customize top hero banners, headline copy, live counters, and announcement marquees.
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#10213A] dark:text-white uppercase tracking-wider">
            Hero Branding & Copywriting
          </h3>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1">
              Main Hero Heading
            </label>
            <input
              type="text"
              value={heroHeading}
              onChange={(e) => setHeroHeading(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-black focus:border-[#176BFF]"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1">
              Hero Subtitle / Tagline
            </label>
            <input
              type="text"
              value={heroSubheading}
              onChange={(e) => setHeroSubheading(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:border-[#176BFF]"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1">
              Top Running News Marquee
            </label>
            <textarea
              rows={2}
              value={marqueeText}
              onChange={(e) => setMarqueeText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:border-[#176BFF]"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-black text-[#10213A] dark:text-white uppercase tracking-wider">
            Display Switches
          </h3>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="liveCounter"
              checked={showLiveCounter}
              onChange={(e) => setShowLiveCounter(e.target.checked)}
              className="w-4 h-4 rounded text-[#176BFF]"
            />
            <label htmlFor="liveCounter" className="text-xs font-bold text-[#10213A] dark:text-slate-200">
              Display Live Active Player & Match Counter badge on homepage
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="videoBanners"
              checked={enableVideoBanners}
              onChange={(e) => setEnableVideoBanners(e.target.checked)}
              className="w-4 h-4 rounded text-[#176BFF]"
            />
            <label htmlFor="videoBanners" className="text-xs font-bold text-[#10213A] dark:text-slate-200">
              Enable full-motion 5-minute video slider clips in hero section
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-2xl bg-[#176BFF] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

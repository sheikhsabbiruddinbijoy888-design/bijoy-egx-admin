import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  CreditCard, 
  Globe, 
  Headphones, 
  UserCheck, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Phone,
  Mail,
  ShieldCheck,
  Key,
  Image as ImageIcon,
  Film,
  ExternalLink,
  Youtube
} from 'lucide-react';
import { safeFetchJson, getAuthToken } from '../lib/api';
import { MediaUploadBox } from '../components/MediaUploadBox';

interface AdminSettingsProps {
  initialTab?: 'payment-settings' | 'website-settings' | 'support-settings' | 'admin-profile';
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ initialTab = 'payment-settings' }) => {
  const [activeTab, setActiveTab] = useState<'payment-settings' | 'website-settings' | 'support-settings' | 'admin-profile'>(initialTab);

  // Payment Settings
  const [bkashNumber, setBkashNumber] = useState('01886178550');
  const [bkashType, setBkashType] = useState('Personal (Send Money)');
  const [nagadNumber, setNagadNumber] = useState('01886178550');
  const [nagadType, setNagadType] = useState('Personal (Send Money)');
  const [rocketNumber, setRocketNumber] = useState('01886178550');
  const [rocketType, setRocketType] = useState('Personal (Send Money)');
  const [minDeposit, setMinDeposit] = useState<number>(20);
  const [minWithdrawal, setMinWithdrawal] = useState<number>(50);

  // Website Settings
  const [siteName, setSiteName] = useState('EGX FF Tournament');
  const [siteLogo, setSiteLogo] = useState('');
  const [siteFavicon, setSiteFavicon] = useState('');
  const [footerText, setFooterText] = useState('© 2026 EGX Free Fire Tournament Platform. All rights reserved.');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Support Settings
  const [whatsappNumber, setWhatsappNumber] = useState('+8801886178550');
  const [telegramChannel, setTelegramChannel] = useState('https://t.me/egxffofficial');
  const [facebookPage, setFacebookPage] = useState('https://facebook.com/egxtournament');
  const [youtubeChannel, setYoutubeChannel] = useState('https://youtube.com/@egxtournament');
  const [supportEmail, setSupportEmail] = useState('support@egx-tournament.com');
  const [supportVideoUrl, setSupportVideoUrl] = useState('');

  // Admin Profile
  const [adminEmail, setAdminEmail] = useState('joyshakib689@gmail.com');
  const [adminName, setAdminName] = useState('Joy Shakib (EGX Master)');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loadSettings = async () => {
    try {
      const res = await safeFetchJson<any>('/api/settings');
      if (res.ok && res.data) {
        const data = res.data;
        if (data.payment) {
          setBkashNumber(data.payment.bkashNumber || '01886178550');
          setBkashType(data.payment.bkashType || 'Personal (Send Money)');
          setNagadNumber(data.payment.nagadNumber || '01886178550');
          setNagadType(data.payment.nagadType || 'Personal (Send Money)');
          setRocketNumber(data.payment.rocketNumber || '01886178550');
          setRocketType(data.payment.rocketType || 'Personal (Send Money)');
          if (data.payment.minDeposit) setMinDeposit(data.payment.minDeposit);
          if (data.payment.minWithdrawal) setMinWithdrawal(data.payment.minWithdrawal);
        }
        if (data.website) {
          setSiteName(data.website.siteName || 'EGX FF Tournament');
          setSiteLogo(data.website.siteLogo || '');
          setSiteFavicon(data.website.siteFavicon || data.website.favicon || '');
          setFooterText(data.website.footerText || '');
          setMaintenanceMode(Boolean(data.website.maintenanceMode));
        }
        if (data.support) {
          setWhatsappNumber(data.support.whatsappNumber || '+8801886178550');
          setTelegramChannel(data.support.telegramChannel || '');
          setFacebookPage(data.support.facebookPage || '');
          setYoutubeChannel(data.support.youtubeChannel || '');
          setSupportEmail(data.support.supportEmail || 'support@egx-tournament.com');
          setSupportVideoUrl(data.support.supportVideoUrl || '');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const payload = {
      payment: {
        bkashNumber,
        bkashType,
        nagadNumber,
        nagadType,
        rocketNumber,
        rocketType,
        minDeposit: Number(minDeposit),
        minWithdrawal: Number(minWithdrawal)
      },
      website: {
        siteName,
        siteLogo,
        siteFavicon,
        favicon: siteFavicon,
        footerText,
        maintenanceMode
      },
      support: {
        whatsappNumber,
        telegramChannel,
        facebookPage,
        youtubeChannel,
        supportEmail,
        supportVideoUrl
      }
    };

    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to update system settings');

      setFeedback({ type: 'success', message: 'System configuration updated successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          fullName: adminName,
          email: adminEmail,
          password: newPassword ? newPassword : undefined
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update admin profile');

      setFeedback({ type: 'success', message: 'Admin profile credentials updated!' });
      setNewPassword('');
      setConfirmPassword('');
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
            System & Operations Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure payment receiving accounts, website metadata, WhatsApp support, and security.
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'payment-settings', label: 'Payment Settings', icon: CreditCard },
          { id: 'website-settings', label: 'Website Settings', icon: Globe },
          { id: 'support-settings', label: 'Support & Channels', icon: Headphones },
          { id: 'admin-profile', label: 'Admin Security Profile', icon: UserCheck }
        ].map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={`${tab.id}-${idx}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 shrink-0 transition-all ${
                isActive
                  ? 'bg-[#176BFF] text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Payment Settings Tab */}
      {activeTab === 'payment-settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* bKash */}
            <div className="p-4 rounded-2xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/50 space-y-3">
              <h4 className="font-black text-sm text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> bKash Receiver
              </h4>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">bKash Number</label>
                <input
                  type="text"
                  value={bkashNumber}
                  onChange={(e) => setBkashNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Account Type</label>
                <input
                  type="text"
                  value={bkashType}
                  onChange={(e) => setBkashType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>

            {/* Nagad */}
            <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 space-y-3">
              <h4 className="font-black text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> Nagad Receiver
              </h4>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Nagad Number</label>
                <input
                  type="text"
                  value={nagadNumber}
                  onChange={(e) => setNagadNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Account Type</label>
                <input
                  type="text"
                  value={nagadType}
                  onChange={(e) => setNagadType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>

            {/* Rocket */}
            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 space-y-3">
              <h4 className="font-black text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> Rocket Receiver
              </h4>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Rocket Number</label>
                <input
                  type="text"
                  value={rocketNumber}
                  onChange={(e) => setRocketNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1">Account Type</label>
                <input
                  type="text"
                  value={rocketType}
                  onChange={(e) => setRocketType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1">Minimum Deposit Amount (৳)</label>
              <input
                type="number"
                value={minDeposit}
                onChange={(e) => setMinDeposit(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1">Minimum Withdrawal Amount (৳)</label>
              <input
                type="number"
                value={minWithdrawal}
                onChange={(e) => setMinWithdrawal(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-[#176BFF] hover:bg-blue-600 text-white font-black text-xs uppercase flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Payment Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* Website Settings Tab */}
      {activeTab === 'website-settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <MediaUploadBox
                label="Website Brand Logo (Upload File)"
                mediaType="image"
                currentUrl={siteLogo}
                onUploadComplete={(res) => setSiteLogo(res.url)}
                onRemove={() => setSiteLogo('')}
                helperText="Upload transparent PNG or SVG logo."
              />
            </div>
            <div>
              <MediaUploadBox
                label="Website Favicon (Upload File)"
                mediaType="image"
                currentUrl={siteFavicon}
                onUploadComplete={(res) => setSiteFavicon(res.url)}
                onRemove={() => setSiteFavicon('')}
                helperText="Upload square 32x32 or 64x64 favicon PNG / ICO."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1">Website Title</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1">Footer Copyright Text</label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="maintMode"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="w-4 h-4 rounded text-[#176BFF]"
            />
            <label htmlFor="maintMode" className="text-xs font-bold text-[#10213A] dark:text-slate-200">
              Enable Maintenance Mode (Restricts player actions during updates)
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-[#176BFF] hover:bg-blue-600 text-white font-black text-xs uppercase flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Website Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* Support Settings Tab */}
      {activeTab === 'support-settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-slate-800 dark:text-white flex items-center gap-1.5">
                <Youtube className="w-4 h-4 text-red-500" />
                <span>Support Video URL (YouTube, Vimeo or Direct MP4)</span>
              </label>
              {supportVideoUrl && (
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 px-2 py-0.5 rounded-full bg-emerald-500/10">
                  Active
                </span>
              )}
            </div>
            <input
              type="text"
              value={supportVideoUrl}
              onChange={(e) => setSupportVideoUrl(e.target.value)}
              placeholder="e.g. https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Paste standard YouTube links, shortened URLs (<code className="text-blue-500 font-mono">youtu.be/...</code>), or upload a video below.
            </p>

            <div className="pt-2">
              <MediaUploadBox
                label="Or Upload Video File Directly (MP4 / WEBM <= 50MB)"
                mediaType="video"
                currentUrl={supportVideoUrl.startsWith('/uploads/') ? supportVideoUrl : ''}
                onUploadComplete={(res) => setSupportVideoUrl(res.url)}
                onRemove={() => setSupportVideoUrl('')}
                helperText="Direct file upload for players without YouTube."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1">WhatsApp Support Number</label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+8801886178550"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1">Telegram Community Link</label>
            <input
              type="text"
              value={telegramChannel}
              onChange={(e) => setTelegramChannel(e.target.value)}
              placeholder="https://t.me/..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1">Official Support Email</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-[#176BFF] hover:bg-blue-600 text-white font-black text-xs uppercase flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Support Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* Admin Profile Tab */}
      {activeTab === 'admin-profile' && (
        <form onSubmit={handleUpdateAdminProfile} className="bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1">Admin Display Name</label>
            <input
              type="text"
              required
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1">Admin Login Email</label>
            <input
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Change Admin Password</h4>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">New Password (Leave blank to keep unchanged)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>
            {newPassword && (
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-[#176BFF] hover:bg-blue-600 text-white font-black text-xs uppercase flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Update Admin Credentials</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Video, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  ExternalLink,
  Eye,
  RefreshCw,
  X,
  Play,
  Layers
} from 'lucide-react';
import { safeFetchJson, getAuthToken } from '../lib/api';
import { Banner } from '../types';
import { MediaUploadBox } from '../components/MediaUploadBox';
import { useAuth } from '../context/AuthContext';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export const AdminBannerManagement: React.FC = () => {
  const { refreshBootstrap } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form states (NO URL INPUT!)
  const [badge, setBadge] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState<number | undefined>(undefined);
  const [linkUrl, setLinkUrl] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [active, setActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number>(1);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<Banner[]>('/api/admin/banners');
      if (res.ok && Array.isArray(res.data)) setBanners(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingBanner(null);
    setBadge('');
    setTitle('');
    setSubtitle('');
    setMediaType('image');
    setMediaUrl('');
    setVideoDuration(undefined);
    setLinkUrl('');
    setButtonText('');
    setActive(true);
    setDisplayOrder(banners.length + 1);
    setFeedback(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (b: Banner) => {
    setEditingBanner(b);
    setBadge((b as any).badge || (b as any).badgeText || '');
    setTitle(b.title || '');
    setSubtitle(b.subtitle || (b as any).description || '');
    setMediaType((b.mediaType || (b.videoUrl ? 'video' : 'image')) as 'image' | 'video');
    setMediaUrl(b.imageUrl || b.videoUrl || '');
    setVideoDuration(b.videoDuration);
    setLinkUrl(b.linkUrl || (b as any).buttonLink || '');
    setButtonText(b.buttonText || '');
    setActive(b.active !== false);
    setDisplayOrder(b.displayOrder || 1);
    setFeedback(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) {
      setFeedback({ type: 'error', message: `Please upload a ${mediaType} file using the upload box.` });
      return;
    }

    if (mediaType === 'video' && videoDuration && videoDuration > 300) {
      setFeedback({ type: 'error', message: 'Video duration exceeds maximum allowed limit of 5 minutes (300 seconds).' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const payload = {
      badge: badge.trim(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: subtitle.trim(),
      mediaType,
      imageUrl: mediaType === 'image' ? mediaUrl : '',
      videoUrl: mediaType === 'video' ? mediaUrl : '',
      videoDuration: mediaType === 'video' ? videoDuration : undefined,
      linkUrl: linkUrl.trim(),
      buttonText: buttonText.trim(),
      active,
      displayOrder: Number(displayOrder)
    };

    try {
      const token = getAuthToken();
      const url = editingBanner ? `/api/admin/banners/${editingBanner.id}` : '/api/admin/banners';
      const method = editingBanner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save banner');

      setFeedback({
        type: 'success',
        message: editingBanner ? 'Banner updated successfully!' : 'New banner published!'
      });

      fetchBanners();
      refreshBootstrap().catch(console.error);
      setModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Operation failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (b: Banner) => {
    setBannerToDelete(b);
  };

  const handleConfirmDeleteBanner = async () => {
    if (!bannerToDelete) return;

    setDeleteLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/banners/${bannerToDelete.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error('Failed to delete banner');
      setBanners(prev => prev.filter(item => item.id !== bannerToDelete.id));
      setFeedback({ type: 'success', message: 'Item deleted successfully!' });
      refreshBootstrap().catch(console.error);
      setBannerToDelete(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Delete failed' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleActive = async (b: Banner) => {
    try {
      const token = getAuthToken();
      const nextActive = !b.active;
      const res = await fetch(`/api/admin/banners/${b.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...b, active: nextActive })
      });
      if (!res.ok) throw new Error('Failed to toggle status');
      setBanners(prev => prev.map(item => item.id === b.id ? { ...item, active: nextActive } : item));
      refreshBootstrap().catch(console.error);
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-[#10213A] dark:text-white tracking-tight">
            Banner & Video Media Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage interactive homepage sliders with images and video files (up to 5 mins max).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBanners}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#10213A] dark:text-white text-xs font-black flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-2xl bg-[#176BFF] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Upload Banner Media
          </button>
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

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {banners.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800">
            No banners created yet. Click "Upload Banner Media" to add your first slider item.
          </div>
        ) : (
          banners.map(b => {
            const isVideo = b.mediaType === 'video' || Boolean(b.videoUrl);
            const mediaSource = b.imageUrl || b.videoUrl;

            return (
              <div 
                key={b.id} 
                className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between group"
              >
                <div>
                  {/* Media Preview Box */}
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                    {isVideo ? (
                      <video
                        src={mediaSource || undefined}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        loop
                        onError={(e) => {
                          console.warn('Banner video preview error:', mediaSource);
                          e.currentTarget.style.display = 'none';
                        }}
                        onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                        onMouseLeave={(e) => e.currentTarget.pause()}
                      />
                    ) : (
                      <img
                        src={mediaSource}
                        alt={b.title || 'Banner'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase flex items-center gap-1 ${
                        isVideo ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {isVideo ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                        {isVideo ? 'Video Media' : 'Image Banner'}
                      </span>
                      {isVideo && b.videoDuration && (
                        <span className="px-2 py-0.5 rounded-md bg-black/60 text-white font-mono text-[10px] backdrop-blur-xs">
                          {Math.floor(b.videoDuration / 60)}:{(b.videoDuration % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => handleToggleActive(b)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                          b.active !== false
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {b.active !== false ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-black text-sm line-clamp-1">{b.title || 'Untitled Banner'}</h3>
                      {b.subtitle && <p className="text-[11px] text-slate-300 line-clamp-1">{b.subtitle}</p>}
                    </div>
                  </div>

                  {/* Attributes */}
                  <div className="p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Order Priority: #{b.displayOrder || 1}</span>
                      <span className="font-mono text-[10px]">#{b.id}</span>
                    </div>
                    {b.buttonText && (
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-between font-bold">
                        <span className="text-slate-400">Action Button:</span>
                        <span className="text-[#176BFF]">{b.buttonText}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-2">
                  <button
                    onClick={() => handleOpenEditModal(b)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-slate-700 dark:text-slate-300 hover:text-[#176BFF] font-bold text-xs transition-all"
                  >
                    Edit Details
                  </button>

                  <button
                    onClick={() => handleDelete(b)}
                    className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 transition-all"
                    title="Delete banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload & Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-black text-[#10213A] dark:text-white">
                {editingBanner ? 'Edit Banner Media' : 'Upload New Banner Media'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Media Type Switcher */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMediaType('image');
                    setMediaUrl('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                    mediaType === 'image'
                      ? 'bg-[#176BFF] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#10213A]'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Image Banner (16:9)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMediaType('video');
                    setMediaUrl('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                    mediaType === 'video'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#10213A]'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Video Clip (Max 5 Mins)</span>
                </button>
              </div>

              {/* REAL File Upload Box with Chunked Support & 5-minute video duration validation (NO URL INPUT BOX) */}
              <div>
                <MediaUploadBox
                  label={mediaType === 'video' ? 'Select Video File from Device (Max 5 Minutes)' : 'Select Image Banner from Device'}
                  mediaType={mediaType}
                  currentUrl={mediaUrl}
                  onUploadComplete={(res) => {
                    setMediaUrl(res.url);
                    if (res.duration) setVideoDuration(res.duration);
                  }}
                  onRemove={() => {
                    setMediaUrl('');
                    setVideoDuration(undefined);
                  }}
                  helperText={
                    mediaType === 'video'
                      ? 'Upload high-definition MP4/WEBM/MOV video (Max 5 minutes duration, chunked upload up to 1.5GB).'
                      : 'Upload 16:9 banner visual (JPG/PNG/WEBP).'
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Badge / Label (Optional)</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. FEATURED VIDEO or OFFICIAL ESPORTS"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Banner Title (Optional)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Bermuda Pro Cup Championship"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Subtitle / Description (Optional)</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. ৳50,000 Total Prize Pool"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Button Text / CTA (Optional)</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="e.g. Join Tournament"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Action Link / CTA Link (Optional)</label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="e.g. /tournaments or match ID"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Display Priority Order</label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded-md text-[#176BFF] focus:ring-0"
                />
                <label htmlFor="activeCheck" className="text-xs font-bold text-[#10213A] dark:text-slate-200">
                  Publish active on homepage slider immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || !mediaUrl}
                  className="px-6 py-2.5 rounded-xl bg-[#176BFF] hover:bg-blue-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? 'Saving...' : (editingBanner ? 'Update Banner' : 'Publish Banner')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Banner Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(bannerToDelete)}
        title="Delete Banner"
        message="Are you sure you want to permanently delete this banner? It will be immediately removed from the player homepage carousel."
        itemType="Promo Banner"
        itemName={bannerToDelete ? (bannerToDelete.title || `Banner #${bannerToDelete.id}`) : undefined}
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteBanner}
        onClose={() => {
          if (!deleteLoading) setBannerToDelete(null);
        }}
      />
    </div>
  );
};

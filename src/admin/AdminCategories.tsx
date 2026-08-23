import React, { useState, useEffect, useRef } from 'react';
import { 
  Grid, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Layers,
  Edit3,
  Upload,
  Eye,
  Globe,
  EyeOff,
  Clock,
  Info,
  Smartphone,
  Tablet,
  Monitor,
  Search,
  Filter,
  Check,
  Calendar,
  Sparkles,
  ArrowUpDown,
  FileImage,
  Loader2,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { safeFetchJson, getAuthToken } from '../lib/api';
import { CategoryInfo } from '../types';
import { CategoryImageUploadBox } from './components/CategoryImageUploadBox';
import { CategoryPreviewModal } from './components/CategoryPreviewModal';
import { CategoryPublishModal } from './components/CategoryPublishModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

export const PREDEFINED_CATEGORIES = [
  { value: 'Solo', label: 'SOLO', slug: 'solo', defaultDesc: 'Solo tournament matches with per-kill bounties.' },
  { value: 'Duo', label: 'DUO', slug: 'duo', defaultDesc: '2-player team tactical battle royale matches.' },
  { value: 'Classic Squad', label: 'CLASSIC SQUAD', slug: 'classic-squad', defaultDesc: '4-player squad classic championship battles.' },
  { value: '2v2 Lone Wolf', label: '2V2 LONE WOLF', slug: '2v2-lone-wolf', defaultDesc: 'Fast-paced intense 2v2 iron cage combat showdowns.' },
  { value: 'BR Match', label: 'BR MATCH', slug: 'br-match', defaultDesc: 'Full 48-player battle royale survival tournaments.' },
  { value: 'Custom Match', label: 'CUSTOM MATCH', slug: 'custom-match', defaultDesc: 'Special custom room tournaments and private showdowns.' },
] as const;

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'PUBLISHED' | 'DRAFT'>('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);

  // Dedicated Image Studio Modal
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageCategory, setImageCategory] = useState<CategoryInfo | null>(null);

  // Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewCategory, setPreviewCategory] = useState<CategoryInfo | null>(null);

  // Publish / Unpublish Modal
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishCategory, setPublishCategory] = useState<CategoryInfo | null>(null);
  const [publishMode, setPublishMode] = useState<'publish' | 'unpublish'>('publish');
  const [publishLoading, setPublishLoading] = useState(false);

  // Delete Confirm Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ category: CategoryInfo; type: 'image' | 'category' } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatShortName, setNewCatShortName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [newCatOrder, setNewCatOrder] = useState<number>(1);
  const [newCatStatus, setNewCatStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [newCatSelectedFile, setNewCatSelectedFile] = useState<File | null>(null);
  const [newCatFilePreview, setNewCatFilePreview] = useState<string | null>(null);
  const [newCatFileDimensions, setNewCatFileDimensions] = useState<{ width: number; height: number } | null>(null);
  const [newCatFileError, setNewCatFileError] = useState<string | null>(null);
  const newCatFileInputRef = useRef<HTMLInputElement>(null);

  // Edit Category Form State
  const [editCatName, setEditCatName] = useState('');
  const [editCatShortName, setEditCatShortName] = useState('');
  const [editCatDescription, setEditCatDescription] = useState('');
  const [editCatOrder, setEditCatOrder] = useState<number>(1);
  const [editCatStatus, setEditCatStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editCatPublished, setEditCatPublished] = useState(true);

  // Form submitting states
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Notification / Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<CategoryInfo[]>('/api/admin/categories');
      if (res.ok && Array.isArray(res.data)) {
        const sorted = res.data.sort((a, b) => (a.order || 0) - (b.order || 0));
        setCategories(sorted);
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Stats
  const totalCategories = categories.length;
  const publishedCount = categories.filter(c => c.published || c.isPublished).length;
  const draftCount = categories.filter(c => c.draftImage && (!c.published || c.draftImage !== c.publishedImage)).length;
  const activeCount = categories.filter(c => c.isActive !== false && c.active !== false).length;

  // File validation for New Category modal
  const handleValidateNewCatFile = (file: File) => {
    setNewCatFileError(null);
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    if (!allowedMimeTypes.includes(file.type.toLowerCase()) && !allowedExtensions.includes(ext)) {
      setNewCatFileError('Invalid image format. Allowed: JPG, JPEG, PNG, WEBP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setNewCatFileError(`Image is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Max allowed size is 10MB.`);
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setNewCatFileDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = blobUrl;

    setNewCatSelectedFile(file);
    setNewCatFilePreview(blobUrl);
  };

  const handleClearNewCatFile = () => {
    if (newCatFilePreview) {
      URL.revokeObjectURL(newCatFilePreview);
    }
    setNewCatSelectedFile(null);
    setNewCatFilePreview(null);
    setNewCatFileDimensions(null);
    setNewCatFileError(null);
    if (newCatFileInputRef.current) {
      newCatFileInputRef.current.value = '';
    }
  };

  // Open New Category Modal
  const handleOpenCreateModal = () => {
    const defaultOption = PREDEFINED_CATEGORIES.find(
      p => !categories.some(c => (c.title || c.name || '').trim().toLowerCase() === p.value.toLowerCase())
    ) || PREDEFINED_CATEGORIES[0];

    setNewCatName(defaultOption.value);
    setNewCatShortName(defaultOption.slug);
    setNewCatDescription(defaultOption.defaultDesc);
    setNewCatOrder(categories.length + 1);
    setNewCatStatus('ACTIVE');
    handleClearNewCatFile();
    setCreateModalOpen(true);
  };

  const handleSelectNewCategory = (val: string) => {
    setNewCatName(val);
    const found = PREDEFINED_CATEGORIES.find(
      p => p.value.toLowerCase() === val.toLowerCase() || p.label.toLowerCase() === val.toLowerCase()
    );
    if (found) {
      setNewCatShortName(found.slug);
      if (!newCatDescription || PREDEFINED_CATEGORIES.some(p => p.defaultDesc === newCatDescription)) {
        setNewCatDescription(found.defaultDesc);
      }
    } else {
      const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setNewCatShortName(slug);
    }
  };

  const handleSelectEditCategory = (val: string) => {
    setEditCatName(val);
    const found = PREDEFINED_CATEGORIES.find(
      p => p.value.toLowerCase() === val.toLowerCase() || p.label.toLowerCase() === val.toLowerCase()
    );
    if (found) {
      setEditCatShortName(found.slug);
    } else {
      const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setEditCatShortName(slug);
    }
  };

  // Submit New Category (Save or Save & Publish)
  const handleSaveNewCategory = async (publishImmediately: boolean) => {
    if (!newCatName.trim()) {
      setFeedback({ type: 'error', message: 'Category name is required.' });
      return;
    }

    // Check duplicate locally
    const duplicate = categories.find(c => 
      (c.title || c.name || '').trim().toLowerCase() === newCatName.trim().toLowerCase()
    );
    if (duplicate) {
      setFeedback({ type: 'error', message: `Category "${newCatName.trim()}" already exists.` });
      return;
    }

    setFormSubmitting(true);
    const token = getAuthToken();

    try {
      let fileData: string | undefined = undefined;
      if (newCatSelectedFile) {
        fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read image file data.'));
          reader.readAsDataURL(newCatSelectedFile);
        });
      }

      const payload = {
        name: newCatName.trim(),
        title: newCatName.trim(),
        shortName: (newCatShortName || newCatName).trim(),
        description: newCatDescription.trim(),
        order: Number(newCatOrder || categories.length + 1),
        isActive: newCatStatus === 'ACTIVE',
        active: newCatStatus === 'ACTIVE',
        publishImmediately,
        fileData,
        fileName: newCatSelectedFile?.name,
        fileType: newCatSelectedFile?.type
      };

      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create category.');

      setFeedback({
        type: 'success',
        message: publishImmediately 
          ? `✓ Category "${newCatName}" created and published to User Panel successfully!`
          : `✓ Category "${newCatName}" created successfully.`
      });

      setCreateModalOpen(false);
      handleClearNewCatFile();
      fetchCategories();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Category creation failed.' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Edit Category Modal
  const handleOpenEditModal = (c: CategoryInfo) => {
    setEditingCategory(c);
    setEditCatName(c.title || c.name || '');
    setEditCatShortName(c.shortName || c.title || c.name || '');
    setEditCatDescription(c.description || '');
    setEditCatOrder(c.order || 1);
    setEditCatStatus((c.isActive !== false && c.active !== false) ? 'ACTIVE' : 'INACTIVE');
    setEditCatPublished(Boolean(c.published || c.isPublished));
    setEditModalOpen(true);
  };

  // Submit Edit Category
  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    if (!editCatName.trim()) {
      setFeedback({ type: 'error', message: 'Category name is required.' });
      return;
    }

    setFormSubmitting(true);
    const token = getAuthToken();

    try {
      const payload = {
        name: editCatName.trim(),
        title: editCatName.trim(),
        shortName: editCatShortName.trim(),
        description: editCatDescription.trim(),
        order: Number(editCatOrder),
        isActive: editCatStatus === 'ACTIVE',
        active: editCatStatus === 'ACTIVE',
        published: editCatPublished,
        isPublished: editCatPublished
      };

      const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update category.');

      setFeedback({
        type: 'success',
        message: `✓ Category "${editCatName}" updated successfully.`
      });

      setEditModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Category update failed.' });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Image Studio Modal
  const handleOpenImageModal = (c: CategoryInfo) => {
    setImageCategory(c);
    setImageModalOpen(true);
  };

  // Handle Image Upload Success from ImageStudio
  const handleImageUploadSuccess = (updatedCat: CategoryInfo) => {
    setCategories(prev => prev.map(c => c.id === updatedCat.id ? { ...c, ...updatedCat } : c));
    if (imageCategory?.id === updatedCat.id) {
      setImageCategory(updatedCat);
    }
    setFeedback({
      type: 'success',
      message: `✓ Image for "${updatedCat.title}" uploaded and staged! Click "PUBLISH" to make it live on the User Panel.`
    });
  };

  // Publish / Unpublish Dialog trigger
  const handleOpenPublishModal = (c: CategoryInfo, mode: 'publish' | 'unpublish') => {
    setPublishCategory(c);
    setPublishMode(mode);
    setPublishModalOpen(true);
  };

  const handleConfirmPublishOrUnpublish = async () => {
    if (!publishCategory) return;
    setPublishLoading(true);

    const token = getAuthToken();
    const endpoint = publishMode === 'publish'
      ? `/api/admin/categories/${publishCategory.id}/publish-image`
      : `/api/admin/categories/${publishCategory.id}/unpublish-image`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed.');

      if (data.category) {
        setCategories(prev => prev.map(c => c.id === data.category.id ? { ...c, ...data.category } : c));
        if (imageCategory?.id === data.category.id) {
          setImageCategory(data.category);
        }
      }

      setFeedback({
        type: 'success',
        message: data.message || `✓ Category image status updated successfully!`
      });
      setPublishModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Action failed.' });
    } finally {
      setPublishLoading(false);
    }
  };

  // Delete Category or Image
  const handleOpenDeleteImageModal = (c: CategoryInfo) => {
    setDeleteTarget({ category: c, type: 'image' });
    setDeleteModalOpen(true);
  };

  const handleOpenDeleteCategoryModal = (c: CategoryInfo) => {
    setDeleteTarget({ category: c, type: 'category' });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    const token = getAuthToken();
    const { category, type } = deleteTarget;
    const url = type === 'image' 
      ? `/api/admin/categories/${category.id}/image`
      : `/api/admin/categories/${category.id}`;

    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed.');

      if (type === 'image' && data.category) {
        setCategories(prev => prev.map(c => c.id === data.category.id ? { ...c, ...data.category } : c));
        if (imageCategory?.id === data.category.id) {
          setImageCategory(data.category);
        }
        setFeedback({
          type: 'success',
          message: '✓ Category cover image deleted. Reverted to default artwork.'
        });
      } else {
        setCategories(prev => prev.filter(c => c.id !== category.id));
        if (imageCategory?.id === category.id) {
          setImageModalOpen(false);
          setImageCategory(null);
        }
        setFeedback({
          type: 'success',
          message: data.message || `✓ Category "${category.title || category.name}" deleted successfully.`
        });
      }

      setDeleteModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Deletion failed.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filtered categories
  const filteredCategories = categories.filter(c => {
    const title = (c.title || c.name || '').toLowerCase();
    const shortName = (c.shortName || '').toLowerCase();
    const desc = (c.description || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = title.includes(query) || shortName.includes(query) || desc.includes(query);

    if (!matchesSearch) return false;

    if (statusFilter === 'ACTIVE') return c.isActive !== false && c.active !== false;
    if (statusFilter === 'INACTIVE') return c.isActive === false || c.active === false;
    if (statusFilter === 'PUBLISHED') return c.published || c.isPublished;
    if (statusFilter === 'DRAFT') return c.draftImage && (!c.published || c.draftImage !== c.publishedImage);

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div 
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs font-bold transition-all border animate-in fade-in slide-in-from-top-4 max-w-md ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800' 
              : feedback.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/90 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
              : 'bg-blue-50 dark:bg-blue-950/90 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            {feedback.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
            {feedback.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button 
            type="button"
            onClick={() => setFeedback(null)} 
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP SECTION: CATEGORY MANAGEMENT HEADER & STATS */}
      <div className="bg-white dark:bg-[#0B132B] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Subtle Decorative Gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#176BFF]/10 via-[#00F0FF]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#176BFF]/10 dark:bg-[#00F0FF]/10 border border-[#176BFF]/20 dark:border-[#00F0FF]/20 flex items-center justify-center text-[#176BFF] dark:text-[#00F0FF]">
                <Grid className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#10213A] dark:text-white uppercase tracking-tight">
                  CATEGORY MANAGEMENT
                </h1>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Manage tournament game modes, upload cover artwork from device, and publish to User Panel.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={fetchCategories}
              disabled={loading}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              title="Refresh categories from database"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              id="admin-new-category-btn"
              onClick={handleOpenCreateModal}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#176BFF] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ NEW CATEGORY</span>
            </button>
          </div>
        </div>

        {/* Quick Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Total Categories
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-[#10213A] dark:text-white font-mono">{totalCategories}</span>
              <span className="text-[11px] font-bold text-slate-500">configured</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Live on User Panel
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{publishedCount}</span>
              <span className="text-[11px] font-bold text-emerald-600/80">published</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
              Staged Drafts
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{draftCount}</span>
              <span className="text-[11px] font-bold text-amber-600/80">pending publish</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#176BFF] dark:text-[#00F0FF] block">
              Active Status
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-[#176BFF] dark:text-[#00F0FF] font-mono">{activeCount}</span>
              <span className="text-[11px] font-bold text-slate-500">active</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0B132B] p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#10213A] dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#176BFF]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['ALL', 'ACTIVE', 'PUBLISHED', 'DRAFT', 'INACTIVE'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                statusFilter === filter
                  ? 'bg-[#176BFF] text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* CATEGORY LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            CATEGORY LIST ({filteredCategories.length})
          </h2>
          <span className="text-[11px] font-bold text-slate-400">
            Sorted by Display Order (Ascending)
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#176BFF] dark:text-[#00F0FF]" />
            <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#176BFF] dark:text-[#00F0FF] mx-auto">
              <Grid className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-black text-[#10213A] dark:text-white uppercase tracking-wider">
                No Categories Found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery || statusFilter !== 'ALL' 
                  ? 'No categories match your filter criteria.'
                  : 'Get started by creating your first Free Fire tournament category.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-2xl bg-[#176BFF] hover:bg-blue-600 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-blue-500/20 inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE FIRST CATEGORY</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCategories.map((c) => {
              const hasDraft = Boolean(c.draftImage && (!c.published || c.draftImage !== c.publishedImage));
              const isLive = Boolean(c.published || c.isPublished);
              const isActive = c.isActive !== false && c.active !== false;
              const displayImage = c.draftImage || c.publishedImage || c.coverImage || c.icon || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';

              return (
                <div
                  key={c.id}
                  id={`admin-category-card-${c.id}`}
                  className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  {/* Top Cover Image with Status Overlay */}
                  <div>
                    <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden group/img">
                      <img
                        src={displayImage}
                        alt={c.title || c.name}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Display Order Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-xs text-white text-[11px] font-mono font-black border border-white/10 shadow-md">
                          #{c.order || 1}
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-[#176BFF] text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                          {c.shortName || c.title || c.name}
                        </span>
                      </div>

                      {/* Live / Draft Status Badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {isLive ? (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md backdrop-blur-xs">
                            <Globe className="w-3 h-3" />
                            Live on User Panel
                          </span>
                        ) : hasDraft ? (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500/90 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md backdrop-blur-xs">
                            <Clock className="w-3 h-3" />
                            Draft (Unpublished)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-slate-700/90 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md backdrop-blur-xs">
                            <EyeOff className="w-3 h-3" />
                            Unpublished
                          </span>
                        )}
                      </div>

                      {/* Quick Cover Image Change Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                        <button
                          type="button"
                          onClick={() => handleOpenImageModal(c)}
                          className="px-4 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 text-[#10213A] dark:text-white text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 hover:scale-105 transition-transform cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#176BFF]" />
                          <span>IMAGE STUDIO</span>
                        </button>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-black text-[#10213A] dark:text-white uppercase tracking-tight">
                            {c.title || c.name}
                          </h3>
                          <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                            Slug: {c.slug || c.shortName || (c.title || '').toLowerCase()}
                          </span>
                        </div>

                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          isActive
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed min-h-[32px]">
                        {c.description || 'No description provided.'}
                      </p>

                      {/* Tournament Count & Metadata */}
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1 font-bold text-[#176BFF] dark:text-[#00F0FF]">
                          <Sparkles className="w-3.5 h-3.5" />
                          {c.count || 0} Active Tournaments
                        </span>
                        <span className="font-mono text-[10px]">
                          Order: #{c.order || 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Suite (EDIT, IMAGE, PREVIEW, PUBLISH/UNPUBLISH, DELETE) */}
                  <div className="p-4 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        id={`edit-category-btn-${c.id}`}
                        onClick={() => handleOpenEditModal(c)}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#10213A] dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                        title="Edit Category Details"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                        <span>EDIT</span>
                      </button>

                      <button
                        type="button"
                        id={`image-category-btn-${c.id}`}
                        onClick={() => handleOpenImageModal(c)}
                        className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[#176BFF] dark:text-[#00F0FF] border border-blue-200 dark:border-blue-900/40 text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                        title="Manage Cover Artwork"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>IMAGE</span>
                      </button>

                      <button
                        type="button"
                        id={`preview-category-btn-${c.id}`}
                        onClick={() => {
                          setPreviewCategory(c);
                          setPreviewModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                        title="Preview Live Card Viewports"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isLive ? (
                        <button
                          type="button"
                          id={`unpublish-category-btn-${c.id}`}
                          onClick={() => handleOpenPublishModal(c, 'unpublish')}
                          className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                          title="Unpublish from User Panel"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>UNPUBLISH</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          id={`publish-category-btn-${c.id}`}
                          onClick={() => handleOpenPublishModal(c, 'publish')}
                          className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                          title="Publish to User Panel"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>PUBLISH</span>
                        </button>
                      )}

                      <button
                        type="button"
                        id={`delete-category-btn-${c.id}`}
                        onClick={() => handleOpenDeleteCategoryModal(c)}
                        className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 transition-all cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: NEW CATEGORY FORM MODAL */}
      {/* ============================================================ */}
      {createModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !formSubmitting) setCreateModalOpen(false);
          }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#176BFF] dark:text-[#00F0FF]">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#10213A] dark:text-white uppercase tracking-tight">
                    NEW CATEGORY
                  </h3>
                  <p className="text-xs text-slate-400">
                    Create a tournament mode and optionally upload its cover artwork.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                disabled={formSubmitting}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Category Name Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black uppercase text-slate-400">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-black uppercase text-[#176BFF] dark:text-[#00F0FF] tracking-wider">
                    Preset Game Mode
                  </span>
                </div>
                <select
                  id="admin-category-name-select"
                  required
                  value={newCatName}
                  onChange={(e) => handleSelectNewCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF] cursor-pointer"
                >
                  {PREDEFINED_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value} className="bg-white dark:bg-slate-900 text-[#10213A] dark:text-white font-bold py-1">
                      {cat.label} ({cat.value})
                    </option>
                  ))}
                </select>
              </div>

              {/* Short Name & Display Order & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                    Short Name / Slug
                  </label>
                  <input
                    type="text"
                    value={newCatShortName}
                    onChange={(e) => setNewCatShortName(e.target.value)}
                    placeholder="e.g. Solo"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newCatOrder}
                    onChange={(e) => setNewCatOrder(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={newCatStatus}
                    onChange={(e) => setNewCatStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                  Category Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  placeholder="e.g. Solo tournament matches with per-kill bounties."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF]"
                />
              </div>

              {/* REAL CATEGORY COVER IMAGE UPLOAD BOX */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-black uppercase text-slate-400">
                  Category Cover Image (Device Upload)
                </label>

                {/* Hidden Native File Input */}
                <input
                  type="file"
                  ref={newCatFileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleValidateNewCatFile(e.target.files[0]);
                    }
                  }}
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="hidden"
                  id="new-category-file-picker"
                />

                {newCatSelectedFile ? (
                  /* File Selected Preview Box */
                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-900 border border-blue-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-black text-[#10213A] dark:text-white">
                        <FileImage className="w-4 h-4 text-[#176BFF]" />
                        <span>{newCatSelectedFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearNewCatFile}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800">
                      {newCatFilePreview && (
                        <img
                          src={newCatFilePreview}
                          alt="Category Cover Preview"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white">
                        {newCatFileDimensions ? `${newCatFileDimensions.width} × ${newCatFileDimensions.height} px` : 'Analyzing...'} • {(newCatSelectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => newCatFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                      >
                        CHANGE IMAGE
                      </button>
                      <button
                        type="button"
                        onClick={handleClearNewCatFile}
                        className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold"
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty Dropzone Clickable Area */
                  <div
                    onClick={() => newCatFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#176BFF] hover:bg-blue-50/30 dark:hover:bg-slate-800/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#176BFF] dark:text-[#00F0FF] mx-auto">
                      <Plus className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#10213A] dark:text-white uppercase tracking-wider">
                        + UPLOAD CATEGORY COVER IMAGE
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Click to browse Gallery / Files (JPG, JPEG, PNG, WEBP • Max 10MB)
                      </p>
                    </div>
                  </div>
                )}

                {newCatFileError && (
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {newCatFileError}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons: SAVE CATEGORY, SAVE & PUBLISH, CANCEL */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                disabled={formSubmitting}
                className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="button"
                id="admin-save-category-draft-btn"
                onClick={() => handleSaveNewCategory(false)}
                disabled={formSubmitting}
                className="px-5 py-3 rounded-2xl border border-[#176BFF]/30 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-[#176BFF] dark:text-[#00F0FF] text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                {formSubmitting ? 'SAVING...' : 'SAVE CATEGORY'}
              </button>

              <button
                type="button"
                id="admin-save-and-publish-category-btn"
                onClick={() => handleSaveNewCategory(true)}
                disabled={formSubmitting}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                {formSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>SAVING & PUBLISHING...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>SAVE & PUBLISH</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: EDIT CATEGORY MODAL */}
      {/* ============================================================ */}
      {editModalOpen && editingCategory && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget && !formSubmitting) setEditModalOpen(false);
          }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#176BFF] dark:text-[#00F0FF]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#10213A] dark:text-white uppercase tracking-tight">
                    EDIT CATEGORY
                  </h3>
                  <p className="text-xs text-slate-400">
                    Modify tournament mode details and parameters.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                disabled={formSubmitting}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEditCategory} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black uppercase text-slate-400">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-black uppercase text-[#176BFF] dark:text-[#00F0FF] tracking-wider">
                    Preset Game Mode
                  </span>
                </div>
                <select
                  id="admin-edit-category-name-select"
                  required
                  value={editCatName}
                  onChange={(e) => handleSelectEditCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF] cursor-pointer"
                >
                  {!PREDEFINED_CATEGORIES.some(p => p.value.toLowerCase() === editCatName.toLowerCase()) && editCatName && (
                    <option value={editCatName} className="bg-white dark:bg-slate-900 text-[#10213A] dark:text-white font-bold">
                      {editCatName.toUpperCase()} ({editCatName})
                    </option>
                  )}
                  {PREDEFINED_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value} className="bg-white dark:bg-slate-900 text-[#10213A] dark:text-white font-bold py-1">
                      {cat.label} ({cat.value})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                    Short Name / Slug
                  </label>
                  <input
                    type="text"
                    value={editCatShortName}
                    onChange={(e) => setEditCatShortName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editCatOrder}
                    onChange={(e) => setEditCatOrder(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editCatDescription}
                  onChange={(e) => setEditCatDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                    Category Status
                  </label>
                  <select
                    value={editCatStatus}
                    onChange={(e) => setEditCatStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                    Publish Status
                  </label>
                  <select
                    value={editCatPublished ? 'PUBLISHED' : 'UNPUBLISHED'}
                    onChange={(e) => setEditCatPublished(e.target.value === 'PUBLISHED')}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF]"
                  >
                    <option value="PUBLISHED">PUBLISHED (Live)</option>
                    <option value="UNPUBLISHED">UNPUBLISHED (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#176BFF] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>SAVING CHANGES...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>SAVE CHANGES</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: CATEGORY COVER IMAGE STUDIO MODAL */}
      {/* ============================================================ */}
      {imageModalOpen && imageCategory && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setImageModalOpen(false);
          }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-in zoom-in-95"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#176BFF] dark:text-[#00F0FF]">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#10213A] dark:text-white uppercase tracking-tight">
                    CATEGORY COVER IMAGE
                  </h3>
                  <p className="text-xs text-slate-400">
                    {imageCategory.title || imageCategory.name} • Direct Device Upload & Publishing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Upload Box Component */}
            <CategoryImageUploadBox
              category={imageCategory}
              onUploadSuccess={handleImageUploadSuccess}
              onPublishClick={() => handleOpenPublishModal(imageCategory, 'publish')}
              onPreviewClick={() => {
                setPreviewCategory(imageCategory);
                setPreviewModalOpen(true);
              }}
              onDeleteClick={() => handleOpenDeleteImageModal(imageCategory)}
            />

            <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: MULTI-VIEWPORT PREVIEW MODAL */}
      {/* ============================================================ */}
      <CategoryPreviewModal
        isOpen={previewModalOpen}
        category={previewCategory}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewCategory(null);
        }}
        onPublishClick={
          previewCategory
            ? () => handleOpenPublishModal(previewCategory, 'publish')
            : undefined
        }
      />

      {/* ============================================================ */}
      {/* MODAL 5: PUBLISH / UNPUBLISH CONFIRMATION MODAL */}
      {/* ============================================================ */}
      <CategoryPublishModal
        isOpen={publishModalOpen}
        category={publishCategory}
        mode={publishMode}
        loading={publishLoading}
        onConfirm={handleConfirmPublishOrUnpublish}
        onClose={() => {
          if (!publishLoading) {
            setPublishModalOpen(false);
            setPublishCategory(null);
          }
        }}
      />

      {/* ============================================================ */}
      {/* MODAL 6: SAFE DELETE CONFIRMATION MODAL */}
      {/* ============================================================ */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={deleteTarget?.type === 'image' ? 'Delete Category Cover Image?' : 'Delete Category Permanently?'}
        message={
          deleteTarget?.type === 'image'
            ? 'Are you sure you want to delete this category cover image? It will be removed from the User Panel and revert to default tournament artwork.'
            : 'Are you sure you want to delete this category? If tournaments are using this category, deletion will be blocked safely.'
        }
        itemType={deleteTarget?.type === 'image' ? 'Category Cover Image' : 'Tournament Category'}
        itemName={deleteTarget?.category.title || deleteTarget?.category.name}
        loading={deleteLoading}
        confirmText={deleteTarget?.type === 'image' ? 'Yes, Delete Cover Image' : 'Yes, Delete Category'}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteModalOpen(false);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};

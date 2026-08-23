import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Plus,
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Layers,
  FileImage,
  Info,
  Maximize2,
  Globe,
  Eye,
  Trash2,
  Check
} from 'lucide-react';
import { getAuthToken } from '../../lib/api';
import { CategoryInfo } from '../../types';

interface CategoryImageUploadBoxProps {
  category: CategoryInfo;
  onUploadSuccess: (updatedCategory: CategoryInfo) => void;
  onPublishClick?: () => void;
  onPreviewClick?: () => void;
  onDeleteClick?: () => void;
  disabled?: boolean;
}

export const CategoryImageUploadBox: React.FC<CategoryImageUploadBoxProps> = ({
  category,
  onUploadSuccess,
  onPublishClick,
  onPreviewClick,
  onDeleteClick,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const [fileDimensions, setFileDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  const validateAndSelectFile = (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Extension and MIME validation
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isMimeValid = allowedMimeTypes.includes(file.type.toLowerCase()) || allowedExtensions.includes(ext);

    if (!isMimeValid) {
      setErrorMsg('Invalid image format. Only JPG, JPEG, PNG, and WEBP files are supported.');
      return;
    }

    // 2. Max file size: 10MB
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMsg(`Image file is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maximum allowed size is 10MB.`);
      return;
    }

    if (file.size === 0) {
      setErrorMsg('The selected image file is empty or corrupted.');
      return;
    }

    // 3. Create blob preview and calculate image dimensions
    const blobUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setFileDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      setErrorMsg('Unable to read or decode image file.');
    };
    img.src = blobUrl;

    setSelectedFile(file);
    setSelectedFilePreview(blobUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleRemoveSelected = () => {
    if (selectedFilePreview) {
      URL.revokeObjectURL(selectedFilePreview);
    }
    setSelectedFile(null);
    setSelectedFilePreview(null);
    setFileDimensions(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(10);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Convert file to Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image file data.'));
        reader.readAsDataURL(selectedFile);
      });

      setUploadProgress(45);

      const token = getAuthToken();
      const payload = {
        fileData: base64Data,
        fileName: selectedFile.name,
        fileType: selectedFile.type || 'image/jpeg',
        fileSize: selectedFile.size,
        width: fileDimensions?.width,
        height: fileDimensions?.height,
        dimensions: fileDimensions ? `${fileDimensions.width} × ${fileDimensions.height} px` : undefined
      };

      setUploadProgress(70);

      const res = await fetch(`/api/admin/categories/${category.id}/upload-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Category cover image upload failed.');
      }

      setUploadProgress(100);
      setSuccessMsg('✓ Category cover image uploaded successfully.');
      
      // Clear local file selection state since it is now staged in database
      handleRemoveSelected();

      if (data.category) {
        onUploadSuccess(data.category);
      }
    } catch (err: any) {
      setErrorMsg(err.message || '✕ Category cover image upload failed.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const hasUploadedCover = Boolean(category.draftImage || category.uploadedImage || (category.publishedImage && category.publishedImage !== ''));
  const isPublished = Boolean(category.published || category.isPublished);
  const currentCoverUrl = category.draftImage || category.uploadedImage || category.publishedImage || category.coverImage;

  return (
    <div className="space-y-4">
      {/* Hidden Native File Input (Always accessible for Gallery / Files / File Picker) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        id={`category-image-file-input-${category.id}`}
        disabled={disabled || isUploading}
      />

      {/* STATE 1: Local Device File Selected -> Real Preview & Upload Action */}
      {selectedFile ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-[#176BFF]/40 dark:border-[#00F0FF]/40 p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileImage className="w-4 h-4 text-[#176BFF] dark:text-[#00F0FF]" />
              <span className="text-xs font-black text-[#10213A] dark:text-white uppercase tracking-wider">
                Selected Device File (Pending Upload)
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveSelected}
              disabled={isUploading}
              className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              title="Cancel Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* Image Preview */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[16/10] sm:aspect-video border border-slate-200 dark:border-slate-800 group shadow-inner">
              {selectedFilePreview && (
                <img
                  src={selectedFilePreview}
                  alt="Selected Preview"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                <span className="text-[10px] font-mono text-white/90 font-bold bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  {fileDimensions ? `${fileDimensions.width} × ${fileDimensions.height} px` : 'Analyzing...'}
                </span>
              </div>
            </div>

            {/* File Specs Info */}
            <div className="sm:col-span-2 space-y-2 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 font-medium">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>File Name:</span>
                  <span className="font-mono font-bold text-[#10213A] dark:text-white truncate max-w-[180px]">
                    {selectedFile.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>File Type:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {selectedFile.type || 'image/jpeg'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>File Size:</span>
                  <span className="font-mono font-bold text-[#176BFF] dark:text-[#00F0FF]">
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Dimensions:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {fileDimensions ? `${fileDimensions.width} × ${fileDimensions.height} px` : 'Calculating...'}
                  </span>
                </div>
              </div>

              {/* Upload != Publish Notice */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>Upload ≠ Publish:</strong> Uploading will save this image to server storage. Click <strong>PUBLISH</strong> to make it live for players.
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons as specified in Requirement #4 */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              CHANGE IMAGE
            </button>
            <button
              type="button"
              onClick={handleRemoveSelected}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-bold transition-all cursor-pointer"
            >
              REMOVE
            </button>
            <button
              type="button"
              id={`upload-category-image-btn-${category.id}`}
              onClick={handleUpload}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#176BFF] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>UPLOAD IMAGE</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : hasUploadedCover ? (
        /* STATE 2: Image Already Uploaded/Staged -> Shows Image Preview inside box with controls */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-black text-[#10213A] dark:text-white uppercase tracking-wider">
                CATEGORY COVER IMAGE
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                isPublished 
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                  : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              }`}>
                <Check className="w-3 h-3" />
                {isPublished ? '✓ Live on User Panel' : '✓ Uploaded (Draft)'}
              </span>
            </div>
          </div>

          {/* Large Clickable Cover Image Box */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[16/9] sm:aspect-[21/9] border border-slate-200 dark:border-slate-800 shadow-inner group cursor-pointer"
            title="Click to replace image from device"
          >
            <img
              src={currentCoverUrl}
              alt={category.title || category.name}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
              <Upload className="w-8 h-8 mb-1 animate-bounce" />
              <span className="text-xs font-black uppercase tracking-wider bg-black/70 px-3 py-1.5 rounded-xl">
                Click to Select New Image
              </span>
            </div>
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-xl text-[10px] font-black text-white uppercase tracking-wider">
              {category.title || category.name}
            </div>
          </div>

          {/* Action Buttons: REPLACE IMAGE, PREVIEW, PUBLISH, DELETE */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#176BFF] dark:text-[#00F0FF] border border-blue-200 dark:border-blue-900/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>REPLACE IMAGE</span>
              </button>

              {onPreviewClick && (
                <button
                  type="button"
                  onClick={onPreviewClick}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>PREVIEW</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onPublishClick && !isPublished && (
                <button
                  type="button"
                  onClick={onPublishClick}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>PUBLISH</span>
                </button>
              )}

              {onDeleteClick && (
                <button
                  type="button"
                  onClick={onDeleteClick}
                  className="px-3.5 py-2.5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 transition-all cursor-pointer"
                  title="Delete Custom Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* STATE 3: Empty State -> Large Clickable Image Box with "+" and "UPLOAD CATEGORY COVER IMAGE" */
        <div
          id="category-image-upload-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-[#176BFF] bg-blue-50/80 dark:bg-blue-950/40 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 hover:border-[#176BFF] hover:bg-blue-50/30 dark:hover:bg-slate-800/60'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#176BFF] dark:text-[#00F0FF] shadow-sm">
              <Plus className="w-8 h-8 font-black stroke-[2.5]" />
            </div>

            <div>
              <p className="text-base font-black text-[#10213A] dark:text-white uppercase tracking-wider">
                UPLOAD CATEGORY COVER IMAGE
              </p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                Click here to browse Gallery / Files or Drag & drop from device
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-4 py-2 rounded-2xl bg-[#176BFF] hover:bg-blue-600 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all">
                + SELECT FROM DEVICE
              </span>
            </div>

            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Supported: JPG, JPEG, PNG, WEBP • Max Size: 10MB • Recommended: 800 × 500 px
            </p>
          </div>
        </div>
      )}

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="space-y-1.5 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
          <div className="flex justify-between text-[11px] font-black text-blue-700 dark:text-blue-300">
            <span>Uploading image to server storage...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#176BFF] transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};

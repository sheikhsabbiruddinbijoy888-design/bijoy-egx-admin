import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Play, 
  Pause, 
  Trash2,
  FileVideo,
  FileCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import { getAuthToken } from '../lib/api';

interface MediaUploadBoxProps {
  label: string;
  mediaType: 'image' | 'video';
  currentUrl?: string;
  onUploadComplete: (result: { url: string; fileName: string; fileType: 'image' | 'video'; durationSeconds?: number }) => void;
  onRemove?: () => void;
  maxDurationSeconds?: number; // default 300 (5 minutes) for video
  maxSizeBytes?: number;       // default 1.5GB
  aspectRatio?: string;        // e.g. "aspect-video", "aspect-[16/9]"
  helperText?: string;
  required?: boolean;
}

export const MediaUploadBox: React.FC<MediaUploadBoxProps> = ({
  label,
  mediaType,
  currentUrl,
  onUploadComplete,
  onRemove,
  maxDurationSeconds = 300, // 5 minutes max
  maxSizeBytes = 1.5 * 1024 * 1024 * 1024, // 1.5GB
  aspectRatio = 'aspect-video',
  helperText,
  required = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentUrl || '');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  useEffect(() => {
    if (currentUrl && currentUrl !== previewUrl && !selectedFile) {
      setPreviewUrl(currentUrl);
    }
  }, [currentUrl]);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setUploadProgress(0);

    // 1. MIME validation
    if (mediaType === 'image') {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validImageTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
        setErrorMsg('Invalid file format. Please upload JPG, PNG, or WEBP image.');
        return;
      }
    } else if (mediaType === 'video') {
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/ogg'];
      if (!validVideoTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
        setErrorMsg('Invalid file format. Please upload MP4, WEBM, or MOV video.');
        return;
      }
    }

    // 2. File size validation
    if (file.size > maxSizeBytes) {
      const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
      setErrorMsg(`File is too large. Maximum allowed size is ${maxMb}MB.`);
      return;
    }

    // 3. For video: validate duration
    const localBlobUrl = URL.createObjectURL(file);

    if (mediaType === 'video') {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = localBlobUrl;

      tempVideo.onloadedmetadata = () => {
        const duration = Math.round(tempVideo.duration);
        setVideoDuration(duration);

        if (duration > maxDurationSeconds) {
          setErrorMsg('Banner video cannot exceed 5 minutes.');
          setSelectedFile(null);
          URL.revokeObjectURL(localBlobUrl);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        setSelectedFile(file);
        setPreviewUrl(localBlobUrl);
      };

      tempVideo.onerror = () => {
        // Fallback if metadata fails to decode
        setSelectedFile(file);
        setPreviewUrl(localBlobUrl);
      };
    } else {
      setSelectedFile(file);
      setPreviewUrl(localBlobUrl);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setUploadProgress(5);
    setUploadStatus('Preparing upload...');

    try {
      const token = getAuthToken();
      const isVideo = mediaType === 'video';
      const chunkSize = 2 * 1024 * 1024; // 2MB chunk

      // If file is small (< 5MB), do direct base64 upload
      if (selectedFile.size < 5 * 1024 * 1024) {
        setUploadStatus('Uploading file...');
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(selectedFile);
        const base64Data = await base64Promise;

        setUploadProgress(50);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            fileName: selectedFile.name,
            fileType: isVideo ? 'video' : 'image',
            fileData: base64Data,
            durationSeconds: videoDuration || undefined
          })
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Upload failed');
        }

        setUploadProgress(100);
        setSuccessMsg(`${isVideo ? 'Video' : 'Image'} uploaded successfully!`);
        setPreviewUrl(json.url);
        setSelectedFile(null);
        onUploadComplete({
          url: json.url,
          fileName: json.fileName,
          fileType: isVideo ? 'video' : 'image',
          durationSeconds: videoDuration || json.durationSeconds
        });
        return;
      }

      // Large file: Chunked upload
      setUploadStatus('Initializing chunked upload...');
      const totalChunks = Math.ceil(selectedFile.size / chunkSize);

      const initRes = await fetch('/api/upload/chunk-init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: isVideo ? 'video' : 'image',
          totalChunks,
          fileSize: selectedFile.size
        })
      });

      const initJson = await initRes.json();
      if (!initRes.ok || !initJson.success) {
        throw new Error(initJson.error || 'Failed to initialize chunk upload');
      }

      const uploadId = initJson.uploadId;

      // Upload chunks sequentially with real progress
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, selectedFile.size);
        const chunkBlob = selectedFile.slice(start, end);

        setUploadStatus(`Uploading chunk ${i + 1} of ${totalChunks}...`);

        const chunkBase64 = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(chunkBlob);
        });

        const chunkRes = await fetch('/api/upload/chunk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            uploadId,
            chunkIndex: i,
            chunkData: chunkBase64
          })
        });

        if (!chunkRes.ok) {
          throw new Error(`Failed to upload chunk ${i + 1}`);
        }

        const percent = Math.round(((i + 1) / totalChunks) * 85);
        setUploadProgress(percent);
      }

      // Complete chunk assembly
      setUploadStatus('Assembling & optimizing media on server...');
      setUploadProgress(90);

      const compRes = await fetch('/api/upload/chunk-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          uploadId,
          fileName: selectedFile.name,
          fileType: isVideo ? 'video' : 'image',
          durationSeconds: videoDuration || undefined
        })
      });

      const compJson = await compRes.json();
      if (!compRes.ok || !compJson.success) {
        throw new Error(compJson.error || 'Failed to assemble file');
      }

      setUploadProgress(100);
      setSuccessMsg(`${isVideo ? 'Video' : 'Image'} uploaded and saved!`);
      setPreviewUrl(compJson.url);
      setSelectedFile(null);
      onUploadComplete({
        url: compJson.url,
        fileName: compJson.fileName,
        fileType: isVideo ? 'video' : 'image',
        durationSeconds: videoDuration || compJson.durationSeconds
      });

    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMsg(err.message || 'Upload failed. Please check network connection and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setVideoDuration(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onRemove) onRemove();
  };

  const toggleVideoPlayback = () => {
    if (!videoPreviewRef.current) return;
    if (videoPreviewRef.current.paused) {
      videoPreviewRef.current.play();
      setIsPlayingPreview(true);
    } else {
      videoPreviewRef.current.pause();
      setIsPlayingPreview(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black uppercase tracking-wider text-[#10213A] dark:text-slate-200">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {mediaType === 'video' && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#176BFF] border border-blue-200 dark:border-blue-800 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Max {Math.floor(maxDurationSeconds / 60)} Mins
          </span>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov' : 'image/jpeg,image/png,image/webp,image/jpg,.jpg,.jpeg,.png,.webp'}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Main Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!previewUrl && !isUploading) {
            fileInputRef.current?.click();
          }
        }}
        className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
          isDragging 
            ? 'border-[#176BFF] bg-blue-50/50 dark:bg-blue-950/40 ring-4 ring-blue-500/20' 
            : previewUrl 
              ? 'border-slate-200 dark:border-slate-800 bg-slate-900' 
              : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-850 hover:border-[#176BFF] cursor-pointer'
        } ${aspectRatio} flex flex-col items-center justify-center`}
      >
        {/* State A: Has Preview or Selected File */}
        {previewUrl ? (
          <div className="absolute inset-0 w-full h-full group">
            {mediaType === 'video' ? (
              <div className="relative w-full h-full bg-black flex items-center justify-center">
                <video
                  ref={videoPreviewRef}
                  src={previewUrl || undefined}
                  className="w-full h-full object-contain"
                  playsInline
                  onError={() => setIsPlayingPreview(false)}
                  onEnded={() => setIsPlayingPreview(false)}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVideoPlayback();
                  }}
                  className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 z-10"
                >
                  {isPlayingPreview ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            )}

            {/* Overlay action bar on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 z-20 pointer-events-none">
              <div className="flex items-center justify-between pointer-events-auto">
                <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-white/20">
                  {mediaType === 'video' ? <FileVideo className="w-3.5 h-3.5 text-blue-400" /> : <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />}
                  {selectedFile ? 'Ready to Upload' : 'Stored in Database'}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-md"
                  title="Remove media"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 pointer-events-auto">
                {selectedFile && (
                  <div className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 text-white text-xs">
                    <p className="font-bold truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-300">
                      {formatFileSize(selectedFile.size)} {videoDuration && `• ${formatSeconds(videoDuration)}`}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black backdrop-blur-md flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Replace
                  </button>

                  {selectedFile && !isUploading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        uploadFile();
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#176BFF] hover:bg-blue-600 text-white text-xs font-black shadow-lg shadow-blue-500/30 flex items-center justify-center gap-1.5 transition-all hover:scale-102"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload & Save
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* State B: Empty State / Call to Action */
          <div className="p-6 text-center space-y-3 pointer-events-none">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-[#176BFF] shadow-xs group-hover:scale-110 transition-transform">
              {mediaType === 'video' ? <VideoIcon className="w-7 h-7" /> : <ImageIcon className="w-7 h-7" />}
            </div>

            <div>
              <p className="text-sm font-black text-[#10213A] dark:text-white">
                Click to select {mediaType === 'video' ? 'a video' : 'an image'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                or drag & drop device file here
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
              {mediaType === 'video' ? 'MP4, WEBM (Max 5m / 1.5GB)' : 'JPG, PNG, WEBP (Max 20MB)'}
            </div>
          </div>
        )}

        {/* Uploading Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white z-30 space-y-3">
            <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
            <div className="text-center space-y-1 w-full max-w-xs">
              <p className="text-xs font-black uppercase tracking-wider text-blue-400">
                {uploadStatus || 'Uploading...'}
              </p>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[11px] font-mono text-slate-400">{uploadProgress}% Complete</p>
            </div>
          </div>
        )}
      </div>

      {/* Manual Upload Button when file selected but not yet uploaded */}
      {selectedFile && !isUploading && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-4 h-4 text-[#176BFF] shrink-0" />
            <div className="truncate text-xs">
              <p className="font-bold text-[#10213A] dark:text-white truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-slate-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={uploadFile}
            className="px-4 py-1.5 rounded-xl bg-[#176BFF] hover:bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            Save File
          </button>
        </div>
      )}

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {helperText && !errorMsg && !successMsg && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { 
  Music, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Play, 
  Pause, 
  Trash2, 
  Volume2, 
  VolumeX,
  FileAudio,
  Radio,
  Sparkles,
  FolderOpen
} from 'lucide-react';
import { getAuthToken } from '../lib/api';

interface AudioUploadBoxProps {
  label: string;
  currentUrl?: string;
  onUploadComplete: (result: { url: string; fileName: string; durationSeconds?: number }) => void;
  onRemove?: () => void;
  maxSizeBytes?: number; // default 100MB
  helperText?: string;
  required?: boolean;
}

export const AudioUploadBox: React.FC<AudioUploadBoxProps> = ({
  label,
  currentUrl,
  onUploadComplete,
  onRemove,
  maxSizeBytes = 100 * 1024 * 1024, // 100MB limit for up to 10-min HQ audio
  helperText,
  required = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>(currentUrl || '');
  const [customLinkInput, setCustomLinkInput] = useState<string>('');
  const [showCustomLinkInput, setShowCustomLinkInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (currentUrl && currentUrl !== audioUrl && !selectedFile) {
      setAudioUrl(currentUrl);
    }
  }, [currentUrl]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          // ignore
        }
      }
    };
  }, [audioUrl]);

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

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const processSelectedFile = (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const validExtensions = ['.mp3', '.wav', '.aac', '.ogg', '.m4a', '.flac'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    const isValidMime = file.type.startsWith('audio/') || 
      file.type === 'audio/mpeg' || 
      file.type === 'audio/mp3' ||
      file.type === 'audio/ogg' || 
      file.type === 'audio/wav' || 
      file.type === 'audio/aac' ||
      file.type === 'audio/x-m4a';

    if (!hasValidExt && !isValidMime) {
      setErrorMsg('Invalid audio file format. Allowed types: MP3, WAV, AAC, OGG, M4A, FLAC.');
      return;
    }

    if (file.size > maxSizeBytes) {
      setErrorMsg(`File size exceeds maximum limit (${Math.round(maxSizeBytes / (1024 * 1024))}MB).`);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAudioUrl(objectUrl);

    // Read audio duration and check 10-minute limit
    const tempAudio = new Audio();
    tempAudio.src = objectUrl;
    tempAudio.onloadedmetadata = () => {
      const dur = tempAudio.duration;
      setDuration(dur);
      if (dur > 600) {
        setErrorMsg('Audio track exceeds maximum allowed 10 minutes (600 seconds). Please select a shorter track.');
        setIsUploading(false);
        return;
      }
      // Start upload with verified duration
      performUpload(file, dur);
    };

    tempAudio.onerror = () => {
      // Fallback if metadata read fails in browser
      performUpload(file, undefined);
    };
  };

  const performUpload = async (file: File, verifiedDuration?: number) => {
    setIsUploading(true);
    setUploadProgress(5);
    setUploadStatus('Initializing audio upload...');
    setErrorMsg(null);

    try {
      const token = getAuthToken();
      const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      // For files <= 4MB, use fast direct upload
      if (file.size <= 4 * 1024 * 1024) {
        setUploadStatus('Uploading audio stream to storage bucket...');
        setUploadProgress(25);

        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = reader.result as string;
            setUploadProgress(60);

            const res = await fetch('/api/admin/music/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...authHeader
              },
              body: JSON.stringify({
                fileName: file.name,
                fileType: file.type || 'audio/mp3',
                fileData: base64Data,
                durationSeconds: verifiedDuration || undefined
              })
            });

            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error || errData.message || 'Audio upload failed');
            }

            const data = await res.json();
            const finalUrl = data.url || data.background_music_url;
            setUploadProgress(100);
            setUploadStatus('Upload completed!');
            setSuccessMsg('Background audio track saved to bucket and database successfully!');
            setAudioUrl(finalUrl);

            onUploadComplete({
              url: finalUrl,
              fileName: data.fileName || file.name,
              durationSeconds: data.durationSeconds || verifiedDuration || undefined
            });
          } catch (err: any) {
            setErrorMsg(err.message || 'Failed to upload audio file');
          } finally {
            setIsUploading(false);
          }
        };

        reader.onerror = () => {
          setErrorMsg('Failed to read audio file from disk.');
          setIsUploading(false);
        };

        reader.readAsDataURL(file);
        return;
      }

      // For files > 4MB (up to 100MB), use reliable chunked upload to prevent timeout
      setUploadStatus('Preparing chunked streaming session...');
      const chunkSize = 2 * 1024 * 1024; // 2MB chunks
      const totalChunks = Math.ceil(file.size / chunkSize);

      const initRes = await fetch('/api/upload/chunk-init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'audio/mp3',
          fileSize: file.size,
          totalChunks,
          durationSeconds: verifiedDuration || undefined
        })
      });

      if (!initRes.ok) {
        throw new Error('Failed to initialize chunk upload session.');
      }

      const { uploadId } = await initRes.json();

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunkBlob = file.slice(start, end);

        const chunkBase64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(chunkBlob);
        });

        setUploadStatus(`Uploading audio chunk ${i + 1} of ${totalChunks}...`);
        setUploadProgress(Math.round(((i + 1) / (totalChunks + 1)) * 90));

        const chunkRes = await fetch('/api/upload/chunk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader
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
      }

      // Complete chunk assembly
      setUploadStatus('Assembling and saving audio track...');
      setUploadProgress(95);

      const completeRes = await fetch('/api/upload/chunk-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify({
          uploadId,
          fileName: file.name,
          fileType: file.type || 'audio/mp3',
          durationSeconds: verifiedDuration || undefined
        })
      });

      if (!completeRes.ok) {
        throw new Error('Failed to assemble chunked audio file.');
      }

      const completeData = await completeRes.json();
      const finalUrl = completeData.url || completeData.background_music_url;

      setUploadProgress(100);
      setUploadStatus('Upload successful!');
      setSuccessMsg('High-definition audio track saved to bucket and database successfully!');
      setAudioUrl(finalUrl);

      onUploadComplete({
        url: finalUrl,
        fileName: completeData.fileName || file.name,
        durationSeconds: completeData.durationSeconds || verifiedDuration || undefined
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyCustomLink = () => {
    if (!customLinkInput.trim()) {
      setErrorMsg('Please enter a valid audio stream or file URL.');
      return;
    }
    const cleanUrl = customLinkInput.trim();
    setAudioUrl(cleanUrl);
    setShowCustomLinkInput(false);
    setSuccessMsg('Direct audio stream link applied!');
    onUploadComplete({
      url: cleanUrl,
      fileName: cleanUrl.split('/').pop() || 'stream-audio',
      durationSeconds: undefined
    });
  };

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setErrorMsg('Could not play audio preview. Check the audio link format.'));
    }
  };

  const handleRemove = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {
        // ignore
      }
    }
    setIsPlaying(false);
    setAudioUrl('');
    setSelectedFile(null);
    setDuration(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onRemove) {
      onRemove();
    }
  };

  const formatDuration = (secs: number) => {
    if (isNaN(secs) || secs === Infinity) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="w-full space-y-3">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mp3,audio/wav,audio/aac,audio/ogg,audio/mpeg,audio/x-m4a,audio/flac,audio/*,.mp3,.wav,.aac,.ogg,.m4a,.flac"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Label and Quick Actions */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-blue-500" />
          {label}
          {required && <span className="text-rose-500 font-black">*</span>}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCustomLinkInput(!showCustomLinkInput)}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <Radio className="w-3 h-3" />
            {showCustomLinkInput ? 'Upload Audio File' : 'Paste Direct Stream URL'}
          </button>
          {audioUrl && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Remove Track
            </button>
          )}
        </div>
      </div>

      {/* Custom URL Input Accordion */}
      {showCustomLinkInput && (
        <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl flex gap-2 items-center animate-fadeIn">
          <input
            type="url"
            placeholder="https://example.com/audio/tournament-anthem.mp3"
            value={customLinkInput}
            onChange={(e) => setCustomLinkInput(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleApplyCustomLink}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm shrink-0"
          >
            Apply Stream
          </button>
        </div>
      )}

      {/* Main Upload Dropzone or Audio Preview */}
      {!audioUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFilePicker}
          className={`w-full p-6 sm:p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
            isDragging 
              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 scale-[0.99]' 
              : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 hover:bg-blue-50/30 dark:hover:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3.5 shadow-inner">
            <FolderOpen className="w-7 h-7" />
          </div>

          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Click to Select Audio File or Drag & Drop Here
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supports <span className="font-semibold text-blue-600 dark:text-blue-400">MP3, WAV, AAC, OGG, M4A</span> (Up to 10 Minutes & 100MB)
          </p>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-transform active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Music / Select File
            </button>
          </div>

          <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-medium">
            <Sparkles className="w-3 h-3" />
            Plays seamlessly across all pages in Dark Mode with live equalizer!
          </div>
        </div>
      ) : (
        <div className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden shadow-lg">
          {/* Subtle Ambient Glow */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

          <audio
            ref={audioRef}
            src={audioUrl || undefined}
            onError={() => setIsPlaying(false)}
            onTimeUpdate={() => {
              if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
              }
            }}
            onEnded={() => setIsPlaying(false)}
            onLoadedMetadata={() => {
              if (audioRef.current) {
                setDuration(audioRef.current.duration);
              }
            }}
          />

          <div className="flex items-center gap-3.5 relative z-10">
            {/* Play/Pause Preview Button */}
            <button
              type="button"
              onClick={togglePlayAudio}
              className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 transition-all shadow-md active:scale-95 group cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-white" />
              ) : (
                <Play className="w-5 h-5 fill-white ml-0.5" />
              )}
            </button>

            {/* Track Info & Progress Track */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <FileAudio className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-200 truncate">
                    {selectedFile?.name || audioUrl.split('/').pop() || 'Audio Track'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  {formatDuration(currentTime)} / {duration ? formatDuration(duration) : '--:--'}
                </span>
              </div>

              {/* Seekable Progress Bar */}
              <div 
                className="w-full h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative"
                onClick={(e) => {
                  if (!audioRef.current || !duration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                  const newTime = ratio * duration;
                  audioRef.current.currentTime = newTime;
                  setCurrentTime(newTime);
                }}
              >
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-100"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Change File Button */}
            <button
              type="button"
              onClick={openFilePicker}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors shrink-0 text-xs font-bold flex items-center gap-1"
              title="Replace with new audio file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Replace</span>
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 rounded-xl space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              {uploadStatus}
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-mono">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-blue-200 dark:bg-blue-900/60 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification Alert */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Helper Information */}
      {helperText && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {helperText}
        </p>
      )}
    </div>
  );
};

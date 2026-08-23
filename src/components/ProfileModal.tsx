import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, token, refreshUserData } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 1. Immediate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 2. Auto-save to backend
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        await refreshUserData();
        console.log("Image auto-updated successfully!");
      } else {
        console.error("Upload failed:", data.error);
      }
    } catch (err) {
      console.error("Network error during upload:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Profile Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white dark:bg-slate-900 w-[90%] max-w-[360px] rounded-[24px] p-8 shadow-2xl overflow-hidden text-center"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Profile Settings</h3>

            {/* Avatar with Glowing Ring */}
            <div 
              className="relative w-[110px] h-[110px] mx-auto mb-6 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {/* Glowing Ring Animation */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-[length:300%_300%] animate-[glowingBorder_3s_linear_infinite]" />
              
              {/* Profile Image */}
              <div className="relative w-full h-full rounded-full border-[3px] border-white dark:border-slate-900 bg-white dark:bg-slate-800 overflow-hidden z-10 shadow-lg">
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
                    <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <img
                  src={previewUrl || user.profileImage || user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=176BFF&color=fff`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Edit Pen Badge */}
              <div className="absolute bottom-1 right-1 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg z-20 animate-[floatPen_2s_infinite_ease-in-out]">
                <Camera className="w-4 h-4" />
              </div>
            </div>

            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />

            <div className="space-y-1">
              <div className="text-lg font-bold text-slate-900 dark:text-white">{user.fullName}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
            </div>

            {/* Additional Decorative Elements */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-6">
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Balance</div>
                <div className="text-lg font-bold text-blue-600">৳{user.balance.toFixed(0)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">UID</div>
                <div className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">#{user.id}</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tailwind Config for Animations */}
      <style>{`
        @keyframes glowingBorder {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatPen {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </AnimatePresence>
  );
};

export default ProfileModal;

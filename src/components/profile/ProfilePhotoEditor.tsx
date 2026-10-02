'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { Camera, X, Loader2, Upload, Trash2 } from 'lucide-react';

interface ProfilePhotoEditorProps {
  onClose: () => void;
  onUpdate?: (newUrl: string | null) => void;
}

export function ProfilePhotoEditor({ onClose, onUpdate }: ProfilePhotoEditorProps) {
  const profile = useAuthStore(s => s.profile);
  const setProfile = useAuthStore(s => s.setProfile);
  const supabase = createClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Cropper state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { console.log('DP TRACE: file selected? YES');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Only JPEG, PNG, WEBP, and GIF images are allowed');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.src = url;
    img.onload = () => {
      imageRef.current = img;
      // Reset state
      setScale(1);
      setPosition({ x: 0, y: 0 });
      drawCanvas();
    };
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate dimensions
    const size = canvas.width;
    const imgAspect = img.width / img.height;
    
    let drawW, drawH;
    if (imgAspect > 1) {
      drawH = size * scale;
      drawW = drawH * imgAspect;
    } else {
      drawW = size * scale;
      drawH = drawW / imgAspect;
    }

    const centerX = size / 2;
    const centerY = size / 2;
    
    const dx = centerX - (drawW / 2) + position.x;
    const dy = centerY - (drawH / 2) + position.y;

    // Draw image
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();
  };

  useEffect(() => {
    if (previewUrl) drawCanvas();
  }, [scale, position, previewUrl]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRemovePhoto = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("Authentication required. Please log in again.");
        setLoading(false);
        return;
      }

      if (profile.avatar_url) {
        const urlObj = new URL(profile.avatar_url);
        const pathSegments = urlObj.pathname.split('/avatars/');
        if (pathSegments.length > 1) {
          const filePath = pathSegments[1].split('?')[0]; // Strip query params
          await supabase.storage.from('avatars').remove([filePath]);
        }
      }

      const dbRes = await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
      if (dbRes.error) {
        toast.error("Failed to update profile.");
        setLoading(false);
        return;
      }

      setProfile({ ...profile, avatar_url: null });
      onUpdate?.(null);
      toast.success('Profile photo removed');
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Failed to remove photo');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    if (!canvasRef.current) return;

    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("Authentication required. Please log in again.");
        setLoading(false);
        return;
      }

      // Get cropped blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current?.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas to Blob failed'));
        }, 'image/webp', 0.9);
      });

      const fileName = `${user.id}/profile.webp`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { contentType: 'image/webp', upsert: true });

      if (error) {
        console.error('Storage upload failed:', { userId: user.id, fileType: 'image/webp', fileSize: blob.size, path: fileName, error: error.message });
        toast.error("Couldn't update profile photo. Please try again.");
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      // Use cache-busting timestamp query param
      const publicUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

      // Update profile
      const dbRes = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      
      if (dbRes.error) {
        console.error('Database update failed:', dbRes.error.message);
        toast.error("Failed to save profile changes.");
        setLoading(false);
        return;
      }
      
      setProfile({ ...profile, avatar_url: publicUrl });
      onUpdate?.(publicUrl);
      toast.success('Profile photo updated successfully');
      onClose();
    } catch (e) {
      console.error('Profile photo upload error', e);
      toast.error("Couldn't update profile photo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#11141A] border border-[#EAECF0] dark:border-[#252A34] w-full max-w-[400px] rounded-[20px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAECF0] dark:border-[#252A34]">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Profile Photo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          {!previewUrl ? (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-[#151922]">
                <Camera size={32} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 text-center max-w-[250px]">
                Upload a picture to personalize your connectX profile.
              </p>
              <div className="flex flex-col w-full gap-2 mt-2">
                <label className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white py-2.5 rounded-[12px] font-medium text-sm transition-colors text-center cursor-pointer shadow-sm">
                  Upload Photo
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileSelect} />
                </label>
                {profile?.avatar_url && (
                  <button onClick={handleRemovePhoto} disabled={loading} className="w-full py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-[12px] font-medium text-sm transition-colors flex items-center justify-center gap-2">
                    <Trash2 size={16} /> Remove current photo
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider self-start">Position & Crop</p>
              
              <div className="relative w-[280px] h-[280px] bg-gray-100 dark:bg-black rounded-full overflow-hidden cursor-move border border-[#EAECF0] dark:border-[#252A34] shadow-inner"
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}
              >
                <canvas ref={canvasRef} width={512} height={512} className="w-full h-full object-contain pointer-events-none" />
              </div>

              <div className="w-full flex items-center gap-3 px-4">
                <span className="text-xs text-gray-500">-</span>
                <input 
                  type="range" min="0.5" max="3" step="0.05" value={scale} onChange={e => setScale(parseFloat(e.target.value))}
                  className="flex-1 accent-[#8B5CF6]"
                />
                <span className="text-xs text-gray-500">+</span>
              </div>

              <div className="w-full flex gap-3 mt-2">
                <button onClick={() => setPreviewUrl(null)} disabled={loading} className="flex-1 py-2.5 bg-gray-100 dark:bg-[#151922] text-gray-700 dark:text-gray-300 rounded-[12px] font-medium text-sm hover:bg-gray-200 dark:hover:bg-[#252A34] transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-[12px] font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save Photo'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

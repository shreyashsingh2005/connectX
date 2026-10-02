const fs = require('fs');

let editorPage = fs.readFileSync('src/components/profile/ProfilePhotoEditor.tsx', 'utf8');

// Replace handleSave
const oldHandleSave = /const handleSave = async \(\) => \{[\s\S]*?toast\.error\('Failed to upload photo'\);\n\s*\} finally \{\n\s*setLoading\(false\);\n\s*\}\n\s*\};/m;

const newHandleSave = `const handleSave = async () => {
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

      const fileName = \`\${user.id}/\${Date.now()}.webp\`;

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
      const publicUrl = \`\${publicUrlData.publicUrl}?v=\${Date.now()}\`;

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
  };`;

editorPage = editorPage.replace(oldHandleSave, newHandleSave);

// Replace handleRemovePhoto
const oldHandleRemove = /const handleRemovePhoto = async \(\) => \{[\s\S]*?toast\.error\('Failed to remove photo'\);\n\s*\} finally \{\n\s*setLoading\(false\);\n\s*\}\n\s*\};/m;

const newHandleRemove = `const handleRemovePhoto = async () => {
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
  };`;

editorPage = editorPage.replace(oldHandleRemove, newHandleRemove);

fs.writeFileSync('src/components/profile/ProfilePhotoEditor.tsx', editorPage, 'utf8');
console.log('Fixed handleSave and handleRemovePhoto in ProfilePhotoEditor');

const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// 1. Add state for showPhotoEditor
code = code.replace(
  "const [showThemePicker, setShowThemePicker] = useState(false);",
  "const [showThemePicker, setShowThemePicker] = useState(false);\n  const [showPhotoEditor, setShowPhotoEditor] = useState(false);"
);

// 2. Replace the inline form avatar upload with ProfilePhotoEditor
const targetHtml = `<div className="relative group cursor-pointer flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
                    <UserAvatar src={avatarPreview || profile.avatar_url} name={profile.display_name} size="2xl" className="w-[64px] h-[64px]" />
                    <div className="absolute inset-0 bg-[#090B10]/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={18} strokeWidth={1.75} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="h-[34px] px-3 bg-[#FFFFFF] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#344054] dark:text-[#D0D5DD] hover:bg-[#F9FAFB] dark:hover:bg-[#252A34] transition-colors rounded-[8px] text-[13px] font-medium shadow-sm mb-1.5 outline-none">
                      Change photo
                    </button>
                    <p className="text-[12px] text-[#667085] dark:text-[#98A2B3]">JPG or PNG. Max 5MB.</p>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarSelect} accept="image/*" className="hidden" />`;

const replacementHtml = `<div className="relative group cursor-pointer flex-shrink-0" onClick={() => setShowPhotoEditor(true)}>
                    <UserAvatar src={profile.avatar_url} name={profile.display_name} size="2xl" className="w-[64px] h-[64px]" />
                    <div className="absolute inset-0 bg-[#090B10]/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={18} strokeWidth={1.75} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <button type="button" onClick={() => setShowPhotoEditor(true)} className="h-[34px] px-3 bg-[#FFFFFF] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#344054] dark:text-[#D0D5DD] hover:bg-[#F9FAFB] dark:hover:bg-[#252A34] transition-colors rounded-[8px] text-[13px] font-medium shadow-sm mb-1.5 outline-none">
                      Change photo
                    </button>
                    <p className="text-[12px] text-[#667085] dark:text-[#98A2B3]">JPG or PNG. Max 5MB.</p>
                  </div>`;

code = code.replace(targetHtml, replacementHtml);

// 3. Remove avatar file handling from handleUpdateProfile
code = code.replace(
  /if \(avatarFile\) \{[\s\S]*?avatarUrl = publicUrl;\n        \}/,
  ""
);

// 4. Inject ProfilePhotoEditor modal at the end
code = code.replace(
  "      {showThemePicker && <ChatThemePicker onClose={() => setShowThemePicker(false)} />}\n    </div>",
  "      {showThemePicker && <ChatThemePicker onClose={() => setShowThemePicker(false)} />}\n      {showPhotoEditor && <ProfilePhotoEditor onClose={() => setShowPhotoEditor(false)} />}\n    </div>"
);

fs.writeFileSync('src/app/(app)/settings/page.tsx', code, 'utf8');
console.log('Fixed settings page DP upload');

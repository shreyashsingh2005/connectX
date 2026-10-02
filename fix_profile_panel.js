const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

if (!code.includes('ProfilePhotoEditor')) {
  code = code.replace(
    "import { UserAvatar } from '@/components/ui/UserAvatar';",
    "import { UserAvatar } from '@/components/ui/UserAvatar';\nimport { ProfilePhotoEditor } from '@/components/profile/ProfilePhotoEditor';"
  );
  
  code = code.replace(
    "const profile = useAuthStore(s => s.profile);",
    "const profile = useAuthStore(s => s.profile);\n  const [showPhotoEditor, setShowPhotoEditor] = useState(false);"
  );

  code = code.replace(
    /<div className="w-\[84px\] h-\[84px\] flex-shrink-0 relative">[\s\S]*?<\/div>/,
    `<div className="w-[84px] h-[84px] flex-shrink-0 relative group cursor-pointer" onClick={() => isDirect && isOwnProfile ? setShowPhotoEditor(true) : undefined}>
          <UserAvatar src={avatarUrl} name={name} className="w-full h-full text-2xl shadow-sm" isOnline={isDirect ? isOnline : undefined} />
          {isDirect && isOwnProfile && (
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium">Edit</span>
            </div>
          )}
        </div>`
  );

  code = code.replace(
    "return (",
    `const isOwnProfile = profile?.id === otherUser?.id;\n  return (\n    <>`
  );
  
  code = code.replace(
    /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*$/,
    `</div>\n      </div>\n      </div>\n    </div>\n    {showPhotoEditor && <ProfilePhotoEditor onClose={() => setShowPhotoEditor(false)} />}\n    </>`
  );

  fs.writeFileSync('src/components/chat/ProfilePanel.tsx', code, 'utf8');
  console.log("Updated ProfilePanel with PhotoEditor");
}

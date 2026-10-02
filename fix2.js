const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

if (code.includes('<ProfilePhotoEditor')) {
  // It's messed up. Let's fix the tail.
  code = code.replace(
    /<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}\s*\{\s*showPhotoEditor[\s\S]*?<\/>/,
    '</div>\n      </div>\n      </div>\n      {showPhotoEditor && <ProfilePhotoEditor onClose={() => setShowPhotoEditor(false)} />}\n    </>\n  );\n}'
  );
}

fs.writeFileSync('src/components/chat/ProfilePanel.tsx', code, 'utf8');

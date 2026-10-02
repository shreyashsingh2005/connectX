const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

code = code.replace(
  /\n        <\/div>\n      <\/div>\n    <\/div>\n  \);\n\}/,
  '\n        </div>\n      </div>\n    </div>\n    {showPhotoEditor && <ProfilePhotoEditor onClose={() => setShowPhotoEditor(false)} />}\n    </>\n  );\n}'
);

fs.writeFileSync('src/components/chat/ProfilePanel.tsx', code, 'utf8');

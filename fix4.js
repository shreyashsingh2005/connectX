const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

const marker = '          </div>\n        </div>\n      </div>\n';
const pos = code.lastIndexOf(marker);

if (pos !== -1) {
  const cleanHead = code.substring(0, pos + marker.length);
  const tail = `      {showPhotoEditor && <ProfilePhotoEditor onClose={() => setShowPhotoEditor(false)} />}\n    </>\n  );\n}\n`;
  fs.writeFileSync('src/components/chat/ProfilePanel.tsx', cleanHead + tail, 'utf8');
}

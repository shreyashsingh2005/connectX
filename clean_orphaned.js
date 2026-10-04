const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// The exact full orphaned block
const orphaned = `                <div>
                  <button type="button" onClick={() => setShowPhotoEditor(true)} className="h-[34px] px-3 bg-bg-surface dark:bg-[rgba(255,255,255,0.04)] border border-border-subtle text-text-main hover:bg-bg-secondary transition-colors rounded-[8px] text-[12px] font-medium shadow-sm mb-1.5 outline-none">
                    Change photo
                  </button>
                  <p className="text-[12px] text-text-sec">JPG or PNG. Max 5MB.</p>
                </div>
              </div>
            </div>`;

code = code.replace(orphaned, '');

fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log("Cleaned up orphaned HTML");

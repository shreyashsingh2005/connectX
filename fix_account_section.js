const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

const regex = /{\/\* ACCOUNT SETTINGS \*\/}[\s\S]*?(?=<div className=\"bg-\[#FFFFFF\] dark:bg-\[#11141A\] rounded-\[24px\] border border-transparent dark:border-\[#252A34\] md:border-\[#EAECF0\] shadow-sm overflow-hidden mt-2 mx-4 md:mx-0\">)/;

// Wait, the regex needs to find the exact injection point.
// Instead of regex, I will just find the string "<BackHeader title=\"Account\" />" and insert the Avatar block right after it.

const injectionPoint = "<BackHeader title=\"Account\" />\n            \n            ";

const avatarBlock = "<div className=\"bg-[#FFFFFF] dark:bg-[#11141A] rounded-[24px] border border-transparent dark:border-[#252A34] md:border-[#EAECF0] shadow-sm overflow-hidden mt-2 mx-4 md:mx-0 mb-4\">\n" +
"              <div className=\"flex items-center gap-5 p-5\">\n" +
"                <div className=\"relative group cursor-pointer flex-shrink-0\" onClick={() => setShowPhotoEditor(true)}>\n" +
"                  <UserAvatar src={profile.avatar_url} name={profile.display_name} size=\"2xl\" className=\"w-[64px] h-[64px]\" />\n" +
"                  <div className=\"absolute inset-0 bg-[#090B10]/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center\">\n" +
"                    <Camera size={18} strokeWidth={1.75} className=\"text-white\" />\n" +
"                  </div>\n" +
"                </div>\n" +
"                <div>\n" +
"                  <button type=\"button\" onClick={() => setShowPhotoEditor(true)} className=\"h-[34px] px-3 bg-[#FFFFFF] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#344054] dark:text-[#D0D5DD] hover:bg-[#F9FAFB] dark:hover:bg-[#252A34] transition-colors rounded-[8px] text-[13px] font-medium shadow-sm mb-1.5 outline-none\">\n" +
"                    Change photo\n" +
"                  </button>\n" +
"                  <p className=\"text-[12px] text-[#667085] dark:text-[#98A2B3]\">JPG or PNG. Max 5MB.</p>\n" +
"                </div>\n" +
"              </div>\n" +
"            </div>\n\n            ";

if (code.includes(injectionPoint)) {
    code = code.replace(injectionPoint, injectionPoint + avatarBlock);
    
    // Now we also need to change setEditingField('display_name') buttons
    code = code.replace(/<button onClick={\(\) => setEditingField\('display_name'\)}/g, "<button onClick={() => setEditingField('display_name')}");
    code = code.replace(/<button onClick={\(\) => setEditingField\('username'\)}/g, "<button onClick={() => setEditingField('username')}");
    code = code.replace(/<button onClick={\(\) => setEditingField\('bio'\)}/g, "<button onClick={() => setEditingField('bio')}");
    
    fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
    console.log('Injected avatar block');
} else {
    console.log('Injection point not found');
}

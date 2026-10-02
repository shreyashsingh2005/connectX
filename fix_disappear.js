const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/chat/[conversationId]/page.tsx', 'utf8');

// Change the fatal error condition from (error || !conversation) to (error)
code = code.replace(
  /if \(error \|\| !conversation\) \{/g,
  'if (error) {'
);

// If there's no error but conversation is still undefined (even after loading is false), it means it's temporarily missing from the store but might be in local state, or it's still being fetched by a background process. We should just show the loader instead of crashing the UI.
// So we insert a fallback loader before returning the main UI if !conversation
code = code.replace(
  /return \(\n\s*<>\n\s*<div \n\s*className="flex flex-col/g,
  'if (!conversation) {\n      return (\n        <div className="flex-1 flex items-center justify-center">\n          <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />\n        </div>\n      );\n    }\n\n    return (\n      <>\n        <div \n          className="flex flex-col'
);

// Also we should fallback activeTheme safely
code = code.replace(
  /themeColors\[activeTheme\.themeId\]/g,
  'themeColors[activeTheme?.themeId || \'connect-purple\']'
);
code = code.replace(
  /activeTheme\.backgroundId/g,
  '(activeTheme?.backgroundId || \'solid\')'
);
code = code.replace(
  /activeTheme\.backgroundIntensity/g,
  '(activeTheme?.backgroundIntensity || 100)'
);

fs.writeFileSync('src/app/(app)/chat/[conversationId]/page.tsx', code, 'utf8');
console.log('Fixed chat disappear bug');

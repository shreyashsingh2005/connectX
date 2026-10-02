const fs = require('fs');

function fixSvgMask(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // In page.tsx and ChatThemePicker.tsx, look for the background div:
  const brokenBackground = `backgroundImage: \`url('/patterns/\$\{`;
  
  if (code.includes(brokenBackground)) {
    // Replace the style block
    code = code.replace(/backgroundImage:\s*`url\('\/patterns\/\$\{[^}]+\}\.svg'\)`/g, (match) => {
      // We'll replace it with a mask property.
      // E.g., maskImage: `url('/patterns/${activeTheme.backgroundId}.svg')`
      // But wait! maskImage requires prefixing for webkit in some browsers.
      const urlPart = match.split(':')[1].trim(); // `url('/patterns/${activeTheme.backgroundId}.svg')`
      return `WebkitMaskImage: ${urlPart}, maskImage: ${urlPart}, WebkitMaskSize: '100px 100px', maskSize: '100px 100px', backgroundColor: resolvedTheme === 'dark' ? 'white' : 'black'`;
    });
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`Fixed background mask in ${filePath}`);
  }
}

fixSvgMask('src/app/(app)/chat/[conversationId]/page.tsx');
fixSvgMask('src/components/chat/ChatThemePicker.tsx');

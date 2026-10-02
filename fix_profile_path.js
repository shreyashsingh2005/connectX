const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfilePhotoEditor.tsx', 'utf8');

code = code.replace(
  /const fileName = `\$\{profile\.id\}_\$\{Date\.now\(\)\}\.webp`;/g,
  "const fileName = `${profile.id}/${Date.now()}.webp`;"
);

// Fix the remove logic to handle folder paths correctly
// If the path contains the profile.id folder, we should extract the whole path after the bucket name
code = code.replace(
  /const filePath = pathSegments\[pathSegments\.length - 1\];/g,
  "const filePath = `${profile.id}/${pathSegments[pathSegments.length - 1]}`;" // this is hacky, a better way is to extract it precisely
);

// Better remove logic:
code = code.replace(
  /const urlObj = new URL\(profile\.avatar_url\);\n\s*const pathSegments = urlObj\.pathname\.split\('\/'\);\n\s*const filePath = pathSegments\[pathSegments\.length - 1\];\n\s*if \(filePath\) await supabase\.storage\.from\('avatars'\)\.remove\(\[filePath\]\);/g,
  `const urlObj = new URL(profile.avatar_url);
        const pathSegments = urlObj.pathname.split('/avatars/');
        if (pathSegments.length > 1) {
          const filePath = pathSegments[1];
          await supabase.storage.from('avatars').remove([filePath]);
        }`
);

fs.writeFileSync('src/components/profile/ProfilePhotoEditor.tsx', code, 'utf8');
console.log('Fixed ProfilePhotoEditor storage path to include folder');

const fs = require('fs');

let profilePage = fs.readFileSync('src/app/(app)/profile/page.tsx', 'utf8');

profilePage = profilePage.replace(/px-4 md:px-0/g, 'px-4 md:px-6');

fs.writeFileSync('src/app/(app)/profile/page.tsx', profilePage);
console.log('Fixed profile page padding');

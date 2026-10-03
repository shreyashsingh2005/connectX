const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

let displayIdx = code.indexOf('Display name</span>');
if (displayIdx !== -1) {
    let btnIdx = code.lastIndexOf('setIsEditingProfile(true)', displayIdx);
    if (btnIdx !== -1) {
        code = code.substring(0, btnIdx) + 'setEditingField("display_name")' + code.substring(btnIdx + 25);
    }
}

let userIdx = code.indexOf('Username</span>');
if (userIdx !== -1) {
    let btnIdx = code.lastIndexOf('setIsEditingProfile(true)', userIdx);
    if (btnIdx !== -1) {
        code = code.substring(0, btnIdx) + 'setEditingField("username")' + code.substring(btnIdx + 25);
    }
}

let bioIdx = code.indexOf('About</span>');
if (bioIdx !== -1) {
    let btnIdx = code.lastIndexOf('setIsEditingProfile(true)', bioIdx);
    if (btnIdx !== -1) {
        code = code.substring(0, btnIdx) + 'setEditingField("bio")' + code.substring(btnIdx + 25);
    }
}

fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log('Fixed buttons');

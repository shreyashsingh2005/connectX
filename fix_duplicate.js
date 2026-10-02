const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

code = code.replace(
  "const [showThemePicker, setShowThemePicker] = useState(false);\n  const [showPhotoEditor, setShowPhotoEditor] = useState(false);",
  "const [showThemePicker, setShowThemePicker] = useState(false);"
);

fs.writeFileSync('src/app/(app)/settings/page.tsx', code, 'utf8');

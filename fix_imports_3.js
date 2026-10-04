const fs = require('fs');
let settingsContent = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');
settingsContent = settingsContent.replace("import { useState, useRef, useEffect } from 'react';\nimport { useState, useEffect } from 'react';", "import { useState, useRef, useEffect } from 'react';");
fs.writeFileSync('src/app/(app)/settings/page.tsx', settingsContent);

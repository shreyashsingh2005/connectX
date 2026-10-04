const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageBubble.tsx', 'utf8');
content = content.replace("import { Pin, useState, useRef, useEffect } from 'react';", "import { useState, useRef, useEffect } from 'react';");
content = content.replace("import {\n  Check,", "import {\n  Check,\n  Pin,");
fs.writeFileSync('src/components/chat/MessageBubble.tsx', content);

let settingsContent = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');
settingsContent = settingsContent.replace("import { useState, useEffect } from 'react';\nimport { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';");
fs.writeFileSync('src/app/(app)/settings/page.tsx', settingsContent);

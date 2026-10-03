
const fs = require("fs");
let content = fs.readFileSync("src/components/modals/ForwardModal.tsx", "utf8");
content = content.replace(/const channel = supabase\.channel\(.*\);/, "const channel = supabase.channel(`room:${conversationId}`);");
fs.writeFileSync("src/components/modals/ForwardModal.tsx", content);


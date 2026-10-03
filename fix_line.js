
const fs = require("fs");
let content = fs.readFileSync("src/components/modals/ForwardModal.tsx", "utf8");
const lines = content.split("\n");
lines[81] = "      const channel = supabase.channel(`room:${conversationId}`);";
fs.writeFileSync("src/components/modals/ForwardModal.tsx", lines.join("\n"));


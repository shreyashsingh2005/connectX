const fs = require('fs');
let code = fs.readFileSync('src/app/globals.css', 'utf8');

const additionalCSS = `
/* Premium Emoji Picker Overrides */
.emoji-picker-wrapper {
  --epr-bg-color: #FFFFFF;
  --epr-text-color: #101828;
  --epr-border-color: #EAECF0;
  --epr-hover-bg: #F8FAFC;
}

.dark .emoji-picker-wrapper {
  --epr-bg-color: #11141A;
  --epr-text-color: #F5F7FA;
  --epr-border-color: #252A34;
  --epr-hover-bg: #151922;
}

.emoji-picker-wrapper .EmojiPickerReact {
  border: none !important;
  box-shadow: none !important;
  font-family: 'Inter', system-ui, sans-serif !important;
}

.emoji-picker-wrapper .epr-category-nav {
  padding: 8px 12px;
}

.emoji-picker-wrapper .epr-category-nav > button {
  width: 32px;
  height: 32px;
}

.emoji-picker-wrapper .epr-emoji-category-label {
  font-size: 13px !important;
  font-weight: 600 !important;
  color: var(--epr-text-color) !important;
  opacity: 0.7;
  height: auto !important;
  padding: 12px 16px 8px 16px !important;
  background-color: var(--epr-bg-color) !important;
  backdrop-filter: none !important;
  position: static !important;
}

.emoji-picker-wrapper .epr-search-container {
  padding: 12px 16px !important;
}

.emoji-picker-wrapper .epr-search-container input {
  padding-left: 36px !important;
}

.emoji-picker-wrapper .epr-body::-webkit-scrollbar {
  width: 5px;
}

.emoji-picker-wrapper .epr-body::-webkit-scrollbar-track {
  background: transparent;
}

.emoji-picker-wrapper .epr-body::-webkit-scrollbar-thumb {
  background: var(--epr-border-color);
  border-radius: 4px;
}

.emoji-picker-wrapper .epr-emoji {
  transition: transform 0.1s ease-out, background-color 0.1s ease-out !important;
}

.emoji-picker-wrapper .epr-emoji:hover {
  transform: scale(1.05) !important;
}
`;

if (!code.includes('.emoji-picker-wrapper')) {
  fs.appendFileSync('src/app/globals.css', additionalCSS);
  console.log("Appended Emoji Picker CSS");
}

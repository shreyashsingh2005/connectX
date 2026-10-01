const fs = require('fs');

let code = fs.readFileSync('src/components/ui/EmptyState.tsx', 'utf8');

code = code.replace(
  /'no-messages': \{\s*Icon: MessageSquare,\s*title: 'No messages yet',\s*description: 'Say hello! Send a message to start the conversation.',\s*\}/,
  `'no-messages': {
    Icon: MessageSquare,
    title: 'Start a conversation',
    description: 'Send a message to start chatting securely.',
  }`
);

code = code.replace(
  /className="w-16 h-16 bg-\[#8B5CF6\]\/10 text-\[#8B5CF6\] rounded-full flex items-center justify-center mb-4"/,
  'className="w-12 h-12 bg-white dark:bg-[#1A1E29] border border-gray-200 dark:border-[#252A34] text-[#8B5CF6] dark:text-[#A78BFA] rounded-xl shadow-sm flex items-center justify-center mb-4"'
);

code = code.replace(
  /<Icon className="w-8 h-8" \/>/,
  '<Icon className="w-5 h-5" />'
);

code = code.replace(
  /className="text-lg font-semibold text-gray-900 dark:text-white mb-2"/,
  'className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5"'
);

code = code.replace(
  /className="text-gray-500 text-sm max-w-\[250px\] mx-auto"/,
  'className="text-gray-500 text-[13px] max-w-[250px] mx-auto"'
);

fs.writeFileSync('src/components/ui/EmptyState.tsx', code, 'utf8');
console.log("Updated EmptyState.tsx");

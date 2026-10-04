const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/contacts/page.tsx', 'utf8');

// Update CompactUserRow outer container
code = code.replace(
  /<div className="flex items-center gap-\[10px\] w-full min-h-\[60px\] h-\[60px\] px-\[10px\] py-\[8px\] bg-\[rgba\(255,255,255,0\.035\)\] border border-\[rgba\(255,255,255,0\.07\)\] rounded-\[10px\] hover:bg-\[rgba\(255,255,255,0\.05\)\] transition-colors">/g,
  '<div className="flex items-center gap-[10px] w-full min-h-[60px] h-[60px] px-[10px] py-[8px] border-b border-[#EAECF0] dark:border-[rgba(255,255,255,0.06)] last:border-b-0 hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-150">'
);

// Search Results List Container
code = code.replace(
  /<div className="flex flex-col gap-\[6px\]">\s*\{searchResults\.map\(p =>/g,
  '<div className="flex flex-col bg-white dark:bg-[rgba(255,255,255,0.025)] border border-[#EAECF0] dark:border-[rgba(255,255,255,0.06)] rounded-[12px] overflow-hidden">\n                  {searchResults.map(p =>'
);

// Incoming List Container
code = code.replace(
  /<div className="flex flex-col gap-\[6px\]">\s*\{incomingRequests\.map\(req =>/g,
  '<div className="flex flex-col bg-white dark:bg-[rgba(255,255,255,0.025)] border border-[#EAECF0] dark:border-[rgba(255,255,255,0.06)] rounded-[12px] overflow-hidden">\n                        {incomingRequests.map(req =>'
);

// Outgoing List Container
code = code.replace(
  /<div className="flex flex-col gap-\[6px\]">\s*\{outgoingRequests\.map\(req =>/g,
  '<div className="flex flex-col bg-white dark:bg-[rgba(255,255,255,0.025)] border border-[#EAECF0] dark:border-[rgba(255,255,255,0.06)] rounded-[12px] overflow-hidden">\n                        {outgoingRequests.map(req =>'
);

// Suggestions List Container
code = code.replace(
  /<div className="flex flex-col gap-\[6px\]">\s*\{suggestions\.map\(p =>/g,
  '<div className="flex flex-col bg-white dark:bg-[rgba(255,255,255,0.025)] border border-[#EAECF0] dark:border-[rgba(255,255,255,0.06)] rounded-[12px] overflow-hidden">\n                        {suggestions.map(p =>'
);

// Friendships List Container
code = code.replace(
  /<div className="flex flex-col gap-\[6px\]">\s*\{friendships\.map\(f =>/g,
  '<div className="flex flex-col bg-white dark:bg-[rgba(255,255,255,0.025)] border border-[#EAECF0] dark:border-[rgba(255,255,255,0.06)] rounded-[12px] overflow-hidden">\n                      {friendships.map(f =>'
);

// Update section titles (h2s)
code = code.replace(
  /<h2 className="text-\[14px\] font-\[600\] text-\[\#101828\] dark:text-\[\#F5F7FA\] mb-\[8px\] px-1 flex items-center gap-2">/g,
  '<h2 className="text-[13px] font-[600] text-[#101828] dark:text-[#F5F7FA] mt-[16px] mb-[8px] px-1 flex items-center gap-2">'
);
code = code.replace(
  /<h2 className="text-\[14px\] font-\[600\] text-\[\#101828\] dark:text-\[\#F5F7FA\] mb-\[8px\] px-1">/g,
  '<h2 className="text-[13px] font-[600] text-[#101828] dark:text-[#F5F7FA] mt-[16px] mb-[8px] px-1">'
);

// Tabs Container
code = code.replace(
  /<div className="flex p-\[3px\] bg-\[rgba\(255,255,255,0\.04\)\] rounded-\[10px\] h-\[38px\] mb-\[16px\] border border-white\/5">/,
  '<div className="flex p-[3px] bg-[#F1F5F9] dark:bg-[rgba(255,255,255,0.04)] rounded-[10px] h-[40px] mb-[16px] border border-[#E2E8F0] dark:border-white/5">'
);

// Requests Tab Button
const requestsTabSearch = /<button \s*onClick=\{\(\) => setActiveTab\('requests'\)\}\s*className=\{cn\(\s*"flex-1 h-\[30px\] text-\[13px\] font-\[600\] rounded-\[8px\] transition-all flex items-center justify-center gap-2",\s*activeTab === 'requests'\s*\?\s*"bg-\[rgba\(255,255,255,0\.08\)\] text-\[\#F5F7FA\] shadow-sm"\s*:\s*"text-\[\#A7AFB8\] hover:text-\[\#F5F7FA\]"\s*\)\}\s*>\s*Requests\s*\{incomingRequests\.length > 0 && \(\s*<span className="w-\[18px\] h-\[18px\] flex items-center justify-center rounded-full text-\[10px\] font-bold bg-\[\#8B5CF6\] text-white">\s*\{incomingRequests\.length\}\s*<\/span>\s*\)\}\s*<\/button>/;

const requestsTabReplace = `<button 
                  onClick={() => setActiveTab('requests')}
                  className={cn(
                    "flex-1 h-[34px] text-[13px] font-[600] rounded-[8px] transition-all duration-150 flex items-center justify-center gap-2",
                    activeTab === 'requests' 
                      ? "bg-white dark:bg-[rgba(255,255,255,0.09)] text-[#101828] dark:text-[#F5F7FA] border border-[#EAECF0] dark:border-[rgba(255,255,255,0.08)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]" 
                      : "bg-transparent text-[#667085] dark:text-[#98A2B3]"
                  )}
                >
                  Requests
                  {incomingRequests.length > 0 && (
                    <span className="w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold bg-[rgba(139,92,246,0.14)] text-[#A78BFA]">
                      {incomingRequests.length}
                    </span>
                  )}
                </button>`;

code = code.replace(requestsTabSearch, requestsTabReplace);

// Friends Tab Button
const friendsTabSearch = /<button \s*onClick=\{\(\) => setActiveTab\('friends'\)\}\s*className=\{cn\(\s*"flex-1 h-\[30px\] text-\[13px\] font-\[600\] rounded-\[8px\] transition-all flex items-center justify-center gap-2",\s*activeTab === 'friends'\s*\?\s*"bg-\[rgba\(255,255,255,0\.08\)\] text-\[\#F5F7FA\] shadow-sm"\s*:\s*"text-\[\#A7AFB8\] hover:text-\[\#F5F7FA\]"\s*\)\}\s*>\s*My Friends\s*\{friendships\.length > 0 && \(\s*<span className="text-\[12px\] opacity-70">\(\{friendships\.length\}\)<\/span>\s*\)\}\s*<\/button>/;

const friendsTabReplace = `<button 
                  onClick={() => setActiveTab('friends')}
                  className={cn(
                    "flex-1 h-[34px] text-[13px] font-[600] rounded-[8px] transition-all duration-150 flex items-center justify-center gap-2",
                    activeTab === 'friends' 
                      ? "bg-white dark:bg-[rgba(255,255,255,0.09)] text-[#101828] dark:text-[#F5F7FA] border border-[#EAECF0] dark:border-[rgba(255,255,255,0.08)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]" 
                      : "bg-transparent text-[#667085] dark:text-[#98A2B3]"
                  )}
                >
                  My Friends
                  {friendships.length > 0 && (
                    <span className="w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold bg-[rgba(139,92,246,0.14)] text-[#A78BFA]">
                      {friendships.length}
                    </span>
                  )}
                </button>`;

code = code.replace(friendsTabSearch, friendsTabReplace);

// Update section titles text
code = code.replace(/<UserPlus className="w-4 h-4 text-\[\#8B5CF6\]" \/> Incoming/, 'Friend requests');
code = code.replace(/<Clock className="w-4 h-4 text-\[\#8B5CF6\]" \/> Sent/, 'Sent requests');
code = code.replace(/Suggested for you/, 'Suggested for you'); // Kept same

// Fix light mode search input bg to be readable
code = code.replace(
  /className="w-full bg-\[rgba\(255,255,255,0\.035\)\] border border-\[rgba\(255,255,255,0\.07\)\] rounded-\[10px\] h-\[40px\] pl-\[36px\] pr-\[12px\] text-\[13px\] text-\[\#101828\] dark:text-\[\#F5F7FA\] placeholder-\[\#A7AFB8\] focus:outline-none focus:border-\[\#8B5CF6\] focus:ring-1 focus:ring-\[\#8B5CF6\] transition-all"/,
  'className="w-full bg-[#F1F5F9] dark:bg-[rgba(255,255,255,0.035)] border border-[#E2E8F0] dark:border-[rgba(255,255,255,0.07)] rounded-[10px] h-[40px] pl-[36px] pr-[12px] text-[13px] text-[#101828] dark:text-[#F5F7FA] placeholder-[#667085] dark:placeholder-[#A7AFB8] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"'
);


fs.writeFileSync('src/app/(app)/contacts/page.tsx', code);
console.log('Contacts page refined');

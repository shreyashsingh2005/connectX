const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/contacts/page.tsx', 'utf8');

// Global Background
code = code.replace(
  /className="flex flex-col flex-1 z-10 overflow-hidden relative bg-\[\#F8FAFC\] dark:bg-\[\#0B0D12\]"/,
  'className="flex flex-col flex-1 z-10 overflow-hidden relative bg-white dark:bg-[#0B0F12]"'
);

// Remove grid-cols-2
code = code.replace(
  /grid grid-cols-1 sm:grid-cols-2 gap-3/g,
  'flex flex-col gap-0'
);

// Rewrite renderProfileCard
const newProfileCard = `
  const renderProfileCard = (p: Profile, context: 'search' | 'suggestion') => {
    const status = relationshipMap[p.id] || 'none';
    const reqId = requestIds[p.id];

    return (
      <div key={p.id} className="w-full flex items-center justify-between py-3 border-b border-[#EAECF0] dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.02)] px-2 -mx-2 rounded-[12px] transition-colors">
        <div 
          className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
          onClick={() => router.push(\`/profile/\${p.username || p.id}\`)}
        >
          <UserAvatar src={p.avatar_url} name={p.display_name} size="md" className="w-[40px] h-[40px] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#101828] dark:text-[#F5F7FA] text-[14px] truncate">{p.display_name}</p>
            <p className="text-[12px] text-[#667085] dark:text-[#737C86] truncate">@{p.username}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {status === 'friend' ? (
            <button
              onClick={() => handleStartChat(p)}
              className="w-8 h-8 bg-transparent text-[#101828] dark:text-[#A7AFB8] hover:text-[#8B5CF6] hover:bg-[#F3F0FF] dark:hover:bg-[rgba(255,255,255,0.06)] rounded-[10px] transition-all flex items-center justify-center"
              title="Message"
            >
              <MessageSquare className="w-[18px] h-[18px]" />
            </button>
          ) : status === 'outgoing_request' ? (
            <button
              onClick={async () => {
                if(reqId) await cancelRequest(reqId);
                fetchAllData();
                if (context === 'search') performSearch(query);
              }}
              className="px-3 h-8 bg-[#FEF3F2] dark:bg-[rgba(240,68,56,0.1)] text-[#F04438] hover:bg-[#FEE4E2] dark:hover:bg-[rgba(240,68,56,0.2)] rounded-[10px] text-[12px] font-medium transition-all"
            >
              Cancel
            </button>
          ) : status === 'incoming_request' ? (
            <div className="flex gap-1.5">
              <button
                onClick={async () => {
                  if(reqId) await respondToRequest(reqId, p.id, 'accepted');
                  fetchAllData();
                  if (context === 'search') performSearch(query);
                }}
                className="w-8 h-8 bg-[#8B5CF6] text-white rounded-[10px] hover:bg-[#7C3AED] transition-all flex items-center justify-center"
              >
                <Check className="w-[16px] h-[16px]" />
              </button>
              <button
                onClick={async () => {
                  if(reqId) await respondToRequest(reqId, p.id, 'declined');
                  fetchAllData();
                  if (context === 'search') performSearch(query);
                }}
                className="w-8 h-8 bg-gray-100 dark:bg-[rgba(255,255,255,0.06)] text-gray-500 dark:text-[#A7AFB8] hover:bg-gray-200 dark:hover:bg-[rgba(255,255,255,0.1)] rounded-[10px] transition-all flex items-center justify-center"
              >
                <XIcon className="w-[16px] h-[16px]" />
              </button>
            </div>
          ) : (
            <button
              onClick={async () => {
                await sendFriendRequest(p.id);
                fetchAllData();
                if (context === 'search') performSearch(query);
                else {
                  setRelationshipMap(prev => ({...prev, [p.id]: 'outgoing_request'}));
                }
              }}
              className="px-3 h-8 bg-[#8B5CF6] text-white rounded-[10px] text-[12px] font-medium hover:bg-[#7C3AED] transition-all shadow-sm"
            >
              Add
            </button>
          )}
        </div>
      </div>
    );
  };
`;

const oldCardRegex = /const renderProfileCard = \(p: Profile, context: 'search' \| 'suggestion'\) => \{[\s\S]*?className="w-full py-2 bg-\[\#8B5CF6\] text-white rounded-\[10px\] text-\[13px\] font-medium hover:bg-\[\#7C3AED\] transition-all shadow-sm"[\s\S]*?Add Friend[\s\S]*?<\/button>[\s\S]*?\}[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\};/;

code = code.replace(oldCardRegex, newProfileCard.trim());

// We should also patch renderFriendRow and renderRequestRow using generic regex or specific targeted replacements
// Instead, let's just use CSS overrides for those classes in contacts/page.tsx

code = code.replace(
  /className="flex items-center justify-between p-4 bg-white dark:bg-\[\#11141A\] rounded-\[16px\] border border-\[\#EAECF0\] dark:border-\[\#252A34\] hover:border-\[\#8B5CF6\]\/30 transition-all duration-150"/g,
  'className="flex items-center justify-between py-3 border-b border-[#EAECF0] dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.02)] px-2 -mx-2 rounded-[12px] transition-colors"'
);
code = code.replace(
  /w-\[48px\] h-\[48px\]/g,
  'w-[40px] h-[40px]'
);
code = code.replace(
  /text-\[15px\]/g,
  'text-[14px]'
);

fs.writeFileSync('src/app/(app)/contacts/page.tsx', code);
console.log('Contacts page visual patched');

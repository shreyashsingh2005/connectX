const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/contacts/page.tsx', 'utf8');

const faultyBlock = `{context === 'friend' && (
            <button
              onClick={() => handleStartChat(user)}
              disabled={isStartingChat === user.id}
              className="flex items-center gap-1.5 h-[32px] px-3 bg-brand/10 hover:bg-brand/20 text-brand rounded-[8px] text-[12px] font-[600] transition-colors"
            >
              {isStartingChat === user.id ? <Loader2 className="w-[15px] h-[15px] animate-spin" /> : <MessageSquare className="w-[15px] h-[15px]" />}
              Message
            </button>
            <button className="flex items-center justify-center w-[32px] h-[32px] bg-transparent hover:bg-bg-secondary text-text-sec rounded-[8px] transition-colors">
              <MoreHorizontal size={16} strokeWidth={1.75} />
            </button>
          )}`;

const fixedBlock = `{context === 'friend' && (
            <>
              <button
                onClick={() => handleStartChat(user)}
                disabled={isStartingChat === user.id}
                className="flex items-center gap-1.5 h-[32px] px-3 bg-brand/10 hover:bg-brand/20 text-brand rounded-[8px] text-[12px] font-[600] transition-colors"
              >
                {isStartingChat === user.id ? <Loader2 className="w-[15px] h-[15px] animate-spin" /> : <MessageSquare className="w-[15px] h-[15px]" />}
                Message
              </button>
              <button className="flex items-center justify-center w-[32px] h-[32px] bg-transparent hover:bg-bg-secondary text-text-sec rounded-[8px] transition-colors">
                <MoreHorizontal size={16} strokeWidth={1.75} />
              </button>
            </>
          )}`;

code = code.replace(faultyBlock, fixedBlock);

fs.writeFileSync('src/app/(app)/contacts/page.tsx', code);
console.log('Fixed React Fragment issue');

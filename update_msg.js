const fs = require('fs');
let file = fs.readFileSync('src/components/chat/MessageList.tsx', 'utf8');

file = file.replace(
`        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsReconnecting(prev => {
              if (prev) {
                loadMessages(); // Refetch missed messages
              }
              return false;
            });
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setIsReconnecting(true);
          }
        });`,
`        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsReconnecting(prev => {
              if (prev) {
                setTimeout(() => loadMessages(), 0); // Refetch missed messages outside render cycle
              }
              return false;
            });
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setIsReconnecting(true);
          }
        });`
);

fs.writeFileSync('src/components/chat/MessageList.tsx', file);

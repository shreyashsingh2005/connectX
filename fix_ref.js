const fs = require('fs');
let code = fs.readFileSync('src/hooks/useConversations.tsx', 'utf8');

code = code.replace(
  /    const isFirstSubscriber = _activeConversationSubscribers === 1;\s*\/\/ Only the first mounted instance[\s\S]*?if \(!isFirstSubscriber\) \{\s*return \(\) => \{\s*_activeConversationSubscribers -= 1;\s*\};\s*\}/,
  ""
);

code = code.replace(
  /const channel = supabase\s*\.channel\(channelName\)/,
  `if (!_globalChannelRef) {
      _globalChannelRef = supabase
        .channel(channelName)`
);

code = code.replace(
  /\.subscribe\(\);\s*return \(\) => \{\s*_activeConversationSubscribers -= 1;\s*if \(_activeConversationSubscribers <= 0\) \{\s*_activeConversationSubscribers = 0;\s*_globalChannelRef = null;\s*supabase\.removeChannel\(channel\);\s*\}\s*\};/,
  `.subscribe();
    }

    return () => {
      _activeConversationSubscribers -= 1;
      if (_activeConversationSubscribers <= 0) {
        setTimeout(() => {
          if (_activeConversationSubscribers <= 0 && _globalChannelRef) {
            supabase.removeChannel(_globalChannelRef);
            _globalChannelRef = null;
          }
        }, 100);
      }
    };`
);

fs.writeFileSync('src/hooks/useConversations.tsx', code, 'utf8');
console.log('Fixed useConversations channel reference!');

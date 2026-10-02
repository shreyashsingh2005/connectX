const fs = require('fs');
let code = fs.readFileSync('src/hooks/useE2EE.ts', 'utf8');

code = code.replace(
  /if \(initPromises\.has\(conversationId!\)\) {[\s\S]*?return;\n\s*}/,
  `if (initPromises.has(conversationId!)) {
        await initPromises.get(conversationId!);
        if (E2EE.conversationKeyCache.has(conversationId!)) {
          setConversationKey(E2EE.conversationKeyCache.get(conversationId!)!);
        }
        setIsReady(true);
        return;
      }`
);

code = code.replace(
  /setConversationKey\(aesKey\);\n\s*if \(conversationId\) E2EE\.conversationKeyCache\.set\(conversationId, aesKey\);\n\s*setIsReady\(true\);\n\s*\} catch \(err: any\) \{\n\s*console\.error\("E2EE Conv init failed:", err\);\n\s*setError\(err\.message\);\n\s*\}/,
  `setConversationKey(aesKey);
          if (conversationId) E2EE.conversationKeyCache.set(conversationId, aesKey);
        } catch (err: any) {
          console.error("E2EE Conv init failed:", err);
          setError(err.message);
        } finally {
          setIsReady(true);
        }`
);

fs.writeFileSync('src/hooks/useE2EE.ts', code, 'utf8');
console.log('Fixed useE2EE setIsReady');

const fs = require('fs');
let code = fs.readFileSync('src/hooks/useE2EE.ts', 'utf8');

// Fix the awaiter to catch and propagate errors
code = code.replace(
  /if \(initPromises\.has\(conversationId!\)\) \{[\s\S]*?return;\n\s*\}/,
  `if (initPromises.has(conversationId!)) {
          try {
            await initPromises.get(conversationId!);
            if (E2EE.conversationKeyCache.has(conversationId!)) {
              setConversationKey(E2EE.conversationKeyCache.get(conversationId!)!);
            }
          } catch (err: any) {
            setError(err.message);
          }
          setIsReady(true);
          return;
        }`
);

// Fix the promise to rethrow errors
code = code.replace(
  /\} catch \(err: any\) \{\n\s*console\.error\("E2EE Conv init failed:", err\);\n\s*setError\(err\.message\);\n\s*\} finally \{/,
  `} catch (err: any) {
            console.error("E2EE Conv init failed:", err);
            setError(err.message);
            throw err;
          } finally {`
);

fs.writeFileSync('src/hooks/useE2EE.ts', code, 'utf8');
console.log('Fixed useE2EE error propagation');

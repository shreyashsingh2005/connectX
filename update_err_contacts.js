const fs = require('fs');
let file = fs.readFileSync('src/app/(app)/contacts/page.tsx', 'utf8');

file = file.replace(
`    } catch {
      toast.error('Failed to start conversation');
    } finally {`,
`    } catch (error: any) {
      toast.error(error.message || 'Failed to start conversation');
    } finally {`
);

fs.writeFileSync('src/app/(app)/contacts/page.tsx', file);

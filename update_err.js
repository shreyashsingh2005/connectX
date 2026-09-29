const fs = require('fs');
let file = fs.readFileSync('src/app/(app)/profile/[username]/page.tsx', 'utf8');

file = file.replace(
`    } catch (error) {
      toast.error('Failed to start chat');
    } finally {`,
`    } catch (error: any) {
      toast.error(error.message || 'Failed to start chat');
      console.error(error);
    } finally {`
);

fs.writeFileSync('src/app/(app)/profile/[username]/page.tsx', file);

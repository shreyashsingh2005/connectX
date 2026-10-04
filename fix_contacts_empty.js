const fs = require('fs');

let page = fs.readFileSync('src/app/(app)/contacts/page.tsx', 'utf8');

if (!page.includes("import { EmptyState }")) {
  page = page.replace(
    "import { UserAvatar } from '@/components/ui/UserAvatar';",
    "import { UserAvatar } from '@/components/ui/UserAvatar';\nimport { EmptyState } from '@/components/ui/EmptyState';"
  );
}

page = page.replace(
  /<div className="text-center py-6">\s*<p className="text-\[13px\] text-text-sec">No users found for "\{query\}"<\/p>\s*<\/div>/g,
  '<EmptyState variant="no-search-results" />'
);

page = page.replace(
  /<div className="text-center py-12 text-text-muted text-\[13px\]">[\s\S]*?<\/div>/g,
  '<EmptyState variant="no-contacts" />'
);
page = page.replace(
  /<div className="text-center py-12 text-text-sec text-\[13px\]">[\s\S]*?<\/div>/g,
  '<EmptyState variant="no-contacts" />'
);
page = page.replace(
  /<div className="text-center py-8 text-text-sec text-\[13px\]">\s*No incoming requests\.\s*<\/div>/g,
  '<EmptyState variant="no-contacts" />' // Or something else
);

fs.writeFileSync('src/app/(app)/contacts/page.tsx', page);
console.log('Updated contacts EmptyStates');

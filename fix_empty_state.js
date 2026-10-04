const fs = require('fs');

let code = fs.readFileSync('src/components/ui/EmptyState.tsx', 'utf8');

// Container padding
code = code.replace(/py-12/g, 'py-8');

// Icon Wrapper: "compact icon around 36-44px" => `w-[44px] h-[44px]`
code = code.replace(/w-12 h-12 rounded-\[12px\] bg-bg-surface/g, 'w-[44px] h-[44px] rounded-[12px] bg-bg-surface');

// Icon size
code = code.replace(/<Icon size=\{20\}/g, '<Icon size={22}');

// Heading: "heading 15-17px" => `text-[15px]`
code = code.replace(/<h3 className="text-\[14px\] font-medium text-text-main mb-1">\{title\}<\/h3>/g, '<h3 className="text-[15px] font-semibold text-text-main mb-1">{title}</h3>');

// Description: "muted description 12-14px" => `text-[13px]`
code = code.replace(/<p className="text-\[13px\] text-text-sec max-w-xs leading-relaxed">\{description\}<\/p>/g, '<p className="text-[13px] text-text-muted max-w-[240px] leading-relaxed mx-auto">{description}</p>');

// Action button spacing
code = code.replace(/mt-4/g, 'mt-5');

fs.writeFileSync('src/components/ui/EmptyState.tsx', code);
console.log("Updated EmptyState.tsx");

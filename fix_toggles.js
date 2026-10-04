const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// Standardize large toggles (w-11 h-6) to compact toggles
code = code.replace(/<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-\[''\] after:absolute after:top-\[2px\] after:left-\[2px\] after:bg-bg-surface after:border-border-subtle after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand"><\/div>/g, 
  '<div className="w-[36px] h-[20px] bg-[#EAECF0] dark:bg-[#374151] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[16px] peer-checked:after:border-white after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-bg-surface after:border-border-subtle after:border after:rounded-full after:h-[16px] after:w-[16px] after:transition-all peer-checked:bg-brand"></div>'
);

fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log("Standardized toggles to compact 36x20");

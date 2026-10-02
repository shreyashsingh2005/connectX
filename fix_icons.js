const fs = require('fs');

let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// Settings navigation icons
code = code.replace(
  /<Icon size=\{18\}/g,
  '<Icon size={17} strokeWidth={1.75}'
);

// Theme icons
code = code.replace(
  /<t\.icon size=\{18\}/g,
  '<t.icon size={18} strokeWidth={1.75}'
);

// Section icons in map loops (Privacy, Notifications)
code = code.replace(
  /<item\.icon size=\{18\}/g,
  '<item.icon size={18} strokeWidth={1.75}'
);

// Specific icons
const replacements = [
  { from: /<Edit2 size=\{16\} \/>/g, to: '<Edit2 size={16} strokeWidth={1.75} />' },
  { from: /<CheckCircle2 size=\{16\}/g, to: '<CheckCircle2 size={16} strokeWidth={1.75}' },
  
  // Account status row top (Mail, ShieldCheck, Monitor) currently 18, change to 16
  { from: /<Mail size=\{18\} \/>/g, to: '<Mail size={16} strokeWidth={1.75} />' },
  { from: /<ShieldCheck size=\{18\} \/>/g, to: '<ShieldCheck size={16} strokeWidth={1.75} />' },
  { from: /<Monitor size=\{18\} \/>/g, to: '<Monitor size={16} strokeWidth={1.75} />' },
  
  // Blocked Users, Read Receipts explicit icons
  { from: /<CheckCircle2 size=\{18\}/g, to: '<CheckCircle2 size={18} strokeWidth={1.75}' },
  { from: /<Ban size=\{18\}/g, to: '<Ban size={18} strokeWidth={1.75}' },
  
  // ChevronRight
  { from: /<ChevronRight size=\{18\}/g, to: '<ChevronRight size={16} strokeWidth={1.75}' },
  
  // Security Overview explicit icons
  { from: /<Mail size=\{16\} \/>/g, to: '<Mail size={16} strokeWidth={1.75} />' },
  { from: /<ShieldCheck size=\{16\} \/>/g, to: '<ShieldCheck size={16} strokeWidth={1.75} />' },
  { from: /<KeyRound size=\{16\} \/>/g, to: '<KeyRound size={16} strokeWidth={1.75} />' },
  { from: /<Smartphone size=\{18\} \/>/g, to: '<Smartphone size={16} strokeWidth={1.75} />' },
  
  // LogOut
  { from: /<LogOut size=\{16\} \/>/g, to: '<LogOut size={16} strokeWidth={1.75} />' },
  
  // Modal Close
  { from: /<X size=\{20\} \/>/g, to: '<X size={18} strokeWidth={1.75} />' },
  
  // Camera
  { from: /<Camera className="text-white w-6 h-6" \/>/g, to: '<Camera size={20} strokeWidth={1.5} className="text-white" />' },
  
  // Loader2
  { from: /<Loader2 className="w-8 h-8 animate-spin text-\[\#8B5CF6\]" \/>/g, to: '<Loader2 size={32} strokeWidth={1.75} className="animate-spin text-[#8B5CF6]" />' },
  { from: /<Loader2 size=\{14\} className="animate-spin" \/>/g, to: '<Loader2 size={14} strokeWidth={2} className="animate-spin" />' },
  { from: /<Loader2 size=\{16\} className="animate-spin" \/>/g, to: '<Loader2 size={16} strokeWidth={2} className="animate-spin" />' },
  
  // Input fields (UserRound, AtSign)
  { from: /<UserRound className="absolute left-3 top-1\/2 -translate-y-1\/2 w-\[16px\] h-\[16px\] text-\[\#98A2B3\]" \/>/g, to: '<UserRound size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />' },
  { from: /<AtSign className="absolute left-3 top-1\/2 -translate-y-1\/2 w-\[16px\] h-\[16px\] text-\[\#98A2B3\]" \/>/g, to: '<AtSign size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" />' },
];

for (const { from, to } of replacements) {
  code = code.replace(from, to);
}

fs.writeFileSync('src/app/(app)/settings/page.tsx', code, 'utf8');
console.log("Updated settings page icons");

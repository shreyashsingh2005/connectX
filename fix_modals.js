const fs = require('fs');

function standardizeModal(filePath, isUsernameSetup = false) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace backdrop and container
  if (isUsernameSetup) {
     content = content.replace(
      /<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black\/80 backdrop-blur-md animate-in fade-in">/,
      '<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">'
    );
    content = content.replace(
      /<div className="w-full max-w-md bg-bg-surface rounded-\[24px\] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">/,
      '<div className="w-full max-w-md bg-bg-surface dark:bg-bg-elevated rounded-[18px] shadow-xl border border-border-subtle overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-[0.98] duration-150 ease-out">'
    );
  } else {
    content = content.replace(
      /<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary\/80 backdrop-blur-sm animate-fade-in">/,
      '<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">'
    );
    content = content.replace(
      /<div className="fixed inset-0 z-\[100\] flex items-center justify-center p-4 bg-black\/50 backdrop-blur-sm">/,
      '<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">'
    );
    
    // Replace modal body
    content = content.replace(
      /<div className="w-full max-w-md bg-\[#FFFFFF\] dark:bg-bg-surface rounded-\[20px\] shadow-2xl border border-border-subtle border-border-subtle overflow-hidden flex flex-col max-h-\[80vh\]">/,
      '<div className="w-full max-w-md bg-bg-surface dark:bg-bg-elevated rounded-[18px] shadow-xl border border-border-subtle overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-[0.98] duration-150 ease-out">'
    );
    content = content.replace(
      /<div className="relative w-full max-w-md bg-bg-secondary rounded-\[20px\] border border-border-subtle border-border-subtle shadow-2xl animate-slide-up">/,
      '<div className="relative w-full max-w-md bg-bg-surface dark:bg-bg-elevated rounded-[18px] shadow-xl border border-border-subtle overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-[0.98] duration-150 ease-out">'
    );
  }

  // Replace header
  content = content.replace(
    /<div className="p-6 border-b border-border-subtle border-border-subtle flex items-center justify-between">/g,
    '<div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">'
  );
  content = content.replace(
    /<div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle border-border-subtle">/g,
    '<div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">'
  );
  
  // Close button
  content = content.replace(
    /<button\s*onClick=\{[^\}]+\}\s*className="p-2 text-text-muted hover:text-text-main dark:hover:text-white bg-\[#F9FAFB\] dark:bg-\[rgba\(255,255,255,0\.04\)\] hover:bg-\[#EAECF0\] dark:hover:bg-\[rgba\(255,255,255,0\.08\)\] rounded-full transition-colors"\s*>\s*<X className="w-5 h-5" \/>\s*<\/button>/,
    (match) => {
      return match.replace(/className="[^"]+"/, 'className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-secondary rounded-full transition-colors"');
    }
  );
  content = content.replace(
    /<button onClick=\{[^\}]+\} className="text-text-muted hover:text-text-main dark:text-gray-200 transition-colors">\s*<X className="w-5 h-5" \/>\s*<\/button>/,
    (match) => {
      return match.replace(/className="[^"]+"/, 'className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-secondary rounded-full transition-colors"');
    }
  );
  
  // Header title size
  content = content.replace(/<h2 className="text-\[18px\] font-bold/g, '<h2 className="text-[17px] font-semibold');

  fs.writeFileSync(filePath, content);
}

standardizeModal('src/components/modals/NewChatModal.tsx');
standardizeModal('src/components/modals/ForwardModal.tsx');
standardizeModal('src/components/modals/GroupChatModal.tsx');
standardizeModal('src/components/modals/UsernameSetupModal.tsx', true);

console.log('Standardized Modals');

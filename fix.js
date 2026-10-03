const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

// Replace state
code = code.replace(
  'const [isEditingProfile, setIsEditingProfile] = useState(false);',
  'const [editingField, setEditingField] = useState<\\'display_name\\' | \\'username\\' | \\'bio\\' | null>(null);'
);

// We need to fix the useEffect that syncs profile to editForm
code = code.replace(
  '  }, [profile, isEditingProfile]);',
  '  }, [profile, editingField]);'
);
code = code.replace(
  'if (profile && isEditingProfile) {',
  'if (profile && editingField) {'
);

// Fix the cancel button in handleAvatarSelect (which was incorrectly resetting isEditingProfile)
code = code.replace(
  'setIsEditingProfile(false);',
  'setEditingField(null);'
);
// And in the handleUpdateProfile
code = code.replace(
  'setIsEditingProfile(false);',
  'setEditingField(null);'
);

fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log('Fixed state definitions');

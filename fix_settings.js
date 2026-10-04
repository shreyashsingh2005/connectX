const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');

const modals = `
function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated successfully');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-[#0B0F19] rounded-2xl w-full max-w-sm overflow-hidden border border-[#EAECF0] dark:border-[#1F2937] shadow-xl">
        <div className="p-4 border-b border-[#EAECF0] dark:border-[#1F2937] flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Change Password</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-[#1F2937] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#8B5CF6]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
            <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required className="w-full bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-[#1F2937] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#8B5CF6]" />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-[#8B5CF6] rounded-lg hover:bg-[#7C3AED] disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManageSessionsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!isOpen) return;
    loadDevices();
  }, [isOpen]);

  async function loadDevices() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('user_devices').select('*').eq('user_id', user.id).order('last_seen_at', { ascending: false });
    if (data) setDevices(data);
    setLoading(false);
  }

  async function handleSignOutOthers() {
    try {
      await supabase.auth.signOut({ scope: 'others' });
      // Keep only current device (we assume localstorage device_id matches one, but for simplicity let's just refresh)
      toast.success('Signed out of other sessions');
      loadDevices();
    } catch (e: any) {
      toast.error('Failed to sign out of other sessions');
    }
  }

  async function handleRevokeDevice(id: string) {
    try {
      await supabase.from('user_devices').delete().eq('id', id);
      setDevices(prev => prev.filter(d => d.id !== id));
      toast.success('Device revoked');
    } catch {
      toast.error('Failed to revoke device');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-[#0B0F19] rounded-2xl w-full max-w-md overflow-hidden border border-[#EAECF0] dark:border-[#1F2937] shadow-xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-[#EAECF0] dark:border-[#1F2937] flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-gray-900 dark:text-white">Manage Sessions</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><X size={20}/></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : (
            <div className="space-y-3">
              {devices.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#111827] rounded-xl border border-gray-100 dark:border-[#1F2937]">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{d.device_name || 'Unknown Device'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Last seen: {new Date(d.last_seen_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleRevokeDevice(d.id)} className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 bg-red-50 dark:bg-red-500/10 rounded">Revoke</button>
                </div>
              ))}
              {devices.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No active devices found.</p>}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-[#EAECF0] dark:border-[#1F2937] bg-gray-50 dark:bg-[#111827] flex-shrink-0">
          <button onClick={handleSignOutOthers} className="w-full py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
            Sign out all other sessions
          </button>
        </div>
      </div>
    </div>
  );
}
`;

if (!content.includes('ChangePasswordModal')) {
  // Add state to main component
  const imports = `import { useState, useEffect } from 'react';`;
  if (!content.includes('import { useState')) {
    content = content.replace("import { createClient }", "import { useState, useEffect } from 'react';\nimport { createClient }");
  }

  // Insert modals at top level
  content = content.replace('export default function SettingsPage() {', modals + '\n\nexport default function SettingsPage() {');

  // Add state
  const stateInsert = `
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  `;
  content = content.replace('export default function SettingsPage() {', 'export default function SettingsPage() {' + stateInsert);

  // Hook up buttons
  const oldPasswordBtn = `<button className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors group outline-none">
                     <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Change password</span>
                     <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] group-hover:text-[#667085] dark:group-hover:text-[#F5F7FA]" />
                   </button>`;
  const newPasswordBtn = `<button onClick={() => setShowPasswordModal(true)} className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors group outline-none">
                     <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Change password</span>
                     <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] group-hover:text-[#667085] dark:group-hover:text-[#F5F7FA]" />
                   </button>`;
  content = content.replace(oldPasswordBtn, newPasswordBtn);

  const oldSessionsBtn = `<button className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors group outline-none">
                     <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Manage sessions</span>
                     <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] group-hover:text-[#667085] dark:group-hover:text-[#F5F7FA]" />
                   </button>`;
  const newSessionsBtn = `<button onClick={() => setShowSessionsModal(true)} className="flex items-center justify-between p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#151922] rounded-[12px] transition-colors group outline-none">
                     <span className="text-[14px] font-medium text-[#101828] dark:text-[#F5F7FA]">Manage sessions</span>
                     <ChevronRight size={16} strokeWidth={1.75} className="text-[#98A2B3] group-hover:text-[#667085] dark:group-hover:text-[#F5F7FA]" />
                   </button>`;
  content = content.replace(oldSessionsBtn, newSessionsBtn);

  // Add modals to return
  content = content.replace('return (', 'return (\n    <>\n      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />\n      <ManageSessionsModal isOpen={showSessionsModal} onClose={() => setShowSessionsModal(false)} />');
  content = content.replace(/(\s*)<\/div>\s*$/g, '$1</div>\n    </>');

  fs.writeFileSync('src/app/(app)/settings/page.tsx', content);
}

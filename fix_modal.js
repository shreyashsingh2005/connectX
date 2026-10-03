const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/settings/page.tsx', 'utf8');
const regex = /{\/\* Edit Profile Modal \*\/}[\s\S]*?(?=\s*{showPhotoEditor &&)/;

const newModal = "{/* Edit Profile Modal */}\n" +
"      {editingField && (\n" +
"        <div className=\"fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#000000]/35 backdrop-blur-[2px] animate-in fade-in duration-200\">\n" +
"          <div className=\"bg-[#FFFFFF] dark:bg-[#11141A] w-full sm:max-w-[440px] rounded-t-[24px] sm:rounded-[24px] shadow-2xl border border-transparent dark:border-[#252A34] overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300\">\n" +
"            <div className=\"flex items-center justify-between p-5 border-b border-[#EAECF0] dark:border-[#252A34]\">\n" +
"              <h2 className=\"text-[16px] font-semibold text-[#101828] dark:text-[#F5F7FA]\">\n" +
"                {editingField === 'display_name' ? 'Edit Display Name' : editingField === 'username' ? 'Edit Username' : 'Edit About'}\n" +
"              </h2>\n" +
"              <button onClick={() => setEditingField(null)} className=\"text-[#98A2B3] hover:text-[#101828] dark:hover:text-[#F5F7FA] transition-colors p-1 rounded-full hover:bg-[#F8FAFC] dark:hover:bg-[#151922] outline-none\">\n" +
"                <X size={18} strokeWidth={1.75} />\n" +
"              </button>\n" +
"            </div>\n" +
"            \n" +
"            <form onSubmit={handleUpdateProfile} className=\"flex-1 overflow-y-auto p-5 space-y-5\">\n" +
"              {editingField === 'display_name' && (\n" +
"                <div className=\"space-y-1.5\">\n" +
"                  <label className=\"text-[13px] font-medium text-[#344054] dark:text-[#D0D5DD]\">Display Name</label>\n" +
"                  <div className=\"relative\">\n" +
"                    <UserRound size={16} strokeWidth={1.75} className=\"absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]\" />\n" +
"                    <input\n" +
"                      type=\"text\" required value={editForm.display_name} onChange={e => setEditForm({ ...editForm, display_name: e.target.value })}\n" +
"                      className=\"w-full bg-[#FFFFFF] dark:bg-[#090B10] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] h-[44px] pl-9 pr-3 text-[14px] text-[#101828] dark:text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all shadow-sm\"\n" +
"                    />\n" +
"                  </div>\n" +
"                </div>\n" +
"              )}\n" +
"\n" +
"              {editingField === 'username' && (\n" +
"                <div className=\"space-y-1.5\">\n" +
"                  <label className=\"text-[13px] font-medium text-[#344054] dark:text-[#D0D5DD]\">Username</label>\n" +
"                  <div className=\"relative\">\n" +
"                    <AtSign size={16} strokeWidth={1.75} className=\"absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]\" />\n" +
"                    <input\n" +
"                      type=\"text\" required value={editForm.username} onChange={handleUsernameChange}\n" +
"                      className={cn(\n" +
"                        \"w-full bg-[#FFFFFF] dark:bg-[#090B10] border rounded-[10px] h-[44px] pl-9 pr-20 text-[14px] text-[#101828] dark:text-[#F5F7FA] focus:outline-none focus:ring-1 transition-all shadow-sm\",\n" +
"                        isUsernameAvailable === false \n" +
"                          ? \"border-[#F97066] focus:border-[#F97066] focus:ring-[#F97066]\" \n" +
"                          : \"border-[#EAECF0] dark:border-[#252A34] focus:border-[#8B5CF6] focus:ring-[#8B5CF6]\"\n" +
"                      )}\n" +
"                    />\n" +
"                    <div className=\"absolute right-3 top-1/2 -translate-y-1/2\">\n" +
"                      {isCheckingUsername ? (\n" +
"                        <div className=\"flex items-center gap-1.5 text-[12px] font-medium text-[#667085] dark:text-[#98A2B3]\">\n" +
"                          <Loader2 size={14} strokeWidth={2} className=\"animate-spin\" />\n" +
"                        </div>\n" +
"                      ) : isUsernameAvailable === false ? (\n" +
"                        <span className=\"text-[12px] font-medium text-[#D92D20] dark:text-[#F97066]\">Taken</span>\n" +
"                      ) : isUsernameAvailable === true && editForm.username.length >= 3 && editForm.username !== profile.username ? (\n" +
"                        <span className=\"text-[12px] font-medium text-[#10B981] dark:text-[#32D583]\">Available</span>\n" +
"                      ) : null}\n" +
"                    </div>\n" +
"                  </div>\n" +
"                </div>\n" +
"              )}\n" +
"\n" +
"              {editingField === 'bio' && (\n" +
"                <div className=\"space-y-1.5\">\n" +
"                  <label className=\"text-[13px] font-medium text-[#344054] dark:text-[#D0D5DD]\">About</label>\n" +
"                  <textarea\n" +
"                    value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })}\n" +
"                    className=\"w-full bg-[#FFFFFF] dark:bg-[#090B10] border border-[#EAECF0] dark:border-[#252A34] rounded-[10px] py-2 px-3 text-[14px] text-[#101828] dark:text-[#F5F7FA] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all shadow-sm resize-none\"\n" +
"                    rows={2}\n" +
"                  />\n" +
"                </div>\n" +
"              )}\n" +
"              \n" +
"              <div className=\"pt-2 flex gap-3 mt-6\">\n" +
"                <button type=\"button\" onClick={() => setEditingField(null)} className=\"flex-1 h-[40px] bg-[#FFFFFF] dark:bg-[#151922] border border-[#EAECF0] dark:border-[#252A34] text-[#344054] dark:text-[#D0D5DD] rounded-[10px] text-[13px] font-medium hover:bg-[#F9FAFB] dark:hover:bg-[#252A34] transition-colors shadow-sm outline-none\">\n" +
"                  Cancel\n" +
"                </button>\n" +
"                <button type=\"submit\" disabled={isSaving || isUsernameAvailable === false} className=\"flex-1 h-[40px] bg-[#8B5CF6] text-white rounded-[10px] text-[13px] font-medium hover:bg-[#7C3AED] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 outline-none\">\n" +
"                  {isSaving ? <Loader2 size={16} strokeWidth={2} className=\"animate-spin\" /> : null}\n" +
"                  Save\n" +
"                </button>\n" +
"              </div>\n" +
"            </form>\n" +
"          </div>\n" +
"        </div>\n" +
"      )\n";

code = code.replace(regex, newModal);
fs.writeFileSync('src/app/(app)/settings/page.tsx', code);
console.log('Replaced modal successfully');

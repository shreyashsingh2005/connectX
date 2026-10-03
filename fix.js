const fs = require('fs');
let content = fs.readFileSync('src/components/chat/MessageComposer.tsx', 'utf8');

const targetStr = \              {attachments.map(att => (
                <div key={att.id} className="relative group flex-shrink-0 w-14 h-14 rounded-[10px] border border-[#EAECF0] dark:border-[#252A34] bg-[#F7F8FC] dark:bg-[#11141A] overflow-hidden">
                  {att.type === 'image' ? (
                    <img src={att.preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><FileText size={20} className="text-[#667085] dark:text-[#98A2B3]" /></div>
                  )}
                  <button type="button" onClick={() => removeAttachment(att.id)} className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                  {att.uploadProgress !== undefined && att.uploadProgress < 100 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-[10px] font-medium text-white">{Math.round(att.uploadProgress)}%</span></div>
                  )}
                </div>
              ))}\;

const newStr = \              {attachments.map(att => (
                <div key={att.id} className={cn("relative group flex-shrink-0 rounded-[10px] border border-[#EAECF0] dark:border-[#252A34] bg-[#F7F8FC] dark:bg-[#11141A] overflow-hidden", att.type === 'audio' ? "w-48 h-14" : "w-14 h-14")}>
                  {att.type === 'image' ? (
                    <img src={att.preview} alt="" className="w-full h-full object-cover" />
                  ) : att.type === 'video' ? (
                    <video src={att.preview} className="w-full h-full object-cover" />
                  ) : att.type === 'audio' ? (
                    <div className="w-full h-full flex items-center px-2">
                      <audio src={att.preview} controls className="w-full h-8" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><FileText size={20} className="text-[#667085] dark:text-[#98A2B3]" /></div>
                  )}
                  <button type="button" onClick={() => removeAttachment(att.id)} className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={12} /></button>
                  {att.uploadProgress !== undefined && att.uploadProgress < 100 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10"><span className="text-[10px] font-medium text-white">{Math.round(att.uploadProgress)}%</span></div>
                  )}
                </div>
              ))}\;

content = content.replace(targetStr, newStr);
fs.writeFileSync('src/components/chat/MessageComposer.tsx', content);

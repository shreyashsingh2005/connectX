const fs = require('fs');
let code = fs.readFileSync('src/components/chat/ProfilePanel.tsx', 'utf8');

const returnPos = code.indexOf('return (');
if (returnPos !== -1) {
  // Extract everything BEFORE the return
  const head = code.substring(0, returnPos);
  
  // Create a clean return block
  const tail = `return (
    <>
      <div className="flex flex-col h-full bg-white dark:bg-[#0E1015] border-l border-[#EAECF0] dark:border-[#252A34] w-72 flex-shrink-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#EAECF0] dark:border-[#252A34]">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Profile Info</h3>
          <button onClick={() => setShowProfilePanel(false)} className="text-gray-500 hover:text-gray-800 dark:text-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="flex flex-col items-center px-4 py-6 text-center border-b border-[#EAECF0] dark:border-[#252A34]">
            <div className="w-[84px] h-[84px] flex-shrink-0 relative group cursor-pointer" onClick={() => isDirect && isOwnProfile ? setShowPhotoEditor(true) : undefined}>
              <UserAvatar src={avatarUrl} name={name} className="w-full h-full text-2xl shadow-sm" isOnline={isDirect ? isOnline : undefined} />
              {isDirect && isOwnProfile && (
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Edit</span>
                </div>
              )}
            </div>
            <h2 className="mt-3 font-bold text-gray-900 dark:text-white text-base">{name}</h2>
            {isDirect && <div className="flex items-center gap-1.5 mt-1 justify-center">
              <span className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600")} />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {isOnline ? 'online' : (otherUser?.last_seen ? formatLastSeen(otherUser.last_seen) : 'offline')}
              </span>
            </div>}
            {!isDirect && <div className="flex items-center gap-1 mt-1"><Users className="w-3 h-3 text-gray-500" /><span className="text-xs text-gray-500">{memberCount} members</span></div>}
            {bio && <p className="text-gray-600 dark:text-gray-400 text-xs mt-2 leading-relaxed">{bio}</p>}
            {isDirect && otherUser?.username && <span className="text-xs text-gray-600 mt-1">@{otherUser.username}</span>}
          </div>
          <div className="p-4 border-b border-[#EAECF0] dark:border-[#252A34] space-y-1">
            <button onClick={handleMute} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-[#F9FAFB] dark:bg-[#11141A] transition-colors">
              {isMuted ? <Bell className="w-4 h-4 text-[#8B5CF6]" /> : <BellOff className="w-4 h-4 text-gray-500" />}
              <span>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
            </button>
            {isDirect && (
              <>
                <button onClick={handleBlock} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm hover:bg-[#F9FAFB] dark:bg-[#11141A] transition-colors">
                  <Shield className={cn('w-4 h-4', isBlocked ? 'text-green-400' : 'text-yellow-500')} />
                  <span className={isBlocked ? 'text-green-400' : 'text-yellow-500'}>{isBlocked ? 'Unblock User' : 'Block User'}</span>
                </button>
                <button onClick={handleReport} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-red-400 hover:bg-red-500/5 transition-colors">
                  <Flag className="w-4 h-4" /><span>Report User</span>
                </button>
              </>
            )}
          </div>
          <div className="p-4">
            <div className="flex gap-1 mb-3 bg-[#F9FAFB] dark:bg-[#11141A] rounded-xl p-1">
              {(['media', 'files'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all', activeTab === tab ? 'bg-[#8B5CF6] text-white' : 'text-gray-500')}>{tab}</button>
              ))}
            </div>
            {activeTab === 'media' && (
              mediaAttachments.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {mediaAttachments.map(att => (
                    <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden block">
                      <img src={att.url} alt={att.file_name} width={80} height={80} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6"><p className="text-xs text-gray-600">No media shared yet</p></div>
              )
            )}
            {activeTab === 'files' && (
              fileAttachments.length > 0 ? (
                <div className="space-y-2">
                  {fileAttachments.map(att => (
                    <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-xl bg-[#F9FAFB] dark:bg-[#11141A] hover:bg-[#EAECF0] dark:hover:bg-[#151922] transition-colors">
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{att.file_name}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6"><p className="text-xs text-gray-600">No files shared yet</p></div>
              )
            )}
            {!isDirect && conversation.members && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Members ({memberCount})</h4>
                <div className="space-y-2">
                  {conversation.members.map(member => (
                    <div key={member.id} className="flex items-center gap-2">
                      <UserAvatar src={member.profile?.avatar_url} name={member.profile?.display_name || 'User'} size="sm" isOnline={member.profile?.is_online} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{member.profile?.display_name}{member.user_id === profile?.id && <span className="text-gray-500"> (you)</span>}</p>
                        {member.role !== 'member' && <span className="text-[10px] text-[#8B5CF6] capitalize">{member.role}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showPhotoEditor && <ProfilePhotoEditor onClose={() => setShowPhotoEditor(false)} />}
    </>
  );
}
`;
  fs.writeFileSync('src/components/chat/ProfilePanel.tsx', head + tail, 'utf8');
}

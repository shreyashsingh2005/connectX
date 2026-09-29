export interface Profile {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  bio: string;
  is_online: boolean;
  last_seen: string;
  public_key?: string | null;
  key_version?: number;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  show_online_status: 'everyone' | 'contacts' | 'nobody';
  show_last_seen: 'everyone' | 'contacts' | 'nobody';
  read_receipts: boolean;
  profile_visibility: 'everyone' | 'contacts' | 'nobody';
  notifications_enabled: boolean;
  message_notifications: boolean;
  group_notifications: boolean;
  notification_sound: boolean;
  theme: 'dark' | 'light' | 'system';
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  created_by: string | null;
  last_message_id: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  other_member?: Profile;
  members?: ConversationMember[];
  last_message?: Message;
  unread_count?: number;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'member' | 'admin' | 'owner';
  joined_at: string;
  last_read_at: string;
  is_pinned: boolean;
  is_muted: boolean;
  is_archived: boolean;
  // Joined
  profile?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  reply_to_id: string | null;
  forwarded_from_id: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  sender?: Profile;
  reply_to?: Message;
  attachments?: Attachment[];
  reactions?: MessageReaction[];
  reads?: MessageRead[];
}

export interface Attachment {
  id: string;
  message_id: string;
  conversation_id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  url: string;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  created_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  // Joined
  profile?: Profile;
}

export interface MessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'group_invite' | 'mention' | 'reaction' | 'system' | 'friend_request' | 'friend_accept';
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Joined
  sender?: Profile;
  receiver?: Profile;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  // Joined
  friend?: Profile;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  // Joined
  blocked_profile?: Profile;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_message_id: string | null;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
}

export type TypingUser = {
  userId: string;
  username: string;
  conversationId: string;
};

export type UploadProgress = {
  fileId: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  url?: string;
  error?: string;
};

export type AttachmentPreview = {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video' | 'audio' | 'document';
  uploadProgress?: number;
  uploaded?: boolean;
  url?: string;
  storagePath?: string;
};

export type SearchResult = {
  type: 'user' | 'conversation' | 'message';
  data: Profile | Conversation | Message;
};

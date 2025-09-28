export interface Friend {
  id: string;
  username: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  level?: number;
  lastSeen?: Date;
  isOnline: boolean;
  isAI?: boolean; // 标识是否为AI NPC
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUsername: string;
  fromAvatar?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  senderId?: string;
  receiverId?: string;
  content: string;
  timestamp: Date | number;
  isRead: boolean;
  type?: 'text' | 'image' | 'system';
}

export interface ChatConversation {
  id: string;
  friendId: string;
  friendUsername: string;
  friendAvatar?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  messages: ChatMessage[];
}
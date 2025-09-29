import { Friend, FriendRequest, ChatMessage, ChatConversation } from '../types/friend';

// 模拟数据存储
let friends: Friend[] = [
  {
    id: 'ai-assistant',
    username: 'AI游戏助手',
    avatar: '🤖',
    status: 'online',
    level: 99,
    isOnline: true,
    lastSeen: new Date(),
    isAI: true
  },
  {
    id: 'ai-trader',
    username: 'AI交易顾问',
    avatar: '💎',
    status: 'online',
    level: 88,
    isOnline: true,
    lastSeen: new Date(),
    isAI: true
  },
  {
    id: '1',
    username: '游戏高手',
    avatar: '🎮',
    status: 'online',
    level: 25,
    isOnline: true,
    lastSeen: new Date()
  },
  {
    id: '2',
    username: '交易达人',
    avatar: '💰',
    status: 'offline',
    level: 18,
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000)
  }
];

let friendRequests: FriendRequest[] = [
  {
    id: '1',
    fromUserId: '3',
    toUserId: 'current',
    fromUsername: '新玩家123',
    fromAvatar: '🆕',
    status: 'pending',
    createdAt: new Date()
  }
];

let conversations: ChatConversation[] = [
  {
    id: '1',
    friendId: '1',
    friendUsername: '游戏高手',
    friendAvatar: '🎮',
    unreadCount: 2,
    messages: [
      {
        id: '1',
        fromUserId: '1',
        toUserId: 'current',
        content: '嘿，想一起玩游戏吗？',
        timestamp: new Date(Date.now() - 1800000),
        isRead: false,
        type: 'text'
      },
      {
        id: '2',
        fromUserId: 'current',
        toUserId: '1',
        content: '好啊！什么时候开始？',
        timestamp: new Date(Date.now() - 1700000),
        isRead: true,
        type: 'text'
      }
    ]
  },
  {
    id: 'ai-assistant',
    friendId: 'ai-assistant',
    friendUsername: 'AI游戏助手',
    friendAvatar: '🤖',
    unreadCount: 0,
    messages: [
      {
        id: 'welcome-ai',
        fromUserId: 'ai-assistant',
        toUserId: 'current',
        content: '你好！我是AI游戏助手，有什么游戏问题可以问我哦！🎮',
        timestamp: new Date(Date.now() - 3600000),
        isRead: true,
        type: 'text'
      }
    ]
  },
  {
    id: 'ai-trader',
    friendId: 'ai-trader',
    friendUsername: 'AI交易顾问',
    friendAvatar: '💎',
    unreadCount: 0,
    messages: [
      {
        id: 'welcome-trader',
        fromUserId: 'ai-trader',
        toUserId: 'current',
        content: '欢迎！我是AI交易顾问，可以为你提供市场分析和交易建议！💰',
        timestamp: new Date(Date.now() - 3600000),
        isRead: true,
        type: 'text'
      }
    ]
  }
];

class FriendService {
  // 获取好友列表
  async getFriends(): Promise<Friend[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...friends]);
      }, 300);
    });
  }

  // 获取好友请求列表
  async getFriendRequests(): Promise<FriendRequest[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...friendRequests]);
      }, 300);
    });
  }

  // 发送好友请求
  async sendFriendRequest(username: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newRequest: FriendRequest = {
          id: Date.now().toString(),
          fromUserId: 'current',
          toUserId: 'unknown',
          fromUsername: '当前用户',
          fromAvatar: '👤',
          status: 'pending',
          createdAt: new Date()
        };
        friendRequests.push(newRequest);
        resolve(true);
      }, 500);
    });
  }

  // 接受好友请求
  async acceptFriendRequest(requestId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const request = friendRequests.find(r => r.id === requestId);
        if (request) {
          request.status = 'accepted';
          // 添加到好友列表
          const newFriend: Friend = {
            id: request.fromUserId,
            username: request.fromUsername,
            avatar: request.fromAvatar,
            status: 'online',
            level: Math.floor(Math.random() * 50) + 1,
            isOnline: Math.random() > 0.5,
            lastSeen: new Date()
          };
          friends.push(newFriend);
        }
        resolve(true);
      }, 500);
    });
  }

  // 拒绝好友请求
  async rejectFriendRequest(requestId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const request = friendRequests.find(r => r.id === requestId);
        if (request) {
          request.status = 'rejected';
        }
        resolve(true);
      }, 500);
    });
  }

  // 删除好友
  async removeFriend(friendId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = friends.findIndex(f => f.id === friendId);
        if (index > -1) {
          friends.splice(index, 1);
        }
        resolve(true);
      }, 500);
    });
  }

  // 获取对话列表
  async getConversations(): Promise<ChatConversation[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...conversations]);
      }, 300);
    });
  }

  // 获取消息列表
  async getMessages(friendId: string): Promise<ChatMessage[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const conversation = conversations.find(c => c.friendId === friendId);
        resolve(conversation ? [...conversation.messages] : []);
      }, 300);
    });
  }

  // 发送消息
  async sendMessage(friendId: string, content: string): Promise<ChatMessage> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const message: ChatMessage = {
          id: Date.now().toString(),
          fromUserId: 'current',
          toUserId: friendId,
          content: content,
          timestamp: new Date(),
          isRead: false,
          type: 'text'
        };

        // 找到或创建对话
        let conversation = conversations.find(c => c.friendId === friendId);
        if (!conversation) {
          const friend = friends.find(f => f.id === friendId);
          conversation = {
            id: friendId,
            friendId: friendId,
            friendUsername: friend?.username || '未知用户',
            friendAvatar: friend?.avatar,
            unreadCount: 0,
            messages: []
          };
          conversations.push(conversation);
        }

        conversation.messages.push(message);
        conversation.lastMessage = message;
        resolve(message);
      }, 300);
    });
  }

  // 标记消息为已读
  async markMessagesAsRead(friendId: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const conversation = conversations.find(c => c.friendId === friendId);
        if (conversation) {
          conversation.messages.forEach(msg => {
            if (msg.toUserId === 'current') {
              msg.isRead = true;
            }
          });
          conversation.unreadCount = 0;
        }
        resolve();
      }, 100);
    });
  }
}

export const friendService = new FriendService();
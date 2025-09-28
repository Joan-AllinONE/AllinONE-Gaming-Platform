import React, { useState, useEffect } from 'react';
import { Friend, ChatConversation } from '../types/friend';
import { FriendsList } from './FriendsList';
import { ChatWindow } from './ChatWindow';
import { AIConfigModal } from './AIConfigModal';
import { friendService } from '../services/friendService';

export const TeamCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'friends' | 'chats'>('friends');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeChatFriend, setActiveChatFriend] = useState<Friend | null>(null);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  useEffect(() => {
    loadConversations();
    // 模拟实时更新
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);
    setTotalUnreadCount(unreadCount);
  }, [conversations]);

  const loadConversations = async () => {
    try {
      const convs = await friendService.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('加载对话列表失败:', error);
    }
  };

  const handleStartChat = (friend: Friend) => {
    setActiveChatFriend(friend);
    // 标记该好友的消息为已读
    friendService.markMessagesAsRead(friend.id).then(() => {
      loadConversations();
    });
  };

  const handleCloseChat = () => {
    setActiveChatFriend(null);
    loadConversations(); // 重新加载对话列表以更新未读计数
  };

  const handleChatFromConversation = (conversation: ChatConversation) => {
    const friend: Friend = {
      id: conversation.friendId,
      username: conversation.friendUsername,
      avatar: conversation.friendAvatar,
      status: 'online', // 简化处理
      isOnline: true
    };
    handleStartChat(friend);
  };

  const formatLastMessageTime = (timestamp?: Date | number) => {
    if (!timestamp) return '';
    
    const tsDate = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diff = now.getTime() - tsDate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return tsDate.toLocaleDateString();
  };

  return (
    <div className="team-center">
      <div className="team-header">
        <h2>🤝 团队中心</h2>
        <div className="team-tabs">
          <button 
            className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            👥 好友管理
          </button>
          <button 
            className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            💬 聊天记录
            {totalUnreadCount > 0 && (
              <span className="unread-badge">{totalUnreadCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="team-content">
        {activeTab === 'friends' && (
          <FriendsList onStartChat={handleStartChat} />
        )}

        {activeTab === 'chats' && (
          <div className="chats-section">
            <div className="chats-header">
              <h3>最近对话</h3>
              <div className="chats-stats">
                共 {conversations.length} 个对话
              </div>
            </div>
            
            <div className="conversations-list">
              {conversations.map(conversation => (
                <div 
                  key={conversation.id} 
                  className="conversation-item"
                  onClick={() => handleChatFromConversation(conversation)}
                >
                  <div className="conversation-avatar">
                    {conversation.friendAvatar || '👤'}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-name">
                      {conversation.friendUsername}
                      {conversation.unreadCount > 0 && (
                        <span className="unread-count">{conversation.unreadCount}</span>
                      )}
                    </div>
                    <div className="conversation-last-message">
                      {conversation.lastMessage?.content || '暂无消息'}
                    </div>
                  </div>
                  <div className="conversation-time">
                    {formatLastMessageTime(conversation.lastMessage?.timestamp)}
                  </div>
                </div>
              ))}
            </div>

            {conversations.length === 0 && (
              <div className="empty-chats">
                <div className="empty-icon">💬</div>
                <div className="empty-text">还没有聊天记录</div>
                <div className="empty-hint">添加好友后开始聊天吧！</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 聊天窗口 */}
      {activeChatFriend && (
        <ChatWindow 
          friend={activeChatFriend} 
          onClose={handleCloseChat}
        />
      )}

      <style>{`
        .team-center {
          /* Styles for dark theme */
        }

        .team-header {
          margin-bottom: 20px;
        }

        .team-header h2 {
          margin: 0 0 20px 0;
          color: #facc15; /* yellow-400 */
          font-size: 24px;
          font-weight: bold;
        }

        .team-tabs {
          display: flex;
          gap: 10px;
        }

        .tab-btn {
          position: relative;
          padding: 10px 20px;
          border: 1px solid #475569; /* slate-600 */
          border-radius: 20px;
          background: transparent;
          color: #94a3b8; /* slate-400 */
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tab-btn.active {
          background: #facc15; /* yellow-400 */
          color: #1e293b; /* slate-800 */
          border-color: #facc15;
          font-weight: bold;
        }

        .tab-btn:hover:not(.active) {
          background: #334155; /* slate-700 */
          color: #cbd5e1; /* slate-300 */
        }

        .unread-badge {
          background: #ef4444; /* red-500 */
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 12px;
          min-width: 18px;
          text-align: center;
        }

        .team-content {
          padding: 0;
        }

        .chats-section {
          padding: 0;
        }

        .chats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #475569; /* slate-600 */
        }

        .chats-header h3 {
          margin: 0;
          color: #cbd5e1; /* slate-300 */
          font-weight: bold;
        }

        .chats-stats {
          color: #94a3b8; /* slate-400 */
          font-size: 14px;
        }

        .conversations-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .conversation-item {
          display: flex;
          align-items: center;
          padding: 15px;
          border: 1px solid #475569; /* slate-600 */
          background: #334155; /* slate-700 */
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .conversation-item:hover {
          background: #475569; /* slate-600 */
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .conversation-avatar {
          font-size: 24px;
          margin-right: 15px;
          color: #cbd5e1; /* slate-300 */
        }

        .conversation-info {
          flex: 1;
        }

        .conversation-name {
          font-weight: bold;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #cbd5e1; /* slate-300 */
        }

        .unread-count {
          background: #ef4444; /* red-500 */
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 12px;
          min-width: 18px;
          text-align: center;
        }

        .conversation-last-message {
          color: #94a3b8; /* slate-400 */
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 300px;
        }

        .conversation-time {
          color: #94a3b8; /* slate-400 */
          font-size: 12px;
          white-space: nowrap;
        }

        .empty-chats {
          text-align: center;
          padding: 60px 20px;
          color: #94a3b8; /* slate-400 */
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .empty-text {
          font-size: 18px;
          margin-bottom: 10px;
        }

        .empty-hint {
          font-size: 14px;
          color: #94a3b8; /* slate-400 */
        }
      `}</style>
    </div>
  );
};
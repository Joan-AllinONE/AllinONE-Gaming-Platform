import React, { useState, useEffect } from 'react';
import { Friend, FriendRequest } from '../types/friend';
import { friendService } from '../services/friendService';

interface FriendsListProps {
  onStartChat: (friend: Friend) => void;
}

export const FriendsList: React.FC<FriendsListProps> = ({ onStartChat }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

  const loadFriends = async () => {
    try {
      const friendsData = await friendService.getFriends();
      setFriends(friendsData);
    } catch (error) {
      console.error('加载好友列表失败:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const requests = await friendService.getFriendRequests();
      setFriendRequests(requests);
    } catch (error) {
      console.error('加载好友请求失败:', error);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!newFriendUsername.trim()) return;
    
    setLoading(true);
    try {
      await friendService.sendFriendRequest(newFriendUsername);
      setNewFriendUsername('');
      alert('好友请求已发送！');
    } catch (error) {
      alert('发送好友请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        await friendService.acceptFriendRequest(requestId);
      } else {
        await friendService.rejectFriendRequest(requestId);
      }
      await loadFriendRequests();
      if (action === 'accept') {
        await loadFriends();
      }
    } catch (error) {
      alert('处理好友请求失败');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (confirm('确定要删除这个好友吗？')) {
      try {
        await friendService.removeFriend(friendId);
        await loadFriends();
      } catch (error) {
        alert('删除好友失败');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'away': return '#FF9800';
      case 'offline': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (friend: Friend) => {
    if (friend.isOnline) return '在线';
    if (friend.lastSeen) {
      const diff = Date.now() - friend.lastSeen.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) return '刚刚离线';
      if (hours < 24) return `${hours}小时前在线`;
      return '很久未上线';
    }
    return '离线';
  };

  return (
    <div className="friends-list">
      <div className="friends-header">
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            好友列表 ({friends.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            好友请求 ({friendRequests.length})
          </button>
        </div>
      </div>

      {activeTab === 'friends' && (
        <div className="friends-content">
          <div className="add-friend-section">
            <div className="add-friend-form">
              <input
                type="text"
                placeholder="输入用户名添加好友"
                value={newFriendUsername}
                onChange={(e) => setNewFriendUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendFriendRequest()}
              />
              <button 
                onClick={handleSendFriendRequest}
                disabled={loading || !newFriendUsername.trim()}
                className="add-friend-btn"
              >
                {loading ? '发送中...' : '添加'}
              </button>
            </div>
          </div>

          <div className="friends-grid">
            {friends.map(friend => (
              <div key={friend.id} className="friend-card">
                <div className="friend-avatar">
                  {friend.avatar || '👤'}
                  <div 
                    className="status-indicator"
                    style={{ backgroundColor: getStatusColor(friend.status) }}
                  />
                </div>
                <div className="friend-info">
                  <div className="friend-name">{friend.username}</div>
                  <div className="friend-status">{getStatusText(friend)}</div>
                  {friend.level && (
                    <div className="friend-level">等级 {friend.level}</div>
                  )}
                </div>
                <div className="friend-actions">
                  <button 
                    className="chat-btn"
                    onClick={() => onStartChat(friend)}
                  >
                    💬
                  </button>
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveFriend(friend.id)}
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))}
          </div>

          {friends.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <div className="empty-text">还没有好友，快去添加一些吧！</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="requests-content">
          {friendRequests.map(request => (
            <div key={request.id} className="request-card">
              <div className="request-avatar">
                {request.fromAvatar || '👤'}
              </div>
              <div className="request-info">
                <div className="request-name">{request.fromUsername}</div>
                <div className="request-time">
                  {request.createdAt.toLocaleString()}
                </div>
              </div>
              <div className="request-actions">
                <button 
                  className="accept-btn"
                  onClick={() => handleFriendRequest(request.id, 'accept')}
                >
                  接受
                </button>
                <button 
                  className="reject-btn"
                  onClick={() => handleFriendRequest(request.id, 'reject')}
                >
                  拒绝
                </button>
              </div>
            </div>
          ))}

          {friendRequests.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📬</div>
              <div className="empty-text">暂无好友请求</div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .friends-list {
          background: transparent;
          padding: 0;
          box-shadow: none;
        }

        .friends-header {
          margin-bottom: 20px;
        }

        .tab-buttons {
          display: flex;
          gap: 10px;
        }

        .tab-btn {
          padding: 8px 16px;
          border: 1px solid #475569; /* slate-600 */
          border-radius: 20px;
          background: transparent;
          color: #94a3b8; /* slate-400 */
          cursor: pointer;
          transition: all 0.3s;
        }

        .tab-btn.active {
          background: #60a5fa; /* blue-400 */
          color: white;
          border-color: #60a5fa;
        }

        .add-friend-section {
          margin-bottom: 20px;
          padding: 15px;
          background: #334155; /* slate-700 */
          border-radius: 8px;
        }

        .add-friend-form {
          display: flex;
          gap: 10px;
        }

        .add-friend-form input {
          flex: 1;
          padding: 10px;
          border: 1px solid #475569; /* slate-600 */
          background: #1e293b; /* slate-800 */
          color: #cbd5e1; /* slate-300 */
          border-radius: 6px;
          font-size: 14px;
        }
        
        .add-friend-form input::placeholder {
          color: #94a3b8; /* slate-400 */
        }

        .add-friend-btn {
          padding: 10px 20px;
          background: #4ade80; /* green-400 */
          color: #1e293b; /* slate-800 */
          font-weight: bold;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .add-friend-btn:hover:not(:disabled) {
          background: #22c55e; /* green-500 */
        }

        .add-friend-btn:disabled {
          background: #475569; /* slate-600 */
          cursor: not-allowed;
        }

        .friends-grid {
          display: grid;
          gap: 15px;
        }

        .friend-card {
          display: flex;
          align-items: center;
          padding: 15px;
          border: 1px solid #475569; /* slate-600 */
          background: #334155; /* slate-700 */
          border-radius: 8px;
          transition: all 0.3s;
        }

        .friend-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transform: translateY(-1px);
          background: #475569; /* slate-600 */
        }

        .friend-avatar {
          position: relative;
          font-size: 24px;
          margin-right: 15px;
          color: #cbd5e1; /* slate-300 */
        }

        .status-indicator {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 2px solid #334155; /* slate-700 */
        }

        .friend-info {
          flex: 1;
        }

        .friend-name {
          font-weight: bold;
          margin-bottom: 4px;
          color: #cbd5e1; /* slate-300 */
        }

        .friend-status {
          font-size: 12px;
          color: #94a3b8; /* slate-400 */
        }

        .friend-level {
          font-size: 12px;
          color: #60a5fa; /* blue-400 */
          margin-top: 2px;
        }

        .friend-actions {
          display: flex;
          gap: 8px;
        }

        .chat-btn, .remove-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s;
          color: white;
        }

        .chat-btn {
          background: #60a5fa; /* blue-400 */
        }

        .chat-btn:hover {
          background: #3b82f6; /* blue-500 */
        }

        .remove-btn {
          background: #ef4444; /* red-500 */
        }

        .remove-btn:hover {
          background: #dc2626; /* red-600 */
        }

        .requests-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .request-card {
          display: flex;
          align-items: center;
          padding: 15px;
          border: 1px solid #475569; /* slate-600 */
          border-radius: 8px;
          background: #334155; /* slate-700 */
        }

        .request-avatar {
          font-size: 24px;
          margin-right: 15px;
          color: #cbd5e1; /* slate-300 */
        }

        .request-info {
          flex: 1;
        }

        .request-name {
          font-weight: bold;
          margin-bottom: 4px;
          color: #cbd5e1; /* slate-300 */
        }

        .request-time {
          font-size: 12px;
          color: #94a3b8; /* slate-400 */
        }

        .request-actions {
          display: flex;
          gap: 8px;
        }

        .accept-btn, .reject-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.3s;
          font-weight: bold;
        }

        .accept-btn {
          background: #4ade80; /* green-400 */
          color: #1e293b; /* slate-800 */
        }

        .accept-btn:hover {
          background: #22c55e; /* green-500 */
        }

        .reject-btn {
          background: #ef4444; /* red-500 */
          color: white;
        }

        .reject-btn:hover {
          background: #dc2626; /* red-600 */
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #94a3b8; /* slate-400 */
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 10px;
        }

        .empty-text {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};
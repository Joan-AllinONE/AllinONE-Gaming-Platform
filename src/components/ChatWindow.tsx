import React, { useState, useEffect, useRef } from 'react';
import { Friend, ChatMessage } from '../types/friend';
import { aiChatService } from '../services/aiChatService';
import { friendService } from '../services/friendService';

interface ChatWindowProps {
  friend: Friend;
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ friend, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    markAsRead();
  }, [friend.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const messagesData = await friendService.getMessages(friend.id);
      setMessages(messagesData);
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  };

  const markAsRead = async () => {
    try {
      await friendService.markMessagesAsRead(friend.id);
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    const userMessage = newMessage;
    setNewMessage('');

    try {
      // 添加用户消息
      const message = await friendService.sendMessage(friend.id, userMessage);
      setMessages(prev => [...prev, message]);

      // 如果是AI好友，使用AI服务回复
      if (friend.isAI) {
        try {
          // 显示"正在输入"状态
          const typingMessage: ChatMessage = {
            id: 'typing',
            fromUserId: friend.id,
            toUserId: 'current',
            content: '正在输入...',
            timestamp: new Date(),
            isRead: false,
            type: 'text'
          };
          setMessages(prev => [...prev, typingMessage]);

          // 构建AI上下文
          const context = `你是${friend.username}，一个${friend.level}级的${
            friend.username.includes('助手') ? '游戏助手，专门帮助玩家提升游戏技巧和策略' : 
            friend.username.includes('顾问') ? '交易顾问，专门协助玩家进行游戏内交易和投资决策' : '游戏NPC'
          }。请用友好、专业的语气回复玩家。`;

          const aiResponse = await aiChatService.sendMessage(
            `chat_${friend.id}`, 
            userMessage, 
            context
          );

          // 移除"正在输入"消息，添加AI回复
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== 'typing');
            const reply: ChatMessage = {
              id: Date.now().toString(),
              fromUserId: friend.id,
              toUserId: 'current',
              content: aiResponse,
              timestamp: new Date(),
              isRead: false,
              type: 'text'
            };
            return [...filtered, reply];
          });
        } catch (aiError) {
          console.error('AI回复失败:', aiError);
          // AI服务失败时的备用回复
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== 'typing');
            const reply: ChatMessage = {
              id: Date.now().toString(),
              fromUserId: friend.id,
              toUserId: 'current',
              content: '抱歉，我现在有点忙，稍后再聊吧！如果你需要帮助，可以稍后再试试。',
              timestamp: new Date(),
              isRead: false,
              type: 'text'
            };
            return [...filtered, reply];
          });
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      alert('发送消息失败');
      setNewMessage(userMessage); // 恢复消息内容
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date | number) => {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      height: '500px',
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      border: '2px solid #a855f7',
      borderRadius: '15px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      color: 'white'
    }}>
      {/* 聊天头部 */}
      <div style={{
        padding: '15px',
        borderBottom: '1px solid #475569',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(168, 85, 247, 0.1)',
        borderRadius: '13px 13px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            position: 'relative',
            fontSize: '24px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(168, 85, 247, 0.2)',
            borderRadius: '50%'
          }}>
            {friend.avatar || '👤'}
            {friend.isAI && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                fontSize: '12px',
                background: '#fbbf24',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>🤖</span>
            )}
            <div style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              border: '2px solid #1e293b',
              backgroundColor: friend.isOnline ? '#4CAF50' : '#9E9E9E'
            }} />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {friend.username}
              {friend.isAI && (
                <span style={{
                  background: '#fbbf24',
                  color: '#1e293b',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 'bold'
                }}>AI</span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {friend.isOnline ? '在线' : '离线'}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '50%',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          ✕
        </button>
      </div>

      {/* 消息区域 */}
      <div style={{
        flex: 1,
        padding: '15px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map(message => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: '80%',
              alignSelf: message.fromUserId === 'current' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              padding: '10px 15px',
              borderRadius: '15px',
              wordWrap: 'break-word',
              background: message.fromUserId === 'current' 
                ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                : message.id === 'typing'
                ? 'rgba(168, 85, 247, 0.2)'
                : '#374151',
              color: 'white',
              border: message.id === 'typing' ? '1px dashed #a855f7' : 'none'
            }}>
              {message.content}
              {message.id === 'typing' && (
                <span style={{ marginLeft: '8px' }}>
                  <span style={{ animation: 'typing 1.4s infinite ease-in-out' }}>●</span>
                  <span style={{ animation: 'typing 1.4s infinite ease-in-out 0.2s' }}>●</span>
                  <span style={{ animation: 'typing 1.4s infinite ease-in-out 0.4s' }}>●</span>
                </span>
              )}
            </div>
            <div style={{
              fontSize: '10px',
              color: '#94a3b8',
              marginTop: '4px',
              textAlign: message.fromUserId === 'current' ? 'right' : 'left'
            }}>
              {formatTime(message.timestamp)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={{
        padding: '15px',
        borderTop: '1px solid #475569',
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-end'
      }}>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={friend.isAI ? `与${friend.username}聊天...` : "输入消息..."}
          disabled={loading}
          rows={1}
          style={{
            flex: 1,
            background: '#374151',
            border: '1px solid #4b5563',
            borderRadius: '10px',
            padding: '10px',
            color: 'white',
            resize: 'none',
            minHeight: '20px',
            maxHeight: '80px',
            fontFamily: 'inherit'
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || loading}
          style={{
            background: loading ? '#6b7280' : 'linear-gradient(135deg, #a855f7, #ec4899)',
            border: 'none',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          {loading ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
};
import React from 'react';
import { TeamCenter } from '../components/TeamCenter';

export const TeamDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-purple-400 mb-4">
            🎮 AllinONE 游戏平台 - 团队功能演示
          </h1>
          <p className="text-xl text-slate-300">
            体验完整的好友系统和聊天功能
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <TeamCenter />
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-purple-400 mb-8">
            ✨ 功能特色
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/80 border border-purple-400/30 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-bold text-purple-400 mb-2">好友管理</h3>
              <p className="text-slate-400 text-sm">添加好友、管理好友列表、查看在线状态</p>
            </div>
            <div className="bg-slate-800/80 border border-green-400/30 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-bold text-green-400 mb-2">实时聊天</h3>
              <p className="text-slate-400 text-sm">与好友实时交流，支持文字消息和表情</p>
            </div>
            <div className="bg-slate-800/80 border border-yellow-400/30 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-lg font-bold text-yellow-400 mb-2">消息通知</h3>
              <p className="text-slate-400 text-sm">未读消息提醒，不错过任何重要对话</p>
            </div>
            <div className="bg-slate-800/80 border border-blue-400/30 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-bold text-blue-400 mb-2">游戏集成</h3>
              <p className="text-slate-400 text-sm">与游戏功能深度集成，促进交易和合作</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { usePlatformManagement } from '@/contexts/PlatformManagementContext';

// 页面头部组件
const PlatformHeader: React.FC = () => {
  const { currentUser, setCurrentUser, members } = usePlatformManagement();

  return (
    <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">平台管理系统</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">投票决策与参数管理</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={currentUser?.id || ''}
                onChange={(e) => setCurrentUser(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200"
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role === 'founder' ? '创始人' : member.role === 'admin' ? '管理员' : '社区代表'})
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <span className="text-slate-500">👤</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PlatformHeader;
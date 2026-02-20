import React from 'react';
import { PlatformMember } from '@/types/platformManagement';

interface MembersListProps {
  members: PlatformMember[];
  loading: boolean;
  currentUser: PlatformMember | null;
  onSelectUser: (userId: string) => void;
}

/**
 * 平台成员列表组件
 */
const MembersList: React.FC<MembersListProps> = ({ members, loading, currentUser, onSelectUser }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 按角色分组成员
  const founderMembers = members.filter(member => member.role === 'founder');
  const platformManagers = members.filter(member => member.role === 'platform_manager');
  const communityRepresentatives = members.filter(member => member.role === 'community_representative');

  // 获取角色名称
  const getRoleName = (role: string) => {
    switch (role) {
      case 'founder':
        return '创始人';
      case 'platform_manager':
        return '平台管理者';
      case 'community_representative':
        return '社区代表';
      default:
        return '未知角色';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">平台管理成员</h2>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">当前登录身份</h3>
          {currentUser ? (
            <div className="flex items-center gap-4">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-16 h-16 rounded-full"
              />
              <div>
                <div className="font-medium text-lg">{currentUser.name}</div>
                <div className="text-slate-600 dark:text-slate-300">
                  {getRoleName(currentUser.role)}
                  {currentUser.hasVetoRight && (
                    <span className="ml-2 text-purple-600 dark:text-purple-400">(拥有否决权)</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-600 dark:text-slate-300">未登录</div>
          )}
        </div>
        
        <div className="border-t border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold mb-4">切换身份</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
            为了演示目的，您可以切换不同的身份来体验平台管理系统的不同权限。
          </p>
          
          <div className="space-y-6">
            {/* 创始人 */}
            <div>
              <h4 className="font-medium text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">创始人</h4>
              <div className="grid grid-cols-1 gap-4">
                {founderMembers.map(member => (
                  <MemberCard 
                    key={member.id} 
                    member={member} 
                    isSelected={currentUser?.id === member.id}
                    onSelect={() => onSelectUser(member.id)}
                  />
                ))}
              </div>
            </div>
            
            {/* 平台管理者 */}
            <div>
              <h4 className="font-medium text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">平台管理者</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platformManagers.map(member => (
                  <MemberCard 
                    key={member.id} 
                    member={member} 
                    isSelected={currentUser?.id === member.id}
                    onSelect={() => onSelectUser(member.id)}
                  />
                ))}
              </div>
            </div>
            
            {/* 社区代表 */}
            <div>
              <h4 className="font-medium text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">社区代表</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {communityRepresentatives.map(member => (
                  <MemberCard 
                    key={member.id} 
                    member={member} 
                    isSelected={currentUser?.id === member.id}
                    onSelect={() => onSelectUser(member.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MemberCardProps {
  member: PlatformMember;
  isSelected: boolean;
  onSelect: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, isSelected, onSelect }) => {
  return (
    <div 
      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <img 
          src={member.avatar} 
          alt={member.name} 
          className="w-12 h-12 rounded-full"
        />
        <div>
          <div className="font-medium">{member.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            加入时间: {new Date(member.joinedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersList;
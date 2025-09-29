import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePlatformManagement } from '@/contexts/PlatformManagementContext';
import PlatformDashboard from '@/components/platform/PlatformDashboard';
import ParametersList from '@/components/platform/ParametersList';
import VotesList from '@/components/platform/VotesList';
import MembersList from '@/components/platform/MembersList';
import CreateVoteModal from '@/components/platform/CreateVoteModal';
import PerformanceManagement from '@/components/platform/PerformanceManagement';
import { PlatformParameter } from '@/types/platformManagement';

/**
 * 平台管理页面
 */
const PlatformManagement: React.FC = () => {
  const {
    platformData,
    parameters,
    activeVotes,
    finishedVotes,
    members,
    currentUser,
    loading,
    createVote,
    submitVote,
    finalizeVote,
    vetoVote,
    selectUser
  } = usePlatformManagement();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'parameters' | 'votes' | 'members' | 'performance'>('dashboard');
  const [selectedParameter, setSelectedParameter] = useState<PlatformParameter | null>(null);
  const [showCreateVoteModal, setShowCreateVoteModal] = useState(false);
  
  const handleCreateVote = async (
    title: string,
    description: string,
    parameterId: string,
    proposedValue: number,
    reason: string
  ) => {
    if (!currentUser) return;
    
    try {
      await createVote(title, description, parameterId, proposedValue, reason, currentUser.id);
      setShowCreateVoteModal(false);
    } catch (error) {
      console.error('创建投票失败:', error);
    }
  };
  
  const handleOpenCreateVoteModal = (parameter: PlatformParameter) => {
    setSelectedParameter(parameter);
    setShowCreateVoteModal(true);
  };
  
  const handleCloseCreateVoteModal = () => {
    setSelectedParameter(null);
    setShowCreateVoteModal(false);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面头部和导航链接 */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">平台管理系统</h1>
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <i className="fa-solid fa-home mr-2"></i>
            回到主页
          </Link>
          <Link 
            to="/computing-dashboard" 
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <i className="fa-solid fa-microchip mr-2"></i>
            算力中心
          </Link>
          <Link 
            to="/fund-pool" 
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <i className="fa-solid fa-coins mr-2"></i>
            资金池
          </Link>
        </div>
      </div>
      
      {/* 标签导航 */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-8">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'dashboard'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('dashboard')}
        >
          平台数据
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'parameters'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('parameters')}
        >
          参数管理
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'votes'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('votes')}
        >
          投票决策
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'members'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('members')}
        >
          成员管理
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'performance'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          onClick={() => setActiveTab('performance')}
        >
          🎯 绩效管理
        </button>
      </div>
      
      {/* 内容区域 */}
      <div>
        {activeTab === 'dashboard' && (
          <PlatformDashboard platformData={platformData} loading={loading} />
        )}
        
        {activeTab === 'parameters' && (
          <ParametersList 
            parameters={parameters} 
            loading={loading} 
            onCreateVote={handleOpenCreateVoteModal} 
          />
        )}
        
        {activeTab === 'votes' && (
          <VotesList 
            activeVotes={activeVotes}
            finishedVotes={finishedVotes}
            currentUser={currentUser}
            loading={loading}
            onSubmitVote={submitVote}
            onFinalizeVote={finalizeVote}
            onVetoVote={vetoVote}
          />
        )}
        
        {activeTab === 'members' && (
          <MembersList 
            members={members}
            currentUser={currentUser}
            loading={loading}
            onSelectUser={selectUser}
          />
        )}
        
        {activeTab === 'performance' && (
          <PerformanceManagement />
        )}
      </div>
      
      {/* 创建投票弹窗 */}
      {showCreateVoteModal && (
        <CreateVoteModal
          parameter={selectedParameter}
          onClose={handleCloseCreateVoteModal}
          onSubmit={handleCreateVote}
        />
      )}
    </div>
  );
};

export default PlatformManagement;
import React, { useState } from 'react';
import { Vote, PlatformMember, VoteDecision } from '@/types/platformManagement';

interface VotesListProps {
  activeVotes: Vote[];
  finishedVotes: Vote[];
  currentUser: PlatformMember | null;
  loading: boolean;
  onSubmitVote: (voteId: string, decision: VoteDecision, comment?: string) => Promise<void>;
  onFinalizeVote: (voteId: string) => Promise<void>;
  onVetoVote: (voteId: string) => Promise<void>;
}

/**
 * 投票列表组件
 */
const VotesList: React.FC<VotesListProps> = ({
  activeVotes,
  finishedVotes,
  currentUser,
  loading,
  onSubmitVote,
  onFinalizeVote,
  onVetoVote
}) => {
  const [showActive, setShowActive] = useState(true);
  const [voteComment, setVoteComment] = useState<Record<string, string>>({});
  
  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }
  
  const handleCommentChange = (voteId: string, comment: string) => {
    setVoteComment(prev => ({ ...prev, [voteId]: comment }));
  };
  
  const handleSubmitVote = async (voteId: string, decision: VoteDecision) => {
    await onSubmitVote(voteId, decision, voteComment[voteId]);
    setVoteComment(prev => ({ ...prev, [voteId]: '' }));
  };
  
  // 检查当前用户是否已经对某个投票进行了投票
  const hasVoted = (vote: Vote) => {
    if (!currentUser) return false;
    return vote.voteRecords.some(record => record.memberId === currentUser.id);
  };
  
  // 获取当前用户对某个投票的决定
  const getUserVoteDecision = (vote: Vote) => {
    if (!currentUser) return null;
    const record = vote.voteRecords.find(record => record.memberId === currentUser.id);
    return record ? record.decision : null;
  };
  
  // 格式化投票状态
  const formatVoteStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      active: '进行中',
      passed: '已通过',
      rejected: '已拒绝',
      vetoed: '已否决'
    };
    return statusMap[status] || status;
  };
  
  // 格式化投票决定
  const formatVoteDecision = (decision: VoteDecision) => {
    const decisionMap: Record<VoteDecision, string> = {
      approve: '赞成',
      reject: '反对',
      abstain: '弃权',
      veto: '否决'
    };
    return decisionMap[decision];
  };
  
  // 计算投票进度
  const calculateVoteProgress = (vote: Vote) => {
    const totalVotes = vote.voteRecords.length;
    const approveVotes = vote.voteRecords.filter(r => r.decision === 'approve').length;
    const rejectVotes = vote.voteRecords.filter(r => r.decision === 'reject').length;
    
    return {
      approvePercent: totalVotes > 0 ? (approveVotes / totalVotes) * 100 : 0,
      rejectPercent: totalVotes > 0 ? (rejectVotes / totalVotes) * 100 : 0,
      abstainPercent: totalVotes > 0 ? 100 - (approveVotes / totalVotes) * 100 - (rejectVotes / totalVotes) * 100 : 0
    };
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">投票决策</h2>
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-md ${
              showActive
                ? 'bg-blue-600 text-white dark:bg-blue-700'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
            }`}
            onClick={() => setShowActive(true)}
          >
            进行中
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              !showActive
                ? 'bg-blue-600 text-white dark:bg-blue-700'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
            }`}
            onClick={() => setShowActive(false)}
          >
            已结束
          </button>
        </div>
      </div>
      
      {/* 投票列表 */}
      <div className="space-y-6">
        {showActive ? (
          activeVotes.length > 0 ? (
            activeVotes.map(vote => (
              <VoteCard
                key={vote.id}
                vote={vote}
                currentUser={currentUser}
                hasVoted={hasVoted(vote)}
                userVoteDecision={getUserVoteDecision(vote)}
                voteComment={voteComment[vote.id] || ''}
                onCommentChange={(comment) => handleCommentChange(vote.id, comment)}
                onSubmitVote={(decision) => handleSubmitVote(vote.id, decision)}
                onFinalizeVote={() => onFinalizeVote(vote.id)}
                onVetoVote={() => onVetoVote(vote.id)}
                showActions={true}
              />
            ))
          ) : (
            <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-lg shadow">
              暂无进行中的投票
            </div>
          )
        ) : (
          finishedVotes.length > 0 ? (
            finishedVotes.map(vote => (
              <VoteCard
                key={vote.id}
                vote={vote}
                currentUser={currentUser}
                hasVoted={hasVoted(vote)}
                userVoteDecision={getUserVoteDecision(vote)}
                voteComment={''}
                onCommentChange={() => {}}
                onSubmitVote={() => Promise.resolve()}
                onFinalizeVote={() => Promise.resolve()}
                onVetoVote={() => Promise.resolve()}
                showActions={false}
              />
            ))
          ) : (
            <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-lg shadow">
              暂无已结束的投票
            </div>
          )
        )}
      </div>
    </div>
  );
};

interface VoteCardProps {
  vote: Vote;
  currentUser: PlatformMember | null;
  hasVoted: boolean;
  userVoteDecision: VoteDecision | null;
  voteComment: string;
  onCommentChange: (comment: string) => void;
  onSubmitVote: (decision: VoteDecision) => Promise<void>;
  onFinalizeVote: () => Promise<void>;
  onVetoVote: () => Promise<void>;
  showActions: boolean;
}

/**
 * 投票卡片组件
 */
const VoteCard: React.FC<VoteCardProps> = ({
  vote,
  currentUser,
  hasVoted,
  userVoteDecision,
  voteComment,
  onCommentChange,
  onSubmitVote,
  onFinalizeVote,
  onVetoVote,
  showActions
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 格式化投票状态
  const formatVoteStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      active: '进行中',
      passed: '已通过',
      rejected: '已拒绝',
      vetoed: '已否决'
    };
    return statusMap[status] || status;
  };
  
  // 格式化投票决定
  const formatVoteDecision = (decision: VoteDecision) => {
    const decisionMap: Record<VoteDecision, string> = {
      approve: '赞成',
      reject: '反对',
      abstain: '弃权',
      veto: '否决'
    };
    return decisionMap[decision];
  };
  
  // 计算投票进度
  const calculateVoteProgress = (vote: Vote) => {
    const totalVotes = vote.voteRecords.length;
    const approveVotes = vote.voteRecords.filter(r => r.decision === 'approve').length;
    const rejectVotes = vote.voteRecords.filter(r => r.decision === 'reject').length;
    
    return {
      approvePercent: totalVotes > 0 ? (approveVotes / totalVotes) * 100 : 0,
      rejectPercent: totalVotes > 0 ? (rejectVotes / totalVotes) * 100 : 0,
      abstainPercent: totalVotes > 0 ? 100 - (approveVotes / totalVotes) * 100 - (rejectVotes / totalVotes) * 100 : 0
    };
  };
  
  const progress = calculateVoteProgress(vote);
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {vote.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              提议人: {vote.proposedBy} | 创建时间: {vote.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center">
            <span className={`px-2 py-1 text-xs rounded-full ${
              vote.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              vote.status === 'passed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              vote.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
            }`}>
              {formatVoteStatus(vote.status)}
            </span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">参数: {vote.parameterId}</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {vote.currentValue} → {vote.proposedValue}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {vote.description}
          </p>
          <div className="mt-2">
            <button
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '收起详情' : '查看详情'}
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">提议理由</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {vote.reason}
            </p>
            
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-4 mb-2">投票记录</h4>
            <div className="space-y-2">
              {vote.voteRecords.map(record => (
                <div key={record.id} className="flex justify-between items-center text-sm">
                  <span className="text-slate-700 dark:text-slate-300">
                    {record.memberId}
                  </span>
                  <div className="flex items-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      record.decision === 'approve' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      record.decision === 'reject' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      record.decision === 'veto' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {formatVoteDecision(record.decision)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2">
                      {record.votedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-1">
            <div className="flex h-2.5 rounded-full">
              <div
                className="bg-green-500 h-2.5 rounded-l-full"
                style={{ width: `${progress.approvePercent}%` }}
              ></div>
              <div
                className="bg-red-500 h-2.5"
                style={{ width: `${progress.rejectPercent}%` }}
              ></div>
              <div
                className="bg-slate-400 h-2.5 rounded-r-full"
                style={{ width: `${progress.abstainPercent}%` }}
              ></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>赞成: {vote.voteRecords.filter(r => r.decision === 'approve').length}</span>
            <span>反对: {vote.voteRecords.filter(r => r.decision === 'reject').length}</span>
            <span>弃权: {vote.voteRecords.filter(r => r.decision === 'abstain').length}</span>
          </div>
        </div>
        
        {showActions && !hasVoted && currentUser && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="mb-3">
              <label htmlFor={`comment-${vote.id}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                评论
              </label>
              <textarea
                id={`comment-${vote.id}`}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-200"
                rows={2}
                value={voteComment}
                onChange={(e) => onCommentChange(e.target.value)}
                placeholder="添加您的评论..."
              ></textarea>
            </div>
            <div className="flex space-x-2">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                onClick={() => onSubmitVote('approve')}
              >
                赞成
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                onClick={() => onSubmitVote('reject')}
              >
                反对
              </button>
              <button
                className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                onClick={() => onSubmitVote('abstain')}
              >
                弃权
              </button>
              {currentUser.hasVetoRight && (
                <button
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
                  onClick={() => onVetoVote()}
                >
                  否决
                </button>
              )}
            </div>
          </div>
        )}
        
        {showActions && hasVoted && currentUser && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-700 dark:text-slate-300">
                您已投票: 
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  userVoteDecision === 'approve' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  userVoteDecision === 'reject' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  userVoteDecision === 'veto' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                  'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {userVoteDecision && formatVoteDecision(userVoteDecision)}
                </span>
              </div>
              {currentUser.role === 'founder' && (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                  onClick={() => onFinalizeVote()}
                >
                  结束投票
                </button>
              )}
            </div>
          </div>
        )}
        
        {vote.status !== 'active' && vote.result && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-slate-700 dark:text-slate-300">最终结果:</span>
                <span className={`font-medium ${
                  vote.status === 'passed' ? 'text-green-600 dark:text-green-400' :
                  vote.status === 'rejected' ? 'text-red-600 dark:text-red-400' :
                  'text-purple-600 dark:text-purple-400'
                }`}>
                  {formatVoteStatus(vote.status)}
                </span>
              </div>
              {vote.status === 'passed' && vote.result.implementedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-700 dark:text-slate-300">实施时间:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {vote.result.implementedAt.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotesList;
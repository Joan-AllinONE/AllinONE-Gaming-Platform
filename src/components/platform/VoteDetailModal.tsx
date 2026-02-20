import React from 'react';
import { Vote, PlatformParameter } from '@/types/platformManagement';
import { usePlatformManagement } from '@/contexts/PlatformManagementContext';

interface VoteDetailModalProps {
  vote: Vote;
  onClose: () => void;
}

const VoteDetailModal: React.FC<VoteDetailModalProps> = ({ vote, onClose }) => {
  const { parameters, members, currentUser, submitVote, vetoVote, finalizeVote } = usePlatformManagement();
  const [voteDecision, setVoteDecision] = React.useState<'approve' | 'reject' | 'abstain'>('abstain');
  const [comment, setComment] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // 获取相关参数
  const parameter = parameters.find(p => p.id === vote.parameterId);

  // 计算投票统计
  const totalVotes = vote.votes.length;
  const approveVotes = vote.votes.filter(v => v.vote === 'approve').length;
  const rejectVotes = vote.votes.filter(v => v.vote === 'reject').length;
  const abstainVotes = vote.votes.filter(v => v.vote === 'abstain').length;
  
  // 检查当前用户是否已投票
  const userVote = vote.votes.find(v => v.memberId === currentUser?.id);
  
  // 检查是否有否决权
  const canVeto = currentUser?.hasVetoRight && vote.status === 'active';
  
  // 检查是否可以投票
  const canVote = vote.status === 'active' && currentUser !== null;

  // 提交投票
  const handleSubmitVote = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError('');
    
    try {
      await submitVote(vote.id, voteDecision, comment);
      // 不关闭弹窗，让用户看到投票结果
    } catch (err) {
      setError(err instanceof Error ? err.message : '投票失败');
    } finally {
      setLoading(false);
    }
  };

  // 否决投票
  const handleVeto = async () => {
    if (!currentUser?.hasVetoRight) return;
    
    setLoading(true);
    setError('');
    
    try {
      await vetoVote(vote.id);
      // 不关闭弹窗，让用户看到投票结果
    } catch (err) {
      setError(err instanceof Error ? err.message : '否决失败');
    } finally {
      setLoading(false);
    }
  };

  // 结束投票
  const handleFinalize = async () => {
    setLoading(true);
    setError('');
    
    try {
      await finalizeVote(vote.id);
      // 不关闭弹窗，让用户看到投票结果
    } catch (err) {
      setError(err instanceof Error ? err.message : '结束投票失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{vote.title}</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>

          {/* 投票状态标签 */}
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              vote.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
              vote.status === 'passed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
              vote.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            }`}>
              {vote.status === 'active' ? '进行中' :
               vote.status === 'passed' ? '已通过' :
               vote.status === 'rejected' ? '已拒绝' :
               vote.status === 'vetoed' ? '已否决' : '已结束'}
            </span>
          </div>

          {/* 参数信息 */}
          {parameter && (
            <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">{parameter.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{parameter.description}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">当前值</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {vote.currentValue} {parameter.unit}
                      </div>
                    </div>
                    <div className="text-2xl">→</div>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">提议值</div>
                      <div className="font-bold text-blue-600">
                        {vote.proposedValue} {parameter.unit}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 投票描述和理由 */}
          <div className="mb-6">
            {vote.description && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">投票描述</h3>
                <p className="text-slate-600 dark:text-slate-400">{vote.description}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">修改理由</h3>
              <p className="text-slate-600 dark:text-slate-400">{vote.reason}</p>
            </div>
          </div>

          {/* 投票进度 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">投票进度</h3>
            <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-green-500" 
                style={{ width: `${totalVotes > 0 ? (approveVotes / totalVotes) * 100 : 0}%` }}
              ></div>
              <div 
                className="h-full bg-red-500" 
                style={{ width: `${totalVotes > 0 ? (rejectVotes / totalVotes) * 100 : 0}%` }}
              ></div>
              <div 
                className="h-full bg-slate-400" 
                style={{ width: `${totalVotes > 0 ? (abstainVotes / totalVotes) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-sm text-green-600">{approveVotes} 赞成</span>
              <span className="text-sm text-red-600">{rejectVotes} 反对</span>
              <span className="text-sm text-slate-500">{abstainVotes} 弃权</span>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              总投票: {totalVotes}/11 ({Math.round((totalVotes / 11) * 100)}%)
            </div>
          </div>

          {/* 投票详情 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">投票详情</h3>
            <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-600">
                    <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300">成员</th>
                    <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300">投票</th>
                    <th className="px-4 py-2 text-left text-slate-700 dark:text-slate-300">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {vote.votes.map((voteRecord, index) => {
                    const member = members.find(m => m.id === voteRecord.memberId);
                    return (
                      <tr key={index} className="border-b border-slate-200 dark:border-slate-600 last:border-0">
                        <td className="px-4 py-2 text-slate-900 dark:text-slate-100">
                          {member?.name || voteRecord.memberId}
                          {member?.role === 'founder' && ' (创始人)'}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            voteRecord.vote === 'approve' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            voteRecord.vote === 'reject' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {voteRecord.vote === 'approve' ? '赞成' :
                             voteRecord.vote === 'reject' ? '反对' : '弃权'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                          {new Date(voteRecord.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  {vote.votes.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                        暂无投票记录
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* 投票操作区 */}
          {canVote && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-6">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {userVote ? '修改您的投票' : '提交您的投票'}
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => setVoteDecision('approve')}
                  className={`px-4 py-2 rounded-lg ${
                    voteDecision === 'approve'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  赞成
                </button>
                <button
                  onClick={() => setVoteDecision('reject')}
                  className={`px-4 py-2 rounded-lg ${
                    voteDecision === 'reject'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  反对
                </button>
                <button
                  onClick={() => setVoteDecision('abstain')}
                  className={`px-4 py-2 rounded-lg ${
                    voteDecision === 'abstain'
                      ? 'bg-slate-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  弃权
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  评论 (可选)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 min-h-[80px]"
                  placeholder="添加您的评论..."
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSubmitVote}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? '提交中...' : userVote ? '更新投票' : '提交投票'}
                </button>
              </div>
            </div>
          )}

          {/* 管理操作区 */}
          {(canVeto || vote.status === 'active') && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-6">
              <div className="flex justify-between">
                {vote.status === 'active' && (
                  <button
                    onClick={handleFinalize}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? '处理中...' : '结束投票'}
                  </button>
                )}
                
                {canVeto && (
                  <button
                    onClick={handleVeto}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? '处理中...' : '否决投票 (创始人特权)'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 投票结果 */}
          {vote.status !== 'active' && vote.result && (
            <div className="mt-6 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">投票结果</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">赞成</span>
                  <span className="font-medium text-green-600">{vote.result.approved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">反对</span>
                  <span className="font-medium text-red-600">{vote.result.rejected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">弃权</span>
                  <span className="font-medium text-slate-600">{vote.result.abstained}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-800 dark:text-slate-200">结果</span>
                  <span className={`font-bold ${
                    vote.status === 'passed' ? 'text-green-600' : 
                    vote.status === 'vetoed' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {vote.status === 'passed' ? '通过' : 
                     vote.status === 'vetoed' ? '被否决' : '未通过'}
                    {vote.status === 'vetoed' && vote.result.vetoedBy && 
                      ` (由${members.find(m => m.id === vote.result.vetoedBy)?.name || '创始人'}否决)`
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoteDetailModal;
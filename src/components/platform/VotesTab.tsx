import React, { useState } from 'react';
import { usePlatformManagement } from '@/contexts/PlatformManagementContext';
import { Vote } from '@/types/platformManagement';
import VoteCard from './VoteCard';
import VoteDetailModal from './VoteDetailModal';

// 投票决策选项卡
const VotesTab: React.FC = () => {
  const { activeVotes, completedVotes, loading } = usePlatformManagement();
  const [selectedVote, setSelectedVote] = useState<Vote | null>(null);
  const [showVoteDetailModal, setShowVoteDetailModal] = useState(false);

  const handleViewVote = (vote: Vote) => {
    setSelectedVote(vote);
    setShowVoteDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowVoteDetailModal(false);
    setSelectedVote(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 活跃投票 */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">活跃投票</h2>
        {activeVotes.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400">
            当前没有活跃的投票
          </div>
        ) : (
          <div className="space-y-4">
            {activeVotes.map((vote) => (
              <VoteCard key={vote.id} vote={vote} onClick={() => handleViewVote(vote)} />
            ))}
          </div>
        )}
      </div>

      {/* 已完成投票 */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">已完成投票</h2>
        {completedVotes.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400">
            暂无已完成的投票
          </div>
        ) : (
          <div className="space-y-4">
            {completedVotes.slice(0, 5).map((vote) => (
              <VoteCard key={vote.id} vote={vote} onClick={() => handleViewVote(vote)} />
            ))}
            {completedVotes.length > 5 && (
              <div className="text-center">
                <button className="text-blue-600 hover:underline">
                  查看更多历史投票
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 投票详情弹窗 */}
      {showVoteDetailModal && selectedVote && (
        <VoteDetailModal
          vote={selectedVote}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default VotesTab;
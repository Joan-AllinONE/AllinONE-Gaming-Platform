import React from 'react';
import { Vote } from '@/types/platformManagement';

interface VoteCardProps {
  vote: Vote;
  onClick: () => void;
}

const VoteCard: React.FC<VoteCardProps> = ({ vote, onClick }) => {
  // 计算投票进度
  const totalVotes = vote.votes.length;
  const approveVotes = vote.votes.filter(v => v.vote === 'approve').length;
  const rejectVotes = vote.votes.filter(v => v.vote === 'reject').length;
  const abstainVotes = vote.votes.filter(v => v.vote === 'abstain').length;
  
  const approvePercentage = totalVotes > 0 ? (approveVotes / totalVotes) * 100 : 0;
  const rejectPercentage = totalVotes > 0 ? (rejectVotes / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? (abstainVotes / totalVotes) * 100 : 0;

  // 计算剩余时间
  const now = new Date();
  const expiresAt = new Date(vote.expiresAt);
  const timeLeft = expiresAt.getTime() - now.getTime();
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <div 
      className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{vote.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{vote.description || vote.reason}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
              提议值: {vote.proposedValue}
            </span>
            <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-full">
              当前值: {vote.currentValue}
            </span>
            <span className="text-xs text-slate-500">
              {daysLeft > 0 ? `${daysLeft}天` : ''}{hoursLeft > 0 ? `${hoursLeft}小时` : ''} 后结束
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            已投票: {totalVotes}/11
          </div>
          <div className="w-full max-w-[200px] h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden flex">
            <div 
              className="h-full bg-green-500" 
              style={{ width: `${approvePercentage}%` }}
            ></div>
            <div 
              className="h-full bg-red-500" 
              style={{ width: `${rejectPercentage}%` }}
            ></div>
            <div 
              className="h-full bg-slate-400" 
              style={{ width: `${abstainPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between w-full max-w-[200px] text-xs mt-1">
            <span className="text-green-600">{approveVotes} 赞成</span>
            <span className="text-red-600">{rejectVotes} 反对</span>
            <span className="text-slate-500">{abstainVotes} 弃权</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoteCard;
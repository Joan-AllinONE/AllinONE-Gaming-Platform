/**
 * 游戏提案卡片
 * 展示单个提案的摘要信息
 */
import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock, Users, CheckCircle, XCircle, AlertTriangle,
  ArrowUpRight, Zap, Shield, Vote, Calendar,
} from 'lucide-react';
import {
  GameProposal,
  GameProposalType,
  ProposalStatus,
  ProposalStatusLabel,
  VoteStakeholderType,
  VoteStakeholderTypeLabel,
} from '@/types/gameProposal';
import { getProposalTypeLabel, isProposalFinished } from '@/services/gameProposalTestData';

interface GameProposalCardProps {
  proposal: GameProposal;
  onClick: () => void;
}

const GameProposalCard: React.FC<GameProposalCardProps> = ({ proposal, onClick }) => {
  const isFinished = isProposalFinished(proposal.status);
  const isActive = proposal.status === ProposalStatus.ACTIVE;
  const isPassed = proposal.status === ProposalStatus.PASSED || proposal.status === ProposalStatus.EXECUTED;
  const isFailed = proposal.status === ProposalStatus.REJECTED || proposal.status === ProposalStatus.VETOED;

  const progressRate = proposal.voteThreshold
    ? Math.min(proposal.voteRecords.length / Math.max(proposal.voteThreshold.quorumRate * 50, 1) * 100, 100)
    : 0;

  const getStatusColor = () => {
    if (isActive) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (isPassed) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (isFailed) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const getTypeIcon = () => {
    switch (proposal.proposalType) {
      case GameProposalType.NEW_ITEM:
      case GameProposalType.MINT_ITEM:
      case GameProposalType.EDIT_ITEM:
      case GameProposalType.DELETE_ITEM:
        return <Zap className="w-4 h-4" />;
      case GameProposalType.NEW_CHARACTER:
      case GameProposalType.NEW_MAP:
      case GameProposalType.NEW_GAMEPLAY:
        return <Shield className="w-4 h-4" />;
      default:
        return <Vote className="w-4 h-4" />;
    }
  };

  const getTimeRemaining = () => {
    const now = Date.now();
    const remaining = proposal.votingEndAt - now;
    if (remaining <= 0) return '已截止';
    const hours = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}天${hours % 24}小时`;
    if (hours > 0) return `${hours}小时${mins}分`;
    return `${mins}分钟`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 cursor-pointer hover:border-purple-500/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isActive ? 'bg-amber-500/20' : isPassed ? 'bg-green-500/20' : 'bg-slate-700/50'}`}>
            {getTypeIcon()}
          </div>
          <div>
            <h4 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
              {proposal.title}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {proposal.gameName} · {getProposalTypeLabel(proposal.proposalType)}
            </p>
          </div>
        </div>

        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${getStatusColor()}`}>
          {ProposalStatusLabel[proposal.status]}
        </span>
      </div>

      <p className="text-sm text-slate-400 mb-3 line-clamp-2">{proposal.description}</p>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {proposal.voteRecords.length} 人已投票
        </span>

        {isActive && (
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {getTimeRemaining()}
          </span>
        )}

        {proposal.result && (
          <span className="flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {Math.round(proposal.result.participationRate * 100)}% 参与率
          </span>
        )}
      </div>

      {/* 进度条 */}
      {isActive && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">投票进度</span>
            <span className="text-amber-400">{Math.round(progressRate)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressRate}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            />
          </div>
        </div>
      )}

      {/* 发起人信息 */}
      <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-xs text-slate-500">
        <Calendar className="w-3 h-3" />
        <span>
          {VoteStakeholderTypeLabel[proposal.proposerType]} · {proposal.proposerName} 发起于{' '}
          {new Date(proposal.createdAt).toLocaleDateString('zh-CN')}
        </span>
      </div>
    </motion.div>
  );
};

export default GameProposalCard;

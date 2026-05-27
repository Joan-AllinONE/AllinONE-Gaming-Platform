/**
 * 游戏提案列表
 * 展示进行中/已完成的提案，支持Tab切换
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Vote, CheckCircle2, XCircle, Clock,
  Filter, Search, History,
} from 'lucide-react';
import {
  GameProposal,
  ProposalStatus,
} from '@/types/gameProposal';
import { gameProposalService } from '@/services/gameProposalService';
import { generateSimulatedPlayers } from '@/data/simulatedPlayers';
import GameProposalCard from './GameProposalCard';
import GameProposalDetailModal from './GameProposalDetailModal';

interface GameProposalListProps {
  gameId: string;
  gameName: string;
  currentUserId: string;
  currentUserName: string;
}

const GameProposalList: React.FC<GameProposalListProps> = ({
  gameId,
  gameName,
  currentUserId,
  currentUserName,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'finished'>('active');
  const [activeProposals, setActiveProposals] = useState<GameProposal[]>([]);
  const [finishedProposals, setFinishedProposals] = useState<GameProposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<GameProposal | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProposals = () => {
    setActiveProposals(gameProposalService.getActiveProposals(gameId));
    setFinishedProposals(gameProposalService.getFinishedProposals(gameId));
    setLoading(false);
  };

  useEffect(() => {
    loadProposals();
    // 定时刷新
    const interval = setInterval(loadProposals, 10000);
    return () => clearInterval(interval);
  }, [gameId]);

  const handleProposalClick = (proposal: GameProposal) => {
    setSelectedProposal(proposal);
  };

  const displayProposals = activeTab === 'active' ? activeProposals : finishedProposals;

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-slate-400 text-sm">加载提案中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab切换 */}
      <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'active'
              ? 'bg-purple-500/20 text-purple-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Vote className="w-4 h-4" />
          进行中
          {activeProposals.length > 0 && (
            <span className="px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">
              {activeProposals.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('finished')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'finished'
              ? 'bg-slate-500/20 text-slate-300'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          已完成
          {finishedProposals.length > 0 && (
            <span className="px-1.5 py-0.5 bg-slate-500 text-white text-xs rounded-full">
              {finishedProposals.length}
            </span>
          )}
        </button>

        <button
          onClick={loadProposals}
          className="ml-auto p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="刷新"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 提案列表 */}
      {displayProposals.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
          <Vote className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-slate-400 font-medium">
            {activeTab === 'active' ? '暂无进行中的提案' : '暂无已完成的提案'}
          </h4>
          <p className="text-slate-500 text-sm mt-1">
            {activeTab === 'active'
              ? '点击上方"发起投票提案"按钮创建新的游戏内容提案'
              : '已完成的提案将显示在这里'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayProposals.map(proposal => (
            <GameProposalCard
              key={proposal.id}
              proposal={proposal}
              onClick={() => handleProposalClick(proposal)}
            />
          ))}
        </div>
      )}

      {/* 提案详情弹窗 */}
      <AnimatePresence>
        {selectedProposal && (
          <GameProposalDetailModal
            proposal={selectedProposal}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onClose={() => setSelectedProposal(null)}
            onUpdated={loadProposals}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameProposalList;

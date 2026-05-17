/**
 * 发放来源管理组件
 * 统一展示固定型奖池和算法型模板，让用户统一管理
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Play, Pause,
  Warehouse, Coins, Gift, Wallet,
  TrendingUp, Users, CheckCircle2, X, Info, ArrowRight, RefreshCw,
  Zap, Calculator, Cpu, Timer, Link2,
} from 'lucide-react';
import { userPoolService } from '../services/UserPoolService';
import { voucherService } from '../services/VoucherService';
import { algorithmVoucherService } from '../services/AlgorithmVoucherService';
import type { UserRewardPool, UserPoolOverview, PoolVoucherConfig } from '../types/pool';
import type { Voucher } from '../types';
import { VoucherStatus } from '../types';
import type { AlgorithmVoucherTemplate } from '../types/algorithm';

interface UserPoolManagerProps {
  currentUserId: string;
  currentUsername: string;
}

export const UserPoolManager: React.FC<UserPoolManagerProps> = ({
  currentUserId,
  currentUsername,
}) => {
  const [pools, setPools] = useState<UserPoolOverview[]>([]);
  const [selectedPool, setSelectedPool] = useState<UserRewardPool | null>(null);
  const [myVouchers, setMyVouchers] = useState<Voucher[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedVouchers, setSelectedVouchers] = useState<string[]>([]);
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolDesc, setNewPoolDesc] = useState('');
  const [globalStats, setGlobalStats] = useState({
    totalPools: 0,
    totalDeposited: 0,
    totalDistributed: 0,
    totalBalance: 0,
  });
  // 算法型模板
  const [algorithmTemplates, setAlgorithmTemplates] = useState<AlgorithmVoucherTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showCycleModal, setShowCycleModal] = useState(false);

  // 来源类型筛选
  const [sourceFilter, setSourceFilter] = useState<'all' | 'fixed' | 'algorithm'>('all');

  // 加载数据
  useEffect(() => {
    loadData();
  }, [currentUserId]);

  const loadData = () => {
    // 加载用户奖池概览
    const userPools = userPoolService.getUserPoolOverviews(currentUserId);
    setPools(userPools);

    // 加载算法模板
    const templates = algorithmVoucherService.getTemplates();
    setAlgorithmTemplates(templates);

    // 加载全局统计
    const stats = userPoolService.getGlobalStats();
    const totalAlgoBalance = templates.reduce((sum, t) => sum + (t.totalValue || 0), 0);
    setGlobalStats({
      totalPools: stats.totalPools + templates.length,
      totalDeposited: stats.totalDeposited + totalAlgoBalance,
      totalDistributed: stats.totalDistributed,
      totalBalance: userPools.reduce((sum, p) => sum + p.totalBalance, 0) + totalAlgoBalance,
    });

    // 加载可用于存入奖池的凭证
    const allVouchers = voucherService.getUserVouchers(currentUserId);
    setMyVouchers(
      allVouchers.filter(
        (v) =>
          v.status === VoucherStatus.ACTIVE &&
          !v.currentHolderId.startsWith('POOL:') &&
          !v.metadata?.isLocked
      )
    );
  };

  // 创建新奖池
  const handleCreatePool = () => {
    if (!newPoolName.trim()) return;

    userPoolService.createPool(currentUserId, currentUsername, {
      name: newPoolName.trim(),
      description: newPoolDesc.trim() || undefined,
    });

    setNewPoolName('');
    setNewPoolDesc('');
    setIsCreateModalOpen(false);
    loadData();
  };

  // 删除奖池
  const handleDeletePool = (poolId: string) => {
    if (confirm('确定要删除这个奖池吗？剩余的凭证将退还给你的账户。')) {
      userPoolService.deletePool(poolId, currentUserId);
      setSelectedPool(null);
      loadData();
    }
  };

  // 暂停/恢复奖池
  const handleTogglePool = (poolId: string, isActive: boolean) => {
    if (isActive) {
      userPoolService.pausePool(poolId, currentUserId);
    } else {
      userPoolService.resumePool(poolId, currentUserId);
    }
    loadData();
    if (selectedPool?.id === poolId) {
      const updated = userPoolService.getPool(poolId);
      if (updated) setSelectedPool(updated);
    }
  };

  // 打开存入凭证弹窗
  const openDepositModal = (pool: UserPoolOverview) => {
    const fullPool = userPoolService.getPool(pool.id);
    if (fullPool) {
      setSelectedPool(fullPool);
      setIsDepositModalOpen(true);
      setSelectedVouchers([]);
    }
  };

  // 存入凭证到奖池
  const handleDeposit = () => {
    if (!selectedPool || selectedVouchers.length === 0) return;

    const result = userPoolService.depositVouchersToPool(
      selectedPool.id,
      selectedVouchers,
      currentUserId
    );

    if (result.success) {
      alert(`成功存入 ${result.deposited.length} 张凭证，总价值 ${result.totalAmount} A币`);
      setIsDepositModalOpen(false);
      setSelectedVouchers([]);
      loadData();
      // 刷新选中奖池
      const updated = userPoolService.getPool(selectedPool.id);
      if (updated) setSelectedPool(updated);
    } else {
      alert('存入失败: ' + result.error);
    }
  };

  // 切换凭证选择
  const toggleVoucherSelection = (voucherId: string) => {
    setSelectedVouchers((prev) =>
      prev.includes(voucherId)
        ? prev.filter((id) => id !== voucherId)
        : [...prev, voucherId]
    );
  };

  // 计算选中的凭证总价值
  const selectedVouchersValue = selectedVouchers.reduce((sum, id) => {
    const v = myVouchers.find((v) => v.id === id);
    return sum + (v?.denomination || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* 头部统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">我的奖池</p>
              <p className="text-2xl font-bold text-white">{pools.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">总存入金额</p>
              <p className="text-2xl font-bold text-white">
                {pools.reduce((sum, p) => sum + p.totalBalance, 0)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">已发放金额</p>
              <p className="text-2xl font-bold text-white">
                {pools.reduce((sum, p) => {
                  const pool = userPoolService.getPool(p.id);
                  return sum + (pool ? pool.stats.totalDistributed : 0);
                }, 0)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">剩余可发放</p>
              <p className="text-2xl font-bold text-white">
                {pools.reduce((sum, p) => sum + p.totalBalance, 0)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-purple-400" />
            我的发放来源
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            管理您的奖池和算法模板，可绑定到游戏供玩家获取奖励
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 类型筛选 */}
          <div className="flex bg-slate-800/50 rounded-lg p-0.5 border border-white/10">
            {(['all', 'fixed', 'algorithm'] as const).map(type => (
              <button key={type} onClick={() => setSourceFilter(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  sourceFilter === type
                    ? type === 'algorithm' ? 'bg-rose-600 text-white' : 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}>
                {type === 'all' ? '全部' : type === 'fixed' ? '固定池' : '算法池'}
              </button>
            ))}
          </div>
          <button onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors text-sm">
            <Plus className="w-4 h-4" />
            创建奖池
          </button>
        </div>
      </div>

      {/* 发放来源列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {/* 固定型奖池卡片 */}
          {(sourceFilter === 'all' || sourceFilter === 'fixed') && pools.map((pool, index) => (
            <motion.div key={pool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.03 }}
              className={`bg-slate-800/50 rounded-xl border overflow-hidden ${pool.status === 'active' ? 'border-white/10' : 'border-white/5 opacity-70'}`}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{pool.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">即时型</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          pool.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>{pool.status === 'active' ? '活跃' : '已耗尽'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleTogglePool(pool.id, pool.status === 'active')}
                      className={`p-2 rounded-lg transition-colors ${pool.status === 'active' ? 'text-green-400 hover:bg-green-400/10' : 'text-slate-500 hover:bg-white/5'}`}>
                      {pool.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDeletePool(pool.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">剩余余额</p>
                    <p className="text-lg font-bold text-white flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-400" />{pool.totalBalance}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">凭证数</p>
                    <p className="text-lg font-bold text-white">{pool.voucherCount} 张</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">已发放: {pool.distributionCount}次</span>
                    <button onClick={() => openDepositModal(pool)}
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-xs">
                      存入凭证 →</button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* 算法型模板卡片 */}
          {(sourceFilter === 'all' || sourceFilter === 'algorithm') && algorithmTemplates.map((tmpl, index) => (
            <motion.div key={tmpl.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: (pools.length + index) * 0.03 }}
              className={`bg-slate-800/50 rounded-xl border overflow-hidden ${tmpl.isActive ? 'border-white/10' : 'border-white/5 opacity-70'}`}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{tmpl.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">算法型</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${tmpl.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {tmpl.isActive ? '活跃' : '已暂停'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400 space-y-1">
                  <p>📅 {tmpl.settlementCycle === 'daily' ? '每日' : tmpl.settlementCycle === 'weekly' ? '每周' : '每月'} @ {tmpl.settlementTime} 结算</p>
                  <p>⚖️ 游戏币{(tmpl.algorithm.weights.gameCoins * 100).toFixed(0)}% + 算力{(tmpl.algorithm.weights.computingPower * 100).toFixed(0)}% + 交易{(tmpl.algorithm.weights.transactionVolume * 100).toFixed(0)}%</p>
                  {tmpl.poolConfig.gamePools && tmpl.poolConfig.gamePools.length > 0 && (
                    <p>🎮 游戏池: {tmpl.poolConfig.gamePools.map(g => g.gameName).join(', ')}</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                  <button onClick={() => algorithmVoucherService.triggerSettlement(tmpl.id, undefined, undefined, currentUserId).then(loadData).catch(() => {})}
                    disabled={!tmpl.isActive}
                    className="flex-1 py-2 text-xs bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-1">
                    <Timer className="w-3 h-3" /> 立即结算
                  </button>
                  <button onClick={() => { setSelectedTemplateId(tmpl.id); setShowCycleModal(true); }}
                    className="flex-1 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-1">
                    <Link2 className="w-3 h-3" /> 结算记录
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 创建新奖池卡片（仅显示固定型时展示） */}
        {sourceFilter !== 'algorithm' && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="p-6 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-white min-h-[200px]">
            <Plus className="w-8 h-8" />
            <span>创建新奖池</span>
          </motion.button>
        )}
      </div>

      {/* 结算记录弹出框 */}
      {showCycleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCycleModal(false)}>
          <div className="bg-slate-800 rounded-xl border border-white/10 p-6 w-full max-w-lg max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">结算记录</h3>
              <button onClick={() => setShowCycleModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {algorithmVoucherService.getSettlementCycles().filter(c => c.templateId === selectedTemplateId).length === 0 ? (
              <p className="text-center text-slate-400 py-8">暂无结算记录</p>
            ) : (
              algorithmVoucherService.getSettlementCycles().filter(c => c.templateId === selectedTemplateId).slice(-10).reverse().map(cycle => (
                <div key={cycle.id} className="p-3 bg-slate-900/50 rounded-lg mb-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white font-medium">周期 #{cycle.cycleNumber}</span>
                    <span className="text-slate-400">{cycle.settlementDate}</span>
                  </div>
                  {cycle.result && (
                    <p className="text-xs text-slate-400 mt-1">
                      发放: {cycle.result.totalDistributed.toFixed(4)} A币 / {cycle.result.totalVouchersIssued} 张 / {cycle.result.totalParticipants} 人
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 可用凭证提示 */}
      {myVouchers.length > 0 && (
        <div className="mt-8 p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm text-blue-400">可存入奖池的凭证</p>
              <p className="text-xs text-slate-400 mt-1">
                你当前有 {myVouchers.length} 张凭证可以存入奖池，总价值{' '}
                {myVouchers.reduce((sum, v) => sum + v.denomination, 0)} A币
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 创建奖池弹窗 */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsCreateModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-xl border border-white/10 p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">创建新奖池</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">奖池名称 *</label>
                  <input
                    type="text"
                    value={newPoolName}
                    onChange={(e) => setNewPoolName(e.target.value)}
                    placeholder="例如：消消乐奖励池"
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 block mb-2">描述（可选）</label>
                  <textarea
                    value={newPoolDesc}
                    onChange={(e) => setNewPoolDesc(e.target.value)}
                    placeholder="描述这个奖池的用途..."
                    rows={3}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <p className="text-xs text-slate-400">
                    <Info className="w-3 h-3 inline mr-1" />
                    创建后你可以在奖池管理页面存入凭证
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCreatePool}
                    disabled={!newPoolName.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    创建
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 存入凭证弹窗 */}
      <AnimatePresence>
        {isDepositModalOpen && selectedPool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsDepositModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-xl border border-white/10 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">存入凭证</h3>
                  <p className="text-sm text-slate-400">到奖池: {selectedPool.name}</p>
                </div>
                <button
                  onClick={() => setIsDepositModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {myVouchers.length > 0 ? (
                <>
                  <div className="mb-4 p-3 bg-slate-900/50 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      已选择 {selectedVouchers.length} 张凭证
                    </span>
                    <span className="text-sm font-medium text-white">
                      总价值: {selectedVouchersValue} A币
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                    {myVouchers.map((voucher) => (
                      <div
                        key={voucher.id}
                        onClick={() => toggleVoucherSelection(voucher.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedVouchers.includes(voucher.id)
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-white/10 bg-slate-800 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{voucher.denomination}</span>
                          {selectedVouchers.includes(voucher.id) && (
                            <CheckCircle2 className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">A币</p>
                        <p className="text-xs text-slate-600 font-mono mt-1">
                          {voucher.id.slice(0, 8)}...
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={() => setIsDepositModalOpen(false)}
                      className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleDeposit}
                      disabled={selectedVouchers.length === 0}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      存入 {selectedVouchers.length} 张凭证
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">没有可用的凭证</p>
                  <p className="text-xs text-slate-500 mt-1">
                    你需要先创建或获得凭证才能存入奖池
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserPoolManager;

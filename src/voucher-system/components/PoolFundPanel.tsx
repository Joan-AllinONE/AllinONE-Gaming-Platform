/**
 * 平台奖池充值面板
 * 提供显式的铸币入口，将凭证注入平台奖池（SYSTEM持有者）
 * 解决"资金来源不透明"问题 — 所有奖池资金都需经过此入口
 */
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins, Building2, RefreshCw, Plus, DollarSign,
  AlertCircle, CheckCircle2, Info, History,
  Trash2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { platformBindingService } from '../services/PlatformBindingService';
import { voucherService } from '../services/VoucherService';

interface PoolFundPanelProps {
  currentUserId: string;
  currentUsername: string;
  /** 充值成功后的回调，用于刷新父组件状态 */
  onBalanceChange?: (newBalance: { totalAmount: number; voucherCount: number }) => void;
}

export const PoolFundPanel: React.FC<PoolFundPanelProps> = ({
  currentUserId,
  currentUsername,
  onBalanceChange,
}) => {
  const [balance, setBalance] = useState<{
    totalAmount: number;
    voucherCount: number;
    vouchers: { id: string; denomination: number; serialNumber: string }[];
  }>({ totalAmount: 0, voucherCount: 0, vouchers: [] });
  const [fundAmount, setFundAmount] = useState(1000);
  const [denomination, setDenomination] = useState(100);
  const [count, setCount] = useState(10);
  const [isFunding, setIsFunding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 刷新余额
  const refreshBalance = () => {
    const b = platformBindingService.getSystemPoolBalance();
    setBalance(b);
  };

  useEffect(() => {
    refreshBalance();
  }, []);

  // 处理充值
  const handleFund = async () => {
    if (fundAmount <= 0 || denomination <= 0 || count <= 0) {
      setMessage({ type: 'error', text: '请填写有效的金额、面值和数量' });
      return;
    }

    // 验证总金额与面值*数量是否匹配
    const expectedTotal = denomination * count;
    if (expectedTotal !== fundAmount) {
      setMessage({
        type: 'error',
        text: `总金额(${fundAmount})与面值(${denomination})×数量(${count})=${expectedTotal}不匹配，请调整`,
      });
      return;
    }

    setIsFunding(true);
    setMessage(null);

    try {
      const result = platformBindingService.fundSystemPool(
        fundAmount,
        denomination,
        count,
        currentUserId,
        currentUsername,
        `平台奖池主动充值: ${fundAmount}A币`
      );

      if (result.success) {
        setMessage({
          type: 'success',
          text: `充值成功！创建 ${result.created} 张凭证，总价值 ${result.totalAmount} A币`,
        });
        refreshBalance();
        // 通知父组件更新余额
        if (onBalanceChange) {
          const b = platformBindingService.getSystemPoolBalance();
          onBalanceChange({ totalAmount: b.totalAmount, voucherCount: b.voucherCount });
        }
        // 重置表单
        setFundAmount(1000);
        setDenomination(100);
        setCount(10);
      } else {
        setMessage({ type: 'error', text: result.error || '充值失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `充值异常: ${error}` });
    } finally {
      setIsFunding(false);
    }
  };

  // 合并预览提示
  const previewTotal = denomination * count;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden">
      <div className="p-4 sm:p-6 space-y-5">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">平台奖池充值</h3>
              <p className="text-xs text-slate-400">将凭证铸币注入平台奖池，作为游戏奖励的资金来源</p>
            </div>
          </div>
          <button
            onClick={refreshBalance}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="刷新余额"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* 余额展示 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
            <p className="text-xs text-slate-400 mb-1">奖池余额（总价值）</p>
            <p className="text-2xl font-bold text-white">
              {balance.totalAmount.toLocaleString()}
              <span className="text-sm text-slate-400 ml-1">A币</span>
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
            <p className="text-xs text-slate-400 mb-1">凭证数量</p>
            <p className="text-2xl font-bold text-white">
              {balance.voucherCount}
              <span className="text-sm text-slate-400 ml-1">张</span>
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
            <p className="text-xs text-slate-400 mb-1">平均面值</p>
            <p className="text-2xl font-bold text-white">
              {balance.voucherCount > 0
                ? Math.round(balance.totalAmount / balance.voucherCount)
                : 0}
              <span className="text-sm text-slate-400 ml-1">A币/张</span>
            </p>
          </div>
        </div>

        {/* 业务流程说明 */}
        <div className="flex items-start gap-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20 text-xs text-blue-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-200 mb-1">业务流程指引</p>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
              <li>在下方输入金额 → 点击「充值奖池」→ 凭证注入平台奖池</li>
              <li>切换到「游戏绑定」标签页 → 创建游戏绑定 → 选择「平台奖池」</li>
              <li>用户在游戏中获得奖励后 → 从平台奖池自动发放 A币凭证</li>
            </ol>
          </div>
        </div>

        {/* 充值表单 */}
        <div className="bg-slate-900/30 rounded-xl p-4 border border-white/10">
          <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-green-400" />
            铸币充值
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">总金额 (A币)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  min="1"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">每张面值 (A币)</label>
              <input
                type="number"
                min="1"
                value={denomination}
                onChange={(e) => setDenomination(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">数量 (张)</label>
              <input
                type="number"
                min="1"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 预览信息 */}
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs text-slate-500">
              预览：{count} 张 × {denomination} A币 = {previewTotal.toLocaleString()} A币
            </span>
            {previewTotal !== fundAmount && (
              <span className="text-xs text-yellow-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                总金额不匹配
              </span>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleFund}
              disabled={isFunding || fundAmount <= 0 || denomination <= 0 || count <= 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isFunding ? (
                <>充值中...</>
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  充值奖池
                </>
              )}
            </button>

            {balance.voucherCount > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                清空奖池
              </button>
            )}
          </div>

          {/* 操作提示 */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                    : 'bg-red-500/10 border border-red-500/20 text-red-300'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 凭证详情 */}
        {balance.vouchers.length > 0 && (
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full p-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <span>奖池凭证明细 ({balance.vouchers.length} 张)</span>
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="max-h-48 overflow-y-auto space-y-1 mt-1">
                    {balance.vouchers.map((v) => (
                      <div key={v.id} className="flex items-center justify-between px-3 py-1.5 bg-slate-900/30 rounded text-xs">
                        <span className="text-slate-400 font-mono">{v.serialNumber || v.id.slice(0, 8)}</span>
                        <span className="text-white font-medium">{v.denomination} A币</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 清空确认弹窗 */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowClearConfirm(false)}
          >
            <div className="bg-slate-800 rounded-xl p-6 border border-white/10 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <h4 className="text-lg font-bold text-white mb-2">确认清空奖池？</h4>
              <p className="text-sm text-slate-400 mb-4">
                将清空平台奖池中所有 {balance.voucherCount} 张凭证（总价值 {balance.totalAmount} A币）。
                此操作不可逆！
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const result = platformBindingService.clearSystemPool(currentUserId, currentUsername);
                    if (result.success) {
                      setMessage({ type: 'success', text: `已清空 ${result.clearedCount} 张凭证` });
                    }
                    setShowClearConfirm(false);
                    refreshBalance();
                    if (onBalanceChange) {
                      const b = platformBindingService.getSystemPoolBalance();
                      onBalanceChange({ totalAmount: b.totalAmount, voucherCount: b.voucherCount });
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
                >
                  确认清空
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PoolFundPanel;

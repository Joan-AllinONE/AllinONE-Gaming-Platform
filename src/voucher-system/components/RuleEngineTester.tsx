/**
 * 规则引擎测试组件
 * 用于演示和测试凭证规则的自动执行
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Trophy,
  Calendar,
  Target,
  Users,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Terminal,
  Trash2,
  History,
} from 'lucide-react';
import {
  useGameIntegration,
  simulateGameComplete,
  simulateDailyCheckin,
  voucherRuleEngine,
  VoucherRuleEngine,
} from '../';
import { voucherService } from '../services/VoucherService';
import { Voucher, Transaction, DistributionRule } from '../types';
import { EventBus, VoucherEventType } from '../engine/EventBus';
import { PLATFORM_CURRENCY_TEMPLATE } from '../templates';

interface RuleEngineTesterProps {
  userId: string;
  userName?: string;
}

export const RuleEngineTester: React.FC<RuleEngineTesterProps> = ({
  userId,
  userName,
}) => {
  const [myVouchers, setMyVouchers] = useState<Voucher[]>([]);
  const [logs, setLogs] = useState<Array<{ type: 'success' | 'error' | 'info'; message: string; time: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 加载用户凭证
  const loadVouchers = () => {
    const vouchers = voucherService.getUserVouchers(userId);
    setMyVouchers(vouchers);
  };

  useEffect(() => {
    loadVouchers();
  }, [userId]);

  // 添加日志
  const addLog = (type: 'success' | 'error' | 'info', message: string) => {
    setLogs(prev => [
      { type, message, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 49), // 保留最近50条
    ]);
  };

  // 测试游戏完成
  const testGameComplete = async () => {
    setIsLoading(true);
    addLog('info', '触发游戏完成事件...');

    try {
      // 记录触发前的凭证列表（用于后续对比）
      const beforeVouchers = voucherService.getUserVouchers(userId);
      const beforeIds = new Set(beforeVouchers.map(v => v.id));
      const beforeCount = beforeVouchers.length;

      // 检查现有凭证中的规则
      const allVouchers = voucherService.filterVouchers({});
      const vouchersWithRules = allVouchers.filter(v => v.rules);
      addLog('info', `📊 系统中共有 ${allVouchers.length} 个凭证，${vouchersWithRules.length} 个包含规则`);

      // 显示模板规则
      addLog('info', `📋 检查模板规则...`);
      const templateRules = PLATFORM_CURRENCY_TEMPLATE?.presetRules?.distribution?.filter(
        r => r.enabled && r.type === 'game_reward'
      ) || [];
      if (templateRules.length > 0) {
        templateRules.forEach(r => {
          const sourceMode = r.source?.mode || 'create_new';
          addLog('info', `   - [模板] ${r.name}: ${r.allocation.mode} (来源: ${sourceMode})`);
        });
      } else {
        addLog('error', `   - 模板中没有游戏奖励规则`);
      }

      // 详细显示已存凭证的规则信息
      let ruleCount = templateRules.length;
      vouchersWithRules.forEach(v => {
        const distRules = v.rules?.distribution?.filter(r => r.enabled) || [];
        const gameRewardRules = distRules.filter(r => r.type === 'game_reward');
        if (gameRewardRules.length > 0) {
          addLog('info', `📋 凭证 ${v.serialNumber} 有 ${gameRewardRules.length} 个游戏奖励规则`);
          gameRewardRules.forEach(r => {
            const sourceMode = r.source?.mode || 'create_new';
            addLog('info', `   - ${r.name}: ${r.allocation.mode} (来源: ${sourceMode})`);
          });
          ruleCount += gameRewardRules.length;
        }
      });

      if (ruleCount === 0) {
        addLog('error', '❌ 没有找到启用的游戏奖励规则！请先创建包含游戏奖励规则的凭证');
        setIsLoading(false);
        return;
      }

      simulateGameComplete(userId, {
        gameId: 'demo_game',
        gameName: '演示游戏',
        score: 1500,
        difficulty: 'hard',
        baseReward: 100,
        bonusMultiplier: 1.5,
        level: 5,
      });

      addLog('info', '📤 游戏完成事件已发送，等待规则引擎处理...');

      // 延迟检查新凭证（给引擎足够时间处理）
      setTimeout(() => {
        const afterVouchers = voucherService.getUserVouchers(userId);
        const afterCount = afterVouchers.length;
        const diff = afterCount - beforeCount;

        if (diff > 0) {
          // 分析新增的凭证是转移来的还是新创建的
          const newVouchers = afterVouchers.filter(v => !beforeIds.has(v.id));
          const transferredVouchers = newVouchers.filter(v => v.history?.some(
            h => h.type === 'transfer' && h.toUserId === userId
          ));
          const createdVouchers = newVouchers.filter(v => 
            v.issuerId === 'SYSTEM' && !v.history?.some(h => h.type === 'transfer')
          );

          if (transferredVouchers.length > 0) {
            const totalAmount = transferredVouchers.reduce((sum, v) => sum + v.denomination, 0);
            addLog('success', `✅ 规则执行成功！从奖池转移 ${transferredVouchers.length} 个凭证，共 ${totalAmount} A币`);
          } else if (createdVouchers.length > 0) {
            const totalAmount = createdVouchers.reduce((sum, v) => sum + v.denomination, 0);
            addLog('success', `✅ 规则执行成功！新创建 ${createdVouchers.length} 个凭证，共 ${totalAmount} A币`);
          } else {
            addLog('success', `✅ 规则执行成功！获得 ${diff} 个凭证`);
          }
        } else {
          addLog('info', 'ℹ️ 事件已触发但未获得凭证');
          addLog('info', '   请检查浏览器控制台查看详细日志');
          addLog('info', '   如果控制台没有 [VoucherRuleEngine] 日志，说明引擎未正确初始化');
        }
        loadVouchers();
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      addLog('error', `❌ 执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setIsLoading(false);
    }
  };

  // 测试每日签到
  const testDailyCheckin = async () => {
    setIsLoading(true);
    addLog('info', '触发每日签到事件...');

    try {
      const beforeCount = voucherService.getUserVouchers(userId).length;

      // 检查签到规则
      const allVouchers = voucherService.filterVouchers({});
      let checkinRuleCount = 0;
      allVouchers.forEach(v => {
        const rules = v.rules?.distribution?.filter(r => r.enabled && r.type === 'daily_checkin') || [];
        checkinRuleCount += rules.length;
      });

      if (checkinRuleCount === 0) {
        addLog('error', '❌ 没有找到每日签到规则！请先创建包含签到规则的凭证');
        setIsLoading(false);
        return;
      }

      addLog('info', `📋 找到 ${checkinRuleCount} 个每日签到规则`);

      simulateDailyCheckin(userId);

      addLog('info', '📤 每日签到事件已发送...');

      setTimeout(() => {
        const afterCount = voucherService.getUserVouchers(userId).length;
        const diff = afterCount - beforeCount;

        if (diff > 0) {
          addLog('success', `✅ 签到奖励已发放！获得 ${diff} 个凭证`);
        } else {
          addLog('info', 'ℹ️ 签到事件已触发但未创建新凭证');
        }
        loadVouchers();
        setIsLoading(false);
      }, 500);
    } catch (error) {
      addLog('error', `❌ 执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setIsLoading(false);
    }
  };

  // 清除日志
  const clearLogs = () => setLogs([]);

  // 创建奖池凭证（供规则转移使用）
  const createPoolVouchers = () => {
    try {
      setIsLoading(true);
      addLog('info', '🏦 创建奖池凭证...');

      // 创建10个100面额的凭证到平台奖池
      const poolVouchers = [];
      for (let i = 0; i < 10; i++) {
        const voucher = voucherService.createVoucher(
          {
            denomination: 100,
            recipientId: 'SYSTEM', // 平台账户持有
            recipientName: '平台奖池',
            metadata: {
              name: '游戏奖励池凭证',
              description: '用于游戏奖励分发的奖池凭证',
              category: 'reward_pool',
              tags: ['game_reward', 'pool'],
            },
            note: '奖池凭证 #' + (i + 1),
          },
          'SYSTEM',
          '平台'
        );
        poolVouchers.push(voucher);
      }

      addLog('success', `✅ 成功创建 ${poolVouchers.length} 个奖池凭证（每个100 A币）`);
      addLog('info', `   总奖池价值: ${poolVouchers.length * 100} A币`);

      // 显示当前奖池状态
      const systemVouchers = voucherService.getUserVouchers('SYSTEM');
      addLog('info', `   平台账户当前持有: ${systemVouchers.length} 个凭证`);

      setIsLoading(false);
    } catch (error) {
      addLog('error', `❌ 创建奖池失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setIsLoading(false);
    }
  };

  // 直接测试引擎（绕过事件系统）
  const testEngineDirectly = async () => {
    setIsLoading(true);
    addLog('info', '🧪 直接测试规则引擎...');

    try {
      // 创建一个简单的测试规则（固定金额）
      const testRule: DistributionRule = {
        id: 'test-rule-direct',
        name: '直接测试规则',
        type: 'game_reward',
        enabled: true,
        priority: 1,
        trigger: { type: 'event', event: 'game_complete' },
        allocation: {
          mode: 'fixed',
          fixedAmount: 500, // 固定500 A币
        },
        limits: {},
      };

      addLog('info', `📋 使用固定金额规则: ${testRule.allocation.fixedAmount} A币`);

      const beforeCount = voucherService.getUserVouchers(userId).length;

      // 直接调用引擎执行规则
      const result = await voucherRuleEngine.executeDistributionRule(testRule, {
        userId,
        userName: userName || userId,
        eventType: 'game_complete',
        eventData: {
          gameId: 'direct_test',
          baseReward: 100,
          difficulty: 'hard',
          bonusMultiplier: 1.5,
        },
        timestamp: Date.now(),
      });

      addLog('info', `📤 引擎执行结果: ${result.success ? '成功' : '失败'}`);
      if (result.error) {
        addLog('error', `   错误: ${result.error}`);
      }
      if (result.amount) {
        addLog('success', `   发放金额: ${result.amount} A币`);
      }

      // 检查新凭证
      setTimeout(() => {
        const afterCount = voucherService.getUserVouchers(userId).length;
        const diff = afterCount - beforeCount;

        if (diff > 0) {
          addLog('success', `✅ 直接测试成功！凭证数从 ${beforeCount} 增加到 ${afterCount}`);
        } else {
          addLog('error', `❌ 凭证数未变化 (${beforeCount} -> ${afterCount})`);
          addLog('info', '   提示: 如果引擎执行成功但凭证未增加，可能是存储问题');
        }
        loadVouchers();
        setIsLoading(false);
      }, 500);
    } catch (error) {
      addLog('error', `❌ 直接测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
      console.error('[RuleEngineTester] 直接测试错误:', error);
      setIsLoading(false);
    }
  };

  // 计算总凭证价值
  const totalValue = myVouchers
    .filter(v => v.status === 'active')
    .reduce((sum, v) => sum + v.denomination, 0);

  return (
    <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-purple-400" />
              规则引擎测试
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              模拟平台事件，测试凭证规则的自动执行
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{myVouchers.length}</p>
            <p className="text-xs text-slate-400">持有凭证</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* 左侧：测试按钮 */}
        <div className="p-6 border-r border-white/10">
          <h4 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">
            触发测试事件
          </h4>

          <div className="space-y-3">
            <TestButton
              icon={<Trophy className="w-5 h-5" />}
              title="游戏完成"
              description="模拟游戏通关，触发游戏奖励规则"
              color="yellow"
              onClick={testGameComplete}
              disabled={isLoading}
            />

            <TestButton
              icon={<Calendar className="w-5 h-5" />}
              title="每日签到"
              description="模拟每日签到，触发签到奖励规则"
              color="blue"
              onClick={testDailyCheckin}
              disabled={isLoading}
            />

            <TestButton
              icon={<Target className="w-5 h-5" />}
              title="成就解锁"
              description="模拟解锁成就，触发成就奖励"
              color="purple"
              onClick={() => addLog('info', '成就解锁功能开发中...')}
              disabled={isLoading}
            />

            <TestButton
              icon={<Users className="w-5 h-5" />}
              title="邀请好友"
              description="模拟邀请新用户，触发邀请奖励"
              color="green"
              onClick={() => addLog('info', '邀请功能开发中...')}
              disabled={isLoading}
            />

            <div className="pt-3 border-t border-white/10">
              <TestButton
                icon={<CheckCircle2 className="w-5 h-5" />}
                title="直接测试引擎"
                description="绕过事件系统，直接执行规则引擎（固定500 A币）"
                color="purple"
                onClick={testEngineDirectly}
                disabled={isLoading}
              />
            </div>

            <div className="pt-3 border-t border-white/10">
              <TestButton
                icon={<Users className="w-5 h-5" />}
                title="创建奖池凭证"
                description="创建10个凭证到平台账户，供规则转移使用"
                color="green"
                onClick={createPoolVouchers}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 快速统计 */}
          {/* 诊断按钮 */}
          <button
            onClick={() => {
              const allVouchers = voucherService.filterVouchers({});
              addLog('info', `📊 存储诊断:`);
              addLog('info', `   - 内存凭证数: ${allVouchers.length}`);
              addLog('info', `   - 当前用户凭证数: ${myVouchers.length}`);
              // 检查平台奖池
              const systemVouchers = voucherService.getUserVouchers('SYSTEM');
              addLog('info', `   - 平台奖池凭证数: ${systemVouchers.length}`);
              try {
                const stored = localStorage.getItem('allinone_vouchers');
                const storedCount = stored ? JSON.parse(stored).length : 0;
                addLog('info', `   - localStorage 凭证数: ${storedCount}`);
              } catch {
                addLog('error', '   - localStorage 读取失败');
              }
            }}
            className="mt-4 w-full py-2 px-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
          >
            诊断存储状态
          </button>

          {/* 清除测试凭证 */}
          <button
            onClick={() => {
              try {
                localStorage.removeItem('allinone_vouchers');
                localStorage.removeItem('allinone_voucher_transactions');
                addLog('info', '🗑️ 已清除所有测试凭证，请刷新页面');
              } catch {
                addLog('error', '清除失败');
              }
            }}
            className="mt-2 w-full py-2 px-3 bg-red-700/30 hover:bg-red-700/50 text-red-300 text-sm rounded-lg transition-colors"
          >
            清除所有凭证（重置）
          </button>

          {/* 检查事件监听器 */}
          <button
            onClick={() => {
              const eventBus = EventBus.getInstance();
              addLog('info', `📡 事件监听器状态:`);
              addLog('info', `   - GAME_COMPLETE: ${eventBus.listenerCount(VoucherEventType.GAME_COMPLETE)} 个监听器`);
              addLog('info', `   - DAILY_CHECKIN: ${eventBus.listenerCount(VoucherEventType.DAILY_CHECKIN)} 个监听器`);
              addLog('info', `   - VOUCHER_TRANSFER: ${eventBus.listenerCount(VoucherEventType.VOUCHER_TRANSFER)} 个监听器`);
              
              // 测试直接触发事件
              addLog('info', `🧪 测试事件触发...`);
              let received = false;
              const unsubscribe = eventBus.on(VoucherEventType.GAME_COMPLETE, () => {
                received = true;
                addLog('success', `   ✓ 测试事件被接收`);
              });
              eventBus.emit(VoucherEventType.GAME_COMPLETE, {
                userId: 'test',
                timestamp: Date.now(),
                data: { test: true }
              });
              setTimeout(() => {
                if (!received) {
                  addLog('error', `   ✗ 测试事件未被接收`);
                }
                unsubscribe();
              }, 100);
            }}
            className="mt-2 w-full py-2 px-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors"
          >
            检查事件监听器
          </button>

          {/* 快速统计 */}
          <div className="mt-4 p-4 bg-slate-800/50 rounded-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{totalValue}</p>
                <p className="text-xs text-slate-400">A币总价值</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {myVouchers.filter(v => v.status === 'active').length}
                </p>
                <p className="text-xs text-slate-400">有效凭证</p>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：执行日志 */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              执行日志
            </h4>
            <button
              onClick={clearLogs}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              title="清除日志"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-950 rounded-xl border border-white/5 h-64 overflow-y-auto p-4 space-y-2">
            <AnimatePresence initial={false}>
              {logs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-slate-500 py-8"
                >
                  <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">暂无执行记录</p>
                  <p className="text-xs mt-1">点击左侧按钮触发事件</p>
                </motion.div>
              ) : (
                logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={`text-sm font-mono ${
                      log.type === 'success'
                        ? 'text-green-400'
                        : log.type === 'error'
                        ? 'text-red-400'
                        : 'text-slate-400'
                    }`}
                  >
                    <span className="text-slate-600">[{log.time}]</span>{' '}
                    {log.message}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* 提示 */}
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-200/70">
                请先创建带有分发规则的凭证，然后触发事件测试规则执行。
                如果没有匹配的启用规则，事件将不会发放凭证。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 测试按钮组件
const TestButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'yellow' | 'blue' | 'purple' | 'green';
  onClick: () => void;
  disabled?: boolean;
}> = ({ icon, title, description, color, onClick, disabled }) => {
  const colorClasses = {
    yellow: 'from-yellow-600/20 to-amber-600/20 hover:from-yellow-600/30 hover:to-amber-600/30 border-yellow-500/30',
    blue: 'from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 border-blue-500/30',
    purple: 'from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border-purple-500/30',
    green: 'from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border-green-500/30',
  };

  const iconColors = {
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r transition-all ${
        colorClasses[color]
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
    >
      <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${iconColors[color]}`}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <h5 className="font-medium text-white">{title}</h5>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <Play className={`w-5 h-5 ${iconColors[color]}`} />
    </button>
  );
};

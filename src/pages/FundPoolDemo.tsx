import React, { useState, useEffect } from 'react';
import { fundPoolService } from '@/services/fundPoolService';
import type { FundPoolStats } from '@/types/fundPool';

export default function FundPoolDemo() {
  const [stats, setStats] = useState<FundPoolStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await fundPoolService.getStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateTransaction = async (type: 'marketplace' | 'game_store') => {
    const amount = Math.floor(Math.random() * 500) + 50;
    const commission = type === 'marketplace' ? amount * 0.01 : amount * 0.3;
    const txId = `TXN-${Date.now()}`;
    
    try {
      await fundPoolService.recordCommissionIncome(
        txId,
        commission,
        type,
        `user${Math.floor(Math.random() * 1000)}`,
        amount
      );
      
      alert(`模拟交易成功！\n交易编号: ${txId}\n商品金额: ${amount}元\n佣金收入: ${commission.toFixed(2)}元`);
      await loadStats(); // 重新加载统计数据
    } catch (error) {
      console.error('模拟交易失败:', error);
      alert('模拟交易失败，请稍后重试');
    }
  };

  const simulateExpense = async () => {
    const amount = Math.floor(Math.random() * 200) + 20;
    const categories = ['computing', 'cash', 'gameCoins'] as const;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const descriptions = [
      '用户签到奖励',
      '新用户注册奖励',
      '活动奖励发放',
      '服务器维护费用',
      '推广活动支出'
    ];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    try {
      await fundPoolService.recordExpense(amount, category, description);
      alert(`模拟支出成功！\n支出类型: ${category}\n支出金额: ${amount}元\n描述: ${description}`);
      await loadStats(); // 重新加载统计数据
    } catch (error) {
      console.error('模拟支出失败:', error);
      alert('模拟支出失败，请稍后重试');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-4">
              <div></div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  资金池系统演示
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  体验透明的平台资金管理系统
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/"
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <i className="fa-solid fa-home mr-1"></i>
                  主页
                </Link>
                <Link
                  to="/computing-dashboard"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <i className="fa-solid fa-chart-line mr-1"></i>
                  算力中心
                </Link>
              </div>
            </div>
          </div>

          {/* 统计卡片 */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">当前余额</p>
                    <p className="text-2xl font-bold text-green-600">
                      ¥{stats.currentBalance.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-wallet text-green-600"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">总收入</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ¥{stats.totalIncome.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-arrow-up text-blue-600"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">总支出</p>
                    <p className="text-2xl font-bold text-red-600">
                      ¥{stats.totalExpense.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-arrow-down text-red-600"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">今日收入</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ¥{stats.dailyIncome.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-calendar-day text-purple-600"></i>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              模拟操作
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => simulateTransaction('marketplace')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="fa-solid fa-store mr-2"></i>
                模拟玩家交易 (1%佣金)
              </button>
              
              <button
                onClick={() => simulateTransaction('game_store')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <i className="fa-solid fa-gamepad mr-2"></i>
                模拟游戏电商 (30%佣金)
              </button>
              
              <button
                onClick={simulateExpense}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <i className="fa-solid fa-money-bill mr-2"></i>
                模拟平台支出
              </button>
            </div>
          </div>

          {/* 说明信息 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              <i className="fa-solid fa-info-circle mr-2"></i>
              系统说明
            </h3>
            <div className="space-y-2 text-blue-800 dark:text-blue-200">
              <p>• 点击上方按钮可以模拟不同类型的交易和支出</p>
              <p>• 每次操作后统计数据会自动更新</p>
              <p>• 所有交易都会生成唯一的交易编号</p>
              <p>• 用户身份信息在公开展示中会被隐藏</p>
              <p>• 访问 <a href="/fund-pool" className="underline hover:no-underline">/fund-pool</a> 查看完整的资金池页面</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
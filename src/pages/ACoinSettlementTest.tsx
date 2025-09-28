import React, { useState, useEffect } from 'react';
import { fundPoolService } from '@/services/fundPoolService';
import { computingEconomicService } from '@/services/computingEconomicService';
import { aCoinService } from '@/services/aCoinService';
import { walletService } from '@/services/walletService';

const ACoinSettlementTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [fundPoolData, setFundPoolData] = useState<any>(null);
  const [settlementData, setSettlementData] = useState<any>(null);
  const [mockIncomeAmount, setMockIncomeAmount] = useState(1000);
  const [mockActiveUsers, setMockActiveUsers] = useState(100);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [fundData, settlement] = await Promise.all([
        fundPoolService.getPublicFundPoolData(),
        computingEconomicService.getDailySettlementData()
      ]);
      
      setFundPoolData(fundData);
      setSettlementData(settlement);
      
      // 显示当前资金池状态
      addResult(`当前资金池余额: ${fundData.currentBalance.totalValue.toFixed(2)}`);
      addResult(`当前平台净收入: ${settlement.platformNetIncome.toFixed(2)}`);
      addResult(`当前结算状态: ${settlement.settlementStatus}`);
      addResult(`A币发放池: ${settlement.aCoinDistributionPool.toFixed(2)}`);
      
      // 检查localStorage中的强制平台收入值
      const forcedIncomeStr = localStorage.getItem('forced_platform_income');
      if (forcedIncomeStr) {
        const forcedIncome = parseFloat(forcedIncomeStr);
        addResult(`已设置强制平台净收入: ${forcedIncome.toFixed(2)}`);
      }
      
      // 检查模拟用户数据
      const mockUsersJson = localStorage.getItem('mock_active_users');
      if (mockUsersJson) {
        const mockUsers = JSON.parse(mockUsersJson);
        addResult(`已设置${mockUsers.length}个模拟用户`);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      addResult(`加载数据失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const addResult = (message: string) => {
    setResults(prev => [message, ...prev]);
  };

  const handleAddMockIncome = async () => {
    try {
      setLoading(true);
      addResult(`添加模拟收入: ${mockIncomeAmount}元`);
      
      // 添加模拟的佣金收入
      await fundPoolService.recordCommissionIncome(
        `mock_transaction_${Date.now()}`,
        mockIncomeAmount,
        'cash',
        'game_store',
        'system',
        mockIncomeAmount
      );
      
      // 直接更新localStorage中的强制平台收入值
      localStorage.setItem('forced_platform_income', mockIncomeAmount.toString());
      addResult(`模拟收入添加成功，已设置平台净收入为: ${mockIncomeAmount}元`);
      
      // 强制更新资金池数据
      const dailyStats = {
        date: new Date().toISOString().split('T')[0],
        income: mockIncomeAmount,
        expense: 0,
        netIncome: mockIncomeAmount
      };
      
      // 尝试更新资金池的每日统计数据
      try {
        // 获取现有的资金池统计数据
        const stats = await fundPoolService.getStats();
        // 修改最后一天的数据
        if (stats.dailyStats && stats.dailyStats.length > 0) {
          stats.dailyStats[stats.dailyStats.length - 1] = dailyStats;
          // 将修改后的数据保存到localStorage
          localStorage.setItem('fund_pool_stats', JSON.stringify(stats));
          addResult('已更新资金池每日统计数据');
        }
      } catch (statsError) {
        console.error('更新资金池统计数据失败:', statsError);
      }
      
      // 计算A币发放池
      const aCoinDistributionPool = mockIncomeAmount * 0.4;
      addResult(`A币发放池: ${aCoinDistributionPool.toFixed(2)}`);
      
      // 重新加载数据
      await loadInitialData();
    } catch (error) {
      console.error('添加模拟收入失败:', error);
      addResult(`添加模拟收入失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSettlement = async () => {
    try {
      setLoading(true);
      addResult('开始执行A币结算...');
      
      // 执行结算
      const result = await computingEconomicService.executeAutoDailySettlement();
      
      if (result.success) {
        addResult(`结算成功! 发放金额: ${result.distributedAmount?.toFixed(2)} A币`);
        addResult(`受益用户数: ${result.recipientsCount}`);
        addResult(`结算时间: ${result.lastSettlementTime?.toLocaleString()}`);
      } else {
        addResult(`结算失败: ${result.message}`);
      }
      
      // 重新加载数据
      await loadInitialData();
    } catch (error) {
      console.error('执行结算失败:', error);
      addResult(`执行结算失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMockUsers = async () => {
    try {
      setLoading(true);
      addResult(`生成${mockActiveUsers}个模拟活跃用户...`);
      
      // 生成模拟用户数据
      const mockUsers = Array.from({ length: mockActiveUsers }).map((_, index) => ({
        userId: `mock_user_${index}`,
        gameCoins: Math.floor(Math.random() * 500) + 50,
        computingPower: Math.floor(Math.random() * 100) + 10,
        transactionVolume: Math.floor(Math.random() * 1000) + 100
      }));
      
      // 添加当前用户
      mockUsers.push({
        userId: 'current-user',
        gameCoins: 200,
        computingPower: 50,
        transactionVolume: 500
      });
      
      // 保存到localStorage以便结算时使用
      localStorage.setItem('mock_active_users', JSON.stringify(mockUsers));
      
      addResult(`已生成${mockUsers.length}个模拟用户数据`);
      addResult('当前用户数据: 游戏币=200, 算力=50, 交易量=500');
    } catch (error) {
      console.error('生成模拟用户失败:', error);
      addResult(`生成模拟用户失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForceSettlement = async () => {
    try {
      setLoading(true);
      addResult('开始强制执行A币结算...');
      
      // 获取模拟用户数据
      const mockUsersJson = localStorage.getItem('mock_active_users');
      if (!mockUsersJson) {
        addResult('未找到模拟用户数据，请先生成模拟用户');
        setLoading(false);
        return;
      }
      
      const mockUsers = JSON.parse(mockUsersJson);
      addResult(`找到${mockUsers.length}个模拟用户`);
      
      // 强制设置平台净收入为正值
      const forcedIncome = mockIncomeAmount > 0 ? mockIncomeAmount : 1000;
      const distributionPool = forcedIncome * 0.4; // 平台净收入的40%作为发放池
      
      // 设置强制平台净收入
      localStorage.setItem('forced_platform_income', forcedIncome.toString());
      addResult(`已设置强制平台净收入: ${forcedIncome}元`);
      addResult(`A币发放池: ${distributionPool.toFixed(2)} A币`);
      
      // 强制更新资金池数据
      const dailyStats = {
        date: new Date().toISOString().split('T')[0],
        income: forcedIncome,
        expense: 0,
        netIncome: forcedIncome
      };
      
      // 尝试更新资金池的每日统计数据
      try {
        // 获取现有的资金池统计数据
        const stats = await fundPoolService.getStats();
        // 修改最后一天的数据
        if (stats.dailyStats && stats.dailyStats.length > 0) {
          stats.dailyStats[stats.dailyStats.length - 1] = dailyStats;
          // 将修改后的数据保存到localStorage
          localStorage.setItem('fund_pool_stats', JSON.stringify(stats));
          addResult('已更新资金池每日统计数据');
        }
      } catch (statsError) {
        console.error('更新资金池统计数据失败:', statsError);
      }
      
      // 直接调用A币服务进行分发
      const result = await aCoinService.distributeACoinsByContribution(
        distributionPool,
        mockUsers
      );
      
      addResult(`强制结算成功! 发放金额: ${result.totalAmount.toFixed(2)} A币`);
      addResult(`受益用户数: ${result.recipientsCount}`);
      
      // 查找当前用户的分发记录
      const currentUserDistribution = result.successfulDistributions.find(
        dist => dist.userId === 'current-user'
      );
      
      if (currentUserDistribution) {
        addResult(`当前用户获得: ${currentUserDistribution.amount.toFixed(2)} A币`);
        
        // 更新当前用户钱包
        await walletService.distributeACoins(
          currentUserDistribution.amount,
          `强制结算A币奖励 - 贡献分数: ${currentUserDistribution.contributionScore.toFixed(2)}`
        );
        
        addResult('已更新当前用户钱包');
      } else {
        addResult('当前用户未获得A币');
      }
      
      // 更新资金池数据
      await fundPoolService.updateAfterSettlement(result.totalAmount, mockUsers.length);
      
      // 保存结算时间
      await computingEconomicService.saveSettlementTime(new Date());
      
      // 重新加载数据
      await loadInitialData();
    } catch (error) {
      console.error('强制执行结算失败:', error);
      addResult(`强制执行结算失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-purple-400 mb-6">A币结算测试工具</h1>
        
        {/* 资金池和结算数据 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800/80 border-2 border-purple-400/30 rounded-lg p-4">
            <h2 className="text-lg font-bold text-purple-400 mb-3">资金池数据</h2>
            {fundPoolData ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">总余额:</span>
                  <span className="text-green-400 font-bold">¥{fundPoolData.currentBalance.totalValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">现金余额:</span>
                  <span className="text-green-400 font-bold">¥{fundPoolData.currentBalance.cash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">游戏币:</span>
                  <span className="text-yellow-400 font-bold">{fundPoolData.currentBalance.gameCoins.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">算力:</span>
                  <span className="text-purple-400 font-bold">{fundPoolData.currentBalance.computing.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">A币流通量:</span>
                  <span className="text-indigo-400 font-bold">{fundPoolData.aCoinStats?.circulatingSupply.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-400">加载中...</div>
            )}
          </div>
          
          <div className="bg-slate-800/80 border-2 border-purple-400/30 rounded-lg p-4">
            <h2 className="text-lg font-bold text-purple-400 mb-3">结算数据</h2>
            {settlementData ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">日期:</span>
                  <span className="text-white font-bold">{settlementData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">平台净收入:</span>
                  <span className="text-green-400 font-bold">¥{settlementData.platformNetIncome.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">A币发放池:</span>
                  <span className="text-indigo-400 font-bold">{settlementData.aCoinDistributionPool.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">活跃用户数:</span>
                  <span className="text-blue-400 font-bold">{settlementData.totalDailyActivePlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">结算状态:</span>
                  <span className={`font-bold ${
                    settlementData.settlementStatus === 'ready' ? 'text-green-400' :
                    settlementData.settlementStatus === 'completed' ? 'text-blue-400' :
                    'text-red-400'
                  }`}>
                    {settlementData.settlementStatus === 'ready' ? '准备就绪' :
                     settlementData.settlementStatus === 'completed' ? '已完成' :
                     settlementData.settlementStatus === 'insufficient_income' ? '收入不足' :
                     settlementData.settlementStatus}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-slate-400">加载中...</div>
            )}
          </div>
        </div>
        
        {/* 操作区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800/80 border-2 border-green-400/30 rounded-lg p-4">
            <h2 className="text-lg font-bold text-green-400 mb-3">添加模拟收入</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">收入金额</label>
                <input
                  type="number"
                  value={mockIncomeAmount}
                  onChange={(e) => setMockIncomeAmount(Number(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  min="1"
                />
              </div>
              <button
                onClick={handleAddMockIncome}
                disabled={loading}
                className="w-full bg-green-500/20 border border-green-400/30 rounded px-4 py-2 text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-50"
              >
                {loading ? '处理中...' : '添加模拟收入'}
              </button>
            </div>
          </div>
          
          <div className="bg-slate-800/80 border-2 border-blue-400/30 rounded-lg p-4">
            <h2 className="text-lg font-bold text-blue-400 mb-3">生成模拟用户</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">用户数量</label>
                <input
                  type="number"
                  value={mockActiveUsers}
                  onChange={(e) => setMockActiveUsers(Number(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  min="1"
                  max="1000"
                />
              </div>
              <button
                onClick={handleGenerateMockUsers}
                disabled={loading}
                className="w-full bg-blue-500/20 border border-blue-400/30 rounded px-4 py-2 text-blue-400 hover:bg-blue-500/30 transition-all disabled:opacity-50"
              >
                {loading ? '处理中...' : '生成模拟用户'}
              </button>
            </div>
          </div>
        </div>
        
        {/* 结算操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800/80 border-2 border-purple-400/30 rounded-lg p-4">
            <h2 className="text-lg font-bold text-purple-400 mb-3">执行正常结算</h2>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">
                执行标准的A币结算流程，需要平台净收入为正值。
              </p>
              <button
                onClick={handleExecuteSettlement}
                disabled={loading}
                className="w-full bg-purple-500/20 border border-purple-400/30 rounded px-4 py-2 text-purple-400 hover:bg-purple-500/30 transition-all disabled:opacity-50"
              >
                {loading ? '处理中...' : '执行结算'}
              </button>
            </div>
          </div>
          
          <div className="bg-slate-800/80 border-2 border-orange-400/30 rounded-lg p-4">
            <h2 className="text-lg font-bold text-orange-400 mb-3">强制执行结算</h2>
            <div className="space-y-2">
              <p className="text-sm text-slate-400">
                绕过平台净收入检查，强制执行A币结算。
              </p>
              <button
                onClick={handleForceSettlement}
                disabled={loading}
                className="w-full bg-orange-500/20 border border-orange-400/30 rounded px-4 py-2 text-orange-400 hover:bg-orange-500/30 transition-all disabled:opacity-50"
              >
                {loading ? '处理中...' : '强制结算'}
              </button>
            </div>
          </div>
        </div>
        
        {/* 结果日志 */}
        <div className="bg-slate-800/80 border-2 border-cyan-400/30 rounded-lg p-4">
          <h2 className="text-lg font-bold text-cyan-400 mb-3">操作日志</h2>
          <div className="bg-black/30 rounded-lg p-3 h-64 overflow-y-auto">
            {results.length > 0 ? (
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="text-sm">
                    <span className="text-gray-400">[{new Date().toLocaleTimeString()}]</span> {result}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-4">
                暂无操作日志
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ACoinSettlementTest;
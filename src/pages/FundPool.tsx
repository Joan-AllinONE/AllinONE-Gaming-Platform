import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fundPoolService } from '@/services/fundPoolService';
import { computingEconomicService } from '@/services/computingEconomicService';
import { aCoinService } from '@/services/aCoinService';
import { walletService } from '@/services/walletService';
import { FundPoolTransaction, FundPoolBalance, PublicFundPoolData } from '@/types/fundPool';
import { DailySettlementData } from '@/types/computing';
import FundPoolOCoinMarket from '@/components/FundPoolOCoinMarket';

export default function FundPool() {
  const [fundPoolData, setFundPoolData] = useState<PublicFundPoolData | null>(null);
  const [transactions, setTransactions] = useState<FundPoolTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'charts' | 'ocoin'>('overview');
  const [searchFilters, setSearchFilters] = useState({
    type: '',
    category: '',
    source: '',
    currency: ''
  });
  const [dailySettlement, setDailySettlement] = useState<DailySettlementData | null>(null);
  const [showSettlementDetails, setShowSettlementDetails] = useState(false);
  const [isSettlementProcessing, setIsSettlementProcessing] = useState(false);
  const [settlementResult, setSettlementResult] = useState<{
    success: boolean;
    message: string;
    distributedAmount?: number;
    recipientsCount?: number;
  } | null>(null);
  const [autoSettlementStatus, setAutoSettlementStatus] = useState<{
    lastChecked: Date | null;
    lastSettled: Date | null;
    isEnabled: boolean;
    message: string;
  }>({
    lastChecked: null,
    lastSettled: null,
    isEnabled: true,
    message: '自动结算已启用'
  });

  useEffect(() => {
    loadFundPoolData();
    loadDailySettlementData();
    checkAutoSettlement(); // 恢复页面加载时的检查，以确保结算状态正确初始化
    
    const dataInterval = setInterval(loadFundPoolData, 30000); // 每30秒更新数据
    // const settlementInterval = setInterval(checkAutoSettlement, 60000); // 禁用前端自动结算轮询，避免与手动操作冲突
    
    return () => {
      clearInterval(dataInterval);
      // clearInterval(settlementInterval);
    };
  }, []);
  
  // 检查自动结算
  const checkAutoSettlement = async () => {
    if (!autoSettlementStatus.isEnabled) return;
    
    try {
      setAutoSettlementStatus(prev => ({
        ...prev,
        lastChecked: new Date(),
        message: '正在检查自动结算...'
      }));
      
      // 检查并执行自动结算
      const result = await computingEconomicService.checkAndExecuteAutoDailySettlement();
      
      // 无论是否执行，都重新加载结算数据，以获取后端更新的状态（例如，从“已完成”变为“待结算”）
      loadDailySettlementData();

      if (result.executed) {
        // 如果执行了结算
        if (result.result?.success) {
          // 结算成功
          setAutoSettlementStatus(prev => ({
            ...prev,
            lastSettled: new Date(),
            message: `自动结算成功完成! 发放了 ${result.result?.distributedAmount?.toFixed(2)} A币给 ${result.result?.recipientsCount} 名用户`
          }));
          
          // 更新资金池数据
          loadFundPoolData();
          
          // 设置结算结果
          setSettlementResult({
            success: true,
            message: '每日自动结算成功完成！',
            distributedAmount: result.result?.distributedAmount,
            recipientsCount: result.result?.recipientsCount
          });
        } else {
          // 结算失败
          setAutoSettlementStatus(prev => ({
            ...prev,
            message: `自动结算失败: ${result.result?.message}`
          }));
        }
      } else {
        // 没有执行结算
        setAutoSettlementStatus(prev => ({
          ...prev,
          message: '今日已自动结算或尚未到自动结算时间'
        }));
      }
    } catch (error) {
      console.error('检查自动结算失败:', error);
      setAutoSettlementStatus(prev => ({
        ...prev,
        message: `检查自动结算失败: ${error instanceof Error ? error.message : '未知错误'}`
      }));
    }
  };
  
  // 切换自动结算状态
  const toggleAutoSettlement = () => {
    setAutoSettlementStatus(prev => ({
      ...prev,
      isEnabled: !prev.isEnabled,
      message: !prev.isEnabled ? '自动结算已启用' : '自动结算已禁用'
    }));
  };

  const loadFundPoolData = async () => {
    try {
      const [publicData, allTransactions] = await Promise.all([
        fundPoolService.getPublicFundPoolData(),
        fundPoolService.getAllTransactions()
      ]);
      setFundPoolData(publicData);
      setTransactions(allTransactions);
    } catch (error) {
      console.error('加载资金池数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailySettlementData = async () => {
    try {
      const data = await computingEconomicService.getDailySettlementData();
      setDailySettlement(data);
    } catch (error) {
      console.error('加载每日结算数据失败:', error);
    }
  };

  // 执行A币结算的函数
  const handleExecuteSettlement = async () => {
    if (!dailySettlement || dailySettlement.settlementStatus !== 'ready') {
      return;
    }

    setIsSettlementProcessing(true);
    setSettlementResult(null);

    try {
      // 1. 更新结算状态为处理中
      const updatedSettlement = { ...dailySettlement, settlementStatus: 'processing' as const };
      setDailySettlement(updatedSettlement);

      // 2. 模拟结算过程
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 3. 获取活跃用户列表和他们的贡献分数
      const activeUsers = await computingEconomicService.getActiveUsersWithContributionScores();
      
      // 4. 批量分发A币给所有活跃用户
      const distributionResult = await aCoinService.distributeACoinsByContribution(
        dailySettlement.aCoinDistributionPool,
        activeUsers
      );
      
      // 5. 如果当前用户在分发列表中，更新他们的钱包
      const currentUserDistribution = distributionResult.successfulDistributions.find(
        dist => dist.userId === 'current-user'
      );
      
      if (currentUserDistribution) {
        await walletService.distributeACoins(
          currentUserDistribution.amount,
          `每日结算A币奖励 - 贡献分数: ${currentUserDistribution.contributionScore.toFixed(2)}`
        );
      }

      // 5. 更新结算状态为已完成
      const completedSettlement = { 
        ...updatedSettlement, 
        settlementStatus: 'completed' as const,
        lastSettlementTime: new Date()
      };
      setDailySettlement(completedSettlement);

      // 6. 刷新资金池数据
      const refreshedData = await fundPoolService.getPublicFundPoolData();
      setFundPoolData(refreshedData);

      // 7. 设置结算结果
      setSettlementResult({
        success: true,
        message: '结算成功完成！',
        distributedAmount: distributionResult.totalAmount,
        recipientsCount: distributionResult.recipientsCount
      });
    } catch (error) {
      console.error('执行结算失败:', error);
      
      // 更新结算状态为失败
      const failedSettlement = { ...dailySettlement, settlementStatus: 'failed' as const };
      setDailySettlement(failedSettlement);
      
      setSettlementResult({
        success: false,
        message: `结算失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    } finally {
      setIsSettlementProcessing(false);
    }
  };

  const handleSearch = async () => {
    try {
      const filtered = await fundPoolService.searchTransactions({
        type: searchFilters.type as any,
        category: searchFilters.category,
        source: searchFilters.source
      });
      
      // 客户端货币筛选
      let result = filtered;
      if (searchFilters.currency) {
        result = filtered.filter(tx => tx.currency === searchFilters.currency);
      }
      
      setTransactions(result);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  const resetSearch = () => {
    setSearchFilters({ type: '', category: '', source: '', currency: '' });
    loadFundPoolData();
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencyNames = {
      computingPower: '算力',
      // 兼容旧数据
      computing: '算力',
      cash: '现金',
      gameCoins: '游戏币',
      aCoins: 'A币'
    };
    return `${amount.toLocaleString()} ${currencyNames[currency as keyof typeof currencyNames] || currency}`;
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionTypeIcon = (type: string) => {
    return type === 'income' ? '↗️' : '↙️';
  };

  // 简单图表数据处理
  const getBarWidth = (value: number, maxValue: number) => {
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">加载资金池数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">平台资金池</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">透明公开的平台财务数据</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>🔄 实时更新</span>
                <span>•</span>
                <span>📊 公开透明</span>
                <span>•</span>
                <span>🔒 隐私保护</span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/"
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-500 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <i className="fa-solid fa-home mr-1"></i>
                  主页
                </Link>
                <Link
                  to="/computing-power"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  <i className="fa-solid fa-user mr-1"></i>
                  个人中心
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
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg mb-8">
          {[
            { key: 'overview', label: '总览', icon: '📊' },
            { key: 'transactions', label: '交易记录', icon: '📋' },
            { key: 'charts', label: '数据图表', icon: '📈' },
            { key: 'ocoin', label: 'O币市场', icon: '🔶' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && fundPoolData && (
          <div className="space-y-8">
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">算力余额</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {(fundPoolData.currentBalance.computingPower ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">现金余额</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      ¥{fundPoolData.currentBalance.cash.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">游戏币余额</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {fundPoolData.currentBalance.gameCoins.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🪙</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">A币余额</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {(fundPoolData.aCoinStats.totalSupply - fundPoolData.aCoinStats.circulatingSupply).toLocaleString()} A币
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      总量-发放量的净值
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      累计发放：{fundPoolData.aCoinStats.totalDistributed.toLocaleString()} A币
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🅰️</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">总价值</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      ¥{fundPoolData.currentBalance.totalValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">💎</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">收入统计</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">总收入</span>
                    <span className="font-medium text-green-600">¥{fundPoolData.stats.totalIncome.totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">佣金收入</span>
                    <span className="font-medium">¥{fundPoolData.stats.incomeByCategory.commission.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">支出统计</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">总支出</span>
                    <span className="font-medium text-red-600">¥{fundPoolData.stats.totalExpense.totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">奖励支出</span>
                    <span className="font-medium">¥{fundPoolData.stats.expenseByCategory.reward.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">交易统计</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">总交易数</span>
                    <span className="font-medium">{fundPoolData.transactionCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">平均金额</span>
                    <span className="font-medium">¥{fundPoolData.averageTransactionAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* A币专区 */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-xl p-8 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-3xl text-white">🅰️</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">A币 (平台币)</h2>
                    <p className="text-slate-600 dark:text-slate-400">固定总量10亿，1 A币 = 1 RMB，最小单位0.01元</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/acoin-settlement-test"
                    className="px-4 py-2 text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/30 transition-colors flex items-center gap-1"
                  >
                    <span>🧮</span>
                    A币结算测试
                  </Link>
                  <Link
                    to="/acoin-calculation-test"
                    className="px-4 py-2 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors flex items-center gap-1"
                  >
                    <span>📊</span>
                    A币计算测试
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">总供应量</div>
                  <div className="text-xl font-bold text-purple-600">
                    {fundPoolData.aCoinStats.totalSupply.toLocaleString()} A币
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">流通供应量</div>
                  <div className="text-xl font-bold text-green-600">
                    {fundPoolData.aCoinStats.circulatingSupply.toLocaleString()} A币
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">累计发放</div>
                  <div className="text-xl font-bold text-blue-600">
                    {fundPoolData.aCoinStats.totalDistributed.toLocaleString()} A币
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">持有者数量</div>
                  <div className="text-xl font-bold text-orange-600">
                    {fundPoolData.aCoinStats.holdersCount.toLocaleString()} 人
                  </div>
                </div>
              </div>

              {/* 每日结算A币 */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>🧮</span>
                    每日结算A币
                  </h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowSettlementDetails(!showSettlementDetails)}
                      className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/30 transition-colors"
                    >
                      {showSettlementDetails ? '隐藏详情' : '显示详情'}
                    </button>
                    <button
                      onClick={toggleAutoSettlement}
                      className={`px-3 py-1 text-sm ${
                        autoSettlementStatus.isEnabled
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      } rounded-lg transition-colors`}
                    >
                      {autoSettlementStatus.isEnabled ? '自动结算: 开' : '自动结算: 关'}
                    </button>
                    {dailySettlement && dailySettlement.settlementStatus === 'ready' && (
                      <button 
                        onClick={handleExecuteSettlement}
                        disabled={isSettlementProcessing}
                        className={`px-3 py-1 text-sm ${
                          isSettlementProcessing 
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/30'
                        } rounded-lg transition-colors flex items-center gap-1`}
                      >
                        {isSettlementProcessing ? (
                          <>
                            <span className="animate-spin h-3 w-3 border-2 border-green-500 rounded-full border-t-transparent"></span>
                            处理中...
                          </>
                        ) : '手动结算'}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* 自动结算状态显示 */}
                <div className={`mb-4 p-3 rounded-lg ${
                  autoSettlementStatus.isEnabled 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                    : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${autoSettlementStatus.isEnabled ? 'text-blue-500' : 'text-gray-500'}`}>
                        {autoSettlementStatus.isEnabled ? '🔄' : '⏸️'}
                      </span>
                      <div>
                        <h4 className={`font-medium ${autoSettlementStatus.isEnabled ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          {autoSettlementStatus.isEnabled ? '自动结算已启用' : '自动结算已禁用'}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {autoSettlementStatus.message}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                      {autoSettlementStatus.lastChecked && (
                        <div>上次检查: {autoSettlementStatus.lastChecked.toLocaleTimeString()}</div>
                      )}
                      {autoSettlementStatus.lastSettled && (
                        <div>上次结算: {autoSettlementStatus.lastSettled.toLocaleTimeString()}</div>
                      )}
                    </div>
                  </div>
                </div>
                
                {dailySettlement ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">今日结算日期</div>
                        <div className="text-lg font-medium">{dailySettlement.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-600 dark:text-slate-400">结算状态</div>
                        <div className={`text-lg font-medium ${
                          dailySettlement.settlementStatus === 'ready' ? 'text-green-600' : 
                          dailySettlement.settlementStatus === 'completed' ? 'text-blue-600' : 
                          dailySettlement.settlementStatus === 'processing' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {
                            dailySettlement.settlementStatus === 'ready' ? '待结算' : 
                            dailySettlement.settlementStatus === 'completed' ? '已完成' : 
                            dailySettlement.settlementStatus === 'processing' ? '处理中' : 
                            dailySettlement.settlementStatus === 'insufficient_income' ? '收入不足' : '失败'
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">平台净收入</div>
                        <div className="text-xl font-bold text-purple-600">¥{dailySettlement.platformNetIncome.toLocaleString()}</div>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">A币发放池</div>
                        <div className="text-xl font-bold text-blue-600">{dailySettlement.aCoinDistributionPool.toLocaleString()} A币</div>
                        <div className="text-xs text-blue-500">平台净收入的40%</div>
                      </div>
                      
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">活跃用户数</div>
                        <div className="text-xl font-bold text-green-600">{dailySettlement.totalDailyActivePlayers.toLocaleString()} 人</div>
                      </div>
                      
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">总贡献分数</div>
                        <div className="text-xl font-bold text-orange-600">{dailySettlement.totalContributionScore.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* A币余额显示 - 净值 */}
                    <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">A币余额 (总量-发放量)</div>
                          <div className="text-xl font-bold text-indigo-600">
                            {(fundPoolData.aCoinStats.totalSupply - fundPoolData.aCoinStats.circulatingSupply).toLocaleString()} A币
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">净值计算</div>
                          <div className="text-sm text-indigo-500">
                            {fundPoolData.aCoinStats.totalSupply.toLocaleString()} - {fundPoolData.aCoinStats.circulatingSupply.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 结算结果显示 */}
                    {settlementResult && (
                      <div className={`mt-4 p-4 rounded-lg ${
                        settlementResult.success 
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-lg ${settlementResult.success ? 'text-green-600' : 'text-red-600'}`}>
                            {settlementResult.success ? '✅' : '❌'}
                          </span>
                          <h4 className={`font-medium ${settlementResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                            {settlementResult.success ? '结算成功' : '结算失败'}
                          </h4>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          {settlementResult.message}
                        </p>
                        {settlementResult.success && settlementResult.distributedAmount !== undefined && (
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">总发放A币</div>
                              <div className="text-lg font-medium text-blue-600">{settlementResult.distributedAmount.toFixed(2)} A币</div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">受益用户数</div>
                              <div className="text-lg font-medium text-green-600">{settlementResult.recipientsCount} 人</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {showSettlementDetails && (
                      <div className="mt-6 space-y-6">
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                          <h4 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-3">计算过程详解</h4>
                          
                          <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                              <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">第一步：确定发放池</div>
                              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                <div>平台净收入 × 40% = A币发放池</div>
                                <div className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                  {dailySettlement.platformNetIncome} × 0.4 = {dailySettlement.aCoinDistributionPool} A币
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                              <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">第二步：计算贡献分数</div>
                              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                <div>每个用户的贡献分数由三部分组成：</div>
                                <div className="ml-4 space-y-1">
                                  <div>• 游戏币获得贡献 (50%权重)</div>
                                  <div>• 算力贡献 (30%权重)</div>
                                  <div>• 交易活跃度 (20%权重)</div>
                                </div>
                                <div className="mt-2">全网总贡献分数：{dailySettlement.totalContributionScore.toLocaleString()}</div>
                                <div>平均贡献分数：{dailySettlement.averageContributionScore.toLocaleString()}</div>
                              </div>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                              <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">第三步：分配A币</div>
                              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                <div>个人A币 = (个人贡献分数 ÷ 全网总贡献分数) × 发放池</div>
                                <div className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded mt-2">
                                  例如：用户贡献分数为0.5，则获得A币 = (0.5 ÷ {dailySettlement.totalContributionScore}) × {dailySettlement.aCoinDistributionPool} ≈ {((0.5 / dailySettlement.totalContributionScore) * dailySettlement.aCoinDistributionPool).toFixed(2)} A币
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                              <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">第四步：发放条件</div>
                              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                <div>• 平台净收入必须大于0</div>
                                <div>• 个人贡献分数必须大于0.1</div>
                                <div>• 计算结果必须大于最小发放单位0.01 A币</div>
                                <div className="mt-2 font-medium">
                                  今日结算状态：
                                  <span className={`ml-2 ${
                                    dailySettlement.settlementStatus === 'ready' ? 'text-green-600' : 
                                    dailySettlement.settlementStatus === 'completed' ? 'text-blue-600' : 
                                    dailySettlement.settlementStatus === 'processing' ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {
                                      dailySettlement.settlementStatus === 'ready' ? '待结算' : 
                                      dailySettlement.settlementStatus === 'completed' ? '已完成' : 
                                      dailySettlement.settlementStatus === 'processing' ? '处理中' : 
                                      dailySettlement.settlementStatus === 'insufficient_income' ? '收入不足' : '失败'
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                          <h4 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-3">今日数据统计</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">游戏币分发总量</div>
                              <div className="text-lg font-medium">{dailySettlement.totalDailyGameCoinsDistributed.toLocaleString()} 游戏币</div>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">算力总量</div>
                              <div className="text-lg font-medium">{dailySettlement.totalDailyComputingPower.toLocaleString()} 算力</div>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">交易总量</div>
                              <div className="text-lg font-medium">{dailySettlement.totalDailyTransactions.toLocaleString()} 笔</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">加载结算数据中...</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <span>📋</span>
                    A币发放规则
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">1</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">平台收入转化</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          只有平台净收入&gt;0时，才将其40%转化为A币发放。无收入时不发放，确保A币价值稳定。
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">2</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">个人贡献分数计算</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          基于当日实际可获得数据计算：
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500 space-y-1 ml-2">
                          <div>• 游戏币获得贡献 (50%权重)</div>
                          <div>• 算力贡献 (30%权重)</div>
                          <div>• 交易活跃度 (20%权重)</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">3</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">分配公式</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          个人A币 = (个人贡献分数 ÷ 全网总贡献分数) × 当日发放池
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          最小发放单位0.01A币，低于此数额不发放
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">4</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">基金模式特点</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          A币发放即转移给用户，不在资金池中储存。贡献分数≥0.1才能获得奖励，最小发放0.01A币。
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <span>💡</span>
                    A币特性说明
                  </h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="font-medium text-purple-900 dark:text-purple-100 mb-1">固定总量</div>
                      <div className="text-sm text-purple-700 dark:text-purple-300">
                        总供应量恒定10亿枚，永不增发，稀缺性保证价值稳定
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="font-medium text-green-900 dark:text-green-100 mb-1">价值锚定</div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        1 A币 = 1 RMB，价值稳定，可用于平台内所有奖励发放
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">基金模式</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        A币不在资金池中储存，发放即转移给用户。只有平台有净收入时才会产生A币发放，确保每个A币都有实际价值支撑。
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                      <div className="font-medium text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                        <span>🧮</span>
                        计算示例
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                        <div><strong>假设条件：</strong></div>
                        <div className="ml-2 text-xs space-y-1">
                          <div>• 平台当日净收入：1000元</div>
                          <div>• A币发放池：1000 × 40% = 400A币</div>
                          <div>• 用户A当日数据：100游戏币，10算力，50元交易</div>
                          <div>• 全网当日数据：2000游戏币，200算力，1000元交易</div>
                        </div>
                        <div className="border-t border-purple-200 dark:border-purple-600 pt-2 mt-2">
                          <div><strong>计算过程：</strong></div>
                          <div className="ml-2 text-xs space-y-1">
                            <div>1. 贡献分数 = (100/2000)×0.5 + (10/200)×0.3 + (50/1000)×0.2</div>
                            <div className="ml-4">= 0.05 + 0.015 + 0.01 = 0.075</div>
                            <div>2. 假设全网总贡献分数 = 1.0</div>
                            <div>3. 用户A获得A币 = (0.075 ÷ 1.0) × 400 = <strong className="text-purple-600 dark:text-purple-400">30 A币</strong></div>
                          </div>
                          <div className="mt-2 p-2 bg-purple-100 dark:bg-purple-800/30 rounded text-xs">
                            <strong>最终结果：</strong>用户A当日获得30A币奖励 (价值30元)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Search Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">筛选条件</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <select
                  value={searchFilters.type}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">所有类型</option>
                  <option value="income">收入</option>
                  <option value="expense">支出</option>
                </select>

                <select
                  value={searchFilters.category}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">所有类别</option>
                  <option value="commission">佣金</option>
                  <option value="reward">奖励</option>
                  <option value="operation">运营</option>
                  <option value="refund">退款</option>
                  <option value="maintenance">维护</option>
                </select>

                <select
                  value={searchFilters.source}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, source: e.target.value }))}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">所有来源</option>
                  <option value="player_market">玩家市场</option>
                  <option value="game_store">游戏电商</option>
                  <option value="official_store">官方商店</option>
                  <option value="system">系统</option>
                </select>

                <select
                  value={searchFilters.currency}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, currency: e.target.value }))}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">所有货币</option>
                  <option value="cash">💰 现金</option>
                  <option value="computing">⚡ 算力</option>
                  <option value="gameCoins">🪙 游戏币</option>
                  <option value="aCoins">🅰️ A币</option>
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={handleSearch}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    搜索
                  </button>
                  <button
                    onClick={resetSearch}
                    className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors"
                  >
                    重置
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">交易记录</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">共 {transactions.length} 条记录</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">交易编号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">类型</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">金额</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">描述</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">来源</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {transactions.slice(0, 50).map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900 dark:text-slate-100">
                          {tx.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`flex items-center gap-1 ${getTransactionTypeColor(tx.type)}`}>
                            {getTransactionTypeIcon(tx.type)}
                            {tx.type === 'income' ? '收入' : '支出'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={getTransactionTypeColor(tx.type)}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {tx.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                          {tx.source}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                          {tx.timestamp.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && fundPoolData && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Trend */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">近7日趋势</h3>
                <div className="space-y-4">
                  {fundPoolData.stats.dailyStats.slice(-7).map((day, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{day.date.split('-').slice(1).join('/')}</span>
                        <span className="font-medium">净收入: ¥{day.netIncome.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-1 h-2">
                        <div 
                          className="bg-green-500 rounded-sm"
                          style={{ width: `${getBarWidth(day.income, Math.max(...fundPoolData.stats.dailyStats.map(d => d.income)))}%` }}
                          title={`收入: ¥${day.income}`}
                        ></div>
                        <div 
                          className="bg-red-500 rounded-sm"
                          style={{ width: `${getBarWidth(day.expense, Math.max(...fundPoolData.stats.dailyStats.map(d => d.expense)))}%` }}
                          title={`支出: ¥${day.expense}`}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                    <span>收入</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                    <span>支出</span>
                  </div>
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">收支分类</h3>
                <div className="space-y-4">
                  {[
                    { label: '佣金收入', value: fundPoolData.stats.incomeByCategory.commission, color: 'bg-green-500', type: 'income' },
                    { label: '运营收入', value: fundPoolData.stats.incomeByCategory.operation, color: 'bg-blue-500', type: 'income' },
                    { label: '奖励支出', value: fundPoolData.stats.expenseByCategory.reward, color: 'bg-yellow-500', type: 'expense' },
                    { label: '退款支出', value: fundPoolData.stats.expenseByCategory.refund, color: 'bg-red-500', type: 'expense' },
                    { label: '维护支出', value: fundPoolData.stats.expenseByCategory.maintenance, color: 'bg-purple-500', type: 'expense' }
                  ].map((item, index) => {
                    const maxValue = Math.max(
                      fundPoolData.stats.incomeByCategory.commission,
                      fundPoolData.stats.incomeByCategory.operation,
                      fundPoolData.stats.expenseByCategory.reward,
                      fundPoolData.stats.expenseByCategory.refund,
                      fundPoolData.stats.expenseByCategory.maintenance
                    );
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                          <span className="font-medium">¥{item.value.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className={`${item.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${getBarWidth(item.value, maxValue)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* A币数据分析 */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-xl p-8 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl text-white">🅰️</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">A币数据分析</h2>
                  <p className="text-slate-600 dark:text-slate-400">发放趋势、持有分布、流通统计</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* A币发放趋势 */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <span>📈</span>
                    A币发放趋势 (近7日)
                  </h3>
                  <div className="space-y-4">
                    {/* 模拟近7日A币发放数据 */}
                    {[
                      { date: '09/04', distributed: 0, platformIncome: 0 },
                      { date: '09/05', distributed: 0, platformIncome: 0 },
                      { date: '09/06', distributed: 0.8, platformIncome: 2 },
                      { date: '09/07', distributed: 0, platformIncome: 0 },
                      { date: '09/08', distributed: 1.17, platformIncome: 2.925 },
                      { date: '09/09', distributed: 0.5, platformIncome: 1.25 },
                      { date: '09/10', distributed: 1.2, platformIncome: 3 }
                    ].map((day, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">{day.date}</span>
                          <span className="font-medium text-purple-600">发放: {day.distributed}A币</span>
                        </div>
                        <div className="flex gap-1 h-2">
                          <div 
                            className="bg-purple-500 rounded-sm"
                            style={{ width: `${day.distributed > 0 ? (day.distributed / 1.2) * 100 : 0}%` }}
                            title={`发放: ${day.distributed}A币`}
                          ></div>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          平台收入: ¥{day.platformIncome}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* A币持有分布 */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <span>👥</span>
                    持有者分布
                  </h3>
                  <div className="space-y-4">
                    {[
                      { range: '1000+ A币', holders: 2, percentage: 15, color: 'bg-purple-600' },
                      { range: '500-999 A币', holders: 5, percentage: 25, color: 'bg-purple-500' },
                      { range: '100-499 A币', holders: 12, percentage: 35, color: 'bg-purple-400' },
                      { range: '10-99 A币', holders: 18, percentage: 20, color: 'bg-purple-300' },
                      { range: '1-9 A币', holders: 8, percentage: 5, color: 'bg-purple-200' }
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">{item.range}</span>
                          <span className="font-medium">{item.holders}人 ({item.percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className={`${item.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* A币月度统计 */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm mb-8">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <span>📊</span>
                  A币月度统计
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { month: '2024/07', distributed: 0, holders: 0, avgHolding: 0 },
                    { month: '2024/08', distributed: 0, holders: 0, avgHolding: 0 },
                    { month: '2024/09', distributed: 3.67, holders: 45, avgHolding: 0.08 },
                    { month: '2024/10', distributed: 12.5, holders: 68, avgHolding: 0.18 },
                    { month: '2024/11', distributed: 28.3, holders: 89, avgHolding: 0.32 },
                    { month: '2024/12', distributed: 45.2, holders: 112, avgHolding: 0.40 }
                  ].map((month, index) => (
                    <div key={index} className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{month.month.split('/')[1]}月</div>
                      <div className="space-y-1">
                        <div className="text-xs text-purple-600">发放量</div>
                        <div className="text-sm font-medium">{month.distributed}A币</div>
                        <div className="text-xs text-blue-600">持有者</div>
                        <div className="text-sm font-medium">{month.holders}人</div>
                        <div className="text-xs text-green-600">平均持有</div>
                        <div className="text-sm font-bold">{month.avgHolding}A币</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* A币年度总结 */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <span>🏆</span>
                  2024年度A币总结
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">89.67</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">累计发放 (A币)</div>
                    <div className="text-xs text-purple-500 mt-1">≈ ¥89.67</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">112</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">总持有者数</div>
                    <div className="text-xs text-blue-500 mt-1">较上月+23人</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">0.80</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">平均持有量 (A币)</div>
                    <div className="text-xs text-green-500 mt-1">持续增长</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">0.009%</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">流通率</div>
                    <div className="text-xs text-orange-500 mt-1">89.67/1000000000</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Stats */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">月度统计</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {fundPoolData.stats.monthlyStats.map((month, index) => (
                  <div key={index} className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">{month.month}</div>
                    <div className="space-y-1">
                      <div className="text-xs text-green-600">收入</div>
                      <div className="text-sm font-medium">¥{month.income.toLocaleString()}</div>
                      <div className="text-xs text-red-600">支出</div>
                      <div className="text-sm font-medium">¥{month.expense.toLocaleString()}</div>
                      <div className="text-xs text-blue-600">净收入</div>
                      <div className="text-sm font-bold">¥{month.netIncome.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* O币市场标签 */}
        {activeTab === 'ocoin' && (
          <div className="space-y-6">
            <FundPoolOCoinMarket />
            
            {/* 快速操作链接 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                🎯 O币相关操作
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/computing-power"
                  className="flex items-center space-x-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                >
                  <span className="text-2xl">💱</span>
                  <div>
                    <div className="font-medium text-orange-800 dark:text-orange-400">交易O币</div>
                    <div className="text-sm text-orange-600 dark:text-orange-500">前往个人中心买入或出售</div>
                  </div>
                </Link>
                
                <Link
                  to="/computing-dashboard"
                  className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <span className="text-2xl">📊</span>
                  <div>
                    <div className="font-medium text-blue-800 dark:text-blue-400">算力中心</div>
                    <div className="text-sm text-blue-600 dark:text-blue-500">查看算力生态数据</div>
                  </div>
                </Link>
                
                <Link
                  to="/platform-management"
                  className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <span className="text-2xl">🔐</span>
                  <div>
                    <div className="font-medium text-green-800 dark:text-green-400">期权管理</div>
                    <div className="text-sm text-green-600 dark:text-green-500">前往平台管理系统</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* 资金池与O币关系说明 */}
            <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg p-4">
              <h4 className="text-sm font-bold text-orange-800 dark:text-orange-400 mb-2">💡 资金池与O币的关系</h4>
              <div className="text-xs text-orange-700 dark:text-orange-500 space-y-1">
                <p>• 资金池的净收入将用于O币分红，按持币比例分配给所有O币持有者</p>
                <p>• O币的交易手续费将进入资金池，增强平台整体资金实力</p>
                <p>• 资金池的健康状况直接影响O币的分红能力和市场价值</p>
                <p>• 通过资金池透明度提升O币投资者的信心和收益预期</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
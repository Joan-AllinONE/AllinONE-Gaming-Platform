import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  economicService, 
  fundPoolService, 
  computingEconomicService, 
  gameActivityService 
} from '@/services';
import { EconomicData } from '@/types/marketplace';
import { FundPoolStats } from '@/types/fundPool';
import { 
  ComputingEconomicData, 
  ComputingMarketData,
  NetworkActivityData
} from '@/types/computing';
import ComputingOCoinAnalytics from '@/components/ComputingOCoinAnalytics';

export default function ComputingDashboard() {
  const [economicData, setEconomicData] = useState<EconomicData | null>(null);
  const [fundPoolStats, setFundPoolStats] = useState<FundPoolStats | null>(null);
  const [computingEconomicData, setComputingEconomicData] = useState<ComputingEconomicData | null>(null);
  const [networkActivityData, setNetworkActivityData] = useState<NetworkActivityData | null>(null);
  const [marketData, setMarketData] = useState<ComputingMarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'activity' | 'economics' | 'market' | 'ocoin'>('overview');

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        economicDataResult, 
        fundPoolDataResult, 
        computingEconomicDataResult, 
        networkActivityDataResult,
        marketDataResult
      ] = await Promise.all([
        economicService.getEconomicData(),
        fundPoolService.getStats(),
        computingEconomicService.getComputingEconomicData(),
        gameActivityService.getNetworkActivityData(),
        computingEconomicService.getComputingMarketData()
      ]);
      
      setEconomicData(economicDataResult);
      setFundPoolStats(fundPoolDataResult);
      setComputingEconomicData(computingEconomicDataResult);
      setNetworkActivityData(networkActivityDataResult);
      setMarketData(marketDataResult);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 每10秒更新一次
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">加载算力经济生态数据中...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: '生态概览', icon: '🌐' },
    { id: 'activity', name: '活动算力', icon: '⚡' },
    { id: 'economics', name: '经济分析', icon: '📊' },
    { id: 'market', name: '市场数据', icon: '📈' },
    { id: 'ocoin', name: 'O币市场', icon: '🔶' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题和操作按钮 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              算力经济生态中心
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              实时监控平台算力生态与经济健康状况
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <span>🏠</span>
              <span>回到主页</span>
            </Link>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 刷新数据
            </button>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="flex space-x-1 mb-8 bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-all ${
                selectedTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* 标签页内容 */}
        <div className="space-y-6">
          {selectedTab === 'overview' && (
            <div className="space-y-8">
              {/* 完整货币经济概览 */}
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  完整货币经济概览
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* 全网总算力 */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 shadow-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-xl">⚡</span>
                      </div>
                      <div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">全网总算力</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {computingEconomicData?.totalNetworkComputingPower.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      算力价值: ¥{computingEconomicData?.totalEconomicValue.toLocaleString()}
                    </div>
                  </div>

                  {/* 游戏币总金额 */}
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-6 shadow-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-yellow-600 flex items-center justify-center">
                        <span className="text-white text-xl">🪙</span>
                      </div>
                      <div>
                        <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">游戏币总金额</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {fundPoolStats?.totalIncome?.gameCoins?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      流通中的游戏币总量
                    </div>
                  </div>

                  {/* 平台总收入 */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 shadow-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center">
                        <span className="text-white text-xl">📈</span>
                      </div>
                      <div>
                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">平台总收入</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          ¥{fundPoolStats?.totalIncome?.totalValue?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      累计收入总额
                    </div>
                  </div>

                  {/* 平台总支出 */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-6 shadow-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-red-600 flex items-center justify-center">
                        <span className="text-white text-xl">📉</span>
                      </div>
                      <div>
                        <div className="text-sm text-red-600 dark:text-red-400 font-medium">平台总支出</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          ¥{fundPoolStats?.totalExpense?.totalValue?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400">
                      累计支出总额
                    </div>
                  </div>
                </div>
              </div>

              {/* 资金池详细状态 */}
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                  <span className="text-2xl">🏦</span>
                  资金池详细状态
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 当前余额 */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                      💳 当前余额
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">现金余额</span>
                        <span className="font-bold text-green-600">¥{fundPoolStats?.totalIncome?.cash?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">算力余额</span>
                        <span className="font-bold text-blue-600">{fundPoolStats?.totalIncome?.computing?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">游戏币余额</span>
                        <span className="font-bold text-yellow-600">{fundPoolStats?.totalIncome?.gameCoins?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">总价值</span>
                        <span className="font-bold text-lg">¥{fundPoolStats?.totalIncome?.totalValue?.toLocaleString() || '0'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 净收益分析 */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                      📊 净收益分析
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">净现金收益</span>
                        <span className={`font-bold ${(fundPoolStats?.netIncome?.cash || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ¥{fundPoolStats?.netIncome?.cash?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">净算力收益</span>
                        <span className={`font-bold ${(fundPoolStats?.netIncome?.computing || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fundPoolStats?.netIncome?.computing?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">净游戏币收益</span>
                        <span className={`font-bold ${(fundPoolStats?.netIncome?.gameCoins || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fundPoolStats?.netIncome?.gameCoins?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">总净收益</span>
                        <span className={`font-bold text-lg ${(fundPoolStats?.netIncome?.totalValue || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ¥{fundPoolStats?.netIncome?.totalValue?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 经济健康指标 */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                      🏥 经济健康指标
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">经济健康度</span>
                        <span className="font-bold">{computingEconomicData?.economicHealthScore}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">算力ROI</span>
                        <span className="font-bold">{computingEconomicData?.computingROI.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">风险等级</span>
                        <span className={`font-bold px-2 py-1 rounded text-xs ${
                          computingEconomicData?.riskLevel === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          computingEconomicData?.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {computingEconomicData?.riskLevel === 'low' ? '低风险' :
                           computingEconomicData?.riskLevel === 'medium' ? '中风险' : '高风险'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">玩家留存率</span>
                        <span className="font-bold">{computingEconomicData?.playerRetentionRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 收入来源分析 */}
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  收入来源分析
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 按来源统计 */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                      🏪 按来源统计
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">玩家市场</span>
                        <span className="font-bold">¥{fundPoolStats?.incomeBySource?.player_market?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">官方商店</span>
                        <span className="font-bold">¥{fundPoolStats?.incomeBySource?.official_store?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">游戏商店</span>
                        <span className="font-bold">¥{fundPoolStats?.incomeBySource?.game_store?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">系统收入</span>
                        <span className="font-bold">¥{fundPoolStats?.incomeBySource?.system?.toLocaleString() || '0'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 按类别统计 */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                      📋 按类别统计
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">佣金收入</span>
                        <span className="font-bold">¥{fundPoolStats?.incomeByCategory?.commission?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">运营收入</span>
                        <span className="font-bold">¥{fundPoolStats?.incomeByCategory?.operation?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">奖励支出</span>
                        <span className="font-bold text-red-600">-¥{fundPoolStats?.expenseByCategory?.reward?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">维护支出</span>
                        <span className="font-bold text-red-600">-¥{fundPoolStats?.expenseByCategory?.maintenance?.toLocaleString() || '0'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 活动统计 */}
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                  <span className="text-2xl">🎮</span>
                  平台活动统计
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                      👥 用户活动
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">活跃节点</span>
                        <span className="font-bold">{computingEconomicData?.activeComputingNodes.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">游戏会话</span>
                        <span className="font-bold">{computingEconomicData?.totalGameSessions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">总游戏时长</span>
                        <span className="font-bold">{computingEconomicData?.totalPlayTime.toLocaleString()}小时</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                      💰 收益表现
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">日收益</span>
                        <span className="font-bold text-green-600">¥{computingEconomicData?.dailyComputingRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">月预测收益</span>
                        <span className="font-bold text-blue-600">¥{computingEconomicData?.projectedMonthlyEarnings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">算力增长率</span>
                        <span className="font-bold text-purple-600">{computingEconomicData?.computingPowerGrowthRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                      🔄 系统效率
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">算力效率</span>
                        <span className="font-bold">{computingEconomicData?.averageComputingEfficiency.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">可持续指数</span>
                        <span className="font-bold">{computingEconomicData?.sustainabilityIndex}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">资金池贡献</span>
                        <span className="font-bold">¥{computingEconomicData?.computingContributionToFund.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'activity' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 网络活动数据 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  ⚡ 网络活动概况
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">活跃玩家</span>
                    <span className="font-bold text-lg">{networkActivityData?.totalActivePlayers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">游戏会话</span>
                    <span className="font-bold text-lg">{networkActivityData?.totalGameSessions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">总游戏时长</span>
                    <span className="font-bold text-lg">{networkActivityData?.totalPlayTime.toLocaleString()}小时</span>
                  </div>
                </div>
              </div>

              {/* 热门游戏 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  🏆 热门游戏排行
                </h3>
                <div className="space-y-3">
                  {networkActivityData?.gamePopularity.slice(0, 5).map((game, index) => (
                    <div key={game.gameId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium">{game.gameName}</span>
                      </div>
                      <span className="text-slate-600 dark:text-slate-400">{game.playerCount}人</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'economics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 经济指标 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  📈 经济指标
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">算力效率</span>
                    <span className="font-bold">{computingEconomicData?.averageComputingEfficiency.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">可持续指数</span>
                    <span className="font-bold">{computingEconomicData?.sustainabilityIndex}/100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">月度预期收益</span>
                    <span className="font-bold">¥{computingEconomicData?.projectedMonthlyEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">算力增长率</span>
                    <span className="font-bold">{computingEconomicData?.computingPowerGrowthRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* 风险评估 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  ⚠️ 风险评估
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">风险等级</span>
                    <span className={`font-bold px-2 py-1 rounded ${
                      computingEconomicData?.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                      computingEconomicData?.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {computingEconomicData?.riskLevel === 'low' ? '低风险' :
                       computingEconomicData?.riskLevel === 'medium' ? '中风险' : '高风险'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">日收益</span>
                    <span className="font-bold">¥{computingEconomicData?.dailyComputingRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">资金池贡献</span>
                    <span className="font-bold">¥{computingEconomicData?.computingContributionToFund.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}



          {selectedTab === 'market' && marketData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 市场概况 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  📈 市场概况
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">当前算力价格</span>
                    <span className="font-bold text-lg">¥{marketData.currentComputingPrice.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">市场总值</span>
                    <span className="font-bold">¥{marketData.marketCap.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">24h交易量</span>
                    <span className="font-bold">¥{marketData.tradingVolume24h.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">市场趋势</span>
                    <span className={`font-bold px-2 py-1 rounded ${
                      marketData.marketTrend === 'bullish' ? 'bg-green-100 text-green-800' :
                      marketData.marketTrend === 'bearish' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {marketData.marketTrend === 'bullish' ? '看涨' :
                       marketData.marketTrend === 'bearish' ? '看跌' : '稳定'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 价格波动 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  📊 价格分析
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">价格波动率</span>
                    <span className="font-bold">{marketData.priceVolatility.toFixed(2)}%</span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <p>最近价格历史:</p>
                    <div className="mt-2 space-y-1">
                      {marketData.priceHistory.slice(-5).map((point, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{new Date(point.timestamp).toLocaleDateString()}</span>
                          <span className={point.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ¥{point.price.toFixed(4)} ({point.change >= 0 ? '+' : ''}{point.change.toFixed(2)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'ocoin' && (
            <div className="space-y-6">
              <ComputingOCoinAnalytics />
              
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
                    to="/fund-pool"
                    className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  >
                    <span className="text-2xl">💰</span>
                    <div>
                      <div className="font-medium text-green-800 dark:text-green-400">资金池信息</div>
                      <div className="text-sm text-green-600 dark:text-green-500">查看平台资金池状态</div>
                    </div>
                  </Link>
                  
                  <Link
                    to="/platform-management"
                    className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <span className="text-2xl">🔐</span>
                    <div>
                      <div className="font-medium text-blue-800 dark:text-blue-400">期权管理</div>
                      <div className="text-sm text-blue-600 dark:text-blue-500">前往平台管理系统</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 快速导航 */}
        <div className="mt-12 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            🚀 快速导航
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link
              to="/"
              className="flex items-center space-x-2 p-3 bg-slate-50 dark:bg-slate-900/20 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/30 transition-colors"
            >
              <span>🏠</span>
              <span className="font-medium">回到主页</span>
            </Link>
            <Link
              to="/game-center"
              className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <span>🎮</span>
              <span className="font-medium">游戏中心</span>
            </Link>
            <Link
              to="/fund-pool"
              className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <span>💰</span>
              <span className="font-medium">资金池</span>
            </Link>
            <Link
              to="/marketplace"
              className="flex items-center space-x-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <span>🛒</span>
              <span className="font-medium">市场交易</span>
            </Link>
            <Link
              to="/computing-test"
              className="flex items-center space-x-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              <span>🔧</span>
              <span className="font-medium">服务测试</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
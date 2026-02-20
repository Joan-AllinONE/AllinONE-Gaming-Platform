import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { computingEconomicService } from '@/services/computingEconomicService';
import { DailySettlementData, DailySettlementHistory } from '@/types/computing';

export default function DailySettlementTest() {
  const [todayData, setTodayData] = useState<DailySettlementData | null>(null);
  const [historyData, setHistoryData] = useState<DailySettlementHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [today, history] = await Promise.all([
        computingEconomicService.getDailySettlementData(),
        computingEconomicService.getSettlementHistory()
      ]);
      setTodayData(today);
      setHistoryData(history);
    } catch (error) {
      console.error('加载每日结算数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">加载每日结算数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              每日结算数据测试
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              验证每日结算功能的数据展示
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/computing-dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回算力中心
            </Link>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🔄 刷新数据
            </button>
          </div>
        </div>

        {/* 今日结算数据 */}
        {todayData && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              今日结算数据 ({todayData.date})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  ⚡ 算力数据
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">全网算力</span>
                    <span className="font-bold">{todayData.totalDailyComputingPower.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">人均算力</span>
                    <span className="font-bold">{todayData.averageComputingPowerPerPlayer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">增长率</span>
                    <span className={`font-bold ${todayData.computingPowerGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {todayData.computingPowerGrowthRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  🪙 游戏币数据
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">发放总量</span>
                    <span className="font-bold">{todayData.totalDailyGameCoinsDistributed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">人均获得</span>
                    <span className="font-bold">{todayData.averageGameCoinsPerPlayer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">通胀率</span>
                    <span className="font-bold text-amber-600">{todayData.gameCoinsInflationRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  🅰️ A币数据
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">发放总量</span>
                    <span className="font-bold text-purple-600">{todayData.totalDailyACoinDistributed.toFixed(2)} A币</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">平台收入</span>
                    <span className="font-bold">¥{todayData.platformNetIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">发放比例</span>
                    <span className="font-bold">40%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  👥 活跃数据
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">活跃玩家</span>
                    <span className="font-bold">{todayData.activePlayers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">游戏会话</span>
                    <span className="font-bold">{todayData.totalGameSessions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">游戏时长</span>
                    <span className="font-bold">{todayData.totalPlayTime.toLocaleString()}h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 历史数据 */}
        {historyData && (
          <div className="space-y-8">
            {/* 近7日趋势 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
                近7日结算趋势
              </h2>
              <div className="space-y-4">
                {historyData.last7Days.map((day, index) => (
                  <div key={day.date} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        {new Date(day.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex gap-4 text-xs">
                        <span className="text-purple-600">算力: {day.totalDailyComputingPower.toLocaleString()}</span>
                        <span className="text-amber-600">游戏币: {day.totalDailyGameCoinsDistributed.toLocaleString()}</span>
                        <span className="text-indigo-600">A币: {day.totalDailyACoinDistributed.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-3">
                      <div 
                        className="bg-purple-500 rounded-sm"
                        style={{ 
                          width: `${Math.max(5, (day.totalDailyComputingPower / Math.max(...historyData.last7Days.map(d => d.totalDailyComputingPower))) * 30)}%` 
                        }}
                        title={`算力: ${day.totalDailyComputingPower.toLocaleString()}`}
                      ></div>
                      <div 
                        className="bg-amber-500 rounded-sm"
                        style={{ 
                          width: `${Math.max(5, (day.totalDailyGameCoinsDistributed / Math.max(...historyData.last7Days.map(d => d.totalDailyGameCoinsDistributed))) * 30)}%` 
                        }}
                        title={`游戏币: ${day.totalDailyGameCoinsDistributed.toLocaleString()}`}
                      ></div>
                      <div 
                        className="bg-indigo-500 rounded-sm"
                        style={{ 
                          width: `${Math.max(2, (day.totalDailyACoinDistributed / Math.max(...historyData.last7Days.map(d => d.totalDailyACoinDistributed))) * 20)}%` 
                        }}
                        title={`A币: ${day.totalDailyACoinDistributed.toFixed(2)}`}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                      <span>活跃玩家: {day.activePlayers.toLocaleString()}人</span>
                      <span>经济健康指数: {day.economicHealthIndex}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 月度汇总 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
                月度汇总数据
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {historyData.monthlyAggregates.map((month, index) => (
                  <div key={month.month} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                      {month.month}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">总算力</span>
                        <span className="font-bold">{month.totalComputingPower.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">游戏币发放</span>
                        <span className="font-bold">{month.totalGameCoinsDistributed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">A币发放</span>
                        <span className="font-bold text-purple-600">{month.totalACoinDistributed.toFixed(2)} A币</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">平均活跃</span>
                        <span className="font-bold">{month.averageActivePlayers.toLocaleString()}人</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">平台收入</span>
                        <span className="font-bold">¥{month.totalPlatformIncome.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
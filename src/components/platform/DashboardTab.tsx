import React from 'react';
import { usePlatformManagement } from '@/contexts/PlatformManagementContext';

// 数据概览选项卡
const DashboardTab: React.FC = () => {
  const { keyData, refreshKeyData, loading } = usePlatformManagement();

  if (loading || !keyData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 刷新按钮 */}
      <div className="flex justify-end">
        <button
          onClick={() => refreshKeyData()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>🔄</span>
          刷新数据
        </button>
      </div>

      {/* 主要指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">A币余额</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {keyData.aCoinBalance.toLocaleString()} A币
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🅰️</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">O币余额</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {keyData.oCoinBalance.toLocaleString()} O币
              </p>
              <p className="text-xs text-slate-500">价格: ¥{keyData.oCoinPrice.toFixed(4)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🅾️</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">全网算力</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {keyData.totalComputingPower.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">活跃玩家</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {keyData.playerCount.active.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">总计: {keyData.playerCount.total.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>
      </div>

      {/* 收入支出数据 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">收入统计</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">今日收入</span>
              <span className="font-medium text-green-600">¥{keyData.income.daily.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">本周收入</span>
              <span className="font-medium text-green-600">¥{keyData.income.weekly.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">本月收入</span>
              <span className="font-medium text-green-600">¥{keyData.income.monthly.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-800 dark:text-slate-200 font-medium">总收入</span>
              <span className="font-bold text-green-600">¥{keyData.income.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">支出统计</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">今日支出</span>
              <span className="font-medium text-red-600">¥{keyData.expenses.daily.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">本周支出</span>
              <span className="font-medium text-red-600">¥{keyData.expenses.weekly.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">本月支出</span>
              <span className="font-medium text-red-600">¥{keyData.expenses.monthly.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-800 dark:text-slate-200 font-medium">总支出</span>
              <span className="font-bold text-red-600">¥{keyData.expenses.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 游戏数据 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">游戏数据</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">游戏次数</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {keyData.gameData.gamesPlayed.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">平均分数</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {keyData.gameData.averageScore.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">游戏币发放</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {keyData.gameData.totalGameCoinsDistributed.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 玩家数据 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">玩家数据</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">活跃玩家</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {keyData.playerCount.active.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">总玩家数</div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {keyData.playerCount.total.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">今日新增</div>
            <div className="text-xl font-bold text-green-600">
              +{keyData.playerCount.newToday.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">本周新增</div>
            <div className="text-xl font-bold text-green-600">
              +{keyData.playerCount.newThisWeek.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 最后更新时间 */}
      <div className="text-right text-sm text-slate-500 dark:text-slate-400">
        最后更新: {new Date(keyData.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

export default DashboardTab;
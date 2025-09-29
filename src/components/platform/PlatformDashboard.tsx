import React from 'react';
import { PlatformData } from '@/types/platformManagement';

interface PlatformDashboardProps {
  platformData: PlatformData | null;
  loading: boolean;
}

/**
 * 平台数据仪表盘组件
 */
const PlatformDashboard: React.FC<PlatformDashboardProps> = ({ platformData, loading }) => {
  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }
  
  if (!platformData) {
    return <div className="text-center py-8">暂无平台数据</div>;
  }
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };
  
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(num);
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">平台数据概览</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* A币数据 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-2">A币数据</h3>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {formatNumber(platformData.acoinBalance)}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">总流通量</p>
        </div>
        
        {/* O币数据 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-2">O币数据</h3>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
            {formatNumber(platformData.ocoinBalance)}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">总流通量</p>
          <div className="mt-2">
            <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              ¥{platformData.ocoinPrice.toFixed(2)}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">当前价格</span>
          </div>
        </div>
        
        {/* 算力数据 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-2">全网算力</h3>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {formatNumber(platformData.totalComputingPower)}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">算力单位</p>
        </div>
        
        {/* 收入支出 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-2">收入支出</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">日收入</span>
            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(platformData.dailyIncome)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">日支出</span>
            <span className="text-lg font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(platformData.dailyExpense)}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 dark:text-slate-400">净收入</span>
              <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(platformData.dailyIncome - platformData.dailyExpense)}
              </span>
            </div>
          </div>
        </div>
        
        {/* 用户数据 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-2">用户数据</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">活跃用户</span>
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {formatNumber(platformData.activeUsers)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">新增用户</span>
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {formatNumber(platformData.newUsers)}
            </span>
          </div>
        </div>
      </div>
      
      {/* 游戏数据 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 p-6 pb-4">游戏数据</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  游戏名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  活跃用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  日收入
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  算力贡献
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {platformData.gameData.map(game => (
                <tr key={game.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                    {game.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                    {formatNumber(game.activeUsers)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                    {formatCurrency(game.dailyRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                    {formatNumber(game.computingPowerGenerated)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="text-right text-xs text-slate-500 dark:text-slate-400 mt-4">
        最后更新时间: {platformData.updatedAt.toLocaleString()}
      </div>
    </div>
  );
};

export default PlatformDashboard;
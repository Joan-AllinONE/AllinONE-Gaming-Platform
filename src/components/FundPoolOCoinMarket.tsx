import React, { useState, useEffect } from 'react';
import oCoinService from '@/services/oCoinService';
import optionsManagementService from '@/services/optionsManagementService';
import { OCoinMarketData as IOCoinMarketData } from '@/types/oCoin';

interface FundPoolOCoinMarketProps {
  className?: string;
}

/**
 * O币市场数据组件 - 资金池专用
 * 专注于记录和显示O币的市场状态、分红和供应情况
 */
const FundPoolOCoinMarket: React.FC<FundPoolOCoinMarketProps> = ({ className = '' }) => {
  const [marketData, setMarketData] = useState<IOCoinMarketData>({
    currentPrice: 0,
    circulatingSupply: 0,
    totalSupply: 1000000000,
    totalDistributed: 0,
    totalLocked: 0,
    marketCap: 0,
    priceHistory: [],
    dividendPool: 0,
    lastDividendDate: null,
    lastDividendPerCoin: 0,
    allTimeHigh: 0,
    allTimeLow: 0,
    lastUpdated: new Date()
  });
  
  const [fundPoolData, setFundPoolData] = useState({
    totalLockedOCoins: 0,
    totalUnlockedOCoins: 0,
    lastUpdated: new Date()
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketData();
    const interval = setInterval(loadMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      const data = await oCoinService.getOCoinMarketData();
      setMarketData({
        ...data,
        lastUpdated: new Date(data.lastUpdated),
        lastDividendDate: data.lastDividendDate ? new Date(data.lastDividendDate) : null
      });
      const poolData = optionsManagementService.getFundPoolOCoinData();
      setFundPoolData({
        ...poolData,
        lastUpdated: new Date(poolData.lastUpdated)
      });
    } catch (error) {
      console.error('加载O币市场数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-orange-600 dark:text-orange-400">加载O币市场数据...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="text-2xl mr-3">🔶</div>
          <div>
            <h3 className="text-xl font-bold text-orange-800 dark:text-orange-400">O币市场数据</h3>
            <p className="text-sm text-orange-600 dark:text-orange-500">
              实时市场价格、分红信息与供应统计
            </p>
          </div>
        </div>
        <button
          onClick={loadMarketData}
          className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
        >
          🔄 刷新
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">当前价格</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            ¥{marketData.currentPrice.toFixed(2)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">市值</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            ¥{(marketData.marketCap / 100000000).toFixed(2)}亿
          </div>
        </div>
        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">分红池</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            ¥{marketData.dividendPool.toLocaleString()}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">历史最高</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ¥{marketData.allTimeHigh.toFixed(2)}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-slate-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">供应情况</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                <span>总供应量</span>
                <span>{(marketData.totalSupply / 100000000).toFixed(1)}亿枚</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-600 h-2 rounded-full">
                <div className="bg-orange-500 h-2 rounded-full" style={{width: '100%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                <span>流通量</span>
                <span>{(marketData.circulatingSupply / 100000000).toFixed(2)}亿枚 ({(marketData.circulatingSupply / marketData.totalSupply * 100).toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-600 h-2 rounded-full">
                <div className="bg-blue-500 h-2 rounded-full" style={{width: `${(marketData.circulatingSupply / marketData.totalSupply) * 100}%`}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                <span>锁定量</span>
                <span>{(marketData.totalLocked / 100000000).toFixed(2)}亿枚 ({(marketData.totalLocked / marketData.totalSupply * 100).toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-600 h-2 rounded-full">
                <div className="bg-purple-500 h-2 rounded-full" style={{width: `${(marketData.totalLocked / marketData.totalSupply) * 100}%`}}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">资金池O币</h4>
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">未解禁O币</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {fundPoolData.totalLockedOCoins.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">已解禁O币</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {fundPoolData.totalUnlockedOCoins.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">分红情况</h4>
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">当前分红池</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  ¥{marketData.dividendPool.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">上次分红日期</span>
                <span className="text-sm font-medium">
                  {marketData.lastDividendDate ? new Date(marketData.lastDividendDate).toLocaleDateString() : '暂无'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">上次每币分红</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  ¥{marketData.lastDividendPerCoin.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
        最后更新: {marketData.lastUpdated.toLocaleString()}
      </div>
    </div>
  );
};

export default FundPoolOCoinMarket;
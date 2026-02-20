import React, { useState, useEffect } from 'react';
import oCoinService from '@/services/oCoinService';
import { OCoinMarketData as IOCoinMarketData } from '@/types/oCoin';

interface ComputingOCoinAnalyticsProps {
  className?: string;
}

/**
 * O币市场分析组件 - 算力中心专用
 * 专注于O币市场的统计分析和数据可视化
 */
const ComputingOCoinAnalytics: React.FC<ComputingOCoinAnalyticsProps> = ({ className = '' }) => {
  const [marketData, setMarketData] = useState<IOCoinMarketData | null>(null);
  const [loading, setLoading] = useState(true);

  // 模拟额外的分析数据
  const [analyticsData, setAnalyticsData] = useState({
    tradingVolume24h: 0,
    volatility: 0,
    holderDistribution: [] as { range: string; percentage: number; color: string }[],
  });

  useEffect(() => {
    oCoinService.initializeOCoin();
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await oCoinService.getOCoinMarketData();
      setMarketData(data);

      // 生成模拟分析数据
      setAnalyticsData({
        tradingVolume24h: (data.marketCap / 100) * (Math.random() * 5 + 1), // 交易量为市值的1-6%
        volatility: Math.random() * 5 + 0.5, // 波动率 0.5% - 5.5%
        holderDistribution: [
          { range: '1,000,000+', percentage: 45, color: 'bg-purple-600' },
          { range: '100,000 - 1M', percentage: 25, color: 'bg-purple-500' },
          { range: '10,000 - 100k', percentage: 15, color: 'bg-purple-400' },
          { range: '1,000 - 10k', percentage: 10, color: 'bg-purple-300' },
          { range: '< 1,000', percentage: 5, color: 'bg-purple-200' },
        ],
      });
    } catch (error) {
      console.error('加载O币市场分析数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !marketData) {
    return (
      <div className={`bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-orange-600 dark:text-orange-400">加载O币市场分析...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="text-2xl mr-3">📈</div>
          <div>
            <h3 className="text-xl font-bold text-orange-800 dark:text-orange-400">O币市场分析</h3>
            <p className="text-sm text-orange-600 dark:text-orange-500">
              关键指标、交易活动与持仓分析
            </p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
        >
          🔄 刷新
        </button>
      </div>

      {/* 关键分析指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">当前价格</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            ¥{marketData.currentPrice.toFixed(2)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">24h交易量</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ¥{(analyticsData.tradingVolume24h / 10000).toFixed(2)}万
          </div>
        </div>
        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">市值</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            ¥{(marketData.marketCap / 100000000).toFixed(2)}亿
          </div>
        </div>
        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">24h波动率</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {analyticsData.volatility.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* 图表分析 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 价格历史 (简易图表) */}
        <div className="bg-white dark:bg-slate-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">价格趋势 (模拟)</h4>
          <div className="h-40 flex items-end space-x-1">
            {(() => {
              const displayedHistory = marketData.priceHistory.slice(-30);
              if (displayedHistory.length === 0) return null;

              const minPrice = Math.min(...displayedHistory.map(p => p.price));
              const maxPrice = Math.max(...displayedHistory.map(p => p.price));
              const priceRange = maxPrice - minPrice;

              const minIndex = displayedHistory.findIndex(p => p.price === minPrice);
              const maxIndex = displayedHistory.findIndex(p => p.price === maxPrice);

              return displayedHistory.map((p, i) => {
                const heightPercentage = priceRange > 0.00001 ? 10 + ((p.price - minPrice) / priceRange) * 90 : 50;
                
                let label = null;
                if (i === minIndex && i === maxIndex) {
                    // Min and max are the same point
                    label = (
                        <div className={`absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold z-10 text-purple-600`}>
                            ¥{p.price.toFixed(4)}
                        </div>
                    );
                } else if (i === minIndex) {
                    let positionClass = 'left-1/2 -translate-x-1/2';
                    // If too close to max, adjust position
                    if (Math.abs(minIndex - maxIndex) < 4) {
                        positionClass = minIndex < maxIndex ? 'right-0' : 'left-0';
                    }
                    label = (
                        <div className={`absolute -top-5 ${positionClass} text-xs font-bold z-10 text-red-600`}>
                            ¥{p.price.toFixed(4)}
                        </div>
                    );
                } else if (i === maxIndex) {
                    let positionClass = 'left-1/2 -translate-x-1/2';
                    // If too close to min, adjust position
                    if (Math.abs(maxIndex - minIndex) < 4) {
                        positionClass = maxIndex < minIndex ? 'right-0' : 'left-0';
                    }
                    label = (
                        <div className={`absolute -top-5 ${positionClass} text-xs font-bold z-10 text-green-600`}>
                            ¥{p.price.toFixed(4)}
                        </div>
                    );
                }

                return (
                    <div key={i} className="flex-1 bg-orange-400 rounded-t group relative" style={{ height: `${heightPercentage}%` }}>
                        {label}
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none left-1/2 -translate-x-1/2">
                            ¥{p.price.toFixed(4)}
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-t-4 border-t-slate-800 border-l-4 border-l-transparent border-r-4 border-r-transparent"></div>
                        </div>
                    </div>
                );
              });
            })()}
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span>30天前</span>
            <span>今天</span>
          </div>
        </div>

        {/* 持有者分布 */}
        <div className="bg-white dark:bg-slate-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">持有者分布</h4>
          <div className="space-y-3">
            {analyticsData.holderDistribution.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                  <span>{item.range} O币</span>
                  <span>{item.percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-600 h-3 rounded-full">
                  <div className={`${item.color} h-3 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComputingOCoinAnalytics;
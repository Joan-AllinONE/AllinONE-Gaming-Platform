import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { databaseService } from '@/services/database';
import { marketplaceService } from '@/services/marketplaceService';
import { GameRecord, ComputingPowerStats, UserProfile, Achievement } from '@/types/computing';
import { MarketItem, Transaction } from '@/types/marketplace';

interface ComputingPowerData {
  user: UserProfile;
  stats: ComputingPowerStats;
  recentGames: GameRecord[];
  achievements: Achievement[];
}

export default function ComputingPowerPage() {
  const [data, setData] = useState<ComputingPowerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'games' | 'achievements' | 'leaderboard' | 'inventory' | 'listings'>('overview');
  const [selectedTransactionTab, setSelectedTransactionTab] = useState<'listings' | 'purchases' | 'sales'>('listings');
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userInventory, setUserInventory] = useState<MarketItem[]>([]);
  const [userTransactions, setUserTransactions] = useState<{
    purchases: Transaction[];
    sales: Transaction[];
    listings: MarketItem[];
  }>({ purchases: [], sales: [], listings: [] });

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData, history, rankings, inventory, transactions] = await Promise.all([
          databaseService.getUserComputingData(),
          databaseService.getGameHistory(),
          databaseService.getLeaderboard(),
          loadUserInventory(),
          loadUserTransactions()
        ]);
        
        setData(userData);
        setGameHistory(history);
        setLeaderboard(rankings);
        setUserInventory(inventory);
        setUserTransactions(transactions);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // 设置定时刷新，每5秒检查一次数据更新
    const interval = setInterval(loadData, 5000);
    
    // 监听页面焦点，当页面重新获得焦点时刷新数据
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 加载用户道具库存
  const loadUserInventory = async (): Promise<MarketItem[]> => {
    try {
      const currentUserId = 'current-user-id';
      const inventory = await marketplaceService.getUserInventory(currentUserId);
      
      if (inventory.length === 0) {
        const initialItems: MarketItem[] = [
          {
            id: 'starter_1',
            name: '新手之剑',
            description: '适合新手使用的基础武器，攻击力+15',
            category: 'weapon',
            rarity: 'common',
            price: 0,
            sellerId: '',
            sellerName: '',
            listedAt: new Date(Date.now() - 86400000 * 3),
            views: 0,
            gameSource: '系统赠送'
          },
          {
            id: 'starter_2',
            name: '生命药水',
            description: '恢复50点生命值的药水',
            category: 'consumable',
            rarity: 'common',
            price: 0,
            sellerId: '',
            sellerName: '',
            listedAt: new Date(Date.now() - 86400000 * 2),
            views: 0,
            gameSource: '系统赠送'
          },
          {
            id: 'starter_3',
            name: '幸运护符',
            description: '增加幸运值的神秘护符',
            category: 'accessory',
            rarity: 'rare',
            price: 0,
            sellerId: '',
            sellerName: '',
            listedAt: new Date(Date.now() - 86400000 * 1),
            views: 0,
            gameSource: '任务奖励'
          }
        ];

        for (const item of initialItems) {
          await marketplaceService.addItemToUserInventory(currentUserId, item);
        }

        return initialItems;
      }

      return inventory;
    } catch (error) {
      console.error('加载用户库存失败:', error);
      return [];
    }
  };

  // 加载用户完整交易记录
  const loadUserTransactions = async (): Promise<{
    purchases: Transaction[];
    sales: Transaction[];
    listings: MarketItem[];
  }> => {
    try {
      const currentUserId = 'current-user-id';
      const transactions = await marketplaceService.getUserTransactionHistory(currentUserId);
      return transactions;
    } catch (error) {
      console.error('加载用户交易记录失败:', error);
      return { purchases: [], sales: [], listings: [] };
    }
  };

  // 处理上架道具到交易市场
  const handleSellItem = async (itemId: string) => {
    try {
      const currentUserId = 'current-user-id';
      const item = userInventory.find(i => i.id === itemId);
      
      if (!item) {
        alert('道具不存在');
        return;
      }

      const priceInput = prompt(`请设置 "${item.name}" 的售价（算力）:`, '100');
      if (!priceInput || isNaN(Number(priceInput)) || Number(priceInput) <= 0) {
        alert('请输入有效的价格');
        return;
      }

      const price = Number(priceInput);
      const confirmMessage = `确认将 "${item.name}" 上架到交易市场？\n\n售价: ${price.toLocaleString()} 算力\n稀有度: ${item.rarity}\n\n上架后道具将从您的库存中移除。`;
      
      if (!confirm(confirmMessage)) {
        return;
      }

      await marketplaceService.sellItem(currentUserId, itemId, price);
      
      const updatedInventory = userInventory.filter(i => i.id !== itemId);
      setUserInventory(updatedInventory);
      
      const updatedTransactions = await loadUserTransactions();
      setUserTransactions(updatedTransactions);
      
      alert('道具已成功上架到交易市场！');
    } catch (error) {
      console.error('上架道具失败:', error);
      alert('上架失败，请稍后重试');
    }
  };

  // 处理下架道具
  const handleDelistItem = async (itemId: string) => {
    try {
      const currentUserId = 'current-user-id';
      const item = userTransactions.listings.find(i => i.id === itemId);
      
      if (!item) {
        alert('商品不存在');
        return;
      }

      if (!confirm(`确认下架 "${item.name}"？\n\n下架后商品将返回您的库存。`)) {
        return;
      }

      await marketplaceService.delistItem(currentUserId, itemId);
      
      const updatedTransactions = await loadUserTransactions();
      setUserTransactions(updatedTransactions);
      
      const updatedInventory = await loadUserInventory();
      setUserInventory(updatedInventory);
      
      alert('商品已成功下架并返回库存！');
    } catch (error) {
      console.error('下架商品失败:', error);
      alert('下架失败，请稍后重试');
    }
  };

  // 处理修改价格
  const handleUpdatePrice = async (itemId: string) => {
    try {
      const currentUserId = 'current-user-id';
      const item = userTransactions.listings.find(i => i.id === itemId);
      
      if (!item) {
        alert('商品不存在');
        return;
      }

      const newPriceInput = prompt(`请输入 "${item.name}" 的新售价（算力）:`, item.price.toString());
      if (!newPriceInput || isNaN(Number(newPriceInput)) || Number(newPriceInput) <= 0) {
        alert('请输入有效的价格');
        return;
      }

      const newPrice = Number(newPriceInput);
      if (newPrice === item.price) {
        alert('价格未发生变化');
        return;
      }

      if (!confirm(`确认将 "${item.name}" 的价格从 ${item.price.toLocaleString()} 算力修改为 ${newPrice.toLocaleString()} 算力？`)) {
        return;
      }

      await marketplaceService.updateItemPrice(currentUserId, itemId, newPrice);
      
      const updatedTransactions = await loadUserTransactions();
      setUserTransactions(updatedTransactions);
      
      alert('价格修改成功！');
    } catch (error) {
      console.error('修改价格失败:', error);
      alert('修改价格失败，请稍后重试');
    }
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // 获取排名颜色
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-slate-500 text-white';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">数据加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* 用户信息卡片 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{data.user.username.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{data.user.username}</h1>
                <p className="text-slate-600 dark:text-slate-400">算力大师 • 等级 {data.user.level}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {data.stats.totalComputingPower.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">总算力</div>
            </div>
          </div>
        </div>

        {/* 导航标签 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md mb-8">
          <div className="flex overflow-x-auto">
            {[
              { key: 'overview', label: '概览', icon: 'fa-solid fa-chart-line' },
              { key: 'games', label: '游戏记录', icon: 'fa-solid fa-gamepad' },
              { key: 'inventory', label: '我的道具', icon: 'fa-solid fa-backpack' },
              { key: 'listings', label: '我的交易', icon: 'fa-solid fa-store' },
              { key: 'achievements', label: '成就系统', icon: 'fa-solid fa-trophy' },
              { key: 'leaderboard', label: '排行榜', icon: 'fa-solid fa-ranking-star' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`flex-1 min-w-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
          <div className="space-y-6">
            {selectedTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">今日算力</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {data.stats.dailyComputingPower.toLocaleString()}
                      </p>
                    </div>
                    <i className="fa-solid fa-bolt text-2xl text-blue-500"></i>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">游戏币</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {data.user.gameCoins.toLocaleString()}
                      </p>
                    </div>
                    <i className="fa-solid fa-coins text-2xl text-green-500"></i>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">游戏次数</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {data.stats.totalGames}
                      </p>
                    </div>
                    <i className="fa-solid fa-gamepad text-2xl text-purple-500"></i>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">胜率</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {((data.stats.wins / data.stats.totalGames) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <i className="fa-solid fa-trophy text-2xl text-orange-500"></i>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'games' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">游戏记录</h3>
                <div className="space-y-3">
                  {gameHistory.map((game, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          game.result === 'win' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          <i className={`fa-solid ${game.result === 'win' ? 'fa-trophy' : 'fa-times'}`}></i>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{game.gameName}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {formatDate(game.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-white">
                          +{game.computingPowerEarned.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">算力</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'inventory' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">我的道具</h3>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    共 {userInventory.length} 件道具
                  </div>
                </div>
                
                {userInventory.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userInventory.map((item) => (
                      <div key={item.id} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center">
                            <i className="fa-solid fa-gem text-blue-600 dark:text-blue-300"></i>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white">{item.name}</h4>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              item.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-300' :
                              item.rarity === 'epic' ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-300' :
                              item.rarity === 'rare' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}>
                              {item.rarity}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {item.description}
                        </p>
                        
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                          来源: {item.gameSource}
                        </div>
                        
                        <button
                          onClick={() => handleSellItem(item.id)}
                          className="w-full px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <i className="fa-solid fa-store mr-1"></i>
                          上架到交易市场
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                      <i className="fa-solid fa-backpack text-2xl text-slate-400"></i>
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">暂无道具</h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      通过游戏获得道具，或前往交易市场购买
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'listings' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">我的交易</h3>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    总计 {userTransactions.listings.length + userTransactions.purchases.length + userTransactions.sales.length} 条记录
                  </div>
                </div>
                
                {/* 交易子标签 */}
                <div className="flex space-x-1 mb-6 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                  {[
                    { key: 'listings', label: `在售商品 (${userTransactions.listings.length})`, icon: 'fa-store' },
                    { key: 'purchases', label: `购买记录 (${userTransactions.purchases.length})`, icon: 'fa-shopping-cart' },
                    { key: 'sales', label: `销售记录 (${userTransactions.sales.length})`, icon: 'fa-coins' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedTransactionTab(tab.key as 'listings' | 'purchases' | 'sales')}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        selectedTransactionTab === tab.key
                          ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <i className={`fa-solid ${tab.icon} mr-2`}></i>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* 在售商品标签页 */}
                {selectedTransactionTab === 'listings' && (
                  <div>
                    {userTransactions.listings.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {userTransactions.listings.map((item) => (
                          <div key={item.id} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border-l-4 border-green-500">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-100 to-green-200 dark:from-green-600 dark:to-green-700 flex items-center justify-center">
                                <i className="fa-solid fa-store text-green-600 dark:text-green-300"></i>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900 dark:text-white">{item.name}</h4>
                                <div className="flex items-center gap-2">
                                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-300">
                                    {item.rarity}
                                  </span>
                                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-300">
                                    在售
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                              {item.description}
                            </p>
                            
                            <div className="bg-slate-100 dark:bg-slate-600 rounded-lg p-3 mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">售价</span>
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                  {item.price.toLocaleString()} 算力
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span>上架时间: {formatDate(item.listedAt)}</span>
                                <span>浏览: {item.views} 次</span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdatePrice(item.id)}
                                className="flex-1 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <i className="fa-solid fa-edit mr-1"></i>
                                改价
                              </button>
                              <button
                                onClick={() => handleDelistItem(item.id)}
                                className="flex-1 px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              >
                                <i className="fa-solid fa-arrow-down mr-1"></i>
                                下架
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                          <i className="fa-solid fa-store text-2xl text-slate-400"></i>
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">暂无上架商品</h4>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                          您还没有上架任何商品到交易市场
                        </p>
                        <button
                          onClick={() => setSelectedTab('inventory')}
                          className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          前往我的道具
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 购买记录标签页 */}
                {selectedTransactionTab === 'purchases' && (
                  <div>
                    {userTransactions.purchases.length > 0 ? (
                      <div className="space-y-4">
                        {userTransactions.purchases.map((transaction) => (
                          <div key={transaction.id} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border-l-4 border-blue-500">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center">
                                  <i className="fa-solid fa-shopping-cart text-blue-600 dark:text-blue-300"></i>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-slate-900 dark:text-white">{transaction.item.name}</h4>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">{transaction.item.description}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                  -{transaction.price.toLocaleString()} 算力
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatDate(transaction.timestamp)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">交易ID: {transaction.id}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                transaction.item.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-300' :
                                transaction.item.rarity === 'epic' ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-300' :
                                transaction.item.rarity === 'rare' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                              }`}>
                                {transaction.item.rarity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                          <i className="fa-solid fa-shopping-cart text-2xl text-slate-400"></i>
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">暂无购买记录</h4>
                        <p className="text-slate-600 dark:text-slate-400">您还没有购买过任何商品</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 销售记录标签页 */}
                {selectedTransactionTab === 'sales' && (
                  <div>
                    {userTransactions.sales.length > 0 ? (
                      <div className="space-y-4">
                        {userTransactions.sales.map((transaction) => (
                          <div key={transaction.id} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border-l-4 border-yellow-500">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-600 dark:to-yellow-700 flex items-center justify-center">
                                  <i className="fa-solid fa-coins text-yellow-600 dark:text-yellow-300"></i>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-slate-900 dark:text-white">{transaction.item.name}</h4>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">{transaction.item.description}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                  +{transaction.price.toLocaleString()} 算力
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatDate(transaction.timestamp)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">交易ID: {transaction.id}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                transaction.item.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-300' :
                                transaction.item.rarity === 'epic' ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-300' :
                                transaction.item.rarity === 'rare' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                              }`}>
                                {transaction.item.rarity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                          <i className="fa-solid fa-coins text-2xl text-slate-400"></i>
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">暂无销售记录</h4>
                        <p className="text-slate-600 dark:text-slate-400">您还没有成功销售过任何商品</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'achievements' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">成就系统</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.achievements.map((achievement) => (
                    <div key={achievement.id} className={`p-4 rounded-lg border-2 ${
                      achievement.unlockedAt 
                        ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' 
                        : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                    }`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          achievement.unlockedAt 
                            ? 'bg-green-100 dark:bg-green-900/50' 
                            : 'bg-slate-100 dark:bg-slate-600'
                        }`}>
                          <i className={`${achievement.icon} ${
                            achievement.unlockedAt 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-slate-400'
                          }`}></i>
                        </div>
                        <div>
                          <div className={`font-semibold ${
                            achievement.unlockedAt 
                              ? 'text-green-900 dark:text-green-100' 
                              : 'text-slate-900 dark:text-white'
                          }`}>
                            {achievement.name}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-300">
                            {achievement.description}
                          </div>
                        </div>
                      </div>
                      
                      {achievement.maxProgress && achievement.maxProgress > 1 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                            <span>进度</span>
                            <span>{achievement.progress || 0} / {achievement.maxProgress}</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                achievement.unlockedAt 
                                  ? 'bg-green-500' 
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(((achievement.progress || 0) / achievement.maxProgress) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {achievement.unlockedAt && (
                        <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                          <i className="fa-solid fa-check mr-1"></i>
                          已于 {formatDate(achievement.unlockedAt)} 解锁
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'leaderboard' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">算力排行榜</h3>
                <div className="space-y-3">
                  {leaderboard.map((player, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getRankColor(player.rank)}`}>
                          #{player.rank}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{player.username}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">算力大师</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-white">{player.totalComputingPower.toLocaleString()}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">算力</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 全网算力数据展示 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="fa-solid fa-globe text-blue-600 dark:text-blue-400"></i>
            全网算力数据
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">2,847,392</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">全网总算力</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">15,847</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">在线用户</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">98.7%</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">网络稳定性</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
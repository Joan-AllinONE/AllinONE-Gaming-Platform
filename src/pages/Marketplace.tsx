import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marketplaceService } from '@/services/marketplaceService';
import { allinone_marketplaceService } from '@/services/allinone_marketplaceService';
import { MarketItem, MarketStats } from '@/types/marketplace';
import { useWallet } from '@/hooks/useWallet';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDict, t } from '@/utils/i18n';



export default function Marketplace() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGameSource, setSelectedGameSource] = useState<'all' | 'allinone' | 'newday'>('all');
  const [sortBy, setSortBy] = useState<'price' | 'date' | 'popularity'>('date');
  const [showListingModal, setShowListingModal] = useState(false);
  const [userInventory, setUserInventory] = useState<MarketItem[]>([]);
  const [showGameCoinsDropdown, setShowGameCoinsDropdown] = useState(false);

  const { balance: userWallet, refreshWalletData } = useWallet();
  const { lang } = useLanguage();
  const dict = getDict(lang);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载跨平台市场数据
        const allItems = await allinone_marketplaceService.getAllMarketItems();
        setItems(allItems);
        
        const marketStats = await allinone_marketplaceService.getMarketStats();
        setStats(marketStats);
        
        // 加载完整的用户库存
        await loadUserInventoryForPublish();
        
        // 刷新钱包数据
        await refreshWalletData();
      } catch (error) {
        console.error('加载市场数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000); // 每10秒更新一次

    return () => clearInterval(interval);
  }, [refreshWalletData]);

  // 加载用户库存用于发布商品
  const loadUserInventoryForPublish = async () => {
    try {
      const currentUserId = 'current-user-id';
      // 获取用户完整库存
      let inventory = await marketplaceService.getUserInventory(currentUserId);
      
      // 如果库存为空，添加一些初始道具
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
            listedAt: new Date(Date.now() - 86400000 * 1),
            views: 0,
            gameSource: '系统赠送'
          }
        ];
        inventory = initialItems;
        
        // 将初始道具保存到用户库存中
        for (const item of initialItems) {
          await marketplaceService.addItemToUserInventory(currentUserId, item);
        }
      }
      
      setUserInventory(inventory);
    } catch (error) {
      console.error('加载用户库存失败:', error);
    }
  };



  const handlePurchase = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item || !userWallet) return;

    const currency = item.currency || 'computingPower';
    const currencyNames = {
      computing: t(dict, 'marketplace.list.currencyNames.computing'),
      computingPower: t(dict, 'marketplace.list.currencyNames.computing'),
      cash: t(dict, 'marketplace.list.currencyNames.cash'),
      gameCoins: t(dict, 'marketplace.list.currencyNames.gameCoins'),
      aCoins: t(dict, 'marketplace.list.currencyNames.aCoins'),
      oCoins: t(dict, 'marketplace.list.currencyNames.oCoins'),
      newDayGameCoins: 'New Day 游戏币'
    };

    // 计算佣金（玩家交易市场 1%）
    const commission = Math.round(item.price * 0.01 * 100) / 100;
    const totalAmount = Math.round((item.price + commission) * 100) / 100;

    // 检查对应货币余额是否足够（需要支付总金额）
    let hasEnoughBalance = false;
    let currentBalance = 0;

    switch (currency) {
      case 'gameCoins':
        hasEnoughBalance = userWallet.gameCoins >= totalAmount;
        currentBalance = userWallet.gameCoins;
        break;
      case 'computingPower':
        hasEnoughBalance = userWallet.computingPower >= totalAmount;
        currentBalance = userWallet.computingPower;
        break;
      case 'cash':
        hasEnoughBalance = userWallet.cash >= totalAmount;
        currentBalance = userWallet.cash;
        break;
      case 'aCoins':
        hasEnoughBalance = userWallet.aCoins >= totalAmount;
        currentBalance = userWallet.aCoins;
        break;
      case 'newDayGameCoins':
        hasEnoughBalance = (userWallet.newDayGameCoins || 0) >= totalAmount;
        currentBalance = userWallet.newDayGameCoins || 0;
        break;
      case 'oCoins':
        hasEnoughBalance = (userWallet.oCoins || 0) >= totalAmount;
        currentBalance = userWallet.oCoins || 0;
        break;
    }

    if (!hasEnoughBalance) {
      alert(`余额不足！\n\n商品价格: ${item.price.toLocaleString()} ${currencyNames[currency]}\n平台佣金: ${commission.toLocaleString()} ${currencyNames[currency]} (1%)\n实际需要: ${totalAmount.toLocaleString()} ${currencyNames[currency]}\n\n当前${currencyNames[currency]}余额: ${currentBalance.toLocaleString()}`);
      return;
    }

    const sourceText = item.gameSource === 'newday' ? '来自 New Day 游戏' : '来自 AllinONE';
    const confirmMessage = `确认购买 "${item.name}"？\n\n${sourceText}\n商品价格: ${item.price.toLocaleString()} ${currencyNames[currency]}\n平台佣金: ${commission.toLocaleString()} ${currencyNames[currency]} (1%)\n实际支付: ${totalAmount.toLocaleString()} ${currencyNames[currency]}\n稀有度: ${item.rarity}\n\n购买后道具将添加到您的库存中。`;
    
    if (!confirm(confirmMessage)) return;

    try {
      // 检查是否为跨平台道具
      if (item.gameSource === 'newday') {
        // 使用跨平台市场服务购买 New Day 道具
        const result = await allinone_marketplaceService.purchaseFromCrossPlatform(
          itemId,
          currency as any
        );
        
        if (!result) {
          alert('购买失败，请稍后重试');
          return;
        }

        // 购买 New Day 道具后，需要同步到 New Day 库存
        // 注意：New Day API 可能没有添加道具的接口，这里需要确认
        // 暂时只在前端显示，等待 New Day API 支持
        console.log('✅ 购买 New Day 道具成功，需要同步到 New Day 库存:', item.name);
      } else {
        // 使用本地市场服务购买 AllinONE 道具
        await marketplaceService.purchaseItem(itemId, 'current-user-id');
      }
      
      // 刷新钱包数据
      await refreshWalletData();
      
      // 重新加载市场数据
      const marketItems = await allinone_marketplaceService.getAllMarketItems();
      setItems(marketItems);
      
      // 触发库存更新事件，通知相关组件刷新
      window.dispatchEvent(new CustomEvent('inventoryUpdated', {
        detail: { source: 'purchase', itemId: itemId }
      }));
      
      alert(`购买成功！\n\n"${item.name}" 已添加到您的库存中，可在个人中心查看。\n\n费用明细:\n商品价格: ${item.price.toLocaleString()} ${currencyNames[currency]}\n平台佣金: ${commission.toLocaleString()} ${currencyNames[currency]}\n实际支付: ${totalAmount.toLocaleString()} ${currencyNames[currency]}`);
    } catch (error) {
      console.error('购买失败:', error);
      alert('购买失败，请稍后重试');
    }
  };

  // 发布商品处理函数
  const handleListItem = async (itemId: string, price: number, currency: 'computingPower' | 'cash' | 'gameCoins' | 'newDayGameCoins' | 'aCoins') => {
    try {
      const item = userInventory.find(i => i.id === itemId);
      if (!item) {
        alert('道具不存在');
        return;
      }

      const currencyNames = {
        computing: t(dict, 'marketplace.list.currencyNames.computing'),
        computingPower: t(dict, 'marketplace.list.currencyNames.computing'),
        cash: t(dict, 'marketplace.list.currencyNames.cash'),
        gameCoins: t(dict, 'marketplace.list.currencyNames.gameCoins'),
        aCoins: t(dict, 'marketplace.list.currencyNames.aCoins'),
        oCoins: t(dict, 'marketplace.list.currencyNames.oCoins'),
        newDayGameCoins: 'New Day 游戏币'
      };

      // 检查是否为跨平台道具
      if (item.gameSource === 'newday') {
        // 上架 New Day 道具到 AllinONE 市场
        // 会调用 New Day API 扣除道具
        const listedItem = await allinone_marketplaceService.listItemToCrossPlatform({
          name: item.name,
          description: item.description,
          itemType: item.category,
          imageUrl: undefined,
          price: {
            [currency]: price
          }
        }, itemId, 'newday'); // 传递原始道具ID和平台类型

        if (!listedItem) {
          alert('上架失败，请稍后重试');
          return;
        }
      } else {
        // 创建市场商品，传递原始商品ID以便从库存中移除
        await marketplaceService.createListing({
          name: item.name,
          description: item.description,
          category: item.category,
          rarity: item.rarity,
          price: price,
          currency: currency,
          sellerId: 'current-user-id',
          sellerName: '当前用户',
          gameSource: item.gameSource,
          originalItemId: itemId // 传递原始商品ID
        });
      }

      // 从前端状态中移除（后端已经通过createListing自动移除）
      const updatedInventory = userInventory.filter(i => i.id !== itemId);
      setUserInventory(updatedInventory);

      // 刷新市场数据
      const marketItems = await allinone_marketplaceService.getAllMarketItems();
      setItems(marketItems);

      alert(`成功发布商品 "${item.name}"，售价 ${price} ${currencyNames[currency]}`);
      setShowListingModal(false);
    } catch (error) {
      console.error('发布商品失败:', error);
      alert('发布商品失败，请稍后重试');
    }
  };

  const filteredItems = items
    .filter(item => 
      (selectedCategory === 'all' || item.category === selectedCategory) &&
      (selectedGameSource === 'all' || item.gameSource === selectedGameSource) &&
      (searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'date':
          return new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime();
        case 'popularity':
          return b.views - a.views;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">{t(dict, 'marketplace.loading')}</p>
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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t(dict, 'marketplace.header.title')}</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">{t(dict, 'marketplace.header.subtitle')}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* 用户钱包信息 */}
              {userWallet && (
                <div className="hidden md:flex items-center gap-3">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{t(dict, 'marketplace.header.walletLabel')}:</div>
                  <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="relative flex items-center gap-2">
                      <i className="fa-solid fa-coins text-yellow-600 dark:text-yellow-400"></i>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {(userWallet.gameCoins + (userWallet.newDayGameCoins || 0)).toLocaleString()}
                      </span>
                      <button
                        onClick={() => setShowGameCoinsDropdown(!showGameCoinsDropdown)}
                        className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <i className={`fa-solid ${showGameCoinsDropdown ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                      </button>
                      {showGameCoinsDropdown && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-3">
                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">游戏币明细</div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                              <div className="flex items-center gap-2">
                                <i className="fa-solid fa-gamepad text-yellow-600 dark:text-yellow-400"></i>
                                <span className="text-sm text-slate-700 dark:text-slate-300">AllinONE</span>
                              </div>
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{userWallet.gameCoins.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                              <div className="flex items-center gap-2">
                                <i className="fa-solid fa-sun text-orange-600 dark:text-orange-400"></i>
                                <span className="text-sm text-slate-700 dark:text-slate-300">New Day</span>
                              </div>
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{(userWallet.newDayGameCoins || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-microchip text-blue-600 dark:text-blue-400"></i>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {userWallet.computingPower.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-dollar-sign text-green-600 dark:text-green-400"></i>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {userWallet.cash.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-a text-purple-600 dark:text-purple-400"></i>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {userWallet.aCoins.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <button 
                onClick={() => setShowListingModal(true)}
                className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t(dict, 'marketplace.header.publish')}
              </button>
              <Link 
                to="/computing-power"
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {t(dict, 'marketplace.header.personalCenter')}
              </Link>
              <Link 
                to="/computing-dashboard"
                className="px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
              >
                {t(dict, 'marketplace.header.computingCenter')}
              </Link>
              <Link
                to="/"
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                {t(dict, 'marketplace.header.backHome')}
              </Link>
            </div>
          </div>
          
          {/* 移动端钱包信息 */}
          {userWallet && (
            <div className="md:hidden mt-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 text-center mb-2">{t(dict, 'marketplace.header.walletLabel')}</div>
              <div className="flex items-center justify-center gap-4 px-4 py-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="relative flex items-center gap-2">
                  <i className="fa-solid fa-coins text-yellow-600 dark:text-yellow-400"></i>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {(userWallet.gameCoins + (userWallet.newDayGameCoins || 0)).toLocaleString()}
                  </span>
                  <button
                    onClick={() => setShowGameCoinsDropdown(!showGameCoinsDropdown)}
                    className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <i className={`fa-solid ${showGameCoinsDropdown ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                  </button>
                  {showGameCoinsDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-3">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">游戏币明细</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-gamepad text-yellow-600 dark:text-yellow-400"></i>
                            <span className="text-sm text-slate-700 dark:text-slate-300">AllinONE</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{userWallet.gameCoins.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-sun text-orange-600 dark:text-orange-400"></i>
                            <span className="text-sm text-slate-700 dark:text-slate-300">New Day</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{(userWallet.newDayGameCoins || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-microchip text-blue-600 dark:text-blue-400"></i>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {userWallet.computingPower.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-dollar-sign text-green-600 dark:text-green-400"></i>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {userWallet.cash.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-a text-purple-600 dark:text-purple-400"></i>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {userWallet.aCoins.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 市场统计 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <i className="fa-solid fa-store text-purple-600 dark:text-purple-400 text-xl"></i>
                </div>
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{t(dict, 'marketplace.stats.onSale')}</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.totalListings.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <i className="fa-solid fa-handshake text-green-600 dark:text-green-400 text-xl"></i>
                </div>
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{t(dict, 'marketplace.stats.today')}</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats?.dailyTransactions?.toLocaleString() ?? '0'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <i className="fa-solid fa-coins text-blue-600 dark:text-blue-400 text-xl"></i>
                </div>
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{t(dict, 'marketplace.stats.total')}</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.totalVolume.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <i className="fa-solid fa-chart-line text-orange-600 dark:text-orange-400 text-xl"></i>
                </div>
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{t(dict, 'marketplace.stats.avgPrice')}</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.averagePrice.toFixed(0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 搜索和筛选 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={t(dict, 'marketplace.search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={selectedGameSource}
                onChange={(e) => setSelectedGameSource(e.target.value as any)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">全部游戏</option>
                <option value="allinone">AllinONE</option>
                <option value="newday">New Day</option>
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">{t(dict, 'marketplace.search.categories.all')}</option>
                <option value="weapon">{t(dict, 'marketplace.search.categories.weapon')}</option>
                <option value="armor">{t(dict, 'marketplace.search.categories.armor')}</option>
                <option value="consumable">{t(dict, 'marketplace.search.categories.consumable')}</option>
                <option value="material">{t(dict, 'marketplace.search.categories.material')}</option>
                <option value="rare">{t(dict, 'marketplace.search.categories.rare')}</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="date">{t(dict, 'marketplace.search.sort.date')}</option>
                <option value="price">{t(dict, 'marketplace.search.sort.price')}</option>
                <option value="popularity">{t(dict, 'marketplace.search.sort.popularity')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* 商品列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                <i className={`fa-solid ${getItemIcon(item.category)} text-4xl text-slate-400 dark:text-slate-500`}></i>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">{item.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getRarityColor(item.rarity)}`}>
                    {item.rarity}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {item.price.toLocaleString()} {
                      item.currency === 'cash' ? t(dict, 'marketplace.list.currencyNames.cash') :
                      item.currency === 'gameCoins' ? t(dict, 'marketplace.list.currencyNames.gameCoins') :
                      item.currency === 'aCoins' ? t(dict, 'marketplace.list.currencyNames.aCoins') :
                      item.currency === 'newDayGameCoins' ? 'New Day 游戏币' :
                      t(dict, 'marketplace.list.currencyNames.computing')
                    }
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {item.views} {t(dict, 'marketplace.list.views')}
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {t(dict, 'marketplace.list.seller')}: {item.sellerName}
                  </div>
                  {item.gameSource && (
                    <div className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                      {item.gameSource}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(item.listedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(item.id)}
                  className={`w-full px-4 py-2 rounded-lg transition-colors font-medium ${
                    (() => {
                      if (!userWallet) return 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed';
                      const currency = item.currency || 'computingPower';
                      let hasBalance = false;
                      switch (currency) {
                        case 'gameCoins':
                          hasBalance = userWallet.gameCoins >= item.price;
                          break;
                        case 'cash':
                          hasBalance = userWallet.cash >= item.price;
                          break;
                        case 'computingPower':
                          hasBalance = userWallet.computingPower >= item.price;
                          break;
                        case 'aCoins':
                          hasBalance = userWallet.aCoins >= item.price;
                          break;
                        case 'newDayGameCoins':
                          hasBalance = (userWallet.newDayGameCoins || 0) >= item.price;
                          break;
                        case 'oCoins':
                          hasBalance = (userWallet.oCoins || 0) >= item.price;
                          break;
                      }
                      return hasBalance
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed';
                    })()
                  }`}
                  disabled={(() => {
                    if (!userWallet) return true;
                    const currency = item.currency || 'computingPower';
                    switch (currency) {
                      case 'gameCoins':
                        return userWallet.gameCoins < item.price;
                      case 'cash':
                        return userWallet.cash < item.price;
                      case 'computingPower':
                        return userWallet.computingPower < item.price;
                      case 'aCoins':
                        return userWallet.aCoins < item.price;
                      case 'newDayGameCoins':
                        return (userWallet.newDayGameCoins || 0) < item.price;
                      case 'oCoins':
                        return (userWallet.oCoins || 0) < item.price;
                      default:
                        return true;
                    }
                  })()}
                >
                  {(() => {
                    if (!userWallet) return '余额不足';
                    const currency = item.currency || 'computingPower';
                      let hasBalance = false;
                      switch (currency) {
                        case 'gameCoins':
                          hasBalance = userWallet.gameCoins >= item.price;
                          break;
                        case 'cash':
                          hasBalance = userWallet.cash >= item.price;
                          break;
                        case 'computingPower':
                          hasBalance = userWallet.computingPower >= item.price;
                          break;
                        case 'aCoins':
                          hasBalance = userWallet.aCoins >= item.price;
                          break;
                        case 'newDayGameCoins':
                          hasBalance = (userWallet.newDayGameCoins || 0) >= item.price;
                          break;
                        case 'oCoins':
                          hasBalance = (userWallet.oCoins || 0) >= item.price;
                          break;
                      }
                    return hasBalance ? t(dict, 'marketplace.list.buyNow') : t(dict, 'marketplace.list.insufficient');
                  })()}
                </button>
                
                {/* 购买能力提示 */}
                {userWallet && (
                  <div className="mt-2 text-xs text-center">
                    {(() => {
                      const currency = item.currency || 'computingPower';
                      const currencyIcons: any = {
                        computing: 'fa-microchip',
                        computingPower: 'fa-microchip',
                        cash: 'fa-dollar-sign',
                        gameCoins: 'fa-coins',
                        aCoins: 'fa-a',
                        oCoins: 'fa-circle',
                        newDayGameCoins: 'fa-sun'
                      };
                      const currencyNames: any = {
                        computing: t(dict, 'marketplace.list.currencyNames.computing'),
                        computingPower: t(dict, 'marketplace.list.currencyNames.computing'),
                        cash: t(dict, 'marketplace.list.currencyNames.cash'),
                        gameCoins: t(dict, 'marketplace.list.currencyNames.gameCoins'),
                        aCoins: t(dict, 'marketplace.list.currencyNames.aCoins'),
                        oCoins: t(dict, 'marketplace.list.currencyNames.oCoins'),
                        newDayGameCoins: 'New Day 游戏币'
                      };
                      const currencyColors: any = {
                        computing: 'text-blue-600 dark:text-blue-400',
                        computingPower: 'text-blue-600 dark:text-blue-400',
                        cash: 'text-green-600 dark:text-green-400',
                        gameCoins: 'text-yellow-600 dark:text-yellow-400',
                        aCoins: 'text-purple-600 dark:text-purple-400',
                        oCoins: 'text-orange-600 dark:text-orange-400',
                        newDayGameCoins: 'text-orange-600 dark:text-orange-400'
                      };
                      
                      let hasBalance = false;
                      switch (currency) {
                        case 'gameCoins':
                          hasBalance = userWallet.gameCoins >= item.price;
                          break;
                        case 'cash':
                          hasBalance = userWallet.cash >= item.price;
                          break;
                        case 'computingPower':
                          hasBalance = userWallet.computingPower >= item.price;
                          break;
                        case 'aCoins':
                          hasBalance = userWallet.aCoins >= item.price;
                          break;
                        case 'newDayGameCoins':
                          hasBalance = (userWallet.newDayGameCoins || 0) >= item.price;
                          break;
                        case 'oCoins':
                          hasBalance = (userWallet.oCoins || 0) >= item.price;
                          break;
                      }

                      if (hasBalance) {
                        return (
                          <span className={currencyColors[currency]}>
                            <i className={`fa-solid ${currencyIcons[currency]} mr-1`}></i>
                            {dict.marketplace.list.canBuyWith(currencyNames[currency])}
                          </span>
                        );
                      } else {
                        return (
                          <span className="text-red-600 dark:text-red-400">
                            <i className="fa-solid fa-exclamation-triangle mr-1"></i>
                            {dict.marketplace.list.insufficientWith(currencyNames[currency])}
                          </span>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <i className="fa-solid fa-search text-4xl text-slate-400 dark:text-slate-500 mb-4"></i>
            <p className="text-slate-600 dark:text-slate-400">{t(dict, 'marketplace.list.empty')}</p>
          </div>
        )}
      </main>

      {/* 发布商品弹窗 */}
      {showListingModal && (
        <ListingModal
          userInventory={userInventory}
          onClose={() => setShowListingModal(false)}
          onListItem={handleListItem}
        />
      )}
    </div>
  );
}

// 发布商品弹窗组件
interface ListingModalProps {
  userInventory: MarketItem[];
  onClose: () => void;
  onListItem: (itemId: string, price: number, currency: 'computingPower' | 'cash' | 'gameCoins' | 'newDayGameCoins' | 'aCoins') => void;
}

function ListingModal({ userInventory, onClose, onListItem }: ListingModalProps) {
  const { lang } = useLanguage();
  const dict = getDict(lang);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [price, setPrice] = useState<number>(100);
  const [currency, setCurrency] = useState<'computingPower' | 'cash' | 'gameCoins' | 'newDayGameCoins' | 'aCoins'>('computingPower');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      alert('请选择要发布的道具');
      return;
    }
    if (price <= 0) {
      alert('价格必须大于0');
      return;
    }
    onListItem(selectedItem, price, currency);
  };

  // 所有道具都可以发布到交易市场
  const sellableItems = userInventory;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t(dict, 'marketplace.modal.title')}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        {sellableItems.length === 0 ? (
          <div className="text-center py-8">
            <i className="fa-solid fa-box-open text-4xl text-slate-400 dark:text-slate-500 mb-4"></i>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {t(dict, 'marketplace.modal.noItemsTitle')}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t(dict, 'marketplace.modal.noItemsDesc')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t(dict, 'marketplace.modal.selectItem')}
              </label>
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">{t(dict, 'marketplace.modal.optionPlaceholder')}</option>
                {sellableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.rarity})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t(dict, 'marketplace.modal.currencyType')}
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'computingPower' | 'cash' | 'gameCoins' | 'newDayGameCoins' | 'aCoins')}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="computingPower">{t(dict, 'marketplace.list.currencyNames.computing')}</option>
                <option value="cash">{t(dict, 'marketplace.list.currencyNames.cash')}</option>
                <option value="gameCoins">{t(dict, 'marketplace.list.currencyNames.gameCoins')}</option>
                <option value="newDayGameCoins">New Day 游戏币</option>
                <option value="aCoins">{t(dict, 'marketplace.list.currencyNames.aCoins')}</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t(dict, 'marketplace.modal.priceLabel')} ({currency === 'computingPower' ? t(dict, 'marketplace.list.currencyNames.computing') : currency === 'cash' ? t(dict, 'marketplace.list.currencyNames.cash') : currency === 'aCoins' ? t(dict, 'marketplace.list.currencyNames.aCoins') : t(dict, 'marketplace.list.currencyNames.gameCoins')})
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min="1"
                step={currency === 'cash' ? '0.01' : '1'}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            {selectedItem && (
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {(() => {
                    const item = sellableItems.find(i => i.id === selectedItem);
                    return item ? (
                      <>
                        <div className="font-medium">{item.name}</div>
                        <div>{item.description}</div>
                        <div className="mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${getRarityColor(item.rarity)}`}>
                            {item.rarity}
                          </span>
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
              >
                {t(dict, 'marketplace.modal.cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t(dict, 'marketplace.modal.submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function getItemIcon(category: string): string {
  switch (category) {
    case 'weapon': return 'fa-sword';
    case 'armor': return 'fa-shield';
    case 'consumable': return 'fa-flask';
    case 'material': return 'fa-gem';
    case 'rare': return 'fa-star';
    default: return 'fa-box';
  }
}

function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'uncommon': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-300';
    case 'rare': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-300';
    case 'epic': return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-300';
    case 'legendary': return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
}
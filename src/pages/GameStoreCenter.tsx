import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gameStoreService } from '@/services/gameStoreService';
import { GameStore, GameStoreProduct } from '@/types/gameStore';
import { useWallet } from '@/hooks/useWallet';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDict, t } from '@/utils/i18n';

export default function GameStoreCenter() {
  const [stores, setStores] = useState<GameStore[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<GameStoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showGameCoinsDropdown, setShowGameCoinsDropdown] = useState(false);

  const { balance: userWallet, refreshWalletData } = useWallet();
  const { lang } = useLanguage();
  const dict = getDict(lang);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [storesData, productsData] = await Promise.all([
          gameStoreService.getStores(),
          gameStoreService.getFeaturedProducts()
        ]);

        setStores(storesData);
        setFeaturedProducts(productsData);
        
        // 刷新钱包数据
        await refreshWalletData();
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleBuyNow = async (product: GameStoreProduct) => {
    if (!userWallet) {
      alert('钱包信息加载失败');
      return;
    }

    const price = product.price;
    // 计算佣金（游戏电商 30%）
    const commission = Math.round(price * 0.30 * 100) / 100;
    const totalAmount = Math.round((price + commission) * 100) / 100;
    
    let hasEnoughBalance = false;
    let currencyType = '';

    // 检查余额（需要支付总金额）
    switch (product.currency) {
      case 'gameCoins':
        hasEnoughBalance = userWallet.gameCoins >= totalAmount;
        currencyType = t(dict, `marketplace.list.currencyNames.${product.currency}`);
        break;
      case 'computingPower':
        hasEnoughBalance = userWallet.computingPower >= totalAmount;
        currencyType = t(dict, `marketplace.list.currencyNames.${product.currency}`);
        break;
      case 'cash':
        hasEnoughBalance = userWallet.cash >= totalAmount;
        currencyType = t(dict, `marketplace.list.currencyNames.${product.currency}`);
        break;
      case 'aCoins':
        hasEnoughBalance = userWallet.aCoins >= totalAmount;
        currencyType = t(dict, `marketplace.list.currencyNames.${product.currency}`);
        break;
    }

    if (!hasEnoughBalance) {
      alert(`余额不足！\n\n商品价格: ${price.toLocaleString()} ${currencyType}\n平台佣金: ${commission.toLocaleString()} ${currencyType} (30%)\n实际需要: ${totalAmount.toLocaleString()} ${currencyType}`);
      return;
    }

    const confirmMessage = `确认购买 ${product.name}？\n\n商品价格: ${price.toLocaleString()} ${currencyType}\n平台佣金: ${commission.toLocaleString()} ${currencyType} (30%)\n实际支付: ${totalAmount.toLocaleString()} ${currencyType}\n游戏: ${product.gameTitle}\n\n购买后商品将添加到您的库存中。`;
    
    if (!confirm(confirmMessage)) return;

    try {
      // 创建订单
      await gameStoreService.createOrder('current-user-id', [{
        id: `cart-${Date.now()}`,
        productId: product.id,
        product,
        quantity: 1,
        addedAt: new Date()
      }], product.currency);
      
      // 刷新钱包数据
      await refreshWalletData();
      
      alert(`购买成功！\n\n${product.name} 已添加到您的库存中，可在个人中心查看。\n\n费用明细:\n商品价格: ${price.toLocaleString()} ${currencyType}\n平台佣金: ${commission.toLocaleString()} ${currencyType}\n实际支付: ${totalAmount.toLocaleString()} ${currencyType}`);
    } catch (error) {
      console.error('购买失败:', error);
      alert('购买失败，请稍后重试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">{t(dict, 'gameStore.center.loading')}</p>
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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t(dict, 'gameStore.center.header.title')}</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">{t(dict, 'gameStore.center.header.subtitle')}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* 用户钱包信息 */}
              {userWallet && (
                <div className="hidden md:flex items-center gap-3">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{t(dict, 'gameStore.center.header.walletLabel')}:</div>
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
              

              <Link 
                to="/computing-power"
                className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              >
                {t(dict, 'common.nav.personalCenter')}
              </Link>
              <Link
                to="/"
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                {t(dict, 'common.nav.backHome')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">


        {/* 热门商品 */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t(dict, 'gameStore.center.featuredTitle')}</h2>
            <div className="flex items-center gap-4">
              <select className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm">
                <option>{t(dict, 'gameStore.center.filters.category.all')}</option>
                <option>{t(dict, 'gameStore.center.filters.category.weapon')}</option>
                <option>{t(dict, 'gameStore.center.filters.category.armor')}</option>
                <option>{t(dict, 'gameStore.center.filters.category.consumable')}</option>
                <option>{t(dict, 'gameStore.center.filters.category.skin')}</option>
              </select>
              <select className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm">
                <option>{t(dict, 'gameStore.center.filters.sort.price')}</option>
                <option>{t(dict, 'gameStore.center.filters.sort.asc')}</option>
                <option>{t(dict, 'gameStore.center.filters.sort.desc')}</option>
                <option>销量排序</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div key={product.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center">
                      <i className={`fa-solid ${getProductIcon(product.category)} text-2xl text-slate-400 dark:text-slate-500`}></i>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRarityColor(product.rarity)}`}>
                        {getRarityText(product.rarity)}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{product.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{product.store.developer.name}</p>
                  <Link 
                    to={`/game-store/store/${product.storeId}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-3 block"
                  >
                    {product.store.name}
                  </Link>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {product.price.toLocaleString()} {t(dict, `marketplace.list.currencyNames.${product.currency}`)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBuyNow(product)}
                      className="w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-md hover:shadow-lg hover:from-orange-600 hover:to-red-600 transition-all"
                    >
                      <i className="fa-solid fa-bolt mr-1"></i>
                      {t(dict, 'gameStore.center.buttons.buyNow')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 游戏商店 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t(dict, 'gameStore.center.storesTitle')}</h2>
            <div className="flex items-center gap-4">
              <select className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm">
                <option>{t(dict, 'gameStore.center.filters.games.all')}</option>
                <option>王者荣耀</option>
                <option>梦幻西游</option>
                <option>原神</option>
              </select>
              <select className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm">
                <option>{t(dict, 'gameStore.center.filters.sort.comprehensive')}</option>
                <option>{t(dict, 'gameStore.center.filters.sort.sales')}</option>
                <option>{t(dict, 'gameStore.center.filters.sort.rating')}</option>
                <option>{t(dict, 'gameStore.center.filters.sort.attention')}</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <Link 
                key={store.id} 
                to={`/game-store/store/${store.id}`}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all group"
              >
                <div 
                  className="h-32 bg-gradient-to-r relative"
                  style={{ background: `linear-gradient(135deg, ${store.theme.primaryColor}, ${store.theme.secondaryColor})` }}
                >
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <i className="fa-solid fa-gamepad text-white text-xl"></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{store.name}</h3>
                        <p className="text-white/80 text-sm">{store.developer.name}</p>
                      </div>
                      {store.developer.verified && (
                        <div className="ml-auto">
                          <i className="fa-solid fa-badge-check text-blue-400 text-xl"></i>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                    {store.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {store.totalProducts}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{t(dict, 'gameStore.center.labels.products')}</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {(store.totalSales / 10000).toFixed(1)}万
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{t(dict, 'gameStore.center.labels.sales')}</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <i className="fa-solid fa-star text-yellow-400 text-sm"></i>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                          {store.rating}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{t(dict, 'gameStore.center.labels.rating')}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function getProductIcon(category: string): string {
  switch (category) {
    case 'weapon': return 'fa-sword';
    case 'armor': return 'fa-shield';
    case 'consumable': return 'fa-flask';
    case 'material': return 'fa-gem';
    case 'skin': return 'fa-palette';
    case 'character': return 'fa-user-ninja';
    case 'currency': return 'fa-coins';
    case 'bundle': return 'fa-box';
    default: return 'fa-gamepad';
  }
}

function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'uncommon': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-300';
    case 'rare': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-300';
    case 'epic': return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-300';
    case 'legendary': return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-300';
    case 'mythic': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
}

function getRarityText(rarity: string): string {
  switch (rarity) {
    case 'common': return '普通';
    case 'uncommon': return '优秀';
    case 'rare': return '稀有';
    case 'epic': return '史诗';
    case 'legendary': return '传说';
    case 'mythic': return '神话';
    default: return '普通';
  }
}

function getCurrencyText(currency: string): string {
  switch (currency) {
    case 'computingPower': return '算力';
    case 'cash': return '现金';
    case 'gameCoins': return '游戏币';
    case 'aCoins': return 'A币';
    default: return '游戏币';
  }
}
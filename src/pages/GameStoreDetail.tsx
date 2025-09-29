import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { gameStoreService } from '@/services/gameStoreService';
import { GameStore, GameStoreProduct } from '@/types/gameStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDict, t } from '@/utils/i18n';

interface UserWallet {
  gameCoins: number;
  computingPower: number;
  cash: number;
  totalValue: number;
}

export default function GameStoreDetail() {
  const { storeId } = useParams<{ storeId: string }>();
  const [store, setStore] = useState<GameStore | null>(null);
  const [products, setProducts] = useState<GameStoreProduct[]>([]);
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { lang } = useLanguage();
  const dict = getDict(lang);

  useEffect(() => {
    const loadData = async () => {
      if (!storeId) return;
      
      try {
        const [storeData, productsData] = await Promise.all([
          gameStoreService.getStoreById(storeId),
          gameStoreService.getStoreProducts(storeId)
        ]);

        setStore(storeData);
        setProducts(productsData);
        
        // 模拟用户钱包数据
        setUserWallet({
          gameCoins: 15000,
          computingPower: 2500,
          cash: 200,
          totalValue: 17750
        });

      } catch (error) {
        console.error('加载商店数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storeId]);

  const handleBuyNow = async (product: GameStoreProduct) => {
    if (!userWallet) {
      alert('钱包信息加载失败');
      return;
    }

    const price = product.discountPrice || product.price;
    // 计算佣金（游戏电商 30%）
    const commission = Math.round(price * 0.30 * 100) / 100;
    const totalAmount = Math.round((price + commission) * 100) / 100;
    
    let hasEnoughBalance = false;
    let currencyType = '';

    // 检查余额（需要支付总金额）
    switch (product.currency) {
      case 'gameCoins':
        hasEnoughBalance = userWallet.gameCoins >= totalAmount;
        currencyType = '游戏币';
        break;
      case 'computingPower':
        hasEnoughBalance = userWallet.computingPower >= totalAmount;
        currencyType = '算力';
        break;
      case 'cash':
        hasEnoughBalance = userWallet.cash >= totalAmount;
        currencyType = '现金';
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
      
      // 更新用户钱包（扣除总金额）
      setUserWallet(prev => {
        if (!prev) return null;
        const updated = { ...prev };
        switch (product.currency) {
          case 'gameCoins':
            updated.gameCoins -= totalAmount;
            updated.totalValue -= totalAmount;
            break;
          case 'computingPower':
            updated.computingPower -= totalAmount;
            updated.totalValue -= totalAmount;
            break;
          case 'cash':
            updated.cash -= totalAmount;
            updated.totalValue -= totalAmount;
            break;
        }
        return updated;
      });
      
      alert(`购买成功！\n\n${product.name} 已添加到您的库存中，可在个人中心查看。\n\n费用明细:\n商品价格: ${price.toLocaleString()} ${currencyType}\n平台佣金: ${commission.toLocaleString()} ${currencyType}\n实际支付: ${totalAmount.toLocaleString()} ${currencyType}`);
    } catch (error) {
      console.error('购买失败:', error);
      alert('购买失败，请稍后重试');
    }
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const categories = Array.from(new Set(products.map(p => p.category)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">{t(dict, 'gameStore.detail.loading')}</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-store-slash text-6xl text-slate-400 dark:text-slate-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t(dict, 'gameStore.detail.storeNotFound.title')}</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">{t(dict, 'gameStore.detail.storeNotFound.desc')}</p>
          <Link
            to="/game-store"
            className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-md hover:shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            {t(dict, 'gameStore.detail.storeNotFound.back')}
          </Link>
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
            <div className="flex items-center gap-4">
              <Link 
                to="/game-store"
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              >
                <i className="fa-solid fa-arrow-left text-xl"></i>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{store.name}</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">{store.developer.name} {t(dict, 'gameStore.detail.header.officialStoreSuffix')}</p>
              </div>
              {store.developer.verified && (
                <i className="fa-solid fa-badge-check text-blue-500 text-2xl"></i>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* 用户钱包信息 */}
              {userWallet && (
                <div className="hidden md:flex flex-col gap-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-center">{t(dict, 'gameStore.detail.walletLabel')}</div>
                  <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-coins text-yellow-600 dark:text-yellow-400"></i>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {userWallet.gameCoins.toLocaleString()}
                      </span>
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
                  </div>
                </div>
              )}
              

              <Link 
                to="/computing-power"
                className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              >
                {t(dict, 'common.nav.personalCenter')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 商店信息 */}
        <section className="mb-8">
          <div 
            className="bg-gradient-to-r rounded-xl p-8 text-white relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${store.theme.primaryColor}, ${store.theme.secondaryColor})` }}
          >
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-gamepad text-3xl"></i>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{store.name}</h2>
                    <p className="text-white/90 mb-2">{store.developer.name}</p>
                    <p className="text-white/80">{store.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-star text-yellow-400"></i>
                    <span className="text-xl font-bold">{store.rating}</span>
                    <span className="text-white/80">(1234 {t(dict, 'gameStore.detail.labels.reviews')})</span>
                  </div>
                  <div className="text-white/80">
                    {store.followers.toLocaleString()} {t(dict, 'gameStore.detail.labels.followers')}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{store.totalProducts}</div>
                  <div className="text-white/80">{t(dict, 'gameStore.detail.labels.productCount')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{(store.totalSales / 10000).toFixed(1)}万</div>
                  <div className="text-white/80">{t(dict, 'gameStore.detail.labels.totalSales')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{new Date(store.createdAt).getFullYear()}</div>
                  <div className="text-white/80">{t(dict, 'gameStore.detail.labels.foundedYear')}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 商品筛选 */}
        <section className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t(dict, 'gameStore.detail.products.title')}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {t(dict, 'gameStore.detail.products.all')}
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedCategory === category
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {getCategoryText(category)}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-slate-600 dark:text-slate-400">
              {t(dict, 'gameStore.detail.products.totalPrefix')} {filteredProducts.length} {t(dict, 'gameStore.detail.products.totalSuffix')}
            </div>
          </div>
        </section>

        {/* 商品网格 */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
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
                      {product.discountPrice && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                          -{Math.round((1 - product.discountPrice / product.price) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{product.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {product.discountPrice ? (
                        <>
                          <span className="text-red-600 dark:text-red-400">
                            {product.discountPrice.toLocaleString()} {t(dict, `marketplace.list.currencyNames.${product.currency}`)}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400 line-through ml-2">
                            {product.price.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <>
                          {product.price.toLocaleString()} {t(dict, `marketplace.list.currencyNames.${product.currency}`)}
                        </>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {t(dict, 'gameStore.detail.products.stock')}: {product.stock}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBuyNow(product)}
                      className="w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-md hover:shadow-lg hover:from-orange-600 hover:to-red-600 transition-all"
                    >
                      <i className="fa-solid fa-bolt mr-1"></i>
                      {t(dict, 'gameStore.detail.buttons.buyNow')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <i className="fa-solid fa-box-open text-6xl text-slate-400 dark:text-slate-500 mb-4"></i>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t(dict, 'gameStore.detail.empty.title')}</h3>
              <p className="text-slate-600 dark:text-slate-400">{t(dict, 'gameStore.detail.empty.desc')}</p>
            </div>
          )}
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
    default: return '游戏币';
  }
}

function getCategoryText(category: string): string {
  switch (category) {
    case 'weapon': return '武器';
    case 'armor': return '装备';
    case 'consumable': return '消耗品';
    case 'material': return '材料';
    case 'skin': return '皮肤';
    case 'character': return '角色';
    case 'currency': return '游戏币';
    case 'bundle': return '礼包';
    default: return '其他';
  }
}
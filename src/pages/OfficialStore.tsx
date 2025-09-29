import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDict, t } from '@/utils/i18n';
import { officialStoreService } from '@/services/officialStoreService';
import { useWallet } from '@/hooks/useWallet';
import { 
  OfficialStoreItem, 
  StoreCategory, 
  PaymentMethod, 
  PurchaseRecord 
} from '@/types/officialStore';

interface UserWallet {
  gameCoins: number;
  computingPower: number;
  cash: number;
  aCoins: number;
  totalValue: number;
}

export default function OfficialStore() {
  const { lang } = useLanguage();
  const dict = getDict(lang);
  const [items, setItems] = useState<OfficialStoreItem[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [featuredItems, setFeaturedItems] = useState<OfficialStoreItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { balance: userWallet, refreshWalletData } = useWallet();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStoreData();
  }, [selectedCategory]);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      const [storeItems, storeCategories, featured] = await Promise.all([
        officialStoreService.getItems(selectedCategory),
        officialStoreService.getCategories(),
        officialStoreService.getFeaturedItems()
      ]);
      
      setItems(storeItems);
      setCategories(storeCategories);
      setFeaturedItems(featured);
    } catch (error) {
      console.error('加载商店数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item: OfficialStoreItem, paymentMethod: PaymentMethod) => {
    if (!userWallet) {
      alert('钱包信息加载中，请稍候...');
      return;
    }
    try {
      const priceOption = item.prices.find(p => p.method === paymentMethod);
      if (!priceOption) {
        alert('不支持的支付方式');
        return;
      }

      // 检查余额
      let hasEnoughBalance = false;
      let balanceText = '';
      
      switch (paymentMethod) {
        case PaymentMethod.REAL_MONEY:
          hasEnoughBalance = userWallet.cash >= priceOption.amount;
          balanceText = `¥${priceOption.amount}`;
          break;
        case PaymentMethod.GAME_COINS:
          hasEnoughBalance = userWallet.gameCoins >= priceOption.amount;
          balanceText = `${priceOption.amount} 游戏币`;
          break;
        case PaymentMethod.COMPUTING_POWER:
          hasEnoughBalance = userWallet.computingPower >= priceOption.amount;
          balanceText = `${priceOption.amount} 算力`;
          break;
        case PaymentMethod.A_COINS:
          hasEnoughBalance = userWallet.aCoins >= priceOption.amount;
          balanceText = `${priceOption.amount} A币`;
          break;
      }

      if (!hasEnoughBalance) {
        alert(`余额不足！需要 ${balanceText}`);
        return;
      }

      const confirmMessage = `确认购买 "${item.name}"？\n\n价格: ${balanceText}\n\n奖励:\n${item.rewards.map(r => `• ${r.amount} ${getRewardTypeName(r.type)}`).join('\n')}`;
      
      if (!confirm(confirmMessage)) return;

      // 执行购买
      const purchase = await officialStoreService.purchaseItem(
        item.id, 
        'current-user-id', 
        paymentMethod
      );

      // 购买成功后刷新钱包数据
      await refreshWalletData();

      // 重新加载商店数据（更新库存）
      await loadStoreData();

      alert(`购买成功！\n\n获得奖励:\n${purchase.rewards.map(r => `• ${r.amount} ${getRewardTypeName(r.type)}`).join('\n')}`);
    } catch (error: any) {
      alert(`购买失败: ${error.message}`);
    }
  };

  const getRewardTypeName = (type: string): string => {
    switch (type) {
      case 'game_coins': return '游戏币';
      case 'computing_power': return '算力';
      case 'props': return '道具';
      case 'vip_days': return '天VIP';
      case 'a_coins': return 'A币';
      default: return type;
    }
  };

  const getPaymentMethodName = (method: PaymentMethod): string => {
    switch (method) {
      case PaymentMethod.REAL_MONEY: return '现金';
      case PaymentMethod.GAME_COINS: return '游戏币';
      case PaymentMethod.COMPUTING_POWER: return '算力';
      case PaymentMethod.A_COINS: return 'A币';
      default: return method;
    }
  };

  const canAfford = (item: OfficialStoreItem, method: PaymentMethod): boolean => {
    const price = item.prices.find(p => p.method === method);
    if (!price || !userWallet) return false;

    switch (method) {
      case PaymentMethod.REAL_MONEY:
        return userWallet.cash >= price.amount;
      case PaymentMethod.GAME_COINS:
        return userWallet.gameCoins >= price.amount;
      case PaymentMethod.COMPUTING_POWER:
        return userWallet.computingPower >= price.amount;
      case PaymentMethod.A_COINS:
        return userWallet.aCoins >= price.amount;
      default:
        return false;
    }
  };

  const filteredItems = items.filter(item =>
    searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">加载官方商店数据中...</p>
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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t(dict,'store.header.title')}</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">{t(dict,'store.header.subtitle')}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* 用户钱包信息 */}
              <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-wallet text-green-600 dark:text-green-400"></i>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    ¥{userWallet?.cash.toFixed(2) ?? '0.00'}
                  </span>
                </div>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-coins text-yellow-600 dark:text-yellow-400"></i>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {userWallet?.gameCoins.toLocaleString() ?? '0'}
                  </span>
                </div>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-microchip text-blue-600 dark:text-blue-400"></i>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {userWallet?.computingPower.toLocaleString() ?? '0'}
                  </span>
                </div>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-a text-purple-600 dark:text-purple-400"></i>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {userWallet?.aCoins.toLocaleString() ?? '0'}
                  </span>
                </div>
              </div>
              <Link 
                to="/computing-power"
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {t(dict,'store.header.personalCenter')}
              </Link>

              <Link
                to="/"
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                {t(dict,'store.header.backHome')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 推荐商品轮播 */}
        {featuredItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t(dict,'store.featured.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.slice(0, 3).map((item) => (
                <div key={item.id} className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-bl-lg text-sm font-bold">
                    {t(dict,'store.featured.badge')}
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <i className={`fa-solid ${item.icon} text-3xl`}></i>
                    <div>
                      <h3 className="text-xl font-bold">{item.name}</h3>
                      <p className="text-purple-100 text-sm">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {item.prices[0].method === PaymentMethod.REAL_MONEY ? '¥' : ''}
                      {item.prices[0].amount}
                      {item.prices[0].method === PaymentMethod.GAME_COINS ? ' 币' : ''}
                      {item.prices[0].method === PaymentMethod.COMPUTING_POWER ? ' 算力' : ''}
                      {item.prices[0].method === PaymentMethod.A_COINS ? ' A币' : ''}
                    </div>
                    <button
                      onClick={() => handlePurchase(item, item.prices[0].method)}
                      className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                    >
                      {t(dict,'store.featured.buyNow')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 分类导航 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700'
              }`}
            >
              {t(dict,'store.categories.all')}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700'
                }`}
              >
                <i className={`fa-solid ${category.icon}`}></i>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 搜索框 */}
        <div className="mb-6">
          <input
            type="text"
            placeholder={t(dict,'store.search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* 商品网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* 商品标签 */}
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                  <i className={`fa-solid ${item.icon} text-4xl text-slate-400 dark:text-slate-500`}></i>
                </div>
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                {item.discount && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    -{item.discount}%
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{item.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                  {item.description}
                </p>

                {/* 奖励展示 */}
                <div className="mb-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t(dict,'store.rewards.title')}</div>
                  <div className="flex flex-wrap gap-1">
                    {item.rewards.map((reward, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                        {reward.amount} {getRewardTypeName(reward.type)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 价格和购买按钮 */}
                <div className="space-y-2">
                  {item.prices.map((price, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {price.method === PaymentMethod.REAL_MONEY ? '¥' : ''}
                          {price.amount}
                          {price.method === PaymentMethod.GAME_COINS ? ' 币' : ''}
                          {price.method === PaymentMethod.COMPUTING_POWER ? ' 算力' : ''}
                          {price.method === PaymentMethod.A_COINS ? ' A币' : ''}
                        </span>
                        {price.originalAmount && (
                          <span className="text-sm text-slate-400 line-through">
                            {price.originalAmount}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handlePurchase(item, price.method)}
                        disabled={!canAfford(item, price.method)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          canAfford(item, price.method)
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {dict.store.purchase.buyWith(getPaymentMethodName(price.method))}
                      </button>
                    </div>
                  ))}
                </div>

                {/* 库存和限制信息 */}
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {item.stock !== -1 && (
                    <div>{t(dict,'store.purchase.stock')}: {item.stock}</div>
                  )}
                  {item.dailyLimit && (
                    <div>{t(dict,'store.purchase.dailyLimit')}: {item.dailyLimit}</div>
                  )}
                  {item.userLimit && (
                    <div>{t(dict,'store.purchase.userLimit')}: {item.userLimit}</div>
                  )}
                  {item.endTime && (
                    <div className="text-red-500">
                      {t(dict,'store.purchase.deadline')}: {item.endTime.toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <i className="fa-solid fa-store text-4xl text-slate-400 dark:text-slate-500 mb-4"></i>
            <p className="text-slate-600 dark:text-slate-400">{t(dict,'store.purchase.empty')}</p>
          </div>
        )}
      </main>
    </div>
  );
}
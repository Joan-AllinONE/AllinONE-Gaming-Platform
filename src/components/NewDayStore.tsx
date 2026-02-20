/**
 * New Day 游戏商店组件
 * 在官方商店中展示 New Day 游戏道具
 */

import { useState, useEffect } from 'react';
import { officialStoreService } from '@/services/officialStoreService';
import {
  NewDayStoreItem,
  NewDayItemType,
  NewDayRarity
} from '@/types/newDay';
import { useWallet } from '@/hooks/useWallet';

const rarityColors = {
  [NewDayRarity.COMMON]: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
  [NewDayRarity.UNCOMMON]: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-600',
  [NewDayRarity.RARE]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-600',
  [NewDayRarity.EPIC]: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-600',
  [NewDayRarity.LEGENDARY]: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-600'
};

const rarityText = {
  [NewDayRarity.COMMON]: '普通',
  [NewDayRarity.UNCOMMON]: '稀有',
  [NewDayRarity.RARE]: '史诗',
  [NewDayRarity.EPIC]: '传说',
  [NewDayRarity.LEGENDARY]: '神话'
};

const itemTypeIcons = {
  [NewDayItemType.WEAPON]: 'fa-sword',
  [NewDayItemType.ARMOR]: 'fa-shield-halved',
  [NewDayItemType.ACCESSORY]: 'fa-amulet',
  [NewDayItemType.CONSUMABLE]: 'fa-flask',
  [NewDayItemType.MATERIAL]: 'fa-gem',
  [NewDayItemType.SPECIAL]: 'fa-star',
  [NewDayItemType.SKIN]: 'fa-user-ninja',
  [NewDayItemType.PET]: 'fa-dragon'
};

const itemTypeText = {
  [NewDayItemType.WEAPON]: '武器',
  [NewDayItemType.ARMOR]: '护甲',
  [NewDayItemType.ACCESSORY]: '饰品',
  [NewDayItemType.CONSUMABLE]: '消耗品',
  [NewDayItemType.MATERIAL]: '材料',
  [NewDayItemType.SPECIAL]: '特殊',
  [NewDayItemType.SKIN]: '皮肤',
  [NewDayItemType.PET]: '宠物'
};

interface NewDayStoreProps {
  selectedCategory?: NewDayItemType;
}

export default function NewDayStore({ selectedCategory }: NewDayStoreProps) {
  const { balance: userWallet, refreshWalletData } = useWallet();
  const [items, setItems] = useState<NewDayStoreItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<NewDayStoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadItems();
  }, [selectedCategory]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm]);

  const loadItems = async () => {
    try {
      setLoading(true);
      // 使用 officialStoreService 获取商品列表，确保与购买逻辑数据一致
      const storeItems = await officialStoreService.getNewDayStoreItems(selectedCategory);
      setItems(storeItems);
    } catch (error) {
      console.error('加载 New Day 道具失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    const filtered = items.filter(item =>
      searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  const handlePurchase = async (item: NewDayStoreItem, paymentMethod: string) => {
    if (!userWallet) {
      alert('钱包信息加载中，请稍候...');
      return;
    }

    const priceMap = {
      'cash': item.prices.cash,
      'gameCoins': item.prices.gameCoins,
      'computingPower': item.prices.computingPower,
      'aCoins': item.prices.aCoins,
      'newDayCoins': item.prices.newDayCoins
    };

    const price = priceMap[paymentMethod as keyof typeof priceMap];
    if (!price) {
      alert('不支持的支付方式');
      return;
    }

    // 检查余额
    let hasEnoughBalance = false;
    let balanceText = '';

    switch (paymentMethod) {
      case 'cash':
        hasEnoughBalance = userWallet.cash >= price;
        balanceText = `¥${price}`;
        break;
      case 'gameCoins':
        hasEnoughBalance = userWallet.gameCoins >= price;
        balanceText = `${price} 游戏币`;
        break;
      case 'computingPower':
        hasEnoughBalance = userWallet.computingPower >= price;
        balanceText = `${price} 算力`;
        break;
      case 'aCoins':
        hasEnoughBalance = userWallet.aCoins >= price;
        balanceText = `${price} A币`;
        break;
      case 'newDayCoins':
        hasEnoughBalance = true; // New Day 币暂时不检查
        balanceText = `${price} New Day币`;
        break;
    }

    if (!hasEnoughBalance) {
      alert(`余额不足！需要 ${balanceText}`);
      return;
    }

    const confirmMessage = `确认购买 "[New Day] ${item.name}"？\n\n价格: ${balanceText}\n\n${item.rewards?.map(r => `• ${r.itemName || r.type} x${r.amount}`).join('\n') || ''}`;
    
    if (!confirm(confirmMessage)) return;

    try {
      // 使用 officialStoreService.purchaseNewDayItem 调用 AllinONE 交易系统
      await officialStoreService.purchaseNewDayItem(
        item.id,
        'current-user-id',
        paymentMethod,
        1
      );
      await refreshWalletData();
      alert(`购买成功！获得 ${item.name}`);
      await loadItems(); // 重新加载道具列表
    } catch (error: any) {
      alert(`购买失败: ${error.message}`);
    }
  };

  const canAfford = (item: NewDayStoreItem, paymentMethod: string): boolean => {
    const priceMap = {
      'cash': item.prices.cash,
      'gameCoins': item.prices.gameCoins,
      'computingPower': item.prices.computingPower,
      'aCoins': item.prices.aCoins,
      'newDayCoins': item.prices.newDayCoins
    };

    const price = priceMap[paymentMethod as keyof typeof priceMap];
    if (!price || !userWallet) return false;

    switch (paymentMethod) {
      case 'cash':
        return userWallet.cash >= price;
      case 'gameCoins':
        return userWallet.gameCoins >= price;
      case 'computingPower':
        return userWallet.computingPower >= price;
      case 'aCoins':
        return userWallet.aCoins >= price;
      case 'newDayCoins':
        return true;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-slate-600 dark:text-slate-300">加载 New Day 道具中...</span>
      </div>
    );
  }

  return (
    <div>
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        <i className="fa-solid fa-dragon text-2xl text-purple-600"></i>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">New Day 道具商店</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">来自 New Day 游戏的专属道具</p>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="搜索 New Day 道具..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* 道具网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-slate-200 dark:border-slate-700">
            {/* 道具图标 */}
            <div className="relative">
              <div className={`aspect-square bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center ${item.featured ? 'bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20' : ''}`}>
                <i className={`fa-solid ${item.icon || itemTypeIcons[item.type]} text-4xl ${rarityColors[item.rarity].split(' ')[2] || 'text-slate-400'}`}></i>
              </div>
              
              {/* 标签 */}
              <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${rarityColors[item.rarity]}`}>
                  {rarityText[item.rarity]}
                </span>
              </div>
              
              {item.featured && (
                <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                  推荐
                </div>
              )}
            </div>

            <div className="p-3">
              {/* 道具信息 */}
              <div className="mb-2">
                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <i className={`fa-solid ${itemTypeIcons[item.type]}`}></i>
                  <span>{itemTypeText[item.type]}</span>
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{item.name}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{item.description}</p>
              </div>

              {/* 属性显示（如果有） */}
              {item.stats && (item.stats.attack || item.stats.defense || item.stats.health) && (
                <div className="flex flex-wrap gap-1 mb-2 text-xs">
                  {item.stats.attack && (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                      ⚔️ {item.stats.attack}
                    </span>
                  )}
                  {item.stats.defense && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                      🛡️ {item.stats.defense}
                    </span>
                  )}
                  {item.stats.health && (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                      ❤️ {item.stats.health}
                    </span>
                  )}
                </div>
              )}

              {/* 价格和购买按钮 */}
              <div className="space-y-1.5">
                {item.prices.cash && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-green-600 dark:text-green-400">¥{item.prices.cash}</span>
                    <button
                      onClick={() => handlePurchase(item, 'cash')}
                      disabled={!canAfford(item, 'cash')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        canAfford(item, 'cash')
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      购买
                    </button>
                  </div>
                )}
                {item.prices.gameCoins && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-yellow-600 dark:text-yellow-400">{item.prices.gameCoins} 币</span>
                    <button
                      onClick={() => handlePurchase(item, 'gameCoins')}
                      disabled={!canAfford(item, 'gameCoins')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        canAfford(item, 'gameCoins')
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      购买
                    </button>
                  </div>
                )}
                {item.prices.computingPower && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{item.prices.computingPower} 算力</span>
                    <button
                      onClick={() => handlePurchase(item, 'computingPower')}
                      disabled={!canAfford(item, 'computingPower')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        canAfford(item, 'computingPower')
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      购买
                    </button>
                  </div>
                )}
                {item.prices.aCoins && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-600 dark:text-purple-400">{item.prices.aCoins} A币</span>
                    <button
                      onClick={() => handlePurchase(item, 'aCoins')}
                      disabled={!canAfford(item, 'aCoins')}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        canAfford(item, 'aCoins')
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      购买
                    </button>
                  </div>
                )}
                {item.prices.newDayCoins && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-orange-600 dark:text-orange-400">{item.prices.newDayCoins} ND币</span>
                    <button
                      onClick={() => handlePurchase(item, 'newDayCoins')}
                      className="px-2 py-1 rounded text-xs font-medium bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                    >
                      购买
                    </button>
                  </div>
                )}
              </div>

              {/* 库存和限制 */}
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {item.stock !== undefined && item.stock !== -1 && (
                  <div>库存: {item.stock}</div>
                )}
                {item.dailyLimit && (
                  <div>每日限购: {item.dailyLimit}</div>
                )}
                {item.userLimit && (
                  <div>每人限购: {item.userLimit}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-8">
          <i className="fa-solid fa-box-open text-4xl text-slate-400 dark:text-slate-500 mb-3"></i>
          <p className="text-slate-600 dark:text-slate-400">暂无道具</p>
        </div>
      )}
    </div>
  );
}

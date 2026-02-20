/**
 * 跨平台市场组件
 * 用于展示和交易跨平台道具
 */

import React, { useState, useEffect } from 'react';
import { crossPlatformMarketService } from '../services/crossPlatformMarketService';
import { crossPlatformAuthService } from '../services/crossPlatformAuthService';
import { crossPlatformWalletService } from '../services/crossPlatformWalletService';

interface MarketItem {
  id: string;
  name: string;
  description: string;
  platform: 'allinone' | 'newday';
  itemType: string;
  imageUrl?: string;
  price: {
    cash?: number;
    gameCoins?: number;
    computingPower?: number;
    aCoins?: number;
    oCoins?: number;
    newDayGameCoins?: number; // New Day 游戏币
  };
  sellerId: string;
  sellerName: string;
  listedAt: number;
  expiresAt?: number;
}

interface CurrencyBalance {
  cash: number;
  gameCoins: number;
  computingPower: number;
  aCoins: number;
  oCoins: number;
  newDayGameCoins: number; // New Day 游戏币
}

export const CrossPlatformMarket: React.FC = () => {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<CurrencyBalance | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'allinone' | 'newday' | ''>('');
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('cash');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadMarketItems();
    loadBalance();
  }, [selectedPlatform]);

  const loadMarketItems = async () => {
    try {
      setLoading(true);
      const { items: marketItems } = await crossPlatformMarketService.getMarketItems(
        selectedPlatform || undefined,
        undefined,
        'listed_desc',
        1,
        50
      );
      setItems(marketItems);
    } catch (error) {
      showNotification('error', '加载市场物品失败');
      console.error('Failed to load market items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const currentBalance = await crossPlatformWalletService.getBalance();
      setBalance(currentBalance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedItem) return;

    try {
      const result = await crossPlatformMarketService.purchaseItem({
        itemId: selectedItem.id,
        currencyType: selectedCurrency as any,
      });

      if (result.success) {
        showNotification('success', '购买成功!');
        loadBalance();
        loadMarketItems();
        setShowPurchaseDialog(false);
        setSelectedItem(null);
      }
    } catch (error: any) {
      showNotification('error', error.message || '购买失败');
    }
  };

  const handleItemClick = (item: MarketItem) => {
    setSelectedItem(item);
    setShowPurchaseDialog(true);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatPrice = (price: MarketItem['price']) => {
    const entries = Object.entries(price).filter(([_, value]) => value && value > 0);
    if (entries.length === 0) return '免费';

    return entries.map(([currency, value]) => {
      const currencyNames: Record<string, string> = {
        cash: '现金',
        gameCoins: '游戏币',
        computingPower: '算力',
        aCoins: 'A币',
        oCoins: 'O币',
        newDayGameCoins: 'New Day 游戏币',
      };
      return `${value} ${currencyNames[currency] || currency}`;
    }).join(' 或 ');
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      cash: '¥',
      gameCoins: '🪙',
      computingPower: '⚡',
      aCoins: 'A',
      oCoins: 'O',
      newDayGameCoins: '🐉',
    };
    return symbols[currency] || currency;
  };

  if (!crossPlatformAuthService.getCurrentUser()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">请先登录以访问跨平台市场</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">跨平台市场</h1>

        {/* 余额显示 */}
        {balance && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white mb-6">
            <h2 className="text-lg font-semibold mb-2">我的余额</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <span className="text-2xl">¥{balance.cash}</span>
                <p className="text-sm opacity-90">现金</p>
              </div>
              <div>
                <span className="text-2xl">{balance.gameCoins}</span>
                <p className="text-sm opacity-90">游戏币</p>
              </div>
              <div>
                <span className="text-2xl">{balance.computingPower}</span>
                <p className="text-sm opacity-90">算力</p>
              </div>
              <div>
                <span className="text-2xl">{balance.aCoins}</span>
                <p className="text-sm opacity-90">A币</p>
              </div>
              <div>
                <span className="text-2xl">{balance.oCoins}</span>
                <p className="text-sm opacity-90">O币</p>
              </div>
              <div>
                <span className="text-2xl">{balance.newDayGameCoins}</span>
                <p className="text-sm opacity-90">New Day 游戏币</p>
              </div>
            </div>
          </div>
        )}

        {/* 筛选器 */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setSelectedPlatform('')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPlatform === ''
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            全部平台
          </button>
          <button
            onClick={() => setSelectedPlatform('allinone')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPlatform === 'allinone'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            AllinONE
          </button>
          <button
            onClick={() => setSelectedPlatform('newday')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPlatform === 'newday'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            New Day
          </button>
        </div>
      </div>

      {/* 物品列表 */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">暂无物品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    item.platform === 'newday' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.platform === 'newday' ? 'New Day' : 'AllinONE'}
                  </span>
                  <span className="text-xs text-gray-500">{item.itemType}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                <div className="text-sm font-semibold text-blue-600">
                  {formatPrice(item.price)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  卖家: {item.sellerName}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 购买确认对话框 */}
      {showPurchaseDialog && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">确认购买</h2>
            <div className="mb-4">
              <p className="font-semibold">{selectedItem.name}</p>
              <p className="text-sm text-gray-600 mt-1">{selectedItem.description}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">价格:</p>
              <p className="font-semibold text-blue-600">{formatPrice(selectedItem.price)}</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择支付货币:
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {selectedItem.price.cash && selectedItem.price.cash > 0 && (
                  <option value="cash">现金 (¥{selectedItem.price.cash})</option>
                )}
                {selectedItem.price.gameCoins && selectedItem.price.gameCoins > 0 && (
                  <option value="gameCoins">游戏币 ({selectedItem.price.gameCoins})</option>
                )}
                {selectedItem.price.newDayGameCoins && selectedItem.price.newDayGameCoins > 0 && (
                  <option value="newDayGameCoins">New Day 游戏币 ({selectedItem.price.newDayGameCoins})</option>
                )}
                {selectedItem.price.computingPower && selectedItem.price.computingPower > 0 && (
                  <option value="computingPower">算力 ({selectedItem.price.computingPower})</option>
                )}
                {selectedItem.price.aCoins && selectedItem.price.aCoins > 0 && (
                  <option value="aCoins">A币 ({selectedItem.price.aCoins})</option>
                )}
                {selectedItem.price.oCoins && selectedItem.price.oCoins > 0 && (
                  <option value="oCoins">O币 ({selectedItem.price.oCoins})</option>
                )}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPurchaseDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handlePurchase}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                确认购买
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 通知 */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

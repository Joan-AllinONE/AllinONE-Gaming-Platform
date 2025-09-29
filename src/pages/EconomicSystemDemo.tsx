import React, { useState, useEffect } from 'react';
import { gameStoreService } from '@/services/gameStoreService';
import { economicIntegrationService } from '@/services/economicIntegrationService';
import { walletService } from '@/services/walletService';
import { fundPoolService } from '@/services/fundPoolService';
import EconomicSystemMonitor from '@/components/EconomicSystemMonitor';

const EconomicSystemDemo: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [productsData, balance] = await Promise.all([
        gameStoreService.getProducts(),
        walletService.getBalance()
      ]);

      setProducts(productsData.slice(0, 6)); // 只显示前6个商品
      setWalletBalance(balance);
    } catch (error) {
      console.error('加载初始数据失败:', error);
      showMessage('加载数据失败', 'error');
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const buyNow = async (product: any) => {
    try {
        setLoading(true);
        showMessage('正在处理订单...', 'info');

        const mockCartItem = {
            id: `cart-item-${Date.now()}`,
            productId: product.id,
            product: product,
            quantity: 1,
            addedAt: new Date(),
        };

        // 创建订单（这会触发经济系统集成）
        const order = await gameStoreService.createOrder('demo-user', [mockCartItem], '游戏币支付');
        
        // 刷新数据
        await loadInitialData();
        
        showMessage(`订单创建成功！订单号: ${order.id}`, 'success');
        
    } catch (error) {
        console.error('购买失败:', error);
        showMessage(`购买失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    } finally {
        setLoading(false);
    }
  };

  const addTestFunds = async () => {
    try {
      setLoading(true);
      
      // 添加测试资金
      await walletService.recharge(1000, '测试充值');
      await walletService.addGameReward(500, 10000, 'demo-game');
      
      // 刷新余额
      const newBalance = await walletService.getBalance();
      setWalletBalance(newBalance);
      
      showMessage('测试资金添加成功！现金+1000元，游戏币+10000，算力+500', 'success');
      
    } catch (error) {
      console.error('添加测试资金失败:', error);
      showMessage('添加测试资金失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'cash': return '💵';
      case 'gameCoins': return '🪙';
      case 'computingPower': return '⚡';
      default: return '💰';
    }
  };

  const formatPrice = (price: number, currency: string) => {
    switch (currency) {
      case 'cash': return `¥${price.toFixed(2)}`;
      case 'gameCoins': return `${price.toLocaleString()} 币`;
      case 'computingPower': return `${price.toFixed(1)} 算力`;
      default: return price.toString();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-400 mb-2">
          🏦 经济系统演示
        </h1>
        <p className="text-slate-400">
          演示游戏商城购买、钱包扣款、资金池佣金记录的完整流程
        </p>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          messageType === 'success' ? 'bg-green-500/10 border-green-400/30 text-green-400' :
          messageType === 'error' ? 'bg-red-500/10 border-red-400/30 text-red-400' :
          'bg-blue-500/10 border-blue-400/30 text-blue-400'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 左侧：商品展示和购物车 */}
        <div className="xl:col-span-2 space-y-6">
          {/* 钱包余额 */}
          <div className="bg-slate-800/80 border border-green-400/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-green-400">💰 钱包余额</h2>
              <button
                onClick={addTestFunds}
                disabled={loading}
                className="bg-green-500/20 border border-green-400/30 rounded-lg px-4 py-2 text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-50"
              >
                💳 添加测试资金
              </button>
            </div>
            
            {walletBalance ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl mb-1">💵</div>
                  <div className="text-sm text-slate-400">现金</div>
                  <div className="text-lg font-bold text-green-400">
                    ¥{walletBalance.cash.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">🪙</div>
                  <div className="text-sm text-slate-400">游戏币</div>
                  <div className="text-lg font-bold text-yellow-400">
                    {walletBalance.gameCoins.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">⚡</div>
                  <div className="text-sm text-slate-400">算力</div>
                  <div className="text-lg font-bold text-purple-400">
                    {walletBalance.computingPower.toFixed(1)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400">加载中...</div>
            )}
          </div>

          {/* 商品展示 */}
          <div className="bg-slate-800/80 border border-blue-400/30 rounded-lg p-6">
            <h2 className="text-xl font-bold text-blue-400 mb-4">🛒 游戏商城</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-3xl mb-2">{product.images[0] || '🎮'}</div>
                    <h3 className="font-bold text-purple-400 text-sm mb-1">{product.name}</h3>
                    <p className="text-xs text-slate-400 mb-2 line-clamp-2">{product.description}</p>
                    
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <span className="text-lg font-bold text-white">
                        {getCurrencyIcon(product.currency)}
                        {formatPrice(product.price, product.currency)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => buyNow(product)}
                      disabled={loading}
                      className="w-full bg-green-500/20 border border-green-400/30 rounded px-3 py-2 text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-50 text-sm"
                    >
                      立即购买
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>


        </div>

        {/* 右侧：经济系统监控 */}
        <div className="xl:col-span-1">
          <EconomicSystemMonitor />
        </div>
      </div>

      {/* 说明文档 */}
      <div className="mt-8 bg-slate-800/80 border border-cyan-400/30 rounded-lg p-6">
        <h2 className="text-xl font-bold text-cyan-400 mb-4">📖 系统说明</h2>
        <div className="space-y-4 text-sm text-slate-300">
          <div>
            <h3 className="font-bold text-white mb-2">🔄 经济流程演示:</h3>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>点击"添加测试资金"为钱包充值</li>
              <li>浏览商品并点击"立即购买"完成交易</li>
              <li>观察右侧监控面板的实时数据变化</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-bold text-white mb-2">💰 佣金机制:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>游戏电商: 30% 佣金</li>
              <li>玩家市场: 5% 佣金</li>
              <li>官方商店: 15% 佣金</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-white mb-2">🏦 资金池功能:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>自动记录所有交易佣金</li>
              <li>实时更新余额和统计数据</li>
              <li>提供透明的收支明细</li>
              <li>支持多币种管理</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EconomicSystemDemo;
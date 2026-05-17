/**
 * 游戏商店页面
 * 展示和购买游戏特定商品
 */

import { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getPublishedGame, type PublishedGame } from '@/services/publishedGameService';
import { skillGateway } from '@/skills';
import { voucherService } from '@/voucher-system';
import { voucherItemService, type ItemVoucherPurchase } from '@/services/voucherItemService';
import { voucherPaymentService } from '@/services/voucherPaymentService';
import { redeemCodeService } from '@/services/redeemCodeService';
import type { ItemVoucherTemplate } from '@/voucher-system/types';
import type { Voucher } from '@/voucher-system/types';
import { AuthContext } from '@/contexts/authContext';
import { 
  Store, Ticket, Settings, ExternalLink, Package, 
  TrendingUp, Users, Coins, ChevronRight, Gamepad2, 
  CreditCard, Wallet, ShieldCheck, ShoppingBag,
  Copy, CheckCircle
} from 'lucide-react';

interface StoreProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  icon: string;
  category: string;
  quantity: number;
  featured?: boolean;
  // 支持凭证支付
  acceptVoucher?: boolean;
  voucherPrice?: number;
  hostedItemId?: string;
}

interface PurchaseState {
  isPurchasing: boolean;
  productId: string | null;
  success: boolean;
  error: string | null;
  redeemCode?: string;
}

type PaymentMethod = 'wallet' | 'voucher';
type ItemPaymentMethod = 'voucher' | 'gameCoins';

export default function GameStore() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [game, setGame] = useState<PublishedGame | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [balance, setBalance] = useState<Record<string, number>>({});
  const [voucherBalance, setVoucherBalance] = useState<{ count: number; totalValue: number }>({ count: 0, totalValue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseState, setPurchaseState] = useState<PurchaseState>({
    isPurchasing: false,
    productId: null,
    success: false,
    error: null,
  });
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<StoreProduct[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  
  // 道具凭证支付方式（默认testA币凭证）
  const [itemPaymentMethod, setItemPaymentMethod] = useState<ItemPaymentMethod>('voucher');
  
  // 道具凭证相关状态
  const [itemTemplates, setItemTemplates] = useState<ItemVoucherTemplate[]>([]);
  const [myItemVouchers, setMyItemVouchers] = useState<Voucher[]>([]);
  const [myPurchases, setMyPurchases] = useState<ItemVoucherPurchase[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'itemShop' | 'myItems'>('products');
  const [isDeveloper, setIsDeveloper] = useState(false);

  useEffect(() => {
    if (!gameId) return;

    const loadGameAndProducts = async () => {
      try {
        // 加载游戏信息
        const publishedGame = getPublishedGame(gameId);
        if (publishedGame) {
          setGame(publishedGame);
          
          // 从Skill配置中加载商品
          const skillConfigs = publishedGame.skillConfigs || {};
          const storeConfig = skillConfigs.store || {};
          
          // 合并游戏配置的道具兑换商品 (redeemItems)
          const gameRedeemItems = publishedGame.redeemItems || [];
          const hostedItems = redeemCodeService.getHostedItems(gameId);
          const redeemProducts: StoreProduct[] = gameRedeemItems.map((item, idx) => {
            // 查找对应的托管道具
            const hostedItem = hostedItems.find(hi =>
              hi.gameEffect?.itemId === item.gameItemId || hi.name === item.name
            );
            return {
              id: `redeem-item-${item.gameItemId}-${idx}`,
              name: item.name,
              description: item.description,
              price: item.price,
              currency: item.currency || 'gameCoins',
              icon: item.icon || 'fa-ticket-alt',
              category: 'premium',
              quantity: hostedItem ? hostedItem.inventory.available : 999,
              featured: idx === 0,
              acceptVoucher: true,
              voucherPrice: item.price,
              hostedItemId: hostedItem?.id,
            };
          });
          
          // 生成默认商品（如果没有配置）
          const defaultProducts: StoreProduct[] = [
            { id: 'item_001', name: '生命药水', description: '恢复50点生命值', price: 10, currency: 'gameCoins', icon: 'fa-flask', category: 'consumables', quantity: 999 },
            { id: 'item_002', name: '魔法药水', description: '恢复30点魔法值', price: 15, currency: 'gameCoins', icon: 'fa-wine-bottle', category: 'consumables', quantity: 999 },
            { id: 'item_003', name: '铁剑', description: '攻击力+10', price: 100, currency: 'gameCoins', icon: 'fa-khanda', category: 'weapons', quantity: 50 },
            { id: 'item_004', name: '皮甲', description: '防御力+5', price: 80, currency: 'gameCoins', icon: 'fa-shield-alt', category: 'armor', quantity: 30 },
            { id: 'item_005', name: '经验加速器', description: '2小时内获得双倍经验', price: 50, currency: 'aCoins', icon: 'fa-bolt', category: 'premium', quantity: 100, featured: true },
            { id: 'item_006', name: '稀有宝箱', description: '随机获得稀有道具', price: 200, currency: 'aCoins', icon: 'fa-box-open', category: 'premium', quantity: 20 },
          ];
          
          // 如果游戏配置了 redeemItems，将它们作为特色商品显示在最前面
          const allProducts = [...redeemProducts, ...defaultProducts];
          setProducts(allProducts);
        }
        
        // 加载余额
        await loadBalance();
        loadVoucherBalance();
        
        // 初始化平台凭证库存（确保testA币凭证系统可用）
        try {
          voucherPaymentService.initializePlatformPool();
        } catch (e) {
          console.warn('平台凭证库存初始化失败:', e);
        }
        
        // 加载道具凭证商品
        const items = voucherItemService.getItemTemplates(gameId);
        setItemTemplates(items);
        
        // 加载当前用户的道具凭证和购买记录
        const userId = currentUser?.id || 'current-user';
        const userItemVouchers = voucherItemService.getUserItemVouchers(userId, gameId);
        setMyItemVouchers(userItemVouchers);
        const purchases = voucherItemService.getUserPurchases(userId, gameId);
        setMyPurchases(purchases);
        
        // 检查是否为开发者（简单判断：是否有发布权限等）
        // 实际应基于用户角色判断
        setIsDeveloper(publishedGame?.skills?.includes('store') || false);
      } catch (error) {
        console.error('加载游戏商店失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGameAndProducts();
  }, [gameId]);

  // 用户登录后刷新凭证余额
  useEffect(() => {
    if (currentUser?.id) {
      loadVoucherBalance();
    }
  }, [currentUser?.id]);

  const loadBalance = async () => {
    try {
      const result = await skillGateway.execute('wallet', 'getBalance');
      if (result.success) {
        setBalance(result.data || {});
      }
    } catch (error) {
      console.error('加载余额失败:', error);
    }
  };

  // 加载凭证余额
  const loadVoucherBalance = () => {
    if (!currentUser?.id) return;
    
    try {
      const vouchers = voucherService.getUserVouchers(currentUser.id);
      const activeVouchers = vouchers.filter(v => v.status === 'active');
      const totalValue = activeVouchers.reduce((sum, v) => sum + v.denomination, 0);
      setVoucherBalance({
        count: activeVouchers.length,
        totalValue,
      });
    } catch (error) {
      console.error('加载凭证余额失败:', error);
    }
  };

  const handlePurchase = async (product: StoreProduct) => {
    if (purchaseState.isPurchasing) return;

    setPurchaseState({
      isPurchasing: true,
      productId: product.id,
      success: false,
      error: null,
    });

    try {
      // 使用凭证支付
      if (paymentMethod === 'voucher' && product.acceptVoucher !== false) {
        if (!currentUser?.id) {
          throw new Error('请先登录');
        }

        // 获取用户的可用凭证
        const vouchers = voucherService.getUserVouchers(currentUser.id)
          .filter(v => v.status === 'active')
          .sort((a, b) => a.denomination - b.denomination); // 从小到大排序，优先使用小额凭证

        const price = product.voucherPrice || product.price;
        
        // 找出一个足够面额的凭证，或者使用多个小额凭证
        let selectedVouchers = [];
        let totalSelected = 0;
        
        for (const voucher of vouchers) {
          selectedVouchers.push(voucher);
          totalSelected += voucher.denomination;
          if (totalSelected >= price) break;
        }

        if (totalSelected < price) {
          throw new Error(`凭证余额不足，需要 ${price} A币，当前可用 ${totalSelected} A币`);
        }

        // 转移凭证给平台（SYSTEM）作为支付
        for (const voucher of selectedVouchers) {
          await voucherService.transferVoucher(
            {
              voucherId: voucher.id,
              toUserId: 'SYSTEM',
              toUserName: '游戏商店',
              note: `购买 ${product.name} - ${game?.name || '未知游戏'}`,
            },
            currentUser.id,
            currentUser.username || '玩家'
          );
        }

        // 如果有找零，创建新凭证还给用户
        const change = totalSelected - price;
        if (change > 0) {
          voucherService.createVoucher(
            {
              denomination: change,
              recipientId: currentUser.id,
              recipientName: currentUser.username || '玩家',
              metadata: {
                name: '购物找零',
                description: `购买 ${product.name} 的找零`,
                category: 'change',
              },
              note: '凭证支付找零',
            },
            'SYSTEM',
            '游戏商店'
          );
        }
      } else {
        // 使用钱包支付
        const currentBalance = balance[product.currency] || 0;
        if (currentBalance < product.price) {
          throw new Error(`${product.currency} 余额不足，需要 ${product.price}，当前 ${currentBalance}`);
        }

        // 扣除货币
        const spendResult = await skillGateway.execute('wallet', 'spend', {
          currency: product.currency,
          amount: product.price,
          reason: `购买 ${product.name}`,
        });

        if (!spendResult.success) {
          throw new Error(spendResult.error?.message || '支付失败');
        }
      }

      // 兑换商品：分配预生成的兑换码
      if (product.hostedItemId) {
        const purchaseResult = await redeemCodeService.purchaseCodes(
          product.hostedItemId,
          1,
          currentUser?.id || 'anonymous'
        );

        if (!purchaseResult.success) {
          throw new Error(purchaseResult.message || '获取兑换码失败');
        }

        const code = purchaseResult.codes[0];

        // 更新余额显示
        await loadBalance();
        loadVoucherBalance();

        // 显示成功（含兑换码）
        setPurchaseState({
          isPurchasing: false,
          productId: product.id,
          success: true,
          error: null,
          redeemCode: code,
        });

        // 5秒后重置状态
        setTimeout(() => {
          setPurchaseState(prev => ({ ...prev, success: false, productId: null, redeemCode: undefined }));
        }, 5000);
      } else {
        // 普通商品：添加到库存
        const addItemResult = await skillGateway.execute('inventory', 'addItem', {
          itemId: product.id,
          name: product.name,
          gameSource: gameId,
          gameName: game?.name || '未知游戏',
          category: product.category,
          quantity: 1,
          icon: product.icon,
        });

        if (!addItemResult.success) {
          throw new Error(addItemResult.error?.message || '添加道具失败');
        }

        // 更新余额显示
        await loadBalance();
        loadVoucherBalance();

        // 显示成功
        setPurchaseState({
          isPurchasing: false,
          productId: product.id,
          success: true,
          error: null,
        });

        // 3秒后重置状态
        setTimeout(() => {
          setPurchaseState(prev => ({ ...prev, success: false, productId: null }));
        }, 3000);
      }

    } catch (error) {
      setPurchaseState({
        isPurchasing: false,
        productId: product.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const addToCart = (product: StoreProduct) => {
    setCart([...cart, product]);
    setShowCart(true);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price, 0);
  };

  // 使用兑换码 - 跳转游戏（兼容旧兑换码，同时支持新道具凭证）
  const handleUseRedeemCode = (purchase: ItemVoucherPurchase) => {
    // 获取游戏链接
    const gameUrl = game?.externalUrl || `/game/${gameId}`;
    
    // 构建带有凭证信息的URL
    const url = new URL(gameUrl, window.location.origin);
    url.searchParams.set('itemVoucher', purchase.voucherId);
    url.searchParams.set('templateId', purchase.templateId);
    
    // 在新标签页打开游戏
    window.open(url.toString(), '_blank');
  };

  // 兑换道具凭证到游戏
  const handleRedeemItemVoucher = async (voucher: Voucher) => {
    if (purchaseState.isPurchasing) return;
    if (!currentUser?.id) return;

    setPurchaseState({
      isPurchasing: true,
      productId: voucher.id,
      success: false,
      error: null,
    });

    try {
      const result = voucherItemService.redeemItemVoucher({
        userId: currentUser.id,
        userName: currentUser.username || '玩家',
        voucherId: voucher.id,
        gameId: gameId!,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      // 刷新数据
      const userItemVouchers = voucherItemService.getUserItemVouchers(currentUser.id, gameId!);
      setMyItemVouchers(userItemVouchers);
      const purchases = voucherItemService.getUserPurchases(currentUser.id, gameId!);
      setMyPurchases(purchases);

      setPurchaseState({
        isPurchasing: false,
        productId: voucher.id,
        success: true,
        error: null,
      });

      setTimeout(() => {
        setPurchaseState(prev => ({ ...prev, success: false, productId: null }));
      }, 3000);
    } catch (error) {
      setPurchaseState({
        isPurchasing: false,
        productId: voucher.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  // 购买道具凭证
  const handlePurchaseRedeemItem = async (item: ItemVoucherTemplate) => {
    if (purchaseState.isPurchasing) return;
    if (!currentUser?.id) {
      setPurchaseState({
        isPurchasing: false,
        productId: item.id,
        success: false,
        error: '请先登录',
      });
      return;
    }

    setPurchaseState({
      isPurchasing: true,
      productId: item.id,
      success: false,
      error: null,
    });

    try {
      const result = await voucherItemService.purchaseItemVoucher({
        userId: currentUser.id,
        userName: currentUser.username || '玩家',
        gameId: gameId!,
        templateId: item.id,
        paymentMethod: itemPaymentMethod === 'voucher' ? 'voucher' : 'wallet',
        paymentCurrency: itemPaymentMethod === 'gameCoins' ? 'gameCoins' : undefined,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      // 刷新余额和数据
      await loadBalance();
      loadVoucherBalance();
      const items = voucherItemService.getItemTemplates(gameId!);
      setItemTemplates(items);
      const userItemVouchers = voucherItemService.getUserItemVouchers(currentUser.id, gameId!);
      setMyItemVouchers(userItemVouchers);
      const purchases = voucherItemService.getUserPurchases(currentUser.id, gameId!);
      setMyPurchases(purchases);

      // 触发钱包更新事件
      window.dispatchEvent(new CustomEvent('wallet-updated'));

      setPurchaseState({
        isPurchasing: false,
        productId: item.id,
        success: true,
        error: null,
      });

      setTimeout(() => {
        setPurchaseState(prev => ({ ...prev, success: false, productId: null }));
      }, 3000);
    } catch (error) {
      setPurchaseState({
        isPurchasing: false,
        productId: item.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  const categories = [
    { id: 'all', name: '全部', icon: 'fa-th-large' },
    { id: 'consumables', name: '消耗品', icon: 'fa-flask' },
    { id: 'weapons', name: '武器', icon: 'fa-khanda' },
    { id: 'armor', name: '防具', icon: 'fa-shield-alt' },
    { id: 'premium', name: '高级', icon: 'fa-crown' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">加载商店中...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-store text-6xl text-slate-600 mb-4"></i>
          <h2 className="text-2xl font-bold text-white mb-2">商店未找到</h2>
          <p className="text-slate-400 mb-4">该游戏可能没有商店功能</p>
          <Link
            to="/game-center"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            返回游戏中心
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-slate-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={`/game/${gameId}`}
                className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition-colors"
              >
                <i className="fa-solid fa-arrow-left"></i>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">
                  <i className="fa-solid fa-store text-purple-400 mr-2"></i>
                  {game.name} 商店
                </h1>
                <p className="text-sm text-slate-400">
                  {activeTab === 'products' && '购买道具，增强游戏体验'}
                  {activeTab === 'itemShop' && '购买道具凭证，在游戏中兑换获得道具'}
                  {activeTab === 'myItems' && '查看已购买的道具凭证'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* 开发者管理入口 */}
              <button
                onClick={() => navigate(`/voucher-system?tab=item-vouchers&gameId=${gameId}`)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/25"
              >
                <Settings className="w-4 h-4" />
                管理道具凭证
              </button>

              {/* 余额 */}
              <div className="flex items-center gap-3 bg-slate-700/50 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2" title="游戏币">
                  <i className="fa-solid fa-coins text-yellow-500"></i>
                  <span className="text-white font-medium">{balance.gameCoins || 0}</span>
                </div>
                <div className="w-px h-4 bg-slate-600"></div>
                <div className="flex items-center gap-2" title="A币（钱包）">
                  <i className="fa-solid fa-gem text-purple-500"></i>
                  <span className="text-white font-medium">{balance.aCoins || 0}</span>
                </div>
                <div className="w-px h-4 bg-slate-600"></div>
                <div className="flex items-center gap-2" title="A币（凭证）">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium">{voucherBalance.totalValue}</span>
                </div>
              </div>

              {/* 购物车 - 仅在商品标签页显示 */}
              {activeTab === 'products' && (
                <button
                  onClick={() => setShowCart(!showCart)}
                  className="relative w-10 h-10 rounded-lg bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white transition-colors"
                >
                  <i className="fa-solid fa-shopping-cart"></i>
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* 标签页导航 */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700/50">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'products'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Store className="w-4 h-4" />
              游戏道具
            </button>
            <button
              onClick={() => setActiveTab('itemShop')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'itemShop'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Ticket className="w-4 h-4" />
              道具凭证
              {itemTemplates.length > 0 && (
                <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {itemTemplates.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('myItems')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'myItems'
                  ? 'bg-green-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Package className="w-4 h-4" />
              我的凭证
              {(myItemVouchers.length + myPurchases.length) > 0 && (
                <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {myItemVouchers.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 购物车侧边栏 */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-16 bottom-0 w-80 bg-slate-800 border-l border-slate-700 z-40 overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">购物车</h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-slate-400 text-center py-8">购物车是空的</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cart.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <i className={`fa-solid ${item.icon} text-purple-400`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{item.name}</p>
                          <p className="text-purple-400 text-sm">{item.price} {item.currency}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-600 pt-4">
                    <div className="flex justify-between mb-4">
                      <span className="text-slate-400">总计</span>
                      <span className="text-white font-bold">{getTotalPrice()} coins</span>
                    </div>
                    <button
                      onClick={() => cart.forEach(item => handlePurchase(item))}
                      disabled={purchaseState.isPurchasing}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                    >
                      {purchaseState.isPurchasing ? '处理中...' : '结算'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="container mx-auto px-4 py-8">
        {/* 游戏道具标签页 */}
        {activeTab === 'products' && (
          <>
            {/* 分类标签 */}
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                    activeCategory === cat.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <i className={`fa-solid ${cat.icon}`}></i>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* 商品网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-slate-800 rounded-xl overflow-hidden border ${
                    product.featured ? 'border-purple-500/50 shadow-lg shadow-purple-500/20' : 'border-slate-700'
                  } hover:border-purple-500/30 transition-all group`}
                >
                  {/* 商品图片/图标 */}
                  <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center relative">
                    {product.featured && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-purple-500 rounded-full text-xs text-white font-medium">
                        推荐
                      </div>
                    )}
                    <i className={`fa-solid ${product.icon} text-6xl text-purple-400 group-hover:scale-110 transition-transform`}></i>
                  </div>

                  {/* 商品信息 */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
                    <p className="text-slate-400 text-sm mb-3">{product.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <i className={`fa-solid ${product.currency === 'aCoins' ? 'fa-gem text-purple-500' : 'fa-coins text-yellow-500'}`}></i>
                        <span className="text-xl font-bold text-white">{product.price}</span>
                      </div>
                      <span className="text-xs text-slate-500">库存: {product.quantity}</span>
                    </div>

                    {/* 支付方式选择 */}
                    <div className="flex items-center gap-2 mb-3 p-2 bg-slate-900/50 rounded-lg">
                      <button
                        onClick={() => setPaymentMethod('wallet')}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                          paymentMethod === 'wallet'
                            ? 'bg-purple-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                        title="使用钱包余额支付"
                      >
                        <Wallet className="w-3 h-3" />
                        钱包
                      </button>
                      <button
                        onClick={() => setPaymentMethod('voucher')}
                        disabled={voucherBalance.totalValue < (product.voucherPrice || product.price)}
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                          paymentMethod === 'voucher'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        } ${voucherBalance.totalValue < (product.voucherPrice || product.price) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="使用A币凭证支付"
                      >
                        <CreditCard className="w-3 h-3" />
                        凭证
                        {voucherBalance.totalValue >= (product.voucherPrice || product.price) && (
                          <span className="ml-0.5 text-[10px] bg-green-500/20 text-green-400 px-1 rounded">可用</span>
                        )}
                      </button>
                    </div>

                    {/* 购买按钮 */}
                    <button
                      onClick={() => handlePurchase(product)}
                      disabled={purchaseState.isPurchasing && purchaseState.productId === product.id}
                      className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                        purchaseState.success && purchaseState.productId === product.id
                          ? 'bg-green-600 text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-slate-600'
                      }`}
                    >
                      {purchaseState.isPurchasing && purchaseState.productId === product.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          处理中...
                        </>
                      ) : purchaseState.success && purchaseState.productId === product.id ? (
                        <>
                          <i className="fa-solid fa-check"></i>
                          {purchaseState.redeemCode ? '获得兑换码!' : '购买成功!'}
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-shopping-bag"></i>
                          购买
                        </>
                      )}
                    </button>

                    {/* 错误提示 */}
                    {purchaseState.error && purchaseState.productId === product.id && (
                      <p className="mt-2 text-sm text-red-400 text-center">{purchaseState.error}</p>
                    )}

                    {/* 兑换码显示 */}
                    {purchaseState.success && purchaseState.redeemCode && purchaseState.productId === product.id && (
                      <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-xs text-yellow-400 mb-1 text-center">您的兑换码</p>
                        <div className="flex items-center gap-2">
                          <p className="flex-1 text-center font-mono font-bold text-lg text-yellow-300 tracking-wider">
                            {purchaseState.redeemCode}
                          </p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(purchaseState.redeemCode!).catch(() => {});
                            }}
                            className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors"
                            title="复制兑换码"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 text-center mt-1">在游戏中输入此码兑换道具</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 空状态 */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-16">
                <i className="fa-solid fa-box-open text-6xl text-slate-600 mb-4"></i>
                <p className="text-slate-400">该分类暂无商品</p>
              </div>
            )}
          </>
        )}

        {/* 兑换商城标签页 */}
        {activeTab === 'itemShop' && (
          <>
            {itemTemplates.length === 0 ? (
              <div className="text-center py-16">
                <Ticket className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-bold text-white mb-2">暂无道具凭证商品</h3>
                <p className="text-slate-400 mb-6">游戏开发者尚未配置可购买的道具凭证</p>
                <div className="p-4 bg-slate-800/50 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-slate-400">
                    道具凭证系统将每个游戏道具铸造为独一无二的凭证，总量透明可控。
                    购买道具凭证后，可在游戏内兑换使用。
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* 说明卡片 */}
                <div className="mb-8 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-cyan-500/20 rounded-lg">
                      <Ticket className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">道具凭证商城</h3>
                      <p className="text-sm text-slate-400">
                        购买道具凭证后，您将获得一张唯一的数字凭证。在游戏中使用该凭证即可兑换对应道具。
                        凭证可在"我的道具"标签页查看和兑换。
                        {itemTemplates.some(t => t.supplyPolicy === 'limited') && (
                          <span className="block mt-1 text-amber-400">
                            ⚡ 注意：部分道具为限量发行，售完即止！
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 道具凭证商品网格 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {itemTemplates.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-cyan-500/30 transition-all group"
                    >
                      {/* 商品图标 */}
                      <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                          {item.name.charAt(0)}
                        </div>
                        {/* 稀有度标签 */}
                        {item.rarity && (
                          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                            item.rarity === 'legendary' ? 'bg-orange-500 text-white' :
                            item.rarity === 'rare' ? 'bg-purple-500 text-white' :
                            item.rarity === 'uncommon' ? 'bg-blue-500 text-white' :
                            'bg-slate-500 text-white'
                          }`}>
                            {item.rarity === 'legendary' ? '传说' :
                             item.rarity === 'rare' ? '稀有' :
                             item.rarity === 'uncommon' ? '精良' : '普通'}
                          </div>
                        )}
                        {/* 限量标签 */}
                        {item.supplyPolicy === 'limited' && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 rounded-full text-xs text-white font-medium">
                            限量
                          </div>
                        )}
                      </div>

                      {/* 商品信息 */}
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                        <p className="text-slate-400 text-sm mb-3">{item.description}</p>

                        {/* 道具类型标签 */}
                        {item.itemType && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                              {item.itemType === 'consumable' ? '消耗品' :
                               item.itemType === 'permanent' ? '永久道具' :
                               item.itemType === 'currency' ? '货币' :
                               item.itemType === 'buff' ? '增益' :
                               item.itemType === 'package' ? '礼包' : item.itemType}
                            </span>
                            {item.supplyPolicy === 'limited' && item.totalSupply && (
                              <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                                总量: {item.totalSupply}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Coins className="w-5 h-5 text-yellow-500" />
                            <span className="text-xl font-bold text-white">{item.pricing.price}</span>
                            <span className="text-xs text-slate-500">{item.pricing.currency}</span>
                          </div>
                          {item.supplyPolicy === 'limited' && (
                            <span className={`text-xs ${
                              item.totalSupply && (item.totalSupply - item.mintedCount) > 0
                                ? 'text-green-400' : 'text-red-400'
                            }`}>
                              剩余: {Math.max(0, (item.totalSupply || 0) - item.mintedCount)}
                            </span>
                          )}
                        </div>

                        {/* 支付方式选择 */}
                        <div className="flex items-center gap-2 mb-3 p-2 bg-slate-900/50 rounded-lg">
                          <button
                            onClick={() => setItemPaymentMethod('voucher')}
                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                              itemPaymentMethod === 'voucher'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                            title="使用testA币凭证支付"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            testA币
                            {voucherBalance.totalValue >= item.pricing.price && (
                              <span className="ml-0.5 text-[10px] bg-green-500/20 text-green-400 px-1 rounded">可用</span>
                            )}
                          </button>
                          <button
                            onClick={() => setItemPaymentMethod('gameCoins')}
                            disabled={(balance.gameCoins || 0) < item.pricing.price}
                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                              itemPaymentMethod === 'gameCoins'
                                ? 'bg-yellow-600 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            } ${(balance.gameCoins || 0) < item.pricing.price ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="使用游戏币支付"
                          >
                            <Coins className="w-3 h-3" />
                            游戏币
                            {(balance.gameCoins || 0) >= item.pricing.price && (
                              <span className="ml-0.5 text-[10px] bg-green-500/20 text-green-400 px-1 rounded">可用</span>
                            )}
                          </button>
                        </div>

                        {/* 兑换信息 */}
                        {item.gameEffect && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                            <span className="px-2 py-1 bg-slate-700 rounded">
                              兑换 {item.gameEffect.quantity} 个
                            </span>
                            <span className="px-2 py-1 bg-slate-700 rounded">
                              ID: {item.gameEffect.itemId}
                            </span>
                          </div>
                        )}

                        {/* 购买按钮 */}
                        <button
                          onClick={() => handlePurchaseRedeemItem(item)}
                          disabled={purchaseState.isPurchasing && purchaseState.productId === item.id}
                          className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                            purchaseState.success && purchaseState.productId === item.id
                              ? 'bg-green-600 text-white'
                              : item.supplyPolicy === 'limited' && item.totalSupply && item.mintedCount >= item.totalSupply
                                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                : 'bg-cyan-600 hover:bg-cyan-700 text-white disabled:bg-slate-600'
                          }`}
                        >
                          {purchaseState.isPurchasing && purchaseState.productId === item.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              处理中...
                            </>
                          ) : purchaseState.success && purchaseState.productId === item.id ? (
                            <>
                              <i className="fa-solid fa-check"></i>
                              购买成功!
                            </>
                          ) : item.supplyPolicy === 'limited' && item.totalSupply && item.mintedCount >= item.totalSupply ? (
                            <>
                              <i className="fa-solid fa-times"></i>
                              已售罄
                            </>
                          ) : (
                            <>
                              <Ticket className="w-4 h-4" />
                              购买
                            </>
                          )}
                        </button>

                        {/* 错误提示 */}
                        {purchaseState.error && purchaseState.productId === item.id && (
                          <p className="mt-2 text-sm text-red-400 text-center">{purchaseState.error}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* 我的道具标签页 */}
        {activeTab === 'myItems' && (
          <>
            {myItemVouchers.length === 0 && myPurchases.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-bold text-white mb-2">还没有道具凭证</h3>
                <p className="text-slate-400 mb-6">在兑换商城购买道具后将在这里查看凭证</p>
                <button
                  onClick={() => setActiveTab('itemShop')}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
                >
                  去兑换商城
                </button>
              </div>
            ) : (
              <>
                {/* 说明卡片 */}
                <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <Package className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">我的道具凭证</h3>
                      <p className="text-sm text-slate-400">
                        每个道具都是一张唯一的数字凭证，可验证、可追溯。
                        点击"兑换到游戏"按钮可将凭证发送到游戏中领取道具。
                        {myItemVouchers.length > 0 && (
                          <span className="block mt-1 text-green-400">
                            当前持有 {myItemVouchers.length} 个道具凭证
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 道具凭证列表 */}
                <div className="space-y-4">
                  {/* 待兑换的凭证 */}
                  {myItemVouchers.length > 0 && (
                    <>
                      <h4 className="text-white font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        待兑换的凭证 ({myItemVouchers.length})
                      </h4>
                      {myItemVouchers.map((voucher, index) => {
                        const customData = voucher.metadata?.customData || {};
                        const isConsumable = customData.consumable !== false;
                        const rarity = customData.rarity || 'common';
                        return (
                          <motion.div
                            key={voucher.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-slate-800 rounded-xl border border-slate-700 p-6"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold ${
                                  rarity === 'legendary' ? 'bg-gradient-to-br from-orange-500 to-red-500' :
                                  rarity === 'rare' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                                  rarity === 'uncommon' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                                  'bg-gradient-to-br from-slate-500 to-slate-600'
                                }`}>
                                  {voucher.metadata?.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white">{voucher.metadata?.name || '未知道具'}</h4>
                                  <p className="text-sm text-slate-400">{voucher.metadata?.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {/* 稀有度 */}
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      rarity === 'legendary' ? 'bg-orange-500/20 text-orange-400' :
                                      rarity === 'rare' ? 'bg-purple-500/20 text-purple-400' :
                                      rarity === 'uncommon' ? 'bg-blue-500/20 text-blue-400' :
                                      'bg-slate-500/20 text-slate-400'
                                    }`}>
                                      {rarity === 'legendary' ? '传说' :
                                       rarity === 'rare' ? '稀有' :
                                       rarity === 'uncommon' ? '精良' : '普通'}
                                    </span>
                                    {/* 类型 */}
                                    <span className="text-xs text-slate-500">
                                      {isConsumable ? '一次性消耗' : '永久持有'}
                                    </span>
                                    {/* 序列号 */}
                                    <span className="text-xs font-mono text-slate-500">
                                      #{voucher.serialNumber}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 属性展示 */}
                            {customData.attributes && Object.keys(customData.attributes).length > 0 && (
                              <div className="mt-4 pt-4 border-t border-slate-700">
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(customData.attributes).map(([key, val]) => (
                                    <div key={key} className="px-3 py-1 bg-slate-700 rounded-lg text-xs">
                                      <span className="text-slate-400">{key}: </span>
                                      <span className="text-white font-medium">{String(val)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 兑换码区域 */}
                            <div className="mt-4 pt-4 border-t border-slate-700">
                              {(() => {
                                // 查找该凭证对应的购买记录中的兑换码
                                const purchase = myPurchases.find(p => p.voucherId === voucher.id);
                                const code = purchase?.redeemCode;
                                if (!code) {
                                  // 没有兑换码的旧凭证：显示旧兑换按钮（兼容）
                                  return (
                                    <>
                                      <button
                                        onClick={() => handleRedeemItemVoucher(voucher)}
                                        disabled={purchaseState.isPurchasing && purchaseState.productId === voucher.id}
                                        className={`w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-green-500/25 ${
                                          purchaseState.isPurchasing && purchaseState.productId === voucher.id ? 'opacity-75 cursor-not-allowed' : ''
                                        }`}
                                      >
                                        {purchaseState.isPurchasing && purchaseState.productId === voucher.id ? (
                                          <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            兑换中...
                                          </>
                                        ) : (
                                          <>
                                            <Gamepad2 className="w-5 h-5" />
                                            {isConsumable ? '兑换并消耗凭证' : '兑换到游戏'}
                                            <ExternalLink className="w-4 h-4" />
                                          </>
                                        )}
                                      </button>
                                      <p className="text-xs text-slate-500 text-center mt-2">
                                        {isConsumable
                                          ? '兑换后凭证将被消耗，不可再次使用'
                                          : '兑换后凭证将转入游戏账户，可再次查看'}
                                      </p>
                                    </>
                                  );
                                }
                                return (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-lg border border-slate-600/50">
                                      <div>
                                        <p className="text-xs text-slate-400 mb-1">兑换码</p>
                                        <p className="text-lg font-mono font-bold tracking-wider text-yellow-400">
                                          {code}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(code).then(() => {
                                            setPurchaseState(prev => ({ ...prev, success: false, productId: voucher.id }));
                                            // 使用临时 DOM 反馈
                                            const el = document.querySelector(`[data-copy-for="${code}"]`);
                                            if (el) {
                                              el.innerHTML = '<span style="display:flex;align-items:center;gap:6px;"><svg class="w-4 h-4" style="color:#4ade80;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> 已复制</span>';
                                              setTimeout(() => {
                                                el.innerHTML = '<span style="display:flex;align-items:center;gap:6px;"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> 复制</span>';
                                              }, 2000);
                                            }
                                          }).catch(() => {
                                            // fallback
                                            const textarea = document.createElement('textarea');
                                            textarea.value = code;
                                            document.body.appendChild(textarea);
                                            textarea.select();
                                            document.execCommand('copy');
                                            document.body.removeChild(textarea);
                                          });
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                                        data-copy-for={code}
                                      >
                                        <Copy className="w-4 h-4" />
                                        复制
                                      </button>
                                    </div>
                                    <p className="text-xs text-slate-500 text-center">
                                      将此兑换码复制到游戏中，在充值或兑换页面输入即可领取 <span className="text-slate-300 font-medium">{voucher.metadata?.name}</span>
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>
                          </motion.div>
                        );
                      })}
                    </>
                  )}

                  {/* 已兑换的购买记录 */}
                  {myPurchases.filter(p => p.status === 'redeemed').length > 0 && (
                    <>
                      <h4 className="text-white font-semibold flex items-center gap-2 mt-8">
                        <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                        已兑换记录 ({myPurchases.filter(p => p.status === 'redeemed').length})
                      </h4>
                      {myPurchases.filter(p => p.status === 'redeemed').map((purchase) => {
                        const template = voucherItemService.getItemTemplate(purchase.templateId);
                        return (
                          <motion.div
                            key={purchase.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 opacity-75"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                                  <Package className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-white font-medium">{template?.name || '道具'}</p>
                                  <p className="text-xs text-slate-500">
                                    已于 {purchase.redeemedAt ? new Date(purchase.redeemedAt).toLocaleString() : '—'} 兑换
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded">
                                已兑换
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

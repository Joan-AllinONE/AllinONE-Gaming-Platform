import { 
  GameStore, 
  GameDeveloper, 
  GameStoreProduct, 
  GameStoreOrder, 
  GameStoreReview, 
  GameStorePromotion,
  GameStoreStats,
  ShoppingCartItem,
  GameStoreFilters,
  GameStoreOrderItem
} from '@/types/gameStore';
import { marketplaceService } from './marketplaceService';
import { economicIntegrationService } from './economicIntegrationService';

class GameStoreService {
  private stores: GameStore[] = [];
  private developers: GameDeveloper[] = [];
  private products: GameStoreProduct[] = [];
  private orders: GameStoreOrder[] = [];
  private reviews: GameStoreReview[] = [];
  private promotions: GameStorePromotion[] = [];

  constructor() {
    this.initializeMockData();
  }

  // 初始化模拟数据
  private initializeMockData(): void {
    // 创建游戏开发商
    const developers: GameDeveloper[] = [
      {
        id: 'dev_1',
        name: '腾讯游戏',
        logo: '/logos/tencent.png',
        description: '全球领先的游戏开发商，致力于为玩家提供优质的游戏体验',
        establishedDate: new Date('2003-01-01'),
        rating: 4.8,
        totalSales: 15000000,
        gameCount: 25,
        verified: true,
        contactInfo: {
          email: 'support@tencent.com',
          website: 'https://games.tencent.com',
          support: '400-670-0700'
        }
      },
      {
        id: 'dev_2',
        name: '网易游戏',
        logo: '/logos/netease.png',
        description: '创新驱动的游戏公司，专注于精品游戏开发',
        establishedDate: new Date('2001-06-01'),
        rating: 4.6,
        totalSales: 12000000,
        gameCount: 18,
        verified: true,
        contactInfo: {
          email: 'games@netease.com',
          website: 'https://game.netease.com',
          support: '400-188-163'
        }
      },
      {
        id: 'dev_3',
        name: 'miHoYo',
        logo: '/logos/mihoyo.png',
        description: '致力于为全世界的玩家创造和传递美好',
        establishedDate: new Date('2012-02-13'),
        rating: 4.9,
        totalSales: 8000000,
        gameCount: 8,
        verified: true,
        contactInfo: {
          email: 'cs@mihoyo.com',
          website: 'https://www.mihoyo.com',
          support: '400-821-0808'
        }
      }
    ];

    // 创建游戏商店
    const stores: GameStore[] = [
      {
        id: 'store_1',
        developerId: 'dev_1',
        developer: developers[0],
        name: '王者荣耀官方商店',
        description: '王者荣耀官方道具商店，提供最新最全的英雄皮肤和装备',
        banner: '/banners/wzry_banner.jpg',
        logo: '/logos/wzry_logo.png',
        theme: {
          primaryColor: '#1890ff',
          secondaryColor: '#722ed1',
          backgroundImage: '/backgrounds/wzry_bg.jpg'
        },
        rating: 4.8,
        totalProducts: 156,
        totalSales: 2500000,
        followers: 850000,
        isActive: true,
        createdAt: new Date(Date.now() - 86400000 * 365),
        updatedAt: new Date()
      },
      {
        id: 'store_2',
        developerId: 'dev_2',
        developer: developers[1],
        name: '梦幻西游藏宝阁',
        description: '梦幻西游官方交易平台，安全可靠的游戏道具交易',
        banner: '/banners/mhxy_banner.jpg',
        logo: '/logos/mhxy_logo.png',
        theme: {
          primaryColor: '#f5222d',
          secondaryColor: '#fa8c16',
          backgroundImage: '/backgrounds/mhxy_bg.jpg'
        },
        rating: 4.7,
        totalProducts: 89,
        totalSales: 1800000,
        followers: 620000,
        isActive: true,
        createdAt: new Date(Date.now() - 86400000 * 300),
        updatedAt: new Date()
      },
      {
        id: 'store_3',
        developerId: 'dev_3',
        developer: developers[2],
        name: '原神商店',
        description: '原神官方商店，提供角色、武器、圣遗物等各类道具',
        banner: '/banners/ys_banner.jpg',
        logo: '/logos/ys_logo.png',
        theme: {
          primaryColor: '#52c41a',
          secondaryColor: '#13c2c2',
          backgroundImage: '/backgrounds/ys_bg.jpg'
        },
        rating: 4.9,
        totalProducts: 234,
        totalSales: 3200000,
        followers: 1200000,
        isActive: true,
        createdAt: new Date(Date.now() - 86400000 * 200),
        updatedAt: new Date()
      }
    ];

    // 创建商品
    const products: GameStoreProduct[] = [
      // 王者荣耀商品
      {
        id: 'prod_1',
        storeId: 'store_1',
        store: stores[0],
        name: '李白-凤求凰',
        description: '传说品质皮肤，华丽的视觉效果和独特的技能特效',
        images: ['/products/libai_fengqiuhuang_1.jpg', '/products/libai_fengqiuhuang_2.jpg'],
        category: 'skin',
        rarity: 'legendary',
        price: 1688,
        originalPrice: 1888,
        currency: 'gameCoins',
        stock: 999,
        sold: 15420,
        rating: 4.9,
        reviewCount: 2341,
        gameTitle: '王者荣耀',
        gameVersion: '3.71.1.8',
        tags: ['传说皮肤', '李白', '限时优惠'],
        specifications: {
          heroName: '李白',
          skinType: '传说',
          releaseDate: '2023-12-01'
        },
        isActive: true,
        isFeatured: true,
        createdAt: new Date(Date.now() - 86400000 * 30),
        updatedAt: new Date()
      },
      {
        id: 'prod_2',
        storeId: 'store_1',
        store: stores[0],
        name: '貂蝉-仲夏夜之梦',
        description: '史诗品质皮肤，梦幻的仲夏夜主题设计',
        images: ['/products/diaochan_zhongxiaye_1.jpg'],
        category: 'skin',
        rarity: 'epic',
        price: 888,
        currency: 'gameCoins',
        stock: 999,
        sold: 8920,
        rating: 4.7,
        reviewCount: 1456,
        gameTitle: '王者荣耀',
        gameVersion: '3.71.1.8',
        tags: ['史诗皮肤', '貂蝉', '仲夏夜'],
        specifications: {
          heroName: '貂蝉',
          skinType: '史诗',
          releaseDate: '2023-11-15'
        },
        isActive: true,
        isFeatured: false,
        createdAt: new Date(Date.now() - 86400000 * 45),
        updatedAt: new Date()
      },
      // 原神商品
      {
        id: 'prod_3',
        storeId: 'store_3',
        store: stores[2],
        name: '雷电将军',
        description: '五星雷属性角色，稻妻的雷电将军，拥有强大的雷元素能力',
        images: ['/products/raiden_1.jpg', '/products/raiden_2.jpg'],
        category: 'character',
        rarity: 'legendary',
        price: 28800,
        currency: 'gameCoins',
        stock: 999,
        sold: 45600,
        rating: 4.8,
        reviewCount: 5234,
        gameTitle: '原神',
        gameVersion: '4.2.0',
        tags: ['五星角色', '雷属性', '稻妻'],
        specifications: {
          element: '雷',
          weapon: '长柄武器',
          rarity: '5星',
          region: '稻妻'
        },
        isActive: true,
        isFeatured: true,
        createdAt: new Date(Date.now() - 86400000 * 60),
        updatedAt: new Date()
      },
      {
        id: 'prod_4',
        storeId: 'store_3',
        store: stores[2],
        name: '薙草之稻光',
        description: '五星长柄武器，雷电将军的专属武器',
        images: ['/products/narukami_1.jpg'],
        category: 'weapon',
        rarity: 'legendary',
        price: 19800,
        currency: 'gameCoins',
        stock: 999,
        sold: 23400,
        rating: 4.6,
        reviewCount: 1890,
        gameTitle: '原神',
        gameVersion: '4.2.0',
        tags: ['五星武器', '长柄武器', '雷伤加成'],
        specifications: {
          weaponType: '长柄武器',
          baseAttack: 608,
          subStat: '元素充能效率',
          rarity: '5星'
        },
        isActive: true,
        isFeatured: false,
        createdAt: new Date(Date.now() - 86400000 * 50),
        updatedAt: new Date()
      },
      // 梦幻西游商品
      {
        id: 'prod_5',
        storeId: 'store_2',
        store: stores[1],
        name: '超级神兽-九色鹿',
        description: '稀有神兽，拥有强大的法术攻击能力和独特的技能',
        images: ['/products/jiuselu_1.jpg'],
        category: 'character',
        rarity: 'mythic',
        price: 50000,
        currency: 'cash',
        stock: 10,
        sold: 156,
        rating: 4.9,
        reviewCount: 89,
        gameTitle: '梦幻西游',
        gameVersion: '2023',
        tags: ['超级神兽', '法攻宠物', '稀有'],
        specifications: {
          level: 0,
          growth: 1.275,
          skills: ['高级法术波动', '高级法术连击', '高级魔心'],
          aptitude: {
            attack: 1560,
            defense: 1440,
            physique: 4500,
            mana: 2880,
            speed: 1200,
            dodge: 1680
          }
        },
        isActive: true,
        isFeatured: true,
        createdAt: new Date(Date.now() - 86400000 * 20),
        updatedAt: new Date()
      }
    ];

    this.developers = developers;
    this.stores = stores;
    this.products = products;
  }

  // 获取所有商店
  async getStores(): Promise<GameStore[]> {
    return this.stores.filter(store => store.isActive);
  }

  // 获取商店详情
  async getStoreById(storeId: string): Promise<GameStore | null> {
    return this.stores.find(store => store.id === storeId && store.isActive) || null;
  }

  // 获取商店的商品
  async getStoreProducts(storeId: string, filters?: GameStoreFilters): Promise<GameStoreProduct[]> {
    let products = this.products.filter(product => 
      product.storeId === storeId && product.isActive
    );

    if (filters) {
      products = this.applyFilters(products, filters);
    }

    return products;
  }

  // 获取所有商品（带筛选）
  async getProducts(filters?: GameStoreFilters): Promise<GameStoreProduct[]> {
    let products = this.products.filter(product => product.isActive);

    if (filters) {
      products = this.applyFilters(products, filters);
    }

    return products;
  }

  // 应用筛选条件
  private applyFilters(products: GameStoreProduct[], filters: GameStoreFilters): GameStoreProduct[] {
    let filtered = [...products];

    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.rarity) {
      filtered = filtered.filter(p => p.rarity === filters.rarity);
    }

    if (filters.currency) {
      filtered = filtered.filter(p => p.currency === filters.currency);
    }

    if (filters.gameTitle) {
      filtered = filtered.filter(p => p.gameTitle.includes(filters.gameTitle!));
    }

    if (filters.storeId) {
      filtered = filtered.filter(p => p.storeId === filters.storeId);
    }

    if (filters.rating) {
      filtered = filtered.filter(p => p.rating >= filters.rating!);
    }

    if (filters.priceRange) {
      filtered = filtered.filter(p => 
        p.price >= filters.priceRange!.min && p.price <= filters.priceRange!.max
      );
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.gameTitle.toLowerCase().includes(term) ||
        p.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // 排序
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'sales':
          filtered.sort((a, b) => b.sold - a.sold);
          break;
        case 'newest':
          filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          break;
        case 'oldest':
          filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          break;
      }
    }

    return filtered;
  }

  // 获取商品详情
  async getProductById(productId: string): Promise<GameStoreProduct | null> {
    return this.products.find(product => product.id === productId && product.isActive) || null;
  }

  // 获取推荐商品
  async getFeaturedProducts(limit: number = 10): Promise<GameStoreProduct[]> {
    return this.products
      .filter(product => product.isActive && product.isFeatured)
      .slice(0, limit);
  }

  // 创建订单 - 集成经济系统
  async createOrder(userId: string, cartItems: ShoppingCartItem[], paymentMethod: string): Promise<GameStoreOrder> {
    console.log('开始创建游戏商城订单:', { userId, itemCount: cartItems.length, paymentMethod });

    // 计算订单总金额和货币类型
    const orderItems: GameStoreOrderItem[] = cartItems.map(item => ({
      id: `order_item_${Date.now()}_${Math.random()}`,
      productId: item.productId,
      product: item.product,
      quantity: item.quantity,
      price: item.product.price,
      currency: item.product.currency
    }));

    const totalAmount = orderItems.reduce((total, item) => 
      total + (item.price * item.quantity), 0
    );

    // 假设所有商品使用相同货币（实际项目中可能需要分别处理）
    const currency = orderItems[0]?.currency || 'gameCoins';

    // 创建订单对象
    const order: GameStoreOrder = {
      id: `order_${Date.now()}`,
      buyerId: userId,
      buyerName: '当前用户',
      storeId: orderItems[0].product.storeId,
      store: orderItems[0].product.store,
      items: orderItems,
      totalAmount,
      currency,
      status: 'pending',
      paymentMethod,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      // 使用经济集成服务处理购买交易（解决钱包扣款和佣金记录问题）
      const transactionResult = await economicIntegrationService.processGameStorePurchase(
        userId,
        order,
        currency
      );

      console.log('经济系统处理结果:', transactionResult);

      if (!transactionResult.success) {
        throw new Error(transactionResult.message);
      }

      // 更新订单状态为已支付
      order.status = 'paid';
      order.updatedAt = new Date();

      // 为个人中心交易记录添加条目
      await marketplaceService.addTransactionRecord({
        buyerId: userId,
        sellerId: order.storeId,
        item: {
          id: order.items.map(i => i.productId).join(','),
          name: order.items.map(i => `${i.product.name} (x${i.quantity})`).join(', '),
          description: `从 ${order.store.name} 购买`,
          category: 'game_store_purchase',
          rarity: 'common',
        },
        price: transactionResult.itemAmount,
        commission: transactionResult.commissionAmount,
        totalAmount: transactionResult.totalPayment,
        commissionRate: transactionResult.commissionAmount / transactionResult.itemAmount,
        transactionType: 'game_store',
        currency: order.currency,
      });

      // 添加商品到用户库存
      for (const item of cartItems) {
        for (let i = 0; i < item.quantity; i++) {
          await marketplaceService.addItemToUserInventory(userId, {
            id: `${item.product.id}_${Date.now()}_${Math.random()}`,
            name: item.product.name,
            description: item.product.description,
            category: item.product.category,
            rarity: item.product.rarity,
            price: item.product.price,
            currency: item.product.currency,
            gameSource: item.product.gameTitle, // 使用gameSource而不是gameTitle
            sellerId: 'game-store',
            sellerName: item.product.store.name,
            listedAt: new Date(),
            views: 0 // 添加必需的views字段
          });
        }
      }

      // 保存订单
      this.orders.push(order);
      
      console.log('游戏商城订单创建成功:', {
        orderId: order.id,
        transactionId: transactionResult.transactionId,
        itemAmount: transactionResult.itemAmount,
        commissionAmount: transactionResult.commissionAmount,
        totalPayment: transactionResult.totalPayment,
        currency: order.currency
      });

      return order;

    } catch (error) {
      console.error('创建游戏商城订单失败:', error);
      
      // 订单创建失败，设置为取消状态
      order.status = 'cancelled';
      order.updatedAt = new Date();
      
      throw new Error(`订单创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 获取用户订单
  async getUserOrders(userId: string): Promise<GameStoreOrder[]> {
    return this.orders.filter(order => order.buyerId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // 获取商店统计
  async getGameStoreStats(): Promise<GameStoreStats> {
    const totalStores = this.stores.filter(store => store.isActive).length;
    const totalProducts = this.products.filter(product => product.isActive).length;
    const totalOrders = this.orders.length;
    const totalRevenue = this.orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // 计算热门分类
    const categoryStats = new Map<string, { count: number; revenue: number }>();
    this.products.forEach(product => {
      const existing = categoryStats.get(product.category) || { count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += product.price * product.sold;
      categoryStats.set(product.category, existing);
    });

    const topCategories = Array.from(categoryStats.entries())
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 计算热门商店
    const storeStats = new Map<string, { revenue: number; orderCount: number }>();
    this.orders.forEach(order => {
      const existing = storeStats.get(order.storeId) || { revenue: 0, orderCount: 0 };
      existing.revenue += order.totalAmount;
      existing.orderCount++;
      storeStats.set(order.storeId, existing);
    });

    const topStores = Array.from(storeStats.entries())
      .map(([storeId, stats]) => ({
        store: this.stores.find(s => s.id === storeId)!,
        ...stats
      }))
      .filter(item => item.store)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const recentOrders = this.orders
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      totalStores,
      totalProducts,
      totalOrders,
      totalRevenue,
      topCategories,
      topStores,
      recentOrders
    };
  }
}

export const gameStoreService = new GameStoreService();
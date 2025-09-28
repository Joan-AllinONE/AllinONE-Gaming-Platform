// 游戏电商中心相关类型定义
import { Currency } from './common';

export interface GameDeveloper {
  id: string;
  name: string;
  logo: string;
  description: string;
  establishedDate: Date;
  rating: number;
  totalSales: number;
  gameCount: number;
  verified: boolean;
  contactInfo: {
    email: string;
    website?: string;
    support?: string;
  };
}

export interface GameStore {
  id: string;
  developerId: string;
  developer: GameDeveloper;
  name: string;
  description: string;
  banner: string;
  logo: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundImage?: string;
  };
  rating: number;
  totalProducts: number;
  totalSales: number;
  followers: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameStoreProduct {
  id: string;
  storeId: string;
  store: GameStore;
  name: string;
  description: string;
  images: string[];
  category: 'weapon' | 'armor' | 'consumable' | 'material' | 'skin' | 'character' | 'currency' | 'bundle';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  price: number;
  originalPrice?: number; // 原价，用于显示折扣
  discountPrice?: number; // 折扣价
  currency: Currency;
  stock: number;
  sold: number;
  rating: number;
  reviewCount: number;
  gameTitle: string;
  gameVersion?: string;
  tags: string[];
  specifications: {
    level?: number;
    power?: number;
    durability?: number;
    [key: string]: any;
  };
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameStoreOrder {
  id: string;
  buyerId: string;
  buyerName: string;
  storeId: string;
  store: GameStore;
  items: GameStoreOrderItem[];
  totalAmount: number;
  currency: Currency;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentMethod: string;
  shippingAddress?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameStoreOrderItem {
  id: string;
  productId: string;
  product: GameStoreProduct;
  quantity: number;
  price: number;
  currency: Currency;
}

export interface GameStoreReview {
  id: string;
  productId: string;
  storeId: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
}

export interface GameStorePromotion {
  id: string;
  storeId: string;
  name: string;
  description: string;
  type: 'discount' | 'bundle' | 'flash_sale' | 'buy_one_get_one' | 'free_shipping';
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  applicableProducts: string[]; // 产品ID数组
  startDate: Date;
  endDate: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
}

export interface GameStoreStats {
  totalStores: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  topCategories: Array<{
    category: string;
    count: number;
    revenue: number;
  }>;
  topStores: Array<{
    store: GameStore;
    revenue: number;
    orderCount: number;
  }>;
  recentOrders: GameStoreOrder[];
}

export interface ShoppingCart {
  id: string;
  userId: string;
  items: ShoppingCartItem[];
  totalAmount: number;
  updatedAt: Date;
}

export interface ShoppingCartItem {
  id: string;
  productId: string;
  product: GameStoreProduct;
  quantity: number;
  addedAt: Date;
}

export interface GameStoreFilters {
  category?: string;
  rarity?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  currency?: Currency;
  gameTitle?: string;
  storeId?: string;
  rating?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'sales' | 'newest' | 'oldest';
  searchTerm?: string;
}
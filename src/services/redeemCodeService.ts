/**
 * 兑换码服务
 * 
 * 提供兑换码生成、验证、管理等功能
 */

import {
  HostedItem,
  RedeemCode,
  RedeemCodeStatus,
  ItemType,
  CreateHostedItemRequest,
  GenerateCodesRequest,
  GenerateCodesResponse,
  VerifyCodeRequest,
  VerifyCodeResponse,
  UseCodeRequest,
  UseCodeResponse,
  ItemStatistics,
  GameRedeemCodeOverview,
  RedeemCodePurchase,
} from '@/types/redeemCode';

// ==================== 工具函数 ====================

/**
 * 生成随机兑换码
 */
function generateRandomCode(
  length: number,
  charset: 'alphanumeric' | 'numeric' | 'alphabetic',
  caseSensitive: boolean
): string {
  const charsets = {
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    numeric: '0123456789',
    alphabetic: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  };
  
  let chars = charsets[charset];
  if (!caseSensitive) {
    chars = chars.toUpperCase();
  }
  
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== 本地存储键 ====================

const STORAGE_KEYS = {
  HOSTED_ITEMS: 'allinone_redeem_items',
  REDEEM_CODES: 'allinone_redeem_codes',
  PURCHASES: 'allinone_redeem_purchases',
};

// ==================== 兑换码服务类 ====================

class RedeemCodeService {
  // ==================== 托管道具管理 ====================

  /**
   * 创建托管道具
   */
  async createHostedItem(request: CreateHostedItemRequest): Promise<HostedItem> {
    const item: HostedItem = {
      id: `item-${generateId()}`,
      gameId: request.gameId,
      name: request.name,
      description: request.description,
      type: request.type,
      codeConfig: {
        length: request.codeConfig.length || 8,
        charset: request.codeConfig.charset || 'alphanumeric',
        caseSensitive: request.codeConfig.caseSensitive ?? false,
        prefix: request.codeConfig.prefix || '',
        expireDays: request.codeConfig.expireDays || 0,
        singleUse: request.codeConfig.singleUse ?? true,
      },
      inventory: {
        total: request.initialInventory,
        available: request.initialInventory,
        sold: 0,
        used: 0,
      },
      pricing: {
        price: request.pricing.price,
        currency: request.pricing.currency || 'ACOIN',
        discount: request.pricing.discount,
        bulkDiscount: request.pricing.bulkDiscount,
      },
      gameEffect: request.gameEffect,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 保存到本地存储
    const items = this.getHostedItems();
    items.push(item);
    localStorage.setItem(STORAGE_KEYS.HOSTED_ITEMS, JSON.stringify(items));

    // 自动生成兑换码
    if (request.initialInventory > 0) {
      await this.generateCodes({
        itemId: item.id,
        gameId: item.gameId,
        quantity: request.initialInventory,
      });
    }

    return item;
  }

  /**
   * 获取所有托管道具
   */
  getHostedItems(gameId?: string): HostedItem[] {
    const data = localStorage.getItem(STORAGE_KEYS.HOSTED_ITEMS);
    const items: HostedItem[] = data ? JSON.parse(data) : [];
    return gameId ? items.filter(i => i.gameId === gameId) : items;
  }

  /**
   * 获取单个托管道具
   */
  getHostedItem(itemId: string): HostedItem | null {
    const items = this.getHostedItems();
    return items.find(i => i.id === itemId) || null;
  }

  /**
   * 更新托管道具
   */
  async updateHostedItem(itemId: string, updates: Partial<HostedItem>): Promise<HostedItem | null> {
    const items = this.getHostedItems();
    const index = items.findIndex(i => i.id === itemId);
    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.HOSTED_ITEMS, JSON.stringify(items));
    return items[index];
  }

  /**
   * 删除托管道具
   */
  async deleteHostedItem(itemId: string): Promise<boolean> {
    const items = this.getHostedItems();
    const filtered = items.filter(i => i.id !== itemId);
    localStorage.setItem(STORAGE_KEYS.HOSTED_ITEMS, JSON.stringify(filtered));
    
    // 同时删除关联的兑换码
    const codes = this.getAllCodes();
    const filteredCodes = codes.filter(c => c.itemId !== itemId);
    localStorage.setItem(STORAGE_KEYS.REDEEM_CODES, JSON.stringify(filteredCodes));
    
    return true;
  }

  // ==================== 兑换码生成与管理 ====================

  /**
   * 生成兑换码
   */
  async generateCodes(request: GenerateCodesRequest): Promise<GenerateCodesResponse> {
    const item = this.getHostedItem(request.itemId);
    if (!item) {
      return { success: false, codes: [], generatedCount: 0, failedCount: request.quantity };
    }

    const codes: RedeemCode[] = [];
    const existingCodes = new Set(this.getAllCodes().map(c => c.code));
    
    const { prefix, length, charset, caseSensitive, expireDays } = item.codeConfig;
    
    let attempts = 0;
    const maxAttempts = request.quantity * 10; // 防止无限循环
    
    while (codes.length < request.quantity && attempts < maxAttempts) {
      attempts++;
      
      const codeStr = `${prefix}${generateRandomCode(length, charset, caseSensitive)}`;
      
      // 检查是否重复
      if (existingCodes.has(codeStr)) continue;
      
      const code: RedeemCode = {
        id: `code-${generateId()}`,
        code: codeStr,
        gameId: item.gameId,
        itemId: item.id,
        status: RedeemCodeStatus.UNUSED,
        createdAt: new Date().toISOString(),
        expiredAt: expireDays > 0 
          ? new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
        verifyCount: 0,
      };
      
      codes.push(code);
      existingCodes.add(codeStr);
    }

    // 保存兑换码
    const allCodes = this.getAllCodes();
    allCodes.push(...codes);
    localStorage.setItem(STORAGE_KEYS.REDEEM_CODES, JSON.stringify(allCodes));

    // 更新库存
    await this.updateHostedItem(item.id, {
      inventory: {
        ...item.inventory,
        total: item.inventory.total + codes.length,
        available: item.inventory.available + codes.length,
      },
    });

    return {
      success: true,
      codes,
      generatedCount: codes.length,
      failedCount: request.quantity - codes.length,
    };
  }

  /**
   * 获取所有兑换码
   */
  getAllCodes(): RedeemCode[] {
    const data = localStorage.getItem(STORAGE_KEYS.REDEEM_CODES);
    return data ? JSON.parse(data) : [];
  }

  /**
   * 获取指定道具的兑换码
   */
  getCodesByItem(itemId: string, status?: RedeemCodeStatus): RedeemCode[] {
    const codes = this.getAllCodes();
    return codes.filter(c => {
      if (c.itemId !== itemId) return false;
      if (status && c.status !== status) return false;
      return true;
    });
  }

  // ==================== 验证与使用（游戏方调用） ====================

  /**
   * 验证兑换码
   * 
   * 游戏方在游戏内调用此接口验证玩家输入的兑换码
   */
  async verifyCode(request: VerifyCodeRequest): Promise<VerifyCodeResponse> {
    const codes = this.getAllCodes();
    
    // 第一优先级：精确匹配 gameId + code
    let code = codes.find(c => 
      c.gameId === request.gameId && 
      c.code.toUpperCase() === request.code.toUpperCase()
    );

    // 降级搜索：仅按 code 搜索（gameId 可能因重新发布而变化）
    if (!code) {
      code = codes.find(c => c.code.toUpperCase() === request.code.toUpperCase());
      if (code && code.gameId !== request.gameId) {
        // 找到码但 gameId 不匹配，更新为当前 gameId（重新发布场景）
        code.gameId = request.gameId;
        this.updateCode(code);
      }
    }

    if (!code) {
      return { valid: false, message: '兑换码不存在' };
    }

    // 更新验证次数
    code.verifyCount++;
    code.lastVerifyAt = new Date().toISOString();
    this.updateCode(code);

    // 检查状态
    if (code.status === RedeemCodeStatus.USED) {
      return { valid: false, code, message: '兑换码已被使用' };
    }

    if (code.status === RedeemCodeStatus.EXPIRED || 
        (code.expiredAt && new Date(code.expiredAt) < new Date())) {
      code.status = RedeemCodeStatus.EXPIRED;
      this.updateCode(code);
      return { valid: false, code, message: '兑换码已过期' };
    }

    if (code.status === RedeemCodeStatus.DISABLED) {
      return { valid: false, code, message: '兑换码已禁用' };
    }

    // 获取道具信息
    const item = this.getHostedItem(code.itemId);
    if (!item) {
      return { valid: false, message: '道具信息不存在' };
    }

    return {
      valid: true,
      code,
      item,
      gameEffect: item.gameEffect,
    };
  }

  /**
   * 使用兑换码
   * 
   * 游戏方在验证通过后调用此接口标记兑换码为已使用
   */
  async useCode(request: UseCodeRequest): Promise<UseCodeResponse> {
    // 先验证
    const verifyResult = await this.verifyCode({
      code: request.code,
      gameId: request.gameId,
      userId: request.userId,
    });

    if (!verifyResult.valid) {
      return {
        success: false,
        code: request.code,
        message: verifyResult.message || '验证失败',
        usedAt: new Date().toISOString(),
      };
    }

    const code = verifyResult.code!;
    const item = verifyResult.item!;

    // 更新兑换码状态
    code.status = RedeemCodeStatus.USED;
    code.usedAt = new Date().toISOString();
    code.usedBy = request.userId;
    this.updateCode(code);

    // 更新库存统计
    await this.updateHostedItem(item.id, {
      inventory: {
        ...item.inventory,
        available: item.inventory.available - 1,
        used: item.inventory.used + 1,
      },
    });

    return {
      success: true,
      code: request.code,
      item,
      gameEffect: item.gameEffect,
      usedAt: code.usedAt,
    };
  }

  /**
   * 批量验证兑换码（用于导入功能）
   */
  async batchVerifyCodes(codes: string[], gameId: string): Promise<VerifyCodeResponse[]> {
    const results: VerifyCodeResponse[] = [];
    for (const code of codes) {
      const result = await this.verifyCode({ code, gameId, userId: 'batch-verify' });
      results.push(result);
    }
    return results;
  }

  // ==================== 购买相关 ====================

  /**
   * 购买兑换码
   * 
   * 玩家购买时调用，返回兑换码
   */
  async purchaseCodes(
    itemId: string,
    quantity: number,
    userId: string
  ): Promise<{ success: boolean; purchase?: RedeemCodePurchase; codes: string[]; message?: string }> {
    const item = this.getHostedItem(itemId);
    if (!item) {
      return { success: false, codes: [], message: '道具不存在' };
    }

    if (item.inventory.available < quantity) {
      return { success: false, codes: [], message: '库存不足' };
    }

    // 获取可用兑换码
    const availableCodes = this.getCodesByItem(itemId, RedeemCodeStatus.UNUSED);
    if (availableCodes.length < quantity) {
      return { success: false, codes: [], message: '可用兑换码不足' };
    }

    // 计算价格（含批量折扣）
    let totalPrice = item.pricing.price * quantity;
    let discount = 0;

    if (item.pricing.bulkDiscount) {
      for (const bd of item.pricing.bulkDiscount.sort((a, b) => b.minQuantity - a.minQuantity)) {
        if (quantity >= bd.minQuantity) {
          discount = totalPrice * bd.discount;
          totalPrice -= discount;
          break;
        }
      }
    }

    if (item.pricing.discount) {
      discount += totalPrice * item.pricing.discount;
      totalPrice -= totalPrice * item.pricing.discount;
    }

    // 分配兑换码
    const selectedCodes = availableCodes.slice(0, quantity);
    const now = new Date().toISOString();

    selectedCodes.forEach(code => {
      code.status = RedeemCodeStatus.SOLD;
      code.soldAt = now;
      code.soldTo = userId;
      this.updateCode(code);
    });

    // 更新库存
    await this.updateHostedItem(itemId, {
      inventory: {
        ...item.inventory,
        available: item.inventory.available - quantity,
        sold: item.inventory.sold + quantity,
      },
    });

    // 创建购买记录
    const purchase: RedeemCodePurchase = {
      id: `purchase-${generateId()}`,
      userId,
      gameId: item.gameId,
      itemId: item.id,
      codeIds: selectedCodes.map(c => c.id),
      codes: selectedCodes.map(c => c.code),
      quantity,
      unitPrice: item.pricing.price,
      totalPrice: item.pricing.price * quantity,
      currency: item.pricing.currency,
      discount,
      finalPrice: totalPrice,
      status: 'completed',
      paidAt: now,
      completedAt: now,
    };

    const purchases = this.getPurchases();
    purchases.push(purchase);
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));

    return {
      success: true,
      purchase,
      codes: selectedCodes.map(c => c.code),
    };
  }

  /**
   * 获取购买记录
   */
  getPurchases(userId?: string, gameId?: string): RedeemCodePurchase[] {
    const data = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    let purchases: RedeemCodePurchase[] = data ? JSON.parse(data) : [];
    
    if (userId) {
      purchases = purchases.filter(p => p.userId === userId);
    }
    if (gameId) {
      purchases = purchases.filter(p => p.gameId === gameId);
    }
    
    return purchases;
  }

  // ==================== 统计与概览 ====================

  /**
   * 获取道具统计
   */
  async getItemStatistics(itemId: string): Promise<ItemStatistics | null> {
    const item = this.getHostedItem(itemId);
    if (!item) return null;

    const codes = this.getCodesByItem(itemId);
    const purchases = this.getPurchases(undefined, item.gameId)
      .filter(p => p.itemId === itemId);

    const revenue = purchases.reduce((sum, p) => sum + p.finalPrice, 0);

    // 按日期分组统计
    const salesMap = new Map<string, { sold: number; revenue: number }>();
    purchases.forEach(p => {
      const date = p.paidAt.split('T')[0];
      const existing = salesMap.get(date) || { sold: 0, revenue: 0 };
      existing.sold += p.quantity;
      existing.revenue += p.finalPrice;
      salesMap.set(date, existing);
    });

    const salesTrend = Array.from(salesMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      itemId,
      totalCodes: codes.length,
      availableCodes: codes.filter(c => c.status === RedeemCodeStatus.UNUSED).length,
      soldCodes: codes.filter(c => c.status === RedeemCodeStatus.SOLD).length,
      usedCodes: codes.filter(c => c.status === RedeemCodeStatus.USED).length,
      expiredCodes: codes.filter(c => c.status === RedeemCodeStatus.EXPIRED).length,
      revenue,
      salesTrend,
    };
  }

  /**
   * 获取游戏兑换码总览
   */
  async getGameOverview(gameId: string): Promise<GameRedeemCodeOverview | null> {
    const items = this.getHostedItems(gameId);
    if (items.length === 0) return null;

    const codes = this.getAllCodes().filter(c => c.gameId === gameId);
    const purchases = this.getPurchases(undefined, gameId);

    const totalRevenue = purchases.reduce((sum, p) => sum + p.finalPrice, 0);

    const topItems = items
      .map(item => {
        const itemPurchases = purchases.filter(p => p.itemId === item.id);
        const sales = itemPurchases.reduce((sum, p) => sum + p.quantity, 0);
        const revenue = itemPurchases.reduce((sum, p) => sum + p.finalPrice, 0);
        return { itemId: item.id, name: item.name, sales, revenue };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      gameId,
      totalItems: items.length,
      totalCodes: codes.length,
      totalAvailable: codes.filter(c => c.status === RedeemCodeStatus.UNUSED).length,
      totalSold: codes.filter(c => c.status === RedeemCodeStatus.SOLD).length,
      totalUsed: codes.filter(c => c.status === RedeemCodeStatus.USED).length,
      totalRevenue: totalRevenue,
      recentSales: purchases.slice(-10).reverse(),
      topItems,
    };
  }

  // ==================== 私有方法 ====================

  private updateCode(updatedCode: RedeemCode): void {
    const codes = this.getAllCodes();
    const index = codes.findIndex(c => c.id === updatedCode.id);
    if (index !== -1) {
      codes[index] = updatedCode;
      localStorage.setItem(STORAGE_KEYS.REDEEM_CODES, JSON.stringify(codes));
    }
  }
}

// ==================== 导出单例 ====================

export const redeemCodeService = new RedeemCodeService();
export default redeemCodeService;

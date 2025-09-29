/**
 * 经济系统集成服务
 * 负责协调游戏商城、钱包服务、资金池和算力经济中心之间的数据流转
 * 确保所有经济活动的一致性和透明度
 */

import { walletService } from './walletService';
import { fundPoolService } from './fundPoolService';
import { gameStoreService } from './gameStoreService';
import { computingEconomicService } from './computingEconomicService';
import { WalletTransaction } from '@/types/wallet';
import { FundPoolTransaction } from '@/types/fundPool';
import { GameStoreOrder } from '@/types/gameStore';
import { Currency } from '@/types/common';

export interface EconomicTransaction {
  id: string;
  type: 'purchase' | 'sale' | 'reward' | 'commission' | 'exchange';
  userId: string;
  amount: number;
  currency: Currency;
  source: 'game_store' | 'player_market' | 'official_store' | 'system';
  description: string;
  relatedId?: string;
  timestamp: Date;
  
  // 佣金信息
  commission?: {
    rate: number;
    amount: number;
    currency: Currency;
  };
  
  // 影响的各个系统
  impacts: {
    wallet: boolean;
    fundPool: boolean;
    economicCenter: boolean;
  };
}

class EconomicIntegrationService {
  private readonly COMMISSION_RATES = {
    game_store: 0.30,      // 游戏电商30%佣金
    player_market: 0.05,   // 玩家市场5%佣金
    official_store: 0.15,  // 官方商店15%佣金
  };

  private readonly CURRENCY_EXCHANGE_RATES = {
    gameCoinsToRMB: 0.01,        // 1游戏币 = 0.01元
    computingToRMB: 0.1,    // 1算力 = 0.1元
    aCoinToRMB: 1,               // 1 A币 = 1元 (假设)
    cashToGameCoins: 100,        // 1元 = 100游戏币
    cashToComputing: 10,    // 1元 = 10算力
  };

  /**
   * 处理游戏商城购买交易
   * 这是解决问题1的核心方法：确保购买后钱包余额正确扣减
   */
  async processGameStorePurchase(
    userId: string,
    order: GameStoreOrder,
    paymentCurrency: Currency
  ): Promise<{
    success: boolean;
    transactionId: string;
    walletTransaction: WalletTransaction;
    commissionTransaction: WalletTransaction;
    fundPoolTransaction: FundPoolTransaction;
    totalPayment: number;
    itemAmount: number;
    commissionAmount: number;
    message: string;
  }> {
    const transactionId = this.generateTransactionId('GSP');
    
    try {
      console.log(`开始处理游戏商城购买交易: ${transactionId}`, {
        userId,
        orderId: order.id,
        totalAmount: order.totalAmount,
        paymentCurrency,
        items: order.items.length
      });

      // 1. 计算费用明细
      const itemAmount = order.totalAmount; // 商品原价
      const commissionRate = this.COMMISSION_RATES.game_store;
      const commissionAmount = itemAmount * commissionRate; // 平台佣金
      const totalPayment = itemAmount + commissionAmount; // 用户实际支付总额

      console.log('费用明细计算:', {
        itemAmount: itemAmount,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
        totalPayment: totalPayment
      });

      // 2. 验证用户余额是否足够支付总额
      const walletBalance = await walletService.getBalance();
      
      if (walletBalance[paymentCurrency] < totalPayment) {
        throw new Error(`余额不足！当前${this.getCurrencyName(paymentCurrency)}余额: ${walletBalance[paymentCurrency]}, 需要支付: ${totalPayment} (商品: ${itemAmount} + 佣金: ${commissionAmount})`);
      }

      // 3. 分别记录两笔钱包交易：商品费用和平台佣金
      
      // 3.1 扣除商品费用
      const itemTransaction = await this.deductFromWallet(
        userId,
        itemAmount,
        paymentCurrency,
        `游戏商城购买 - 订单${order.id}`,
        order.id
      );

      console.log('商品费用扣款完成:', itemTransaction);

      // 3.2 扣除平台佣金
      const commissionTransaction = await this.deductFromWallet(
        userId,
        commissionAmount,
        paymentCurrency,
        `平台佣金 - 订单${order.id} (${(commissionRate * 100).toFixed(1)}%)`,
        order.id
      );

      console.log('平台佣金扣款完成:', commissionTransaction);

      // 4. 记录佣金到资金池
      const fundPoolTransaction = await this.recordCommissionToFundPool(
        transactionId,
        commissionAmount,
        paymentCurrency,
        'game_store',
        userId,
        itemAmount
      );

      console.log('资金池佣金记录完成:', fundPoolTransaction);

      // 5. 更新算力经济中心数据
      await this.updateEconomicCenterData({
        type: 'purchase',
        userId,
        amount: totalPayment,
        currency: paymentCurrency,
        source: 'game_store',
        commission: commissionAmount
      });

      // 6. 触发系统事件通知
      this.emitEconomicEvent('game_store_purchase', {
        transactionId,
        userId,
        orderId: order.id,
        amount: totalPayment,
        currency: paymentCurrency,
        commission: commissionAmount,
        timestamp: new Date()
      });

      return {
        success: true,
        transactionId,
        walletTransaction: itemTransaction, // 返回商品交易记录
        commissionTransaction, // 新增佣金交易记录
        fundPoolTransaction,
        totalPayment,
        itemAmount,
        commissionAmount,
        message: `购买成功！商品费用: ${itemAmount}${this.getCurrencyName(paymentCurrency)}，平台佣金: ${commissionAmount}${this.getCurrencyName(paymentCurrency)}，总计: ${totalPayment}${this.getCurrencyName(paymentCurrency)}`
      };

    } catch (error) {
      console.error(`游戏商城购买交易失败 ${transactionId}:`, error);
      
      // 记录失败的交易到资金池（用于审计）
      await fundPoolService.recordExpense(
        0,
        'cash',
        'refund',
        `游戏商城购买失败退款 - 交易${transactionId}`,
        transactionId
      );

      throw new Error(`购买失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 处理玩家市场交易
   */
  async processPlayerMarketTransaction(
    buyerId: string,
    sellerId: string,
    amount: number,
    currency: Currency,
    itemId: string
  ): Promise<{
    success: boolean;
    transactionId: string;
    buyerTransaction: WalletTransaction;
    sellerTransaction: WalletTransaction;
    fundPoolTransaction: FundPoolTransaction;
  }> {
    const transactionId = this.generateTransactionId('PMT');
    
    try {
      // 计算佣金
      const commissionRate = this.COMMISSION_RATES.player_market;
      const commissionAmount = amount * commissionRate;
      const sellerReceiveAmount = amount - commissionAmount;

      // 买家扣款
      const buyerTransaction = await this.deductFromWallet(
        buyerId,
        amount,
        currency,
        `玩家市场购买 - 物品${itemId}`,
        itemId
      );

      // 卖家收款
      const sellerTransaction = await this.creditToWallet(
        sellerId,
        sellerReceiveAmount,
        currency,
        `玩家市场销售 - 物品${itemId}`,
        itemId
      );

      // 记录佣金到资金池
      const fundPoolTransaction = await this.recordCommissionToFundPool(
        transactionId,
        commissionAmount,
        currency,
        'player_market',
        buyerId,
        amount
      );

      // 更新算力经济中心
      await this.updateEconomicCenterData({
        type: 'trade',
        userId: buyerId,
        amount,
        currency,
        source: 'player_market',
        commission: commissionAmount
      });

      return {
        success: true,
        transactionId,
        buyerTransaction,
        sellerTransaction,
        fundPoolTransaction
      };

    } catch (error) {
      console.error(`玩家市场交易失败 ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * 处理游戏奖励发放
   */
  async processGameReward(
    userId: string,
    computingPower: number,
    gameCoins: number,
    gameId?: string
  ): Promise<{
    success: boolean;
    transactionId: string;
    transactions: WalletTransaction[];
  }> {
    const transactionId = this.generateTransactionId('GRW');
    const transactions: WalletTransaction[] = [];

    try {
      console.log(`处理游戏奖励 ${transactionId}:`, {
        userId,
        computingPower,
        gameCoins,
        gameId
      });

      // 发放算力奖励
      if (computingPower > 0) {
        const computingTransaction = await this.creditToWallet(
          userId,
          computingPower,
          'computing',
          `游戏奖励获得算力${gameId ? ` - 游戏${gameId}` : ''}`,
          gameId
        );
        transactions.push(computingTransaction);
      }

      // 发放游戏币奖励
      if (gameCoins > 0) {
        const coinTransaction = await this.creditToWallet(
          userId,
          gameCoins,
          'gameCoins',
          `游戏奖励获得游戏币${gameId ? ` - 游戏${gameId}` : ''}`,
          gameId
        );
        transactions.push(coinTransaction);
      }

      // 更新算力经济中心
      await this.updateEconomicCenterData({
        type: 'reward',
        userId,
        amount: computingPower + gameCoins * this.CURRENCY_EXCHANGE_RATES.gameCoinsToRMB / this.CURRENCY_EXCHANGE_RATES.computingToRMB,
        currency: 'computing',
        source: 'system'
      });

      // 触发奖励事件
      this.emitEconomicEvent('game_reward', {
        transactionId,
        userId,
        computingPower,
        gameCoins,
        gameId,
        timestamp: new Date()
      });

      return {
        success: true,
        transactionId,
        transactions
      };

    } catch (error) {
      console.error(`游戏奖励发放失败 ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * 获取用户经济概览
   */
  async getUserEconomicOverview(userId: string): Promise<{
    walletBalance: any;
    recentTransactions: WalletTransaction[];
    economicContribution: {
      totalSpent: number;
      totalEarned: number;
      commissionGenerated: number;
    };
    computingPowerBreakdown: any;
  }> {
    try {
      // 获取钱包余额
      const walletBalance = await walletService.getBalance();
      
      // 获取最近交易记录
      const recentTransactions = await walletService.getTransactions(20);
      
      // 计算经济贡献
      const economicContribution = this.calculateUserEconomicContribution(recentTransactions);
      
      // 获取算力分解
      const computingPowerBreakdown = await computingEconomicService.getPlayerEconomicProfile(userId);

      return {
        walletBalance,
        recentTransactions,
        economicContribution,
        computingPowerBreakdown
      };

    } catch (error) {
      console.error('获取用户经济概览失败:', error);
      throw error;
    }
  }

  /**
   * 获取平台经济健康度报告
   */
  async getPlatformEconomicHealth(): Promise<{
    fundPoolStatus: any;
    economicIndicators: any;
    riskAssessment: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
      recommendations: string[];
    };
  }> {
    try {
      // 获取资金池状态
      const fundPoolStatus = await fundPoolService.getPublicFundPoolData();
      
      // 获取经济指标
      const economicIndicators = await computingEconomicService.getComputingEconomicData();
      
      // 风险评估
      const riskAssessment = this.assessEconomicRisk(fundPoolStatus, economicIndicators);

      return {
        fundPoolStatus,
        economicIndicators,
        riskAssessment
      };

    } catch (error) {
      console.error('获取平台经济健康度失败:', error);
      throw error;
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 从钱包扣款
   */
  private async deductFromWallet(
    userId: string,
    amount: number,
    currency: Currency,
    description: string,
    relatedId?: string
  ): Promise<WalletTransaction> {
    // 验证余额
    const balance = await walletService.getBalance();
    if (balance[currency] < amount) {
      throw new Error(`${this.getCurrencyName(currency)}余额不足`);
    }

    // 执行扣款
    await walletService.addTransaction({
      type: 'expense',
      category: 'purchase',
      amount,
      currency,
      description,
      relatedId
    });

    // 返回交易记录
    const transactions = await walletService.getTransactions(1);
    return transactions[0];
  }

  /**
   * 向钱包充值
   */
  private async creditToWallet(
    userId: string,
    amount: number,
    currency: Currency,
    description: string,
    relatedId?: string
  ): Promise<WalletTransaction> {
    await walletService.addTransaction({
      type: 'income',
      category: currency === 'computing' ? 'computing_reward' : 'game_reward',
      amount,
      currency,
      description,
      relatedId
    });

    const transactions = await walletService.getTransactions(1);
    return transactions[0];
  }

  /**
   * 记录佣金到资金池
   * 这是解决问题2的核心方法：确保佣金正确记录到资金池
   */
  private async recordCommissionToFundPool(
    transactionId: string,
    commissionAmount: number,
    currency: Currency,
    source: 'game_store' | 'player_market' | 'official_store',
    userId: string,
    originalAmount: number
  ): Promise<FundPoolTransaction> {
    return await fundPoolService.recordCommissionIncome(
      transactionId,
      commissionAmount,
      currency,
      source,
      userId
    );
  }

  /**
   * 更新算力经济中心数据
   */
  private async updateEconomicCenterData(data: {
    type: 'purchase' | 'trade' | 'reward';
    userId: string;
    amount: number;
    currency: Currency;
    source: string;
    commission?: number;
  }): Promise<void> {
    try {
      // 这里应该调用算力经济中心的数据更新接口
      // 目前先记录日志，后续可以扩展为实际的数据更新
      console.log('更新算力经济中心数据:', data);
      
      // 可以在这里添加对算力经济中心的实际调用
      // await computingEconomicService.updateEconomicData(data);
      
    } catch (error) {
      console.error('更新算力经济中心数据失败:', error);
      // 不抛出错误，避免影响主要交易流程
    }
  }

  /**
   * 发送经济事件通知
   */
  private emitEconomicEvent(eventType: string, data: any): void {
    try {
      // 发送自定义事件，供其他组件监听
      window.dispatchEvent(new CustomEvent(`economic-${eventType}`, {
        detail: data
      }));
      
      console.log(`经济事件发送: ${eventType}`, data);
    } catch (error) {
      console.error('发送经济事件失败:', error);
    }
  }

  /**
   * 生成交易ID
   */
  private generateTransactionId(prefix: string): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * 获取货币名称
   */
  private getCurrencyName(currency: Currency): string {
    switch (currency) {
      case 'cash': return '现金';
      case 'gameCoins': return '游戏币';
      case 'computing': return '算力';
      case 'aCoins': return 'A币';
      default: return currency;
    }
  }

  /**
   * 计算用户经济贡献
   */
  private calculateUserEconomicContribution(transactions: WalletTransaction[]): {
    totalSpent: number;
    totalEarned: number;
    commissionGenerated: number;
  } {
    let totalSpent = 0;
    let totalEarned = 0;
    let commissionGenerated = 0;

    transactions.forEach(tx => {
      const value = this.convertToRMB(tx.amount, tx.currency);
      
      if (tx.type === 'expense') {
        totalSpent += value;
        // 估算产生的佣金（基于不同来源的佣金率）
        if (tx.category === 'purchase') {
          commissionGenerated += value * 0.15; // 平均佣金率
        }
      } else {
        totalEarned += value;
      }
    });

    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalEarned: Math.round(totalEarned * 100) / 100,
      commissionGenerated: Math.round(commissionGenerated * 100) / 100
    };
  }

  /**
   * 转换为人民币价值
   */
  private convertToRMB(amount: number, currency: Currency): number {
    switch (currency) {
      case 'cash': return amount;
      case 'gameCoins': return amount * this.CURRENCY_EXCHANGE_RATES.gameCoinsToRMB;
      case 'computing': return amount * this.CURRENCY_EXCHANGE_RATES.computingToRMB;
      case 'aCoins': return amount * this.CURRENCY_EXCHANGE_RATES.aCoinToRMB;
      default: return amount;
    }
  }

  /**
   * 评估经济风险
   */
  private assessEconomicRisk(fundPoolData: any, economicData: any): {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  } {
    const factors: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // 资金池健康度检查
    if (fundPoolData.currentBalance.totalValue < 1000) {
      factors.push('资金池余额过低');
      recommendations.push('增加平台收入来源');
      riskScore += 30;
    }

    // 经济活跃度检查
    if (economicData.activeComputingNodes < 1000) {
      factors.push('活跃节点数量不足');
      recommendations.push('提升用户参与度');
      riskScore += 20;
    }

    // 确定风险等级
    let level: 'low' | 'medium' | 'high' = 'low';
    if (riskScore >= 50) level = 'high';
    else if (riskScore >= 25) level = 'medium';

    if (factors.length === 0) {
      factors.push('经济系统运行正常');
      recommendations.push('继续保持当前运营策略');
    }

    return { level, factors, recommendations };
  }
}

export const economicIntegrationService = new EconomicIntegrationService();
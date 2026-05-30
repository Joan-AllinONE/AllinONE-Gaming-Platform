/**
 * AllinONE Skill 系统 - 钱包 Skill
 * 统一钱包管理：余额查询、交易记录、货币兑换
 */

import { BaseSkill } from '../BaseSkill';
import {
  SkillDefinition,
  SkillContext,
  JSONSchema,
} from '../types';
import { SkillErrors } from '../errors';
import type { WalletBalance, WalletTransaction, WalletStats, ExchangeRate, GameCoinsSummary } from '@/types/wallet';
import type { GameCoinType } from '@/types/common';
import { voucherService } from '@/voucher-system';
import { algorithmVoucherService, VoucherSourceType } from '@/voucher-system';

// ==================== Skill 定义 ====================

const walletSkillDefinition: SkillDefinition = {
  name: 'wallet',
  displayName: '钱包服务',
  version: '1.0.0',
  description: '统一钱包管理服务，支持多币种余额查询、交易记录、货币兑换',
  requiredPermissions: [],
  dependencies: ['auth'],
  actions: [],
  events: [
    'wallet.balance.changed',     // 余额变化
    'wallet.transaction.created', // 交易创建
    'wallet.exchange.completed',  // 兑换完成
    'wallet.reward.received',     // 收到奖励
  ],
};

// ==================== 辅助类型 ====================

export type CurrencyType = 'cash' | 'gameCoins' | 'newDayGameCoins' | 'computingPower' | 'aCoins';

export interface TransferParams {
  toUserId: string;
  currency: CurrencyType;
  amount: number;
  description?: string;
}

export interface ExchangeParams {
  fromCurrency: CurrencyType;
  toCurrency: CurrencyType;
  amount: number;
}

export interface RewardParams {
  computingPower?: number;
  gameCoins?: number;
  aCoins?: number;
  gameId?: string;
  description?: string;
}

// ==================== Wallet Skill 实现 ====================

export class WalletSkill extends BaseSkill {
  private readonly STORAGE_KEY = 'wallet_data';
  private readonly EXCHANGE_RATES_KEY = 'exchange_rates';
  
  // 默认汇率
  private readonly DEFAULT_EXCHANGE_RATES: ExchangeRate = {
    gameCoinsToRMB: 0.01,
    newDayGameCoinsToRMB: 0.01,
    computingPowerToRMB: 0.001,
    gameCoinsToNewDay: 1,
    newDayToGameCoins: 1,
    lastUpdated: new Date()
  };

  constructor() {
    super(walletSkillDefinition);
  }

  async onInitialize(): Promise<void> {
    await this.initializeWalletData();
    this.registerActions();
  }

  private registerActions(): void {
    // 获取余额
    this.registerAction(
      'getBalance',
      this.getBalance.bind(this),
      {
        displayName: '获取余额',
        description: '获取用户钱包所有币种余额',
        paramsSchema: { type: 'object' },
        returnsSchema: { type: 'object' },
        requiredPermissions: ['wallet:read:balance'],
        readonly: true,
        idempotent: true,
      }
    );

    // 获取交易记录
    this.registerAction(
      'getTransactions',
      this.getTransactions.bind(this),
      {
        displayName: '获取交易记录',
        description: '获取用户交易历史',
        paramsSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 50 },
            offset: { type: 'number', default: 0 },
            currency: { type: 'string' },
            type: { type: 'string', enum: ['income', 'expense'] },
          },
        },
        returnsSchema: { type: 'array' },
        requiredPermissions: ['wallet:read:transactions'],
        readonly: true,
        idempotent: true,
      }
    );

    // 获取统计信息
    this.registerAction(
      'getStats',
      this.getStats.bind(this),
      {
        displayName: '获取统计',
        description: '获取钱包统计信息（收入/支出）',
        paramsSchema: { type: 'object' },
        returnsSchema: { type: 'object' },
        requiredPermissions: ['wallet:read:stats'],
        readonly: true,
        idempotent: true,
      }
    );

    // 转账
    this.registerAction(
      'transfer',
      this.transfer.bind(this),
      {
        displayName: '转账',
        description: '向其他用户转账',
        paramsSchema: {
          type: 'object',
          properties: {
            toUserId: { type: 'string' },
            currency: { type: 'string' },
            amount: { type: 'number', minimum: 0.01 },
            description: { type: 'string' },
          },
          required: ['toUserId', 'currency', 'amount'],
        },
        returnsSchema: { type: 'object' },
        requiredPermissions: ['wallet:write:transfer'],
        readonly: false,
        idempotent: false,
      }
    );

    // 货币兑换
    this.registerAction(
      'exchange',
      this.exchange.bind(this),
      {
        displayName: '货币兑换',
        description: '在支持的货币间进行兑换',
        paramsSchema: {
          type: 'object',
          properties: {
            fromCurrency: { type: 'string' },
            toCurrency: { type: 'string' },
            amount: { type: 'number', minimum: 0.01 },
          },
          required: ['fromCurrency', 'toCurrency', 'amount'],
        },
        returnsSchema: { type: 'object' },
        requiredPermissions: ['wallet:write:exchange'],
        readonly: false,
        idempotent: false,
      }
    );

    // 充值
    this.registerAction(
      'recharge',
      this.recharge.bind(this),
      {
        displayName: '充值',
        description: '充值现金',
        paramsSchema: {
          type: 'object',
          properties: {
            amount: { type: 'number', minimum: 1 },
            method: { type: 'string', enum: ['支付宝', '微信', '银行卡'] },
          },
          required: ['amount'],
        },
        returnsSchema: { type: 'object' },
        requiredPermissions: ['wallet:write:recharge'],
        readonly: false,
        idempotent: false,
      }
    );

    // 消费
    this.registerAction(
      'spend',
      this.spend.bind(this),
      {
        displayName: '消费',
        description: '从钱包扣除金额',
        paramsSchema: {
          type: 'object',
          properties: {
            amount: { type: 'number', minimum: 0.01 },
            currency: { type: 'string' },
            description: { type: 'string' },
            relatedId: { type: 'string' },
          },
          required: ['amount', 'currency'],
        },
        returnsSchema: { type: 'object' },
        requiredPermissions: ['wallet:write:spend'],
        readonly: false,
        idempotent: false,
      }
    );

    // 发放奖励
    this.registerAction(
      'reward',
      this.reward.bind(this),
      {
        displayName: '发放奖励',
        description: '发放游戏奖励（算力和游戏币）',
        paramsSchema: {
          type: 'object',
          properties: {
            computingPower: { type: 'number', default: 0 },
            gameCoins: { type: 'number', default: 0 },
            gameId: { type: 'string' },
            description: { type: 'string' },
          },
        },
        returnsSchema: { type: 'object' },
        requiredPermissions: ['wallet:write:reward'],
        readonly: false,
        idempotent: false,
      }
    );

    // 获取汇率
    this.registerAction(
      'getExchangeRates',
      this.getExchangeRates.bind(this),
      {
        displayName: '获取汇率',
        description: '获取货币间汇率',
        paramsSchema: { type: 'object' },
        returnsSchema: { type: 'object' },
        requiredPermissions: ['wallet:read:rates'],
        readonly: true,
        idempotent: true,
      }
    );

    // 获取游戏币汇总
    this.registerAction(
      'getGameCoinsSummary',
      this.getGameCoinsSummary.bind(this),
      {
        displayName: '游戏币汇总',
        description: '获取所有游戏币类型汇总',
        paramsSchema: { type: 'object' },
        returnsSchema: { type: 'object' },
        requiredPermissions: ['wallet:read:balance'],
        readonly: true,
        idempotent: true,
      }
    );

    // 兑换游戏币
    this.registerAction(
      'exchangeGameCoins',
      this.exchangeGameCoins.bind(this),
      {
        displayName: '兑换游戏币',
        description: '在不同游戏币间兑换',
        paramsSchema: {
          type: 'object',
          properties: {
            fromType: { type: 'string', enum: ['gameCoins', 'newDayGameCoins'] },
            toType: { type: 'string', enum: ['gameCoins', 'newDayGameCoins'] },
            amount: { type: 'number', minimum: 1 },
          },
          required: ['fromType', 'toType', 'amount'],
        },
        returnsSchema: { type: 'object' },
        requiredPermissions: ['wallet:write:exchange'],
        readonly: false,
        idempotent: false,
      }
    );
  }

  // ==================== 动作实现 ====================

  private async getBalance(_params: any, context: SkillContext): Promise<WalletBalance> {
    const walletData = await this.getWalletData();
    const balance = walletData.balance;
    
    // 从凭证系统获取用户凭证余额（双轨系统）
    try {
      const voucherUserId = localStorage.getItem('voucher_guest_id');
      const userId = (context.userId && context.userId !== 'anonymous') ? context.userId : (voucherUserId || 'anonymous');
      const userVouchers = voucherService.getUserVouchers(userId);
      
      // 即时发放型凭证
      const instantVouchers = userVouchers.filter(
        v => v.status === 'active' && v.sourceType === VoucherSourceType.INSTANT
      );
      balance.instantVouchers = instantVouchers.reduce((sum, v) => sum + v.denomination, 0);
      balance.instantVoucherCount = instantVouchers.length;
      
      // 计算分配型凭证（算法型）
      const algorithmVouchers = userVouchers.filter(
        v => v.status === 'active' && v.sourceType === VoucherSourceType.ALGORITHM
      );
      balance.algorithmVouchers = algorithmVouchers.reduce((sum, v) => sum + v.denomination, 0);
      balance.algorithmVoucherCount = algorithmVouchers.length;
      
      // 保持向后兼容的总额
      balance.vouchers = balance.instantVouchers + balance.algorithmVouchers;
      balance.voucherCount = balance.instantVoucherCount + balance.algorithmVoucherCount;
      
    } catch (error) {
      console.warn('[WalletSkill] 获取凭证余额失败:', error);
      balance.vouchers = 0;
      balance.voucherCount = 0;
      balance.instantVouchers = 0;
      balance.instantVoucherCount = 0;
      balance.algorithmVouchers = 0;
      balance.algorithmVoucherCount = 0;
    }
    
    // 重新计算总价值
    balance.totalValue = await this.calculateTotalValue(balance);
    balance.lastUpdated = new Date();

    // 非负兜底
    balance.computingPower = Math.max(balance.computingPower, 0);
    balance.gameCoins = Math.max(balance.gameCoins, 0);
    
    walletData.balance = balance;
    this.saveWalletData(walletData);
    
    return balance;
  }

  private async getTransactions(
    params: { limit?: number; offset?: number; currency?: string; type?: 'income' | 'expense' },
    _context: SkillContext
  ): Promise<WalletTransaction[]> {
    const walletData = await this.getWalletData();
    let transactions = walletData.transactions || [];

    // 过滤
    if (params.currency) {
      transactions = transactions.filter((tx: WalletTransaction) => tx.currency === params.currency);
    }
    if (params.type) {
      transactions = transactions.filter((tx: WalletTransaction) => tx.type === params.type);
    }

    // 分页
    const offset = params.offset || 0;
    const limit = params.limit || 50;
    return transactions.slice(offset, offset + limit);
  }

  private async getStats(_params: any, _context: SkillContext): Promise<WalletStats> {
    const walletData = await this.getWalletData();
    walletData.stats = this.recomputeStats(walletData);
    this.saveWalletData(walletData);
    return walletData.stats;
  }

  private async transfer(params: TransferParams, context: SkillContext): Promise<any> {
    const { toUserId, currency, amount, description } = params;

    // 检查余额
    const balance = await this.getBalance({}, context);
    if (balance[currency] < amount) {
      throw SkillErrors.insufficientBalance(currency, amount, balance[currency]);
    }

    // 扣除发送方余额
    await this.addTransaction({
      type: 'expense',
      category: 'transfer',
      amount,
      currency,
      description: `转账给 ${toUserId}: ${description || ''}`,
      relatedId: toUserId,
    } as any, context);

    // 发布事件
    this.emit('wallet.transfer.sent', { toUserId, currency, amount }, context);

    return {
      success: true,
      transactionId: this.generateId(),
      amount,
      currency,
      toUserId,
    };
  }

  private async exchange(params: ExchangeParams, context: SkillContext): Promise<any> {
    const { fromCurrency, toCurrency, amount } = params;

    if (fromCurrency === toCurrency) {
      throw SkillErrors.invalidParamValue('toCurrency', toCurrency, '不能与源货币相同');
    }

    const balance = await this.getBalance({}, context);
    
    if (balance[fromCurrency] < amount) {
      throw SkillErrors.insufficientBalance(fromCurrency, amount, balance[fromCurrency]);
    }

    const rates = this.getRates();
    const result = this.calculateExchange(fromCurrency, toCurrency, amount, rates);

    // 扣除源货币
    await this.addTransaction({
      type: 'expense',
      category: 'exchange',
      amount,
      currency: fromCurrency,
      description: `兑换为 ${toCurrency}`,
    } as any, context);

    // 增加目标货币
    await this.addTransaction({
      type: 'income',
      category: 'exchange',
      amount: result.receivedAmount,
      currency: toCurrency,
      description: `从 ${fromCurrency} 兑换获得 (汇率: ${result.rate.toFixed(4)})`,
    } as any, context);

    // 发布事件
    this.emit('wallet.exchange.completed', {
      from: { currency: fromCurrency, amount },
      to: { currency: toCurrency, amount: result.receivedAmount },
      rate: result.rate,
    }, context);

    return {
      success: true,
      from: { currency: fromCurrency, amount },
      to: { currency: toCurrency, amount: result.receivedAmount },
      rate: result.rate,
    };
  }

  private async recharge(
    params: { amount: number; method?: string },
    context: SkillContext
  ): Promise<any> {
    const { amount, method = '支付宝' } = params;

    await this.addTransaction({
      type: 'income',
      category: 'recharge',
      amount,
      currency: 'cash',
      description: `通过 ${method} 充值`,
    } as any, context);

    return {
      success: true,
      amount,
      method,
    };
  }

  private async spend(
    params: { amount: number; currency: CurrencyType; description?: string; relatedId?: string },
    context: SkillContext
  ): Promise<any> {
    const { amount, currency, description, relatedId } = params;

    const balance = await this.getBalance({}, context);
    if (balance[currency] < amount) {
      throw SkillErrors.insufficientBalance(currency, amount, balance[currency]);
    }

    await this.addTransaction({
      type: 'expense',
      category: 'purchase',
      amount,
      currency,
      description: description || '消费',
      relatedId,
    } as any, context);

    return {
      success: true,
      amount,
      currency,
      remaining: balance[currency] - amount,
    };
  }

  private async reward(params: RewardParams, context: SkillContext): Promise<any> {
    const { computingPower, gameCoins, aCoins, gameId, description } = params;

    if (computingPower && computingPower > 0) {
      await this.addTransaction({
        type: 'income',
        category: 'computing_reward',
        amount: computingPower,
        currency: 'computingPower',
        description: description || '游戏奖励获得算力',
        relatedId: gameId,
      } as any, context);
    }

    if (gameCoins && gameCoins > 0) {
      await this.addTransaction({
        type: 'income',
        category: 'game_reward',
        amount: gameCoins,
        currency: 'gameCoins',
        description: description || '游戏奖励获得游戏币',
        relatedId: gameId,
      } as any, context);
    }

    if (aCoins && aCoins > 0) {
      await this.addTransaction({
        type: 'income',
        category: 'acoin_reward',
        amount: aCoins,
        currency: 'aCoins',
        description: description || '游戏奖励获得A币',
        relatedId: gameId,
      } as any, context);
    }

    // 发布奖励事件
    this.emit('wallet.reward.received', {
      computingPower,
      gameCoins,
      aCoins,
      gameId,
    }, context);

    return {
      success: true,
      received: { computingPower, gameCoins, aCoins },
    };
  }

  private async getExchangeRates(_params: any, _context: SkillContext): Promise<ExchangeRate> {
    return this.getRates();
  }

  private async getGameCoinsSummary(_params: any, _context: SkillContext): Promise<GameCoinsSummary> {
    const balance = await this.getBalance({}, {} as SkillContext);
    const rates = this.getRates();

    const types: GameCoinType[] = [
      {
        key: 'gameCoins',
        name: 'AllinONE 游戏币',
        platform: 'AllinONE',
        icon: 'fa-gamepad',
        balance: balance.gameCoins,
      },
      {
        key: 'newDayGameCoins',
        name: 'New Day 游戏币',
        platform: 'New Day',
        icon: 'fa-sun',
        balance: balance.newDayGameCoins,
      },
    ];

    return {
      total: balance.gameCoins + balance.newDayGameCoins,
      types,
      exchangeRates: {
        gameCoinsToNewDay: rates.gameCoinsToNewDay || 1,
        newDayToGameCoins: rates.newDayToGameCoins || 1,
      },
    };
  }

  private async exchangeGameCoins(
    params: { fromType: 'gameCoins' | 'newDayGameCoins'; toType: 'gameCoins' | 'newDayGameCoins'; amount: number },
    context: SkillContext
  ): Promise<any> {
    const { fromType, toType, amount } = params;

    if (fromType === toType) {
      return { success: false, message: '不能兑换相同类型的货币', received: 0 };
    }

    const balance = await this.getBalance({}, context);
    
    if (balance[fromType] < amount) {
      return {
        success: false,
        message: `${fromType === 'gameCoins' ? 'AllinONE' : 'New Day'} 游戏币余额不足`,
        received: 0,
      };
    }

    const rates = this.getRates();
    let exchangeRate = 1;
    let receivedAmount = amount;

    if (fromType === 'gameCoins' && toType === 'newDayGameCoins') {
      exchangeRate = rates.gameCoinsToNewDay || 1;
      receivedAmount = amount * exchangeRate;
    } else if (fromType === 'newDayGameCoins' && toType === 'gameCoins') {
      exchangeRate = rates.newDayToGameCoins || 1;
      receivedAmount = amount * exchangeRate;
    }

    // 扣除源货币
    await this.addTransaction({
      type: 'expense',
      category: 'exchange',
      amount,
      currency: fromType,
      description: `兑换为 ${toType === 'gameCoins' ? 'AllinONE' : 'New Day'} 游戏币`,
    } as any, context);

    // 增加目标货币
    await this.addTransaction({
      type: 'income',
      category: 'exchange',
      amount: receivedAmount,
      currency: toType,
      description: `从 ${fromType === 'gameCoins' ? 'AllinONE' : 'New Day'} 游戏币兑换获得`,
    } as any, context);

    return {
      success: true,
      message: `成功兑换 ${amount} ${fromType === 'gameCoins' ? 'AllinONE' : 'New Day'} 游戏币，获得 ${receivedAmount} ${toType === 'gameCoins' ? 'AllinONE' : 'New Day'} 游戏币`,
      received: receivedAmount,
    };
  }

  // ==================== 数据管理 ====================

  private async initializeWalletData(): Promise<void> {
    const existingData = localStorage.getItem(this.STORAGE_KEY);
    if (!existingData) {
      const initialWallet = {
        balance: {
          cash: 0,
          gameCoins: 12580,
          newDayGameCoins: 0,
          computingPower: 45230,
          aCoins: 15.67,
          vouchers: 0,
          voucherCount: 0,
          // 双轨凭证系统字段
          instantVouchers: 0,
          instantVoucherCount: 0,
          algorithmVouchers: 0,
          algorithmVoucherCount: 0,
          totalValue: 0,
          lastUpdated: new Date(),
        },
        transactions: [],
        stats: this.createEmptyStats(),
      };
      
      initialWallet.balance.totalValue = await this.calculateTotalValue(initialWallet.balance);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialWallet));
    } else {
      // 升级旧数据格式，添加双轨凭证系统字段
      const existingWallet = JSON.parse(existingData);
      if (existingWallet.balance) {
        let needsUpdate = false;
        
        if (existingWallet.balance.instantVouchers === undefined) {
          existingWallet.balance.instantVouchers = existingWallet.balance.vouchers || 0;
          existingWallet.balance.instantVoucherCount = existingWallet.balance.voucherCount || 0;
          existingWallet.balance.algorithmVouchers = 0;
          existingWallet.balance.algorithmVoucherCount = 0;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingWallet));
          console.log('[WalletSkill] 已升级钱包数据结构至双轨凭证系统');
        }
      }
    }

    const existingRates = localStorage.getItem(this.EXCHANGE_RATES_KEY);
    if (!existingRates) {
      localStorage.setItem(this.EXCHANGE_RATES_KEY, JSON.stringify(this.DEFAULT_EXCHANGE_RATES));
    }
  }

  private async getWalletData(): Promise<any> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      await this.initializeWalletData();
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)!);
    }
    return JSON.parse(data);
  }

  private saveWalletData(data: any): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private getRates(): ExchangeRate {
    const rates = localStorage.getItem(this.EXCHANGE_RATES_KEY);
    return rates ? JSON.parse(rates) : this.DEFAULT_EXCHANGE_RATES;
  }

  private async calculateTotalValue(balance: WalletBalance): Promise<number> {
    const rates = this.getRates();
    // 双轨凭证系统价值计算
    const instantVoucherValue = (balance as any).instantVouchers || 0;
    const algorithmVoucherValue = (balance as any).algorithmVouchers || 0;
    const totalVoucherValue = instantVoucherValue + algorithmVoucherValue;

    return balance.cash + 
           (balance.gameCoins * rates.gameCoinsToRMB) + 
           (balance.newDayGameCoins * (rates.newDayGameCoinsToRMB || 0.01)) +
           (balance.computingPower * rates.computingPowerToRMB) +
           (balance.aCoins * 1.0) +
           (totalVoucherValue * 1.0); // 凭证按1:1计算价值
  }

  private calculateExchange(from: CurrencyType, to: CurrencyType, amount: number, rates: ExchangeRate): { receivedAmount: number; rate: number } {
    // 简化版汇率计算
    const exchangeMap: Record<string, Record<string, number>> = {
      gameCoins: { cash: rates.gameCoinsToRMB, newDayGameCoins: rates.gameCoinsToNewDay },
      newDayGameCoins: { cash: rates.newDayGameCoinsToRMB, gameCoins: rates.newDayToGameCoins },
      computingPower: { cash: rates.computingPowerToRMB },
      aCoins: { cash: 1 },
      cash: { gameCoins: 1 / rates.gameCoinsToRMB, computingPower: 1 / rates.computingPowerToRMB },
    };

    const rate = exchangeMap[from]?.[to] || 1;
    return { receivedAmount: amount * rate, rate };
  }

  private async addTransaction(transaction: Partial<WalletTransaction>, context: SkillContext): Promise<void> {
    const walletData = await this.getWalletData();

    const newTransaction: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: transaction.type!,
      category: transaction.category!,
      amount: transaction.amount!,
      currency: transaction.currency! as any,
      description: transaction.description || '',
      relatedId: transaction.relatedId,
      ...transaction,
    };

    // 更新余额
    if (transaction.type === 'income') {
      walletData.balance[transaction.currency!] += transaction.amount!;
    } else {
      walletData.balance[transaction.currency!] -= transaction.amount!;
    }

    // 非负兜底
    walletData.balance[transaction.currency!] = Math.max(walletData.balance[transaction.currency!], 0);

    // 添加交易记录
    walletData.transactions.unshift(newTransaction);
    
    // 更新统计
    this.updateStats(walletData, newTransaction);
    
    // 重新计算总价值
    walletData.balance.totalValue = await this.calculateTotalValue(walletData.balance);
    walletData.balance.lastUpdated = new Date();
    
    this.saveWalletData(walletData);

    // 发布事件
    this.emit('wallet.transaction.created', newTransaction, context);
    this.emit('wallet.balance.changed', {
      currency: transaction.currency,
      newBalance: walletData.balance[transaction.currency!],
    }, context);
  }

  private updateStats(walletData: any, transaction: WalletTransaction): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const amount = transaction.amount;
    const currency = transaction.currency as keyof WalletStats['todayIncome'];

    if (transaction.type === 'income') {
      if (transaction.timestamp >= today) walletData.stats.todayIncome[currency] += amount;
      if (transaction.timestamp >= thisWeek) walletData.stats.weeklyIncome[currency] += amount;
      if (transaction.timestamp >= thisMonth) walletData.stats.monthlyIncome[currency] += amount;
      walletData.stats.totalIncome[currency] += amount;
    } else {
      if (transaction.timestamp >= today) walletData.stats.todayExpense[currency] += amount;
      if (transaction.timestamp >= thisWeek) walletData.stats.weeklyExpense[currency] += amount;
      if (transaction.timestamp >= thisMonth) walletData.stats.monthlyExpense[currency] += amount;
      walletData.stats.totalExpense[currency] += amount;
    }

    walletData.stats.totalTransactions += 1;
    walletData.stats.lastTransactionTime = transaction.timestamp;
  }

  private recomputeStats(walletData: any): WalletStats {
    const zero = { cash: 0, gameCoins: 0, newDayGameCoins: 0, computingPower: 0, aCoins: 0, vouchers: 0 };
    const stats: WalletStats = {
      todayIncome: { ...zero },
      weeklyIncome: { ...zero },
      monthlyIncome: { ...zero },
      todayExpense: { ...zero },
      weeklyExpense: { ...zero },
      monthlyExpense: { ...zero },
      totalIncome: { ...zero },
      totalExpense: { ...zero },
      totalTransactions: 0,
      lastTransactionTime: new Date(),
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const tx of walletData.transactions || []) {
      const amount = tx.amount;
      const key = tx.currency;
      const ts = typeof tx.timestamp === 'string' ? new Date(tx.timestamp) : tx.timestamp;

      if (tx.type === 'income') {
        if (ts >= today) stats.todayIncome[key] += amount;
        if (ts >= thisWeek) stats.weeklyIncome[key] += amount;
        if (ts >= thisMonth) stats.monthlyIncome[key] += amount;
        stats.totalIncome[key] += amount;
      } else {
        if (ts >= today) stats.todayExpense[key] += amount;
        if (ts >= thisWeek) stats.weeklyExpense[key] += amount;
        if (ts >= thisMonth) stats.monthlyExpense[key] += amount;
        stats.totalExpense[key] += amount;
      }
    }

    return stats;
  }

  private createEmptyStats(): WalletStats {
    const zero = { cash: 0, gameCoins: 0, newDayGameCoins: 0, computingPower: 0, aCoins: 0, vouchers: 0 };
    return {
      todayIncome: { ...zero },
      weeklyIncome: { ...zero },
      monthlyIncome: { ...zero },
      todayExpense: { ...zero },
      weeklyExpense: { ...zero },
      monthlyExpense: { ...zero },
      totalIncome: { ...zero },
      totalExpense: { ...zero },
      totalTransactions: 0,
      lastTransactionTime: new Date(),
    } as WalletStats;
  }
}

// 导出单例
export const walletSkill = new WalletSkill();

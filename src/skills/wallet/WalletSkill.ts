/**
 * WalletSkill - 精简钱包 Skill（MVP v1.0）
 * 
 * 仅支持 gameCoins + aCoins。
 * 数据源：CloudBase collection users（余额）+ transactions（流水）
 * 保留 localStorage 缓存加速读取。
 * 
 * @since MVP v1.0
 */

import { BaseSkill } from '../BaseSkill';
import type { SkillContext } from '../types';
import { getCloudBaseApp } from '../../services/cloudbase';

// ==================== 类型定义 ====================

export type CurrencyType = 'gameCoins' | 'aCoins';

export interface WalletBalance {
  gameCoins: number;
  aCoins: number;
  instantVouchers: number;
  algorithmVouchers: number;
  lastUpdated: number;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  currency: CurrencyType;
  description: string;
  balanceAfter: WalletBalance;
  timestamp: number;
}

export interface WalletStats {
  todayIncome: Record<CurrencyType, number>;
  todayExpense: Record<CurrencyType, number>;
  weeklyIncome: Record<CurrencyType, number>;
  weeklyExpense: Record<CurrencyType, number>;
  totalTransactions: number;
  lastUpdated: number;
}

// ==================== Skill 实现 ====================

export class WalletSkill extends BaseSkill {
  private readonly STORAGE_KEY = 'wallet_v2';

  constructor() {
    super({
      displayName: '钱包服务',
      name: 'wallet',
      version: '2.0.0',
      description: '统一钱包管理（gameCoins + aCoins），CloudBase 持久化',
      dependencies: ['auth'],
    requiredPermissions: [], actions: [] });
  }

  protected async onInitialize(): Promise<void> {
    this.registerAction('getBalance', this.getBalance.bind(this), {
      description: '获取用户钱包余额',
      params: { type: 'object', properties: {} },
    });

    this.registerAction('recharge', this.recharge.bind(this), {
      description: '充值游戏币',
      params: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number' },
          currency: { type: 'string', enum: ['gameCoins', 'aCoins'], default: 'gameCoins' },
          description: { type: 'string' },
        },
      },
    });

    this.registerAction('spend', this.spend.bind(this), {
      description: '消费/扣除',
      params: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number' },
          currency: { type: 'string', enum: ['gameCoins', 'aCoins'], default: 'gameCoins' },
          description: { type: 'string' },
        },
      },
    });

    this.registerAction('getTransactions', this.getTransactions.bind(this), {
      description: '获取交易流水',
      params: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 50 },
          currency: { type: 'string', enum: ['gameCoins', 'aCoins'] },
        },
      },
    });

    this.registerAction('getStats', this.getStats.bind(this), {
      description: '获取钱包统计',
      params: { type: 'object', properties: {} },
    });
  }

  // ==================== Actions ====================

  async getBalance(_params: any, context: SkillContext): Promise<{ success: boolean; data: WalletBalance }> {
    const userId = context.userId || 'anonymous';
    try {
      const app = getCloudBaseApp();
      const db = app.database();
      const res = await db.collection('users').where({ _openid: userId }).limit(1).get();
      if (res.data.length > 0) {
        const doc = res.data[0];
        return {
          success: true,
          data: {
            gameCoins: doc.gameCoins || 0,
            aCoins: doc.aCoins || 0,
            instantVouchers: doc.instantVouchers || 0,
            algorithmVouchers: doc.algorithmVouchers || 0,
            lastUpdated: doc.updatedAt || Date.now(),
          },
        };
      }
    } catch { /* fallback */ }

    return { success: true, data: this.getLocalBalance(userId) };
  }

  async recharge(
    params: { amount: number; currency?: CurrencyType; description?: string },
    context: SkillContext
  ): Promise<{ success: boolean; data: WalletBalance }> {
    return this.adjustBalance(context.userId, 'income', params.amount, params.currency || 'gameCoins', params.description || '充值');
  }

  async spend(
    params: { amount: number; currency?: CurrencyType; category?: string; description?: string },
    context: SkillContext
  ): Promise<{ success: boolean; data: WalletBalance; error?: string }> {
    const userId = context.userId;
    const bal = await this.getBalance({} as never, context);
    const field = params.currency || 'gameCoins';
    if ((bal.data as any)[field] < params.amount) {
      return { success: false, data: bal.data, error: `余额不足（需要 ${params.amount}，当前 ${(bal.data as any)[field]}）` };
    }
    return this.adjustBalance(userId, 'expense', params.amount, field, params.description || '消费');
  }

  async getTransactions(
    params: { limit?: number; currency?: CurrencyType },
    context: SkillContext
  ): Promise<{ success: boolean; data: WalletTransaction[] }> {
    const userId = context.userId;
    try {
      const app = getCloudBaseApp();
      const db = app.database();
      let query = db.collection('transactions').where({ userId }).orderBy('timestamp', 'desc').limit(params.limit || 50);
      if (params.currency) query = query.where({ currency: params.currency });
      const res = await query.get();
      return { success: true, data: res.data as WalletTransaction[] };
    } catch {
      return { success: true, data: this.getLocalTransactions(userId, params.limit || 50) };
    }
  }

  async getStats(_params: any, context: SkillContext): Promise<{ success: boolean; data: WalletStats }> {
    const userId = context.userId;
    const txs = await this.getTransactions({ limit: 500 }, context);
    const now = Date.now();
    const DAY = 86400000;
    const WEEK = 7 * DAY;

    const zero = { gameCoins: 0, aCoins: 0 };
    const stats: WalletStats = {
      todayIncome: { ...zero },
      todayExpense: { ...zero },
      weeklyIncome: { ...zero },
      weeklyExpense: { ...zero },
      totalTransactions: 0,
      lastUpdated: now,
    };

    for (const tx of txs.data) {
      const age = now - tx.timestamp;
      const key = tx.currency as CurrencyType;
      if (tx.type === 'income') {
        if (age < DAY) stats.todayIncome[key] += tx.amount;
        if (age < WEEK) stats.weeklyIncome[key] += tx.amount;
      } else {
        if (age < DAY) stats.todayExpense[key] += tx.amount;
        if (age < WEEK) stats.weeklyExpense[key] += tx.amount;
      }
      stats.totalTransactions++;
    }

    return { success: true, data: stats };
  }

  // ==================== 私有方法 ====================

  private async adjustBalance(
    userId: string,
    type: 'income' | 'expense',
    amount: number,
    currency: CurrencyType,
    description: string
  ): Promise<{ success: boolean; data: WalletBalance }> {
    const delta = type === 'income' ? amount : -amount;

    // 获取当前余额
    let balance = this.getLocalBalance(userId);
    try {
      const app = getCloudBaseApp();
      const db = app.database();
      const res = await db.collection('users').where({ _openid: userId }).limit(1).get();
      if (res.data.length > 0) {
        const doc = res.data[0];
        balance = {
          gameCoins: doc.gameCoins || 0,
          aCoins: doc.aCoins || 0,
          instantVouchers: doc.instantVouchers || 0,
          algorithmVouchers: doc.algorithmVouchers || 0,
          lastUpdated: doc.updatedAt || Date.now(),
        };

        // 更新 CloudBase
        const update: any = { updatedAt: Date.now() };
        if (currency === 'gameCoins') update.gameCoins = (balance.gameCoins + delta);
        if (currency === 'aCoins') update.aCoins = (balance.aCoins + delta);
        await db.collection('users').doc(doc._id).update(update);
      }
    } catch {
      // CloudBase 不可用，使用 localStorage
    }

    // 更新本地
    if (currency === 'gameCoins') balance.gameCoins += delta;
    if (currency === 'aCoins') balance.aCoins += delta;
    balance.lastUpdated = Date.now();
    this.saveLocalBalance(userId, balance);

    // 记录交易流水
    const tx: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      type,
      amount,
      currency,
      description,
      balanceAfter: { ...balance },
      timestamp: Date.now(),
    };
    this.saveLocalTransaction(tx);

    // 异步写入 CloudBase
    try {
      const app = getCloudBaseApp();
      await app.database().collection('transactions').add({ ...tx, createdAt: tx.timestamp });
    } catch { /* best effort */ }

    return { success: true, data: balance };
  }

  private getLocalBalance(userId: string): WalletBalance {
    try {
      const data = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
      return data[userId] || { gameCoins: 0, aCoins: 0, instantVouchers: 0, algorithmVouchers: 0, lastUpdated: Date.now() };
    } catch {
      return { gameCoins: 0, aCoins: 0, instantVouchers: 0, algorithmVouchers: 0, lastUpdated: Date.now() };
    }
  }

  private saveLocalBalance(userId: string, balance: WalletBalance): void {
    try {
      const data = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
      data[userId] = balance;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }

  private getLocalTransactions(userId: string, limit: number): WalletTransaction[] {
    try {
      const all: WalletTransaction[] = JSON.parse(localStorage.getItem('wallet_tx') || '[]');
      return all.filter(t => t.userId === userId).slice(-limit).reverse();
    } catch {
      return [];
    }
  }

  private saveLocalTransaction(tx: WalletTransaction): void {
    try {
      const all: WalletTransaction[] = JSON.parse(localStorage.getItem('wallet_tx') || '[]');
      all.push(tx);
      if (all.length > 1000) all.splice(0, all.length - 1000);
      localStorage.setItem('wallet_tx', JSON.stringify(all));
    } catch { /* ignore */ }
  }
}

/** 单例导出 */
export const walletSkill = new WalletSkill();

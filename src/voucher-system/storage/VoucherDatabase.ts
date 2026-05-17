/**
 * A币电子凭证系统 - 数据库存储层
 * 使用 localStorage 模拟关系型数据库
 * 设计为可轻松迁移到真实数据库（如 MySQL/PostgreSQL）
 */

import type {
  Voucher,
  Transaction,
  UserVoucherStats,
  VoucherSystemStats,
  VoucherFilter,
  PaginatedResult,
} from '../types';
import { VoucherStatus, TransactionType } from '../types';

// 存储键名（模拟表名）
const STORAGE_KEYS = {
  VOUCHERS: 'allinone_vouchers',
  TRANSACTIONS: 'allinone_voucher_transactions',
  STATS: 'allinone_voucher_stats',
  SYSTEM_STATS: 'allinone_voucher_system_stats',
  INDEX_HOLDER: 'allinone_voucher_index_holder', // 持有者索引
  INDEX_SERIAL: 'allinone_voucher_index_serial', // 编号索引
};

// 系统容量上限：10亿
const SYSTEM_CAPACITY = 1_000_000_000;

/**
 * 凭证数据库类
 * 提供类似 SQL 数据库的 CRUD 操作
 */
export class VoucherDatabase {
  private static instance: VoucherDatabase | null = null;

  // 内存缓存（减少 localStorage 读取）
  private voucherCache: Map<string, Voucher> = new Map();
  private transactionCache: Map<string, Transaction> = new Map();
  private cacheInitialized = false;

  private constructor() {
    this.initCache();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): VoucherDatabase {
    if (!VoucherDatabase.instance) {
      VoucherDatabase.instance = new VoucherDatabase();
    }
    return VoucherDatabase.instance;
  }

  /**
   * 重置单例（测试用）
   */
  static resetInstance(): void {
    VoucherDatabase.instance = null;
  }

  // ==================== 初始化与缓存 ====================

  /**
   * 初始化缓存
   */
  private initCache(): void {
    if (typeof window === 'undefined') return;

    try {
      // 加载所有凭证到缓存
      const vouchersData = localStorage.getItem(STORAGE_KEYS.VOUCHERS);
      if (vouchersData) {
        const vouchers: Voucher[] = JSON.parse(vouchersData);
        vouchers.forEach(v => this.voucherCache.set(v.id, v));
      }

      // 加载所有交易到缓存
      const transactionsData = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (transactionsData) {
        const transactions: Transaction[] = JSON.parse(transactionsData);
        transactions.forEach(t => this.transactionCache.set(t.id, t));
      }

      this.cacheInitialized = true;
    } catch (error) {
      console.error('[VoucherDatabase] 缓存初始化失败:', error);
    }
  }

  /**
   * 持久化凭证数据（模拟事务提交）
   */
  private persistVouchers(): void {
    if (typeof window === 'undefined') return;

    const vouchers = Array.from(this.voucherCache.values());
    localStorage.setItem(STORAGE_KEYS.VOUCHERS, JSON.stringify(vouchers));

    // 更新索引
    this.updateHolderIndex();
  }

  /**
   * 持久化交易数据
   */
  private persistTransactions(): void {
    if (typeof window === 'undefined') return;

    const transactions = Array.from(this.transactionCache.values());
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  /**
   * 更新持有者索引
   */
  private updateHolderIndex(): void {
    if (typeof window === 'undefined') return;

    const index: Record<string, string[]> = {};
    this.voucherCache.forEach(voucher => {
      if (!index[voucher.currentHolderId]) {
        index[voucher.currentHolderId] = [];
      }
      index[voucher.currentHolderId].push(voucher.id);
    });
    localStorage.setItem(STORAGE_KEYS.INDEX_HOLDER, JSON.stringify(index));
  }

  // ==================== 凭证 CRUD 操作 ====================

  /**
   * 插入凭证（INSERT）
   */
  insertVoucher(voucher: Voucher): void {
    // 检查是否已达系统上限
    if (this.voucherCache.size >= SYSTEM_CAPACITY) {
      throw new Error('系统凭证数量已达上限（10亿）');
    }

    // 检查ID唯一性
    if (this.voucherCache.has(voucher.id)) {
      throw new Error(`凭证ID已存在: ${voucher.id}`);
    }

    this.voucherCache.set(voucher.id, voucher);
    this.persistVouchers();
  }

  /**
   * 更新凭证（UPDATE）
   */
  updateVoucher(voucher: Voucher): void {
    if (!this.voucherCache.has(voucher.id)) {
      throw new Error(`凭证不存在: ${voucher.id}`);
    }

    this.voucherCache.set(voucher.id, voucher);
    this.persistVouchers();
  }

  /**
   * 获取凭证（SELECT by ID）
   */
  getVoucherById(id: string): Voucher | null {
    return this.voucherCache.get(id) || null;
  }

  /**
   * 获取凭证（SELECT by Serial Number）
   */
  getVoucherBySerialNumber(serialNumber: string): Voucher | null {
    for (const voucher of this.voucherCache.values()) {
      if (voucher.serialNumber === serialNumber) {
        return voucher;
      }
    }
    return null;
  }

  /**
   * 获取所有凭证（SELECT *）
   */
  getAllVouchers(): Voucher[] {
    return Array.from(this.voucherCache.values());
  }

  /**
   * 筛选凭证（SELECT with WHERE）
   */
  filterVouchers(filter: VoucherFilter): Voucher[] {
    let results = Array.from(this.voucherCache.values());

    if (filter.status) {
      results = results.filter(v => v.status === filter.status);
    }

    if (filter.holderId) {
      results = results.filter(v => v.currentHolderId === filter.holderId);
    }

    if (filter.minDenomination !== undefined) {
      results = results.filter(v => v.denomination >= filter.minDenomination!);
    }

    if (filter.maxDenomination !== undefined) {
      results = results.filter(v => v.denomination <= filter.maxDenomination!);
    }

    if (filter.startDate !== undefined) {
      results = results.filter(v => v.createdAt >= filter.startDate!);
    }

    if (filter.endDate !== undefined) {
      results = results.filter(v => v.createdAt <= filter.endDate!);
    }

    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase();
      results = results.filter(v =>
        v.serialNumber.toLowerCase().includes(keyword) ||
        v.currentHolderName.toLowerCase().includes(keyword) ||
        v.metadata?.name?.toLowerCase().includes(keyword) ||
        v.metadata?.description?.toLowerCase().includes(keyword)
      );
    }

    // 默认按创建时间倒序
    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 分页查询
   */
  getVouchersPaginated(
    filter: VoucherFilter,
    page: number = 1,
    pageSize: number = 20
  ): PaginatedResult<Voucher> {
    const allResults = this.filterVouchers(filter);
    const total = allResults.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = allResults.slice(startIndex, endIndex);

    return {
      items,
      total,
      page,
      pageSize,
      hasMore: endIndex < total,
    };
  }

  /**
   * 获取用户的所有凭证
   */
  getVouchersByHolder(holderId: string): Voucher[] {
    return Array.from(this.voucherCache.values())
      .filter(v => v.currentHolderId === holderId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // ==================== 交易记录操作 ====================

  /**
   * 插入交易记录
   */
  insertTransaction(transaction: Transaction): void {
    this.transactionCache.set(transaction.id, transaction);
    this.persistTransactions();
  }

  /**
   * 批量插入交易记录
   */
  insertTransactions(transactions: Transaction[]): void {
    transactions.forEach(t => this.transactionCache.set(t.id, t));
    this.persistTransactions();
  }

  /**
   * 获取交易记录
   */
  getTransactionById(id: string): Transaction | null {
    return this.transactionCache.get(id) || null;
  }

  /**
   * 获取凭证的所有交易记录
   */
  getTransactionsByVoucherId(voucherId: string): Transaction[] {
    return Array.from(this.transactionCache.values())
      .filter(t => t.voucherId === voucherId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 获取用户的所有相关交易
   */
  getTransactionsByUser(userId: string): Transaction[] {
    return Array.from(this.transactionCache.values())
      .filter(t => t.fromUserId === userId || t.toUserId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 获取用户的交易统计
   */
  getUserTransactionStats(userId: string): { sent: number; received: number } {
    let sent = 0;
    let received = 0;

    this.transactionCache.forEach(t => {
      if (t.type === TransactionType.TRANSFER) {
        if (t.fromUserId === userId) sent++;
        if (t.toUserId === userId) received++;
      }
    });

    return { sent, received };
  }

  // ==================== 统计查询 ====================

  /**
   * 获取用户持有统计
   */
  getUserStats(userId: string): UserVoucherStats {
    const userVouchers = this.getVouchersByHolder(userId);
    const { sent, received } = this.getUserTransactionStats(userId);

    return {
      userId,
      totalCount: userVouchers.length,
      totalValue: userVouchers.reduce((sum, v) => sum + v.denomination, 0),
      activeCount: userVouchers.filter(v => v.status === VoucherStatus.ACTIVE).length,
      frozenCount: userVouchers.filter(v => v.status === VoucherStatus.FROZEN).length,
      receivedCount: received,
      sentCount: sent,
    };
  }

  /**
   * 获取系统统计
   */
  getSystemStats(): VoucherSystemStats {
    const allVouchers = Array.from(this.voucherCache.values());
    const allTransactions = Array.from(this.transactionCache.values());

    const uniqueHolders = new Set(allVouchers.map(v => v.currentHolderId)).size;
    const transferCount = allTransactions.filter(
      t => t.type === TransactionType.TRANSFER
    ).length;

    return {
      totalVouchers: allVouchers.length,
      totalValue: allVouchers.reduce((sum, v) => sum + v.denomination, 0),
      activeVouchers: allVouchers.filter(v => v.status === VoucherStatus.ACTIVE).length,
      totalTransactions: allTransactions.length,
      totalTransfers: transferCount,
      uniqueHolders,
      systemCapacity: SYSTEM_CAPACITY,
      utilizationRate: (allVouchers.length / SYSTEM_CAPACITY) * 100,
    };
  }

  // ==================== 高级查询 ====================

  /**
   * 搜索凭证（全文搜索）
   */
  searchVouchers(query: string): Voucher[] {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return [];

    return Array.from(this.voucherCache.values()).filter(v =>
      v.id.toLowerCase().includes(lowerQuery) ||
      v.serialNumber.toLowerCase().includes(lowerQuery) ||
      v.currentHolderName.toLowerCase().includes(lowerQuery) ||
      v.metadata?.name?.toLowerCase().includes(lowerQuery) ||
      v.metadata?.description?.toLowerCase().includes(lowerQuery) ||
      v.metadata?.issuer?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 获取凭证流转历史
   */
  getVoucherHistory(voucherId: string): { voucher: Voucher | null; transactions: Transaction[] } {
    const voucher = this.getVoucherById(voucherId);
    const transactions = this.getTransactionsByVoucherId(voucherId);
    return { voucher, transactions };
  }

  /**
   * 获取最近的交易
   */
  getRecentTransactions(limit: number = 10): Transaction[] {
    return Array.from(this.transactionCache.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * 获取最近的凭证
   */
  getRecentVouchers(limit: number = 10): Voucher[] {
    return Array.from(this.voucherCache.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  // ==================== 数据完整性检查 ====================

  /**
   * 验证数据一致性
   */
  verifyDataIntegrity(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // 检查所有凭证的持有者是否与最新交易一致
    this.voucherCache.forEach(voucher => {
      const transactions = this.getTransactionsByVoucherId(voucher.id);
      if (transactions.length > 0) {
        const latestTx = transactions[transactions.length - 1];
        if (latestTx.toUserId !== voucher.currentHolderId) {
          issues.push(
            `凭证 ${voucher.id} 持有者不一致: 凭证记录为 ${voucher.currentHolderId}, 最新交易为 ${latestTx.toUserId}`
          );
        }
      }
    });

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  // ==================== 数据导出 ====================

  /**
   * 导出所有数据（用于备份）
   */
  exportAllData(): {
    vouchers: Voucher[];
    transactions: Transaction[];
    stats: VoucherSystemStats;
    exportedAt: number;
  } {
    return {
      vouchers: this.getAllVouchers(),
      transactions: Array.from(this.transactionCache.values()),
      stats: this.getSystemStats(),
      exportedAt: Date.now(),
    };
  }

  /**
   * 导入数据（用于恢复）
   */
  importData(data: {
    vouchers: Voucher[];
    transactions: Transaction[];
  }): void {
    // 清空现有数据
    this.voucherCache.clear();
    this.transactionCache.clear();

    // 导入凭证
    data.vouchers.forEach(v => this.voucherCache.set(v.id, v));
    this.persistVouchers();

    // 导入交易
    data.transactions.forEach(t => this.transactionCache.set(t.id, t));
    this.persistTransactions();
  }

  // ==================== 系统容量检查 ====================

  /**
   * 检查是否还有容量
   */
  hasCapacity(count: number = 1): boolean {
    return (this.voucherCache.size + count) <= SYSTEM_CAPACITY;
  }

  /**
   * 获取剩余容量
   */
  getRemainingCapacity(): number {
    return SYSTEM_CAPACITY - this.voucherCache.size;
  }
}

// 导出单例
export const voucherDB = VoucherDatabase.getInstance();

/**
 * New Day 钱包集成服务
 * 用于 AllinONE 与 New Day 之间的钱包余额同步
 */

import { newDayApiService } from './newDayApiService';
import { walletService } from './walletService';

interface NewDayBalance {
  cash: number;
  newDayGameCoins: number;      // New Day 游戏币（从 New Day 实时获取）
  computingPower: number;
}

interface AllinONEBalance {
  cash: number;
  gameCoins: number;       // AllinONE 游戏币
  newDayGameCoins: number; // New Day 游戏币（从 New Day 实时同步）
  computingPower: number;
  oCoins: number;
}

class NewDayWalletIntegrationService {
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private readonly DEFAULT_SYNC_INTERVAL = 30000; // 30秒同步一次
  /**
   * 获取 New Day 钱包余额
   */
  async getNewDayBalance(): Promise<NewDayBalance> {
    try {
      const balance = await newDayApiService.getBalance();
      console.log('✅ New Day 余额:', balance);
      return balance;
    } catch (error) {
      console.error('❌ 获取 New Day 余额失败:', error);
      throw error;
    }
  }

  /**
   * 获取 AllinONE 本地钱包余额
   */
  getLocalBalance(): AllinONEBalance {
    // 从 walletService 读取余额（单一数据源）
    const walletData = localStorage.getItem('wallet_data');
    
    if (walletData) {
      try {
        const parsed = JSON.parse(walletData);
        return {
          cash: parsed.balance?.cash || 0,
          gameCoins: parsed.balance?.gameCoins || 0,
          newDayGameCoins: parsed.balance?.newDayGameCoins || 0,
          computingPower: parsed.balance?.computingPower || 0,
          oCoins: parsed.balance?.oCoins || 0
        };
      } catch (error) {
        console.warn('解析本地钱包余额失败:', error);
      }
    }

    // 返回默认值（移除虚拟数据，只保留基本结构）
    return {
      cash: 0,
      gameCoins: 0,
      newDayGameCoins: 0,
      computingPower: 0,
      oCoins: 0
    };
  }

  /**
   * 同步 New Day 游戏币到 AllinONE 钱包
   * 注意：如果 AllinONE 余额小于 New Day 余额，说明有本地交易，不要覆盖
   */
  async syncNewDayGameCoins(newDayBalance: NewDayBalance): Promise<void> {
    try {
      // 获取当前 AllinONE 余额
      const currentBalance = await walletService.getBalance();
      const newDayGameCoins = newDayBalance.newDayGameCoins || 0;
      const currentNewDayGameCoins = currentBalance.newDayGameCoins || 0;

      // 只有当 New Day 余额大于 AllinONE 余额时才同步（说明 New Day 有充值或奖励）
      // 如果 AllinONE 余额小于 New Day 余额，说明有本地交易，不要覆盖
      if (newDayGameCoins > currentNewDayGameCoins) {
        await walletService.updateNewDayGameCoins(
          newDayGameCoins,
          '从 New Day 平台同步游戏币'
        );
        console.log(`💰 New Day 游戏币已同步: ${currentNewDayGameCoins} → ${newDayGameCoins}`);
      } else if (newDayGameCoins < currentNewDayGameCoins) {
        // AllinONE 余额大于 New Day 余额，说明有本地交易，保持 AllinONE 余额
        console.log(`💰 保持 AllinONE 余额: ${currentNewDayGameCoins} (New Day: ${newDayGameCoins}, 本地有交易)`);
      } else {
        console.log(`💰 New Day 游戏币无变化: ${newDayGameCoins}`);
      }

      // 触发事件通知其他组件
      window.dispatchEvent(new CustomEvent('walletBalanceChanged', {
        detail: {
          ...currentBalance,
          newDayGameCoins: currentBalance.newDayGameCoins
        }
      }));
    } catch (error) {
      console.error('同步 New Day 游戏币失败:', error);
    }
  }

  /**
   * 获取各平台余额（分别记录，不再合并）
   */
  async getMergedBalance(): Promise<{
    newDay: NewDayBalance;
    allinone: AllinONEBalance;
    gameCoinsSummary: {
      allinone: number;
      newDay: number;
      total: number;
    };
  }> {
    try {
      // 获取 New Day 余额
      const newDayBalance = await this.getNewDayBalance();

      // 同步 New Day 游戏币到 AllinONE
      await this.syncNewDayGameCoins(newDayBalance);

      // 获取 AllinONE 余额（已包含同步后的 New Day 游戏币）
      const allinoneBalance = this.getLocalBalance();

      return {
        newDay: newDayBalance,
        allinone: allinoneBalance,
        gameCoinsSummary: {
          allinone: allinoneBalance.gameCoins,
          newDay: allinoneBalance.newDayGameCoins,
          total: allinoneBalance.gameCoins + allinoneBalance.newDayGameCoins
        }
      };
    } catch (error) {
      console.error('获取余额失败:', error);
      // 降级处理
      const newDayBalance = await this.getNewDayBalance().catch(() => ({
        cash: 0, newDayGameCoins: 0, computingPower: 0
      }));
      const allinoneBalance = this.getLocalBalance();

      return {
        newDay: newDayBalance,
        allinone: allinoneBalance,
        gameCoinsSummary: {
          allinone: allinoneBalance.gameCoins,
          newDay: allinoneBalance.newDayGameCoins,
          total: allinoneBalance.gameCoins + allinoneBalance.newDayGameCoins
        }
      };
    }
  }

  /**
   * 从 New Day 转账到 AllinONE
   */
  async transferFromNewDay(params: {
    currencyType: 'newDayGameCoins' | 'cash' | 'computingPower';
    amount: number;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const newDayBalance = await this.getNewDayBalance();
      const currencyMap: Record<string, number> = {
        'newDayGameCoins': newDayBalance.newDayGameCoins,
        'cash': newDayBalance.cash,
        'computingPower': newDayBalance.computingPower,
      };

      const available = currencyMap[params.currencyType];
      
      if (available < params.amount) {
        throw new Error(`New Day ${params.currencyType} 余额不足`);
      }

      // 映射到 AllinONE 货币类型
      const targetCurrency = this.mapNewDayCurrencyToAllinONE(params.currencyType);
      
      // 使用 walletService 添加交易记录
      await walletService.addTransaction({
        type: 'income',
        category: 'trade',
        amount: params.amount,
        currency: targetCurrency as any,
        description: `从 New Day 转账获得`
      });
      
      console.log(`✅ 成功从 New Day 转账: ${params.amount} ${params.currencyType} → AllinONE ${targetCurrency}`);
      
      return { success: true, message: '转账成功' };
    } catch (error) {
      console.error('从 New Day 转账失败:', error);
      throw error;
    }
  }

  /**
   * 从 AllinONE 转账到 New Day
   */
  async transferToNewDay(params: {
    currencyType: 'gameCoins' | 'newDayGameCoins' | 'cash' | 'computingPower';
    amount: number;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const balance = await walletService.getBalance();

      // 映射货币类型（移除 aCoins）
      const currencyMap: Record<string, number> = {
        'gameCoins': balance.gameCoins,
        'newDayGameCoins': balance.newDayGameCoins,
        'cash': balance.cash,
        'computingPower': balance.computingPower,
      };

      const available = currencyMap[params.currencyType];
      
      if (!available || available < params.amount) {
        throw new Error(`AllinONE ${params.currencyType} 余额不足`);
      }

      // 使用 walletService 扣除货币
      await walletService.addTransaction({
        type: 'expense',
        category: 'trade',
        amount: params.amount,
        currency: params.currencyType as any,
        description: `转账到 New Day`
      });
      
      console.log(`✅ 成功转账到 New Day: ${params.amount} ${params.currencyType}`);
      
      return { success: true, message: '转账成功' };
    } catch (error) {
      console.error('转账到 New Day 失败:', error);
      throw error;
    }
  }

  /**
   * 映射 New Day 货币到 AllinONE 货币（移除 aCoins）
   */
  private mapNewDayCurrencyToAllinONE(currency: string): string {
    const mapping: Record<string, string> = {
      'newDayGameCoins': 'newDayGameCoins',  // New Day 游戏币
      'cash': 'cash',
      'computingPower': 'computingPower',
    };
    return mapping[currency] || currency;
  }

  /**
   * 监听钱包余额变化
   */
  onBalanceChange(callback: (balance: AllinONEBalance) => void): () => void {
    const handler = (event: Event) => {
      callback((event as CustomEvent).detail);
    };
    
    window.addEventListener('walletBalanceChanged', handler);
    
    // 返回取消监听的函数
    return () => {
      window.removeEventListener('walletBalanceChanged', handler);
    };
  }

  /**
   * 启动自动同步
   * @param interval 同步间隔（毫秒），默认30秒
   * @returns 停止同步的函数
   */
  startAutoSync(interval: number = this.DEFAULT_SYNC_INTERVAL): () => void {
    // 先停止现有的同步
    this.stopAutoSync();

    console.log(`🔄 启动 New Day 钱包自动同步，间隔: ${interval}ms`);

    // 立即执行一次同步
    this.syncBalanceFromNewDay();

    // 设置定时同步
    this.syncInterval = setInterval(() => {
      this.syncBalanceFromNewDay();
    }, interval);

    // 返回停止函数
    return () => this.stopAutoSync();
  }

  /**
   * 停止自动同步
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ 停止 New Day 钱包自动同步');
    }
  }

  /**
   * 检查是否正在自动同步
   */
  isAutoSyncing(): boolean {
    return this.syncInterval !== null;
  }

  /**
   * 从 New Day 获取余额并同步到 AllinONE（单次同步）
   */
  async syncBalanceFromNewDay(): Promise<{ success: boolean; newDayGameCoins: number; message: string }> {
    try {
      console.log('🔄 开始同步 New Day 余额...');

      // 从 New Day API 获取余额
      const newDayBalance = await this.getNewDayBalance();
      const newDayGameCoins = newDayBalance.newDayGameCoins || 0;
      console.log('📊 从 New Day 获取的余额:', { newDayGameCoins, fullBalance: newDayBalance });

      // 获取当前 AllinONE 钱包中的 New Day 游戏币余额
      const currentBalance = await walletService.getBalance();
      const previousNewDayBalance = currentBalance.newDayGameCoins || 0;
      console.log('📊 当前 AllinONE 钱包余额:', { previousNewDayBalance, fullBalance: currentBalance });

      // 如果余额有变化，更新到 AllinONE 钱包
      if (newDayGameCoins !== previousNewDayBalance) {
        console.log(`💰 余额有变化，准备更新: ${previousNewDayBalance} → ${newDayGameCoins}`);
        await walletService.updateNewDayGameCoins(
          newDayGameCoins,
          `从 New Day 同步 - ${new Date().toLocaleString()}`
        );

        console.log(`✅ New Day 游戏币已同步: ${previousNewDayBalance} → ${newDayGameCoins}`);

        // 触发钱包更新事件
        window.dispatchEvent(new CustomEvent('wallet-updated', {
          detail: {
            type: 'newday_sync',
            previousBalance: previousNewDayBalance,
            newBalance: newDayGameCoins,
            timestamp: new Date()
          }
        }));

        return {
          success: true,
          newDayGameCoins,
          message: `余额已更新: ${previousNewDayBalance} → ${newDayGameCoins}`
        };
      }

      return {
        success: true,
        newDayGameCoins,
        message: '余额无变化'
      };
    } catch (error) {
      console.error('❌ 同步 New Day 余额失败:', error);
      return {
        success: false,
        newDayGameCoins: 0,
        message: error instanceof Error ? error.message : '同步失败'
      };
    }
  }

  /**
   * 初始化钱包
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔄 初始化 New Day 钱包集成...');

      const mergedBalance = await this.getMergedBalance();

      console.log('💰 合并余额:', {
        newDay: mergedBalance.newDay,
        allinone: mergedBalance.allinone,
        gameCoinsSummary: mergedBalance.gameCoinsSummary
      });

      console.log('✅ New Day 钱包集成初始化完成');
    } catch (error) {
      console.error('❌ 初始化 New Day 钱包集成失败:', error);
    }
  }
}

export const newDayWalletIntegrationService = new NewDayWalletIntegrationService();

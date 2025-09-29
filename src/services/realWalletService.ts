import { WalletBalance, WalletTransaction, WalletStats } from '@/types/wallet';
import { RealDataGenerator } from './realDataGenerator';

class RealWalletService {
  private readonly API_BASE_URL = (window as any).REACT_APP_API_URL || 'http://localhost:3001/api';
  private readonly FALLBACK_STORAGE_KEY = 'real_wallet_data';

  // 获取真实的钱包余额
  async getBalance(): Promise<WalletBalance> {
    try {
      // 尝试从真实API获取数据
      const response = await fetch(`${this.API_BASE_URL}/wallet/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          cash: data.cash || 0,
          gameCoins: data.gameCoins || 0,
          computingPower: data.computingPower || 0,
          totalValue: data.totalValue || 0,
          lastUpdated: new Date(data.lastUpdated || Date.now())
        };
      }
    } catch (error) {
      console.warn('无法连接到真实API，使用本地数据:', error);
    }

    // 如果API不可用，使用本地真实数据
    return this.getLocalRealBalance();
  }

  // 获取真实的交易记录
  async getTransactions(limit: number = 20): Promise<WalletTransaction[]> {
    try {
      // 尝试从真实API获取数据
      const response = await fetch(`${this.API_BASE_URL}/wallet/transactions?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.map((tx: any) => ({
          ...tx,
          timestamp: new Date(tx.timestamp)
        }));
      }
    } catch (error) {
      console.warn('无法连接到真实API，使用本地数据:', error);
    }

    // 如果API不可用，使用本地真实数据
    return this.getLocalRealTransactions(limit);
  }

  // 获取本地真实余额数据（基于实际游戏活动）
  private getLocalRealBalance(): WalletBalance {
    const realData = RealDataGenerator.generateRealIncomeExpenseData();
    
    const totalValue = realData.balance.cash + 
                      (realData.balance.gameCoins * 0.01) + 
                      (realData.balance.computingPower * 0.001);

    return {
      cash: Math.max(0, realData.balance.cash),
      gameCoins: Math.max(0, realData.balance.gameCoins),
      computingPower: Math.max(0, realData.balance.computingPower),
      totalValue,
      lastUpdated: new Date()
    };
  }

  // 获取本地真实交易记录
  private getLocalRealTransactions(limit: number): WalletTransaction[] {
    return RealDataGenerator.generateRealTransactions(limit);
  }

  // 获取游戏活动数据
  private getGameActivityData() {
    const gameStats = localStorage.getItem('computing_power_data_user_001');
    if (gameStats) {
      const data = JSON.parse(gameStats);
      return {
        totalGameCoinsEarned: data.gameRecords?.reduce((sum: number, record: any) => 
          sum + (record.gameCoinsEarned || 0), 0) || 0,
        totalComputingPowerEarned: data.stats?.totalComputingPower || 0,
        totalGamesPlayed: data.stats?.totalGamesPlayed || 0
      };
    }
    return {
      totalGameCoinsEarned: 0,
      totalComputingPowerEarned: 0,
      totalGamesPlayed: 0
    };
  }

  // 生成基于游戏活动的交易记录
  private generateGameActivityTransactions(): WalletTransaction[] {
    const gameStats = localStorage.getItem('computing_power_data_user_001');
    if (!gameStats) return [];

    const data = JSON.parse(gameStats);
    const transactions: WalletTransaction[] = [];

    // 从游戏记录生成交易记录
    if (data.gameRecords) {
      data.gameRecords.forEach((record: any) => {
        // 游戏币奖励交易
        if (record.gameCoinsEarned > 0) {
          transactions.push({
            id: `game_coins_${record.id}`,
            type: 'income',
            category: 'game_reward',
            amount: record.gameCoinsEarned,
            currency: 'gameCoins',
            description: `游戏奖励 - 得分: ${record.score}`,
            timestamp: new Date(record.completedAt),
            relatedId: record.id
          });
        }

        // 算力奖励交易
        if (record.computingPowerEarned > 0) {
          transactions.push({
            id: `computing_${record.id}`,
            type: 'income',
            category: 'computing_reward',
            amount: record.computingPowerEarned,
            currency: 'computingPower',
            description: `算力奖励 - 游戏: ${record.gameType}`,
            timestamp: new Date(record.completedAt),
            relatedId: record.id
          });
        }
      });
    }

    return transactions;
  }

  // 获取存储的交易记录
  private getStoredTransactions(): WalletTransaction[] {
    const walletData = localStorage.getItem('wallet_data');
    if (walletData) {
      const data = JSON.parse(walletData);
      return (data.transactions || []).map((tx: any) => ({
        ...tx,
        timestamp: new Date(tx.timestamp)
      }));
    }
    return [];
  }

  // 获取认证令牌
  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || 'demo_token';
  }

  // 添加真实交易记录
  async addRealTransaction(transaction: Omit<WalletTransaction, 'id' | 'timestamp'>): Promise<void> {
    const newTransaction: WalletTransaction = {
      id: `real_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...transaction
    };

    try {
      // 尝试发送到真实API
      const response = await fetch(`${this.API_BASE_URL}/wallet/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(newTransaction)
      });

      if (!response.ok) {
        throw new Error('API请求失败');
      }
    } catch (error) {
      console.warn('无法同步到API，保存到本地:', error);
      // 保存到本地存储
      this.saveTransactionLocally(newTransaction);
    }

    // 触发钱包更新事件
    window.dispatchEvent(new CustomEvent('wallet-updated', { 
      detail: { transaction: newTransaction } 
    }));
  }

  // 本地保存交易记录
  private saveTransactionLocally(transaction: WalletTransaction): void {
    const walletData = JSON.parse(localStorage.getItem('wallet_data') || '{"transactions": []}');
    walletData.transactions = walletData.transactions || [];
    walletData.transactions.unshift(transaction);
    
    // 只保留最近100条记录
    if (walletData.transactions.length > 100) {
      walletData.transactions = walletData.transactions.slice(0, 100);
    }
    
    localStorage.setItem('wallet_data', JSON.stringify(walletData));
  }

  // 获取收支统计
  async getIncomeExpenseStats(): Promise<{
    totalIncome: { cash: number; gameCoins: number; computingPower: number };
    totalExpense: { cash: number; gameCoins: number; computingPower: number };
    incomeByCategory: Record<string, number>;
    expenseByCategory: Record<string, number>;
  }> {
    const realData = RealDataGenerator.generateRealIncomeExpenseData();
    
    return {
      totalIncome: {
        cash: 0, // 现金收入通过充值获得
        gameCoins: realData.income.game_reward,
        computingPower: realData.income.computing_reward
      },
      totalExpense: {
        cash: realData.expense.purchase + realData.expense.withdrawal,
        gameCoins: 0, // 游戏币主要用于游戏内消费
        computingPower: 0 // 算力不直接消费
      },
      incomeByCategory: {
        game_reward: realData.income.game_reward,
        computing_reward: realData.income.computing_reward,
        trade: realData.income.trade,
        recharge: realData.income.recharge
      },
      expenseByCategory: {
        purchase: realData.expense.purchase,
        trade: realData.expense.trade,
        withdrawal: realData.expense.withdrawal
      }
    };
  }

  // 刷新钱包数据
  async refreshWalletData(): Promise<void> {
    // 清除缓存，强制重新获取数据
    const cacheKey = 'wallet_cache_timestamp';
    localStorage.removeItem(cacheKey);
    
    // 重新获取数据
    await this.getBalance();
    await this.getTransactions();
  }
}

export const realWalletService = new RealWalletService();
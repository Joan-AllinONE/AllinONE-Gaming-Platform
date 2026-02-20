/**
 * 跨平台钱包服务
 * 用于统一管理 AllinONE 与外部游戏(如 New Day) 的货币系统
 */

import { crossPlatformAuthService } from './crossPlatformAuthService';

export type CurrencyType = 'cash' | 'gameCoins' | 'computingPower' | 'aCoins' | 'oCoins';

interface CurrencyBalance {
  cash: number;
  gameCoins: number;
  computingPower: number;
  aCoins: number;
  oCoins: number;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'sale' | 'transfer' | 'reward';
  currencyType: CurrencyType;
  amount: number;
  platform: 'allinone' | 'newday';
  description: string;
  createdAt: number;
  status: 'pending' | 'completed' | 'failed';
}

interface ExchangeRate {
  fromCurrency: CurrencyType;
  toCurrency: CurrencyType;
  rate: number;
}

interface ExchangeRequest {
  fromCurrency: CurrencyType;
  toCurrency: CurrencyType;
  amount: number;
}

class CrossPlatformWalletService {
  private readonly API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  /**
   * 获取用户所有货币余额
   */
  async getBalance(): Promise<CurrencyBalance> {
    try {
      const response = await fetch(
        `${this.API_BASE}/wallet/cross-platform/balance`,
        {
          headers: crossPlatformAuthService.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        console.warn('Cross-platform wallet API not available, using empty balance');
        return {
          cash: 0,
          gameCoins: 0,
          computingPower: 0,
          aCoins: 0,
          oCoins: 0,
        };
      }

      return await response.json();
    } catch (error) {
      console.warn('Error fetching balance:', error);
      return {
        cash: 0,
        gameCoins: 0,
        computingPower: 0,
        aCoins: 0,
        oCoins: 0,
      };
    }
  }

  /**
   * 获取特定货币余额
   */
  async getCurrencyBalance(currencyType: CurrencyType): Promise<number> {
    try {
      const response = await fetch(
        `${this.API_BASE}/wallet/cross-platform/balance/${currencyType}`,
        {
          headers: crossPlatformAuthService.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        console.warn('Cross-platform currency balance API not available');
        return 0;
      }

      const data = await response.json();
      return data.balance || 0;
    } catch (error) {
      console.warn('Error fetching currency balance:', error);
      return 0;
    }
  }

  /**
   * 存款
   */
  async deposit(
    currencyType: CurrencyType,
    amount: number,
    platform?: 'allinone' | 'newday'
  ): Promise<Transaction> {
    try {
      const response = await fetch(
        `${this.API_BASE}/wallet/cross-platform/deposit`,
        {
          method: 'POST',
          headers: crossPlatformAuthService.getAuthHeaders(),
          body: JSON.stringify({
            currencyType,
            amount,
            platform,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to deposit');
      }

      return await response.json();
    } catch (error) {
      console.error('Error depositing:', error);
      throw error;
    }
  }

  /**
   * 提款
   */
  async withdraw(
    currencyType: CurrencyType,
    amount: number,
    platform?: 'allinone' | 'newday'
  ): Promise<Transaction> {
    try {
      const response = await fetch(
        `${this.API_BASE}/wallet/cross-platform/withdraw`,
        {
          method: 'POST',
          headers: crossPlatformAuthService.getAuthHeaders(),
          body: JSON.stringify({
            currencyType,
            amount,
            platform,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to withdraw');
      }

      return await response.json();
    } catch (error) {
      console.error('Error withdrawing:', error);
      throw error;
    }
  }

  /**
   * 货币兑换
   */
  async exchange(request: ExchangeRequest): Promise<Transaction> {
    try {
      const response = await fetch(
        `${this.API_BASE}/wallet/cross-platform/exchange`,
        {
          method: 'POST',
          headers: crossPlatformAuthService.getAuthHeaders(),
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to exchange currency');
      }

      return await response.json();
    } catch (error) {
      console.error('Error exchanging currency:', error);
      throw error;
    }
  }

  /**
   * 获取交易历史
   */
  async getTransactionHistory(
    currencyType?: CurrencyType,
    platform?: 'allinone' | 'newday',
    limit: number = 20,
    offset: number = 0
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const params = new URLSearchParams();
    if (currencyType) params.append('currencyType', currencyType);
    if (platform) params.append('platform', platform);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    try {
      const response = await fetch(
        `${this.API_BASE}/wallet/cross-platform/transactions?${params.toString()}`,
        {
          headers: crossPlatformAuthService.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }

      const data = await response.json();
      return {
        transactions: data.transactions || [],
        total: data.total || 0,
      };
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  /**
   * 获取汇率
   */
  async getExchangeRates(): Promise<ExchangeRate[]> {
    try {
      const response = await fetch(
        `${this.API_BASE}/wallet/cross-platform/exchange-rates`,
        {
          headers: crossPlatformAuthService.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      return data.rates || [];
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      throw error;
    }
  }

  /**
   * 转账给其他平台
   */
  async transferToPlatform(
    currencyType: CurrencyType,
    amount: number,
    targetPlatform: 'allinone' | 'newday',
    targetUserId?: string
  ): Promise<Transaction> {
    try {
      const response = await fetch(
        `${this.API_BASE}/wallet/cross-platform/transfer`,
        {
          method: 'POST',
          headers: crossPlatformAuthService.getAuthHeaders(),
          body: JSON.stringify({
            currencyType,
            amount,
            targetPlatform,
            targetUserId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to transfer');
      }

      return await response.json();
    } catch (error) {
      console.error('Error transferring:', error);
      throw error;
    }
  }

  /**
   * 获取交易详情
   */
  async getTransactionDetails(transactionId: string): Promise<Transaction> {
    try {
      const response = await fetch(
        `${this.API_BASE}/wallet/cross-platform/transactions/${transactionId}`,
        {
          headers: crossPlatformAuthService.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transaction details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      throw error;
    }
  }

  /**
   * 检查余额是否足够
   */
  async checkSufficientBalance(
    currencyType: CurrencyType,
    amount: number
  ): Promise<{ sufficient: boolean; balance: number }> {
    try {
      const balance = await this.getCurrencyBalance(currencyType);
      return {
        sufficient: balance >= amount,
        balance,
      };
    } catch (error) {
      console.error('Error checking balance:', error);
      return {
        sufficient: false,
        balance: 0,
      };
    }
  }
}

// 导出单例
export const crossPlatformWalletService = new CrossPlatformWalletService();

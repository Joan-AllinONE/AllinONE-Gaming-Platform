/**
 * 货币兑换服务
 * 实现 New Day 与 AllinONE 之间的货币 1:1 兑换
 */

import { newDayApiService } from './newDayApiService';
import { walletService } from './walletService';

interface CurrencyBalance {
  newDay: {
    newDayGameCoins: number;    // New Day 游戏币
    cash: number;
    computingPower: number;
  };
  allinone: {
    gameCoins: number;       // AllinONE 游戏币
    newDayGameCoins: number; // New Day 游戏币（分别记录）
    cash: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
  };
}

interface ExchangeRate {
  newDayCoinToGameCoin: number;   // 默认 1:1
  gameCoinToGameCoin: number;     // 默认 1:1
  gameCoinsToNewDay: number;      // AllinONE → New Day
  newDayToGameCoins: number;      // New Day → AllinONE
}

class CurrencyExchangeService {
  private readonly DEFAULT_RATE = 1; // 1:1 兑换比例

  /**
   * 获取综合余额（分别记录，不再合并）
   */
  async getConsolidatedBalance(): Promise<{
    newDay: CurrencyBalance['newDay'];
    allinone: CurrencyBalance['allinone'];
    consolidated: {
      gameCoins: number;       // AllinONE 游戏币
      newDayGameCoins: number; // New Day 游戏币（分别记录）
      cash: number;
      computingPower: number;
      aCoins: number;
      oCoins: number;
    };
  }> {
    try {
      // 获取 New Day 余额
      const newDayBalance = await newDayApiService.getBalance();
      
      // 从 walletService 获取 AllinONE 余额（单一数据源）
      const allinoneBalanceFromService = await walletService.getBalance();
      
      const allinoneBalance: CurrencyBalance['allinone'] = {
        gameCoins: allinoneBalanceFromService.gameCoins,
        newDayGameCoins: allinoneBalanceFromService.newDayGameCoins,
        cash: allinoneBalanceFromService.cash,
        computingPower: allinoneBalanceFromService.computingPower,
        aCoins: allinoneBalanceFromService.aCoins,
        oCoins: allinoneBalanceFromService.oCoins
      };

      return {
        newDay: {
          newDayGameCoins: newDayBalance.newDayGameCoins,
          cash: newDayBalance.cash,
          computingPower: newDayBalance.computingPower
        },
        allinone: allinoneBalance,
        consolidated: {
          gameCoins: allinoneBalance.gameCoins,
          newDayGameCoins: allinoneBalance.newDayGameCoins,
          cash: newDayBalance.cash + allinoneBalance.cash,
          computingPower: newDayBalance.computingPower + allinoneBalance.computingPower,
          aCoins: allinoneBalance.aCoins,
          oCoins: allinoneBalance.oCoins
        }
      };
    } catch (error) {
      console.error('获取综合余额失败:', error);
      throw error;
    }
  }

  /**
   * 消费游戏币（分别记录版本）
   * 根据目标平台决定扣款顺序：
   * - 如果在 New Day 消费：先扣 newDayGameCoins，不够时提示兑换
   * - 如果在 AllinONE 消费：先扣 gameCoins，不够时提示兑换
   * @param amount 需要消费的金额
   * @param platform 消费平台 'newday' | 'allinone'
   * @returns 消费结果和各平台实际消费金额
   */
  async spendGameCoins(
    amount: number, 
    platform: 'newday' | 'allinone' = 'allinone'
  ): Promise<{
    success: boolean;
    message: string;
    spent: {
      fromNewDay: number;    // 从 New Day 游戏币消费
      fromAllinone: number;  // 从 AllinONE 消费
      total: number;
    };
    remaining: {
      newDayGameCoins: number;
      allinoneGameCoins: number;
    };
    needExchange?: {
      needed: boolean;
      from: 'gameCoins' | 'newDayGameCoins';
      to: 'gameCoins' | 'newDayGameCoins';
      amount: number;
    };
  }> {
    try {
      const balance = await this.getConsolidatedBalance();
      
      if (platform === 'newday') {
        // 在 New Day 平台消费
        if (balance.allinone.newDayGameCoins >= amount) {
          // New Day 游戏币充足
          return {
            success: true,
            message: '消费成功',
            spent: { fromNewDay: amount, fromAllinone: 0, total: amount },
            remaining: {
              newDayGameCoins: balance.allinone.newDayGameCoins - amount,
              allinoneGameCoins: balance.allinone.gameCoins
            }
          };
        } else {
          // New Day 游戏币不足，需要兑换
          const shortfall = amount - balance.allinone.newDayGameCoins;
          return {
            success: false,
            message: `New Day 游戏币余额不足。需要 ${amount}，可用 ${balance.allinone.newDayGameCoins}，差额 ${shortfall}`,
            spent: { fromNewDay: 0, fromAllinone: 0, total: 0 },
            remaining: {
              newDayGameCoins: balance.allinone.newDayGameCoins,
              allinoneGameCoins: balance.allinone.gameCoins
            },
            needExchange: {
              needed: true,
              from: 'gameCoins',
              to: 'newDayGameCoins',
              amount: shortfall
            }
          };
        }
      } else {
        // 在 AllinONE 平台消费
        if (balance.allinone.gameCoins >= amount) {
          // AllinONE 游戏币充足
          return {
            success: true,
            message: '消费成功',
            spent: { fromNewDay: 0, fromAllinone: amount, total: amount },
            remaining: {
              newDayGameCoins: balance.allinone.newDayGameCoins,
              allinoneGameCoins: balance.allinone.gameCoins - amount
            }
          };
        } else {
          // AllinONE 游戏币不足，需要兑换
          const shortfall = amount - balance.allinone.gameCoins;
          return {
            success: false,
            message: `AllinONE 游戏币余额不足。需要 ${amount}，可用 ${balance.allinone.gameCoins}，差额 ${shortfall}`,
            spent: { fromNewDay: 0, fromAllinone: 0, total: 0 },
            remaining: {
              newDayGameCoins: balance.allinone.newDayGameCoins,
              allinoneGameCoins: balance.allinone.gameCoins
            },
            needExchange: {
              needed: true,
              from: 'newDayGameCoins',
              to: 'gameCoins',
              amount: shortfall
            }
          };
        }
      }
    } catch (error) {
      console.error('消费游戏币失败:', error);
      return {
        success: false,
        message: '消费失败',
        spent: { fromNewDay: 0, fromAllinone: 0, total: 0 },
        remaining: { newDayGameCoins: 0, allinoneGameCoins: 0 }
      };
    }
  }

  /**
   * 获取 AllinONE 本地余额（从 walletService 读取）
   */
  private async getAllinONEBalance(): Promise<CurrencyBalance['allinone']> {
    try {
      const balance = await walletService.getBalance();
      return {
        gameCoins: balance.gameCoins,
        newDayGameCoins: balance.newDayGameCoins,
        cash: balance.cash,
        computingPower: balance.computingPower,
        aCoins: balance.aCoins,
        oCoins: balance.oCoins
      };
    } catch (error) {
      console.warn('读取 AllinONE 余额失败:', error);
      // 返回默认值
      return {
        gameCoins: 1000,
        newDayGameCoins: 0,
        cash: 0,
        computingPower: 100,
        aCoins: 50,
        oCoins: 0
      };
    }
  }

  /**
   * 保存 AllinONE 余额（通过 walletService）
   */
  private async saveAllinONEBalance(balance: CurrencyBalance['allinone']): Promise<void> {
    // 触发事件通知其他组件
    window.dispatchEvent(new CustomEvent('walletBalanceChanged', { detail: balance }));
  }

  /**
   * 从 New Day 转账游戏币到 AllinONE（分别记录）
   * 转账到 newDayGameCoins 而不是合并到 gameCoins
   */
  async transferFromNewDayToAllinone(amount: number): Promise<{
    success: boolean;
    message: string;
    transferred: number;
  }> {
    try {
      const balance = await this.getConsolidatedBalance();
      
      if (balance.newDay.newDayGameCoins < amount) {
        return {
          success: false,
          message: `New Day 游戏币不足。需要 ${amount}，可用 ${balance.newDay.newDayGameCoins}`,
          transferred: 0
        };
      }

      // 使用 walletService 增加 newDayGameCoins
      await walletService.addTransaction({
        type: 'income',
        category: 'trade',
        amount,
        currency: 'newDayGameCoins',
        description: '从 New Day 转账获得'
      });

      return {
        success: true,
        message: `成功从 New Day 转账 ${amount} 游戏币到 AllinONE（New Day 游戏币账户）`,
        transferred: amount
      };
    } catch (error) {
      console.error('转账失败:', error);
      return {
        success: false,
        message: '转账失败',
        transferred: 0
      };
    }
  }

  /**
   * 兑换游戏币（使用 walletService）
   */
  async exchangeGameCoins(
    fromType: 'gameCoins' | 'newDayGameCoins',
    toType: 'gameCoins' | 'newDayGameCoins',
    amount: number
  ): Promise<{ success: boolean; message: string; received: number }> {
    return walletService.exchangeGameCoins(fromType, toType, amount);
  }
}

export const currencyExchangeService = new CurrencyExchangeService();

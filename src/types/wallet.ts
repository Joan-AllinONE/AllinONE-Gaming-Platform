// 钱包相关类型定义
import { Currency } from './common';

export interface WalletBalance {
  cash: number;           // 现金余额（人民币）
  gameCoins: number;      // 游戏币余额
  computingPower: number; // 算力余额
  aCoins: number;         // A币余额（平台币）
  oCoins: number;         // O币余额（证券类型代币）
  totalValue: number;     // 总价值（以现金计算）
  lastUpdated: Date;      // 最后更新时间
}

export interface WalletTransaction {
  id: string;
  type: 'income' | 'expense';
  category: 'game_reward' | 'purchase' | 'trade' | 'recharge' | 'withdrawal' | 'computing_reward' | 'commission' | 'acoin_distribution' | 'ocoin_distribution' | 'ocoin_dividend' | 'ocoin_vesting' | 'exchange' | 'dividend';
  amount: number;
  currency: Currency;
  description: string;
  timestamp: Date;
  relatedId?: string; // 关联的游戏记录或交易ID
}

export interface WalletStats {
  // 收入
  todayIncome: {
    cash: number;
    gameCoins: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
  };
  weeklyIncome: {
    cash: number;
    gameCoins: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
  };
  monthlyIncome: {
    cash: number;
    gameCoins: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
  };

  // 支出
  todayExpense: {
    cash: number;
    gameCoins: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
  };
  weeklyExpense: {
    cash: number;
    gameCoins: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
  };
  monthlyExpense: {
    cash: number;
    gameCoins: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
  };

  // 累计
  totalIncome: {
    cash: number;
    gameCoins: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
  };
  totalExpense: {
    cash: number;
    gameCoins: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
  };

  totalTransactions: number;
  lastTransactionTime: Date;
}

export interface ExchangeRate {
  gameCoinsToRMB: number;     // 游戏币兑换人民币汇率
  computingPowerToRMB: number; // 算力兑换人民币汇率
  lastUpdated: Date;
}
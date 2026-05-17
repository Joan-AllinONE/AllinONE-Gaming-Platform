// 钱包相关类型定义
import { Currency, GameCoinType } from './common';

export interface WalletBalance {
  cash: number;           // 现金余额（人民币）
  gameCoins: number;      // AllinONE 游戏币余额
  newDayGameCoins: number; // New Day 游戏币余额
  computingPower: number; // 算力余额
  aCoins: number;         // A币余额（平台币）
  oCoins: number;         // O币余额（证券类型代币）
  vouchers: number;       // 凭证余额（A币凭证总价值）- 向后兼容
  voucherCount: number;   // 凭证数量 - 向后兼容
  
  // 双轨凭证系统字段
  instantVouchers: number;       // 即时发放型凭证价值
  instantVoucherCount: number;   // 即时发放型凭证数量
  algorithmVouchers: number;     // 计算分配型凭证价值（A币日结/分红）
  algorithmVoucherCount: number; // 计算分配型凭证数量
  
  totalValue: number;     // 总价值（以现金计算）
  lastUpdated: Date;      // 最后更新时间
}

/**
 * 游戏币汇总信息（用于下拉显示）
 */
export interface GameCoinsSummary {
  total: number;                    // 游戏币总计
  types: GameCoinType[];           // 各类型游戏币明细
  exchangeRates: {
    gameCoinsToNewDay: number;     // AllinONE → New Day 汇率
    newDayToGameCoins: number;     // New Day → AllinONE 汇率
  };
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
    newDayGameCoins: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
    vouchers: number;
  };
  weeklyIncome: {
    cash: number;
    gameCoins: number;
    newDayGameCoins: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
    vouchers: number;
  };
  monthlyIncome: {
    cash: number;
    gameCoins: number;
    newDayGameCoins: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
    vouchers: number;
  };

  // 支出
  todayExpense: {
    cash: number;
    gameCoins: number;
    newDayGameCoins: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
    vouchers: number;
  };
  weeklyExpense: {
    cash: number;
    gameCoins: number;
    newDayGameCoins: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
    vouchers: number;
  };
  monthlyExpense: {
    cash: number;
    gameCoins: number;
    newDayGameCoins: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
    vouchers: number;
  };

  // 累计
  totalIncome: {
    cash: number;
    gameCoins: number;
    newDayGameCoins: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
    vouchers: number;
  };
  totalExpense: {
    cash: number;
    gameCoins: number;
    newDayGameCoins: number;
    computingPower: number;
    aCoins: number;
    oCoins: number;
    vouchers: number;
  };

  totalTransactions: number;
  lastTransactionTime: Date;
}

export interface ExchangeRate {
  gameCoinsToRMB: number;        // AllinONE 游戏币兑换人民币汇率
  newDayGameCoinsToRMB: number;  // New Day 游戏币兑换人民币汇率
  computingPowerToRMB: number;   // 算力兑换人民币汇率
  gameCoinsToNewDay: number;     // AllinONE 游戏币 → New Day 游戏币汇率（默认1:1）
  newDayToGameCoins: number;     // New Day 游戏币 → AllinONE 游戏币汇率（默认1:1）
  lastUpdated: Date;
}
// 真实数据生成器 - 基于用户实际活动生成真实的收支数据
export class RealDataGenerator {
  
  // 生成基于真实游戏活动的收支数据
  static generateRealIncomeExpenseData() {
    const gameData = this.getGameActivityData();
    const marketData = this.getMarketActivityData();
    const walletData = this.getWalletActivityData();
    
    return {
      // 真实收入数据
      income: {
        game_reward: gameData.totalGameCoinsEarned,
        computing_reward: gameData.totalComputingPowerEarned,
        trade: marketData.totalSalesIncome,
        recharge: walletData.totalRechargeAmount
      },
      // 真实支出数据
      expense: {
        purchase: marketData.totalPurchaseExpense,
        trade: marketData.totalTradeFees,
        withdrawal: walletData.totalWithdrawalAmount
      },
      // 当前真实余额
      balance: {
        cash: walletData.currentCashBalance,
        gameCoins: gameData.currentGameCoins,
        computingPower: gameData.currentComputingPower
      }
    };
  }

  // 获取游戏活动数据
  private static getGameActivityData() {
    const gameStats = localStorage.getItem('computing_power_data_user_001');
    if (gameStats) {
      const data = JSON.parse(gameStats);
      
      // 计算真实的游戏收益
      const totalGameCoinsEarned = data.gameRecords?.reduce((sum: number, record: any) => {
        // 基于游戏得分计算真实奖励
        const scoreBonus = Math.floor(record.score / 100);
        return sum + scoreBonus;
      }, 0) || 0;

      const totalComputingPowerEarned = data.stats?.totalComputingPower || 0;
      
      return {
        totalGameCoinsEarned,
        totalComputingPowerEarned,
        currentGameCoins: totalGameCoinsEarned,
        currentComputingPower: totalComputingPowerEarned,
        totalGamesPlayed: data.stats?.totalGamesPlayed || 0
      };
    }
    
    return {
      totalGameCoinsEarned: 0,
      totalComputingPowerEarned: 0,
      currentGameCoins: 0,
      currentComputingPower: 0,
      totalGamesPlayed: 0
    };
  }

  // 获取市场活动数据
  private static getMarketActivityData() {
    const marketTransactions = localStorage.getItem('marketplace_transactions');
    let totalSalesIncome = 0;
    let totalPurchaseExpense = 0;
    let totalTradeFees = 0;

    if (marketTransactions) {
      const transactions = JSON.parse(marketTransactions);
      
      transactions.forEach((tx: any) => {
        if (tx.type === 'sale') {
          totalSalesIncome += tx.amount;
          totalTradeFees += tx.amount * 0.05; // 5% 交易费
        } else if (tx.type === 'purchase') {
          totalPurchaseExpense += tx.amount;
        }
      });
    }

    return {
      totalSalesIncome,
      totalPurchaseExpense,
      totalTradeFees
    };
  }

  // 获取钱包活动数据
  private static getWalletActivityData() {
    const walletData = localStorage.getItem('wallet_data');
    let totalRechargeAmount = 0;
    let totalWithdrawalAmount = 0;
    let currentCashBalance = 0;

    if (walletData) {
      const data = JSON.parse(walletData);
      
      // 计算真实的充值和提现记录
      if (data.transactions) {
        data.transactions.forEach((tx: any) => {
          if (tx.type === 'income' && tx.category === 'recharge') {
            totalRechargeAmount += tx.amount;
          } else if (tx.type === 'expense' && tx.category === 'withdrawal') {
            totalWithdrawalAmount += tx.amount;
          }
        });
      }

      // 计算当前现金余额
      currentCashBalance = data.balance?.cash || 0;
    }

    return {
      totalRechargeAmount,
      totalWithdrawalAmount,
      currentCashBalance
    };
  }

  // 生成真实的交易记录
  static generateRealTransactions(limit: number = 20): any[] {
    const transactions: any[] = [];
    const gameData = this.getGameActivityData();
    
    // 从游戏记录生成真实交易
    const gameStats = localStorage.getItem('computing_power_data_user_001');
    if (gameStats) {
      const data = JSON.parse(gameStats);
      
      if (data.gameRecords) {
        data.gameRecords.slice(0, limit).forEach((record: any, index: number) => {
          const scoreBonus = Math.floor(record.score / 100);
          const computingReward = record.computingPowerEarned || 0;
          
          // 游戏币奖励交易
          if (scoreBonus > 0) {
            transactions.push({
              id: `real_game_coins_${record.id}`,
              type: 'income',
              category: 'game_reward',
              amount: scoreBonus,
              currency: 'gameCoins',
              description: `游戏奖励 - 得分: ${record.score.toLocaleString()}`,
              timestamp: new Date(record.completedAt),
              relatedId: record.id
            });
          }

          // 算力奖励交易
          if (computingReward > 0) {
            transactions.push({
              id: `real_computing_${record.id}`,
              type: 'income',
              category: 'computing_reward',
              amount: computingReward,
              currency: 'computingPower',
              description: `算力奖励 - 游戏类型: ${record.gameType}`,
              timestamp: new Date(record.completedAt),
              relatedId: record.id
            });
          }
        });
      }
    }

    // 添加其他真实交易记录
    const walletData = localStorage.getItem('wallet_data');
    if (walletData) {
      const data = JSON.parse(walletData);
      if (data.transactions) {
        data.transactions.slice(0, 10).forEach((tx: any) => {
          transactions.push({
            ...tx,
            timestamp: new Date(tx.timestamp)
          });
        });
      }
    }

    // 按时间排序并限制数量
    return transactions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // 获取真实的资产分布数据
  static getRealAssetDistribution() {
    const realData = this.generateRealIncomeExpenseData();
    const totalValue = realData.balance.cash + 
                      (realData.balance.gameCoins * 0.01) + 
                      (realData.balance.computingPower * 0.001);

    if (totalValue === 0) {
      return {
        cashPercentage: 0,
        gameCoinsPercentage: 0,
        computingPowerPercentage: 0
      };
    }

    return {
      cashPercentage: (realData.balance.cash / totalValue) * 100,
      gameCoinsPercentage: ((realData.balance.gameCoins * 0.01) / totalValue) * 100,
      computingPowerPercentage: ((realData.balance.computingPower * 0.001) / totalValue) * 100
    };
  }

  // 获取真实的收支趋势数据
  static getRealIncomeExpenseTrend(days: number = 7) {
    const transactions: any[] = this.generateRealTransactions(100);
    const now = new Date();
    const trendData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayTransactions = transactions.filter(tx => 
        tx.timestamp >= dayStart && tx.timestamp < dayEnd
      );

      let dayIncome = 0;
      let dayExpense = 0;

      dayTransactions.forEach(tx => {
        const value = this.convertToRMB(tx.amount, tx.currency);
        if (tx.type === 'income') {
          dayIncome += value;
        } else {
          dayExpense += value;
        }
      });

      trendData.push({
        date: dayStart.toLocaleDateString('zh-CN'),
        income: dayIncome,
        expense: dayExpense,
        net: dayIncome - dayExpense
      });
    }

    return trendData;
  }

  // 货币转换为人民币
  private static convertToRMB(amount: number, currency: string): number {
    switch (currency) {
      case 'cash': return amount;
      case 'gameCoins': return amount * 0.01;
      case 'computingPower': return amount * 0.001;
      default: return 0;
    }
  }
}
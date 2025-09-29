import { WalletBalance, WalletTransaction, WalletStats, ExchangeRate } from '@/types/wallet';
import { gameActivityService } from './gameActivityService';
import oCoinService from './oCoinService';

class WalletService {
  private readonly STORAGE_KEY = 'wallet_data';
  private readonly EXCHANGE_RATES_KEY = 'exchange_rates';
  
  // 默认汇率
  private readonly DEFAULT_EXCHANGE_RATES: ExchangeRate = {
    gameCoinsToRMB: 0.01,        // 1游戏币 = 0.01元
    computingPowerToRMB: 0.001,  // 1算力 = 0.001元
    lastUpdated: new Date()
  };

  // O币价格是动态的，需要从oCoinService获取
  private async getOCoinPrice(): Promise<number> {
    try {
      const marketData = await oCoinService.getOCoinMarketData();
      return marketData.currentPrice;
    } catch (error) {
      console.error('获取O币价格失败:', error);
      return 1; // 默认价格
    }
  }

  constructor() {
    // 异步初始化，但不等待完成
    this.initializeWalletData().catch(error => {
      console.error('初始化钱包数据失败:', error);
    });
  }

  private async initializeWalletData(): Promise<void> {
    const existingData = localStorage.getItem(this.STORAGE_KEY);
    if (!existingData) {
      const initialWallet = {
        balance: {
          cash: 0,
          gameCoins: 12580, // 保持原有的游戏币数量
          computingPower: 45230, // 保持原有的算力数量
          aCoins: 15.67, // 初始A币余额
          oCoins: 0, // 初始O币余额为0
          totalValue: 0,
          lastUpdated: new Date()
        } as WalletBalance,
        transactions: [] as WalletTransaction[],
        stats: {
          // 收入
          todayIncome: { cash: 0, gameCoins: 0, computingPower: 0, aCoins: 0, oCoins: 0 },
          weeklyIncome: { cash: 0, gameCoins: 0, computingPower: 0, aCoins: 0, oCoins: 0 },
          monthlyIncome: { cash: 0, gameCoins: 0, computingPower: 0, aCoins: 0, oCoins: 0 },
          // 支出
          todayExpense: { cash: 0, gameCoins: 0, computingPower: 0, aCoins: 0, oCoins: 0 },
          weeklyExpense: { cash: 0, gameCoins: 0, computingPower: 0, aCoins: 0, oCoins: 0 },
          monthlyExpense: { cash: 0, gameCoins: 0, computingPower: 0, aCoins: 0, oCoins: 0 },
          // 累计
          totalIncome: { cash: 0, gameCoins: 0, computingPower: 0, aCoins: 0, oCoins: 0 },
          totalExpense: { cash: 0, gameCoins: 0, computingPower: 0, aCoins: 0, oCoins: 0 },
          totalTransactions: 0,
          lastTransactionTime: new Date()
        } as WalletStats
      };
      
      // 计算总价值
      initialWallet.balance.totalValue = await this.calculateTotalValue(initialWallet.balance);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialWallet));
    }

    // 初始化汇率数据
    const existingRates = localStorage.getItem(this.EXCHANGE_RATES_KEY);
    if (!existingRates) {
      localStorage.setItem(this.EXCHANGE_RATES_KEY, JSON.stringify(this.DEFAULT_EXCHANGE_RATES));
    }
  }

  private async getWalletData() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      await this.initializeWalletData();
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)!);
    }
    
    const walletData = JSON.parse(data);
    
    // 数据迁移：确保现有钱包数据包含 aCoins 和 oCoins 字段
    if (walletData.balance) {
      let needsUpdate = false;

      // 🔥 数据迁移：将 computing 重命名为 computingPower
      if (walletData.balance.hasOwnProperty('computing')) {
        walletData.balance.computingPower = walletData.balance.computing;
        delete walletData.balance.computing;
        needsUpdate = true;
      }
      if (walletData.transactions && Array.isArray(walletData.transactions)) {
        walletData.transactions.forEach((tx: any) => {
          if (tx.currency === 'computing') {
            tx.currency = 'computingPower';
            needsUpdate = true;
          }
        });
      }
      if (walletData.stats) {
        ['todayIncome', 'weeklyIncome', 'monthlyIncome', 'todayExpense', 'weeklyExpense', 'monthlyExpense', 'totalIncome', 'totalExpense'].forEach(statKey => {
          if (walletData.stats[statKey] && walletData.stats[statKey].hasOwnProperty('computing')) {
            walletData.stats[statKey].computingPower = walletData.stats[statKey].computing;
            delete walletData.stats[statKey].computing;
            needsUpdate = true;
          }
        });
      }
      
      if (typeof walletData.balance.aCoins === 'undefined') {
        walletData.balance.aCoins = 15.67; // 为现有用户添加初始A币余额
        needsUpdate = true;
      }
      
      if (typeof walletData.balance.oCoins === 'undefined') {
        walletData.balance.oCoins = 0; // 为现有用户添加初始O币余额
        needsUpdate = true;
      }
      
      // 更新统计数据
      if (needsUpdate && walletData.stats) {
        // 确保收入字段存在
        walletData.stats.todayIncome.aCoins = walletData.stats.todayIncome.aCoins || 0;
        walletData.stats.weeklyIncome.aCoins = walletData.stats.weeklyIncome.aCoins || 0;
        walletData.stats.monthlyIncome.aCoins = walletData.stats.monthlyIncome.aCoins || 0;

        walletData.stats.todayIncome.oCoins = walletData.stats.todayIncome.oCoins || 0;
        walletData.stats.weeklyIncome.oCoins = walletData.stats.weeklyIncome.oCoins || 0;
        walletData.stats.monthlyIncome.oCoins = walletData.stats.monthlyIncome.oCoins || 0;

        // 确保支出与累计字段存在
        walletData.stats.todayExpense = walletData.stats.todayExpense || { cash: 0, gameCoins: 0, computingPower: 0, aCoins: 0, oCoins: 0 };
        walletData.stats.weeklyExpense = walletData.stats.weeklyExpense || { cash: 0, gameCoins: 0, computingPower: 0, aCoins: 0, oCoins: 0 };
        walletData.stats.monthlyExpense = walletData.stats.monthlyExpense || { cash: 0, gameCoins: 0, computingPower: 0, aCoins: 0, oCoins: 0 };
        walletData.stats.totalIncome = walletData.stats.totalIncome || { cash: 0, gameCoins: 0, computingPower: 0, aCoins: 0, oCoins: 0 };
        walletData.stats.totalExpense = walletData.stats.totalExpense || { cash: 0, gameCoins: 0, computingPower: 0, aCoins: 0, oCoins: 0 };

        // 临时设置总价值为0，后续会在getBalance中异步更新
        walletData.balance.totalValue = 0;

        // 保存更新后的数据
        this.saveWalletData(walletData);
      }
    }
    
    return walletData;
  }

  private saveWalletData(data: any): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  private getExchangeRates(): ExchangeRate {
    const rates = localStorage.getItem(this.EXCHANGE_RATES_KEY);
    return rates ? JSON.parse(rates) : this.DEFAULT_EXCHANGE_RATES;
  }

  private async calculateTotalValue(balance: WalletBalance): Promise<number> {
    const rates = this.getExchangeRates();
    const oCoinPrice = await this.getOCoinPrice();
    
    return balance.cash + 
           (balance.gameCoins * rates.gameCoinsToRMB) + 
           (balance.computingPower * rates.computingPowerToRMB) +
           (balance.aCoins * 1.0) + // A币 1:1 兑换人民币
           (balance.oCoins * oCoinPrice); // O币价格是动态的
  }

  // 获取钱包余额
  async getBalance(): Promise<WalletBalance> {
    const walletData = await this.getWalletData();
    const balance = walletData.balance;
    
    // 注释掉实时更新算力数据，避免覆盖游戏奖励
    // try {
    //   const computingData = await gameActivityService.getPlayerComputingPowerBreakdown('current-user');
    //   balance.computingPower = computingData.total;
    // } catch (error) {
    //   console.warn('获取算力数据失败，使用缓存数据:', error);
    // }
    
    // 检查并执行O币期权解禁
    try {
      const vestingResult = await oCoinService.checkAndExecuteVesting('current-user-id');
      if (vestingResult.vestedAmount > 0) {
        console.log(`O币期权解禁: ${vestingResult.vestedAmount} O币`);
        balance.oCoins = await this.getOCoinBalance();
      }
    } catch (error) {
      console.warn('检查O币期权解禁失败:', error);
    }
    
    // 重新计算总价值
    balance.totalValue = await this.calculateTotalValue(balance);
    balance.lastUpdated = new Date();

    // 非负兜底，避免显示为负数
    balance.computingPower = Math.max(balance.computingPower, 0);
    balance.gameCoins = Math.max(balance.gameCoins, 0);
    
    // 保存更新后的数据
    walletData.balance = balance;
    this.saveWalletData(walletData);
    
    return balance;
  }

  // 添加交易记录
  async addTransaction(transaction: Omit<WalletTransaction, 'id' | 'timestamp'>): Promise<void> {
    const walletData = await this.getWalletData();
    
    const newTransaction: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...transaction
    };

    // 更新余额
    if (transaction.type === 'income') {
      walletData.balance[transaction.currency] += transaction.amount;
    } else {
      walletData.balance[transaction.currency] -= transaction.amount;
    }

    // 非负兜底，防止出现负值
    if (['cash','gameCoins','computingPower','aCoins','oCoins'].includes(transaction.currency)) {
      walletData.balance[transaction.currency] = Math.max(walletData.balance[transaction.currency], 0);
    }

    // 添加交易记录
    walletData.transactions.unshift(newTransaction);
    
    // 更新统计数据
    this.updateStats(walletData, newTransaction);
    
    // 重新计算总价值
    walletData.balance.totalValue = await this.calculateTotalValue(walletData.balance);
    walletData.balance.lastUpdated = new Date();
    
    this.saveWalletData(walletData);
  }

  private updateStats(walletData: any, transaction: WalletTransaction): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const amount = transaction.amount;
    const currency = transaction.currency;

    const key = currency as 'cash' | 'gameCoins' | 'computingPower' | 'aCoins' | 'oCoins';

    if (transaction.type === 'income') {
      // 今日/周/月收入
      if (transaction.timestamp >= today) walletData.stats.todayIncome[key] += amount;
      if (transaction.timestamp >= thisWeek) walletData.stats.weeklyIncome[key] += amount;
      if (transaction.timestamp >= thisMonth) walletData.stats.monthlyIncome[key] += amount;
      // 累计收入
      walletData.stats.totalIncome[key] += amount;
    } else {
      // 今日/周/月支出
      if (transaction.timestamp >= today) walletData.stats.todayExpense[key] += amount;
      if (transaction.timestamp >= thisWeek) walletData.stats.weeklyExpense[key] += amount;
      if (transaction.timestamp >= thisMonth) walletData.stats.monthlyExpense[key] += amount;
      // 累计支出
      walletData.stats.totalExpense[key] += amount;
    }

    walletData.stats.totalTransactions += 1;
    walletData.stats.lastTransactionTime = transaction.timestamp;
  }

  // 获取交易记录
  async getTransactions(limit: number = 50): Promise<WalletTransaction[]> {
    const walletData = await this.getWalletData();
    return walletData.transactions.slice(0, limit);
  }

  // 获取钱包统计
  // 基于全部交易重算统计，保证历史交易也生效
  private recomputeStats(walletData: any): WalletStats {
    const stats: WalletStats = walletData.stats;
    // 先清零
    const zero = { cash: 0, gameCoins: 0, computingPower: 0, aCoins: 0, oCoins: 0 };
    stats.todayIncome = { ...zero };
    stats.weeklyIncome = { ...zero };
    stats.monthlyIncome = { ...zero };
    stats.todayExpense = { ...zero };
    stats.weeklyExpense = { ...zero };
    stats.monthlyExpense = { ...zero };
    stats.totalIncome = { ...zero };
    stats.totalExpense = { ...zero };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const tx of walletData.transactions) {
      const amount = tx.amount;
      const key = tx.currency as 'cash' | 'gameCoins' | 'computingPower' | 'aCoins' | 'oCoins';
      // 将字符串时间戳转为 Date
      const ts = typeof tx.timestamp === 'string' ? new Date(tx.timestamp) : tx.timestamp as Date;

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

  async getStats(): Promise<WalletStats> {
    const walletData = await this.getWalletData();
    walletData.stats = this.recomputeStats(walletData);
    this.saveWalletData(walletData);
    return walletData.stats;
  }

  // 游戏奖励（算力和游戏币）
  async addGameReward(computingPower: number, gameCoins: number, gameId?: string): Promise<void> {
    console.log('开始添加游戏奖励:', { computingPower, gameCoins, gameId });
    
    const walletData = await this.getWalletData();
    const oldBalance = { ...walletData.balance };
    
    console.log('添加奖励前的余额:', oldBalance);
    
    if (computingPower > 0) {
      await this.addTransaction({
        type: 'income',
        category: 'computing_reward',
        amount: computingPower,
        currency: 'computingPower',
        description: `游戏奖励获得算力`,
        relatedId: gameId
      });
    }

    if (gameCoins > 0) {
      await this.addTransaction({
        type: 'income',
        category: 'game_reward',
        amount: gameCoins,
        currency: 'gameCoins',
        description: `游戏奖励获得游戏币`,
        relatedId: gameId
      });
    }
    
    // 验证更新后的余额
    const newWalletData = await this.getWalletData();
    console.log('添加奖励后的余额:', newWalletData.balance);
    
    // 触发钱包更新事件
    window.dispatchEvent(new CustomEvent('wallet-updated', { 
      detail: { 
        oldBalance, 
        newBalance: newWalletData.balance,
        reward: { computingPower, gameCoins }
      } 
    }));
  }

  // 购买消费
  async makePurchase(amount: number, currency: 'cash' | 'gameCoins', description: string, relatedId?: string): Promise<boolean> {
    const balance = await this.getBalance();
    
    if (balance[currency] < amount) {
      throw new Error(`余额不足，当前${currency === 'cash' ? '现金' : '游戏币'}余额: ${balance[currency]}`);
    }

    await this.addTransaction({
      type: 'expense',
      category: 'purchase',
      amount,
      currency,
      description,
      relatedId
    });

    return true;
  }

  // 充值现金
  async recharge(amount: number, method: string = '支付宝'): Promise<void> {
    await this.addTransaction({
      type: 'income',
      category: 'recharge',
      amount,
      currency: 'cash',
      description: `通过${method}充值现金`
    });
  }

  // 获取汇率
  async getExchangeRatesAsync(): Promise<ExchangeRate> {
    return this.getExchangeRates();
  }

  // 货币兑换
  async exchangeCurrency(
    fromCurrency: 'cash' | 'gameCoins' | 'computingPower' | 'aCoins' | 'oCoins',
    toCurrency: 'cash' | 'gameCoins' | 'computingPower' | 'aCoins' | 'oCoins',
    amount: number
  ): Promise<number> {
    const balance = await this.getBalance();
    const rates = this.getExchangeRates();

    // 添加A币和O币汇率
    const aCoinsRate = 1; // A币与人民币1:1兑换
    const oCoinPrice = await this.getOCoinPrice(); // O币价格是动态的

    if (balance[fromCurrency] < amount) {
      throw new Error(`余额不足`);
    }

    let exchangeAmount = 0;
    let exchangeRate = 0;

    // 计算兑换金额和汇率
    if (fromCurrency === 'gameCoins' && toCurrency === 'cash') {
      exchangeAmount = amount * rates.gameCoinsToRMB;
      exchangeRate = rates.gameCoinsToRMB;
    } else if (fromCurrency === 'computingPower' && toCurrency === 'cash') {
      exchangeAmount = amount * rates.computingPowerToRMB;
      exchangeRate = rates.computingPowerToRMB;
    } else if (fromCurrency === 'cash' && toCurrency === 'gameCoins') {
      exchangeAmount = amount / rates.gameCoinsToRMB;
      exchangeRate = 1 / rates.gameCoinsToRMB;
    } else if (fromCurrency === 'cash' && toCurrency === 'computingPower') {
      exchangeAmount = amount / rates.computingPowerToRMB;
      exchangeRate = 1 / rates.computingPowerToRMB;
    } 
    // A币兑换相关
    else if (fromCurrency === 'aCoins' && toCurrency === 'cash') {
      exchangeAmount = amount * aCoinsRate;
      exchangeRate = aCoinsRate;
    } else if (fromCurrency === 'cash' && toCurrency === 'aCoins') {
      exchangeAmount = amount / aCoinsRate;
      exchangeRate = 1 / aCoinsRate;
    } else if (fromCurrency === 'aCoins' && toCurrency === 'gameCoins') {
      exchangeAmount = amount * aCoinsRate / rates.gameCoinsToRMB;
      exchangeRate = aCoinsRate / rates.gameCoinsToRMB;
    } else if (fromCurrency === 'gameCoins' && toCurrency === 'aCoins') {
      exchangeAmount = amount * rates.gameCoinsToRMB / aCoinsRate;
      exchangeRate = rates.gameCoinsToRMB / aCoinsRate;
    } else if (fromCurrency === 'aCoins' && toCurrency === 'computingPower') {
      exchangeAmount = amount * aCoinsRate / rates.computingPowerToRMB;
      exchangeRate = aCoinsRate / rates.computingPowerToRMB;
    } else if (fromCurrency === 'computingPower' && toCurrency === 'aCoins') {
      exchangeAmount = amount * rates.computingPowerToRMB / aCoinsRate;
      exchangeRate = rates.computingPowerToRMB / aCoinsRate;
    } 
    // O币兑换相关
    else if (fromCurrency === 'oCoins' && toCurrency === 'cash') {
      exchangeAmount = amount * oCoinPrice;
      exchangeRate = oCoinPrice;
    } else if (fromCurrency === 'cash' && toCurrency === 'oCoins') {
      exchangeAmount = amount / oCoinPrice;
      exchangeRate = 1 / oCoinPrice;
    } else if (fromCurrency === 'oCoins' && toCurrency === 'gameCoins') {
      exchangeAmount = amount * oCoinPrice / rates.gameCoinsToRMB;
      exchangeRate = oCoinPrice / rates.gameCoinsToRMB;
    } else if (fromCurrency === 'gameCoins' && toCurrency === 'oCoins') {
      exchangeAmount = amount * rates.gameCoinsToRMB / oCoinPrice;
      exchangeRate = rates.gameCoinsToRMB / oCoinPrice;
    } else if (fromCurrency === 'oCoins' && toCurrency === 'computingPower') {
      exchangeAmount = amount * oCoinPrice / rates.computingPowerToRMB;
      exchangeRate = oCoinPrice / rates.computingPowerToRMB;
    } else if (fromCurrency === 'computingPower' && toCurrency === 'oCoins') {
      exchangeAmount = amount * rates.computingPowerToRMB / oCoinPrice;
      exchangeRate = rates.computingPowerToRMB / oCoinPrice;
    } else if (fromCurrency === 'oCoins' && toCurrency === 'aCoins') {
      exchangeAmount = amount * oCoinPrice / aCoinsRate;
      exchangeRate = oCoinPrice / aCoinsRate;
    } else if (fromCurrency === 'aCoins' && toCurrency === 'oCoins') {
      exchangeAmount = amount * aCoinsRate / oCoinPrice;
      exchangeRate = aCoinsRate / oCoinPrice;
    } else {
      throw new Error('不支持的兑换类型');
    }

    // 扣除原货币
    await this.addTransaction({
      type: 'expense',
      category: 'trade',
      amount,
      currency: fromCurrency,
      description: `兑换${fromCurrency}为${toCurrency}`
    });

    // 增加目标货币
    await this.addTransaction({
      type: 'income',
      category: 'trade',
      amount: exchangeAmount,
      currency: toCurrency,
      description: `兑换获得${toCurrency}（汇率: ${exchangeRate.toFixed(4)}）`
    });
    
    return exchangeAmount;
  }

  // A币发放方法
  async distributeACoins(amount: number, description: string = 'A币发放奖励'): Promise<void> {
    if (amount <= 0) {
      throw new Error('发放金额必须大于0');
    }

    // 去重保护：当天是否已发放过A币（根据类别与日期判断）
    const existing = await this.getTransactions(50);
    const today = new Date(); today.setHours(0,0,0,0);
    const hasTodayACoinDist = existing.some(tx => {
      const ts = typeof tx.timestamp === 'string' ? new Date(tx.timestamp) : tx.timestamp as Date;
      return tx.category === 'acoin_distribution' && ts >= today;
    });
    if (hasTodayACoinDist) {
      console.warn('今日A币已发放，跳过重复发放');
      return;
    }

    await this.addTransaction({
      type: 'income',
      category: 'acoin_distribution', // 明确标记为A币发放类别
      amount,
      currency: 'aCoins', // 确保货币类型为A币
      description: `A币发放奖励 - ${description}` // 确保描述明确表明是A币奖励
    });
  }

  // 获取A币余额
  async getACoinBalance(): Promise<number> {
    const balance = await this.getBalance();
    return balance.aCoins;
  }

  // 获取A币交易记录
  async getACoinTransactions(limit: number = 50): Promise<WalletTransaction[]> {
    const transactions = await this.getTransactions(limit);
    return transactions.filter(tx => tx.currency === 'aCoins');
  }

  // 获取O币余额
  async getOCoinBalance(): Promise<number> {
    const balance = await this.getBalance();
    return balance.oCoins;
  }

  // 获取O币交易记录
  async getOCoinTransactions(limit: number = 50): Promise<WalletTransaction[]> {
    const transactions = await this.getTransactions(limit);
    return transactions.filter(tx => tx.currency === 'oCoins');
  }

  // 分发O币
  async distributeOCoins(amount: number, description: string = 'O币发放'): Promise<void> {
    if (amount <= 0) {
      throw new Error('发放金额必须大于0');
    }

    await this.addTransaction({
      type: 'income',
      category: 'ocoin_distribution',
      amount,
      currency: 'oCoins',
      description: `O币发放 - ${description}`
    });
  }

  // 记录O币分红
  async recordOCoinDividend(amount: number, description: string = '平台分红'): Promise<void> {
    if (amount <= 0) {
      throw new Error('分红金额必须大于0');
    }

    await this.addTransaction({
      type: 'income',
      category: 'ocoin_dividend',
      amount,
      currency: 'cash', // 分红是以现金形式发放的
      description: `O币分红 - ${description}`
    });
  }

  // 记录O币期权解禁
  async recordOCoinVesting(amount: number, description: string = 'O币期权解禁'): Promise<void> {
    if (amount <= 0) {
      throw new Error('解禁金额必须大于0');
    }

    await this.addTransaction({
      type: 'income',
      category: 'ocoin_vesting',
      amount,
      currency: 'oCoins',
      description: `O币期权解禁 - ${description}`
    });
    
    // 🔥 触发钱包更新事件，让个人中心实时看到O币变化
    window.dispatchEvent(new CustomEvent('wallet-updated', {
      detail: { 
        type: 'ocoin_vesting',
        amount: amount,
        timestamp: new Date()
      }
    }));
    
    console.log(`💰 记录O币期权解禁: ${amount} O币`);
  }


  // 发放现金分红
  async distributeCashDividend(userId: string, amount: number, periodId: string, description: string = '现金分红'): Promise<void> {
    if (amount <= 0) {
      throw new Error('分红金额必须大于0');
    }

    // 幂等保护：同一用户、同一周期的现金分红只记一次
    const transactionRelatedId = `${periodId}-${userId}`;
    const existing = await this.getTransactions(200);
    const already = existing.some(tx => tx.category === 'dividend' && tx.relatedId === transactionRelatedId);
    if (already) {
      console.warn(`检测到用户 ${userId} 周期 ${periodId} 的现金分红已入账，跳过重复记录`);
      return;
    }

    await this.addTransaction({
      type: 'income',
      category: 'dividend',
      amount,
      currency: 'cash',
      description: `${description} - 用户 ${userId}`,
      relatedId: transactionRelatedId
    });
  }
}

export const walletService = new WalletService();
/**
 * O币服务 - 实现O币的核心业务逻辑
 */

import { 
  OCoinMarketData, 
  OCoinUserBalance, 
  OCoinTransaction, 
  OCoinOption,
  PricePoint 
} from '../types/oCoin';
import { walletService } from './walletService';

const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue, (key, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
          return new Date(value);
        }
        return value;
      });
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage`, error);
  }
  return defaultValue;
};

const saveToLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage`, error);
  }
};

const _saveData = () => {
  saveToLocalStorage('oCoin_marketData', oCoinMarketData);
  saveToLocalStorage('oCoin_userBalances', Array.from(userBalances.entries()));
  saveToLocalStorage('oCoin_transactions', transactions);
  saveToLocalStorage('oCoin_options', options);
};

// 模拟数据存储（实际项目中应该使用数据库）
let oCoinMarketData: OCoinMarketData = loadFromLocalStorage('oCoin_marketData', {
  currentPrice: 0,
  circulatingSupply: 0,
  totalSupply: 1000000000, // 10亿枚
  totalDistributed: 0,
  totalLocked: 0,
  marketCap: 0,
  priceHistory: [],
  allTimeHigh: 0,
  allTimeLow: 0,
  lastUpdated: new Date(),
  dividendPool: 0,
  lastDividendDate: null,
  lastDividendPerCoin: 0
});

const userBalances: Map<string, OCoinUserBalance> = new Map(loadFromLocalStorage<[string, OCoinUserBalance][]>('oCoin_userBalances', []));
const transactions: OCoinTransaction[] = loadFromLocalStorage('oCoin_transactions', []);
const options: OCoinOption[] = loadFromLocalStorage('oCoin_options', []);

/**
 * 初始化O币市场数据
 */
export const initializeOCoin = (): OCoinMarketData => {
  const history: PricePoint[] = [];
  
  // 生成过去30天的模拟正弦波数据，以获得清晰的趋势
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // 使用正弦函数创造一个明显的波动趋势
    const price = 0.08 + Math.sin(i * (Math.PI / 15)) * 0.04;

    history.push({ timestamp: date, price: parseFloat(price.toFixed(4)) });
  }

  const allTimeHigh = Math.max(...history.map(p => p.price));
  const allTimeLow = Math.min(...history.map(p => p.price));
  const latestPrice = history.length > 0 ? history[history.length - 1].price : 0.01;

  oCoinMarketData = {
    ...oCoinMarketData,
    currentPrice: latestPrice,
    marketCap: latestPrice * oCoinMarketData.circulatingSupply,
    priceHistory: history,
    allTimeHigh: allTimeHigh,
    allTimeLow: allTimeLow,
    lastUpdated: new Date()
  };
  
  _saveData();
  return oCoinMarketData;
};

/**
 * 获取当前市场数据
 */
export const getMarketData = (): OCoinMarketData => {
  return { ...oCoinMarketData };
};

/**
 * 更新市场价格
 */
export const updatePrice = (newPrice: number): OCoinMarketData => {
  const pricePoint: PricePoint = {
    timestamp: new Date(),
    price: newPrice
  };

  oCoinMarketData = {
    ...oCoinMarketData,
    currentPrice: newPrice,
    marketCap: newPrice * oCoinMarketData.circulatingSupply,
    priceHistory: [...oCoinMarketData.priceHistory, pricePoint],
    allTimeHigh: Math.max(oCoinMarketData.allTimeHigh, newPrice),
    allTimeLow: Math.min(oCoinMarketData.allTimeLow || newPrice, newPrice),
    lastUpdated: new Date()
  };

  _saveData();
  return oCoinMarketData;
};

/**
 * 获取用户余额
 */
export const getUserBalance = (userId: string): OCoinUserBalance => {
  if (!userBalances.has(userId)) {
    const newBalance: OCoinUserBalance = {
      userId,
      availableBalance: 0,
      lockedBalance: 0,
      dividendRights: 0,
      lastDividendAmount: 0,
      totalDividendsReceived: 0
    };
    userBalances.set(userId, newBalance);
    _saveData();
  }
  
  return { ...userBalances.get(userId)! };
};

/**
 * 购买O币
 */
export const purchaseOCoin = (
  userId: string, 
  amount: number, 
  price: number
): OCoinTransaction => {
  const totalCost = amount * price;

  // 校验钱包现金是否足够
  // 注意：walletService.getBalance 是异步，这里保持同步接口，改为记录交易由外部 await；因此仅尽力触发交易并由 UI 刷新
  // 若需要严格校验，可在调用方先检查余额
  // 这里改为使用异步 IIFE 执行钱包交易，避免阻塞
  (async () => {
    try {
      const balance = await walletService.getBalance();
      if (balance.cash < totalCost) {
        throw new Error(`现金余额不足，需 ¥${totalCost.toFixed(2)}，当前 ¥${balance.cash.toFixed(2)}`);
      }
      // 现金支出
      await walletService.addTransaction({
        type: 'expense',
        category: 'trade',
        amount: totalCost,
        currency: 'cash',
        description: `购买O币 ${amount} 枚，单价 ¥${price.toFixed(2)}`
      });
      // O 币收入
      await walletService.addTransaction({
        type: 'income',
        category: 'trade',
        amount: amount,
        currency: 'oCoins',
        description: `购买获得 O币 ${amount} 枚`
      });
      // 通知刷新
      window.dispatchEvent(new CustomEvent('wallet-updated'));
    } catch (err) {
      console.error('记录购买O币钱包交易失败:', err);
    }
  })();

  const transaction: OCoinTransaction = {
    id: generateId(),
    type: 'purchase',
    amount,
    price,
    timestamp: new Date(),
    description: `购买${amount}个O币，单价${price}元`,
    status: 'completed',
    userId
  };

  // 更新用户余额（O币内部）
  const userBalance = getUserBalance(userId);
  userBalance.availableBalance += amount;
  userBalance.dividendRights += amount;
  userBalances.set(userId, userBalance);

  // 更新市场数据
  oCoinMarketData.circulatingSupply += amount;
  oCoinMarketData.totalDistributed += amount;
  oCoinMarketData.marketCap = oCoinMarketData.currentPrice * oCoinMarketData.circulatingSupply;

  transactions.push(transaction);
  _saveData();
  return transaction;
};

/**
 * 出售O币
 */
export const sellOCoin = (
  userId: string, 
  amount: number, 
  price: number
): OCoinTransaction => {
  const userBalance = getUserBalance(userId);
  
  if (userBalance.availableBalance < amount) {
    throw new Error('可用余额不足');
  }

  const totalValue = amount * price;

  // 记录钱包交易（异步执行）
  (async () => {
    try {
      // O 币支出
      await walletService.addTransaction({
        type: 'expense',
        category: 'trade',
        amount: amount,
        currency: 'oCoins',
        description: `出售 O币 ${amount} 枚`
      });
      // 现金收入
      await walletService.addTransaction({
        type: 'income',
        category: 'trade',
        amount: totalValue,
        currency: 'cash',
        description: `出售O币收入 ¥${totalValue.toFixed(2)}`
      });
      window.dispatchEvent(new CustomEvent('wallet-updated'));
    } catch (err) {
      console.error('记录出售O币钱包交易失败:', err);
    }
  })();

  const transaction: OCoinTransaction = {
    id: generateId(),
    type: 'sale',
    amount,
    price,
    timestamp: new Date(),
    description: `出售${amount}个O币，单价${price}元`,
    status: 'completed',
    userId
  };

  // 更新用户余额（O币内部）
  userBalance.availableBalance -= amount;
  userBalance.dividendRights -= amount;
  userBalances.set(userId, userBalance);

  // 更新市场数据
  oCoinMarketData.circulatingSupply -= amount;
  oCoinMarketData.marketCap = oCoinMarketData.currentPrice * oCoinMarketData.circulatingSupply;

  transactions.push(transaction);
  _saveData();
  return transaction;
};

/**
 * 授予期权
 */
export const grantOption = (
  userId: string, 
  amount: number, 
  vestingPeriod: number = 365 // 默认1年
): OCoinOption => {
  const option: OCoinOption = {
    id: generateId(),
    userId,
    amount,
    vestedAmount: 0,
    vestingPeriod,
    grantDate: new Date(),
    isFullyVested: false
  };

  options.push(option);
  
  // 记录交易
  const transaction: OCoinTransaction = {
    id: generateId(),
    type: 'grant',
    amount,
    timestamp: new Date(),
    description: `授予${amount}个O币期权，归属期${vestingPeriod}天`,
    status: 'completed',
    userId
  };
  transactions.push(transaction);

  _saveData();
  return option;
};

/**
 * 归属期权
 */
export const vestOption = (optionId: string, amount: number): OCoinTransaction => {
  const option = options.find(o => o.id === optionId);
  if (!option) {
    throw new Error('期权不存在');
  }

  const remainingVestable = option.amount - option.vestedAmount;
  if (amount > remainingVestable) {
    throw new Error('归属数量超过剩余可归属数量');
  }

  option.vestedAmount += amount;
  option.isFullyVested = option.vestedAmount === option.amount;

  // 更新用户余额
  const userBalance = getUserBalance(option.userId);
  userBalance.availableBalance += amount;
  userBalance.dividendRights += amount;
  userBalances.set(option.userId, userBalance);

  // 更新市场数据
  oCoinMarketData.circulatingSupply += amount;
  oCoinMarketData.totalDistributed += amount;
  oCoinMarketData.marketCap = oCoinMarketData.currentPrice * oCoinMarketData.circulatingSupply;

  const transaction: OCoinTransaction = {
    id: generateId(),
    type: 'vest',
    amount,
    timestamp: new Date(),
    description: `归属${amount}个O币期权`,
    status: 'completed',
    userId: option.userId
  };
  transactions.push(transaction);

  _saveData();
  return transaction;
};

/**
 * 添加分红资金
 */
export const addDividendPool = (amount: number): void => {
  oCoinMarketData.dividendPool += amount;
  _saveData();
};

/**
 * 分发分红
 */
export const distributeDividends = (): void => {
  if (oCoinMarketData.circulatingSupply === 0 || oCoinMarketData.dividendPool === 0) {
    return;
  }

  const dividendPerCoin = oCoinMarketData.dividendPool / oCoinMarketData.circulatingSupply;
  
  // 为每个持有O币的用户分发分红
  userBalances.forEach((userBalance, userId) => {
    if (userBalance.dividendRights > 0) {
      const dividendAmount = userBalance.dividendRights * dividendPerCoin;
      userBalance.lastDividendAmount = dividendAmount;
      userBalance.totalDividendsReceived += dividendAmount;
      userBalances.set(userId, userBalance);

      // 记录分红交易
      const transaction: OCoinTransaction = {
        id: generateId(),
        type: 'dividend',
        amount: dividendAmount,
        timestamp: new Date(),
        description: `分红分发：${dividendAmount.toFixed(2)}元`,
        status: 'completed',
        userId
      };
      transactions.push(transaction);
    }
  });

  // 更新市场数据
  oCoinMarketData.lastDividendDate = new Date();
  oCoinMarketData.lastDividendPerCoin = dividendPerCoin;
  oCoinMarketData.dividendPool = 0;
  _saveData();
};

/**
 * 获取O币统计数据
 */
export const getOCoinStats = () => {
  return {
    totalSupply: oCoinMarketData.totalSupply,
    circulatingSupply: oCoinMarketData.circulatingSupply,
    totalDistributed: oCoinMarketData.totalDistributed,
    totalLocked: oCoinMarketData.totalLocked,
    marketCap: oCoinMarketData.marketCap
  };
};

/**
 * 获取用户交易记录
 */
export const getUserTransactions = (userId: string): OCoinTransaction[] => {
  return transactions.filter(t => t.userId === userId);
};

/**
 * 获取用户期权
 */
export const getUserOptions = (userId: string): OCoinOption[] => {
  return options.filter(o => o.userId === userId);
};

/**
 * 生成唯一ID
 */
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// 初始化O币
initializeOCoin();

// 创建oCoinService对象，包含所有导出的函数
const oCoinService = {
  getOCoinMarketData: getMarketData,
  checkAndExecuteVesting: async (userId: string) => {
    // 模拟期权解禁检查
    const userOptions = getUserOptions(userId);
    let totalVested = 0;
    
    userOptions.forEach(option => {
      const now = new Date();
      const grantDate = new Date(option.grantDate);
      const daysPassed = Math.floor((now.getTime() - grantDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysPassed > 0 && !option.isFullyVested) {
        const dailyVest = option.amount / option.vestingPeriod;
        const shouldBeVested = Math.min(dailyVest * daysPassed, option.amount);
        const newVest = shouldBeVested - option.vestedAmount;
        
        if (newVest > 0) {
          vestOption(option.id, newVest);
          totalVested += newVest;
        }
      }
    });
    
    return { vestedAmount: totalVested };
  },
  initializeOCoin,
  getMarketData,
  updatePrice,
  getUserBalance,
  purchaseOCoin,
  sellOCoin,
  // 添加别名方法
  purchaseOCoins: purchaseOCoin,
  sellOCoins: sellOCoin,
  grantOption,
  vestOption,
  addDividendPool,
  distributeDividends,
  getUserTransactions,
  getUserOptions,
  getOCoinStats
};

export { oCoinService };
export default oCoinService;
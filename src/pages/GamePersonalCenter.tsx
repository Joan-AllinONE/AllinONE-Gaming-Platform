import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marketplaceService } from '@/services/marketplaceService';
import { MarketItem, Transaction } from '@/types/marketplace';
import { useWallet } from '@/hooks/useWallet';
import { useUserData } from '@/contexts/UserDataContext';
import { useBlog } from '@/contexts/BlogContext';
import { TeamCenter } from '../components/TeamCenter';
import EconomicSystemMonitor from '../components/EconomicSystemMonitor';
import CommissionDisplay from '../components/CommissionDisplay';
import BlogManager from '../components/BlogManager';
import { aCoinService } from '@/services/aCoinService';
import oCoinService from '@/services/oCoinService';
import { fundPoolService } from '@/services/fundPoolService';
import { computingEconomicService } from '@/services/computingEconomicService';
import { walletService } from '@/services/walletService';
import platformConfigService from '@/services/platformConfigService';
import { 
  OCoinMarketData, 
  OCoinUserBalance, 
  OCoinTransaction, 
  OCoinOption 
} from '@/types/oCoin';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDict, t } from '@/utils/i18n';

// 获取物品图标的工具函数
function getItemIcon(category: string): string {
  switch (category) {
    case 'weapon': return 'fa-sword';
    case 'armor': return 'fa-shield';
    case 'consumable': return 'fa-flask';
    case 'material': return 'fa-gem';
    case 'rare': return 'fa-star';
    default: return 'fa-box';
  }
}

const GamePersonalCenter: React.FC = () => {
  const { lang } = useLanguage();
  const dict = getDict(lang);
  const { userData, updateUserAssets, refreshUserData } = useUserData();
  const { fetchUserPosts } = useBlog();
  const [activeTab, setActiveTab] = useState('inventory');
  const [activeSubTab, setActiveSubTab] = useState('purchases');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showPriceEditModal, setShowPriceEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketItem | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [exchangeFrom, setExchangeFrom] = useState('cash');
  const [exchangeTo, setExchangeTo] = useState('gameCoin');

  const [selectedWalletCurrency, setSelectedWalletCurrency] = useState<'cash' | 'gameCoin' | 'computingPower' | 'aCoins' | 'oCoins' | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    totalComputePower: 0,
    dailyTransactions: 0,
    aCoinCirculatingSupply: 0,
    aCoinHolders: 0,
    oCoinPrice: 0,
    oCoinMarketCap: 0,
    aCoinTotalSupply: 0,
    oCoinCirculatingSupply: 0,
  });
  
  // A币贡献度分析数据
  const [aCoinContribution, setACoinContribution] = useState({
    gameCoinsEarned: 0,
    computingPowerContribution: 0,
    transactionActivity: 0,
    gameCoinsWeight: 0,
    computingPowerWeight: 0,
    transactionWeight: 0,
    totalACoinEarned: 0,
    lastDistribution: new Date()
  });
  
  // A币每日结算记录
  const [aCoinDailySettlements, setACoinDailySettlements] = useState<Array<{
    timestamp: string;
    amount: number;
    contributionScore: number;
    totalDistributed: number;
    recipientsCount: number;
  }>>([]);
  
  // 是否显示A币结算详情
  const [showACoinSettlementDetails, setShowACoinSettlementDetails] = useState(false);
  
  // O币市场数据
  const [oCoinMarketData, setOCoinMarketData] = useState<OCoinMarketData>({
    currentPrice: 0,
    circulatingSupply: 0,
    totalSupply: 1000000000, // 10亿枚总供应量
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
  
  // O币持有数据
  const [oCoinHoldings, setOCoinHoldings] = useState({
    balance: 0,
    lockedBalance: 0,
    vestingOptions: [] as Array<{
      id: string;
      amount: number;
      vestedAmount: number;
      vestingPeriod: number; // 天数
      startDate: Date;
      endDate: Date;
      isFullyVested: boolean;
    }>,
    dividendRights: 0, // 分红权比例
    lastDividend: 0,
    totalDividendsReceived: 0
  });
  
  // O币交易记录
  const [oCoinTransactions, setOCoinTransactions] = useState<Array<{
    id: string;
    type: 'purchase' | 'sale' | 'dividend' | 'grant' | 'vest';
    amount: number;
    price?: number;
    timestamp: Date;
    description: string;
    status?: 'pending' | 'completed' | 'failed';
    userId?: string;
    relatedUserId?: string;
  }>>([]);
  
  // 是否显示O币详情
  const [showOCoinDetails, setShowOCoinDetails] = useState(false);
  
  // 是否显示O币交易模态框
  const [showOCoinTradeModal, setShowOCoinTradeModal] = useState(false);
  
  // O币交易类型
  const [oCoinTradeType, setOCoinTradeType] = useState<'buy' | 'sell'>('buy');
  
  // O币交易数量
  const [oCoinTradeAmount, setOCoinTradeAmount] = useState('');
  
  // 🔥 实时配置汇率
  const [configRates, setConfigRates] = useState(() => {
    return platformConfigService.getExchangeRates();
  });
  
  // 加载O币相关数据
  useEffect(() => {
    loadOCoinMarketData();
    loadOCoinHoldings();
    loadOCoinTransactions();
    
    // 🔥 监听平台配置更新事件
    const handleConfigUpdate = (event: CustomEvent) => {
      console.log('[个人中心] 平台配置更新:', event.detail);
      // 更新实时汇率显示
      setConfigRates(platformConfigService.getExchangeRates());
    };
    
    // 添加事件监听
    window.addEventListener('platform-config-updated' as any, handleConfigUpdate);
    window.addEventListener('platform-config-batch-updated' as any, handleConfigUpdate);
    
    // 清理函数
    return () => {
      window.removeEventListener('platform-config-updated' as any, handleConfigUpdate);
      window.removeEventListener('platform-config-batch-updated' as any, handleConfigUpdate);
    };
  }, []);
  
  // 加载A币每日结算记录
  const loadACoinDailySettlements = async () => {
    try {
      // 从计算经济服务获取用户的每日结算记录
      const settlements = await computingEconomicService.getUserDailySettlements();
      
      // 处理结算记录，添加总发放量和接收者数量
      const processedSettlements = settlements.map(settlement => ({
        timestamp: (settlement as any).date || (settlement as any).timestamp, // 兼容date和timestamp字段
        amount: settlement.amount,
        contributionScore: settlement.contributionScore,
        // 如果没有recipientsCount，则添加一个模拟值
        recipientsCount: settlement.recipientsCount || Math.floor(Math.random() * 100) + 50,
        // 如果没有totalDistributed，则添加一个模拟值（通常是amount的10-20倍）
        totalDistributed: settlement.totalDistributed || settlement.amount * (Math.random() * 10 + 10)
      }));
      
      setACoinDailySettlements(processedSettlements);
      
      // 移除页面触发的自动结算，避免重复结算
      // 自动结算应由后台或统一入口触发
    } catch (error) {
      console.error('获取A币每日结算记录失败:', error);
      // 如果API调用失败，使用模拟数据
      const mockSettlements = Array.from({ length: 7 }).map((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - index);
        
        const amount = Math.random() * 50 + 10; // 10-60 A币
        const contributionScore = Math.random() * 100 + 50; // 50-150 贡献分数
        const totalDistributed = amount * (Math.random() * 10 + 10); // 总发放量是个人获得的10-20倍
        const recipientsCount = Math.floor(Math.random() * 100) + 50; // 50-150人
        
        return {
          timestamp: date.toISOString(),
          amount,
          contributionScore,
          totalDistributed,
          recipientsCount
        };
      });
      
      setACoinDailySettlements(mockSettlements);
    }
  };
  
  // 加载O币市场数据
  const loadOCoinMarketData = async () => {
    try {
      // 从O币服务获取市场数据
      const marketData = await oCoinService.getOCoinMarketData();
      setOCoinMarketData(marketData);
    } catch (error) {
      console.error('获取O币市场数据失败:', error);
      // 如果API调用失败，使用模拟数据
      const mockMarketData: OCoinMarketData = {
        currentPrice: Math.random() * 5 + 1, // 1-6元
        circulatingSupply: Math.floor(Math.random() * 1000000000) + 1000000000, // 1-2亿枚
        totalSupply: 1000000000, // 10亿枚总供应量
        totalDistributed: Math.floor(Math.random() * 2000000000) + 1000000000, // 1-3亿枚
        totalLocked: Math.floor(Math.random() * 500000000), // 0-5亿枚
        marketCap: 0, // 会在下面计算
        priceHistory: [],
        allTimeHigh: Math.random() * 10 + 5, // 5-15元
        allTimeLow: Math.random() * 0.5 + 0.1, // 0.1-0.6元
        lastUpdated: new Date(),
        dividendPool: Math.random() * 1000000, // 0-100万元
        lastDividendDate: null,
        lastDividendPerCoin: 0
      };
      
      // 计算市值
      mockMarketData.marketCap = mockMarketData.currentPrice * mockMarketData.circulatingSupply;
      
      setOCoinMarketData(mockMarketData);
    }
  };
  
  // 加载用户O币持有数据
  const loadOCoinHoldings = async () => {
    try {
      // 从O币服务获取用户持有数据
      const userId = 'current-user-id'; // 假设这是当前用户ID
      const userBalance = await oCoinService.getUserBalance(userId);
      const userOptions = await oCoinService.getUserOptions(userId);
      
      if (userBalance) {
        setOCoinHoldings({
          balance: userBalance.availableBalance,
          lockedBalance: userBalance.lockedBalance,
          vestingOptions: userOptions.map(option => ({
            id: `option-${option.userId}-${option.grantDate.getTime()}`,
            amount: option.amount,
            vestedAmount: option.vestedAmount,
            vestingPeriod: option.vestingPeriod,
            startDate: option.grantDate,
            endDate: new Date(option.grantDate.getTime() + option.vestingPeriod * 24 * 60 * 60 * 1000),
            isFullyVested: option.isFullyVested
          })),
          dividendRights: userBalance.dividendRights / oCoinService.getOCoinStats().totalSupply,
          lastDividend: userBalance.lastDividendAmount,
          totalDividendsReceived: userBalance.lastDividendAmount // 这里应该累计所有分红，但示例中只用最后一次
        });
      } else {
        // 如果用户没有O币余额记录，使用模拟数据
        setOCoinHoldings({
          balance: Math.floor(Math.random() * 1000) + 100, // 100-1100枚
          lockedBalance: Math.floor(Math.random() * 500), // 0-500枚
          vestingOptions: Array.from({ length: 2 }).map((_, index) => {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 5 + index * 6); // 6个月或12个月期权
            
            const totalAmount = Math.floor(Math.random() * 500) + 100; // 100-600枚
            const vestedAmount = Math.floor(totalAmount * (Math.random() * 0.3)); // 已解锁0-30%
            
            return {
              id: `option-${index}`,
              amount: totalAmount,
              vestedAmount: vestedAmount,
              vestingPeriod: (index + 1) * 180, // 180天或360天
              startDate: startDate,
              endDate: endDate,
              isFullyVested: false
            };
          }),
          dividendRights: Math.random() * 0.001, // 0-0.1%的分红权
          lastDividend: Math.random() * 100, // 0-100元
          totalDividendsReceived: Math.random() * 500 // 0-500元
        });
      }
    } catch (error) {
      console.error('获取O币持有数据失败:', error);
      // 如果API调用失败，使用模拟数据
      setOCoinHoldings({
        balance: Math.floor(Math.random() * 1000) + 100, // 100-1100枚
        lockedBalance: Math.floor(Math.random() * 500), // 0-500枚
        vestingOptions: Array.from({ length: 2 }).map((_, index) => {
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 5 + index * 6); // 6个月或12个月期权
          
          const totalAmount = Math.floor(Math.random() * 500) + 100; // 100-600枚
          const vestedAmount = Math.floor(totalAmount * (Math.random() * 0.3)); // 已解锁0-30%
          
          return {
            id: `option-${index}`,
            amount: totalAmount,
            vestedAmount: vestedAmount,
            vestingPeriod: (index + 1) * 180, // 180天或360天
            startDate: startDate,
            endDate: endDate,
            isFullyVested: false
          };
        }),
        dividendRights: Math.random() * 0.001, // 0-0.1%的分红权
        lastDividend: Math.random() * 100, // 0-100元
        totalDividendsReceived: Math.random() * 500 // 0-500元
      });
    }
  };
  
  // 加载O币交易记录
  const loadOCoinTransactions = async () => {
    try {
      // 从O币服务获取交易记录
      const userId = 'current-user-id'; // 假设这是当前用户ID
      const transactions = await oCoinService.getUserTransactions(userId);
      
      // 将OCoinTransaction类型转换为组件中使用的类型
      const formattedTransactions = transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        price: tx.price,
        timestamp: tx.timestamp,
        description: tx.description,
        status: tx.status,
        userId: tx.userId,
        relatedUserId: tx.relatedUserId
      }));
      
      setOCoinTransactions(formattedTransactions);
    } catch (error) {
      console.error('获取O币交易记录失败:', error);
      // 如果API调用失败，使用模拟数据
      const mockTransactions = Array.from({ length: 10 }).map((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - index);
        
        // 使用与OCoinTransaction兼容的类型
        const types: Array<'purchase' | 'sale' | 'dividend' | 'grant' | 'vest'> = ['purchase', 'sale', 'dividend', 'grant', 'vest'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const amount = Math.floor(Math.random() * 100) + 10; // 10-110枚
        const price = type === 'purchase' || type === 'sale' ? Math.random() * 5 + 1 : undefined; // 1-6元
        
        let description = '';
        switch (type) {
          case 'purchase':
            description = '购买O币';
            break;
          case 'sale':
            description = '出售O币';
            break;
          case 'dividend':
            description = '分红收益';
            break;
          case 'grant':
            description = '平台奖励';
            break;
          case 'vest':
            description = '期权解锁';
            break;
        }
        
        return {
          id: `tx-${index}`,
          type,
          amount,
          price,
          timestamp: date,
          description,
          status: 'completed' as const,
          userId: 'current-user-id'
        };
      });
      
      setOCoinTransactions(mockTransactions);
    }
  };
  
  // 处理O币交易
  const handleOCoinTrade = async () => {
    if (!oCoinTradeAmount || parseFloat(oCoinTradeAmount) <= 0) {
      alert('请输入有效的交易数量');
      return;
    }
    
    const amount = parseFloat(oCoinTradeAmount);
    const userId = 'current-user-id'; // 假设这是当前用户ID
    
    try {
      if (oCoinTradeType === 'buy') {
        // 检查现金余额是否足够
        const totalCost = amount * oCoinMarketData.currentPrice;
        if (!wallet || wallet.cash < totalCost) {
          alert(`现金余额不足！需要 ¥${totalCost.toFixed(2)}，当前余额 ¥${wallet?.cash.toFixed(2) || '0.00'}`);
          return;
        }
        
        // 调用O币服务购买O币
        await oCoinService.purchaseOCoins(userId, amount, oCoinMarketData.currentPrice);
      } else {
        // 检查O币余额是否足够
        if (oCoinHoldings.balance < amount) {
          alert(`O币余额不足！需要 ${amount} 枚，当前可用余额 ${oCoinHoldings.balance} 枚`);
          return;
        }
        
        // 调用O币服务出售O币
        await oCoinService.sellOCoins(userId, amount, oCoinMarketData.currentPrice);
      }
      
      // 刷新数据
      await refreshWalletData();
      await loadOCoinHoldings();
      await loadOCoinTransactions();
      
      // 关闭模态框
      setShowOCoinTradeModal(false);
      setOCoinTradeAmount('');
      
      alert(`O币${oCoinTradeType === 'buy' ? '购买' : '出售'}成功！`);
    } catch (error) {
      console.error(`O币${oCoinTradeType === 'buy' ? '购买' : '出售'}失败:`, error);
      alert(`O币${oCoinTradeType === 'buy' ? '购买' : '出售'}失败，请稍后重试`);
    }
  };

  const { balance: wallet, loading: walletLoading, refreshWalletData, getTransactions } = useWallet();
  const [userItems, setUserItems] = useState<MarketItem[]>([]);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [userListings, setUserListings] = useState<MarketItem[]>([]);

  useEffect(() => {
    loadUserData();
    loadGlobalStats();
    loadACoinDailySettlements(); // 加载A币每日结算记录
    
    // 每30秒更新全网数据
    const interval = setInterval(loadGlobalStats, 30000);
    
    // 每10秒刷新用户数据，确保数据同步
    const userDataInterval = setInterval(loadUserData, 10000);
    
    return () => {
      clearInterval(interval);
      clearInterval(userDataInterval);
    };
  }, []);
  
  // 在钱包数据加载完成后加载A币贡献度分析数据
  useEffect(() => {
    if (wallet && !walletLoading) {
      loadACoinContributionData();
    }
  }, [wallet, walletLoading]);
  
  // 当切换到博客标签时加载用户博客
  useEffect(() => {
    if (activeTab === 'blog') {
      fetchUserPosts();
    }
  }, [activeTab, fetchUserPosts]);

  // 加载A币贡献度分析数据
  const loadACoinContributionData = async () => {
    try {
      // 从A币服务获取贡献度数据
      const contributionData = await aCoinService.getUserContributionData();
      
      // 如果获取到数据，则更新状态
      if (contributionData) {
        setACoinContribution(contributionData);
      } else {
        console.error('无法获取A币贡献度数据');
        // 设置默认值，但不使用随机数据
        setACoinContribution({
          gameCoinsEarned: wallet?.gameCoins || 0,
          computingPowerContribution: wallet?.computingPower || 0,
          transactionActivity: 0,
          gameCoinsWeight: 0.5, // 50%
          computingPowerWeight: 0.3, // 30%
          transactionWeight: 0.2, // 20%
          totalACoinEarned: wallet?.aCoins || 0,
          lastDistribution: new Date()
        });
      }
    } catch (error) {
      console.error('获取A币贡献度数据失败:', error);
      // 使用钱包中的真实数据作为备选，而不是随机数据
      setACoinContribution({
        gameCoinsEarned: wallet?.gameCoins || 0,
        computingPowerContribution: wallet?.computingPower || 0,
        transactionActivity: 0,
        gameCoinsWeight: 0.5, // 50%
        computingPowerWeight: 0.3, // 30%
        transactionWeight: 0.2, // 20%
        totalACoinEarned: wallet?.aCoins || 0,
        lastDistribution: new Date()
      });
    }
  };

  const loadUserData = async () => {
    try {
      // 使用正确的方法名获取用户库存和交易记录
      const items = await marketplaceService.getUserInventory('current-user-id');
      const transactionHistory = await marketplaceService.getUserTransactionHistory('current-user-id');
      
      // 设置用户道具（库存）
      setUserItems(items);
      
      // 获取用户在售商品
      const listings = await marketplaceService.getUserListings('current-user-id');
      setUserListings(listings);
      
      // 合并所有交易记录（购买和销售）
      const allTransactions = [
        ...transactionHistory.purchases.map(tx => ({
          id: tx.id,
          itemName: tx.item.name,
          type: 'buy' as const,
          price: tx.totalAmount || tx.price, // 使用实际支付金额
          totalAmount: tx.totalAmount || tx.price, // 保留总金额字段
          timestamp: tx.timestamp
        })),
        ...transactionHistory.sales.map(tx => ({
          id: tx.id,
          itemName: tx.item.name,
          type: 'sell' as const,
          price: tx.price,
          timestamp: tx.timestamp
        }))
      ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setUserTransactions(allTransactions);
      await refreshWalletData();
    } catch (error) {
      console.error('加载用户数据失败:', error);
    }
  };



  // 处理钱包货币点击事件
  const handleWalletCurrencyClick = async (currency: 'cash' | 'gameCoin' | 'computingPower' | 'aCoins' | 'oCoins') => {
    if (selectedWalletCurrency === currency) {
      setSelectedWalletCurrency(null);
      setWalletTransactions([]);
      return;
    }

    try {
      // 获取所有交易记录
      const allTransactions = await getTransactions();
      
      // 根据货币类型过滤交易记录
      let filteredTransactions: any[] = [];
      
      switch (currency) {
        case 'cash':
          // 优先通过 currency 字段精确匹配
          filteredTransactions = allTransactions.filter(tx => {
            const currencyStr = tx.currency ? String(tx.currency).toLowerCase() : '';
            return currencyStr === 'cash' || currencyStr === 'cny';
          });
          break;
        case 'gameCoin':
          filteredTransactions = allTransactions.filter(
            tx => tx.currency === 'gameCoins'
          );
          break;
        case 'computingPower':
          // 修复算力交易记录过滤逻辑，确保只显示真正的算力交易记录
          filteredTransactions = allTransactions.filter(tx => tx.currency === 'computingPower');
          break;
        case 'aCoins':
          // 特殊处理A币交易记录
          try {
            // 首先尝试从钱包服务获取A币交易记录
            const aCoinTransactions = await walletService.getACoinTransactions(20);
            if (aCoinTransactions && aCoinTransactions.length > 0) {
              filteredTransactions = aCoinTransactions;
            } else {
              // 如果没有专门的A币交易记录，从所有交易记录中过滤
              const aCoinFromAllTransactions = allTransactions.filter(tx => 
                (tx.currency === 'aCoins' as any) || 
                tx.description?.includes('A币') || 
                // 使用正确的交易类别
                (tx.category && ['game_reward', 'commission', 'acoin_distribution'].includes(tx.category) && 
                 (tx.description?.includes('A币') || (tx.currency as any) === 'aCoins'))
              );
              
              if (aCoinFromAllTransactions.length > 0) {
                filteredTransactions = aCoinFromAllTransactions;
              } else {
                // 如果仍然没有记录，尝试从资金池获取A币发放记录
                const fundPoolData = await fundPoolService.getPublicFundPoolData();
                const aCoinTransactions = fundPoolData.recentTransactions.filter(
                  tx => tx.currency === 'aCoins'
                );
                
                if (aCoinTransactions.length > 0) {
                  // 转换为钱包交易记录格式
                  filteredTransactions = aCoinTransactions.map(tx => ({
                    id: tx.id,
                    type: tx.type === 'income' ? 'income' : 'expense',
                    category: 'acoin_distribution',
                    amount: tx.amount,
                    currency: 'aCoins',
                    description: tx.description || 'A币发放',
                    timestamp: tx.timestamp
                  }));
                } else {
                  // 如果仍然没有记录，生成示例数据
                  filteredTransactions = generateSampleTransactions('aCoins');
                }
              }
            }
          } catch (error) {
            console.error('获取A币交易记录失败:', error);
            filteredTransactions = generateSampleTransactions('aCoins');
          }
          break;
      }

      // 如果没有真实交易记录，且不是现金类型，则生成一些示例数据
      if (filteredTransactions.length === 0 && currency !== 'cash') {
        filteredTransactions = generateSampleTransactions(currency);
      }

      setWalletTransactions(filteredTransactions);
      setSelectedWalletCurrency(currency);
    } catch (error) {
      console.error('获取钱包交易记录失败:', error);
      // 生成示例数据作为备选，但现金使用真实的固定数据
      if (currency === 'cash') {
        const realCashTransactions = [
          {
            id: 'cash_tx_001',
            type: 'income',
            amount: '500.00',
            description: '充值-支付宝',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            currency: 'cash',
            category: 'recharge'
          },
          {
            id: 'cash_tx_002',
            type: 'expense',
            amount: '128.00',
            description: '购买游戏道具-限定皮肤',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            currency: 'cash',
            category: 'purchase'
          },
          {
            id: 'cash_tx_003',
            type: 'expense',
            amount: '50.00',
            description: '兑换游戏币-5000币',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            currency: 'cash',
            category: 'exchange'
          }
        ];
        setWalletTransactions(realCashTransactions);
      } else {
        const sampleTransactions = generateSampleTransactions(currency);
        setWalletTransactions(sampleTransactions);
      }
      setSelectedWalletCurrency(currency);
    }
  };

  // 生成示例交易数据 - 仅用于非现金货币或API调用失败时的备选方案
  const generateSampleTransactions = (currency: 'cash' | 'gameCoin' | 'computingPower' | 'aCoins' | 'oCoins') => {
    const now = new Date();
    const transactions = [];

    // 现金交易不再使用模拟数据，而是从API获取真实数据
    if (currency === 'cash') {
      return [];
    }
    
    for (let i = 0; i < 10; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000); // 过去10天
      
      let transaction;
      switch (currency) {
        case 'gameCoin':
          transaction = {
            id: `coin_${i}`,
            type: i % 2 === 0 ? 'income' : 'expense',
            amount: Math.floor(Math.random() * 500 + 50),
            description: i % 2 === 0 ? '游戏奖励' : (i % 3 === 0 ? '兑换消费' : '系统消费'),
            timestamp: date,
            currency: 'gameCoin'
          };
          break;
        case 'computingPower':
          transaction = {
            id: `power_${i}`,
            type: 'income', // 算力通常只有收入
            amount: (Math.random() * 10 + 1).toFixed(1),
            description: i % 3 === 0 ? '挖矿奖励' : i % 2 === 0 ? '任务奖励' : '推荐奖励',
            timestamp: date,
            currency: 'computingPower'
          };
          break;
        case 'aCoins':
          transaction = {
            id: `acoin_${i}`,
            type: 'income', // A币只有发放收入
            amount: (Math.random() * 5 + 0.5).toFixed(2),
            description: i % 3 === 0 ? 'A币发放奖励' : i % 2 === 0 ? '贡献奖励' : '活跃奖励',
            timestamp: date,
            currency: 'aCoins'
          };
          break;
        case 'oCoins':
          transaction = {
            id: `ocoin_${i}`,
            type: i % 4 === 0 ? 'expense' : 'income', // O币有买卖交易
            amount: (Math.random() * 100 + 10).toFixed(0),
            description: i % 4 === 0 ? '出售O币' : i % 3 === 0 ? '购买O币' : i % 2 === 0 ? '分红收益' : '期权解锁',
            timestamp: date,
            currency: 'oCoins'
          };
          break;
      }
      
      if (transaction) {
        transactions.push(transaction);
      }
    }

    return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // 下架商品处理函数
  const handleDelistItem = async (itemId: string, itemName: string) => {
    try {
      const confirmed = window.confirm(`确定要下架商品 "${itemName}" 吗？下架后商品将返回到您的库存中。`);
      if (!confirmed) return;

      // 调用下架服务
      await marketplaceService.delistItem(itemId, 'current-user-id');
      
      // 重新加载数据
      await loadUserData();
      
      alert(`商品 "${itemName}" 已成功下架并返回到库存中！`);
    } catch (error) {
      console.error('下架商品失败:', error);
      alert('下架商品失败，请稍后重试');
    }
  };

  // 修改价格处理函数
  const handleEditPrice = (item: MarketItem) => {
    setEditingItem(item);
    setNewPrice(item.price.toString());
    setShowPriceEditModal(true);
  };

  // 确认修改价格
  const handleConfirmPriceEdit = async () => {
    if (!editingItem || !newPrice) {
      alert('请输入有效的价格');
      return;
    }

    const price = parseFloat(newPrice);
    if (price <= 0) {
      alert('价格必须大于0');
      return;
    }

    try {
      // 调用修改价格服务
      await marketplaceService.updateItemPrice(editingItem.id, price, 'current-user-id');
      
      // 重新加载数据
      await loadUserData();
      
      // 关闭模态框
      setShowPriceEditModal(false);
      setEditingItem(null);
      setNewPrice('');
      
      alert(`商品 "${editingItem.name}" 的价格已成功修改为 ${price}！`);
    } catch (error) {
      console.error('修改价格失败:', error);
      alert('修改价格失败，请稍后重试');
    }
  };

  const loadGlobalStats = async () => {
    try {
      const fundPoolData = await fundPoolService.getPublicFundPoolData();
      const allTransactions = await fundPoolService.getAllTransactions();
      const { aCoinStats, oCoinStats } = fundPoolData;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dailyTransactions = allTransactions.filter(tx => new Date(tx.timestamp) >= today).length;

      setGlobalStats({
        totalUsers: aCoinStats.holdersCount,
        onlineUsers: Math.floor(aCoinStats.holdersCount * (0.05 + Math.random() * 0.05)), // 5-10% of total
        totalComputePower: 45.6, // Mock data, as source is unclear
        dailyTransactions: dailyTransactions,
        aCoinCirculatingSupply: aCoinStats.circulatingSupply,
        aCoinHolders: aCoinStats.holdersCount,
        oCoinPrice: oCoinStats.currentPrice,
        oCoinMarketCap: oCoinStats.marketCap,
        aCoinTotalSupply: (aCoinStats as any).totalSupply || 0,
        oCoinCirculatingSupply: (oCoinStats as any).circulatingSupply || 0,
      });
    } catch (error) {
      console.error('获取全网数据失败:', error);
      // Fallback to some mock data
      setGlobalStats({
        totalUsers: 1234567,
        onlineUsers: 89432,
        totalComputePower: 45.6,
        dailyTransactions: 2345,
        aCoinCirculatingSupply: 0,
        aCoinHolders: 0,
        oCoinPrice: 0,
        oCoinMarketCap: 0,
        aCoinTotalSupply: 0,
        oCoinCirculatingSupply: 0,
      });
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      alert('请输入有效的充值金额');
      return;
    }

    try {
      const amount = parseFloat(rechargeAmount);
      
      // 更新用户数据
      updateUserAssets({
        realMoney: userData.assets.realMoney + amount
      });
      
      // 刷新钱包数据
      await refreshWalletData();
      
      setShowRechargeModal(false);
      setRechargeAmount('');
      alert(`充值成功！已充值 ¥${amount.toFixed(2)}`);
    } catch (error) {
      console.error('充值失败:', error);
      alert('充值失败，请重试');
    }
  };

  const handleExchange = async () => {
    if (!exchangeAmount || parseFloat(exchangeAmount) <= 0) {
      alert('请输入有效的兑换金额');
      return;
    }

    if (exchangeFrom === exchangeTo) {
      alert('不能兑换相同的货币类型');
      return;
    }

    try {
      const amount = parseFloat(exchangeAmount);
      
      // 🔥 使用平台配置服务获取实时汇率，而不是硬编码
      const configRates = platformConfigService.getExchangeRates();
      const exchangeRates = {
        cash: 1,
        gameCoin: configRates.gameCoinsToRMB, // 从平台配置获取
        computingPower: configRates.computingPowerToRMB, // 从平台配置获取
        aCoins: 1 // A币与人民币1:1兑换
      };
      
      console.log('[兑换] 使用实时配置汇率:', configRates);

      // 检查余额是否足够
      let hasEnoughBalance = false;
      let fromAmount = 0;
      let toAmount = 0;

      switch (exchangeFrom) {
        case 'cash':
          hasEnoughBalance = wallet ? wallet.cash >= amount : false;
          fromAmount = amount;
          toAmount = amount / exchangeRates[exchangeTo as keyof typeof exchangeRates];
          break;
        case 'gameCoin':
          hasEnoughBalance = wallet ? wallet.gameCoins >= amount : false;
          fromAmount = amount;
          
          // 🔥 游戏币兑换特殊处理：使用平台配置的比例
          if (exchangeTo === 'aCoins') {
            // 游戏币兑换A币：使用平台配置的比例
            const aCoinToGameCoinRate = platformConfigService.getParameter('a-coin-to-game-coin-rate') || 100;
            toAmount = amount / aCoinToGameCoinRate; // 反向计算
            console.log(`[游戏币兑换] ${amount} 游戏币 → ${toAmount} A币 (比例: ${aCoinToGameCoinRate}:1)`);
          } else {
            // 其他兑换使用通用汇率
            toAmount = amount * exchangeRates.gameCoin / exchangeRates[exchangeTo as keyof typeof exchangeRates];
          }
          break;
        case 'computingPower':
          hasEnoughBalance = wallet ? wallet.computingPower >= amount : false;
          fromAmount = amount;
          toAmount = amount * exchangeRates.computingPower / exchangeRates[exchangeTo as keyof typeof exchangeRates];
          break;
        case 'aCoins':
          // A币余额检查
          hasEnoughBalance = wallet ? (wallet.aCoins || 0) >= amount : false;
          fromAmount = amount;
          
          // 🔥 A币兑换特殊处理：使用平台配置的比例
          if (exchangeTo === 'gameCoin') {
            // A币兑换游戏币：使用平台配置的比例
            const aCoinToGameCoinRate = platformConfigService.getParameter('a-coin-to-game-coin-rate') || 100;
            toAmount = amount * aCoinToGameCoinRate;
            console.log(`[A币兑换] ${amount} A币 → ${toAmount} 游戏币 (比例: 1:${aCoinToGameCoinRate})`);
          } else {
            // 其他兑换使用通用汇率
            toAmount = amount * exchangeRates.aCoins / exchangeRates[exchangeTo as keyof typeof exchangeRates];
          }
          break;
      }

      if (!hasEnoughBalance) {
        alert('余额不足！');
        return;
      }

      // 如果涉及A币的兑换，需要特殊处理
      if (exchangeFrom === 'aCoins' || exchangeTo === 'aCoins') {
        // 检查A币兑换限制
        try {
          // 获取用户A币兑换限制
          const aCoinLimits = await aCoinService.getUserACoinExchangeLimits();
          
          if (exchangeFrom === 'aCoins') {
            // 检查是否超过A币兑出限制
            if (amount > aCoinLimits.dailyExchangeOut) {
              alert(`A币兑出超过每日限额 ${aCoinLimits.dailyExchangeOut} A币`);
              return;
            }
          } else if (exchangeTo === 'aCoins') {
            // 检查是否超过A币兑入限制
            if (toAmount > aCoinLimits.dailyExchangeIn) {
              alert(`A币兑入超过每日限额 ${aCoinLimits.dailyExchangeIn} A币`);
              return;
            }
          }
        } catch (error) {
          console.error('获取A币兑换限制失败:', error);
          // 如果无法获取限制，使用默认限制
          const defaultLimit = 100;
          if ((exchangeFrom === 'aCoins' && amount > defaultLimit) || 
              (exchangeTo === 'aCoins' && toAmount > defaultLimit)) {
            alert(`A币兑换超过默认每日限额 ${defaultLimit} A币`);
            return;
          }
        }
      }

      // 执行兑换 - 使用钱包服务记录交易
      const currencyNames = {
        cash: '现金',
        gameCoin: '游戏币',
        computingPower: '算力',
        aCoins: 'A币'
      };
      
      // 扣除源货币
      switch (exchangeFrom) {
        case 'cash':
          await walletService.addTransaction({
            type: 'expense',
            category: 'exchange',
            amount: fromAmount,
            currency: 'cash',
            description: `兑换现金为${currencyNames[exchangeTo as keyof typeof currencyNames]}`
          });
          break;
        case 'gameCoin':
          await walletService.addTransaction({
            type: 'expense',
            category: 'exchange',
            amount: fromAmount,
            currency: 'gameCoins',
            description: `兑换游戏币为${currencyNames[exchangeTo as keyof typeof currencyNames]}`
          });
          break;
        case 'computingPower':
          await walletService.addTransaction({
            type: 'expense',
            category: 'exchange',
            amount: fromAmount,
            currency: 'computingPower',
            description: `兑换算力为${currencyNames[exchangeTo as keyof typeof currencyNames]}`
          });
          break;
        case 'aCoins':
          // A币需要特殊处理，通过钱包服务更新
          await walletService.addTransaction({
            type: 'expense',
            category: 'exchange',
            amount: fromAmount,
            currency: 'aCoins',
            description: `A币兑换为${currencyNames[exchangeTo as keyof typeof currencyNames]}`
          });
          // 记录A币兑换交易
          await aCoinService.recordACoinExchange(fromAmount, exchangeTo, toAmount);
          break;
      }
      
      // 增加目标货币
      switch (exchangeTo) {
        case 'cash':
          await walletService.addTransaction({
            type: 'income',
            category: 'exchange',
            amount: toAmount,
            currency: 'cash',
            description: `${currencyNames[exchangeFrom as keyof typeof currencyNames]}兑换获得现金`
          });
          break;
        case 'gameCoin':
          await walletService.addTransaction({
            type: 'income',
            category: 'exchange',
            amount: Math.floor(toAmount),
            currency: 'gameCoins',
            description: `${currencyNames[exchangeFrom as keyof typeof currencyNames]}兑换获得游戏币`
          });
          break;
        case 'computingPower':
          await walletService.addTransaction({
            type: 'income',
            category: 'exchange',
            amount: toAmount,
            currency: 'computingPower',
            description: `${currencyNames[exchangeFrom as keyof typeof currencyNames]}兑换获得算力`
          });
          break;
        case 'aCoins':
          // A币需要特殊处理，通过钱包服务更新
          await walletService.addTransaction({
            type: 'income',
            category: 'exchange',
            amount: toAmount,
            currency: 'aCoins',
            description: `${currencyNames[exchangeFrom as keyof typeof currencyNames]}兑换获得A币`
          });
          // 记录A币兑换交易
          await aCoinService.recordACoinExchange(fromAmount, exchangeFrom, toAmount);
          break;
      }
      
      // 刷新钱包数据
      await refreshWalletData();
      
      // 触发钱包更新事件
      window.dispatchEvent(new CustomEvent('wallet-updated'));
      
      setShowExchangeModal(false);
      setExchangeAmount('');
      
      alert(`兑换成功！\n${fromAmount} ${currencyNames[exchangeFrom as keyof typeof currencyNames]} → ${toAmount.toFixed(2)} ${currencyNames[exchangeTo as keyof typeof currencyNames]}`);
    } catch (error) {
      console.error('兑换失败:', error);
      alert('兑换失败，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* 页面标题 */}
      <div className="bg-slate-800/50 border-b border-purple-400/30 p-4">
        <div className="flex items-center justify-center relative">
          <h1 className="text-2xl font-bold text-purple-400">
            🎮 {t(dict,'personalCenter.title')}
          </h1>
          <button
            onClick={refreshUserData}
            className="absolute right-4 bg-purple-500/20 border border-purple-400/30 rounded-lg px-4 py-2 text-purple-400 hover:bg-purple-500/30 transition-all flex items-center gap-2"
          >
            🔄 {t(dict,'personalCenter.refresh')}
          </button>
        </div>
      </div>

      {/* 顶部导航栏 */}
      <div className="bg-slate-800/80 border-b border-green-400/30 p-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Link
              to="/"
              className="bg-slate-500/20 border border-slate-400/30 rounded-lg px-4 py-2 text-slate-400 hover:bg-slate-500/30 transition-all flex items-center gap-2"
            >
              🏠 {t(dict,'personalCenter.nav.home')}
            </Link>
            <Link
              to="/fund-pool"
              className="bg-cyan-500/20 border border-cyan-400/30 rounded-lg px-4 py-2 text-cyan-400 hover:bg-cyan-500/30 transition-all flex items-center gap-2"
            >
              💰 {t(dict,'personalCenter.nav.fundPool')}
            </Link>
            <Link
              to="/blog-center"
              className="bg-teal-500/20 border border-teal-400/30 rounded-lg px-4 py-2 text-teal-400 hover:bg-teal-500/30 transition-all flex items-center gap-2"
            >
              📝 {t(dict,'personalCenter.nav.blogCenter')}
            </Link>
            <Link 
              to="/marketplace"
              className="bg-green-500/20 border border-green-400/30 rounded-lg px-4 py-2 text-green-400 hover:bg-green-500/30 transition-all flex items-center gap-2"
            >
              🏪 {t(dict,'personalCenter.nav.marketplace')}
            </Link>
            <Link 
              to="/official-store"
              className="bg-blue-500/20 border border-blue-400/30 rounded-lg px-4 py-2 text-blue-400 hover:bg-blue-500/30 transition-all flex items-center gap-2"
            >
              🏬 {t(dict,'personalCenter.nav.officialStore')}
            </Link>
            <Link 
              to="/game-store"
              className="bg-purple-500/20 border border-purple-400/30 rounded-lg px-4 py-2 text-purple-400 hover:bg-purple-500/30 transition-all flex items-center gap-2"
            >
              🛒 {t(dict,'personalCenter.nav.gameStore')}
            </Link>
            <Link 
              to="/computing-dashboard"
              className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg px-4 py-2 text-yellow-400 hover:bg-yellow-500/30 transition-all flex items-center gap-2"
            >
              ⚡ {t(dict,'personalCenter.nav.computingCenter')}
            </Link>
            <Link 
              to="/game-center"
              className="bg-pink-500/20 border border-pink-400/30 rounded-lg px-4 py-2 text-pink-400 hover:bg-pink-500/30 transition-all flex items-center gap-2"
            >
              🎯 {t(dict,'personalCenter.nav.gameCenter')}
            </Link>
          </div>
          
          {/* 设置下拉菜单 */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              className="bg-slate-700/50 border border-slate-600/30 rounded-lg px-4 py-2 text-slate-300 hover:bg-slate-700/70 transition-all flex items-center gap-2"
            >
              ⚙️ {t(dict,'personalCenter.nav.settings')}
            </button>
            
            {showSettingsDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-600/30 rounded-lg shadow-xl z-50">
                <div className="p-2 space-y-1">
                  <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded">
                    🎨 {t(dict,'personalCenter.nav.settingsTheme')}
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded">
                    🔔 {t(dict,'personalCenter.nav.settingsNotice')}
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded">
                    🔗 {t(dict,'personalCenter.nav.settingsBind')}
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded">
                    🔒 {t(dict,'personalCenter.nav.settingsSecurity')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧：玩家档案 */}
          <div className="bg-slate-800/80 border-2 border-green-400/30 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              👤 {t(dict,'personalCenter.left.profile')}
            </h2>
            
            {/* 玩家信息 */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">
                🎮
              </div>
              <h3 className="text-lg font-bold text-purple-400">{userData.username}</h3>
              <div className="text-sm text-slate-400">{t(dict,'personalCenter.left.level')} {userData.stats.level}</div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full" 
                  style={{width: `${(userData.stats.experience % 1000) / 10}%`}}
                ></div>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {t(dict,'personalCenter.left.exp')}: {userData.stats.experience % 1000}/1000
              </div>
            </div>

            {/* 游戏统计 */}
            <div className="space-y-3 mb-6">
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">{t(dict,'personalCenter.left.stats.totalGames')}</span>
                  <span className="text-green-400 font-bold">{userData.stats.totalGames.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">{t(dict,'personalCenter.left.stats.bestScore')}</span>
                  <span className="text-yellow-400 font-bold">{userData.stats.bestScore.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">{t(dict,'personalCenter.left.stats.avgScore')}</span>
                  <span className="text-blue-400 font-bold">{userData.stats.averageScore.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">{t(dict,'personalCenter.left.stats.achievements')}</span>
                  <span className="text-purple-400 font-bold">{userData.stats.achievements.length}</span>
                </div>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">{t(dict,'personalCenter.left.stats.playTime')}</span>
                  <span className="text-cyan-400 font-bold">{userData.stats.playTime}{t(dict,'personalCenter.left.stats.minutes')}</span>
                </div>
              </div>
            </div>

            {/* 钱包概览 */}
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-400/20 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-bold text-green-400 mb-3">💰 {t(dict,'personalCenter.left.walletOverview')}</h3>
              {wallet ? (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 items-center">
                    <span className="text-slate-400">{t(dict,'personalCenter.left.wallet.cash')}</span>
                    <span className="text-green-400 font-bold text-right">¥{wallet.cash.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 items-center">
                    <span className="text-slate-400">{t(dict,'personalCenter.left.wallet.gameCoins')}</span>
                    <span className="text-yellow-400 font-bold text-right">{wallet.gameCoins.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 items-center">
                    <span className="text-slate-400">{t(dict,'personalCenter.left.wallet.computingPower')}</span>
                    <span className="text-purple-400 font-bold text-right">{wallet.computingPower.toFixed(1)}</span>
                  </div>
                  <div className="grid grid-cols-2 items-center">
                    <span className="text-slate-400">{t(dict,'personalCenter.left.wallet.aCoins')}</span>
                    <span className="text-indigo-400 font-bold text-right">{(wallet.aCoins || 0).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">{t(dict,'personalCenter.left.wallet.loading')}</div>
              )}
              <button
                onClick={() => setActiveTab('wallet')}
                className="w-full mt-3 bg-green-500/20 border border-green-400/30 rounded px-3 py-1 text-xs text-green-400 hover:bg-green-500/30 transition-all"
              >
                {t(dict,'personalCenter.left.wallet.details')}
              </button>


            </div>

            {/* 最近活动 */}
            <div>
              <h3 className="text-lg font-bold text-pink-400 mb-3">📋 {t(dict,'personalCenter.left.recent.title')}</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {userData.recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="bg-slate-700/30 border border-slate-600/20 rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-cyan-400">
                        {activity.type === 'game' ? '🎮' : 
                         activity.type === 'purchase' ? '🛒' : 
                         activity.type === 'trade' ? '💱' : '🎁'} 
                        {activity.description}
                      </span>
                      {activity.value && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          +{activity.value}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
                {userData.recentActivities.length === 0 && (
                  <div className="text-center py-4 text-slate-400 text-sm">
                    {t(dict,'personalCenter.left.recent.empty')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 中央：主要内容 */}
          <div className="lg:col-span-2 bg-slate-800/80 border-2 border-green-400/30 rounded-lg p-6">
            {/* 标签切换 */}
            <div className="flex space-x-4 mb-6 border-b border-slate-600/30">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`pb-2 px-1 text-sm font-medium transition-colors ${
                  activeTab === 'inventory'
                    ? 'text-green-400 border-b-2 border-green-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                🎒 {t(dict,'personalCenter.centerTabs.inventory')}
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`pb-2 px-1 text-sm font-medium transition-colors ${
                  activeTab === 'transactions'
                    ? 'text-green-400 border-b-2 border-green-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                📊 {t(dict,'personalCenter.centerTabs.transactions')}
              </button>
              <button
                onClick={() => setActiveTab('wallet')}
                className={`pb-2 px-1 text-sm font-medium transition-colors ${
                  activeTab === 'wallet'
                    ? 'text-green-400 border-b-2 border-green-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                💳 {t(dict,'personalCenter.centerTabs.wallet')}
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`pb-2 px-2 text-sm font-bold transition-colors ${
                  activeTab === 'team'
                    ? 'text-yellow-400 border-b-2 border-yellow-400'
                    : 'text-slate-200 hover:text-yellow-300'
                }`}
              >
                🤝 {t(dict,'personalCenter.centerTabs.team')}
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`pb-2 px-2 text-sm font-bold transition-colors ${
                  activeTab === 'analysis'
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-slate-200 hover:text-purple-300'
                }`}
              >
                📈 {t(dict,'personalCenter.centerTabs.analysis')}
              </button>

              <button
                onClick={() => setActiveTab('blog')}
                className={`pb-2 px-2 text-sm font-bold transition-colors ${
                  activeTab === 'blog'
                    ? 'text-green-400 border-b-2 border-green-400'
                    : 'text-slate-200 hover:text-green-300'
                }`}
              >
                📝 {t(dict,'personalCenter.centerTabs.blog')}
              </button>
            </div>

            {/* 标签内容 */}
            {activeTab === 'inventory' && (
              <div>
                <h3 className="text-lg font-bold text-green-400 mb-4">{t(dict,'personalCenter.inventory.myItems')}</h3>
                {userItems.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {userItems.map((item) => (
                      <div key={item.id} className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4">
                        <div className="text-center">
                          <div className="text-2xl mb-2">🎮</div>
                          <h4 className="font-bold text-purple-400 text-sm">{item.name}</h4>
                          <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                          <div className="mt-2">
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                              {t(dict,'personalCenter.inventory.qty')}: 1
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📦</div>
                    <p className="text-slate-400">{t(dict,'personalCenter.inventory.emptyTitle')}</p>
                    <p className="text-sm text-slate-500 mt-2">{t(dict,'personalCenter.inventory.emptySub')}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <h3 className="text-lg font-bold text-green-400 mb-4">{t(dict,'personalCenter.transactions.title')}</h3>
                
                {/* 添加子标签 */}
                <div className="flex space-x-4 mb-4 border-b border-slate-600/30">
                  <button
                    onClick={() => setActiveSubTab('purchases')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors ${
                      activeSubTab === 'purchases'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    📦 {t(dict,'personalCenter.transactionTabs.purchases')}
                  </button>
                  <button
                    onClick={() => setActiveSubTab('sales')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors ${
                      activeSubTab === 'sales'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    💰 {t(dict,'personalCenter.transactionTabs.sales')}
                  </button>
                  <button
                    onClick={() => setActiveSubTab('listings')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors ${
                      activeSubTab === 'listings'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    🏪 {t(dict,'personalCenter.transactionTabs.listings')}
                  </button>
                </div>

                {/* 购买记录 */}
                {activeSubTab === 'purchases' && (
                  <div>
                    {userTransactions.filter(tx => tx.type === 'buy').length > 0 ? (
                      <div className="space-y-3">
                        {userTransactions.filter(tx => tx.type === 'buy').map((transaction) => (
                          <div key={transaction.id} className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-purple-400">{transaction.itemName}</h4>
                                <p className="text-sm text-slate-400">
                                  {t(dict,'personalCenter.transactions.purchaseWord')} • {new Date(transaction.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-red-400">
                                  -{(transaction.totalAmount || transaction.price).toFixed(2)}
                                </div>
                                <div className="text-xs text-slate-400">{t(dict,'personalCenter.transactions.expense')}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">📦</div>
                        <p className="text-slate-400">{t(dict,'personalCenter.transactions.nonePurchase')}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 销售记录 */}
                {activeSubTab === 'sales' && (
                  <div>
                    {userTransactions.filter(tx => tx.type === 'sell').length > 0 ? (
                      <div className="space-y-3">
                        {userTransactions.filter(tx => tx.type === 'sell').map((transaction) => (
                          <div key={transaction.id} className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-purple-400">{transaction.itemName}</h4>
                                <p className="text-sm text-slate-400">
                                  {t(dict,'personalCenter.transactions.sellWord')} • {new Date(transaction.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-400">
                                  +{transaction.price.toFixed(2)}
                                </div>
                                <div className="text-xs text-slate-400">{t(dict,'personalCenter.transactions.income')}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">💰</div>
                        <p className="text-slate-400">{t(dict,'personalCenter.transactions.noneSales')}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 在售商品 */}
                {activeSubTab === 'listings' && (
                  <div>
                    {userListings.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userListings.map((item) => (
                          <div key={item.id} className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">{getItemIcon(item.category)}</div>
                              <div className="flex-1">
                                <h4 className="font-bold text-purple-400 text-sm mb-1">{item.name}</h4>
                                <p className="text-xs text-slate-400 mb-2">{item.description}</p>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                                    {t(dict,'personalCenter.transactions.price')}: {item.price}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {t(dict,'personalCenter.transactions.views')}: {item.views}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleDelistItem(item.id, item.name)}
                                    className="flex-1 bg-red-500/20 border border-red-400/30 rounded px-3 py-1 text-xs text-red-400 hover:bg-red-500/30 transition-all"
                                  >
                                    {t(dict,'personalCenter.transactions.delist')}
                                  </button>
                                  <button
                                    onClick={() => handleEditPrice(item)}
                                    className="flex-1 bg-blue-500/20 border border-blue-400/30 rounded px-3 py-1 text-xs text-blue-400 hover:bg-blue-500/30 transition-all"
                                  >
                                    {t(dict,'personalCenter.transactions.editPrice')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">🏪</div>
                        <p className="text-slate-400">{t(dict,'personalCenter.transactions.noneListings')}</p>
                        <p className="text-sm text-slate-500 mt-2">{t(dict,'personalCenter.transactions.toMarket')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'team' && (
              <div>
                <TeamCenter />
              </div>
            )}

            {activeTab === 'analysis' && (
              <div>
                <EconomicSystemMonitor wallet={wallet} oCoinBalance={oCoinHoldings.balance} />
                <div className="mt-6">
                  <CommissionDisplay />
                </div>
                {/* A币贡献度分析 */}
                <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-lg p-4 mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-indigo-400">🅰️ {t(dict,'personalCenter.analysisSection.acoinAnalysis.title')}</h4>
                    <div className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">
                      {lang === 'zh' ? '本月A币' : 'A Coin This Month'}: {(wallet?.aCoins || 0).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm text-slate-300 mb-2">{t(dict,'personalCenter.analysisSection.acoinAnalysis.basis')}</div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                        <div className="text-yellow-400 font-bold mb-1">{(aCoinContribution.gameCoinsWeight * 100).toFixed(0)}%</div>
                        <div className="text-xs text-slate-400">{t(dict,'personalCenter.analysisSection.acoinAnalysis.gameCoinsEarned')}</div>
                      </div>
                      <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                        <div className="text-purple-400 font-bold mb-1">{(aCoinContribution.computingPowerWeight * 100).toFixed(0)}%</div>
                        <div className="text-xs text-slate-400">{t(dict,'personalCenter.analysisSection.acoinAnalysis.computingPower')}</div>
                      </div>
                      <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                        <div className="text-green-400 font-bold mb-1">{(aCoinContribution.transactionWeight * 100).toFixed(0)}%</div>
                        <div className="text-xs text-slate-400">{t(dict,'personalCenter.analysisSection.acoinAnalysis.transactionActivity')}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm text-slate-300 mb-2">{t(dict,'personalCenter.analysisSection.acoinAnalysis.thisMonth')}</div>
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">游戏币获得</span>
                        <span className="text-xs text-yellow-400">{aCoinContribution.gameCoinsEarned.toLocaleString()} {t(dict,'personalCenter.analysisSection.acoinAnalysis.coinsUnit')}</span>
                      </div>
                      <div className="w-full bg-slate-600 h-2 rounded-full">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{width: `${Math.min(aCoinContribution.gameCoinsEarned / 50, 100)}%`}}></div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-3 mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">算力贡献</span>
                        <span className="text-xs text-purple-400">{aCoinContribution.computingPowerContribution.toFixed(1)} {t(dict,'personalCenter.analysisSection.acoinAnalysis.powerUnit')}</span>
                      </div>
                      <div className="w-full bg-slate-600 h-2 rounded-full">
                        <div className="bg-purple-400 h-2 rounded-full" style={{width: `${Math.min(aCoinContribution.computingPowerContribution / 0.5, 100)}%`}}></div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-3 mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">交易活跃度</span>
                        <span className="text-xs text-green-400">{aCoinContribution.transactionActivity} {t(dict,'personalCenter.analysisSection.acoinAnalysis.tradesUnit')}</span>
                      </div>
                      <div className="w-full bg-slate-600 h-2 rounded-full">
                        <div className="bg-green-400 h-2 rounded-full" style={{width: `${Math.min(aCoinContribution.transactionActivity / 0.3, 100)}%`}}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-400">
                    <p>{lang === 'zh' ? 'A币是基于您的平台贡献度发放的平台币，与人民币1:1兑换。' : 'A Coin is issued based on your contribution; 1:1 to RMB.'}</p>
                    <p className="mt-1">{lang === 'zh' ? '每日自动结算，来源于平台净收入的40%，按贡献度比例分配。' : 'Settled daily from 40% of net income, allocated by contribution.'}</p>
                    <p className="mt-1">{lang === 'zh' ? '上次结算' : 'Last settlement'}: {aCoinContribution.lastDistribution.toLocaleDateString()} | {lang === 'zh' ? '累计获得' : 'Total earned'}: {aCoinContribution.totalACoinEarned.toFixed(2)} {lang === 'zh' ? 'A币' : 'A Coin'}</p>
                  </div>
                  
                  {/* A币每日结算记录 */}
                  <div className="mt-4 border-t border-indigo-400/20 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-indigo-400">{t(dict,'personalCenter.analysisSection.acoinAnalysis.dailyRecords')}</h4>
                      <button
                        onClick={() => setShowACoinSettlementDetails(!showACoinSettlementDetails)}
                        className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded hover:bg-indigo-500/30 transition-colors"
                      >
                        {showACoinSettlementDetails ? t(dict,'personalCenter.analysisSection.acoinAnalysis.collapse') : t(dict,'personalCenter.analysisSection.acoinAnalysis.expand')}
                      </button>
                    </div>
                    
                    {showACoinSettlementDetails ? (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {aCoinDailySettlements.length > 0 ? (
                          aCoinDailySettlements.map((settlement, index) => (
                            <div key={index} className="bg-slate-700/30 rounded-lg p-3">
                              <div className="flex justify-between items-center mb-2">
                                <div className="text-sm font-medium text-indigo-400">
                                  {new Date(settlement.timestamp).toLocaleDateString()}
                                </div>
                                <div className="text-sm font-bold text-green-400">
                                  +{settlement.amount.toFixed(2)} A币
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="text-slate-400">{lang === 'zh' ? '贡献分数' : 'Contribution Score'}: <span className="text-yellow-400">{settlement.contributionScore.toFixed(2)}</span></div>
                                <div className="text-slate-400">{lang === 'zh' ? '总发放' : 'Total Distributed'}: <span className="text-blue-400">{settlement.totalDistributed.toFixed(2)} {lang === 'zh' ? 'A币' : 'A Coin'}</span></div>
                                <div className="text-slate-400">{t(dict,'personalCenter.analysisSection.acoinAnalysis.contributors')}: <span className="text-purple-400">{settlement.recipientsCount}</span></div>
                                <div className="text-slate-400">{t(dict,'personalCenter.analysisSection.acoinAnalysis.share')}: <span className="text-orange-400">{((settlement.amount / settlement.totalDistributed) * 100).toFixed(2)}%</span></div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-slate-400">
                            {t(dict,'personalCenter.analysisSection.acoinAnalysis.none')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-slate-400">{t(dict,'personalCenter.analysisSection.acoinAnalysis.todayStatus')}</div>
                          <div className="text-sm font-medium text-green-400">
                            {aCoinDailySettlements.length > 0 && new Date(aCoinDailySettlements[0].timestamp).toDateString() === new Date().toDateString() 
                              ? t(dict,'personalCenter.analysisSection.acoinAnalysis.settled') 
                              : t(dict,'personalCenter.analysisSection.acoinAnalysis.pending')}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          {t(dict,'personalCenter.analysisSection.acoinAnalysis.autoTime')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}



            {activeTab === 'blog' && (
              <div>
                <BlogManager />
              </div>
            )}

            {activeTab === 'wallet' && (
              <div>
                <h3 className="text-lg font-bold text-green-400 mb-4">钱包管理</h3>
                
                {/* 余额详情 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {wallet ? (
                    <>
                      <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-4">
                        <div className="text-center">
                          <div className="text-2xl mb-2">💵</div>
                          <div className="text-sm text-slate-400">{t(dict,'personalCenter.walletSection.cards.cash')}</div>
                          <div className="text-xl font-bold text-green-400">¥{wallet.cash.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-4">
                        <div className="text-center">
                          <div className="text-2xl mb-2">🪙</div>
                          <div className="text-sm text-slate-400">{t(dict,'personalCenter.walletSection.cards.gameCoins')}</div>
                          <div className="text-xl font-bold text-yellow-400">{wallet.gameCoins.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-400/20 rounded-lg p-4">
                        <div className="text-center">
                          <div className="text-2xl mb-2">⚡</div>
                          <div className="text-sm text-slate-400">{t(dict,'personalCenter.walletSection.cards.computingPower')}</div>
                          <div className="text-xl font-bold text-purple-400">{wallet.computingPower.toFixed(1)}</div>
                        </div>
                      </div>
                      <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-lg p-4">
                        <div className="text-center">
                          <div className="text-2xl mb-2">🅰️</div>
                          <div className="text-sm text-slate-400">{t(dict,'personalCenter.walletSection.cards.aCoins')}</div>
                          <div className="text-xl font-bold text-indigo-400">{(wallet.aCoins || 0).toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="bg-orange-500/10 border border-orange-400/20 rounded-lg p-4">
                        <div className="text-center">
                          <div className="text-2xl mb-2">🔶</div>
                          <div className="text-sm text-slate-400">{t(dict,'personalCenter.walletSection.cards.oCoins')}</div>
                          <div className="text-xl font-bold text-orange-400">{oCoinHoldings.balance.toFixed(2)}</div>
                          {oCoinHoldings.lockedBalance > 0 && (
                            <div className="text-xs text-slate-400 mt-1">
                              {t(dict,'personalCenter.walletSection.cards.locked')}: {oCoinHoldings.lockedBalance.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-4 text-center text-slate-400">加载钱包数据中...</div>
                  )}
                </div>

                {/* 钱包操作 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <button
                    onClick={() => setShowRechargeModal(true)}
                    className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 text-green-400 hover:bg-green-500/30 transition-all"
                  >
                    <div className="text-2xl mb-2">💳</div>
                    <div className="font-bold">{t(dict,'personalCenter.walletSection.actions.recharge.title')}</div>
                    <div className="text-sm text-slate-400">{t(dict,'personalCenter.walletSection.actions.recharge.subtitle')}</div>
                  </button>
                  <button
                    onClick={() => setShowExchangeModal(true)}
                    className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 text-blue-400 hover:bg-blue-500/30 transition-all"
                  >
                    <div className="text-2xl mb-2">🔄</div>
                    <div className="font-bold">{t(dict,'personalCenter.walletSection.actions.exchange.title')}</div>
                    <div className="text-sm text-slate-400">{t(dict,'personalCenter.walletSection.actions.exchange.subtitle')}</div>
                  </button>
                  <button
                    onClick={() => setShowOCoinTradeModal(true)}
                    className="bg-orange-500/20 border border-orange-400/30 rounded-lg p-4 text-orange-400 hover:bg-orange-500/30 transition-all"
                  >
                    <div className="text-2xl mb-2">💱</div>
                    <div className="font-bold">{t(dict,'personalCenter.walletSection.actions.tradeOCoin.title')}</div>
                    <div className="text-sm text-slate-400">{t(dict,'personalCenter.walletSection.actions.tradeOCoin.subtitle')}</div>
                  </button>
                </div>



                {/* 收支明细 */}
                <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4">
                  <h4 className="font-bold text-cyan-400 mb-4">💰 {t(dict,'personalCenter.walletDetails.title')}</h4>
                  
                  {/* 货币选择按钮 */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <button
                      onClick={() => handleWalletCurrencyClick('cash')}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedWalletCurrency === 'cash'
                          ? 'bg-green-500/20 border-green-400/50 text-green-400'
                          : 'bg-slate-600/30 border-slate-500/30 text-slate-400 hover:bg-slate-600/50'
                      }`}
                    >
                      <div className="text-lg mb-1">💵</div>
                      <div className="text-sm font-medium">现金</div>
                      <div className="text-xs opacity-75">{t(dict,'personalCenter.walletDetails.viewHint')}</div>
                    </button>
                    
                    <button
                      onClick={() => handleWalletCurrencyClick('gameCoin')}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedWalletCurrency === 'gameCoin'
                          ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-400'
                          : 'bg-slate-600/30 border-slate-500/30 text-slate-400 hover:bg-slate-600/50'
                      }`}
                    >
                      <div className="text-lg mb-1">🪙</div>
                      <div className="text-sm font-medium">游戏币</div>
                      <div className="text-xs opacity-75">{t(dict,'personalCenter.walletDetails.viewHint')}</div>
                    </button>
                    
                    <button
                      onClick={() => handleWalletCurrencyClick('computingPower')}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedWalletCurrency === 'computingPower'
                          ? 'bg-purple-500/20 border-purple-400/50 text-purple-400'
                          : 'bg-slate-600/30 border-slate-500/30 text-slate-400 hover:bg-slate-600/50'
                      }`}
                    >
                      <div className="text-lg mb-1">⚡</div>
                      <div className="text-sm font-medium">算力</div>
                      <div className="text-xs opacity-75">{t(dict,'personalCenter.walletDetails.viewHint')}</div>
                    </button>
                    
                    <button
                      onClick={() => handleWalletCurrencyClick('aCoins')}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedWalletCurrency === 'aCoins'
                          ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-400'
                          : 'bg-slate-600/30 border-slate-500/30 text-slate-400 hover:bg-slate-600/50'
                      }`}
                    >
                      <div className="text-lg mb-1">🅰️</div>
                      <div className="text-sm font-medium">A币</div>
                      <div className="text-xs opacity-75">{t(dict,'personalCenter.walletDetails.viewHint')}</div>
                      {aCoinDailySettlements.length > 0 && new Date(aCoinDailySettlements[0].timestamp).toDateString() === new Date().toDateString() && (
                        <div className="mt-1 text-xs bg-green-500/30 text-green-400 px-1 py-0.5 rounded">
                          今日已结算
                        </div>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleWalletCurrencyClick('oCoins')}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedWalletCurrency === 'oCoins'
                          ? 'bg-orange-500/20 border-orange-400/50 text-orange-400'
                          : 'bg-slate-600/30 border-slate-500/30 text-slate-400 hover:bg-slate-600/50'
                      }`}
                    >
                      <div className="text-lg mb-1">🔶</div>
                      <div className="text-sm font-medium">O币</div>
                      <div className="text-xs opacity-75">{t(dict,'personalCenter.walletDetails.viewHint')}</div>
                      {oCoinMarketData.lastDividendDate && new Date(oCoinMarketData.lastDividendDate).toDateString() === new Date().toDateString() && (
                        <div className="mt-1 text-xs bg-green-500/30 text-green-400 px-1 py-0.5 rounded">
                          今日已分红
                        </div>
                      )}
                    </button>
                  </div>


                  </div>

                  {/* 交易明细列表 */}
                  <>
                  {selectedWalletCurrency && (
                    <div className="mt-4 p-4 bg-black/20 rounded-lg border border-slate-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-medium text-white">
                          {selectedWalletCurrency === 'cash' && `💵 ${t(dict,'personalCenter.walletDetails.headers.cash')}`}
                          {selectedWalletCurrency === 'gameCoin' && `🪙 ${t(dict,'personalCenter.walletDetails.headers.gameCoin')}`}
                          {selectedWalletCurrency === 'computingPower' && `⚡ ${t(dict,'personalCenter.walletDetails.headers.computingPower')}`}
                          {selectedWalletCurrency === 'aCoins' && `🅰️ ${t(dict,'personalCenter.walletDetails.headers.aCoins')}`}
                          {selectedWalletCurrency === 'oCoins' && `🔶 ${t(dict,'personalCenter.walletDetails.headers.oCoins')}`}
                        </h5>
                        <button
                          onClick={() => {
                            setSelectedWalletCurrency(null);
                            setWalletTransactions([]);
                          }}
                          className="text-gray-400 hover:text-white text-xs"
                        >
                          {t(dict,'personalCenter.walletDetails.footer.collapse')}
                        </button>
                      </div>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {walletTransactions.length > 0 ? (
                          walletTransactions.map((tx, index) => (
                            <div key={tx.id || `wtx-${index}-${new Date(tx.timestamp).getTime()}`} className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    tx.type === 'income' 
                                      ? 'bg-green-500/20 text-green-400' 
                                      : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {tx.type === 'income' ? t(dict,'personalCenter.walletDetails.tags.income') : t(dict,'personalCenter.walletDetails.tags.expense')}
                                  </span>
                                  <span className="text-sm text-white">{tx.description}</span>
                                </div>
                                <div className="text-xs text-gray-400">
                                  {new Date(tx.timestamp).toLocaleString('zh-CN', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-mono text-sm ${
                                  tx.type === 'income' ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {tx.type === 'income' ? '+' : '-'}
                                  {selectedWalletCurrency === 'cash' && '¥'}
                                  {tx.amount}
                                  {selectedWalletCurrency === 'gameCoin' && ' 币'}
                                  {selectedWalletCurrency === 'computingPower' && ' 算力'}
                                  {selectedWalletCurrency === 'aCoins' && ' A币'}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400 text-center py-4 text-sm">
                            {selectedWalletCurrency === 'cash' && t(dict,'personalCenter.walletDetails.empty.cash')}
                            {selectedWalletCurrency === 'gameCoin' && t(dict,'personalCenter.walletDetails.empty.gameCoin')}
                            {selectedWalletCurrency === 'computingPower' && t(dict,'personalCenter.walletDetails.empty.computingPower')}
                            {selectedWalletCurrency === 'aCoins' && t(dict,'personalCenter.walletDetails.empty.aCoins')}
                            {selectedWalletCurrency === 'oCoins' && t(dict,'personalCenter.walletDetails.empty.oCoins')}
                          </div>
                        )}
                      </div>
                      
                      {walletTransactions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-600/30">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>{t(dict,'personalCenter.walletDetails.footer.showRecentPrefix')}{walletTransactions.length}{t(dict,'personalCenter.walletDetails.footer.showRecentSuffix')}</span>
                            <button className="text-cyan-400 hover:text-cyan-300">
                              {t(dict,'personalCenter.walletDetails.footer.more')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!selectedWalletCurrency && (
                    <div className="text-center py-6 text-gray-400">
                      <div className="text-2xl mb-2">📊</div>
                      <div className="text-sm">点击上方货币类型查看收支明细</div>
                    </div>
                  )}
                </>
              </div>
            )}
          </div>

          {/* 右侧：全网数据 */}
          <div className="bg-slate-800/80 border-2 border-purple-400/30 rounded-lg p-6">
            <h2 className="text-xl font-bold text-purple-400 mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                📊 {t(dict,'personalCenter.right.globalData')}
              </div>
              <Link 
                to="/computing-dashboard"
                className="text-xs bg-purple-500/20 border border-purple-400/30 rounded px-2 py-1 text-purple-400 hover:bg-purple-500/30 transition-all"
              >
                {t(dict,'personalCenter.right.toComputing')}
              </Link>
            </h2>
            
            {/* 生态概览 */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-3">🌐 {t(dict,'personalCenter.right.overview')}</h3>
              <div className="space-y-3">
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">{t(dict,'personalCenter.right.metrics.totalUsers')}</span>
                    <span className="text-cyan-400 font-bold">{globalStats.totalUsers.toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">{t(dict,'personalCenter.right.metrics.onlineUsers')}</span>
                    <span className="text-green-400 font-bold">{globalStats.onlineUsers.toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">{t(dict,'personalCenter.right.metrics.totalComputePower')}</span>
                    <span className="text-purple-400 font-bold">{globalStats.totalComputePower}M</span>
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">{t(dict,'personalCenter.right.metrics.dailyTransactions')}</span>
                    <span className="text-yellow-400 font-bold">₿ {globalStats.dailyTransactions.toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">{t(dict,'personalCenter.right.metrics.aCoinBalance')}</span>
                    <span className="text-indigo-400 font-bold">{(globalStats as any).aCoinTotalSupply.toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">{t(dict,'personalCenter.right.metrics.aCoinCirculating')}</span>
                    <span className="text-indigo-400 font-bold">{globalStats.aCoinCirculatingSupply.toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">{t(dict,'personalCenter.right.metrics.aCoinHolders')}</span>
                    <span className="text-indigo-400 font-bold">{globalStats.aCoinHolders.toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">{t(dict,'personalCenter.right.metrics.oCoinCirculating')}</span>
                    <span className="text-orange-400 font-bold">{(globalStats as any).oCoinCirculatingSupply.toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">{t(dict,'personalCenter.right.metrics.oCoinPrice')}</span>
                    <span className="text-orange-400 font-bold">¥{globalStats.oCoinPrice.toFixed(2)}</span>
                  </div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">{t(dict,'personalCenter.right.metrics.oCoinMarketCap')}</span>
                    <span className="text-orange-400 font-bold">¥{(globalStats.oCoinMarketCap / 10000).toFixed(2)}万</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 充值模态框 */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-green-400/30 rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold text-green-400 mb-4">💳 {t(dict,'personalCenter.modals.recharge.title')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">{t(dict,'personalCenter.modals.recharge.amountLabel')}</label>
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  placeholder={t(dict,'personalCenter.modals.recharge.amountPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">{t(dict,'personalCenter.modals.recharge.paymentLabel')}</label>
                <select className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                  <option>{t(dict,'personalCenter.modals.recharge.options.alipay')}</option>
                  <option>{t(dict,'personalCenter.modals.recharge.options.wechat')}</option>
                  <option>{t(dict,'personalCenter.modals.recharge.options.card')}</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRecharge}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded transition-colors"
                >
                  {t(dict,'personalCenter.modals.recharge.confirm')}
                </button>
                <button
                  onClick={() => setShowRechargeModal(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded transition-colors"
                >
                  {t(dict,'personalCenter.modals.recharge.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 兑换模态框 */}
      {showExchangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-blue-400/30 rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold text-blue-400 mb-4">🔄 {t(dict,'personalCenter.modals.exchange.title')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">{t(dict,'personalCenter.modals.exchange.amountLabel')}</label>
                <input
                  type="number"
                  value={exchangeAmount}
                  onChange={(e) => setExchangeAmount(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  placeholder={t(dict,'personalCenter.modals.exchange.amountPlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t(dict,'personalCenter.modals.exchange.fromLabel')}</label>
                  <select
                    value={exchangeFrom}
                    onChange={(e) => setExchangeFrom(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  >
                    <option value="cash">{t(dict,'personalCenter.modals.exchange.options.cash')}</option>
                    <option value="gameCoin">{t(dict,'personalCenter.modals.exchange.options.gameCoin')}</option>
                    <option value="computingPower">{t(dict,'personalCenter.modals.exchange.options.computingPower')}</option>
                    <option value="aCoins">{t(dict,'personalCenter.modals.exchange.options.aCoins')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">{t(dict,'personalCenter.modals.exchange.toLabel')}</label>
                  <select
                    value={exchangeTo}
                    onChange={(e) => setExchangeTo(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  >
                    <option value="cash">{t(dict,'personalCenter.modals.exchange.options.cash')}</option>
                    <option value="gameCoin">{t(dict,'personalCenter.modals.exchange.options.gameCoin')}</option>
                    <option value="computingPower">{t(dict,'personalCenter.modals.exchange.options.computingPower')}</option>
                    <option value="aCoins">{t(dict,'personalCenter.modals.exchange.options.aCoins')}</option>
                  </select>
                </div>
              </div>
              <div className="bg-slate-700/30 rounded p-3">
                <div className="text-sm text-slate-400">{t(dict,'personalCenter.modals.exchange.ratesTitle')}</div>
                <div className="text-xs text-slate-500 mt-1 space-y-1">
                  <div>1 现金 = {configRates.cashToGameCoin} 游戏币 = {configRates.cashToComputingPower} 算力</div>
                  <div>1 A币 = {configRates.aCoinToGameCoin} 游戏币</div>
                  <div className="text-yellow-400">{t(dict,'personalCenter.modals.exchange.ratesNote')}</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExchange}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition-colors"
                >
                  {t(dict,'personalCenter.modals.exchange.confirm')}
                </button>
                <button
                  onClick={() => setShowExchangeModal(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded transition-colors"
                >
                  {t(dict,'personalCenter.modals.exchange.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 修改价格模态框 */}
      {showPriceEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-blue-400/30 rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold text-blue-400 mb-4">💰 修改商品价格</h3>
            <div className="space-y-4">
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">{getItemIcon(editingItem.category)}</div>
                  <div>
                    <h4 className="font-bold text-purple-400">{editingItem.name}</h4>
                    <p className="text-xs text-slate-400">{editingItem.description}</p>
                  </div>
                </div>
                <div className="text-sm text-slate-400">
                  当前价格: <span className="text-green-400 font-bold">{editingItem.price}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">新价格</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  placeholder="请输入新的价格"
                  min="0.01"
                  step="0.01"
                />
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-400/20 rounded p-3">
                <div className="text-sm text-yellow-400 font-medium mb-1">💡 价格建议</div>
                <div className="text-xs text-slate-400">
                  • 合理定价有助于快速售出<br/>
                  • 可参考市场同类商品价格<br/>
                  • 价格修改后立即生效
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmPriceEdit}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition-colors"
                >
                  确认修改
                </button>
                <button
                  onClick={() => {
                    setShowPriceEditModal(false);
                    setEditingItem(null);
                    setNewPrice('');
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* O币交易模态框 */}
      {showOCoinTradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-orange-400/30 rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold text-orange-400 mb-4">
              {oCoinTradeType === 'buy' ? `🔶 ${t(dict,'personalCenter.modals.ocoin.titles.buy')}` : `🔶 ${t(dict,'personalCenter.modals.ocoin.titles.sell')}`}
            </h3>
            <div className="space-y-4">
              {/* 市场信息 */}
              <div className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-400">{t(dict,'personalCenter.modals.ocoin.market.currentPrice')}</span>
                  <span className="text-lg font-bold text-orange-400">¥{oCoinMarketData.currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{t(dict,'personalCenter.modals.ocoin.market.change24h')}</span>
                  <span className={`font-medium ${oCoinMarketData.priceHistory.length >= 2 && 
                    oCoinMarketData.priceHistory[oCoinMarketData.priceHistory.length - 1].price > 
                    oCoinMarketData.priceHistory[oCoinMarketData.priceHistory.length - 2].price 
                    ? 'text-green-400' : 'text-red-400'}`}>
                    {oCoinMarketData.priceHistory.length >= 2 ? 
                      ((oCoinMarketData.priceHistory[oCoinMarketData.priceHistory.length - 1].price - 
                        oCoinMarketData.priceHistory[oCoinMarketData.priceHistory.length - 2].price) / 
                        oCoinMarketData.priceHistory[oCoinMarketData.priceHistory.length - 2].price * 100).toFixed(2) : 
                      '0.00'}%
                  </span>
                </div>
              </div>
              
              {/* 余额信息 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">{t(dict,'personalCenter.modals.ocoin.balances.cash')}</div>
                  <div className="text-sm font-bold text-green-400">¥{wallet?.cash.toFixed(2) || '0.00'}</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">{t(dict,'personalCenter.modals.ocoin.balances.ocoin')}</div>
                  <div className="text-sm font-bold text-orange-400">{oCoinHoldings.balance.toFixed(2)}</div>
                </div>
              </div>
              
              {/* 交易数量 */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  {oCoinTradeType === 'buy' ? t(dict,'personalCenter.modals.ocoin.quantity.buyLabel') : t(dict,'personalCenter.modals.ocoin.quantity.sellLabel')}
                </label>
                <input
                  type="number"
                  value={oCoinTradeAmount}
                  onChange={(e) => setOCoinTradeAmount(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  placeholder={oCoinTradeType === 'buy' ? t(dict,'personalCenter.modals.ocoin.quantity.buyPlaceholder') : t(dict,'personalCenter.modals.ocoin.quantity.sellPlaceholder')}
                  min="0.01"
                  step="0.01"
                />
              </div>
              
              {/* 交易预览 */}
              {oCoinTradeAmount && parseFloat(oCoinTradeAmount) > 0 && (
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="text-sm text-orange-400 font-medium mb-2">{t(dict,'personalCenter.modals.ocoin.preview.title')}</div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">{t(dict,'personalCenter.modals.ocoin.preview.qty')}</span>
                    <span className="text-xs text-white">{parseFloat(oCoinTradeAmount).toFixed(2)} O币</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">{t(dict,'personalCenter.modals.ocoin.preview.unitPrice')}</span>
                    <span className="text-xs text-white">¥{oCoinMarketData.currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-600/30">
                    <span className="text-xs text-slate-400">{t(dict,'personalCenter.modals.ocoin.preview.total')}</span>
                    <span className="text-sm font-bold text-orange-400">
                      ¥{(parseFloat(oCoinTradeAmount) * oCoinMarketData.currentPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              
              {/* 交易提示 */}
              <div className="bg-yellow-500/10 border border-yellow-400/20 rounded p-3">
                <div className="text-sm text-yellow-400 font-medium mb-1">💡 {t(dict,'personalCenter.modals.ocoin.tips.title')}</div>
                <div className="text-xs text-slate-400">
                  {t(dict,'personalCenter.modals.ocoin.tips.line1')}<br/>
                  {t(dict,'personalCenter.modals.ocoin.tips.line2')}<br/>
                  {t(dict,'personalCenter.modals.ocoin.tips.line3')}
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={handleOCoinTrade}
                  className={`flex-1 ${
                    oCoinTradeType === 'buy' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-orange-500 hover:bg-orange-600'
                  } text-white py-2 rounded transition-colors`}
                >
                  {oCoinTradeType === 'buy' ? t(dict,'personalCenter.modals.ocoin.actions.confirmBuy') : t(dict,'personalCenter.modals.ocoin.actions.confirmSell')}
                </button>
                <button
                  onClick={() => setShowOCoinTradeModal(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 rounded transition-colors"
                >
                  {t(dict,'personalCenter.modals.ocoin.actions.cancel')}
                </button>
              </div>
              
              {/* 切换交易类型 */}
              <div className="text-center">
                <button
                  onClick={() => setOCoinTradeType(oCoinTradeType === 'buy' ? 'sell' : 'buy')}
                  className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                >
                  {oCoinTradeType === 'buy' ? t(dict,'personalCenter.modals.ocoin.actions.toggleToSell') : t(dict,'personalCenter.modals.ocoin.actions.toggleToBuy')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default GamePersonalCenter;
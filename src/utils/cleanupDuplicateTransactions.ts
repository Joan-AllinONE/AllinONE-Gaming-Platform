// 清理重复交易记录的工具函数
const walletService = { getTransactions: () => [] } as any;

interface TransactionCleanupResult {
  totalTransactions: number;
  duplicatesRemoved: number;
  cleanedTransactions: number;
}

/**
 * 清理钱包中的重复交易记录
 * 特别针对交易市场购买的重复记录
 */
export async function cleanupDuplicateTransactions(): Promise<TransactionCleanupResult> {
  console.log('🧹 开始清理重复交易记录...');
  
  try {
    // 获取当前所有交易记录
    const allTransactions = await walletService.getTransactions(1000);
    const originalCount = allTransactions.length;
    
    console.log(`📊 当前交易记录总数: ${originalCount}`);
    
    // 识别重复记录的规则
    const duplicatePatterns = [
      // 匹配可能重复的交易市场购买记录
      /交易市场购买.*传说宝箱.*101/,
      /交易市场购买.*-101/,
      // 匹配其他可能的重复模式
      /购买道具.*101/
    ];
    
    // 创建去重后的交易记录数组
    const uniqueTransactions = [];
    const seenTransactions = new Set();
    let duplicatesFound = 0;
    
    for (const transaction of allTransactions) {
      // 创建交易的唯一标识符
      const transactionKey = `${transaction.type}_${transaction.amount}_${transaction.description}_${new Date(transaction.timestamp).toDateString()}`;
      
      // 检查是否是重复的交易记录
      let isDuplicate = false;
      
      // 1. 检查是否已经存在相同的交易
      if (seenTransactions.has(transactionKey)) {
        isDuplicate = true;
      }
      
      // 2. 检查是否匹配重复模式
      for (const pattern of duplicatePatterns) {
        if (pattern.test(transaction.description) && transaction.amount === 101) {
          // 如果是101币的交易市场购买，检查是否有对应的分离记录
          const hasCorrespondingRecords = allTransactions.some(tx => 
            tx.description.includes('交易市场购买:') && 
            tx.amount === 100 &&
            Math.abs(new Date(tx.timestamp).getTime() - new Date(transaction.timestamp).getTime()) < 60000 // 1分钟内
          );
          
          if (hasCorrespondingRecords) {
            isDuplicate = true;
            console.log(`🗑️  发现重复记录: ${transaction.description} (${transaction.amount})`);
          }
        }
      }
      
      if (!isDuplicate) {
        uniqueTransactions.push(transaction);
        seenTransactions.add(transactionKey);
      } else {
        duplicatesFound++;
      }
    }
    
    console.log(`🔍 发现重复记录: ${duplicatesFound} 条`);
    console.log(`✅ 清理后记录数: ${uniqueTransactions.length} 条`);
    
    // 注意：这里只是演示清理逻辑，实际的钱包服务可能需要额外的方法来批量更新记录
    // 在实际应用中，你可能需要：
    // 1. 备份原始数据
    // 2. 实现批量删除/更新的方法
    // 3. 提供回滚机制
    
    return {
      totalTransactions: originalCount,
      duplicatesRemoved: duplicatesFound,
      cleanedTransactions: uniqueTransactions.length
    };
    
  } catch (error) {
    console.error('❌ 清理重复交易记录失败:', error);
    throw error;
  }
}

/**
 * 验证交易记录的完整性
 */
export async function validateTransactionIntegrity(): Promise<{
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}> {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  try {
    const transactions = await walletService.getTransactions(100);
    
    // 检查是否有异常的交易记录
    for (const tx of transactions) {
      // 检查金额是否合理
      if (tx.amount <= 0) {
        issues.push(`发现异常金额: ${tx.amount} in ${tx.description}`);
      }
      
      // 检查是否有可疑的重复描述
      const similarTransactions = transactions.filter(t => 
        t.id !== tx.id && 
        t.description === tx.description && 
        t.amount === tx.amount &&
        Math.abs(new Date(t.timestamp).getTime() - new Date(tx.timestamp).getTime()) < 300000 // 5分钟内
      );
      
      if (similarTransactions.length > 0) {
        issues.push(`可能的重复交易: ${tx.description} (${tx.amount})`);
      }
    }
    
    // 提供建议
    if (issues.length === 0) {
      suggestions.push('交易记录看起来正常');
    } else {
      suggestions.push('建议运行清理脚本移除重复记录');
      suggestions.push('建议检查交易生成逻辑，避免未来的重复');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
    
  } catch (error) {
    console.error('验证交易记录完整性失败:', error);
    return {
      isValid: false,
      issues: ['验证过程中发生错误'],
      suggestions: ['请检查钱包服务是否正常工作']
    };
  }
}

// 导出清理和验证函数
export default {
  cleanupDuplicateTransactions,
  validateTransactionIntegrity
};
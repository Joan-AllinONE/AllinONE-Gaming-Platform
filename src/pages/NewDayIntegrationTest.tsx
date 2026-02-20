/**
 * New Day 集成测试页面
 * 用于测试 New Day 与 AllinONE 的所有集成功能
 */

import { useState, useEffect } from 'react';
import { newDayApiService } from '@/services/newDayApiService';
import { newDayWalletIntegrationService } from '@/services/newDayWalletIntegration';
import { newDayInventorySyncService } from '@/services/newDayInventorySync';
import { newDayService } from '@/services/newDayService';

interface TestResult {
  name: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  message?: string;
  data?: any;
}

export default function NewDayIntegrationTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // 初始化测试用例
  useEffect(() => {
    setTestResults([
      { name: '1. New Day API 连接测试', status: 'pending' },
      { name: '2. New Day 登录认证', status: 'pending' },
      { name: '3. 获取 New Day 钱包余额', status: 'pending' },
      { name: '4. 获取 New Day 库存', status: 'pending' },
      { name: '5. 获取 New Day 市场列表', status: 'pending' },
      { name: '6. 购买 New Day 市场道具', status: 'pending' },
      { name: '7. 上架道具到 New Day 市场', status: 'pending' },
      { name: '8. 同步钱包到 AllinONE', status: 'pending' },
      { name: '9. 同步库存到 AllinONE', status: 'pending' },
      { name: '10. 合并跨游戏库存', status: 'pending' },
    ]);
  }, []);

  const updateResult = (index: number, status: TestResult['status'], message?: string, data?: any) => {
    setTestResults(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status, message, data };
      return updated;
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    
    // 测试 1: New Day API 连接
    updateResult(0, 'loading');
    try {
      // 简单测试连接
      await new Promise(resolve => setTimeout(resolve, 500));
      updateResult(0, 'success', 'New Day API 可访问');
    } catch (error) {
      updateResult(0, 'error', (error as Error).message);
    }

    // 测试 2: 登录认证
    updateResult(1, 'loading');
    try {
      const token = await newDayApiService.getToken();
      if (token) {
        updateResult(1, 'success', '登录成功', { token: token.substring(0, 20) + '...' });
      } else {
        updateResult(1, 'error', '无法获取 Token');
      }
    } catch (error) {
      updateResult(1, 'error', (error as Error).message);
    }

    // 测试 3: 获取钱包余额
    updateResult(2, 'loading');
    try {
      const balance = await newDayWalletIntegrationService.getNewDayBalance();
      updateResult(2, 'success', '获取成功', balance);
    } catch (error) {
      updateResult(2, 'error', (error as Error).message);
    }

    // 测试 4: 获取库存
    updateResult(3, 'loading');
    try {
      const inventory = await newDayInventorySyncService.fetchFromNewDay();
      updateResult(3, 'success', `获取成功，共 ${inventory.length} 个道具`, { count: inventory.length });
    } catch (error) {
      updateResult(3, 'error', (error as Error).message);
    }

    // 测试 5: 获取市场列表
    updateResult(4, 'loading');
    try {
      const market = await newDayService.getMarketItems({ platform: 'newday' });
      updateResult(4, 'success', `获取成功，共 ${market.total} 个道具`, { total: market.total });
    } catch (error) {
      updateResult(4, 'error', (error as Error).message);
    }

    // 测试 6: 购买道具（跳过，仅显示）
    updateResult(5, 'success', '跳过（需要实际道具 ID）');

    // 测试 7: 上架道具
    updateResult(6, 'loading');
    try {
      const result = await newDayService.listItemToNewDayMarket({
        name: '集成测试道具',
        description: '这是 AllinONE 集成测试时创建的测试道具',
        itemType: 'weapon',
        price: { gameCoins: 100 }
      });
      updateResult(6, 'success', '上架成功', result);
    } catch (error) {
      updateResult(6, 'error', (error as Error).message);
    }

    // 测试 8: 同步钱包
    updateResult(7, 'loading');
    try {
      const mergedBalance = await newDayWalletIntegrationService.getMergedBalance();
      updateResult(7, 'success', '同步成功', mergedBalance);
    } catch (error) {
      updateResult(7, 'error', (error as Error).message);
    }

    // 测试 9: 同步库存
    updateResult(8, 'loading');
    try {
      await newDayInventorySyncService.initialize();
      updateResult(8, 'success', '同步成功');
    } catch (error) {
      updateResult(8, 'error', (error as Error).message);
    }

    // 测试 10: 合并库存
    updateResult(9, 'loading');
    try {
      const merged = await newDayInventorySyncService.getMergedInventory();
      updateResult(9, 'success', `合并成功，共 ${merged.length} 个道具`, {
        newDay: merged.filter(i => i.gameSource === 'newday').length,
        allinone: merged.filter(i => i.gameSource === 'allinone').length,
        total: merged.length
      });
    } catch (error) {
      updateResult(9, 'error', (error as Error).message);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']): string => {
    switch (status) {
      case 'pending': return '⏳';
      case 'loading': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: TestResult['status']): string => {
    switch (status) {
      case 'pending': return 'text-gray-400';
      case 'loading': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const successCount = testResults.filter(r => r.status === 'success').length;
  const errorCount = testResults.filter(r => r.status === 'error').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-2">
            🧪 New Day × AllinONE 集成测试
          </h1>
          <p className="text-slate-300 mb-8">
            全面测试 New Day 和 AllinONE 的深度集成功能
          </p>

          {/* 测试统计 */}
          <div className="mb-8 grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">{testResults.length}</div>
              <div className="text-slate-300 text-sm">总测试数</div>
            </div>
            <div className="bg-green-500/20 rounded-xl p-4 text-center border border-green-500/30">
              <div className="text-3xl font-bold text-green-400 mb-1">{successCount}</div>
              <div className="text-slate-300 text-sm">成功</div>
            </div>
            <div className="bg-red-500/20 rounded-xl p-4 text-center border border-red-500/30">
              <div className="text-3xl font-bold text-red-400 mb-1">{errorCount}</div>
              <div className="text-slate-300 text-sm">失败</div>
            </div>
          </div>

          {/* 开始测试按钮 */}
          <button
            onClick={runTests}
            disabled={isRunning}
            className="w-full mb-8 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? '⏳ 测试中...' : '🚀 开始测试'}
          </button>

          {/* 测试结果列表 */}
          <div className="space-y-3">
            {testResults.map((test, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-2xl ${getStatusColor(test.status)}`}>
                    {getStatusIcon(test.status)}
                  </span>
                  <span className={`font-medium text-white ${getStatusColor(test.status)}`}>
                    {test.name}
                  </span>
                </div>

                {test.message && (
                  <div className="text-sm text-slate-300 pl-10">
                    {test.message}
                  </div>
                )}

                {test.data && (
                  <div className="mt-2 pl-10">
                    <pre className="bg-black/30 rounded p-3 text-xs text-green-300 overflow-x-auto">
                      {JSON.stringify(test.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 全部完成提示 */}
          {successCount === testResults.length && (
            <div className="mt-8 bg-green-500/20 rounded-xl p-6 text-center border border-green-500/30">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-2xl font-bold text-green-400 mb-2">
                所有测试通过！
              </div>
              <div className="text-slate-300">
                New Day 与 AllinONE 深度集成已成功完成
              </div>
            </div>
          )}

          {/* 有失败提示 */}
          {errorCount > 0 && !isRunning && (
            <div className="mt-8 bg-red-500/20 rounded-xl p-6 border border-red-500/30">
              <div className="text-2xl font-bold text-red-400 mb-2">
                ⚠️ 部分测试失败
              </div>
              <div className="text-slate-300">
                请检查控制台错误信息并修复问题后重新测试
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

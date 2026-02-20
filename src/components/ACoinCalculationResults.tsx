import React from 'react';

interface ACoinCalculationResult {
  step1: {
    personalComputingPower: number;
    personalGameCoins: number;
    personalTransactionVolume: number;
    personalContributionScore: number;
  };
  step2: {
    networkComputingPower: number;
    networkGameCoins: number;
    networkTransactionVolume: number;
    totalNetworkContributionScore: number;
  };
  step3: {
    personalRatio: number;
    dailyACoinPool: number;
    calculatedACoin: number;
    actualDistributed: number;
    platformNetIncome: number;
  };
}

interface Props {
  calculationResult: ACoinCalculationResult;
  fundPoolData: any;
}

export default function ACoinCalculationResults({ calculationResult, fundPoolData }: Props) {
  return (
    <div className="space-y-8">
      {/* 第一步：个人数据计算 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
          个人贡献分数计算（分子）
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-700 dark:text-slate-300">个人数据</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>游戏币获得贡献 (50%权重)</span>
                <span className="font-mono">{calculationResult.step1.personalGameCoins} × 0.5 = {(calculationResult.step1.personalGameCoins * 0.5).toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span>算力贡献 (30%权重)</span>
                <span className="font-mono">{calculationResult.step1.personalComputingPower} × 0.3 = {(calculationResult.step1.personalComputingPower * 0.3).toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span>交易活跃度 (20%权重)</span>
                <span className="font-mono">{calculationResult.step1.personalTransactionVolume} × 0.2 = {(calculationResult.step1.personalTransactionVolume * 0.2).toFixed(1)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">个人贡献分数</div>
              <div className="text-3xl font-bold text-purple-600">{calculationResult.step1.personalContributionScore.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 第二步：全网数据计算 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
          全网总贡献分数计算（分母）
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-700 dark:text-slate-300">全网数据</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>游戏币发放贡献 (50%权重)</span>
                <span className="font-mono">{calculationResult.step2.networkGameCoins.toLocaleString()} × 0.5 = {(calculationResult.step2.networkGameCoins * 0.5).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>算力贡献 (30%权重)</span>
                <span className="font-mono">{calculationResult.step2.networkComputingPower.toLocaleString()} × 0.3 = {(calculationResult.step2.networkComputingPower * 0.3).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>交易活跃度 (20%权重)</span>
                <span className="font-mono">{calculationResult.step2.networkTransactionVolume.toLocaleString()} × 0.2 = {(calculationResult.step2.networkTransactionVolume * 0.2).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">全网总贡献分数</div>
              <div className="text-3xl font-bold text-amber-600">{calculationResult.step2.totalNetworkContributionScore.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 第三步：A币计算与发放 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
          A币计算与发放
        </h3>
        <div className="space-y-6">
          {/* 计算过程 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-700 dark:text-slate-300">计算过程</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>平台净收入</span>
                  <span className="font-mono">¥{calculationResult.step3.platformNetIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>A币发放池 (40%)</span>
                  <span className="font-mono">{calculationResult.step3.dailyACoinPool.toFixed(2)} A币</span>
                </div>
                <div className="flex justify-between">
                  <span>个人占比</span>
                  <span className="font-mono">{(calculationResult.step3.personalRatio * 100).toFixed(4)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>计算A币</span>
                  <span className="font-mono">{calculationResult.step3.calculatedACoin.toFixed(4)} A币</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-700 dark:text-slate-300">发放规则</h4>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="font-medium text-blue-800 dark:text-blue-200">发放公式</div>
                  <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    个人A币 = (个人贡献分数 ÷ 全网总贡献分数) × 当日发放池
                  </div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="font-medium text-green-800 dark:text-green-200">最小发放单位</div>
                  <div className="text-xs text-green-600 dark:text-green-300 mt-1">
                    0.01A币，低于此数额不发放
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 发放结果 */}
          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">实际发放A币</div>
                <div className="text-4xl font-bold text-indigo-600">{calculationResult.step3.actualDistributed.toFixed(2)}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">A币</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">等值人民币</div>
                <div className="text-4xl font-bold text-green-600">¥{calculationResult.step3.actualDistributed.toFixed(2)}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">1 A币 = 1 RMB</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">发放状态</div>
                <div className="text-2xl font-bold text-orange-600">
                  {calculationResult.step3.actualDistributed > 0 ? '✅ 已发放' : '❌ 未发放'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {calculationResult.step3.actualDistributed > 0 ? '满足最小发放条件' : '低于最小发放单位'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 资金池变化 */}
      {fundPoolData && calculationResult.step3.actualDistributed > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span>🏦</span>
            资金池A币变化
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">资金池A币减少</div>
              <div className="text-2xl font-bold text-red-600">-{calculationResult.step3.actualDistributed.toFixed(2)} A币</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">流通供应量增加</div>
              <div className="text-2xl font-bold text-blue-600">+{calculationResult.step3.actualDistributed.toFixed(2)} A币</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">累计发放增加</div>
              <div className="text-2xl font-bold text-green-600">+{calculationResult.step3.actualDistributed.toFixed(2)} A币</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
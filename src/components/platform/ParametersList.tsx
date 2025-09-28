import React, { useState } from 'react';
import { PlatformParameter, ParameterCategory } from '@/types/platformManagement';

interface ParametersListProps {
  parameters: PlatformParameter[];
  loading: boolean;
  onCreateVote: (parameter: PlatformParameter) => void;
}

/**
 * 参数列表组件
 */
const ParametersList: React.FC<ParametersListProps> = ({ parameters, loading, onCreateVote }) => {
  const [selectedCategory, setSelectedCategory] = useState<ParameterCategory | 'all'>('all');
  
  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }
  
  if (parameters.length === 0) {
    return <div className="text-center py-8">暂无参数数据</div>;
  }
  
  // 获取所有参数类别
  const categories = Array.from(new Set(parameters.map(param => param.category)));
  
  // 根据选择的类别过滤参数
  const filteredParameters = selectedCategory === 'all'
    ? parameters
    : parameters.filter(param => param.category === selectedCategory);
  
  // 参数类别中文名称映射
  const categoryNames: Record<ParameterCategory, string> = {
    acoin_allocation: 'A币分配权重',
    ocoin_allocation: 'O币分配权重',
    income_distribution: '收入分配比例',
    dividend_weights: '分红权重',
    exchange_rates: '兑换比例',
    ocoin_performance: '🔶 O币绩效权重',
    dividend_performance: '💰 分红绩效权重'
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">平台参数管理</h2>
      </div>
      
      {/* 类别筛选 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1 text-sm rounded-full ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white dark:bg-blue-700'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
            }`}
            onClick={() => setSelectedCategory('all')}
          >
            全部
          </button>
          
          {categories.map(category => (
            <button
              key={category}
              className={`px-3 py-1 text-sm rounded-full ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white dark:bg-blue-700'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {categoryNames[category]}
            </button>
          ))}
        </div>
      </div>
      
      {/* 参数列表 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700">
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                参数名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                当前值
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                取值范围
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                最后修改
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredParameters.map(param => (
              <tr key={param.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                    {param.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {param.description}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                    {param.currentValue}{param.unit && ` ${param.unit}`}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    {param.minValue} - {param.maxValue}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    步长: {param.step}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    {param.lastModified.toLocaleDateString()}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {param.modifiedBy}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                    onClick={() => onCreateVote(param)}
                  >
                    发起投票
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParametersList;
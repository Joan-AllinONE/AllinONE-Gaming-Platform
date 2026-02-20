import React, { useState } from 'react';
import { usePlatformManagement } from '@/contexts/PlatformManagementContext';
import { PlatformParameter } from '@/types/platformManagement';
import CreateVoteModal from './CreateVoteModal';

// 参数管理选项卡
const ParametersTab: React.FC = () => {
  const { parameters, loading } = usePlatformManagement();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateVoteModal, setShowCreateVoteModal] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<PlatformParameter | null>(null);

  // 根据分类筛选参数
  const filteredParameters = selectedCategory === 'all'
    ? parameters
    : parameters.filter(param => param.category === selectedCategory);

  const handleCreateVote = (parameter: PlatformParameter) => {
    setSelectedParameter(parameter);
    setShowCreateVoteModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateVoteModal(false);
    setSelectedParameter(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          全部
        </button>
        {['ACoin', 'OCoin', 'Income', 'Exchange'].map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {category === 'ACoin' ? 'A币参数' : 
             category === 'OCoin' ? 'O币参数' : 
             category === 'Income' ? '收入分配' : '兑换比例'}
          </button>
        ))}
      </div>

      {/* 参数列表 */}
      <div className="space-y-4">
        {filteredParameters.map((parameter) => (
          <div
            key={parameter.id}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{parameter.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{parameter.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-sm text-slate-500 dark:text-slate-400">当前值</div>
                  <div className="text-xl font-bold text-blue-600">
                    {parameter.currentValue} {parameter.unit}
                  </div>
                </div>
                <button
                  onClick={() => handleCreateVote(parameter)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  发起修改投票
                </button>
              </div>
            </div>

            {/* 参数历史记录 */}
            {parameter.history.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">修改历史</h4>
                <div className="space-y-2">
                  {parameter.history.slice(0, 3).map((history, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">
                        {new Date(history.timestamp).toLocaleString()} 由 {history.modifiedBy} 修改
                      </span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {history.value} {parameter.unit}
                      </span>
                    </div>
                  ))}
                  {parameter.history.length > 3 && (
                    <div className="text-xs text-blue-600 cursor-pointer hover:underline">
                      查看更多历史记录...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 创建投票弹窗 */}
      {showCreateVoteModal && selectedParameter && (
        <CreateVoteModal
          parameter={selectedParameter}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default ParametersTab;
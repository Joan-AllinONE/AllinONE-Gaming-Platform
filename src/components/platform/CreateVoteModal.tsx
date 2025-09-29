import React, { useState } from 'react';
import { PlatformParameter } from '@/types/platformManagement';

interface CreateVoteModalProps {
  parameter: PlatformParameter | null;
  onClose: () => void;
  onSubmit: (
    title: string,
    description: string,
    parameterId: string,
    proposedValue: number,
    reason: string
  ) => void;
}

/**
 * 创建投票弹窗组件
 */
const CreateVoteModal: React.FC<CreateVoteModalProps> = ({ parameter, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proposedValue, setProposedValue] = useState(parameter ? parameter.currentValue : 0);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  if (!parameter) {
    return null;
  }
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = '请输入标题';
    }
    
    if (!description.trim()) {
      newErrors.description = '请输入描述';
    }
    
    if (proposedValue < parameter.minValue || proposedValue > parameter.maxValue) {
      newErrors.proposedValue = `提议值必须在 ${parameter.minValue} 和 ${parameter.maxValue} 之间`;
    }
    
    if (!reason.trim()) {
      newErrors.reason = '请输入提议理由';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(title, description, parameter.id, proposedValue, reason);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              发起参数修改投票
            </h3>
            <button
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={onClose}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="parameter-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                参数名称
              </label>
              <input
                type="text"
                id="parameter-name"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                value={parameter.name}
                disabled
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="current-value" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                当前值
              </label>
              <input
                type="text"
                id="current-value"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                value={`${parameter.currentValue}${parameter.unit ? ' ' + parameter.unit : ''}`}
                disabled
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                投票标题
              </label>
              <input
                type="text"
                id="title"
                className={`w-full px-3 py-2 border ${
                  errors.title ? 'border-red-500 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-200`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入投票标题"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                投票描述
              </label>
              <textarea
                id="description"
                className={`w-full px-3 py-2 border ${
                  errors.description ? 'border-red-500 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-200`}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入投票描述"
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="proposed-value" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                提议值 ({parameter.minValue} - {parameter.maxValue})
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  id="proposed-value-range"
                  className="w-full mr-3"
                  min={parameter.minValue}
                  max={parameter.maxValue}
                  step={parameter.step}
                  value={proposedValue}
                  onChange={(e) => setProposedValue(parseFloat(e.target.value))}
                />
                <input
                  type="number"
                  id="proposed-value"
                  className={`w-24 px-3 py-2 border ${
                    errors.proposedValue ? 'border-red-500 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-200`}
                  min={parameter.minValue}
                  max={parameter.maxValue}
                  step={parameter.step}
                  value={proposedValue}
                  onChange={(e) => setProposedValue(parseFloat(e.target.value))}
                />
                {parameter.unit && (
                  <span className="ml-2 text-slate-700 dark:text-slate-300">{parameter.unit}</span>
                )}
              </div>
              {errors.proposedValue && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.proposedValue}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="reason" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                提议理由
              </label>
              <textarea
                id="reason"
                className={`w-full px-3 py-2 border ${
                  errors.reason ? 'border-red-500 dark:border-red-700' : 'border-slate-300 dark:border-slate-600'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-slate-200`}
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="输入提议理由"
              ></textarea>
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.reason}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                onClick={onClose}
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                提交
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateVoteModal;
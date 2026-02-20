import React, { useState, useEffect } from 'react';
import { aiChatService, AIConfig } from '../services/aiChatService';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIConfigModal: React.FC<AIConfigModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<AIConfig>({
    provider: 'openai',
    apiKey: '',
    model: '',
    baseURL: ''
  });
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(aiChatService.getConfig());
    }
  }, [isOpen]);

  const handleSave = () => {
    aiChatService.updateConfig(config);
    onClose();
  };

  const handleTest = async () => {
    if (!testMessage.trim()) return;
    
    setIsLoading(true);
    setTestResult(null);
    
    try {
      aiChatService.updateConfig(config);
      const response = await aiChatService.sendMessage('test', testMessage, '这是一个配置测试');
      setTestResult(response);
    } catch (error) {
      setTestResult(`测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border-2 border-purple-400 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-purple-400">🤖 AI聊天配置</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* AI提供商选择 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              AI提供商
            </label>
            <select
              value={config.provider}
              onChange={(e) => setConfig({...config, provider: e.target.value as any})}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            >
              <option value="openai">OpenAI (GPT)</option>
              <option value="claude">Anthropic (Claude)</option>
              <option value="gemini">Google (Gemini)</option>
              <option value="local">本地模型 (Ollama)</option>
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={config.apiKey || ''}
              onChange={(e) => setConfig({...config, apiKey: e.target.value})}
              placeholder="输入你的API Key"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            />
            <p className="text-xs text-slate-400 mt-1">
              API Key将安全保存在本地浏览器中
            </p>
          </div>

          {/* 模型选择 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              模型
            </label>
            <input
              type="text"
              value={config.model || ''}
              onChange={(e) => setConfig({...config, model: e.target.value})}
              placeholder={
                config.provider === 'openai' ? 'gpt-3.5-turbo' :
                config.provider === 'claude' ? 'claude-3-sonnet-20240229' :
                config.provider === 'gemini' ? 'gemini-pro' :
                'llama2'
              }
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            />
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Base URL (可选)
            </label>
            <input
              type="text"
              value={config.baseURL || ''}
              onChange={(e) => setConfig({...config, baseURL: e.target.value})}
              placeholder={
                config.provider === 'openai' ? 'https://api.openai.com/v1' :
                config.provider === 'local' ? 'http://localhost:11434' :
                '默认官方API地址'
              }
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            />
            <p className="text-xs text-slate-400 mt-1">
              可以使用自定义API代理地址
            </p>
          </div>

          {/* 测试区域 */}
          <div className="border-t border-slate-600 pt-6">
            <h3 className="text-lg font-medium text-slate-300 mb-4">🧪 连接测试</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="输入测试消息..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleTest()}
              />
              <button
                onClick={handleTest}
                disabled={isLoading || !testMessage.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
              >
                {isLoading ? '测试中...' : '测试'}
              </button>
            </div>
            
            {testResult && (
              <div className={`p-3 rounded border ${
                testResult.includes('测试失败') 
                  ? 'bg-red-500/10 border-red-500 text-red-300'
                  : 'bg-green-500/10 border-green-500 text-green-300'
              }`}>
                <strong>AI回复:</strong> {testResult}
              </div>
            )}
          </div>

          {/* 使用说明 */}
          <div className="bg-slate-700/50 rounded p-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">📖 使用说明</h4>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• <strong>OpenAI:</strong> 需要OpenAI API Key，支持GPT-3.5/GPT-4</li>
              <li>• <strong>Claude:</strong> 需要Anthropic API Key，支持Claude-3系列</li>
              <li>• <strong>Gemini:</strong> 需要Google AI API Key，免费额度较高</li>
              <li>• <strong>本地模型:</strong> 需要安装Ollama，完全免费和私密</li>
              <li>• 配置保存后，NPC和聊天功能将使用AI进行智能回复</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded transition-colors"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};
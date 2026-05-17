/**
 * 统一凭证/模板创建组件 — 4步向导
 * 流程: 选择类型 → 选择模板 → 配置参数 → 预览创建
 *
 * ⚠️ 本向导仅负责创建"源"（凭证资产/算法模板），
 *    奖池管理和游戏绑定请在对应的独立标签页中操作。
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Coins,
  Trophy,
  Shield,
  Flame,
  Star,
  Ticket,
  Crown,
  Settings,
  Calendar,
  Hash,
  RefreshCw,
  X,
  Eye,
  Layers,
  Zap,
  Calculator,
  Sparkles,
} from 'lucide-react';
import {
  VoucherTemplate,
  PresetTemplateId,
  VoucherRules,
  EnhancedCreateVoucherRequest,
  VoucherSourceType,
} from '../types';
import {
  ALL_TEMPLATES,
  getDefaultTemplate,
  mergeRules,
} from '../templates';
import {
  algorithmVoucherService,
  SettlementCycleType,
  type AlgorithmVoucherTemplate,
} from '../index';

interface EnhancedVoucherCreatorProps {
  currentUserId: string;
  currentUsername: string;
  onCreate: (request: EnhancedCreateVoucherRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// 凭证来源类型
type VoucherCreationType = 'instant' | 'algorithm';

// 4步向导
type CreationStep = 'type' | 'template' | 'details' | 'preview';

export const EnhancedVoucherCreator: React.FC<EnhancedVoucherCreatorProps> = ({
  currentUserId,
  currentUsername,
  onCreate,
  onCancel,
  isLoading = false,
}) => {
  // 当前步骤
  const [currentStep, setCurrentStep] = useState<CreationStep>('type');

  // 凭证来源类型选择
  const [creationType, setCreationType] = useState<VoucherCreationType>('instant');

  // 即时型：选中的凭证模板
  const [selectedTemplate, setSelectedTemplate] = useState<VoucherTemplate>(getDefaultTemplate());

  // 算法型：已有模板列表和选中的算法模板
  const [existingTemplates, setExistingTemplates] = useState<AlgorithmVoucherTemplate[]>([]);
  const [selectedAlgorithmTemplate, setSelectedAlgorithmTemplate] = useState<AlgorithmVoucherTemplate | null>(null);
  const [quickDeployMode, setQuickDeployMode] = useState(false);

  // 自定义规则覆盖（用于即时型凭证的规则微调）
  const [customRules, setCustomRules] = useState<VoucherRules>({});

  // 即时型表单
  const [basicForm, setBasicForm] = useState({
    name: '',
    denomination: '',
    quantity: '100',
    issueDate: new Date().toISOString().split('T')[0],
    expiresDate: '',
    description: '',
    symbol: 'ACOIN',
  });

  // 算法型表单
  const [algorithmForm, setAlgorithmForm] = useState({
    name: '',
    description: '',
    minDenomination: 0.0001,
    settlementCycle: 'daily' as SettlementCycleType,
    settlementTime: '00:00',
    gameCoinsWeight: 0.5,
    computingPowerWeight: 0.3,
    transactionWeight: 0.2,
    poolRatio: 0.4,
    calculationMode: 'auto' as 'auto' | 'fixed',
    totalSupply: 1000000,
    totalValue: 100,
  });

  // 加载已有算法模板
  const loadExistingTemplates = useCallback(() => {
    const templates = algorithmVoucherService.getTemplates();
    setExistingTemplates(templates);
  }, []);

  useEffect(() => {
    loadExistingTemplates();
  }, [loadExistingTemplates]);

  // 进入模板步骤时刷新算法模板列表
  useEffect(() => {
    if (currentStep === 'template' && creationType === 'algorithm') {
      loadExistingTemplates();
      setQuickDeployMode(false);
    }
  }, [currentStep, creationType, loadExistingTemplates]);

  // 选择已有算法模板
  const handleSelectAlgorithmTemplate = (template: AlgorithmVoucherTemplate) => {
    setSelectedAlgorithmTemplate(template);
    setAlgorithmForm({
      name: template.name,
      description: template.description || '',
      minDenomination: template.minDenomination,
      settlementCycle: template.settlementCycle,
      settlementTime: template.settlementTime,
      gameCoinsWeight: template.algorithm.weights.gameCoins,
      computingPowerWeight: template.algorithm.weights.computingPower,
      transactionWeight: template.algorithm.weights.transactionVolume,
      poolRatio: template.poolConfig.ratio,
      calculationMode: template.poolConfig.calculationMode || 'auto',
      totalSupply: template.poolConfig.fixedTotalSupply || Math.floor((template.totalValue || 100) / template.minDenomination),
      totalValue: template.totalValue || 100,
    });
  };

  // 一键部署：直接使用选中模板创建，跳过详情步骤
  const handleQuickDeploy = () => {
    if (!selectedAlgorithmTemplate) return;
    setQuickDeployMode(true);
    setAlgorithmForm({
      name: selectedAlgorithmTemplate.name,
      description: selectedAlgorithmTemplate.description || '',
      minDenomination: selectedAlgorithmTemplate.minDenomination,
      settlementCycle: selectedAlgorithmTemplate.settlementCycle,
      settlementTime: selectedAlgorithmTemplate.settlementTime,
      gameCoinsWeight: selectedAlgorithmTemplate.algorithm.weights.gameCoins,
      computingPowerWeight: selectedAlgorithmTemplate.algorithm.weights.computingPower,
      transactionWeight: selectedAlgorithmTemplate.algorithm.weights.transactionVolume,
      poolRatio: selectedAlgorithmTemplate.poolConfig.ratio,
      calculationMode: selectedAlgorithmTemplate.poolConfig.calculationMode || 'auto',
      totalSupply: selectedAlgorithmTemplate.poolConfig.fixedTotalSupply || Math.floor((selectedAlgorithmTemplate.totalValue || 100) / selectedAlgorithmTemplate.minDenomination),
      totalValue: selectedAlgorithmTemplate.totalValue || 100,
    });
    setCurrentStep('preview');
  };

  // 重置为新建模式
  const handleCreateNewTemplate = () => {
    setSelectedAlgorithmTemplate(null);
    setAlgorithmForm({
      name: '',
      description: '',
      minDenomination: 0.0001,
      settlementCycle: 'daily',
      settlementTime: '00:00',
      gameCoinsWeight: 0.5,
      computingPowerWeight: 0.3,
      transactionWeight: 0.2,
      poolRatio: 0.4,
      calculationMode: 'auto',
      totalSupply: 1000000,
      totalValue: 100,
    });
  };

  // 步骤配置 — 统一4步
  const steps = useMemo(() => {
    if (creationType === 'algorithm') {
      return [
        { key: 'type' as CreationStep, label: '选择类型', icon: <Layers className="w-4 h-4" /> },
        { key: 'template' as CreationStep, label: '算法模板', icon: <Calculator className="w-4 h-4" /> },
        { key: 'details' as CreationStep, label: '参数配置', icon: <Settings className="w-4 h-4" /> },
        { key: 'preview' as CreationStep, label: '预览确认', icon: <Eye className="w-4 h-4" /> },
      ];
    }
    return [
      { key: 'type' as CreationStep, label: '选择类型', icon: <Layers className="w-4 h-4" /> },
      { key: 'template' as CreationStep, label: '选择模板', icon: <Layers className="w-4 h-4" /> },
      { key: 'details' as CreationStep, label: '参数配置', icon: <Settings className="w-4 h-4" /> },
      { key: 'preview' as CreationStep, label: '预览确认', icon: <Eye className="w-4 h-4" /> },
    ];
  }, [creationType]);

  // 模板图标映射
  const templateIcons: Record<string, React.ReactNode> = {
    coins: <Coins className="w-6 h-6" />,
    trophy: <Trophy className="w-6 h-6" />,
    shield: <Shield className="w-6 h-6" />,
    flame: <Flame className="w-6 h-6" />,
    star: <Star className="w-6 h-6" />,
    ticket: <Ticket className="w-6 h-6" />,
    crown: <Crown className="w-6 h-6" />,
    settings: <Settings className="w-6 h-6" />,
  };

  // 获取最终规则配置（合并模板预设和用户自定义）
  const finalRules = useMemo(() => {
    return mergeRules(selectedTemplate.presetRules, customRules);
  }, [selectedTemplate, customRules]);

  // 选择模板
  const handleSelectTemplate = (template: VoucherTemplate) => {
    setSelectedTemplate(template);
    setBasicForm(prev => ({
      ...prev,
      denomination: String(template.defaultDenomination),
      quantity: String(template.defaultQuantity),
      name: template.name,
      description: template.description || '',
      expiresDate: template.defaultExpiresDays
        ? new Date(Date.now() + template.defaultExpiresDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : '',
    }));
    setCustomRules({});
  };

  // 下一步
  const handleNext = () => {
    const stepIndex = steps.findIndex(s => s.key === currentStep);
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].key);
    }
  };

  // 上一步
  const handlePrev = () => {
    const stepIndex = steps.findIndex(s => s.key === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].key);
    }
  };

  // 提交创建
  const handleSubmit = () => {
    if (creationType === 'algorithm') {
      // 创建算法凭证模板
      try {
        algorithmVoucherService.createTemplate(
          {
            name: algorithmForm.name,
            description: algorithmForm.description,
            minDenomination: algorithmForm.minDenomination,
            denominationUnit: 'ACOIN',
            settlementCycle: algorithmForm.settlementCycle,
            settlementTime: algorithmForm.settlementTime,
            algorithm: {
              weights: {
                gameCoins: algorithmForm.gameCoinsWeight,
                computingPower: algorithmForm.computingPowerWeight,
                transactionVolume: algorithmForm.transactionWeight,
              },
            },
            poolConfig: {
              source: 'platform_net_income',
              ratio: algorithmForm.poolRatio,
              minDistributionAmount: 0.0001,
              carryOverEnabled: true,
              calculationMode: algorithmForm.calculationMode,
              fixedTotalSupply: algorithmForm.calculationMode === 'fixed' ? algorithmForm.totalSupply : undefined,
            },
          },
          currentUserId,
          currentUsername
        );

        const request: EnhancedCreateVoucherRequest = {
          denomination: algorithmForm.minDenomination,
          quantity: 1,
          recipientId: currentUserId,
          recipientName: currentUsername,
          issueDate: Date.now(),
          metadata: {
            name: `${algorithmForm.name} - 模板凭证`,
            description: algorithmForm.description,
            symbol: 'ACOIN',
            totalSupply: algorithmForm.calculationMode === 'fixed' ? algorithmForm.totalSupply : 0,
            customData: {
              sourceType: VoucherSourceType.ALGORITHM,
              calculationMode: algorithmForm.calculationMode,
              poolRatio: algorithmForm.poolRatio,
            },
          },
          note: `算法凭证模板: ${algorithmForm.name}`,
        };
        onCreate(request);
      } catch (error) {
        console.error('创建算法模板失败:', error);
        alert(`创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    } else {
      // 创建即时发放型凭证
      const request: EnhancedCreateVoucherRequest = {
        denomination: parseFloat(basicForm.denomination) || 0,
        quantity: parseInt(basicForm.quantity) || 1,
        recipientId: currentUserId,
        recipientName: currentUsername,
        issueDate: new Date(basicForm.issueDate).getTime(),
        expiresAt: basicForm.expiresDate ? new Date(basicForm.expiresDate).getTime() : undefined,
        metadata: {
          name: basicForm.name,
          description: basicForm.description,
          symbol: basicForm.symbol,
          totalSupply: (parseFloat(basicForm.denomination) || 0) * (parseInt(basicForm.quantity) || 1),
          customData: {
            sourceType: VoucherSourceType.INSTANT,
          },
        },
        rules: finalRules,
        templateId: selectedTemplate.id,
        note: `基于模板 ${selectedTemplate.name} 创建`,
      };
      onCreate(request);
    }
  };

  // 表单验证
  const isStepValid = useCallback(() => {
    switch (currentStep) {
      case 'type':
        return !!creationType;
      case 'template':
        if (creationType === 'instant') return !!selectedTemplate;
        if (creationType === 'algorithm') return !!selectedAlgorithmTemplate || !!algorithmForm.name || quickDeployMode;
        return false;
      case 'details':
        if (creationType === 'instant') return !!basicForm.name && !!basicForm.denomination && !!basicForm.quantity;
        if (creationType === 'algorithm') return !!algorithmForm.name;
        return false;
      case 'preview':
        return true;
      default:
        return false;
    }
  }, [currentStep, creationType, selectedTemplate, basicForm, algorithmForm, selectedAlgorithmTemplate, quickDeployMode]);

  return (
    <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      {/* 头部步骤指示器 */}
      <div className="bg-slate-800/50 border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <button
                onClick={() => {
                  // 只允许跳转到已完成的步骤或当前步骤
                  const currentIndex = steps.findIndex(s => s.key === currentStep);
                  if (index <= currentIndex) setCurrentStep(step.key);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  currentStep === step.key
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === step.key
                    ? 'bg-white text-blue-600'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {index + 1}
                </span>
                <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6 min-h-[400px] max-h-[70vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* 第1步：凭证类型选择 */}
          {currentStep === 'type' && (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">选择凭证类型</h3>
                <p className="text-slate-400">选择要创建的凭证来源类型（双轨系统）</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* 即时发放型 */}
                <button
                  onClick={() => setCreationType('instant')}
                  className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
                    creationType === 'instant'
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-white/10 bg-slate-800/50 hover:bg-slate-800 hover:border-white/20'
                  }`}
                >
                  {creationType === 'instant' && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      creationType === 'instant' ? 'bg-pink-500 text-white' : 'bg-pink-500/20 text-pink-400'
                    }`}>
                      <Zap className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-1">即时发放型</h4>
                      <p className="text-sm text-slate-400 mb-3">立即创建并分发给指定用户</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-pink-500/20 text-pink-300">活动奖励</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-pink-500/20 text-pink-300">游戏奖励</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-pink-500/20 text-pink-300">人工发放</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-slate-500">
                      适用场景：平台活动、游戏通关奖励、人工补偿等需要立即到账的场景
                    </p>
                  </div>
                </button>

                {/* 计算分配型 */}
                <button
                  onClick={() => setCreationType('algorithm')}
                  className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
                    creationType === 'algorithm'
                      ? 'border-rose-500 bg-rose-500/10'
                      : 'border-white/10 bg-slate-800/50 hover:bg-slate-800 hover:border-white/20'
                  }`}
                >
                  {creationType === 'algorithm' && (
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      creationType === 'algorithm' ? 'bg-rose-500 text-white' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      <Calculator className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-1">计算分配型</h4>
                      <p className="text-sm text-slate-400 mb-3">基于贡献度自动计算并分配</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-rose-500/20 text-rose-300">日结分红</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-rose-500/20 text-rose-300">算力分红</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-rose-500/20 text-rose-300">自动结算</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-slate-500">
                      适用场景：每日结算、平台分红、基于贡献度（游戏币/算力/交易额）的自动分配
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* 第2步：算法模板选择（仅算法型） */}
          {currentStep === 'template' && creationType === 'algorithm' && (
            <motion.div
              key="algorithm-template"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 max-w-3xl mx-auto"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">选择或创建算法模板</h3>
                <p className="text-slate-400">可以选择已有模板一键部署，或在下一步自定义新模板</p>
              </div>

              {/* 已有算法模板列表 */}
              <div className="bg-slate-800/30 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    已有算法模板
                  </h4>
                  <button
                    onClick={loadExistingTemplates}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    刷新
                  </button>
                </div>

                {existingTemplates.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    <p className="text-sm">暂无已有模板，继续下一步创建新模板</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {existingTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAlgorithmTemplate?.id === template.id
                            ? 'border-rose-500 bg-rose-500/10'
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                        onClick={() => handleSelectAlgorithmTemplate(template)}
                      >
                        {selectedAlgorithmTemplate?.id === template.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                            <Calculator className="w-5 h-5 text-rose-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-white text-sm truncate">{template.name}</h5>
                            <p className="text-xs text-slate-400 mt-1">
                              {template.settlementCycle} @ {template.settlementTime}
                            </p>
                            <p className="text-xs text-rose-400 mt-1">
                              游戏{((template.algorithm.weights.gameCoins || 0) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                        {selectedAlgorithmTemplate?.id === template.id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleQuickDeploy(); }}
                            className="w-full mt-3 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                          >
                            <Zap className="w-4 h-4" />
                            一键部署（跳过配置）
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedAlgorithmTemplate && (
                  <button
                    onClick={handleCreateNewTemplate}
                    className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-white border border-dashed border-white/20 rounded-lg hover:border-white/40 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    创建新模板
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* 第2步：即时型模板选择 */}
          {currentStep === 'template' && creationType === 'instant' && (
            <motion.div
              key="template"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">选择凭证模板</h3>
                <p className="text-slate-400">选择一个预设模板开始，或从空白模板自定义</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ALL_TEMPLATES.filter(t => t.id !== PresetTemplateId.CUSTOM).map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    icon={templateIcons[template.icon || 'shield']}
                    isSelected={selectedTemplate.id === template.id}
                    onClick={() => handleSelectTemplate(template)}
                  />
                ))}
              </div>

              {/* 自定义选项 */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <TemplateCard
                  template={ALL_TEMPLATES.find(t => t.id === PresetTemplateId.CUSTOM)!}
                  icon={templateIcons.settings}
                  isSelected={selectedTemplate.id === PresetTemplateId.CUSTOM}
                  onClick={() => handleSelectTemplate(ALL_TEMPLATES.find(t => t.id === PresetTemplateId.CUSTOM)!)}
                  isCustom
                />
              </div>
            </motion.div>
          )}

          {/* 第3步：配置详情 */}
          {currentStep === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 max-w-3xl mx-auto"
            >
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {creationType === 'instant' ? '配置凭证参数' : '配置算法参数'}
                </h3>
                <p className="text-slate-400">
                  {creationType === 'instant'
                    ? '设置凭证的面额、数量和有效期'
                    : '设置结算周期、贡献度权重和发放比例'}
                </p>
              </div>

              {/* ===== 即时型：基本信息 ===== */}
              {creationType === 'instant' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">凭证名称 <span className="text-red-400">*</span></label>
                    <input type="text" value={basicForm.name} onChange={(e) => setBasicForm({ ...basicForm, name: e.target.value })}
                      placeholder="例如：平台A币"
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">代币符号</label>
                      <input type="text" value={basicForm.symbol} onChange={(e) => setBasicForm({ ...basicForm, symbol: e.target.value.toUpperCase() })}
                        placeholder="ACOIN"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">面额价值</label>
                      <div className="relative">
                        <input type="number" value={basicForm.denomination} onChange={(e) => setBasicForm({ ...basicForm, denomination: e.target.value })}
                          placeholder="100"
                          className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{basicForm.symbol}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">发行数量 <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <input type="number" value={basicForm.quantity} onChange={(e) => setBasicForm({ ...basicForm, quantity: e.target.value })}
                        placeholder="100" min="1"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                      <Hash className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500">
                      总供应量: {(parseFloat(basicForm.denomination) || 0) * (parseInt(basicForm.quantity) || 0)} {basicForm.symbol}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">发行日期</label>
                      <div className="relative">
                        <input type="date" value={basicForm.issueDate} onChange={(e) => setBasicForm({ ...basicForm, issueDate: e.target.value })}
                          className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">过期日期（可选）</label>
                      <div className="relative">
                        <input type="date" value={basicForm.expiresDate} onChange={(e) => setBasicForm({ ...basicForm, expiresDate: e.target.value })}
                          className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">凭证描述</label>
                    <textarea value={basicForm.description} onChange={(e) => setBasicForm({ ...basicForm, description: e.target.value })}
                      placeholder="描述这个凭证的用途和特点..." rows={2}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                  </div>

                  {/* 规则预览提示 */}
                  {selectedTemplate.presetRules && (
                    <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/20">
                      <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        模板预设规则
                      </h4>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-lg font-bold text-green-400">{finalRules.distribution?.length || 0}</p>
                          <p className="text-xs text-slate-400">分发规则</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-orange-400">{finalRules.recycle?.length || 0}</p>
                          <p className="text-xs text-slate-400">回收规则</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-blue-400">{finalRules.permissions?.exchange?.exchangeRates?.length || 0}</p>
                          <p className="text-xs text-slate-400">兑换币种</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        规则来自模板「{selectedTemplate.name}」预设，创建后可在「游戏绑定」中自定义调整
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* ===== 算法型：算法参数 ===== */}
              {creationType === 'algorithm' && !quickDeployMode && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">模板名称 <span className="text-red-400">*</span></label>
                    <input type="text" value={algorithmForm.name} onChange={(e) => setAlgorithmForm({ ...algorithmForm, name: e.target.value })}
                      placeholder="例如：A币日结分红凭证"
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">描述</label>
                    <textarea value={algorithmForm.description} onChange={(e) => setAlgorithmForm({ ...algorithmForm, description: e.target.value })}
                      placeholder="描述此算法凭证的用途和分配规则..." rows={2}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">结算周期</label>
                      <select value={algorithmForm.settlementCycle} onChange={(e) => setAlgorithmForm({ ...algorithmForm, settlementCycle: e.target.value as SettlementCycleType })}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 appearance-none">
                        <option value="daily">每日结算</option>
                        <option value="weekly">每周结算</option>
                        <option value="monthly">每月结算</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">结算时间</label>
                      <input type="text" value={algorithmForm.settlementTime} onChange={(e) => setAlgorithmForm({ ...algorithmForm, settlementTime: e.target.value })}
                        placeholder="00:00"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">最小面值</label>
                      <input type="number" step="0.0001" value={algorithmForm.minDenomination} onChange={(e) => setAlgorithmForm({ ...algorithmForm, minDenomination: parseFloat(e.target.value) })}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">发放池比例</label>
                      <input type="number" step="0.01" min="0" max="1" value={algorithmForm.poolRatio} onChange={(e) => setAlgorithmForm({ ...algorithmForm, poolRatio: parseFloat(e.target.value) })}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">计算模式</label>
                      <select value={algorithmForm.calculationMode} onChange={(e) => setAlgorithmForm({ ...algorithmForm, calculationMode: e.target.value as 'auto' | 'fixed' })}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 appearance-none">
                        <option value="auto">自动计算</option>
                        <option value="fixed">固定总量</option>
                      </select>
                    </div>
                  </div>

                  {algorithmForm.calculationMode === 'fixed' && (
                    <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/20">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-400">凭证总价值 (ACOIN)</label>
                          <input type="number" step="0.01" value={algorithmForm.totalValue}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              setAlgorithmForm({ ...algorithmForm, totalValue: value, totalSupply: Math.floor(value / algorithmForm.minDenomination) });
                            }}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-400">凭证总量</label>
                          <input type="number" value={algorithmForm.totalSupply} readOnly
                            className="w-full bg-slate-800/30 border border-white/10 rounded-lg px-3 py-2 text-slate-400 text-sm" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        总量 = {algorithmForm.totalValue} ÷ {algorithmForm.minDenomination} = {algorithmForm.totalSupply.toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="bg-rose-500/5 rounded-xl p-4 border border-rose-500/20">
                    <h4 className="font-medium text-white mb-3">贡献度权重配置</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400">游戏币权重</label>
                        <input type="number" step="0.1" min="0" max="1" value={algorithmForm.gameCoinsWeight}
                          onChange={(e) => setAlgorithmForm({ ...algorithmForm, gameCoinsWeight: parseFloat(e.target.value) })}
                          className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400">算力权重</label>
                        <input type="number" step="0.1" min="0" max="1" value={algorithmForm.computingPowerWeight}
                          onChange={(e) => setAlgorithmForm({ ...algorithmForm, computingPowerWeight: parseFloat(e.target.value) })}
                          className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400">交易额权重</label>
                        <input type="number" step="0.1" min="0" max="1" value={algorithmForm.transactionWeight}
                          onChange={(e) => setAlgorithmForm({ ...algorithmForm, transactionWeight: parseFloat(e.target.value) })}
                          className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50" />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-right">
                      <span className={Math.abs(algorithmForm.gameCoinsWeight + algorithmForm.computingPowerWeight + algorithmForm.transactionWeight - 1) < 0.01 ? 'text-green-400' : 'text-yellow-400'}>
                        权重总和: {(algorithmForm.gameCoinsWeight + algorithmForm.computingPowerWeight + algorithmForm.transactionWeight).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* 提示：后续绑定 */}
                  <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/20">
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      创建完成后，可在「奖池绑定」页面将此模板绑定到游戏和奖池
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* 第4步：预览确认 */}
          {currentStep === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">预览确认</h3>
                <p className="text-slate-400">请确认以下配置信息</p>
              </div>

              {/* 凭证类型标识 */}
              <div className="flex justify-center mb-6">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  creationType === 'algorithm'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                }`}>
                  {creationType === 'algorithm' ? <Calculator className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  {creationType === 'algorithm' ? '计算分配型' : '即时发放型'}
                </span>
              </div>

              {creationType === 'algorithm' ? (
                /* 算法凭证预览 */
                <div className="bg-gradient-to-br from-rose-600/10 via-purple-600/10 to-pink-600/10 rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
                      <Calculator className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">{algorithmForm.name}</h4>
                      <p className="text-rose-400 text-sm">算法凭证模板</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <PreviewItem label="结算周期" value={
                      algorithmForm.settlementCycle === 'daily' ? '每日结算' :
                      algorithmForm.settlementCycle === 'weekly' ? '每周结算' : '每月结算'
                    } />
                    <PreviewItem label="结算时间" value={algorithmForm.settlementTime} />
                    <PreviewItem label="最小面值" value={`${algorithmForm.minDenomination} ACOIN`} />
                    <PreviewItem label="发放模式" value={
                      algorithmForm.calculationMode === 'auto' ? '自动计算（基于平台收入）' : '固定总量'
                    } />
                  </div>

                  {algorithmForm.calculationMode === 'fixed' && (
                    <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 mb-6">
                      <p className="text-sm font-medium text-blue-400 mb-3">凭证总量信息</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-xl font-bold text-white">{algorithmForm.totalValue}</p>
                          <p className="text-xs text-slate-400">总价值 (ACOIN)</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-white">{algorithmForm.totalSupply.toLocaleString()}</p>
                          <p className="text-xs text-slate-400">凭证总量</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-white">{algorithmForm.minDenomination}</p>
                          <p className="text-xs text-slate-400">最小面值</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-white/10 pt-4 mb-6">
                    <p className="text-sm text-slate-400 mb-2">描述</p>
                    <p className="text-white">{algorithmForm.description || '无描述'}</p>
                  </div>

                  {/* 权重概览 */}
                  <div className="bg-rose-500/5 rounded-xl p-4 border border-rose-500/20">
                    <p className="text-sm font-medium text-rose-400 mb-3">贡献度权重配置</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-xl font-bold text-white">{(algorithmForm.gameCoinsWeight * 100).toFixed(0)}%</p>
                        <p className="text-xs text-slate-400">游戏币</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-white">{(algorithmForm.computingPowerWeight * 100).toFixed(0)}%</p>
                        <p className="text-xs text-slate-400">算力</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-white">{(algorithmForm.transactionWeight * 100).toFixed(0)}%</p>
                        <p className="text-xs text-slate-400">交易额</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 即时凭证预览 */
                <div className="bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      {templateIcons[selectedTemplate.icon || 'shield']}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">{basicForm.name}</h4>
                      <p className="text-slate-400 text-sm">基于模板: {selectedTemplate.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <PreviewItem label="代币符号" value={basicForm.symbol} />
                    <PreviewItem label="面额" value={`${basicForm.denomination} ${basicForm.symbol}`} />
                    <PreviewItem label="发行数量" value={basicForm.quantity} />
                    <PreviewItem
                      label="总供应量"
                      value={`${(parseFloat(basicForm.denomination) || 0) * (parseInt(basicForm.quantity) || 0)} ${basicForm.symbol}`}
                    />
                    <PreviewItem label="发行日期" value={basicForm.issueDate} />
                    <PreviewItem
                      label="过期日期"
                      value={basicForm.expiresDate || '永不过期'}
                    />
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <p className="text-sm text-slate-400 mb-2">描述</p>
                    <p className="text-white">{basicForm.description || '无描述'}</p>
                  </div>

                  {/* 规则概览 */}
                  <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{finalRules.distribution?.length || 0}</p>
                      <p className="text-sm text-slate-400">分发规则</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-400">{finalRules.recycle?.length || 0}</p>
                      <p className="text-sm text-slate-400">回收规则</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">
                        {finalRules.permissions?.exchange?.exchangeRates?.length || 0}
                      </p>
                      <p className="text-sm text-slate-400">兑换币种</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 后续步骤提示 */}
              <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
                <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  后续步骤
                </h4>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>1. 创建完成后，前往「奖池管理」将凭证充入对应奖池</p>
                  <p>2. 在「游戏绑定」中创建游戏绑定并选择该奖池</p>
                  <p>3. 绑定生效后，玩家即可通过游戏获得凭证奖励</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部按钮 */}
      <div className="bg-slate-800/50 border-t border-white/10 p-4 flex items-center justify-between">
        <button
          onClick={currentStep === 'type' ? onCancel : handlePrev}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-700/50 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
        >
          {currentStep === 'type' ? (
            <>
              <X className="w-4 h-4" />
              取消
            </>
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              上一步
            </>
          )}
        </button>

        <button
          onClick={currentStep === 'preview' ? handleSubmit : handleNext}
          disabled={!isStepValid() || isLoading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              创建中...
            </>
          ) : currentStep === 'preview' ? (
            <>
              <Check className="w-4 h-4" />
              确认创建
            </>
          ) : (
            <>
              下一步
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// 模板卡片组件
const TemplateCard: React.FC<{
  template: VoucherTemplate;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  isCustom?: boolean;
}> = ({ template, icon, isSelected, onClick, isCustom }) => (
  <button
    onClick={onClick}
    className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
      isSelected
        ? 'border-blue-500 bg-blue-500/10'
        : 'border-white/10 bg-slate-800/50 hover:bg-slate-800 hover:border-white/20'
    } ${isCustom ? 'col-span-full md:col-span-1' : ''}`}
  >
    {isSelected && (
      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
        <Check className="w-4 h-4 text-white" />
      </div>
    )}
    <div className="flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
        isSelected ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-white mb-1">{template.name}</h4>
        <p className="text-sm text-slate-400 line-clamp-2">{template.description}</p>
        {!isCustom && (
          <div className="flex flex-wrap gap-2 mt-3">
            {template.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs px-2 py-1 rounded-full bg-white/5 text-slate-400">
                {tag}
              </span>
            ))}
          </div>
        )}
        {isCustom && (
          <p className="text-sm text-blue-400 mt-2">适合高级用户，从零开始配置</p>
        )}
      </div>
    </div>
  </button>
);

// 预览项组件
const PreviewItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-400 mb-1">{label}</p>
    <p className="text-white font-medium">{value}</p>
  </div>
);

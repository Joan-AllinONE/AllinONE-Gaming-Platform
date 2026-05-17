/**
 * Skill 配置向导组件
 * 
 * 支持两种模式：
 * 1. SDK 集成模式：生成可直接集成到游戏的 TypeScript 代码
 * 2. 兑换码模式：生成道具兑换码，玩家购买后在游戏内兑换
 * 
 * 兑换码模式优势：
 * - 游戏方无需修改代码
 * - 支持任何开发语言和平台
 * - 降低接入难度和风险
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  generateSkill, 
  validateConfig, 
  getDefaultTemplate,
  type SkillConfig,
  type GenerationResult,
  type ValidationResult,
} from '@/skills/generator';
import { 
  ItemType, 
  HostedItem, 
  CreateHostedItemRequest,
  RedeemCode,
} from '@/types/redeemCode';
import { redeemCodeService } from '@/services/redeemCodeService';

// ==================== 类型定义 ====================

type WizardMode = 'sdk' | 'redeemCode';

interface CurrencyItem {
  id: string;
  name: string;
  type: string;
  initialBalance: number;
  enabled: boolean;
}

interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: Record<string, number>;
  stock: number;
  description: string;
}

// 兑换码道具配置
interface RedeemCodeItemConfig {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  price: number;
  inventory: number;
  gameItemId: string;
  gameQuantity: number;
  codePrefix: string;
  codeLength: number;
}

export type SkillGenerationResult = GenerationResult & { validation: ValidationResult };

interface SkillConfigWizardProps {
  initialConfig?: Partial<SkillConfig>;
  onConfigChange?: (config: SkillConfig) => void;
  onGenerate?: (result: SkillGenerationResult) => void;
  onCreateRedeemItems?: (items: HostedItem[]) => void;
  className?: string;
  defaultMode?: WizardMode;
  gameId?: string;
}

// ==================== 组件 ====================

export const SkillConfigWizard: React.FC<SkillConfigWizardProps> = ({
  initialConfig,
  onConfigChange,
  onGenerate,
  onCreateRedeemItems,
  className = '',
  defaultMode = 'sdk',
  gameId: propsGameId,
}) => {
  // ========== 模式状态 ==========
  const [mode, setMode] = useState<WizardMode>(defaultMode);
  
  // ========== SDK 模式状态 ==========
  
  // 基础信息
  const [gameId, setGameId] = useState(initialConfig?.gameId || propsGameId || '');
  const [gameName, setGameName] = useState(initialConfig?.gameName || '');
  const [description, setDescription] = useState(initialConfig?.description || '');
  const [version, setVersion] = useState(initialConfig?.version || '1.0.0');
  
  // 功能开关
  const [features, setFeatures] = useState({
    wallet: initialConfig?.features?.includes('wallet') ?? true,
    store: initialConfig?.features?.includes('store') ?? true,
    inventory: initialConfig?.features?.includes('inventory') ?? false,
    leaderboard: initialConfig?.features?.includes('leaderboard') ?? false,
    achievements: initialConfig?.features?.includes('achievements') ?? false,
  });
  
  // 货币设置
  const [currencies, setCurrencies] = useState<CurrencyItem[]>(
    initialConfig?.currencies || [
      { id: 'game_coin', name: '游戏币', type: 'coin', initialBalance: 1000, enabled: true },
      { id: 'premium', name: '钻石', type: 'premium', initialBalance: 0, enabled: true },
    ]
  );
  
  // 商品列表
  const [products, setProducts] = useState<ProductItem[]>(
    initialConfig?.products?.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      description: p.description,
    })) || [
      { id: 'item_001', name: '新手礼包', category: 'general', price: { game_coin: 0 }, stock: 999, description: '新玩家专属礼包' },
    ]
  );
  
  // ========== 兑换码模式状态 ==========
  const [redeemItems, setRedeemItems] = useState<RedeemCodeItemConfig[]>([
    {
      id: 'redeem_1',
      name: '生命药水',
      description: '恢复100点生命值',
      type: ItemType.CONSUMABLE,
      price: 10,
      inventory: 1000,
      gameItemId: 'health_potion',
      gameQuantity: 1,
      codePrefix: 'HP-',
      codeLength: 8,
    },
  ]);
  const [createdHostedItems, setCreatedHostedItems] = useState<HostedItem[]>([]);
  const [isCreatingItems, setIsCreatingItems] = useState(false);
  
  // 当前步骤
  const [currentStep, setCurrentStep] = useState(1);
  
  // 生成结果
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // ========== 计算属性 ==========
  
  const currentConfig = useMemo((): SkillConfig => ({
    gameId: gameId || `game_${Date.now()}`,
    gameName: gameName || '未命名游戏',
    name: gameName || '未命名游戏',
    description: description || '',
    version: version || '1.0.0',
    integrationType: 'standard',
    features: Object.entries(features)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name as any),
    currencies: currencies.filter(c => c.enabled).map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      initialBalance: c.initialBalance,
      enabled: c.enabled,
    })),
    products: products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      description: p.description,
    })),
    inventory: {
      enabled: features.inventory,
      syncMode: 'realtime',
      maxSlots: 50,
    },
  }), [gameId, gameName, description, version, features, currencies, products]);
  
  // ========== 回调函数 ==========
  
  const handleFeatureToggle = useCallback((feature: keyof typeof features) => {
    setFeatures(prev => {
      const next = { ...prev, [feature]: !prev[feature] };
      
      // 自动依赖：商店依赖钱包
      if (feature === 'wallet' && !next.wallet) {
        next.store = false;
      }
      
      return next;
    });
  }, []);
  
  const handleAddCurrency = useCallback(() => {
    setCurrencies(prev => [
      ...prev,
      {
        id: `currency_${prev.length + 1}`,
        name: `新货币 ${prev.length + 1}`,
        type: 'coin',
        initialBalance: 0,
        enabled: true,
      },
    ]);
  }, []);
  
  const handleRemoveCurrency = useCallback((index: number) => {
    setCurrencies(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const handleUpdateCurrency = useCallback((index: number, updates: Partial<CurrencyItem>) => {
    setCurrencies(prev => prev.map((c, i) => i === index ? { ...c, ...updates } : c));
  }, []);
  
  const handleAddProduct = useCallback(() => {
    const defaultCurrency = currencies[0]?.id || 'game_coin';
    setProducts(prev => [
      ...prev,
      {
        id: `product_${prev.length + 1}`,
        name: `新商品 ${prev.length + 1}`,
        category: 'general',
        price: { [defaultCurrency]: 100 },
        stock: 999,
        description: '',
      },
    ]);
  }, [currencies]);
  
  const handleRemoveProduct = useCallback((index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const handleUpdateProduct = useCallback((index: number, updates: Partial<ProductItem>) => {
    setProducts(prev => prev.map((p, i) => i === index ? { ...p, ...updates } : p));
  }, []);
  
  const handleUpdateProductPrice = useCallback((productIndex: number, currencyId: string, price: number) => {
    setProducts(prev => prev.map((p, i) => {
      if (i !== productIndex) return p;
      return {
        ...p,
        price: { ...p.price, [currencyId]: price },
      };
    }));
  }, []);
  
  // ========== 兑换码模式处理函数 ==========
  
  const handleAddRedeemItem = useCallback(() => {
    setRedeemItems(prev => [
      ...prev,
      {
        id: `redeem_${prev.length + 1}`,
        name: `新道具 ${prev.length + 1}`,
        description: '',
        type: ItemType.CONSUMABLE,
        price: 10,
        inventory: 100,
        gameItemId: '',
        gameQuantity: 1,
        codePrefix: '',
        codeLength: 8,
      },
    ]);
  }, []);
  
  const handleRemoveRedeemItem = useCallback((index: number) => {
    setRedeemItems(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const handleUpdateRedeemItem = useCallback((index: number, updates: Partial<RedeemCodeItemConfig>) => {
    setRedeemItems(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
  }, []);
  
  const handleCreateRedeemItems = useCallback(async () => {
    if (!gameId) {
      alert('请先设置游戏ID');
      return;
    }
    
    setIsCreatingItems(true);
    
    try {
      const createdItems: HostedItem[] = [];
      
      for (const item of redeemItems) {
        const request: CreateHostedItemRequest = {
          gameId,
          name: item.name,
          description: item.description,
          type: item.type,
          codeConfig: {
            prefix: item.codePrefix,
            length: item.codeLength,
            charset: 'alphanumeric',
            caseSensitive: false,
            singleUse: true,
          },
          initialInventory: item.inventory,
          pricing: {
            price: item.price,
            currency: 'ACOIN',
          },
          gameEffect: {
            itemId: item.gameItemId,
            quantity: item.gameQuantity,
          },
        };
        
        const created = await redeemCodeService.createHostedItem(request);
        createdItems.push(created);
      }
      
      setCreatedHostedItems(createdItems);
      onCreateRedeemItems?.(createdItems);
      
    } catch (error) {
      console.error('创建托管道具失败:', error);
    } finally {
      setIsCreatingItems(false);
    }
  }, [gameId, redeemItems, onCreateRedeemItems]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      // 生成 Markdown 配置
      const configMarkdown = generateMarkdownConfig();
      
      // 验证配置
      const validation = validateConfig(configMarkdown);
      setValidationResult(validation);
      
      // 生成代码
      const result = await generateSkill(configMarkdown, {
        outputDir: './src/skills/generated',
        generateTypes: true,
        autoFix: true,
      });
      
      // 获取生成的代码
      const skillFile = result.files.find(f => f.type === 'skill');
      if (skillFile) {
        setGeneratedCode(skillFile.content);
      }
      
      onGenerate?.(result);
      
    } catch (error) {
      console.error('生成失败:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [currentConfig, onGenerate]);
  
  const generateMarkdownConfig = useCallback(() => {
    const lines: string[] = [
      `# Skill 配置 - ${gameName || '未命名游戏'}`,
      '',
      `## 基础信息`,
      `- **游戏ID**: ${gameId || `game_${Date.now()}`}`,
      `- **游戏名称**: ${gameName || '未命名游戏'}`,
      `- **版本**: ${version}`,
      ...(description ? [`- **描述**: ${description}`] : []),
      '',
      `## 功能模块`,
      `- [${features.wallet ? 'x' : ' '}] 钱包系统`,
      `- [${features.store ? 'x' : ' '}] 商店系统`,
      `- [${features.inventory ? 'x' : ' '}] 库存同步`,
      `- [${features.leaderboard ? 'x' : ' '}] 排行榜`,
      `- [${features.achievements ? 'x' : ' '}] 成就系统`,
      '',
    ];
    
    // 货币设置
    if (currencies.length > 0) {
      lines.push(
        `## 货币设置`,
        `| 货币类型 | 启用 | 初始值 |`,
        `|---------|:----:|-------:|`
      );
      currencies.forEach(c => {
        lines.push(`| ${c.name} | ${c.enabled ? '✅' : '⬜'} | ${c.initialBalance} |`);
      });
      lines.push('');
    }
    
    // 商品列表
    if (products.length > 0 && features.store) {
      const enabledCurrencies = currencies.filter(c => c.enabled);
      lines.push(
        `## 商品列表`,
        `| 商品ID | 名称 | ${enabledCurrencies.map(c => `${c.name}`).join(' | ')} | 库存 | 类型 |`,
        `|--------|------|${enabledCurrencies.map(() => '------:').join('|')}|-----:|------|`
      );
      products.forEach(p => {
        const prices = enabledCurrencies.map(c => p.price[c.id] || '-').join(' | ');
        lines.push(`| ${p.id} | ${p.name} | ${prices} | ${p.stock} | ${p.category} |`);
      });
      lines.push('');
    }
    
    return lines.join('\n');
  }, [gameName, gameId, version, description, features, currencies, products]);
  
  const handleCopyConfig = useCallback(() => {
    const config = generateMarkdownConfig();
    navigator.clipboard.writeText(config);
    alert('配置已复制到剪贴板！');
  }, [generateMarkdownConfig]);
  
  const handleCopyCode = useCallback(() => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      alert('代码已复制到剪贴板！');
    }
  }, [generatedCode]);
  
  // ========== 渲染 ==========
  
  const sdkSteps = [
    { id: 1, name: '基础信息', icon: '📝' },
    { id: 2, name: '功能选择', icon: '⚙️' },
    { id: 3, name: '货币设置', icon: '💰' },
    { id: 4, name: '商品管理', icon: '🛍️' },
    { id: 5, name: '生成代码', icon: '✨' },
  ];
  
  const redeemSteps = [
    { id: 1, name: '基础信息', icon: '📝' },
    { id: 2, name: '托管道具', icon: '🎁' },
    { id: 3, name: '生成兑换码', icon: '✨' },
  ];
  
  const steps = mode === 'sdk' ? sdkSteps : redeemSteps;
  
  return (
    <div className={`bg-gray-900 text-white rounded-xl overflow-hidden ${className}`}>
      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">🎮 Skill 配置向导</h2>
            <p className="text-blue-100 text-sm mt-1">
              {mode === 'sdk' ? '快速配置游戏功能，一键生成 Skill 代码' : '托管道具生成兑换码，零代码接入平台'}
            </p>
          </div>
          {/* 模式切换 */}
          <div className="flex bg-white/10 rounded-lg p-1">
            <button
              onClick={() => { setMode('sdk'); setCurrentStep(1); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'sdk' ? 'bg-white text-blue-600' : 'text-white/70 hover:text-white'
              }`}
            >
              SDK 集成
            </button>
            <button
              onClick={() => { setMode('redeemCode'); setCurrentStep(1); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                mode === 'redeemCode' ? 'bg-white text-purple-600' : 'text-white/70 hover:text-white'
              }`}
            >
              兑换码
            </button>
          </div>
        </div>
      </div>
      
      {/* 步骤导航 */}
      <div className="flex border-b border-gray-700">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              currentStep === step.id
                ? 'bg-blue-600 text-white'
                : currentStep > step.id
                ? 'bg-gray-700 text-green-400'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{step.icon}</span>
            {step.name}
          </button>
        ))}
      </div>
      
      {/* 内容区域 */}
      <div className="p-6 min-h-[400px]">
        {/* ========== SDK 模式步骤 ========== */}
        
        {/* Step 1: 基础信息 (SDK模式) */}
        {mode === 'sdk' && currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">📝 基础信息</h3>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">游戏ID *</label>
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="my_awesome_game"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">使用小写字母、数字和下划线</p>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">游戏名称 *</label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="我的游戏"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">版本号</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">游戏描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要描述你的游戏..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        )}
        
        {/* ========== 兑换码模式步骤 ========== */}
        
        {/* Step 1: 基础信息 (兑换码模式) */}
        {mode === 'redeemCode' && currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">📝 基础信息</h3>
            
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg mb-4">
              <p className="text-sm text-purple-300">
                💡 <strong>兑换码模式</strong>：游戏方无需修改代码，只需在游戏内提供兑换入口，
                玩家购买兑换码后在游戏内输入即可获得道具。
              </p>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">游戏ID *</label>
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="my_awesome_game"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">用于标识你的游戏，生成兑换码时会用到</p>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">游戏名称 *</label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="我的游戏"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        )}
        
        {/* Step 2: 托管道具 (兑换码模式) */}
        {mode === 'redeemCode' && currentStep === 2 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">🎁 托管道具</h3>
            <p className="text-gray-400 text-sm mb-4">
              配置要在平台上销售的道具，每个道具会生成对应数量的兑换码
            </p>
            
            <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
              {redeemItems.map((item, index) => (
                <div key={item.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateRedeemItem(index, { name: e.target.value })}
                      placeholder="道具名称"
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => handleRemoveRedeemItem(index)}
                      className="text-red-400 hover:text-red-300 px-2"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateRedeemItem(index, { description: e.target.value })}
                    placeholder="道具描述"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm mb-2"
                  />
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">价格 (ACoin)</label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleUpdateRedeemItem(index, { price: parseInt(e.target.value) || 0 })}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">库存数量</label>
                      <input
                        type="number"
                        value={item.inventory}
                        onChange={(e) => handleUpdateRedeemItem(index, { inventory: parseInt(e.target.value) || 0 })}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">游戏内ID</label>
                      <input
                        type="text"
                        value={item.gameItemId}
                        onChange={(e) => handleUpdateRedeemItem(index, { gameItemId: e.target.value })}
                        placeholder="如：health_potion"
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div>
                      <label className="text-xs text-gray-500">游戏内数量</label>
                      <input
                        type="number"
                        value={item.gameQuantity}
                        onChange={(e) => handleUpdateRedeemItem(index, { gameQuantity: parseInt(e.target.value) || 1 })}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">兑换码前缀</label>
                      <input
                        type="text"
                        value={item.codePrefix}
                        onChange={(e) => handleUpdateRedeemItem(index, { codePrefix: e.target.value })}
                        placeholder="如：HP-"
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">码长度</label>
                      <input
                        type="number"
                        value={item.codeLength}
                        onChange={(e) => handleUpdateRedeemItem(index, { codeLength: parseInt(e.target.value) || 8 })}
                        min="6"
                        max="20"
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleAddRedeemItem}
              className="w-full py-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors"
            >
              + 添加道具
            </button>
          </div>
        )}
        
        {/* Step 3: 生成兑换码 (兑换码模式) */}
        {mode === 'redeemCode' && currentStep === 3 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">✨ 生成兑换码</h3>
            
            {createdHostedItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎫</div>
                <p className="text-gray-400 mb-2">准备生成 {redeemItems.length} 个道具的兑换码</p>
                <p className="text-sm text-gray-500 mb-4">
                  共 {redeemItems.reduce((sum, i) => sum + i.inventory, 0)} 个兑换码将被创建
                </p>
                <button
                  onClick={handleCreateRedeemItems}
                  disabled={isCreatingItems || !gameId}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingItems ? '⏳ 生成中...' : '✨ 一键生成兑换码'}
                </button>
                {!gameId && (
                  <p className="text-red-400 text-sm mt-2">请先设置游戏ID</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-green-500/20 text-green-400">
                  <div className="font-medium">✅ 兑换码生成成功</div>
                </div>
                
                <div className="space-y-2">
                  {createdHostedItems.map(item => (
                    <div key={item.id} className="p-3 bg-gray-800 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-400 text-sm ml-2">
                          {item.inventory.total} 个兑换码
                        </span>
                      </div>
                      <span className="text-green-400 text-sm">已创建</span>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <h4 className="font-medium text-purple-300 mb-2">下一步</h4>
                  <ol className="text-sm text-purple-200 space-y-1 list-decimal list-inside">
                    <li>在发布中心发布你的游戏</li>
                    <li>在游戏内添加兑换码输入入口</li>
                    <li>调用平台API验证和兑换码</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Step 2: 功能选择 */}
        {currentStep === 2 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">⚙️ 功能选择</h3>
            <p className="text-gray-400 text-sm mb-4">勾选需要启用的功能模块</p>
            
            <div className="space-y-3">
              {[
                { key: 'wallet', name: '💰 钱包系统', desc: '管理游戏内货币余额' },
                { key: 'store', name: '🛒 商店系统', desc: '出售商品和道具', dependsOn: 'wallet' },
                { key: 'inventory', name: '🎒 库存同步', desc: '管理玩家背包物品', dependsOn: 'store' },
                { key: 'leaderboard', name: '🏆 排行榜', desc: '玩家排名系统' },
                { key: 'achievements', name: '🎯 成就系统', desc: '成就和奖励系统' },
              ].map((feature) => (
                <label
                  key={feature.key}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                    features[feature.key as keyof typeof features]
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={features[feature.key as keyof typeof features]}
                    onChange={() => handleFeatureToggle(feature.key as keyof typeof features)}
                    className="mt-1 mr-3 w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{feature.name}</div>
                    <div className="text-sm text-gray-400">{feature.desc}</div>
                    {'dependsOn' in feature && (
                      <div className="text-xs text-gray-500 mt-1">
                        依赖: {feature.dependsOn === 'wallet' ? '钱包系统' : feature.dependsOn === 'store' ? '商店系统' : ''}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
        
        {/* Step 3: 货币设置 */}
        {currentStep === 3 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">💰 货币设置</h3>
            
            <div className="space-y-3 mb-4">
              {currencies.map((currency, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  <input
                    type="checkbox"
                    checked={currency.enabled}
                    onChange={(e) => handleUpdateCurrency(index, { enabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <input
                    type="text"
                    value={currency.id}
                    onChange={(e) => handleUpdateCurrency(index, { id: e.target.value })}
                    placeholder="货币ID"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                  />
                  <input
                    type="text"
                    value={currency.name}
                    onChange={(e) => handleUpdateCurrency(index, { name: e.target.value })}
                    placeholder="显示名称"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                  />
                  <input
                    type="number"
                    value={currency.initialBalance}
                    onChange={(e) => handleUpdateCurrency(index, { initialBalance: parseInt(e.target.value) || 0 })}
                    placeholder="初始值"
                    className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                  />
                  <button
                    onClick={() => handleRemoveCurrency(index)}
                    className="text-red-400 hover:text-red-300 px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleAddCurrency}
              className="w-full py-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
            >
              + 添加货币
            </button>
            
            <div className="mt-4 p-3 bg-gray-800/50 rounded text-sm text-gray-400">
              💡 建议：简单游戏 1 种货币，标准游戏 2-3 种货币（基础货币 + 高级货币 + 系统货币）
            </div>
          </div>
        )}
        
        {/* Step 4: 商品管理 */}
        {currentStep === 4 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">🛍️ 商品管理</h3>
            
            <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
              {products.map((product, index) => (
                <div key={index} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={product.id}
                      onChange={(e) => handleUpdateProduct(index, { id: e.target.value })}
                      placeholder="商品ID"
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                    />
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => handleUpdateProduct(index, { name: e.target.value })}
                      placeholder="商品名称"
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => handleRemoveProduct(index)}
                      className="text-red-400 hover:text-red-300 px-2"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={product.category}
                      onChange={(e) => handleUpdateProduct(index, { category: e.target.value })}
                      placeholder="分类"
                      className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                    />
                    {currencies.filter(c => c.enabled).map(currency => (
                      <div key={currency.id} className="flex items-center">
                        <span className="text-xs text-gray-500 mr-1">{currency.name}:</span>
                        <input
                          type="number"
                          value={product.price[currency.id] || ''}
                          onChange={(e) => handleUpdateProductPrice(index, currency.id, parseInt(e.target.value) || 0)}
                          placeholder="价格"
                          className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                        />
                      </div>
                    ))}
                    <div className="flex items-center ml-auto">
                      <span className="text-xs text-gray-500 mr-1">库存:</span>
                      <input
                        type="number"
                        value={product.stock}
                        onChange={(e) => handleUpdateProduct(index, { stock: parseInt(e.target.value) || 0 })}
                        className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleAddProduct}
              className="w-full py-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
            >
              + 添加商品
            </button>
          </div>
        )}
        
        {/* Step 5: 生成代码 */}
        {currentStep === 5 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">✨ 生成代码</h3>
            
            {!generatedCode ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🚀</div>
                <p className="text-gray-400 mb-4">点击下方按钮生成完整的 Skill 代码</p>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? '⏳ 生成中...' : '✨ 一键生成 Skill 代码'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 验证结果 */}
                {validationResult && (
                  <div className={`p-3 rounded-lg ${validationResult.valid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    <div className="font-medium">
                      {validationResult.valid ? '✅ 配置验证通过' : '⚠️ 配置验证有警告'}
                    </div>
                    {validationResult.warnings.length > 0 && (
                      <ul className="text-sm mt-2 space-y-1">
                        {validationResult.warnings.map((w, i) => (
                          <li key={i}>• {w}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                
                {/* 配置预览 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">📋 配置预览</h4>
                    <button
                      onClick={handleCopyConfig}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      复制配置
                    </button>
                  </div>
                  <pre className="bg-gray-800 p-3 rounded-lg text-xs overflow-auto max-h-32">
                    {generateMarkdownConfig()}
                  </pre>
                </div>
                
                {/* 代码预览 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">📝 生成的代码</h4>
                    <button
                      onClick={handleCopyCode}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      复制代码
                    </button>
                  </div>
                  <pre className="bg-gray-800 p-3 rounded-lg text-xs overflow-auto max-h-64">
                    {generatedCode?.slice(0, 2000)}...
                  </pre>
                </div>
                
                {/* 重新生成 */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-2 border border-gray-600 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors"
                >
                  🔄 重新生成
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 底部导航 */}
      <div className="flex justify-between px-6 py-4 border-t border-gray-700 bg-gray-800">
        <button
          onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
          disabled={currentStep === 1}
          className="px-4 py-2 rounded-lg border border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← 上一步
        </button>
        
        <div className="flex gap-2">
          {currentStep < (mode === 'sdk' ? 5 : 3) && (
            <button
              onClick={() => setCurrentStep(s => Math.min(mode === 'sdk' ? 5 : 3, s + 1))}
              className={`px-4 py-2 rounded-lg text-white hover:opacity-90 ${
                mode === 'sdk' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'
              }`}
            >
              下一步 →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillConfigWizard;

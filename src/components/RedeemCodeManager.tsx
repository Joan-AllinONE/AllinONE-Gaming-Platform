/**
 * 兑换码管理组件
 * 
 * 游戏方使用此组件管理托管道具和兑换码
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Package,
  Plus,
  Copy,
  Download,
  Trash2,
  RefreshCw,
  BarChart3,
  CheckCircle,
  X,
  Coins,
  Tag,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  HostedItem,
  RedeemCode,
  RedeemCodeStatus,
  ItemType,
  CreateHostedItemRequest,
  ItemStatistics,
} from '@/types/redeemCode';
import { redeemCodeService } from '@/services/redeemCodeService';

// ==================== 组件 Props ====================

interface RedeemCodeManagerProps {
  gameId: string;
  gameName?: string;
  className?: string;
  defaultTab?: 'items' | 'codes' | 'stats';
}

// ==================== UI 子组件 ====================

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyles = 'rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2';
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/25',
    secondary: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600',
    outline: 'border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
    ghost: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };
  return (
    <button className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 ${className}`}>
    {children}
  </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ 
  label, className = '', ...props 
}) => (
  <div className="space-y-1">
    {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
    <input
      className={`w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${className}`}
      {...props}
    />
  </div>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ 
  label, children, className = '', ...props 
}) => (
  <div className="space-y-1">
    {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
    <select
      className={`w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' | 'info' }> = ({ 
  children, variant = 'default' 
}) => {
  const variants = {
    default: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
    success: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
    warning: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    error: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
    info: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
  };
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

// ==================== 主组件 ====================

export const RedeemCodeManager: React.FC<RedeemCodeManagerProps> = ({ 
  gameId, 
  gameName,
  className = '',
  defaultTab = 'items'
}) => {
  // 状态
  const [items, setItems] = useState<HostedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HostedItem | null>(null);
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [statistics, setStatistics] = useState<ItemStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'stats'>(defaultTab === 'codes' ? 'items' : defaultTab);

  // 加载数据
  const loadItems = useCallback(() => {
    const data = redeemCodeService.getHostedItems(gameId);
    setItems(data);
  }, [gameId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // 如果 defaultTab 是 'codes' 且已有道具，自动打开第一个道具的兑换码管理
  useEffect(() => {
    if (defaultTab === 'codes' && items.length > 0 && !selectedItem) {
      handleViewCodes(items[0]);
    }
  }, [defaultTab, items]);

  // 创建道具
  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const request: CreateHostedItemRequest = {
      gameId,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as ItemType,
      codeConfig: {
        prefix: formData.get('prefix') as string,
        length: parseInt(formData.get('length') as string) || 8,
        charset: formData.get('charset') as any,
        caseSensitive: formData.get('caseSensitive') === 'on',
        expireDays: parseInt(formData.get('expireDays') as string) || 0,
        singleUse: true,
      },
      initialInventory: parseInt(formData.get('initialInventory') as string) || 100,
      pricing: {
        price: parseFloat(formData.get('price') as string) || 10,
        currency: 'ACOIN',
      },
      gameEffect: {
        itemId: formData.get('gameItemId') as string,
        quantity: parseInt(formData.get('gameQuantity') as string) || 1,
        metadata: {},
      },
    };

    try {
      await redeemCodeService.createHostedItem(request);
      setShowCreateModal(false);
      loadItems();
    } catch (error) {
      console.error('创建道具失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 查看兑换码
  const handleViewCodes = async (item: HostedItem) => {
    setSelectedItem(item);
    setLoading(true);
    
    const itemCodes = redeemCodeService.getCodesByItem(item.id);
    setCodes(itemCodes);
    
    const stats = await redeemCodeService.getItemStatistics(item.id);
    setStatistics(stats);
    
    setShowCodesModal(true);
    setLoading(false);
  };

  // 生成更多兑换码
  const handleGenerateMore = async () => {
    if (!selectedItem) return;
    
    setLoading(true);
    const quantity = parseInt(prompt('请输入要生成的数量:', '50') || '0');
    if (quantity > 0) {
      await redeemCodeService.generateCodes({
        itemId: selectedItem.id,
        gameId,
        quantity,
      });
      await handleViewCodes(selectedItem);
    }
    setLoading(false);
  };

  // 导出兑换码
  const handleExportCodes = () => {
    const unusedCodes = codes.filter(c => c.status === RedeemCodeStatus.UNUSED);
    const content = unusedCodes.map(c => c.code).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedItem?.name}-兑换码-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 删除道具
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('确定要删除这个道具吗？所有关联的兑换码也将被删除。')) return;
    
    await redeemCodeService.deleteHostedItem(itemId);
    loadItems();
  };

  // 复制兑换码
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  // ==================== 渲染 ====================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            兑换码管理
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {gameName || gameId}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          新建道具
        </Button>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">托管道具</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{items.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
              <Tag className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">总兑换码</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {items.reduce((sum, i) => sum + i.inventory.total, 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-500/20 rounded-lg">
              <Coins className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">已售出</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {items.reduce((sum, i) => sum + i.inventory.sold, 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">已兑换</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {items.reduce((sum, i) => sum + i.inventory.used, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 道具列表 */}
      <Card>
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">托管道具列表</h3>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {items.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>还没有托管道具</p>
              <p className="text-sm mt-1">点击上方"新建道具"开始创建</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{item.name}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={item.status === 'active' ? 'success' : 'default'}>
                          {item.status === 'active' ? '在售' : item.status === 'sold_out' ? '售罄' : '下架'}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          库存: {item.inventory.available}/{item.inventory.total}
                        </span>
                        <span className="text-xs text-slate-400">
                          {item.pricing.price} {item.pricing.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewCodes(item)}>
                      管理兑换码
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* 创建道具弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">新建托管道具</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateItem} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input name="name" label="道具名称" placeholder="如：生命药水" required />
                <Select name="type" label="道具类型">
                  <option value={ItemType.CONSUMABLE}>消耗品</option>
                  <option value={ItemType.PERMANENT}>永久道具</option>
                  <option value={ItemType.CURRENCY}>货币</option>
                  <option value={ItemType.BUFF}>增益效果</option>
                  <option value={ItemType.PACKAGE}>礼包</option>
                </Select>
              </div>
              <Input name="description" label="道具描述" placeholder="简要描述道具效果" />
              
              <div className="grid grid-cols-2 gap-4">
                <Input name="price" label="价格 (ACoin)" type="number" min="0" defaultValue="10" />
                <Input name="initialInventory" label="初始库存" type="number" min="1" defaultValue="100" />
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h4 className="font-medium text-slate-900 dark:text-white mb-3">兑换码配置</h4>
                <div className="grid grid-cols-3 gap-4">
                  <Input name="prefix" label="前缀" placeholder="如：HP-" />
                  <Input name="length" label="码长度" type="number" min="6" max="20" defaultValue="8" />
                  <Select name="charset" label="字符集">
                    <option value="alphanumeric">字母数字</option>
                    <option value="numeric">纯数字</option>
                    <option value="alphabetic">纯字母</option>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input name="expireDays" label="过期天数 (0=永不过期)" type="number" min="0" defaultValue="0" />
                  <div className="flex items-center gap-2 pt-6">
                    <input type="checkbox" name="caseSensitive" id="caseSensitive" className="w-4 h-4" />
                    <label htmlFor="caseSensitive" className="text-sm text-slate-700 dark:text-slate-300">区分大小写</label>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h4 className="font-medium text-slate-900 dark:text-white mb-3">游戏内效果配置</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input name="gameItemId" label="游戏内道具ID" placeholder="如：health_potion" required />
                  <Input name="gameQuantity" label="数量" type="number" min="1" defaultValue="1" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  创建道具
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 兑换码管理弹窗 */}
      {showCodesModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedItem.name} - 兑换码管理</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  可用: {selectedItem.inventory.available} | 已售: {selectedItem.inventory.sold} | 已兑换: {selectedItem.inventory.used}
                </p>
              </div>
              <button onClick={() => setShowCodesModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <Button size="sm" onClick={handleGenerateMore}>
                <RefreshCw className="w-4 h-4" />
                生成更多
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportCodes}>
                <Download className="w-4 h-4" />
                导出未使用
              </Button>
            </div>

            <div className="p-4">
              {codes.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  暂无兑换码
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-auto">
                  {codes.slice(0, 100).map(code => (
                    <div key={code.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <code className="font-mono text-sm bg-white dark:bg-slate-800 px-2 py-1 rounded">
                          {code.code}
                        </code>
                        <Badge 
                          variant={
                            code.status === RedeemCodeStatus.UNUSED ? 'default' :
                            code.status === RedeemCodeStatus.SOLD ? 'info' :
                            code.status === RedeemCodeStatus.USED ? 'success' :
                            code.status === RedeemCodeStatus.EXPIRED ? 'warning' : 'error'
                          }
                        >
                          {code.status === RedeemCodeStatus.UNUSED ? '未使用' :
                           code.status === RedeemCodeStatus.SOLD ? '已售出' :
                           code.status === RedeemCodeStatus.USED ? '已兑换' :
                           code.status === RedeemCodeStatus.EXPIRED ? '已过期' : '已禁用'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {code.status === RedeemCodeStatus.UNUSED && (
                          <button 
                            onClick={() => handleCopyCode(code.code)}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-500"
                            title="复制"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        <span className="text-xs text-slate-400">
                          {new Date(code.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {codes.length > 100 && (
                    <p className="text-center text-sm text-slate-500 py-2">
                      还有 {codes.length - 100} 个兑换码...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RedeemCodeManager;

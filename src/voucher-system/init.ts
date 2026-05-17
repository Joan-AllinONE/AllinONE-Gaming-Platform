/**
 * 双轨凭证系统初始化
 * 整合即时发放型凭证系统和计算分配型凭证系统
 */

import { 
  algorithmVoucherService, 
  DataCollector 
} from './services/AlgorithmVoucherService';
import { settlementScheduler } from './settlement/SettlementScheduler';
import { platformDataCollector } from './settlement/PlatformDataCollector';
import { EventBus } from './engine/EventBus';
import type { PlatformDataCollectorConfig } from './settlement/PlatformDataCollector';
import type { SchedulerConfig } from './settlement/SettlementScheduler';

/**
 * 双轨凭证系统配置
 */
export interface DualVoucherSystemConfig {
  /** 是否启用算法凭证系统 */
  enableAlgorithmVouchers: boolean;
  /** 是否启用自动结算调度 */
  enableAutoSettlement: boolean;
  /** 数据收集器配置 */
  dataCollectorConfig?: Partial<PlatformDataCollectorConfig>;
  /** 调度器配置 */
  schedulerConfig?: Partial<SchedulerConfig>;
  /** 自定义数据收集器 */
  customDataCollector?: DataCollector;
}

/**
 * 默认配置
 */
export const DEFAULT_DUAL_VOUCHER_CONFIG: DualVoucherSystemConfig = {
  enableAlgorithmVouchers: true,
  enableAutoSettlement: true,
};

/**
 * 初始化双轨凭证系统
 */
export async function initializeDualVoucherSystem(
  config: Partial<DualVoucherSystemConfig> = {}
): Promise<{
  success: boolean;
  message: string;
  details: {
    algorithmVoucherInitialized: boolean;
    schedulerInitialized: boolean;
    templatesCount: number;
  };
}> {
  const finalConfig = { ...DEFAULT_DUAL_VOUCHER_CONFIG, ...config };
  const eventBus = EventBus.getInstance();
  
  console.log('[DualVoucherSystem] 开始初始化双轨凭证系统...');
  
  let algorithmVoucherInitialized = false;
  let schedulerInitialized = false;
  
  try {
    // 1. 配置数据收集器
    if (finalConfig.dataCollectorConfig) {
      platformDataCollector.updateConfig(finalConfig.dataCollectorConfig);
    }
    
    // 2. 初始化算法凭证服务
    if (finalConfig.enableAlgorithmVouchers) {
      const dataCollector = finalConfig.customDataCollector || platformDataCollector;
      await algorithmVoucherService.initialize(dataCollector);
      algorithmVoucherInitialized = true;
      
      console.log('[DualVoucherSystem] 算法凭证服务初始化完成');
    }
    
    // 3. 初始化结算调度器
    if (finalConfig.enableAutoSettlement && finalConfig.enableAlgorithmVouchers) {
      if (finalConfig.schedulerConfig) {
        settlementScheduler.updateConfig(finalConfig.schedulerConfig);
      }
      await settlementScheduler.initialize();
      schedulerInitialized = true;
      
      console.log('[DualVoucherSystem] 结算调度器初始化完成');
    }
    
    // 4. 订阅事件
    setupEventListeners(eventBus);
    
    // 5. 创建默认模板（如果不存在）
    const templatesCount = await createDefaultTemplates();
    
    console.log('[DualVoucherSystem] 双轨凭证系统初始化完成!');
    
    return {
      success: true,
      message: '双轨凭证系统初始化成功',
      details: {
        algorithmVoucherInitialized,
        schedulerInitialized,
        templatesCount,
      },
    };
    
  } catch (error) {
    console.error('[DualVoucherSystem] 初始化失败:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : '初始化失败',
      details: {
        algorithmVoucherInitialized,
        schedulerInitialized,
        templatesCount: 0,
      },
    };
  }
}

/**
 * 设置事件监听
 */
function setupEventListeners(eventBus: EventBus): void {
  // 监听模板创建事件
  eventBus.subscribe('TEMPLATE_CREATED', (event) => {
    console.log('[DualVoucherSystem] 新模板创建:', event.templateName);
  });
  
  // 监听结算完成事件
  eventBus.subscribe('SETTLEMENT_COMPLETED', (event) => {
    console.log('[DualVoucherSystem] 结算完成:', event.templateName, `#${event.cycleNumber}`);
    
    // 可以在这里添加通知逻辑
    // 例如：发送用户通知、更新统计等
  });
}

/**
 * 创建默认模板
 */
async function createDefaultTemplates(): Promise<number> {
  const existingTemplates = algorithmVoucherService.getTemplates();
  if (existingTemplates.length > 0) {
    return existingTemplates.length;
  }
  
  // 创建A币日结模板
  try {
    algorithmVoucherService.createTemplate(
      {
        name: 'A币日结凭证',
        description: '基于每日贡献度的A币分配凭证，最小面值0.0001 A币',
        minDenomination: 0.0001,
        denominationUnit: 'ACOIN',
        settlementCycle: 'daily',
        settlementTime: '00:00',
        algorithm: {
          weights: {
            gameCoins: 0.5,
            computingPower: 0.3,
            transactionVolume: 0.2,
          },
          formula: 'standard',
          dataCollection: {
            gameCoinsPeriod: 1,
            computingPowerPeriod: 1,
            transactionPeriod: 1,
          },
        },
        poolConfig: {
          source: 'platform_net_income',
          ratio: 0.4,
          minDistributionAmount: 0.0001,
          carryOverEnabled: true,
        },
      },
      'system',
      '系统'
    );
    
    console.log('[DualVoucherSystem] 默认模板 "A币日结凭证" 创建成功');
  } catch (error) {
    console.error('[DualVoucherSystem] 创建默认模板失败:', error);
  }
  
  return algorithmVoucherService.getTemplates().length;
}

/**
 * 关闭双轨凭证系统
 */
export function shutdownDualVoucherSystem(): void {
  console.log('[DualVoucherSystem] 正在关闭双轨凭证系统...');
  
  settlementScheduler.stop();
  
  console.log('[DualVoucherSystem] 双轨凭证系统已关闭');
}

/**
 * 获取系统状态
 */
export function getDualVoucherSystemStatus(): {
  initialized: boolean;
  algorithmVoucherEnabled: boolean;
  autoSettlementEnabled: boolean;
  templates: number;
  scheduledTasks: number;
} {
  return {
    initialized: true,
    algorithmVoucherEnabled: true,
    autoSettlementEnabled: true,
    templates: algorithmVoucherService.getTemplates().length,
    scheduledTasks: settlementScheduler.getStatus().taskCount,
  };
}

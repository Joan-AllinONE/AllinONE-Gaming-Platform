/**
 * 结算调度器
 * 负责自动调度算法凭证的结算周期
 * 支持每日、每周、每月自动结算
 */

import { algorithmVoucherService } from '../services/AlgorithmVoucherService';
import type { 
  AlgorithmVoucherTemplate, 
  SettlementCycleType,
  SettlementStatus 
} from '../types/algorithm';

/**
 * 调度任务
 */
interface ScheduleTask {
  templateId: string;
  intervalId: number;
  nextRunTime: number;
}

/**
 * 调度器配置
 */
export interface SchedulerConfig {
  /** 是否启用自动调度 */
  enabled: boolean;
  /** 检查间隔（毫秒） */
  checkInterval: number;
  /** 是否允许手动触发 */
  allowManualTrigger: boolean;
  /** 执行前等待时间（毫秒） */
  preExecutionDelay: number;
}

/**
 * 默认配置
 */
export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  enabled: true,
  checkInterval: 60000, // 每分钟检查一次
  allowManualTrigger: true,
  preExecutionDelay: 5000, // 5秒延迟
};

/**
 * 结算调度器类
 */
export class SettlementScheduler {
  private static instance: SettlementScheduler;
  private tasks: Map<string, ScheduleTask> = new Map();
  private config: SchedulerConfig;
  private running: boolean = false;
  private mainIntervalId: number | null = null;
  
  private constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...DEFAULT_SCHEDULER_CONFIG, ...config };
  }
  
  static getInstance(config?: Partial<SchedulerConfig>): SettlementScheduler {
    if (!SettlementScheduler.instance) {
      SettlementScheduler.instance = new SettlementScheduler(config);
    }
    return SettlementScheduler.instance;
  }
  
  /**
   * 初始化调度器
   */
  async initialize(): Promise<void> {
    console.log('[SettlementScheduler] 初始化调度器...');
    
    // 加载所有活跃模板并设置调度
    const templates = algorithmVoucherService.getActiveTemplates();
    
    for (const template of templates) {
      this.scheduleTemplate(template);
    }
    
    // 启动主调度循环
    this.startMainLoop();
    
    console.log(`[SettlementScheduler] 初始化完成，已调度 ${this.tasks.size} 个模板`);
  }
  
  /**
   * 启动主调度循环
   */
  private startMainLoop(): void {
    if (this.mainIntervalId !== null) return;
    
    this.running = true;
    
    this.mainIntervalId = window.setInterval(() => {
      this.checkAndExecuteScheduledTasks();
    }, this.config.checkInterval);
    
    console.log('[SettlementScheduler] 主调度循环已启动');
  }
  
  /**
   * 检查并执行调度任务
   */
  private checkAndExecuteScheduledTasks(): void {
    const now = new Date();
    const currentTime = now.getTime();
    
    for (const [templateId, task] of this.tasks.entries()) {
      if (currentTime >= task.nextRunTime) {
        // 执行结算
        this.executeSettlement(templateId);
        
        // 更新下次执行时间
        const template = algorithmVoucherService.getTemplate(templateId);
        if (template) {
          task.nextRunTime = this.calculateNextRunTime(template);
        }
      }
    }
  }
  
  /**
   * 为模板设置调度
   */
  scheduleTemplate(template: AlgorithmVoucherTemplate): void {
    if (!template.isActive) return;
    
    const nextRunTime = this.calculateNextRunTime(template);
    
    const task: ScheduleTask = {
      templateId: template.id,
      intervalId: 0, // 由主循环统一管理
      nextRunTime,
    };
    
    this.tasks.set(template.id, task);
    
    console.log(`[SettlementScheduler] 模板 "${template.name}" 已调度，下次执行: ${new Date(nextRunTime).toLocaleString()}`);
  }
  
  /**
   * 取消模板调度
   */
  unscheduleTemplate(templateId: string): void {
    this.tasks.delete(templateId);
    console.log(`[SettlementScheduler] 模板 ${templateId} 已取消调度`);
  }
  
  /**
   * 计算下次执行时间
   */
  private calculateNextRunTime(template: AlgorithmVoucherTemplate): number {
    const now = new Date();
    const [hours, minutes] = template.settlementTime.split(':').map(Number);
    
    let nextDate: Date;
    
    switch (template.settlementCycle) {
      case 'daily':
        nextDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        if (nextDate.getTime() <= now.getTime()) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;
        
      case 'weekly':
        const dayOfWeek = template.settlementDayOfWeek ?? 0;
        const currentDayOfWeek = now.getDay();
        const daysUntilTarget = (dayOfWeek - currentDayOfWeek + 7) % 7;
        
        nextDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilTarget, hours, minutes);
        if (daysUntilTarget === 0 && nextDate.getTime() <= now.getTime()) {
          nextDate.setDate(nextDate.getDate() + 7);
        }
        break;
        
      case 'monthly':
        const dayOfMonth = Math.min(template.settlementDayOfMonth ?? 1, 28);
        nextDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, hours, minutes);
        
        if (nextDate.getTime() <= now.getTime()) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;
        
      default:
        // 默认每天
        nextDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hours, minutes);
    }
    
    return nextDate.getTime();
  }
  
  /**
   * 执行结算
   */
  private async executeSettlement(templateId: string): Promise<void> {
    try {
      const template = algorithmVoucherService.getTemplate(templateId);
      if (!template) {
        console.warn(`[SettlementScheduler] 模板不存在: ${templateId}`);
        return;
      }
      
      console.log(`[SettlementScheduler] 开始执行模板 "${template.name}" 的结算...`);
      
      // 延迟执行，避免系统高峰期
      await this.delay(this.config.preExecutionDelay);
      
      // 执行结算
      const cycle = await algorithmVoucherService.triggerSettlement(
        templateId,
        undefined, // 使用当前日期
        undefined,
        'scheduler' // 执行者为调度器
      );
      
      console.log(`[SettlementScheduler] 模板 "${template.name}" 结算完成，周期ID: ${cycle.id}`);
      
    } catch (error) {
      console.error(`[SettlementScheduler] 模板 ${templateId} 结算失败:`, error);
    }
  }
  
  /**
   * 延迟工具函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 手动触发结算（如果配置允许）
   */
  async manualTrigger(templateId: string, executedBy: string): Promise<boolean> {
    if (!this.config.allowManualTrigger) {
      console.warn('[SettlementScheduler] 手动触发被禁用');
      return false;
    }
    
    try {
      await algorithmVoucherService.triggerSettlement(
        templateId,
        undefined,
        undefined,
        executedBy
      );
      return true;
    } catch (error) {
      console.error('[SettlementScheduler] 手动触发失败:', error);
      return false;
    }
  }
  
  /**
   * 获取所有调度任务
   */
  getScheduledTasks(): Array<{
    templateId: string;
    templateName: string;
    nextRunTime: number;
    nextRunTimeFormatted: string;
  }> {
    const result = [];
    
    for (const [templateId, task] of this.tasks.entries()) {
      const template = algorithmVoucherService.getTemplate(templateId);
      if (template) {
        result.push({
          templateId,
          templateName: template.name,
          nextRunTime: task.nextRunTime,
          nextRunTimeFormatted: new Date(task.nextRunTime).toLocaleString(),
        });
      }
    }
    
    return result.sort((a, b) => a.nextRunTime - b.nextRunTime);
  }
  
  /**
   * 获取调度器状态
   */
  getStatus(): {
    running: boolean;
    config: SchedulerConfig;
    taskCount: number;
    tasks: Array<{
      templateId: string;
      templateName: string;
      nextRunTime: number;
    }>;
  } {
    return {
      running: this.running,
      config: this.config,
      taskCount: this.tasks.size,
      tasks: this.getScheduledTasks(),
    };
  }
  
  /**
   * 停止调度器
   */
  stop(): void {
    if (this.mainIntervalId !== null) {
      clearInterval(this.mainIntervalId);
      this.mainIntervalId = null;
    }
    this.running = false;
    this.tasks.clear();
    console.log('[SettlementScheduler] 调度器已停止');
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...config };
    
    // 如果检查间隔改变，需要重启主循环
    if (config.checkInterval !== undefined && this.running) {
      this.stop();
      this.startMainLoop();
    }
    
    console.log('[SettlementScheduler] 配置已更新', this.config);
  }
  
  /**
   * 立即检查是否需要执行结算（用于测试或紧急触发）
   */
  async checkNow(): Promise<void> {
    this.checkAndExecuteScheduledTasks();
  }
}

// 导出单例
export const settlementScheduler = SettlementScheduler.getInstance();

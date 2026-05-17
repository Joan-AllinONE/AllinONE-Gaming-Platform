/**
 * AllinONE OpenGames Protocol - Schema Registry
 *
 * 标准化接口定义中心：
 * - 每种扩展场景注册一套 Schema（武器、商店、任务...）
 * - 检查游戏对特定 Schema 的兼容性
 * - 跨游戏 Schema 数据适配（游戏A → 游戏B）
 * - 提供示例数据供 AI 生成参考
 */

import type { ExtensionSchema, JSONSchema } from './ProtocolChannel';

// ==================== 内部类型 ====================

interface SchemaRegistration {
  schema: ExtensionSchema;
  registeredAt: number;
  /** 实现了此 Schema 的游戏列表 */
  compatibleGames: Set<string>;
}

interface AdapterResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  adaptedSchemaName?: string;
}

// ==================== SchemaRegistry 类 ====================

export class SchemaRegistry {
  private schemas: Map<string, SchemaRegistration> = new Map();
  private gameCapabilities: Map<string, Set<string>> = new Map();  // gameId → Set<schemaName>

  constructor() {
    this.registerBuiltinSchemas();
  }

  // ==================== Schema 管理 ====================

  /**
   * 注册扩展 Schema
   */
  registerSchema(schema: ExtensionSchema): void {
    const key = schema.name;

    if (this.schemas.has(key)) {
      console.warn(`[SchemaRegistry] Schema "${key}" 已存在，将被覆盖`);
    }

    this.schemas.set(key, {
      schema,
      registeredAt: Date.now(),
      compatibleGames: new Set(),
    });

    console.log(`[SchemaRegistry] Schema 已注册: "${key}" v${schema.version}`);
  }

  /**
   * 获取 Schema 定义
   */
  getSchema(name: string): ExtensionSchema | undefined {
    return this.schemas.get(name)?.schema;
  }

  /**
   * 获取所有已注册的 Schema
   */
  getAllSchemas(): ExtensionSchema[] {
    return Array.from(this.schemas.values()).map(r => r.schema);
  }

  /**
   * 按标签搜索 Schema
   */
  searchSchemasByTag(tag: string): ExtensionSchema[] {
    return this.getAllSchemas().filter(s => s.tags?.includes(tag));
  }

  /**
   * 判断 Schema 是否存在
   */
  hasSchema(name: string): boolean {
    return this.schemas.has(name);
  }

  /**
   * 注销 Schema
   */
  unregisterSchema(name: string): void {
    this.schemas.delete(name);
    console.log(`[SchemaRegistry] Schema 已注销: "${name}"`);
  }

  // ==================== 游戏兼容性 ====================

  /**
   * 声明游戏实现的 Schema
   */
  declareGameCapabilities(gameId: string, schemaNames: string[]): void {
    const capabilities = this.gameCapabilities.get(gameId) || new Set();

    for (const name of schemaNames) {
      capabilities.add(name);
      // 同时记录到 Schema 的兼容游戏列表
      const reg = this.schemas.get(name);
      if (reg) {
        reg.compatibleGames.add(gameId);
      }
    }

    this.gameCapabilities.set(gameId, capabilities);
  }

  /**
   * 检查游戏是否兼容某 Schema
   */
  checkGameCompatibility(gameId: string, schemaName: string): boolean {
    const capabilities = this.gameCapabilities.get(gameId);
    return capabilities?.has(schemaName) ?? false;
  }

  /**
   * 获取兼容某 Schema 的所有游戏
   */
  getCompatibleGames(schemaName: string): string[] {
    const reg = this.schemas.get(schemaName);
    return reg ? Array.from(reg.compatibleGames) : [];
  }

  /**
   * 获取游戏的声明能力
   */
  getGameCapabilities(gameId: string): string[] {
    return Array.from(this.gameCapabilities.get(gameId) || []);
  }

  /**
   * 移除游戏的声明（游戏下架时）
   */
  removeGameCapabilities(gameId: string): void {
    const capabilities = this.gameCapabilities.get(gameId);
    if (capabilities) {
      for (const schemaName of capabilities) {
        const reg = this.schemas.get(schemaName);
        reg?.compatibleGames.delete(gameId);
      }
      this.gameCapabilities.delete(gameId);
    }
  }

  // ==================== 跨游戏适配 ====================

  /**
   * 跨游戏数据适配
   * 将某个 Schema 的数据适配到目标游戏兼容的格式
   */
  adaptForGame<T = any>(
    data: any,
    schemaName: string,
    targetGameId: string
  ): AdapterResult<T> {
    const schema = this.getSchema(schemaName);
    if (!schema) {
      return { success: false, error: `Schema "${schemaName}" 未注册` };
    }

    if (!this.checkGameCompatibility(targetGameId, schemaName)) {
      return {
        success: false,
        error: `游戏 "${targetGameId}" 不兼容 Schema "${schemaName}"`,
      };
    }

    // 查找针对目标游戏的适配器
    if (schema.adapters && schema.adapters[targetGameId]) {
      try {
        const adapted = schema.adapters[targetGameId](data);
        return {
          success: true,
          data: adapted as T,
          adaptedSchemaName: schemaName,
        };
      } catch (error) {
        return {
          success: false,
          error: `适配失败: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    // 没有特定适配器时，直接返回原始数据（假设兼容）
    return {
      success: true,
      data: data as T,
      adaptedSchemaName: schemaName,
    };
  }

  /**
   * 自动适配：查找目标游戏最接 Schema 并转换数据
   */
  autoAdapt<T = any>(
    data: any,
    sourceSchemaName: string,
    targetGameId: string
  ): AdapterResult<T> {
    // 1. 尝试直接适配
    const direct = this.adaptForGame<T>(data, sourceSchemaName, targetGameId);
    if (direct.success) return direct;

    // 2. 查找目标游戏支持的所有 Schema，找数据结构最接近的
    const capabilities = this.getGameCapabilities(targetGameId);
    for (const capSchemaName of capabilities) {
      if (capSchemaName === sourceSchemaName) continue;

      const capSchema = this.getSchema(capSchemaName);
      if (capSchema && this.canAutoConvert(sourceSchemaName, capSchemaName)) {
        return this.adaptForGame<T>(data, capSchemaName, targetGameId);
      }
    }

    return {
      success: false,
      error: `无法自动适配数据到游戏 "${targetGameId}"`,
    };
  }

  /**
   * 校验数据是否符合 Schema 规范
   */
  validateData(schemaName: string, data: any): { valid: boolean; errors: string[] } {
    const schema = this.getSchema(schemaName);
    if (!schema) {
      return { valid: false, errors: [`Schema "${schemaName}" 未注册`] };
    }

    return this.validateAgainstSchema(schema.outputSchema, data, '$');
  }

  // ==================== 内置 Schema ====================

  private registerBuiltinSchemas(): void {
    // 武器 Schema
    this.registerSchema({
      name: 'weapon',
      version: '1.0.0',
      description: '标准武器物品定义',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '武器名称' },
          damage: { type: 'number', description: '伤害值', minimum: 1, maximum: 99999 },
          element: { type: 'string', description: '元素属性', enum: ['火', '水', '雷', '风', '土', '光', '暗'] },
          icon: { type: 'string', description: '图标URL或CSS类名' },
          recipe: {
            type: 'array',
            description: '合成配方',
            items: {
              type: 'object',
              properties: {
                material: { type: 'string', description: '材料名称' },
                quantity: { type: 'number', description: '所需数量', minimum: 1 },
              },
            },
          },
        },
        required: ['name', 'damage'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          damage: { type: 'number' },
          element: { type: 'string' },
          icon: { type: 'string' },
          recipe: { type: 'array' },
          createdAt: { type: 'string' },
        },
      },
      adapters: {},
      examples: [
        {
          name: '烈焰之剑',
          damage: 85,
          element: '火',
          icon: 'fa-fire-sword',
          recipe: [
            { material: '精铁锭', quantity: 5 },
            { material: '火焰精华', quantity: 3 },
          ],
        },
      ],
      tags: ['equipment', 'combat'],
    });

    // 商店 Schema
    this.registerSchema({
      name: 'shop',
      version: '1.0.0',
      description: '标准游戏商店定义',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '商店名称' },
          description: { type: 'string', description: '商店描述' },
          items: {
            type: 'array',
            description: '商品列表',
            items: {
              type: 'object',
              properties: {
                itemName: { type: 'string', description: '商品名称' },
                price: { type: 'number', description: '价格', minimum: 0 },
                currencyType: { type: 'string', description: '货币类型', enum: ['gameCoins', 'diamonds', 'cash'] },
                stock: { type: 'number', description: '库存（-1为无限）' },
              },
            },
          },
        },
        required: ['name', 'items'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          shopId: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          items: { type: 'array' },
          createdAt: { type: 'string' },
        },
      },
      adapters: {},
      examples: [
        {
          name: '铁匠铺',
          description: '出售各种武器和防具',
          items: [
            { itemName: '铁剑', price: 500, currencyType: 'gameCoins', stock: 10 },
            { itemName: '钢盾', price: 800, currencyType: 'gameCoins', stock: 5 },
          ],
        },
      ],
      tags: ['economy', 'ui'],
    });

    // 任务 Schema
    this.registerSchema({
      name: 'quest',
      version: '1.0.0',
      description: '标准任务/挑战定义',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '任务标题' },
          description: { type: 'string', description: '任务描述' },
          objectives: {
            type: 'array',
            description: '任务目标',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', description: '目标类型', enum: ['kill', 'collect', 'reach', 'survive'] },
                target: { type: 'string', description: '目标对象' },
                count: { type: 'number', description: '目标数量', minimum: 1 },
              },
            },
          },
          rewards: {
            type: 'object',
            properties: {
              exp: { type: 'number' },
              gameCoins: { type: 'number' },
              items: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        required: ['title', 'objectives'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          questId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          objectives: { type: 'array' },
          rewards: { type: 'object' },
        },
      },
      adapters: {},
      examples: [
        {
          title: '消灭哥布林',
          description: '森林里的哥布林越来越猖獗了，去消灭它们！',
          objectives: [
            { type: 'kill', target: '哥布林', count: 10 },
          ],
          rewards: { exp: 100, gameCoins: 200 },
        },
      ],
      tags: ['content', 'progression'],
    });
  }

  // ==================== 内部工具 ====================

  /**
   * 递归校验数据是否符合 JSON Schema
   */
  private validateAgainstSchema(
    schema: JSONSchema,
    data: any,
    path: string
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schema || !schema.type) {
      return { valid: true, errors: [] };
    }

    // 检查类型
    if (schema.type === 'object') {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        errors.push(`${path}: 期望 object，实际为 ${typeof data}`);
        return { valid: false, errors };
      }

      // 检查必需字段
      if (schema.required) {
        for (const key of schema.required) {
          if (!(key in data)) {
            errors.push(`${path}.${key}: 缺少必需字段`);
          }
        }
      }

      // 递归检查属性
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (key in data) {
            const result = this.validateAgainstSchema(propSchema, data[key], `${path}.${key}`);
            errors.push(...result.errors);
          }
        }
      }
    } else if (schema.type === 'array') {
      if (!Array.isArray(data)) {
        errors.push(`${path}: 期望 array，实际为 ${typeof data}`);
        return { valid: false, errors };
      }

      if (schema.items) {
        for (let i = 0; i < data.length; i++) {
          const result = this.validateAgainstSchema(schema.items, data[i], `${path}[${i}]`);
          errors.push(...result.errors);
        }
      }
    } else if (schema.type === 'number' || schema.type === 'integer') {
      if (typeof data !== 'number') {
        errors.push(`${path}: 期望 number，实际为 ${typeof data}`);
      } else {
        if (schema.minimum !== undefined && data < schema.minimum) {
          errors.push(`${path}: 值 ${data} 小于最小值 ${schema.minimum}`);
        }
        if (schema.maximum !== undefined && data > schema.maximum) {
          errors.push(`${path}: 值 ${data} 大于最大值 ${schema.maximum}`);
        }
      }
    } else if (schema.type === 'string') {
      if (typeof data !== 'string') {
        errors.push(`${path}: 期望 string，实际为 ${typeof data}`);
      } else {
        if (schema.enum && !schema.enum.includes(data)) {
          errors.push(`${path}: "${data}" 不在允许值 [${schema.enum.join(', ')}] 中`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * 判断两个 Schema 是否可以自动转换
   */
  private canAutoConvert(from: string, to: string): boolean {
    const fromSchema = this.getSchema(from);
    const toSchema = this.getSchema(to);

    if (!fromSchema || !toSchema) return false;

    // 检查输出结构与输入结构是否兼容（简化版）
    const fromProps = Object.keys(fromSchema.outputSchema.properties || {});
    const toInputProps = Object.keys(toSchema.inputSchema.properties || {});

    // 如果目标输入包含大部分源输出的字段，认为是兼容的
    const common = fromProps.filter(p => toInputProps.includes(p));
    return common.length >= Math.min(fromProps.length, toInputProps.length) * 0.5;
  }
}

// ==================== 单例导出 ====================

let defaultRegistry: SchemaRegistry | null = null;

export function getDefaultRegistry(): SchemaRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new SchemaRegistry();
  }
  return defaultRegistry;
}

export function resetDefaultRegistry(): void {
  defaultRegistry = null;
}

export const schemaRegistry = getDefaultRegistry();

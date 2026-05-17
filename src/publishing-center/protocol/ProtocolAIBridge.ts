/**
 * AllinONE OpenGames Protocol - AI 桥梁
 *
 * AI 桥梁是协议层的"大脑"，负责将玩家的自然语言意图
 * 翻译为符合 Schema 的结构化数据，并打包为扩展凭证。
 *
 * 核心流程：
 * 1. 接收玩家意图（自然语言）
 * 2. 检查目标游戏支持的 Schema
 * 3. 找到最匹配的 Schema 定义
 * 4. AI 分析玩家意图并填充 Schema 字段
 * 5. 生成符合 Schema 的 JSON 配置
 * 6. 打包为平台扩展凭证 (ExtensionVoucher)
 * 7. 下发给游戏执行
 *
 * 注意：此模块的 AI 调用部分整合了项目中已有的
 * GameCodeAnalyzer 的 AI 能力，避免重复造轮子。
 */

import { SchemaRegistry, getDefaultRegistry } from './SchemaRegistry';
import { ExtensionVoucherService } from './ExtensionVoucher';
import type { ExtensionSchema, GameProtocolConfig } from './ProtocolChannel';

// ==================== 类型定义 ====================

export interface PlayerIntent {
  /** 玩家原始输入 */
  rawInput: string;
  /** 目标游戏 ID */
  targetGameId: string;
  /** 可选的目标 Schema */
  preferredSchema?: string;
  /** 附加上下文 */
  context?: Record<string, any>;
}

export interface AIBridgeResult {
  success: boolean;
  voucher?: {
    id: string;
    schemaName: string;
    data: any;
  };
  /** AI 需要向玩家追问的问题 */
  questions?: string[];
  /** 建议的 Schema */
  suggestedSchema?: string;
  error?: string;
  /** AI 的分析过程 */
  reasoning?: string;
}

export interface AIBridgeConfig {
  /** Schema 注册中心 */
  schemaRegistry?: SchemaRegistry;
  /** AI 模型调用函数 */
  aiModel?: {
    generateText: (prompt: string, options?: any) => Promise<string>;
  };
  /** 是否启用调试 */
  debug?: boolean;
}

// ==================== ProtocolAIBridge 类 ====================

export class ProtocolAIBridge {
  private schemaRegistry: SchemaRegistry;
  private config: AIBridgeConfig;

  constructor(config: AIBridgeConfig = {}) {
    this.config = {
      schemaRegistry: config.schemaRegistry || getDefaultRegistry(),
      aiModel: config.aiModel,
      debug: config.debug || false,
    };
    this.schemaRegistry = this.config.schemaRegistry!;
  }

  /**
   * 处理玩家意图 —— AI 桥梁的核心入口
   *
   * 完整流程：
   * 1. 解析玩家意图中的目标游戏和目标 Schema
   * 2. 获取 Schema 定义
   * 3. 检查缺失字段 → 生成追问问题
   * 4. AI 生成符合 Schema 的数据
   * 5. 校验数据合法性
   * 6. 打包为扩展凭证
   */
  async processPlayerIntent(intent: PlayerIntent): Promise<AIBridgeResult> {
    this.log('处理玩家意图:', intent.rawInput);

    try {
      // Step 1: 确定目标 Schema
      const schemaResult = this.resolveSchema(intent);
      if (!schemaResult.schema) {
        return {
          success: false,
          error: schemaResult.error || '没有找到匹配的 Schema',
          suggestedSchema: schemaResult.suggestedSchema,
          questions: schemaResult.questions,
        };
      }

      const { schema, schemaName } = schemaResult;

      // Step 2: 分析意图提取结构
      const analysis = await this.analyzeIntent(intent.rawInput, schema, schemaName);
      if (!analysis.success) {
        return {
          success: false,
          error: analysis.error,
          questions: analysis.questions,
          suggestedSchema: schemaName,
          reasoning: analysis.reasoning,
        };
      }

      // Step 3: 校验数据
      const validation = this.schemaRegistry.validateData(schemaName, analysis.data!);
      if (!validation.valid) {
        return {
          success: false,
          error: `数据校验失败: ${validation.errors.join('; ')}`,
          questions: validation.errors.map(e =>
            `请检查 "${e}" 相关的信息`
          ),
          suggestedSchema: schemaName,
          reasoning: analysis.reasoning,
        };
      }

      // Step 4: 打包为凭证
      const signature = ExtensionVoucherService.sign(analysis.data!);
      const voucher = ExtensionVoucherService.create({
        schemaName,
        sourceGameId: intent.targetGameId,
        targetGameId: intent.targetGameId,
        data: analysis.data!,
        signature,
        expiresIn: 30 * 24 * 60 * 60 * 1000, // 30 天有效
      });

      this.log('扩展凭证已创建:', voucher.id, 'for schema:', schemaName);

      return {
        success: true,
        voucher: {
          id: voucher.id,
          schemaName,
          data: analysis.data,
        },
        reasoning: analysis.reasoning,
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 桥梁处理失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  // ==================== Schema 解析 ====================

  private resolveSchema(intent: PlayerIntent): {
    schema?: ExtensionSchema;
    schemaName?: string;
    error?: string;
    questions?: string[];
    suggestedSchema?: string;
  } {
    // 如果玩家指定了优先 Schema
    if (intent.preferredSchema) {
      const schema = this.schemaRegistry.getSchema(intent.preferredSchema);
      if (schema) {
        return { schema, schemaName: intent.preferredSchema };
      }
      return {
        error: `指定的 Schema "${intent.preferredSchema}" 不存在`,
        suggestedSchema: intent.preferredSchema,
      };
    }

    // 检查目标游戏支持哪些 Schema
    const capabilities = this.schemaRegistry.getGameCapabilities(intent.targetGameId);
    if (capabilities.length === 0) {
      // 检查内置 Schema（Mode A 游戏默认全部兼容）
      const allSchemas = this.schemaRegistry.getAllSchemas();
      if (allSchemas.length === 0) {
        return { error: '没有可用的 Schema 定义' };
      }
      // 内置 Schema 都可用
      const guessed = this.guessSchemaFromIntent(intent.rawInput, allSchemas);
      if (guessed) {
        return { schema: guessed.schema, schemaName: guessed.schemaName };
      }
      // 提示玩家选择
      return {
        questions: [
          `你想创建什么？可用的模板：${allSchemas.map(s => s.name).join('、')}`,
          ...allSchemas.map(s => `- ${s.name}: ${s.description}`),
        ],
        suggestedSchema: allSchemas[0].name,
      };
    }

    // 遍历游戏支持的 Schema 找匹配
    const schemas: Array<{ schema: ExtensionSchema; name: string }> = [];
    for (const name of capabilities) {
      const schema = this.schemaRegistry.getSchema(name);
      if (schema) {
        schemas.push({ schema, name });
      }
    }

    if (schemas.length === 0) {
      return { error: '目标游戏暂未实现任何扩展 Schema' };
    }

    // 根据玩家意图猜测
    const guessed = this.guessSchemaFromIntent(
      intent.rawInput,
      schemas.map(s => ({ schema: s.schema, schemaName: s.name }))
    );

    if (guessed) return guessed;

    // 无法确认，需要向玩家追问
    return {
      questions: [
        `你想创建哪种类型的内容？游戏 "${intent.targetGameId}" 支持：`,
        ...schemas.map(s => `- ${s.name}: ${s.schema.description}`),
      ],
      suggestedSchema: schemas[0].name,
    };
  }

  /**
   * 根据玩家意图关键词猜测目标 Schema
   */
  private guessSchemaFromIntent(
    input: string,
    available: Array<{ schema: ExtensionSchema; schemaName: string }>
  ): { schema: ExtensionSchema; schemaName: string } | null {
    const lower = input.toLowerCase();

    // 关键词映射
    const keywordMap: Record<string, string[]> = {
      weapon: ['武器', '剑', '刀', '斧', '弓', '枪', '装备', 'weapon', 'sword', 'bow', 'axe'],
      shop: ['商店', '店', 'shop', 'store', 'market', '出售', '购买'],
      quest: ['任务', 'quest', 'mission', '挑战', '目标', '委托'],
    };

    for (const { schema, schemaName } of available) {
      const keywords = keywordMap[schemaName] || [];
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          return { schema, schemaName };
        }
      }
    }

    return null;
  }

  // ==================== AI 意图分析 ====================

  /**
   * 使用 AI 分析玩家意图并填充 Schema
   *
   * 如果配置了 AI 模型，使用 LLM 进行结构化生成；
   * 否则回退到模板匹配。
   */
  private async analyzeIntent(
    input: string,
    schema: ExtensionSchema,
    schemaName: string
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    questions?: string[];
    reasoning?: string;
  }> {
    // 尝试用 AI 模型
    if (this.config.aiModel) {
      return this.analyzeWithAI(input, schema, schemaName);
    }

    // 回退：用 Schema 的示例数据 + 关键词填充
    return this.analyzeWithTemplate(input, schema, schemaName);
  }

  /**
   * AI 驱动分析
   */
  private async analyzeWithAI(
    input: string,
    schema: ExtensionSchema,
    schemaName: string
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    questions?: string[];
    reasoning?: string;
  }> {
    const prompt = this.buildAIPrompt(input, schema, schemaName);

    try {
      const result = await this.config.aiModel!.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 2048,
      });

      const parsed = this.parseAIResult(result);
      if (!parsed) {
        return {
          success: false,
          error: 'AI 输出格式异常，无法解析',
          questions: ['请用更明确的方式描述你想要的', schema.inputSchema.required?.length
            ? `需要提供: ${schema.inputSchema.required.join(', ')}`
            : undefined,
          ].filter(Boolean) as string[],
        };
      }

      // 检查缺失字段
      const missing = this.findMissingFields(parsed.data, schema);
      if (missing.length > 0) {
        return {
          success: false,
          error: '缺少必要信息',
          questions: missing.map(f =>
            `请提供"${f}"（${schema.inputSchema.properties?.[f]?.description || f}）`
          ),
          reasoning: parsed.reasoning,
        };
      }

      return {
        success: true,
        data: parsed.data,
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      return {
        success: false,
        error: `AI 调用失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * 模板回退分析
   */
  private async analyzeWithTemplate(
    input: string,
    schema: ExtensionSchema,
    _schemaName: string
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    questions?: string[];
    reasoning?: string;
  }> {
    const lower = input.toLowerCase();
    const example = schema.examples?.[0];

    // 从玩家输入中提取基本信息
    const data: any = {};

    // 尝试从输入中提取名称
    const nameMatch = input.match(/(?:叫|名为|叫做|名称|name)(?:\s*[:：])?\s*["""']?([^""""'\s，。]+)/);
    if (nameMatch) {
      data.name = nameMatch[1];
    }

    // 尝试提取数字
    const numMatches = input.match(/(\d+)/g);
    if (schema.inputSchema.properties?.damage && numMatches) {
      data.damage = Math.min(parseInt(numMatches[0]), 99999);
    }

    // 尝试提取元素关键词
    const elementMap: Record<string, string> = {
      '火': '火', '炎': '火', '烈焰': '火',
      '水': '水', '冰': '水', '霜': '水',
      '雷': '雷', '电': '雷', '闪电': '雷',
      '风': '风',
      '土': '土', '地': '土',
      '光': '光', '圣': '光',
      '暗': '暗', '黑': '暗', '影': '暗',
    };
    for (const [key, val] of Object.entries(elementMap)) {
      if (lower.includes(key)) {
        data.element = val;
        break;
      }
    }

    // 检查缺失字段
    const missing = this.findMissingFields(data, schema);

    if (missing.length > 0) {
      // 使用示例补充
      if (example) {
        for (const key of missing) {
          if (example[key] !== undefined && data[key] === undefined) {
            data[key] = example[key];
          }
        }
      }

      // 再次检查
      const stillMissing = this.findMissingFields(data, schema);
      if (stillMissing.length > 0) {
        return {
          success: false,
          data,
          error: '信息不完整，请补充',
          questions: stillMissing.map(f => {
            const prop = schema.inputSchema.properties?.[f];
            return prop
              ? `请提供"${f}"（${prop.description || f}${prop.enum ? `, 可选值: ${prop.enum.join('/')}` : ''}）`
              : `请提供"${f}"`;
          }),
          reasoning: `基于关键词提取，缺失字段: ${stillMissing.join(', ')}`,
        };
      }
    }

    return {
      success: true,
      data,
      reasoning: `模板填充: 从输入 "${input}" 中提取了 ${Object.keys(data).length} 个字段`,
    };
  }

  // ==================== 辅助方法 ====================

  /**
   * 构建 AI 提示词
   */
  private buildAIPrompt(input: string, schema: ExtensionSchema, _schemaName: string): string {
    const requiredFields = schema.inputSchema.required || [];
    const properties = schema.inputSchema.properties || {};

    let fieldsDesc = requiredFields.map(f => {
      const p = properties[f];
      if (!p) return `- ${f}: (无详细定义)`;
      let desc = `- ${f}: ${p.description || ''}`;
      if (p.type) desc += ` (类型: ${p.type})`;
      if (p.enum) desc += ` [可选: ${p.enum.join(', ')}]`;
      if (p.minimum !== undefined) desc += ` 最小值: ${p.minimum}`;
      if (p.maximum !== undefined) desc += ` 最大值: ${p.maximum}`;
      return desc;
    }).join('\n');

    const examples = schema.examples?.length
      ? `\n参考示例:\n${JSON.stringify(schema.examples[0], null, 2)}`
      : '';

    return `你是一个游戏内容生成助手。请根据玩家的需求，生成一个符合以下 Schema 的 JSON 数据。

目标 Schema: "${schema.name}"
描述: ${schema.description}

必需字段:
${fieldsDesc}${examples}

玩家需求: "${input}"

请严格按照以下 JSON 格式返回（不要包含其他内容）:
{
  "data": { ... 符合 Schema 的JSON },
  "reasoning": "简要解释你的分析过程"
}`;
  }

  /**
   * 解析 AI 返回结果
   */
  private parseAIResult(result: string): { data: any; reasoning: string } | null {
    try {
      // 尝试提取 JSON
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        data: parsed.data || parsed,
        reasoning: parsed.reasoning || 'AI 生成',
      };
    } catch {
      return null;
    }
  }

  /**
   * 查找 Schema 必需但数据中缺失的字段
   */
  private findMissingFields(data: any, schema: ExtensionSchema): string[] {
    const required = schema.inputSchema.required || [];
    return required.filter(f => data[f] === undefined || data[f] === null || data[f] === '');
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[ProtocolAIBridge]', ...args);
    }
  }
}

export default ProtocolAIBridge;

/**
 * Skill 配置解析器
 * 解析 Markdown/YAML 格式的 Skill 配置文件
 */

import type { SkillConfig, GameFeature, CurrencyConfig, ProductConfig, InventoryConfig } from './types';

export class SkillConfigParser {
  /**
   * 解析 Markdown 格式的配置文件
   */
  static parseMarkdown(content: string): SkillConfig {
    const lines = content.split('\n');
    const config: Partial<SkillConfig> = {
      features: [],
      currencies: [],
      products: [],
    };

    let currentSection: string | null = null;
    let inTable = false;
    let tableHeaders: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 解析标题（游戏基本信息）
      if (line.startsWith('# ')) {
        config.gameName = line.replace('# ', '').trim();
        continue;
      }

      // 解析二级标题（区块）
      if (line.startsWith('## ')) {
        currentSection = line.replace('## ', '').trim();
        inTable = false;
        continue;
      }

      // 解析键值对（如：游戏ID: my-game）
      if (line.includes(':') && !inTable && !line.startsWith('|')) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        if (key && value) {
          this.parseKeyValue(config, key.trim(), value);
        }
        continue;
      }

      // 解析功能开关（复选框）
      if (line.startsWith('- [x]') || line.startsWith('- [X]')) {
        const feature = line.replace('- [x]', '').replace('- [X]', '').trim();
        config.features?.push(this.mapFeature(feature));
        continue;
      }

      // 解析表格
      if (line.startsWith('|')) {
        if (!inTable) {
          // 表头行
          tableHeaders = line.split('|').map(h => h.trim()).filter(Boolean);
          inTable = true;
        } else if (line.includes('---')) {
          // 分隔行，跳过
          continue;
        } else {
          // 数据行
          const cells = line.split('|').map(c => c.trim()).filter(Boolean);
          this.parseTableRow(config, currentSection, tableHeaders, cells);
        }
        continue;
      }

      // 表格结束
      if (inTable && line === '') {
        inTable = false;
      }
    }

    // 设置默认值
    return this.applyDefaults(config as SkillConfig);
  }

  /**
   * 解析 YAML 格式的配置
   */
  static parseYAML(content: string): SkillConfig {
    // 简单 YAML 解析（实际项目中可使用 js-yaml）
    const config: Partial<SkillConfig> = {
      features: [],
      currencies: [],
      products: [],
    };

    const lines = content.split('\n');
    let currentPath: string[] = [];
    let indentLevel = 0;

    for (const line of lines) {
      if (!line.trim() || line.trim().startsWith('#')) continue;

      const indent = line.search(/\S/);
      const trimmedLine = line.trim();

      // 调整路径
      while (currentPath.length > 0 && indent <= indentLevel) {
        currentPath.pop();
      }

      if (trimmedLine.includes(':')) {
        const [key, value] = trimmedLine.split(':').map(s => s.trim());
        
        if (value) {
          // 键值对
          this.setNestedValue(config, [...currentPath, key], value);
        } else {
          // 新对象开始
          currentPath.push(key);
          indentLevel = indent;
        }
      } else if (trimmedLine.startsWith('- ')) {
        // 数组项
        const item = trimmedLine.substring(2);
        const currentArray = this.getNestedValue(config, currentPath) as string[] || [];
        currentArray.push(item);
        this.setNestedValue(config, currentPath, currentArray);
      }
    }

    return this.applyDefaults(config as SkillConfig);
  }

  /**
   * 解析键值对
   */
  private static parseKeyValue(config: Partial<SkillConfig>, key: string, value: string): void {
    const keyMap: Record<string, (v: string) => void> = {
      '游戏ID': (v) => config.gameId = v,
      'gameId': (v) => config.gameId = v,
      '游戏名称': (v) => { config.gameName = v; config.name = v; },
      'name': (v) => { config.gameName = v; config.name = v; },
      '描述': (v) => config.description = v,
      'description': (v) => config.description = v,
      '版本': (v) => config.version = v,
      'version': (v) => config.version = v,
      '接入类型': (v) => config.integrationType = v,
    };

    const handler = keyMap[key];
    if (handler) {
      handler(value);
    }
  }

  /**
   * 解析表格行
   */
  private static parseTableRow(
    config: Partial<SkillConfig>,
    section: string | null,
    headers: string[],
    cells: string[]
  ): void {
    if (cells.length < 2) return;

    const rowData: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowData[header] = cells[index] || '';
    });

    // 货币设置表
    if (section?.includes('货币')) {
      const currency: CurrencyConfig = {
        id: rowData['货币类型'] || rowData['id'] || `currency_${Date.now()}`,
        name: rowData['货币类型'] || rowData['name'] || '未命名货币',
        type: this.mapCurrencyType(rowData['货币类型'] || rowData['type'] || 'coin'),
        initialBalance: parseInt(rowData['初始值'] || rowData['initial'] || '0'),
        enabled: (rowData['启用'] || rowData['enabled'] || '').includes('✅') || 
                 (rowData['启用'] || rowData['enabled'] || '').toLowerCase() === 'true',
      };
      config.currencies?.push(currency);
    }

    // 商品列表表
    if (section?.includes('商品')) {
      const price: Record<string, number> = {};
      const priceStr = rowData['价格'] || rowData['price'] || '0';
      price[this.getDefaultCurrency(config)] = parseInt(priceStr);

      const product: ProductConfig = {
        id: rowData['商品ID'] || rowData['id'] || `product_${Date.now()}`,
        name: rowData['名称'] || rowData['name'] || '未命名商品',
        category: rowData['类型'] || rowData['category'] || 'general',
        price,
        stock: parseInt(rowData['库存'] || rowData['stock'] || '999'),
        description: rowData['描述'] || rowData['description'] || '',
      };
      config.products?.push(product);
    }
  }

  /**
   * 应用默认值
   */
  private static applyDefaults(config: SkillConfig): SkillConfig {
    return {
      gameId: config.gameId || `game_${Date.now()}`,
      gameName: config.gameName || '未命名游戏',
      name: config.name || config.gameName || '未命名游戏',
      description: config.description || '',
      version: config.version || '1.0.0',
      features: config.features || ['wallet'],
      currencies: config.currencies?.length ? config.currencies : [{
        id: 'default_coin',
        name: '游戏币',
        type: 'coin',
        initialBalance: 1000,
        enabled: true,
      }],
      products: config.products || [],
      inventory: config.inventory || {
        enabled: true,
        syncMode: 'realtime',
        maxSlots: 50,
      },
      integrationType: config.integrationType || 'standard',
    };
  }

  /**
   * 映射功能名称
   */
  private static mapFeature(feature: string): GameFeature {
    const featureMap: Record<string, GameFeature> = {
      '钱包系统': 'wallet',
      '商店系统': 'store',
      '库存同步': 'inventory',
      '排行榜': 'leaderboard',
      '成就系统': 'achievements',
      'wallet': 'wallet',
      'store': 'store',
      'inventory': 'inventory',
    };
    return featureMap[feature] || 'custom';
  }

  /**
   * 映射货币类型
   */
  private static mapCurrencyType(type: string): string {
    const typeMap: Record<string, string> = {
      '游戏币': 'coin',
      '金币': 'coin',
      '算力': 'computing',
      'A币': 'aCoin',
      'O币': 'oCoin',
    };
    return typeMap[type] || type || 'coin';
  }

  /**
   * 获取默认货币
   */
  private static getDefaultCurrency(config: Partial<SkillConfig>): string {
    if (config.currencies && config.currencies.length > 0) {
      return config.currencies[0].id;
    }
    return 'default_coin';
  }

  /**
   * 设置嵌套值
   */
  private static setNestedValue(obj: any, path: string[], value: any): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
  }

  /**
   * 获取嵌套值
   */
  private static getNestedValue(obj: any, path: string[]): any {
    let current = obj;
    for (const key of path) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[key];
    }
    return current;
  }
}

export default SkillConfigParser;

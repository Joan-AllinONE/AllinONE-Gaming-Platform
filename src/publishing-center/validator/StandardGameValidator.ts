/**
 * AllinONE 标准游戏验证器
 * 
 * 执行五项检查：
 * 1. 目录结构检查 - 是否符合标准目录结构
 * 2. 配置文件检查 - allinone.config.json 是否有效
 * 3. 代码规范检查 - 是否使用标准SDK
 * 4. 安全性检查 - 无恶意代码
 * 5. 性能检查 - 资源大小、加载性能
 */

import {
  GameType,
  GameAnalysisResult,
  StandardGameConfig,
  ValidationStatus,
  ValidationResult,
  StandardValidationReport,
  UploadedFile,
} from '../types';

// ==================== 验证配置 ====================

interface ValidationRule {
  id: string;
  name: string;
  check: (files: UploadedFile[], analysis: GameAnalysisResult, config?: StandardGameConfig) => Promise<ValidationResult>;
}

// ==================== 标准目录结构 ====================

const STANDARD_DIRECTORIES = ['src', 'public', 'assets'];
const REQUIRED_FILES = ['allinone.config.json'];
const STANDARD_ENTRY_POINTS = ['src/main.ts', 'src/main.js', 'src/index.ts', 'src/index.js'];

// ==================== StandardGameValidator 类 ====================

export class StandardGameValidator {
  private rules: ValidationRule[];

  constructor() {
    this.rules = this.createRules();
  }

  /**
   * 验证游戏是否符合AllinONE标准
   */
  async validate(
    files: UploadedFile[],
    analysis: GameAnalysisResult,
    config?: StandardGameConfig
  ): Promise<StandardValidationReport> {
    const checks: ValidationResult[] = [];
    let passedChecks = 0;
    let totalScore = 0;

    // 执行所有验证规则
    for (const rule of this.rules) {
      const result = await rule.check(files, analysis, config);
      checks.push(result);

      if (result.status === ValidationStatus.PASS) {
        passedChecks++;
        totalScore += 20;
      } else if (result.status === ValidationStatus.WARNING) {
        totalScore += 10;
      }
    }

    // 判断是否为标准游戏
    const isStandard = passedChecks >= 4 && analysis.codeMetrics.quality.score >= 60;
    const gameType = isStandard ? GameType.STANDARD : GameType.UNIVERSAL;

    // 计算预计发布时间和费用
    const estimatedPublishTime = isStandard ? 30 : 300; // 秒
    const estimatedCost = isStandard ? 49 : 99; // 元

    // 生成改进建议
    const recommendations = this.generateRecommendations(checks, analysis);

    return {
      isValid: passedChecks >= 3,
      score: Math.min(100, totalScore),
      gameType,
      checks,
      estimatedPublishTime,
      estimatedCost,
      recommendations,
    };
  }

  /**
   * 快速检查是否为标准游戏，并返回协议模式建议
   */
  async quickCheck(files: UploadedFile[]): Promise<{ 
    isStandard: boolean; 
    reason?: string;
    usesStandardSDK?: boolean;
    suggestedProtocolMode?: 'inject' | 'integrated';
  }> {
    // 检测是否使用了 @allinone/standard-sdk → 自动推荐 Mode B
    // 检查所有 JS/TS/HTML 文件（SDK 可能通过 <script> 在 HTML 中引用）
    const usesStandardSDK = files.some(f => {
      if (!f.name.match(/\.(js|ts|tsx|html|htm)$/)) return false;
      try {
        const content = typeof f.content === 'string' 
          ? f.content 
          : new TextDecoder().decode(f.content as any);
        return content.includes('@allinone/standard-sdk') || content.includes('AllinONEGame');
      } catch { return false; }
    });

    // 检查是否存在 allinone.config.json
    const hasConfigFile = files.some(f => 
      f.name === 'allinone.config.json' || f.path.endsWith('allinone.config.json')
    );

    if (!hasConfigFile) {
      return { 
        isStandard: false, 
        reason: '缺少 allinone.config.json 配置文件',
        usesStandardSDK,
        suggestedProtocolMode: usesStandardSDK ? 'integrated' : 'inject',
      };
    }

    // 检查是否有 src 目录
    const hasSrcDir = files.some(f => 
      f.path.includes('/src/') || f.path.startsWith('src/')
    );

    if (!hasSrcDir) {
      return { 
        isStandard: false, 
        reason: '缺少 src 目录',
        usesStandardSDK,
        suggestedProtocolMode: usesStandardSDK ? 'integrated' : 'inject',
      };
    }

    return { 
      isStandard: true,
      usesStandardSDK,
      suggestedProtocolMode: usesStandardSDK ? 'integrated' : 'inject',
    };
  }

  // ==================== 验证规则 ====================

  private createRules(): ValidationRule[] {
    return [
      {
        id: 'directory_structure',
        name: '目录结构检查',
        check: this.checkDirectoryStructure.bind(this),
      },
      {
        id: 'config_file',
        name: '配置文件检查',
        check: this.checkConfigFile.bind(this),
      },
      {
        id: 'code_standards',
        name: '代码规范检查',
        check: this.checkCodeStandards.bind(this),
      },
      {
        id: 'security',
        name: '安全性检查',
        check: this.checkSecurity.bind(this),
      },
      {
        id: 'performance',
        name: '性能检查',
        check: this.checkPerformance.bind(this),
      },
    ];
  }

  // ===== 规则1: 目录结构检查 =====
  private async checkDirectoryStructure(
    files: UploadedFile[],
    analysis: GameAnalysisResult
  ): Promise<ValidationResult> {
    const foundDirs = new Set<string>();
    const filePaths = files.map(f => f.path);

    // 检查标准目录
    for (const dir of STANDARD_DIRECTORIES) {
      if (filePaths.some(p => p.includes(`/${dir}/`) || p.startsWith(`${dir}/`))) {
        foundDirs.add(dir);
      }
    }

    // 检查入口文件
    const hasEntryPoint = STANDARD_ENTRY_POINTS.some(entry => 
      filePaths.some(p => p.endsWith(entry))
    );

    const issues: string[] = [];
    
    if (!foundDirs.has('src')) {
      issues.push('缺少 src 目录');
    }
    
    if (!foundDirs.has('public') && !foundDirs.has('assets')) {
      issues.push('缺少 public 或 assets 资源目录');
    }

    if (!hasEntryPoint) {
      issues.push('未找到标准入口文件 (src/main.ts 或 src/main.js)');
    }

    if (issues.length === 0) {
      return {
        check: '目录结构',
        status: ValidationStatus.PASS,
        message: '目录结构符合AllinONE标准',
        details: { foundDirectories: Array.from(foundDirs) },
      };
    } else if (issues.length <= 1) {
      return {
        check: '目录结构',
        status: ValidationStatus.WARNING,
        message: issues.join(', '),
        details: { foundDirectories: Array.from(foundDirs) },
      };
    } else {
      return {
        check: '目录结构',
        status: ValidationStatus.FAIL,
        message: issues.join(', '),
        details: { foundDirectories: Array.from(foundDirs) },
      };
    }
  }

  // ===== 规则2: 配置文件检查 =====
  private async checkConfigFile(
    files: UploadedFile[],
    analysis: GameAnalysisResult
  ): Promise<ValidationResult> {
    const configFile = files.find(f => 
      f.name === 'allinone.config.json' || f.path.endsWith('allinone.config.json')
    );

    if (!configFile) {
      return {
        check: '配置文件',
        status: ValidationStatus.FAIL,
        message: '缺少 allinone.config.json 配置文件',
      };
    }

    try {
      let content: string;
      if (typeof configFile.content === 'string') {
        content = configFile.content;
      } else {
        content = new TextDecoder().decode(configFile.content);
      }

      const config = JSON.parse(content);

      // 检查必需字段
      const requiredFields = ['game', 'platform', 'skills'];
      const missingFields = requiredFields.filter(f => !(f in config));

      if (missingFields.length > 0) {
        return {
          check: '配置文件',
          status: ValidationStatus.FAIL,
          message: `配置文件缺少必需字段: ${missingFields.join(', ')}`,
          details: { missingFields },
        };
      }

      // 检查 game 字段
      const gameFields = ['id', 'name', 'version'];
      const missingGameFields = gameFields.filter(f => !(f in config.game));

      if (missingGameFields.length > 0) {
        return {
          check: '配置文件',
          status: ValidationStatus.WARNING,
          message: `game 配置缺少字段: ${missingGameFields.join(', ')}`,
          details: { missingGameFields },
        };
      }

      return {
        check: '配置文件',
        status: ValidationStatus.PASS,
        message: '配置文件格式正确',
        details: { gameId: config.game.id },
      };
    } catch (error) {
      return {
        check: '配置文件',
        status: ValidationStatus.FAIL,
        message: '配置文件格式错误，无法解析JSON',
      };
    }
  }

  // ===== 规则3: 代码规范检查 =====
  private async checkCodeStandards(
    files: UploadedFile[],
    analysis: GameAnalysisResult
  ): Promise<ValidationResult> {
    const issues: string[] = [];
    const details: Record<string, any> = {};

    // 检查是否使用TypeScript
    const hasTypeScript = analysis.fileStructure.tsFiles.length > 0;
    details.hasTypeScript = hasTypeScript;

    // 检查代码质量分数
    if (analysis.codeMetrics.quality.score < 50) {
      issues.push(`代码质量分数较低 (${analysis.codeMetrics.quality.score}/100)`);
    }

    // 检查ES6+语法
    // 简化检查：看是否有现代JS语法特征
    const hasModernJS = analysis.codeMetrics.codeLines > 0; // 假设所有代码都是现代JS

    // 检查是否使用标准SDK
    const textFiles = files.filter(f => 
      f.name.endsWith('.ts') || f.name.endsWith('.js') || f.name.endsWith('.tsx') || f.name.endsWith('.jsx') || f.name.endsWith('.html') || f.name.endsWith('.htm')
    );

    let usesStandardSDK = false;
    for (const file of textFiles) {
      let content: string;
      if (typeof file.content === 'string') {
        content = file.content;
      } else {
        content = new TextDecoder().decode(file.content);
      }
      
      if (content.includes('@allinone/standard-sdk') || content.includes('AllinONEGame')) {
        usesStandardSDK = true;
        break;
      }
    }

    details.usesStandardSDK = usesStandardSDK;

    if (!usesStandardSDK) {
      issues.push('未检测到标准SDK (@allinone/standard-sdk) 的使用');
    }

    if (!hasTypeScript) {
      issues.push('建议使用TypeScript以获得更好的开发体验');
    }

    // 根据问题严重程度返回结果
    if (usesStandardSDK && issues.length === 0) {
      return {
        check: '代码规范',
        status: ValidationStatus.PASS,
        message: '代码规范符合AllinONE标准',
        details,
      };
    } else if (usesStandardSDK) {
      return {
        check: '代码规范',
        status: ValidationStatus.WARNING,
        message: issues.join('; '),
        details,
      };
    } else {
      return {
        check: '代码规范',
        status: ValidationStatus.FAIL,
        message: issues.join('; '),
        details,
      };
    }
  }

  // ===== 规则4: 安全性检查 =====
  private async checkSecurity(
    files: UploadedFile[],
    analysis: GameAnalysisResult
  ): Promise<ValidationResult> {
    const issues: string[] = [];
    const suspiciousPatterns = [
      { pattern: /eval\s*\(/, name: 'eval() 函数' },
      { pattern: /document\.write/, name: 'document.write' },
      { pattern: /innerHTML.*\+.*window\./, name: '潜在XSS漏洞' },
    ];

    // 检查可疑代码模式
    for (const file of files) {
      if (!file.name.match(/\.(js|ts|tsx|jsx|html)$/)) continue;

      let content: string;
      try {
        if (typeof file.content === 'string') {
          content = file.content;
        } else {
          content = new TextDecoder().decode(file.content);
        }
      } catch {
        continue;
      }

      for (const { pattern, name } of suspiciousPatterns) {
        if (pattern.test(content)) {
          issues.push(`在 ${file.name} 中发现可疑代码: ${name}`);
        }
      }
    }

    // 检查外部资源引用
    const hasExternalResources = files.some(f => {
      if (!f.name.match(/\.(html|js|ts)$/)) return false;
      try {
        const content = typeof f.content === 'string' 
          ? f.content 
          : new TextDecoder().decode(f.content);
        return /https?:\/\/[^\s"']+/.test(content);
      } catch {
        return false;
      }
    });

    if (issues.length === 0 && !hasExternalResources) {
      return {
        check: '安全性',
        status: ValidationStatus.PASS,
        message: '安全检查通过',
        details: { externalResources: false },
      };
    } else if (issues.length === 0) {
      return {
        check: '安全性',
        status: ValidationStatus.WARNING,
        message: '检测到外部资源引用，请确保来源可信',
        details: { externalResources: true },
      };
    } else {
      return {
        check: '安全性',
        status: ValidationStatus.FAIL,
        message: issues.join('; '),
        details: { issues },
      };
    }
  }

  // ===== 规则5: 性能检查 =====
  private async checkPerformance(
    files: UploadedFile[],
    analysis: GameAnalysisResult
  ): Promise<ValidationResult> {
    const issues: string[] = [];
    const details: Record<string, any> = {};

    // 检查总体大小
    const totalSize = analysis.fileStructure.estimatedSize;
    const totalSizeMB = totalSize / (1024 * 1024);
    details.totalSizeMB = totalSizeMB;

    // 检查资源大小限制
    const maxAssetSize = 10 * 1024 * 1024; // 10MB per file
    const oversizedAssets = files.filter(f => f.size > maxAssetSize);

    if (oversizedAssets.length > 0) {
      issues.push(`${oversizedAssets.length} 个文件超过 10MB 限制`);
      details.oversizedFiles = oversizedAssets.map(f => f.name);
    }

    // 检查加载性能
    if (totalSizeMB > 50) {
      issues.push(`游戏总大小 (${totalSizeMB.toFixed(1)}MB) 超过 50MB 建议值`);
    }

    // 检查代码复杂度
    if (analysis.codeMetrics.complexity > 80) {
      issues.push('代码复杂度过高，可能影响运行性能');
    }

    if (issues.length === 0) {
      return {
        check: '性能',
        status: ValidationStatus.PASS,
        message: `性能检查通过 (总大小: ${totalSizeMB.toFixed(1)}MB)`,
        details,
      };
    } else if (issues.length <= 1 && totalSizeMB <= 100) {
      return {
        check: '性能',
        status: ValidationStatus.WARNING,
        message: issues.join('; '),
        details,
      };
    } else {
      return {
        check: '性能',
        status: ValidationStatus.FAIL,
        message: issues.join('; '),
        details,
      };
    }
  }

  // ==================== 辅助方法 ====================

  private generateRecommendations(checks: ValidationResult[], analysis: GameAnalysisResult): string[] {
    const recommendations: string[] = [];

    // 根据失败的检查生成建议
    const failedChecks = checks.filter(c => c.status === ValidationStatus.FAIL);
    
    for (const check of failedChecks) {
      switch (check.check) {
        case '目录结构':
          recommendations.push('使用 `allinone create` 命令创建标准项目结构');
          recommendations.push('确保项目包含 src/ 和 public/ 目录');
          break;
        case '配置文件':
          recommendations.push('创建 allinone.config.json 配置文件');
          recommendations.push('参考文档配置 game、platform、skills 字段');
          break;
        case '代码规范':
          recommendations.push('安装并使用 @allinone/standard-sdk');
          recommendations.push('迁移代码以使用 AllinONEGame 类');
          break;
        case '安全性':
          recommendations.push('移除 eval() 等危险函数的使用');
          recommendations.push('审查所有外部资源引用的安全性');
          break;
        case '性能':
          recommendations.push('压缩图片和音频资源');
          recommendations.push('使用 CDN 加载大型资源文件');
          break;
      }
    }

    // 通用建议
    if (analysis.codeMetrics.quality.score < 70) {
      recommendations.push('运行 `allinone lint` 检查并修复代码问题');
    }

    return [...new Set(recommendations)];
  }
}

export default StandardGameValidator;

#!/usr/bin/env node
/**
 * Skill 配置生成器测试脚本
 * 
 * 运行方式:
 *   node scripts/test-skill-generator.mjs
 * 
 * 功能:
 *   1. 运行所有自动化测试
 *   2. 执行手动测试用例
 *   3. 生成测试报告
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  console.log('');
  log('='.repeat(60), 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
  console.log('');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️ ${message}`, 'blue');
}

// 运行命令
function runCommand(command, options = {}) {
  try {
    const output = execSync(command, {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error, output: error.stdout || error.message };
  }
}

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(path.join(projectRoot, filePath));
}

// ==================== 测试步骤 ====================

async function runTests() {
  logHeader('Skill 配置生成器 - 测试套件');
  
  const results = {
    environment: false,
    unitTests: false,
    integrationTests: false,
    e2eTests: false,
    fileStructure: false,
    templates: false,
  };

  // Step 1: 环境检查
  logHeader('步骤 1: 环境检查');
  
  logInfo('检查 Node.js 版本...');
  const nodeVersion = process.version;
  log(`Node.js 版本: ${nodeVersion}`);
  
  logInfo('检查 vitest...');
  const vitestCheck = runCommand('npx vitest --version', { silent: true });
  if (vitestCheck.success) {
    logSuccess(`Vitest 已安装: ${vitestCheck.output.trim()}`);
    results.environment = true;
  } else {
    logError('Vitest 未安装，请运行: npm install -D vitest');
  }

  // Step 2: 文件结构检查
  logHeader('步骤 2: 文件结构检查');
  
  const requiredFiles = [
    'src/skills/generator/index.ts',
    'src/skills/generator/types.ts',
    'src/skills/generator/SkillConfigParser.ts',
    'src/skills/generator/SkillCodeGenerator.ts',
    'src/skills/generator/ConfigValidator.ts',
    'src/skills/templates/minimal.skill.md',
    'src/skills/templates/standard.skill.md',
    'src/skills/templates/full.skill.yaml',
  ];
  
  let allFilesExist = true;
  for (const file of requiredFiles) {
    if (fileExists(file)) {
      logSuccess(`✓ ${file}`);
    } else {
      logError(`✗ ${file} 缺失`);
      allFilesExist = false;
    }
  }
  results.fileStructure = allFilesExist;

  // Step 3: 运行单元测试
  logHeader('步骤 3: 运行单元测试');
  
  const unitTestResult = runCommand(
    'npx vitest run src/skills/generator/__tests__/SkillConfigParser.test.ts --reporter=verbose',
    { silent: true }
  );
  
  if (unitTestResult.success) {
    logSuccess('SkillConfigParser 测试通过');
    results.unitTests = true;
  } else {
    logError('SkillConfigParser 测试失败');
    console.log(unitTestResult.output);
  }

  // Step 4: 运行集成测试
  logHeader('步骤 4: 运行集成测试');
  
  const integrationResult = runCommand(
    'npx vitest run src/skills/generator/__tests__/integration.test.ts --reporter=verbose',
    { silent: true }
  );
  
  if (integrationResult.success) {
    logSuccess('集成测试通过');
    results.integrationTests = true;
  } else {
    logError('集成测试失败');
    console.log(integrationResult.output);
  }

  // Step 5: 运行端到端测试
  logHeader('步骤 5: 运行端到端测试');
  
  const e2eResult = runCommand(
    'npx vitest run src/skills/generator/__tests__/e2e.test.ts --reporter=verbose',
    { silent: true }
  );
  
  if (e2eResult.success) {
    logSuccess('端到端测试通过');
    results.e2eTests = true;
  } else {
    logError('端到端测试失败');
    console.log(e2eResult.output);
  }

  // Step 6: 模板文件检查
  logHeader('步骤 6: 模板文件检查');
  
  const templates = [
    { file: 'src/skills/templates/minimal.skill.md', name: '极简模板' },
    { file: 'src/skills/templates/standard.skill.md', name: '标准模板' },
    { file: 'src/skills/templates/full.skill.yaml', name: '完整模板' },
  ];
  
  let allTemplatesValid = true;
  for (const { file, name } of templates) {
    if (fileExists(file)) {
      const content = fs.readFileSync(path.join(projectRoot, file), 'utf-8');
      const hasBasicInfo = content.includes('游戏ID') || content.includes('gameId');
      const hasCurrency = content.includes('货币') || content.includes('currency');
      
      if (hasBasicInfo && hasCurrency) {
        logSuccess(`${name} 有效`);
      } else {
        logWarning(`${name} 可能缺少必要内容`);
        allTemplatesValid = false;
      }
    } else {
      logError(`${name} 文件不存在`);
      allTemplatesValid = false;
    }
  }
  results.templates = allTemplatesValid;

  // Step 7: 手动测试示例
  logHeader('步骤 7: 手动测试示例');
  
  logInfo('创建一个测试配置...');
  const testConfig = `
# Skill 配置 - 测试游戏

## 基础信息
- **游戏ID**: test_game_${Date.now()}
- **游戏名称**: 自动测试游戏

## 功能开关
- [x] 钱包系统
- [x] 商店系统

## 货币设置
| 货币类型 | 启用 | 初始值 |
|---------|:----:|-------:|
| 金币 | ✅ | 1000 |
| 钻石 | ✅ | 100 |

## 商品列表
| 商品ID | 名称 | 价格(金币) |
|--------|------|-----------:|
| test_item | 测试道具 | 50 |
`;

  // 保存测试配置
  const testConfigPath = path.join(projectRoot, 'test-config.skill.md');
  fs.writeFileSync(testConfigPath, testConfig);
  logSuccess('测试配置已保存到: test-config.skill.md');
  
  logInfo('你可以使用此配置在浏览器中测试可视化向导组件');

  // ==================== 测试报告 ====================
  
  logHeader('测试报告');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(v => v).length;
  const failedTests = totalTests - passedTests;
  
  console.log('');
  log(`总测试项: ${totalTests}`, 'bright');
  logSuccess(`通过: ${passedTests}`);
  if (failedTests > 0) {
    logError(`失败: ${failedTests}`);
  }
  console.log('');
  
  // 详细结果
  log('详细结果:', 'bright');
  Object.entries(results).forEach(([name, passed]) => {
    const icon = passed ? '✅' : '❌';
    const status = passed ? '通过' : '失败';
    const color = passed ? 'green' : 'red';
    log(`  ${icon} ${name}: ${status}`, color);
  });
  
  console.log('');
  
  if (failedTests === 0) {
    log('╔════════════════════════════════════════╗', 'green');
    log('║     🎉 所有测试通过！系统正常         ║', 'green');
    log('╚════════════════════════════════════════╝', 'green');
  } else {
    log('╔════════════════════════════════════════╗', 'yellow');
    log('║     ⚠️ 部分测试失败，请检查           ║', 'yellow');
    log('╚════════════════════════════════════════╝', 'yellow');
  }
  
  // 下一步建议
  logHeader('下一步建议');
  
  if (results.environment && results.fileStructure) {
    logInfo('环境准备就绪，可以开始:');
    console.log('  1. 在浏览器中测试 SkillConfigWizard 组件');
    console.log('  2. 使用真实游戏配置进行端到端测试');
    console.log('  3. 运行: npm run dev 启动开发服务器');
  } else {
    logWarning('环境未完全就绪，请先:');
    console.log('  1. 确保所有文件已正确创建');
    console.log('  2. 安装依赖: npm install');
    console.log('  3. 重新运行测试');
  }
  
  console.log('');
  logInfo('详细测试指南请参考: src/skills/generator/TEST_GUIDE.md');
  console.log('');
  
  return failedTests === 0;
}

// 运行测试
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});

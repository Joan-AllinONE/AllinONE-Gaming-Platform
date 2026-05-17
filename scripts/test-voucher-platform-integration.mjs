/**
 * 凭证系统平台集成测试脚本
 * 用于验证凭证系统与游戏平台的集成
 */

import { platformBindingService, voucherService, voucherRuleEngine, GameType, TriggerMode } from '../src/voucher-system/index.ts';

console.log('🧪 凭证系统平台集成测试\n');

// 测试 1: 检查服务是否可用
console.log('📋 测试 1: 检查服务可用性');
console.log('  PlatformBindingService:', typeof platformBindingService !== 'undefined' ? '✅ 可用' : '❌ 不可用');
console.log('  VoucherService:', typeof voucherService !== 'undefined' ? '✅ 可用' : '❌ 不可用');
console.log('  VoucherRuleEngine:', typeof voucherRuleEngine !== 'undefined' ? '✅ 可用' : '❌ 不可用');

// 测试 2: 检查类型定义
console.log('\n📋 测试 2: 检查类型定义');
console.log('  GameType:', typeof GameType !== 'undefined' ? '✅ 可用' : '❌ 不可用');
console.log('  TriggerMode:', typeof TriggerMode !== 'undefined' ? '✅ 可用' : '❌ 不可用');

// 测试 3: 检查预设游戏
console.log('\n📋 测试 3: 检查预设游戏列表');
const games = platformBindingService.getAllGames();
console.log(`  找到 ${games.length} 个游戏:`);
games.forEach(game => {
  console.log(`    - ${game.name} (${game.type})`);
});

// 测试 4: 检查绑定配置
console.log('\n📋 测试 4: 检查绑定配置');
const bindings = platformBindingService.getAllBindings();
console.log(`  当前有 ${bindings.length} 个绑定配置`);
bindings.forEach(binding => {
  console.log(`    - ${binding.gameName} → ${binding.ruleName} [${binding.enabled ? '启用' : '禁用'}]`);
});

// 测试 5: 检查统计信息
console.log('\n📋 测试 5: 检查统计信息');
const stats = platformBindingService.getStats();
console.log('  统计信息:');
console.log(`    - 总绑定数: ${stats.totalBindings}`);
console.log(`    - 活跃绑定数: ${stats.activeBindings}`);
console.log(`    - 总发放次数: ${stats.totalDistributions}`);
console.log(`    - 总发放金额: ${stats.totalAmountDistributed} A币`);

// 测试 6: 检查凭证系统规则
console.log('\n📋 测试 6: 检查凭证系统规则');
const rules = voucherRuleEngine.getAllRules();
console.log(`  当前有 ${rules.length} 个规则`);
rules.forEach(rule => {
  console.log(`    - ${rule.name} (${rule.type})`);
});

console.log('\n✅ 测试完成！');
console.log('\n📖 下一步：');
console.log('  1. 在浏览器中打开 http://localhost:5173/voucher-system');
console.log('  2. 切换到"应用到平台" Tab');
console.log('  3. 创建新的游戏绑定配置');
console.log('  4. 到游戏中心测试奖励发放');

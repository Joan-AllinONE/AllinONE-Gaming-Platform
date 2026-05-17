/**
 * 实际案例演示页面
 *
 * 包含 Zuma 游戏 Mode B 集成案例和 AI Skill 集成规范
 * 为开发者提供完整的学习和参考材料
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, FileCode, HelpCircle, Info, ChevronDown, AlertCircle,
  Lightbulb, Terminal, GitBranch, Zap, Wand2, FileText, ArrowRight,
  Package, CheckCircle, Download, Gamepad2, Sparkles,
} from 'lucide-react';

// ========== Zuma Mode B 测试案例内容组件 ==========
const ZumaDemoContent: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: '案例概述', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'process', title: '完整流程', icon: <FileCode className="w-4 h-4" /> },
    { id: 'faq', title: '常见错误', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const codeSnippets = {
    integration: `(function() {
  'use strict';
  var REDEEM_ITEMS = [
    { itemId: 'difficulty_reducer', effectType: 'difficulty_reducer', name: '🐸 难度降低', desc: '弹珠移动速度减半' },
    { itemId: 'score_boost',       effectType: 'score_boost',       name: '🌟 分数翻倍',  desc: '消除得分翻倍' },
    { itemId: 'extra_life',        effectType: 'extra_life',         name: '❤️ 清除弹珠', desc: '清除路径上 5 颗弹珠' },
    { itemId: 'time_bonus',        effectType: 'time_bonus',         name: '⏱️ 大量清除', desc: '清除路径上 10 颗弹珠' },
  ];
  var g = window.zumaGame;
  if (!g) { console.warn('[AllinONE] zumaGame 未就绪'); return; }
  window.AllinONE = window.AllinONE || {};
  window.AllinONE.__PROTOCOL_MODE__ = 'integrated';
  window.AllinONE.__GAME_ID__ = 'zuma-mode-b-test';
  window.AllinONE.__ITEMS__ = REDEEM_ITEMS;
  window.parent.postMessage({
    type: 'PROTOCOL:READY', protocolVersion: '1.0.0', mode: 'integrated',
    gameId: 'zuma-mode-b-test',
    supportedActions: ['start', 'pause', 'resume'],
    supportedSchemas: REDEEM_ITEMS.map(function(i) { return i.effectType; }),
    timestamp: Date.now(),
  }, '*');
  function applyEffect(itemId) { /* ... */ }
  window.addEventListener('allinone-item-redeemed', function(e) { applyEffect(e.detail.itemId); });
  window.addEventListener('allinone:item-redeemed', function(e) { applyEffect(e.detail.itemId); });
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'REDEEM_RESULT' && event.data.data && event.data.data.success) {
      applyEffect(event.data.data.itemId);
    }
  });
})();`,
  };

  const sectionContent: Record<string, React.ReactNode> = {
    overview: (
      <div className="space-y-6 text-sm text-gray-300">
        <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl">
          <h4 className="text-white font-bold text-base mb-2">🎯 Zuma × AllinONE Mode B 集成案例</h4>
          <p className="leading-relaxed">
            本案例使用开源 Zuma 游戏（源自 CodePen）作为测试对象，完整演示了从引入 AllinONE SDK、
            编写道具兑换逻辑到发布中心验证的全流程。通过本案例，您将理解 Mode B 模式下 SDK
            如何与平台通过 postMessage 协议通信，以及如何实现道具兑换效果。
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-700/20 rounded-xl border border-slate-700/50">
            <div className="text-2xl mb-2">🎮</div>
            <h5 className="text-white font-semibold mb-1">游戏：ZUMA</h5>
            <p className="text-gray-400 text-xs">经典弹珠消除游戏，单文件 HTML+CSS+JS 架构，约 22KB</p>
          </div>
          <div className="p-4 bg-slate-700/20 rounded-xl border border-slate-700/50">
            <div className="text-2xl mb-2">🔧</div>
            <h5 className="text-white font-semibold mb-1">模式：Mode B</h5>
            <p className="text-gray-400 text-xs">标准集成模式，游戏方通过 SDK 自主控制道具效果执行</p>
          </div>
          <div className="p-4 bg-slate-700/20 rounded-xl border border-slate-700/50">
            <div className="text-2xl mb-2">🎁</div>
            <h5 className="text-white font-semibold mb-1">道具：4 种</h5>
            <p className="text-gray-400 text-xs">难度降低、分数翻倍、清除弹珠×5、清除弹珠×10</p>
          </div>
        </div>

        <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
          <h5 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            案例要点
          </h5>
          <ul className="space-y-1.5 text-gray-400">
            <li>• 游戏无需框架，纯原生 JavaScript，适合展示 SDK 集成原理</li>
            <li>• SDK 引用于 HTML 的 &lt;head&gt;，游戏逻辑内联于 &lt;body&gt; 底部</li>
            <li>• 道具兑换通过 CustomEvent 和 postMessage 双向通信</li>
            <li>• 支持发布中心「试玩」功能直接验证效果</li>
            <li>• 完整经历了从失败（404 / SyntaxError / SDK 未检测）到成功的过程</li>
          </ul>
        </div>
      </div>
    ),

    process: (
      <div className="space-y-6 text-sm text-gray-300">
        {/* 步骤 1 */}
        <div className="p-4 bg-slate-700/20 rounded-xl border border-slate-700/50">
          <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            在 HTML 中引入 AllinONE Standard SDK
          </h5>
          <p className="mb-2">在 <code className="px-1 py-0.5 bg-slate-700 rounded text-cyan-400">&lt;head&gt;</code> 中添加 SDK 引用：</p>
          <div className="relative">
            <pre className="p-3 bg-slate-900 rounded-lg text-xs text-gray-300 overflow-x-auto font-mono leading-relaxed">{`<!-- 在 &lt;head&gt; 中添加 -->
<script src="https://cdn.allinone.game/sdk/v1/standard-sdk.js"></script>`}</pre>
          </div>
          <p className="mt-2 text-gray-500 text-xs">提示：该 CDN 地址为内部域名，正式部署后才可用。本地测试时 SDK 不可用属正常现象，系统会自动使用协议桥接层。</p>
        </div>

        {/* 步骤 2 */}
        <div className="p-4 bg-slate-700/20 rounded-xl border border-slate-700/50">
          <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            在游戏尾部添加 Mode B 集成脚本
          </h5>
          <p className="mb-2">在 <code className="px-1 py-0.5 bg-slate-700 rounded text-cyan-400">&lt;body&gt;</code> 底部添加集成脚本（在游戏引擎脚本之后）：</p>
          <div className="relative">
            <button
              onClick={() => { navigator.clipboard.writeText(codeSnippets.integration); }}
              className="absolute top-2 right-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-gray-300 transition-colors"
            >
              复制
            </button>
            <pre className="p-3 bg-slate-900 rounded-lg text-xs text-gray-300 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{`<!-- Mode B 集成脚本：定义道具和兑换逻辑 -->
<script>
(function() {
  'use strict';

  // 1. 定义道具清单（与发布中心配置一致）
  var REDEEM_ITEMS = [
    { itemId: 'difficulty_reducer', effectType: 'difficulty_reducer', name: '🐸 难度降低', desc: '弹珠移动速度减半' },
    { itemId: 'score_boost',       effectType: 'score_boost',       name: '🌟 分数翻倍',  desc: '消除得分翻倍' },
    { itemId: 'extra_life',        effectType: 'extra_life',         name: '❤️ 清除弹珠', desc: '清除路径上 5 颗弹珠' },
    { itemId: 'time_bonus',        effectType: 'time_bonus',         name: '⏱️ 大量清除', desc: '清除路径上 10 颗弹珠' },
  ];

  var g = window.zumaGame; // 游戏实例由引擎脚本暴露
  if (!g) { console.warn('[AllinONE] zumaGame 未就绪'); return; }

  // 2. 声明协议信息
  window.AllinONE = window.AllinONE || {};
  window.AllinONE.__PROTOCOL_MODE__ = 'integrated';
  window.AllinONE.__GAME_ID__ = 'zuma-mode-b-test';
  window.AllinONE.__ITEMS__ = REDEEM_ITEMS;

  // 3. 发送 PROTOCOL:READY 信号
  window.parent.postMessage({
    type: 'PROTOCOL:READY',
    protocolVersion: '1.0.0',
    mode: 'integrated',
    gameId: 'zuma-mode-b-test',
    supportedActions: ['start', 'pause', 'resume'],
    supportedSchemas: REDEEM_ITEMS.map(function(i) { return i.effectType; }),
    timestamp: Date.now(),
  }, '*');

  // 4. 道具兑换效果处理函数
  function applyEffect(itemId) {
    var wasRunning = g.isStart;
    if (wasRunning) g.stop(); // 暂停游戏

    switch (itemId) {
      case 'difficulty_reducer':
        g.moveSpeed = Math.max(1, Math.round(g.moveSpeed * 0.6));
        break;
      case 'score_boost':
        g.__scoreMultiplier = 2; // 分数加倍标志
        break;
      case 'extra_life':
        removeMarbles(g, 5);
        break;
      case 'time_bonus':
        removeMarbles(g, 10);
        break;
    }
    if (wasRunning) g.start(); // 恢复游戏
  }

  function removeMarbles(game, count) {
    var removed = 0;
    for (var i = game.marbleDataList.length - 1; i >= 0; i--) {
      if (removed >= count) break;
      var md = game.marbleDataList[i];
      md.marble.remove();
      game.marbleDataList.splice(i, 1);
      game.marbleColorCount[md.marble.Color]--;
      removed++;
    }
  }

  // 5. 监听兑换事件（来自协议桥接层或 SDK）
  window.addEventListener('allinone-item-redeemed', function(e) { applyEffect(e.detail.itemId); });
  window.addEventListener('allinone:item-redeemed', function(e) { applyEffect(e.detail.itemId); });
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'REDEEM_RESULT' && event.data.data && event.data.data.success) {
      applyEffect(event.data.data.itemId);
    }
  });

  // 6. 劫持 score 实现分数翻倍
  Object.defineProperty(g, 'score', {
    get: function() { return g._score; },
    set: function(v) {
      var m = g.__scoreMultiplier || 1;
      if (m > 1 && v > g._score) {
        g._score += (v - g._score) * m;
      } else {
        g._score = v;
      }
      g.updateScore(g._score);
    },
    configurable: true,
  });

  // 7. 通关时发送 GAME_COMPLETE 事件
  var origFinal = g.updateFinal;
  g.updateFinal = function(isFinal) {
    origFinal(isFinal);
    if (isFinal) {
      window.parent.postMessage({
        type: 'GAME_EVENT',
        event: 'GAME_COMPLETE',
        data: { score: g.score },
        gameId: 'zuma-mode-b-test',
        timestamp: Date.now(),
      }, '*');
    }
  };
})();</script>`}</pre>
          </div>
        </div>

        {/* 步骤 3 */}
        <div className="p-4 bg-slate-700/20 rounded-xl border border-slate-700/50">
          <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            打包并上传发布中心
          </h5>
          <div className="space-y-2">
            <p>将修改后的游戏打包为 <code className="px-1 py-0.5 bg-slate-700 rounded text-cyan-400">.zip</code> 文件，包含自合一的 <code className="px-1 py-0.5 bg-slate-700 rounded">index.html</code>。</p>
            <div className="p-3 bg-slate-900 rounded-lg text-xs text-gray-400 font-mono">
              {`# 自合一 HTML 结构（关键：所有代码内联，无外部引用）
zuma-mode-b-test.zip
  └── index.html       # 自合一：HTML + CSS(内联<style>) + JS(内联<script>)`}
            </div>
            <p className="text-yellow-400 text-xs flex items-center gap-1">
              <Info className="w-3 h-3" />
              <strong>重要：</strong>平台通过 srcdoc iframe 加载游戏，只能加载入口 HTML 文件。JS 和 CSS 文件必须内联到 HTML 中，否则会 404。
            </p>
          </div>
        </div>

        {/* 步骤 4 */}
        <div className="p-4 bg-slate-700/20 rounded-xl border border-slate-700/50">
          <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
            发布中心配置并发布
          </h5>
          <div className="space-y-2">
            <p>上传后，系统自动检测到 <code className="px-1 py-0.5 bg-slate-700 rounded text-cyan-400">@allinone/standard-sdk</code>，自动选择 <strong className="text-cyan-400">Mode B（集成模式）</strong>。</p>
            <div className="p-3 bg-slate-900 rounded-lg text-xs text-gray-400 leading-relaxed">
              <p className="text-cyan-400 mb-1">// 发布中心自动检测到 SDK 的日志输出：</p>
              <p>[StandardGameValidator] 检测到 @allinone/standard-sdk, 自动选择 Mode B (集成模式)</p>
              <p className="text-cyan-400 mt-2 mb-1">// 在配置页面：</p>
              <p>1. 集成方式 → 自动显示「Mode B (集成)」青色高亮</p>
              <p>2. 在「兑换道具」标签页添加 1~2 个道具（如「难度降低」「分数翻倍」）</p>
              <p>3. 点击「一键发布」</p>
              <p>4. 在「游戏管理」中找到发布的游戏，点击「试玩」</p>
            </div>
          </div>
        </div>

        {/* 步骤 5 */}
        <div className="p-4 bg-slate-700/20 rounded-xl border border-slate-700/50">
          <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
            试玩验证
          </h5>
          <div className="space-y-2">
            <p>在游戏页面右上角会出现 🎁 调试按钮，点击弹出测试菜单：</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="p-2 bg-slate-900 rounded-lg text-xs">
                <p className="text-white font-medium mb-1">测试「难度降低」</p>
                <p className="text-gray-400">点击 → 弹珠移动速度减半 → 游戏明显变慢 → ✅</p>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg text-xs">
                <p className="text-white font-medium mb-1">测试「分数翻倍」</p>
                <p className="text-gray-400">点击 → 消除弹珠后分数以 2 倍增长 → ✅</p>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg text-xs">
                <p className="text-white font-medium mb-1">测试「清除弹珠」</p>
                <p className="text-gray-400">点击 → 路径尾部 5 颗弹珠消失 → ✅</p>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg text-xs">
                <p className="text-white font-medium mb-1">测试通关事件</p>
                <p className="text-gray-400">消除所有弹珠通关 → 平台收到 GAME_COMPLETE → ✅</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">* 项目符号表示预期结果，✅ 表示验证通过</p>
          </div>
        </div>
      </div>
    ),

    faq: (
      <div className="space-y-4 text-sm">
        {[
          {
            q: 'Q1：上传后 Mode B 没有被自动选中，SDK 检测失败',
            answer: (
              <div className="space-y-2">
                <p className="text-gray-300"><strong className="text-white">症状：</strong>上传 Zuma 游戏后，发布中心显示「Mode A（注入）」而不是「Mode B（集成）」。</p>
                <p className="text-gray-300"><strong className="text-white">根因：</strong><code className="px-1 py-0.5 bg-slate-700 rounded">StandardGameValidator.quickCheck()</code> 先检查结构文件，不满足就直接返回，不检测 SDK。且只扫描 .js/.ts，不扫描 .html。</p>
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 font-medium mb-1">修复方案</p>
                  <p className="text-gray-300 text-xs">将 SDK 检测移到所有结构性检查之前，扫描范围扩展为 .html/.htm 以及 .js/.ts。</p>
                </div>
              </div>
            ),
          },
          {
            q: 'Q2：试玩时游戏白屏，控制台显示 script.js 404 and style.css 404',
            answer: (
              <div className="space-y-2">
                <p className="text-gray-300"><strong className="text-white">症状：</strong>发布成功后点「试玩」，iframe 内游戏白屏，外部 JS/CSS 404。</p>
                <p className="text-gray-300"><strong className="text-white">根因：</strong>GamePlay 组件通过 iframe srcdoc 加载游戏 HTML，外部文件引用必然 404。</p>
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 font-medium mb-1">修复方案</p>
                  <p className="text-gray-300 text-xs">将所有 JS 和 CSS 内联到单个 HTML 文件中。ZIP 包只包含一个 index.html。</p>
                </div>
              </div>
            ),
          },
          {
            q: 'Q3：内联后游戏仍无法点击开始，控制台 SyntaxError',
            answer: (
              <div className="space-y-2">
                <p className="text-gray-300"><strong className="text-white">症状：</strong>内联后 HTML 能加载，控制台报 SyntaxError: Unexpected end of input。</p>
                <p className="text-gray-300"><strong className="text-white">根因：</strong>手写 minify 压缩代码时破坏了代码结构。</p>
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 font-medium mb-1">修复方案</p>
                  <p className="text-gray-300 text-xs">不要手写 minify 游戏代码。使用原始可读代码直接内联（约 22KB）。</p>
                </div>
              </div>
            ),
          },
          {
            q: 'Q4：standard-sdk.js 加载失败（ERR_NAME_NOT_RESOLVED）',
            answer: (
              <div className="space-y-2">
                <p className="text-gray-300"><strong className="text-white">症状：</strong>cdn.allinone.game 是内部 CDN 域名，本地开发不可用。</p>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-400 font-medium mb-1">影响说明</p>
                  <p className="text-gray-300 text-xs">SDK 加载失败不影响核心流程。发布时 Pipeline 会自动注入轻量协议桥接层，处理所有 postMessage 通信。</p>
                </div>
              </div>
            ),
          },
          {
            q: 'Q5：游戏正常加载但 AllinONE 无法访问 zumaGame',
            answer: (
              <div className="space-y-2">
                <p className="text-gray-300"><strong className="text-white">症状：</strong>控制台持续输出 [AllinONE] zumaGame 未就绪。</p>
                <p className="text-gray-300"><strong className="text-white">根因：</strong>游戏引擎因 SyntaxError 从未成功创建实例。</p>
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 font-medium mb-1">修复方案</p>
                  <p className="text-gray-300 text-xs">先确保引擎代码无语法错误；将初始化改为 IIFE 直接运行；集成脚本直接访问 window.zumaGame。</p>
                </div>
              </div>
            ),
          },
        ].map((faq, i) => (
          <details key={i} className="group p-4 rounded-xl bg-red-500/5 border border-red-500/20 open:border-red-500/40 transition-all">
            <summary className="flex items-start gap-3 cursor-pointer">
              <div className="p-1.5 bg-red-500/20 rounded-lg flex-shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1">
                <h5 className="text-red-400 font-semibold text-sm group-open:mb-2">{faq.q}</h5>
                <p className="text-gray-400 text-xs mt-0.5">点击查看原因和修复方案</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-3 pl-9 space-y-2 border-t border-red-500/10 pt-3">
              {faq.answer}
            </div>
          </details>
        ))}

        <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
          <h5 className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            开发者自查清单
          </h5>
          <div className="space-y-2 text-xs">
            {[
              'ZIP 包只包含 1 个 index.html 文件（无外部 JS/CSS 引用）',
              'HTML 的 <head> 中已添加 SDK 脚本引用',
              '游戏引擎代码放在 <body> 底部，集成脚本在其之后',
              '游戏实例通过 window.zumaGame = zumaGame 暴露给集成脚本',
              '集成脚本监听了 allinone-item-redeemed 事件',
              '通关时发送了 GAME_EVENT 给父窗口',
            ].map((item, i) => (
              <label key={i} className="flex items-start gap-2 text-gray-300">
                <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500" readOnly />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="flex gap-6">
      <div className="hidden lg:block w-48 flex-shrink-0">
        <div className="sticky top-24 space-y-1">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                activeSection === sec.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-slate-700/50'
              }`}
            >
              {sec.icon}
              {sec.title}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-6">
        {sections.map((sec) => (
          <div key={sec.id} id={`zuma-${sec.id}`} className={activeSection === sec.id ? '' : 'hidden lg:block'}>
            {activeSection !== sec.id && <div className="lg:hidden">{sectionContent[sec.id]}</div>}
            {activeSection === sec.id && sectionContent[sec.id]}
          </div>
        ))}
      </div>
    </div>
  );
};

// ========== AI Skill 集成规范（为 AI 设计的可执行规范文档）==========
const SkillIntegrationGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState('directive');

  const injectCodeText = '// ' + String.fromCharCode(9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552) + '\n' +
    '// Mode A: AI ' + '\u64CD\u4F5C\u6E05\u5355' + '（只需 3 步）\n' +
    '// ' + String.fromCharCode(9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552,9552) + '\n\n' +
    '// 第 1 步：确保所有文件内联到单个 index.html\n' +
    '// 原结构：index.html + script.js + style.css  \u2190 禁止\n' +
    '// 新结构：index.html（内联 <style> + <script>） \u2190 必须\n\n' +
    '// 第 2 步：确保游戏实例暴露到 window\n' +
    '// 找到游戏中游戏实例创建的代码，在其后添加：\n' +
    'window.{gameVariable} = {gameVariable};\n' +
    '// 示例（假设游戏实例变量名为 game）：\n' +
    'window.gameInstance = game;\n\n' +
    '// 第 3 步：验证 HTML 结构完整性\n' +
    '// \u2514 <!DOCTYPE html> 存在\n' +
    '// \u2514 <head> 包含 <meta charset="UTF-8">\n' +
    '// \u2514 <body> 底部按顺序：游戏脚本 \u2192 无外部引用\n\n' +
    '// \u26A0 注意：不要在 Mode A 下手动添加 SDK 引用或集成脚本\n' +
    '//    这些由平台发布时自动注入，手动添加会导致冲突';

  const packagingCorrectCode = '// \u2705 正确结构（AI 输出目标）\n' +
    'zuma-mode-b-test.zip\n' +
    '  ' + String.fromCharCode(9492,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472) + ' index.html           # 自合一，约 20~50KB\n' +
    '        ' + String.fromCharCode(9500,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472) + ' <head>\n' +
    '        ' + '|   ' + String.fromCharCode(9500,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472) + ' <meta charset="UTF-8">\n' +
    '        ' + '|   ' + String.fromCharCode(9500,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472) + ' <title>游戏名</title>\n' +
    '        ' + '|   ' + String.fromCharCode(9500,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472) + ' <style>/* 所有 CSS 内联 */</style>\n' +
    '        ' + '|   ' + String.fromCharCode(9492,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472) + ' [Mode B] ' + '<script src="...standard-sdk.js"><' + '/script>\n' +
    '        ' + String.fromCharCode(9500,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472) + ' <body>\n' +
    '        ' + '|   ' + String.fromCharCode(9500,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472) + ' 游戏 UI 元素\n' +
    '        ' + '|   ' + String.fromCharCode(9492,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472) + ' <script>/* 所有 JS 内联 */\n' +
    '        ' + '|         ' + String.fromCharCode(9500,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472) + ' 游戏引擎代码（类定义等）\n' +
    '        ' + '|         ' + String.fromCharCode(9500,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472) + ' 游戏初始化 + window.{variable} = instance\n' +
    '        ' + '|         ' + String.fromCharCode(9492,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472) + ' [Mode B] AllinONE 集成脚本\n' +
    '        ' + String.fromCharCode(9492,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472) + ' </html>\n\n' +
    '// \u274C 错误结构（平台不支持）\n' +
    'zuma-game.zip\n' +
    '  ' + String.fromCharCode(9500,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472) + ' index.html       # 引用外部文件\n' +
    '  ' + String.fromCharCode(9500,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472) + ' script.js        # \u2190 在 srcdoc 中 404\n' +
    '  ' + String.fromCharCode(9492,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472,9472) + ' style.css        # \u2190 在 srcdoc 中 404';

  const modeDecisionText = `用户选择 Mode A  ──→  无需修改游戏代码
                          │
                          ├── 平台自动完成：
                          │   ├── 注入 Protocol Layer (协议声明 + Effect Engine)
                          │   └── 注入 SDK + 兑换条 UI
                          │
                          └── AI 只需确保：
                              ├── HTML 结构完整（<!DOCTYPE>, <head>, <body>）
                              ├── 所有资源内联（无外部 JS/CSS 引用）
                              └── 游戏入口为 index.html

用户选择 Mode B  ──→  需要 AI 修改游戏代码
                          │
                          ├── 必须操作：
                          │   ├── 在 <head> 添加 SDK 脚本引用
                          │   ├── 在 <body> 底部添加集成脚本
                          │   ├── 将游戏实例暴露到 window.{variable}
                          │   ├── 实现道具兑换效果处理
                          │   └── 发送 GAME_COMPLETE 事件
                          │
                          ├── 可选操作：
                          │   ├── 劫持 game.score 实现分数加倍
                          │   ├── 发送 GAME_EVENT（定期上报进度）
                          │   └── 声明自定义 Schema
                          │
                          └── 参考：Zuma 案例（window.zumaGame 模式）`;

  const gameEventCodeText = `window.parent.postMessage({
  type: 'GAME_EVENT',
  event: 'GAME_COMPLETE',
  data: { score: {score}, level: {level} },
  gameId: '{GAME_ID}',
  timestamp: Date.now(),
}, '*');

// 支持的事件类型：
// GAME_COMPLETE  - 游戏通关
// GAME_WIN       - 获胜
// LEVEL_COMPLETE - 关卡完成
// SCORE_MILESTONE- 达到分数里程碑`;

  const sections = [
    { id: 'directive', title: 'AI 指令', icon: <Terminal className="w-4 h-4" /> },
    { id: 'mode-decision', title: '模式决策树', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'inject-pattern', title: 'Mode A 注入模式', icon: <Zap className="w-4 h-4" /> },
    { id: 'sdk-pattern', title: 'Mode B SDK 模式', icon: <Wand2 className="w-4 h-4" /> },
    { id: 'variable-map', title: '变量映射表', icon: <FileText className="w-4 h-4" /> },
    { id: 'protocol-spec', title: '协议通信规范', icon: <ArrowRight className="w-4 h-4" /> },
    { id: 'packaging', title: '打包约束', icon: <Package className="w-4 h-4" /> },
    { id: 'validation', title: '验证清单', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const modeBTemplate = `<!-- 第 1 步：在 <head> 中添加 SDK 引用 -->
<script src="https://cdn.allinone.game/sdk/v1/standard-sdk.js"></script>

<!-- 第 2 步：在 <body> 底部添加集成脚本 -->
<script>
(function() {
  'use strict';
  var game = window.{{gameVariable}};
  if (!game) { console.warn('[AllinONE] 游戏实例未就绪'); return; }
  var REDEEM_ITEMS = [
    { itemId: '{{ITEM_ID_1}}', effectType: '{{EFFECT_TYPE_1}}', name: '{{ITEM_NAME_1}}', desc: '{{ITEM_DESC_1}}' },
    { itemId: '{{ITEM_ID_2}}', effectType: '{{EFFECT_TYPE_2}}', name: '{{ITEM_NAME_2}}', desc: '{{ITEM_DESC_2}}' },
  ];
  window.AllinONE = window.AllinONE || {};
  window.AllinONE.__PROTOCOL_MODE__ = 'integrated';
  window.AllinONE.__GAME_ID__ = '{{GAME_ID}}';
  window.AllinONE.__ITEMS__ = REDEEM_ITEMS;
  window.parent.postMessage({
    type: 'PROTOCOL:READY', protocolVersion: '1.0.0', mode: 'integrated',
    gameId: '{{GAME_ID}}',
    supportedActions: ['start', 'pause', 'resume', 'redeem'],
    supportedSchemas: REDEEM_ITEMS.map(function(i) { return i.effectType; }),
    timestamp: Date.now(),
  }, '*');
  // [推荐] 效果注册表模式（兑换门控）
  // var sdk = new AllinONEGame({ gameId: '{{GAME_ID}}', redeemItems: REDEEM_ITEMS });
  // sdk.registerEffect('difficulty_reducer', function(d) { /* ... */ });
})();
</script>`;

  const sectionContent: Record<string, React.ReactNode> = {
    directive: (
      <div className="space-y-5 text-sm">
        <div className="p-4 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-xl">
          <h4 className="text-white font-bold text-base mb-3 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            AI 执行指令
          </h4>
          <div className="pl-3 border-l-2 border-purple-500/40 space-y-3 text-gray-300">
            <p>你是一个 AllinONE 平台集成助手。你的任务是：</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>分析用户提供的游戏代码（HTML/JS/CSS）</li>
              <li>按照用户指定的模式（Mode A 或 Mode B）修改代码</li>
              <li>确保修改后的游戏在平台的 srcdoc iframe 中正常运行</li>
              <li>所有代码内联到单个 HTML 文件中</li>
            </ol>
            <p className="text-yellow-400 text-xs mt-2">⚠️ 阅读以下所有章节后再开始修改。每个章节都是必须遵守的规范。</p>
          </div>
        </div>

        <div className="p-4 bg-slate-700/20 rounded-xl border border-slate-700/50">
          <h5 className="text-white font-semibold mb-2">AI 输入/输出约定</h5>
          <div className="text-xs font-mono space-y-1.5 text-gray-400">
            <p><span className="text-cyan-400">输入：</span>用户提供一个或多个游戏文件（.html, .js, .css, .ts）</p>
            <p><span className="text-cyan-400">输出：</span>修改后的 <span className="text-white">单个 index.html</span>（所有内容内联，无外部引用）</p>
            <p><span className="text-cyan-400">游戏实例暴露：</span><span className="text-white">{'window.{{gameVariable}} = gameInstance'}</span>（变量名由 AI 根据 game 类名或变量名推导）</p>
            <p><span className="text-cyan-400">参考案例：</span>Zuma 游戏集成中命名为 <span className="text-white">window.zumaGame</span></p>
          </div>
        </div>

        <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <h5 className="text-blue-400 font-semibold mb-2">AI 需要回答用户的问题（交互前主动询问）</h5>
          <ul className="space-y-1 text-gray-400 text-xs">
            <li>① 使用 Mode A（零修改，自动注入效果引擎）还是 Mode B（SDK 集成，自主控制效果）？</li>
            <li>② 需要配置哪些道具？每个道具的效果类型是什么？</li>
            <li>③ 游戏通关/完成时是否需要发送 GAME_COMPLETE 事件？</li>
          </ul>
        </div>
      </div>
    ),

    'mode-decision': (
      <div className="space-y-4 text-sm">
        <div className="p-4 bg-slate-700/20 rounded-xl border border-slate-700/50">
          <h5 className="text-white font-semibold mb-3">模式决策树（AI 需按此逻辑选择）</h5>
          <pre className="text-xs text-gray-300 font-mono leading-relaxed p-3 bg-slate-900 rounded-lg">{modeDecisionText}</pre>
        </div>
      </div>
    ),

    'inject-pattern': (
      <div className="space-y-4 text-sm">
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <h5 className="text-purple-400 font-semibold mb-2">Mode A — AI 最小操作集</h5>
          <p className="text-gray-300 mb-3">Mode A 下 AI 需要做的工作最少，所有注入都由平台在发布时自动完成。</p>
          <pre className="text-xs text-gray-300 font-mono leading-relaxed p-3 bg-slate-900 rounded-lg">{injectCodeText}</pre>
          <p className="text-gray-400 text-xs mt-2">💡 Mode A 的核心原理：平台在发布时向 HTML 头部注入 Effect Engine，实现帧级拦截。AI 无需手动实现这些。</p>
        </div>
      </div>
    ),

    'sdk-pattern': (
      <div className="space-y-4 text-sm">
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
          <h5 className="text-cyan-400 font-semibold mb-2">Mode B — AI 标准集成模板</h5>
          <p className="text-gray-300 mb-3">以下是 AI 需要复制并适配到目标游戏的标准代码模板。</p>
          <div className="relative">
            <button
              onClick={() => { navigator.clipboard.writeText(modeBTemplate); }}
              className="absolute top-2 right-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-gray-300 transition-colors z-10"
            >
              复制模板
            </button>
            <pre className="text-xs text-gray-300 font-mono leading-relaxed p-3 bg-slate-900 rounded-lg whitespace-pre-wrap overflow-x-auto">{modeBTemplate}</pre>
          </div>
        </div>

        <div className="p-4 bg-slate-700/20 rounded-xl">
          <h5 className="text-white font-semibold mb-2">AI 适配指南</h5>
          <div className="space-y-2 text-xs text-gray-400">
            <p><strong className="text-white">1. 查找游戏实例：</strong>搜索 new Game、new Phaser.Game 等关键字。将实例变量赋值给 {'window.{{gameVariable}}'}。</p>
            <p><strong className="text-white">2. 定义道具：</strong>与用户确认道具列表。每种道具需要唯一的 itemId 和 effectType。</p>
            <p><strong className="text-white">3. 实现 applyEffect：</strong>根据每个 effectType，找到游戏中对应的变量/方法进行修改。</p>
            <p><strong className="text-white">4. 处理游戏特有逻辑：</strong>如果游戏使用 Phaser、Cocos、Egret 等框架，需注意框架内部变量的访问方式。</p>
          </div>
        </div>
      </div>
    ),

    'variable-map': (
      <div className="space-y-4 text-sm">
        <div className="p-4 bg-slate-700/20 rounded-xl border border-slate-700/50">
          <h5 className="text-white font-semibold mb-3">效果类型 → 游戏变量映射表</h5>
          <p className="text-gray-400 mb-3 text-xs">AI 在分析目标游戏代码时，扫描以下关键词来定位需要修改的变量：</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-2 px-3 text-purple-400">effectType</th>
                  <th className="text-left py-2 px-3 text-cyan-400">语义</th>
                  <th className="text-left py-2 px-3 text-gray-400">扫描关键词</th>
                  <th className="text-left py-2 px-3 text-gray-400">修改方式</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {[
                  ['difficulty_reducer', '降低难度 / 减速', 'moveSpeed, speed, difficulty, gameSpeed, velocity, fallSpeed, dropSpeed', '乘以 0.5~0.7'],
                  ['speed_boost', '加速', 'speed, moveSpeed, animationSpeed, frameRate, tickRate', '乘以 1.3~1.5'],
                  ['score_boost', '分数翻倍', 'score, points, totalScore, combo, multiplier', '劫持 score setter'],
                  ['extra_life', '额外生命', 'life, lives, health, hp, hitPoints', '增加值（+1~+5）'],
                  ['time_bonus', '时间奖励', 'time, timer, countdown, remaining, timeLeft', '增加值（+10~+30s）'],
                  ['custom', '自定义', '——', '透传数据，游戏自行处理'],
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 text-purple-300 font-mono">{row[0]}</td>
                    <td className="py-2 px-3 text-white">{row[1]}</td>
                    <td className="py-2 px-3 text-gray-400"><code>{row[2]}</code></td>
                    <td className="py-2 px-3 text-gray-400">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),

    'protocol-spec': (
      <div className="space-y-4 text-sm">
        <div className="p-4 bg-slate-700/20 rounded-xl border border-slate-700/50">
          <h5 className="text-white font-semibold mb-3">协议通信规范</h5>
          <p className="text-gray-400 mb-3 text-xs">所有通信通过 window.parent.postMessage() 进行。</p>

          <div className="space-y-3">
            <div className="p-3 bg-slate-900 rounded-lg">
              <p className="text-cyan-400 font-medium text-xs mb-1">① PROTOCOL:READY（游戏 → 平台）</p>
              <pre className="text-xs text-gray-500 font-mono">{`window.parent.postMessage({
  type: 'PROTOCOL:READY',
  protocolVersion: '1.0.0',
  mode: 'integrated',
  gameId: '{GAME_ID}',
  supportedActions: ['start', 'pause', 'resume', 'redeem'],
  supportedSchemas: ['difficulty_reducer', 'score_boost'],
  timestamp: Date.now(),
}, '*');`}</pre>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg">
              <p className="text-cyan-400 font-medium text-xs mb-1">② REDEEM_RESULT（平台 → 游戏）</p>
              <pre className="text-xs text-gray-500 font-mono">{`// CustomEvent（推荐）
window.addEventListener('allinone-item-redeemed', function(e) {
  applyEffect(e.detail.itemId);
});
// postMessage
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'REDEEM_RESULT' && event.data.data.success) {
    applyEffect(event.data.data.itemId);
  }
});`}</pre>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg">
              <p className="text-cyan-400 font-medium text-xs mb-1">③ GAME_EVENT（游戏 → 平台，触发奖励）</p>
              <pre className="text-xs text-gray-500 font-mono">{gameEventCodeText}</pre>
            </div>
          </div>
        </div>
      </div>
    ),

    packaging: (
      <div className="space-y-4 text-sm">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <h5 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            关键约束（AI 必须遵守）
          </h5>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2 text-gray-300">
              <span className="text-red-400 font-bold flex-shrink-0">[必须]</span>
              <span><strong className="text-white">自合一：</strong>所有 JS/CSS 必须内联到单个 index.html。严禁外部文件引用。</span>
            </div>
            <div className="flex items-start gap-2 text-gray-300">
              <span className="text-red-400 font-bold flex-shrink-0">[必须]</span>
              <span><strong className="text-white">游戏实例暴露：</strong>通过 {'window.{{variable}} = instance'} 将游戏实例暴露到全局。</span>
            </div>
            <div className="flex items-start gap-2 text-gray-300">
              <span className="text-red-400 font-bold flex-shrink-0">[必须]</span>
              <span><strong className="text-white">脚本顺序：</strong>body 底部必须是：① 游戏引擎脚本 → ② 集成脚本。</span>
            </div>
            <div className="flex items-start gap-2 text-gray-300">
              <span className="text-yellow-400 font-bold flex-shrink-0">[避免]</span>
              <span><strong className="text-white">不要手写 minify 代码。</strong>使用原始可读代码内联。</span>
            </div>
            <div className="flex items-start gap-2 text-gray-300">
              <span className="text-yellow-400 font-bold flex-shrink-0">[避免]</span>
              <span><strong className="text-white">不要依赖 window.onload。</strong>脚本在 &lt;/body&gt; 前执行时 DOM 已就绪。</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-700/20 rounded-xl">
          <h5 className="text-white font-semibold mb-2">文件结构规范</h5>
          <pre className="text-xs text-gray-400 font-mono leading-relaxed">{packagingCorrectCode}</pre>
        </div>
      </div>
    ),

    validation: (
      <div className="space-y-4 text-sm">
        <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
          <h5 className="text-green-400 font-semibold mb-3">AI 完成修改后的自检清单</h5>
          <div className="space-y-3">
            <div>
              <h6 className="text-white text-xs font-semibold mb-1.5">🔍 代码检查</h6>
              <div className="space-y-1.5 text-xs">
                {[
                  '所有 <script> 和 </script> 标签是否成对匹配？',
                  '游戏实例是否通过 window.{{variable}} 暴露？',
                  '集成脚本是否在游戏引擎脚本之后？',
                  '是否删除了所有的 window.onload 改用直接执行？',
                  'Mode B 下 SDK script 引用是否在 <head> 中？',
                  'Mode B 下是否监听了 allinone-item-redeemed 事件？',
                  'Mode B 下是否发送了 PROTOCOL:READY？',
                  '通关逻辑是否发送了 GAME_EVENT / GAME_COMPLETE？',
                ].map((item, i) => (
                  <label key={i} className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 w-3 h-3 rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500" readOnly />
                    <span className="text-gray-300">{item}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h6 className="text-white text-xs font-semibold mb-1.5">📦 打包检查</h6>
              <div className="space-y-1.5 text-xs">
                {[
                  'ZIP 中是否只包含 index.html（没有 script.js / style.css 等外部文件）？',
                  'HTML 中是否没有任何 <link rel="stylesheet"> 或 <script src="./...">？',
                  '所有外部资源 URL（图片、字体）是否使用 https:// 完整 URL？',
                ].map((item, i) => (
                  <label key={i} className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 w-3 h-3 rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500" readOnly />
                    <span className="text-gray-300">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="flex gap-6">
      <div className="hidden lg:block w-44 flex-shrink-0">
        <div className="sticky top-24 space-y-1">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                activeSection === sec.id
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-slate-700/50'
              }`}
            >
              {sec.icon}
              {sec.title}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-6">
        {/* 一键打包卡片 */}
        <div className="p-4 bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-amber-300 font-semibold text-sm mb-1">一键打包发送给 AI</h4>
              <p className="text-amber-400/70 text-xs leading-relaxed">
                将 Mode B 所有规范内容打包为一个 .md 文件。直接发给 AI 助手，
                AI 即可根据文档自动完成游戏代码修改。
              </p>
            </div>
            <button
              onClick={() => {
                const content = `# AllinONE Mode B AI Skill 规范\n\n## 说明\n本文档包含 AllinONE 平台 Mode B（SDK 集成模式）的游戏技能集成规范。\n\n## AI 执行指令\n1. 分析用户提供的游戏代码\n2. 按照 Mode B 规范修改代码\n3. 所有代码内联到单个 HTML 文件中\n\n## Mode B 标准集成模板\n\`\`\`html\n${modeBTemplate}\n\`\`\`\n\n## 验证清单\n- [ ] 所有标签是否成对匹配？\n- [ ] 游戏实例是否通过 window.{{variable}} 暴露？\n- [ ] 集成脚本是否在游戏引擎脚本之后？\n- [ ] ZIP 中是否只包含 index.html？\n- [ ] HTML 中是否没有任何外部文件引用？`;
                const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'allinone-mode-b-ai-skill-spec.md';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold text-xs rounded-lg transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-400/30 flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              打包下载
            </button>
          </div>
        </div>

        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-xs text-purple-300 mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span>此规范专为 AI 阅读设计。AI 助手可直接解析此文档并执行游戏代码修改。</span>
        </div>
        {sections.map((sec) => (
          <div key={sec.id} className={activeSection === sec.id ? '' : 'hidden'}>
            {sectionContent[sec.id]}
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== 主页面 ====================

export default function CaseStudyPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'zuma' | 'ai-skill'>('zuma');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 顶部导航 */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/skill-wizard')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              ← 返回 Skill 向导
            </button>
            <div className="h-5 w-px bg-slate-600" />
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-cyan-400" />
              <span className="font-semibold text-white">
                实际案例演示
              </span>
            </div>
          </div>

          <Link
            to="/skill-wizard"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg text-sm font-medium transition-all shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            SDK 集成向导
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 页面标题区 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 mb-4">
            <BookOpen className="w-4 h-4 text-cyan-500" />
            <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
              开发者学习资源
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            🎯 实际案例演示
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            通过完整案例和规范文档，帮助开发者快速理解 AllinONE 平台的集成流程
          </p>

          {/* Tab 切换 */}
          <div className="inline-flex bg-white dark:bg-slate-800 rounded-xl p-1 shadow-lg border border-slate-200 dark:border-slate-700 mt-6">
            <button
              onClick={() => setActiveTab('zuma')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === 'zuma'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              Zuma 集成案例
            </button>
            <button
              onClick={() => setActiveTab('ai-skill')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === 'ai-skill'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-4 h-4" />
              AI Skill 规范
            </button>
          </div>
        </div>

        {/* Tab 内容 */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'zuma' && <ZumaDemoContent />}
          {activeTab === 'ai-skill' && <SkillIntegrationGuide />}
        </div>

        {/* 底部导航 */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-500/10 dark:to-blue-500/10 rounded-2xl p-8 border border-cyan-100 dark:border-cyan-500/20 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              准备好开始集成了吗？
            </p>
            <Link
              to="/skill-wizard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl font-medium transition-all shadow-lg"
            >
              <Sparkles className="w-5 h-5" />
              前往 SDK 集成向导
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

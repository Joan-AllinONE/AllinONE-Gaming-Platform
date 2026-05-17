import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SkillConfigWizard, SkillGenerationResult } from '@/publishing-center/components/SkillConfigWizard';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { ArrowLeft, Wand2, Code, Download, Copy, CheckCircle, Sparkles, Upload, Rocket, X, FileCode, Package, BookOpen, Terminal, Bot, Lightbulb, FileText, ExternalLink, ArrowRight, Gamepad2, HelpCircle, Info, ChevronDown, AlertCircle, GitBranch, Zap, ChevronUp } from 'lucide-react';
import JSZip from 'jszip';

// ========== 可折叠参考面板组件 ==========
const ReferencePanel: React.FC<{ title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }> = ({ title, icon, defaultOpen, children }) => {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
      >
        <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      <div className={`transition-all duration-300 ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

interface UploadedFile {
  name: string;
  path: string;
  size: number;
  type: string;
  content: string | Uint8Array;
}

type ViewMode = 'wizard';
type ManagerTab = 'zuma-demo' | 'ai-skill';

// ========== Zuma Mode B 测试案例内容组件 ==========
const ZumaDemoContent: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: '案例概述', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'process', title: '完整流程', icon: <FileCode className="w-4 h-4" /> },
    { id: 'faq', title: '常见错误', icon: <HelpCircle className="w-4 h-4" /> },
  ];

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
            <pre className="p-3 bg-slate-900 rounded-lg text-xs text-gray-300 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{`<!-- Mode B 集成脚本：SDK 效果注册表模式（兑换门控） -->
<script>
(function() {
  'use strict';

  // 1. 定义道具清单（与发布中心配置一致）
  var REDEEM_ITEMS = [
    { itemId: 'difficulty_reducer', effectType: 'difficulty_reducer', name: '🐸 难度降低', quantity: 1, effects: { multiplier: 0.6 } },
    { itemId: 'score_boost',       effectType: 'score_boost',       name: '🌟 分数翻倍',  quantity: 1, effects: { multiplier: 2 } },
    { itemId: 'extra_life',        effectType: 'extra_life',         name: '❤️ 清除弹珠', quantity: 1, effects: {} },
    { itemId: 'time_bonus',        effectType: 'time_bonus',         name: '⏱️ 大量清除', quantity: 1, effects: {} },
  ];

  var g = window.zumaGame;
  if (!g) { console.warn('[AllinONE] zumaGame 未就绪'); return; }

  // 辅助函数：移除弹珠
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

  // 2. 初始化 SDK（自动注入兑换条）
  // 通过 registerEffect 注册效果，兑换码验证通过后由 SDK 内部调用
  // ❌ 不再使用裸露的 applyEffect() — 防止绕过兑换直接调用
  if (typeof AllinONEGame !== 'undefined') {
    var sdk = new AllinONEGame({
      gameId: 'zuma-mode-b-test',
      debug: true,
      redeemItems: REDEEM_ITEMS,
      skills: {},
    });

    // ===== [关键] 注册效果处理器 =====
    sdk.registerEffect('difficulty_reducer', function(data) {
      var wasRunning = g.isStart;
      if (wasRunning) g.stop();
      g.moveSpeed = Math.max(1, Math.round(g.moveSpeed * (data.effects.multiplier || 0.6)));
      if (wasRunning) g.start();
    });

    sdk.registerEffect('score_boost', function(data) {
      g.__scoreMultiplier = (data.effects.multiplier || 2);
    });

    sdk.registerEffect('extra_life', function(data) {
      var wasRunning = g.isStart;
      if (wasRunning) g.stop();
      removeMarbles(g, 5);
      if (wasRunning) g.start();
    });

    sdk.registerEffect('time_bonus', function(data) {
      var wasRunning = g.isStart;
      if (wasRunning) g.stop();
      removeMarbles(g, 10);
      if (wasRunning) g.start();
    });

    console.log('[AllinONE] Mode B SDK + Effect Registry 已就绪, 道具:', REDEEM_ITEMS.length + ' 种');
  } else {
    // 回退：使用协议桥接层（SDK 不可用时）
    window.AllinONE = window.AllinONE || {};
    window.AllinONE.__PROTOCOL_MODE__ = 'integrated';
    window.AllinONE.__GAME_ID__ = 'zuma-mode-b-test';
    window.AllinONE.__ITEMS__ = REDEEM_ITEMS;

    window.parent.postMessage({
      type: 'PROTOCOL:READY',
      protocolVersion: '1.0.0',
      mode: 'integrated',
      gameId: 'zuma-mode-b-test',
      supportedActions: ['start', 'pause', 'resume'],
      supportedSchemas: REDEEM_ITEMS.map(function(i) { return i.effectType; }),
      timestamp: Date.now(),
    }, '*');

    function applyEffect(itemId) {
      var wasRunning = g.isStart;
      if (wasRunning) g.stop();
      switch (itemId) {
        case 'difficulty_reducer': g.moveSpeed = Math.max(1, Math.round(g.moveSpeed * 0.6)); break;
        case 'score_boost': g.__scoreMultiplier = 2; break;
        case 'extra_life': removeMarbles(g, 5); break;
        case 'time_bonus': removeMarbles(g, 10); break;
      }
      if (wasRunning) g.start();
    }

    window.addEventListener('allinone-item-redeemed', function(e) { applyEffect(e.detail.itemId); });
    window.addEventListener('allinone:item-redeemed', function(e) { applyEffect(e.detail.itemId); });
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'REDEEM_RESULT' && event.data.data && event.data.data.success) {
        applyEffect(event.data.data.itemId);
      }
    });
  }

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
        {/* 错误 1 */}
        <details className="group p-4 rounded-xl bg-red-500/5 border border-red-500/20 open:border-red-500/40 transition-all">
          <summary className="flex items-start gap-3 cursor-pointer">
            <div className="p-1.5 bg-red-500/20 rounded-lg flex-shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <h5 className="text-red-400 font-semibold text-sm group-open:mb-2">Q1：上传后 Mode B 没有被自动选中，SDK 检测失败</h5>
              <p className="text-gray-400 text-xs mt-0.5">点击查看原因和修复方案</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 pl-9 space-y-2 border-t border-red-500/10 pt-3">
            <p className="text-gray-300"><strong className="text-white">症状：</strong>上传 Zuma 游戏后，发布中心显示「Mode A（注入）」而不是「Mode B（集成）」。</p>
            <p className="text-gray-300"><strong className="text-white">根因：</strong><code className="px-1 py-0.5 bg-slate-700 rounded">StandardGameValidator.quickCheck()</code> 有两个缺陷：</p>
            <ul className="list-disc pl-4 text-gray-400 space-y-1">
              <li>先检查 <code className="px-1 py-0.5 bg-slate-700 rounded text-red-300">allinone.config.json</code> 和 <code className="px-1 py-0.5 bg-slate-700 rounded text-red-300">src/</code> 目录，不满足就直接返回，不检测 SDK</li>
              <li>只扫描 <code className="px-1 py-0.5 bg-slate-700 rounded text-red-300">.js/.ts</code> 文件，但 SDK 是通过 <code className="px-1 py-0.5 bg-slate-700 rounded text-red-300">&lt;script&gt;</code> 写在 <code className="px-1 py-0.5 bg-slate-700 rounded text-red-300">index.html</code> 中的</li>
            </ul>
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 font-medium mb-1">修复方案</p>
              <p className="text-gray-300 text-xs">修改 <code className="px-1 py-0.5 bg-slate-700 rounded">StandardGameValidator.quickCheck()</code>：将 SDK 检测移到所有结构性检查之前，并且扫描文件类型扩展为 <code className="px-1 py-0.5 bg-slate-700 rounded">.html/.htm</code> 以及 <code className="px-1 py-0.5 bg-slate-700 rounded">.js/.ts</code>。</p>
            </div>
          </div>
        </details>

        {/* 错误 2 */}
        <details className="group p-4 rounded-xl bg-red-500/5 border border-red-500/20 open:border-red-500/40 transition-all">
          <summary className="flex items-start gap-3 cursor-pointer">
            <div className="p-1.5 bg-red-500/20 rounded-lg flex-shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <h5 className="text-red-400 font-semibold text-sm group-open:mb-2">Q2：试玩时游戏白屏，控制台显示 script.js 404 and style.css 404</h5>
              <p className="text-gray-400 text-xs mt-0.5">点击查看原因和修复方案</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 pl-9 space-y-2 border-t border-red-500/10 pt-3">
            <p className="text-gray-300"><strong className="text-white">症状：</strong>发布成功后点「试玩」，iframe 内游戏白屏。控制台显示 <code className="px-1 py-0.5 bg-slate-700 rounded text-red-300">Failed to load resource: 404 (Not Found)</code> 指向 script.js 和 style.css。</p>
            <p className="text-gray-300"><strong className="text-white">根因：</strong>GamePlay 组件通过 <code className="px-1 py-0.5 bg-slate-700 rounded">iframe srcDoc</code> 加载游戏 HTML，其他文件（JS/CSS）虽然存储在本地但不会被提供给 iframe。<code className="px-1 py-0.5 bg-slate-700 rounded">&lt;script src="./script.js"&gt;</code> 在 srcdoc 中必然 404。</p>
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 font-medium mb-1">修复方案</p>
              <p className="text-gray-300 text-xs">将 <strong className="text-white">所有 JS 和 CSS 内联到单个 HTML 文件</strong>中：CSS 放入 <code className="px-1 py-0.5 bg-slate-700 rounded">&lt;style&gt;</code> 标签，JS 放入 <code className="px-1 py-0.5 bg-slate-700 rounded">&lt;script&gt;</code> 标签。最终 ZIP 包只包含一个 <code className="px-1 py-0.5 bg-slate-700 rounded">index.html</code> 文件。</p>
            </div>
          </div>
        </details>

        {/* 错误 3 */}
        <details className="group p-4 rounded-xl bg-red-500/5 border border-red-500/20 open:border-red-500/40 transition-all">
          <summary className="flex items-start gap-3 cursor-pointer">
            <div className="p-1.5 bg-red-500/20 rounded-lg flex-shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <h5 className="text-red-400 font-semibold text-sm group-open:mb-2">Q3：内联后游戏仍无法点击开始，控制台 SyntaxError: Unexpected end of input</h5>
              <p className="text-gray-400 text-xs mt-0.5">点击查看原因和修复方案</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 pl-9 space-y-2 border-t border-red-500/10 pt-3">
            <p className="text-gray-300"><strong className="text-white">症状：</strong>内联后 HTML 能加载，控制台报 <code className="px-1 py-0.5 bg-slate-700 rounded text-red-300">Uncaught SyntaxError: Unexpected end of input</code>，同时显示 <code className="px-1 py-0.5 bg-slate-700 rounded text-red-300">[AllinONE] zumaGame 未就绪</code>。</p>
            <p className="text-gray-300"><strong className="text-white">根因：</strong>手写 minify 压缩 577 行游戏代码时，破坏了代码结构——缺少闭合括号或引号。</p>
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 font-medium mb-1">修复方案</p>
              <p className="text-gray-300 text-xs"><strong className="text-white">不要手写 minify 游戏代码。</strong>使用可读的原始代码直接内联（约 22KB），删除 <code className="px-1 py-0.5 bg-slate-700 rounded">window.onload</code> 包装器，直接在 <code className="px-1 py-0.5 bg-slate-700 rounded">&lt;body&gt;</code> 底部用 IIFE 执行。</p>
            </div>
          </div>
        </details>

        {/* 错误 4 */}
        <details className="group p-4 rounded-xl bg-red-500/5 border border-red-500/20 open:border-red-500/40 transition-all">
          <summary className="flex items-start gap-3 cursor-pointer">
            <div className="p-1.5 bg-red-500/20 rounded-lg flex-shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <h5 className="text-red-400 font-semibold text-sm group-open:mb-2">Q4：standard-sdk.js 加载失败（ERR_NAME_NOT_RESOLVED），会影响功能吗？</h5>
              <p className="text-gray-400 text-xs mt-0.5">点击查看原因和说明</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 pl-9 space-y-2 border-t border-red-500/10 pt-3">
            <p className="text-gray-300"><strong className="text-white">症状：</strong>控制台显示 <code className="px-1 py-0.5 bg-slate-700 rounded text-red-300">standard-sdk.js:1 Failed to load resource: net::ERR_NAME_NOT_RESOLVED</code>。</p>
            <p className="text-gray-300"><strong className="text-white">原因：</strong><code className="px-1 py-0.5 bg-slate-700 rounded">cdn.allinone.game</code> 是内部 CDN 域名，仅在平台正式部署后才可解析。本地开发和测试环境中此错误是正常的。</p>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 font-medium mb-1">影响说明</p>
              <p className="text-gray-300 text-xs">SDK 加载失败 <strong className="text-white">不影响核心流程</strong>。发布时 Pipeline 会自动注入轻量协议桥接层（约 65 行），处理所有 postMessage 通信。集成脚本中我们已写了回退逻辑：当 <code className="px-1 py-0.5 bg-slate-700 rounded">typeof AllinONEGame === 'undefined'</code> 时，手动发送 <code className="px-1 py-0.5 bg-slate-700 rounded">PROTOCOL:READY</code> 信号。</p>
            </div>
          </div>
        </details>

        {/* 错误 5 */}
        <details className="group p-4 rounded-xl bg-red-500/5 border border-red-500/20 open:border-red-500/40 transition-all">
          <summary className="flex items-start gap-3 cursor-pointer">
            <div className="p-1.5 bg-red-500/20 rounded-lg flex-shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <h5 className="text-red-400 font-semibold text-sm group-open:mb-2">Q5：游戏正常加载但 AllinONE 无法访问 zumaGame</h5>
              <p className="text-gray-400 text-xs mt-0.5">点击查看原因和修复方案</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 pl-9 space-y-2 border-t border-red-500/10 pt-3">
            <p className="text-gray-300"><strong className="text-white">症状：</strong>控制台持续输出 <code className="px-1 py-0.5 bg-slate-700 rounded text-red-300">[AllinONE] zumaGame 未就绪</code>，不断重试直到超时。</p>
            <p className="text-gray-300"><strong className="text-white">根因：</strong>集成脚本中最初使用 <code className="px-1 py-0.5 bg-slate-700 rounded">setTimeout</code> 轮询等待 <code className="px-1 py-0.5 bg-slate-700 rounded">window.zumaGame</code>，但游戏引擎因 SyntaxError（见 Q3）从未成功创建实例，轮询永远超时。</p>
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 font-medium mb-1">修复方案</p>
              <p className="text-gray-300 text-xs">1) 先确保游戏引擎代码无语法错误；2) 将游戏初始化代码改为 IIFE（立即执行函数）直接运行，放弃 <code className="px-1 py-0.5 bg-slate-700 rounded">window.onload</code>；3) 集成脚本直接通过 <code className="px-1 py-0.5 bg-slate-700 rounded">window.zumaGame</code> 访问游戏实例，无需轮询。</p>
            </div>
          </div>
        </details>

        {/* 常见疑问 */}
        <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
          <h5 className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            开发者自查清单
          </h5>
          <div className="space-y-2 text-xs">
            <label className="flex items-start gap-2 text-gray-300">
              <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500" readOnly />
              <span>ZIP 包只包含 1 个 <code className="px-1 py-0.5 bg-slate-700 rounded">index.html</code> 文件（无外部 JS/CSS 引用）</span>
            </label>
            <label className="flex items-start gap-2 text-gray-300">
              <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500" readOnly />
              <span>HTML 的 <code className="px-1 py-0.5 bg-slate-700 rounded">&lt;head&gt;</code> 中已添加 SDK 脚本引用</span>
            </label>
            <label className="flex items-start gap-2 text-gray-300">
              <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500" readOnly />
              <span>游戏引擎代码放在 <code className="px-1 py-0.5 bg-slate-700 rounded">&lt;body&gt;</code> 底部，集成脚本在其之后</span>
            </label>
            <label className="flex items-start gap-2 text-gray-300">
              <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500" readOnly />
              <span>游戏实例通过 <code className="px-1 py-0.5 bg-slate-700 rounded">window.zumaGame = zumaGame</code> 暴露给集成脚本</span>
            </label>
            <label className="flex items-start gap-2 text-gray-300">
              <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500" readOnly />
              <span>集成脚本监听了 <code className="px-1 py-0.5 bg-slate-700 rounded">allinone-item-redeemed</code> 事件</span>
            </label>
            <label className="flex items-start gap-2 text-gray-300">
              <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500" readOnly />
              <span>通关时发送了 <code className="px-1 py-0.5 bg-slate-700 rounded">GAME_EVENT</code> 给父窗口</span>
            </label>
          </div>
        </div>
      </div>
    ),
  };

  const codeSnippets = {
    integration: `(function() {
  'use strict';
  var REDEEM_ITEMS = [
    { itemId: 'difficulty_reducer', effectType: 'difficulty_reducer', name: '🐸 难度降低', quantity: 1, effects: { multiplier: 0.6 } },
    { itemId: 'score_boost',       effectType: 'score_boost',       name: '🌟 分数翻倍',  quantity: 1, effects: { multiplier: 2 } },
    { itemId: 'extra_life',        effectType: 'extra_life',         name: '❤️ 清除弹珠', quantity: 1, effects: {} },
    { itemId: 'time_bonus',        effectType: 'time_bonus',         name: '⏱️ 大量清除', quantity: 1, effects: {} },
  ];
  var g = window.zumaGame;
  if (!g) { console.warn('[AllinONE] zumaGame 未就绪'); return; }
  // [推荐] 使用 SDK Effect Registry (redeemItems 自动注入兑换条)
  if (typeof AllinONEGame !== 'undefined') {
    var sdk = new AllinONEGame({ gameId: 'zuma-mode-b-test', debug: true, redeemItems: REDEEM_ITEMS, skills: {} });
    sdk.registerEffect('difficulty_reducer', function(d) { g.moveSpeed = Math.max(1, Math.round(g.moveSpeed * 0.6)); });
    sdk.registerEffect('score_boost', function(d) { g.__scoreMultiplier = 2; });
    sdk.registerEffect('extra_life', function(d) { /* remove 5 marbles */ });
    sdk.registerEffect('time_bonus', function(d) { /* remove 10 marbles */ });
  } else {
    // [回退] 使用协议桥接层
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
  }
})();`,
  };

  return (
    <div className="flex gap-6">
      {/* 左侧导航 */}
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
      {/* 右侧内容 */}
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

  // 将较长模板字符串提取到 const 变量（避免 JSX 中内联模板字符串的解析歧义）
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

  const modeBTemplate = `// ═══════════════════════════════════════════════════════════════
// AllinONE Mode B — AI 标准集成模板
// 复制此模板并根据目标游戏替换 {{PLACEHOLDER}}
// ═══════════════════════════════════════════════════════════════

<!-- 第 1 步：在 <head> 中添加 SDK 引用 -->
<!-- 放在其他 <script> 之前，确保 SDK 最先加载 -->
<script src="https://cdn.allinone.game/sdk/v1/standard-sdk.js"></script>

<!-- 第 2 步：在 <body> 底部添加集成脚本 -->
<!-- 必须在游戏引擎脚本之后 -->
<script>
(function() {
  'use strict';

  // ──── 2a. 获取游戏实例（AI 需根据游戏代码替换变量名） ────
  var game = window.{{gameVariable}};
  if (!game) { console.warn('[AllinONE] 游戏实例未就绪'); return; }

  // ──── 2b. 定义道具清单 ────
  var REDEEM_ITEMS = [
    { itemId: '{{ITEM_ID_1}}',      effectType: '{{EFFECT_TYPE_1}}', name: '{{ITEM_NAME_1}}', desc: '{{ITEM_DESC_1}}' },
    { itemId: '{{ITEM_ID_2}}',      effectType: '{{EFFECT_TYPE_2}}', name: '{{ITEM_NAME_2}}', desc: '{{ITEM_DESC_2}}' },
  ];

  // ──── 2c. 声明协议信息 ────
  window.AllinONE = window.AllinONE || {};
  window.AllinONE.__PROTOCOL_MODE__ = 'integrated';
  window.AllinONE.__GAME_ID__ = '{{GAME_ID}}';
  window.AllinONE.__ITEMS__ = REDEEM_ITEMS;

  // ──── 2d. 发送 PROTOCOL:READY ────
  window.parent.postMessage({
    type: 'PROTOCOL:READY',
    protocolVersion: '1.0.0',
    mode: 'integrated',
    gameId: '{{GAME_ID}}',
    supportedActions: ['start', 'pause', 'resume', 'redeem'],
    supportedSchemas: REDEEM_ITEMS.map(function(i) { return i.effectType; }),
    timestamp: Date.now(),
  }, '*');

  // ──── 2e. [推荐] 通过 SDK Effect Registry 注册效果（兑换门控） ────
  // 效果处理器仅在兑换码验证通过后由 SDK 内部调用
  // ❌ 不再使用裸露的 applyEffect()，防止绕过兑换直接调用
  if (typeof AllinONEGame !== 'undefined') {
    var sdk = new AllinONEGame({
      gameId: '{{GAME_ID}}',
      debug: true,
      redeemItems: REDEEM_ITEMS,     // SDK 自动注入兑换条
      skills: {},
    });

    sdk.registerEffect('{{EFFECT_TYPE_1}}', function(data) {
      console.log('[AllinONE] 兑换验证通过:', data.effectType);
      // AI 需根据目标游戏的变量名修改处理器内容
      // data.effects 包含配置的效果参数
      var wasRunning = game.isStart || game.isPlaying || !game.isPaused;
      if (typeof game.stop === 'function') game.stop();
      // TODO: 在此实现道具效果
      if (wasRunning && typeof game.start === 'function') game.start();
    });

    sdk.registerEffect('{{EFFECT_TYPE_2}}', function(data) {
      console.log('[AllinONE] 兑换验证通过:', data.effectType);
      var wasRunning = game.isStart || game.isPlaying || !game.isPaused;
      if (typeof game.stop === 'function') game.stop();
      // TODO: 在此实现道具效果
      if (wasRunning && typeof game.start === 'function') game.start();
    });
  } else {
    // ──── [回退] 协议桥接层模式（SDK 不可用时） ────
    window.AllinONE = window.AllinONE || {};
    window.AllinONE.__PROTOCOL_MODE__ = 'integrated';
    window.AllinONE.__GAME_ID__ = '{{GAME_ID}}';
    window.AllinONE.__ITEMS__ = REDEEM_ITEMS;
    window.parent.postMessage({
      type: 'PROTOCOL:READY',
      protocolVersion: '1.0.0',
      mode: 'integrated',
      gameId: '{{GAME_ID}}',
      supportedActions: ['start', 'pause', 'resume', 'redeem'],
      supportedSchemas: REDEEM_ITEMS.map(function(i) { return i.effectType; }),
      timestamp: Date.now(),
    }, '*');

    // [已废弃] 裸露的 applyEffect — 无法防止绕过兑换直接调用
    function applyEffect(itemId) {
      console.log('[AllinONE] 执行道具效果:', itemId);
      var wasRunning = game.isStart || game.isPlaying || !game.isPaused;
      if (typeof game.stop === 'function') game.stop();
      switch (itemId) {
        case 'difficulty_reducer':
          if (typeof game.moveSpeed !== 'undefined') game.moveSpeed = Math.max(1, Math.round(game.moveSpeed * 0.6));
          else if (typeof game.speed !== 'undefined') game.speed = Math.max(0.5, game.speed * 0.6);
          break;
        case 'score_boost': game.__scoreMultiplier = 2; break;
        case 'extra_life':
          if (typeof game.lives !== 'undefined') game.lives += 1;
          else if (typeof game.life !== 'undefined') game.life += 1;
          else if (typeof game.health !== 'undefined') game.health = Math.min(game.maxHealth || 100, game.health + 20);
          break;
        case 'time_bonus':
          if (typeof game.time !== 'undefined') game.time += 30;
          else if (typeof game.timer !== 'undefined') game.timer += 30;
          else if (typeof game.countdown !== 'undefined') game.countdown += 30;
          break;
      }
      if (wasRunning && typeof game.start === 'function') game.start();
    }

    window.addEventListener('allinone-item-redeemed', function(e) { applyEffect(e.detail.itemId); });
    window.addEventListener('allinone:item-redeemed', function(e) { applyEffect(e.detail.itemId); });
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'REDEEM_RESULT' && event.data.data && event.data.data.success) {
        applyEffect(event.data.data.itemId);
      }
    });
  }

  try {
    Object.defineProperty(game, 'score', {
      get: function() { return game._score || 0; },
      set: function(v) {
        var m = game.__scoreMultiplier || 1;
        if (m > 1 && v > (game._score || 0)) {
          game._score += (v - (game._score || 0)) * m;
        } else {
          game._score = v;
        }
        if (typeof game.updateScore === 'function') {
          game.updateScore(game._score);
        } else if (typeof game.updateScoreDisplay === 'function') {
          game.updateScoreDisplay(game._score);
        }
      },
      configurable: true,
    });
  } catch(e) { console.warn('[AllinONE] 分数劫持失败:', e); }

  var origOnComplete = game.onComplete || game.updateFinal;
  if (typeof origOnComplete === 'function') {
    game.updateFinal = function(isFinal) {
      origOnComplete(isFinal);
      if (isFinal) {
        window.parent.postMessage({
          type: 'GAME_EVENT',
          event: 'GAME_COMPLETE',
          data: { score: game.score || 0 },
          gameId: '{{GAME_ID}}',
          timestamp: Date.now(),
        }, '*');
      }
    };
  }

  console.log('[AllinONE] Mode B 集成完成, 道具:', REDEEM_ITEMS.length + ' 种');
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
          <p className="text-gray-400 text-xs mt-2">💡 Mode A 的核心原理：平台在发布时向 HTML 头部注入 <strong className="text-white">Effect Engine</strong>，该引擎通过 monkey-patch <code className="px-1 py-0.5 bg-slate-700 rounded">requestAnimationFrame</code>、<code className="px-1 py-0.5 bg-slate-700 rounded">performance.now()</code>、<code className="px-1 py-0.5 bg-slate-700 rounded">Date.now()</code> 等 API，实现帧级拦截。同时注入兑换条 UI 和 SDK。AI 无需手动实现这些。</p>
        </div>
      </div>
    ),

    'sdk-pattern': (
      <div className="space-y-4 text-sm">
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
          <h5 className="text-cyan-400 font-semibold mb-2">Mode B — AI 标准集成模板</h5>
          <p className="text-gray-300 mb-3">以下是 AI 需要复制并适配到目标游戏的标准代码模板。所有 <code className="px-1 py-0.5 bg-slate-700 rounded text-cyan-300">{'{{PLACEHOLDER}}'}</code> 需要根据目标游戏的实际代码替换。</p>
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
            <p><strong className="text-white">1. 查找游戏实例：</strong>搜索 <code className="px-1 py-0.5 bg-slate-700 rounded">new Game</code>、<code className="px-1 py-0.5 bg-slate-700 rounded">new Phaser.Game</code>、<code className="px-1 py-0.5 bg-slate-700 rounded">const app</code>、<code className="px-1 py-0.5 bg-slate-700 rounded">var game</code> 等关键字。将找到的实例变量赋值给 <code className="px-1 py-0.5 bg-slate-700 rounded">{'window.{{gameVariable}}'}</code>。</p>
            <p><strong className="text-white">2. 定义道具：</strong>与用户确认道具列表。每种道具需要唯一的 <code className="px-1 py-0.5 bg-slate-700 rounded">itemId</code> 和 <code className="px-1 py-0.5 bg-slate-700 rounded">effectType</code>。</p>
            <p><strong className="text-white">3. 实现 applyEffect：</strong>根据每个 <code className="px-1 py-0.5 bg-slate-700 rounded">effectType</code>，找到游戏中对应的变量/方法进行修改。参考下方「变量映射表」。</p>
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
                <tr>
                  <td className="py-2 px-3 text-purple-300 font-mono">difficulty_reducer</td>
                  <td className="py-2 px-3 text-white">降低难度 / 减速</td>
                  <td className="py-2 px-3 text-gray-400"><code>moveSpeed, speed, difficulty, gameSpeed, velocity, fallSpeed, dropSpeed</code></td>
                  <td className="py-2 px-3 text-gray-400">乘以 0.5~0.7</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-purple-300 font-mono">speed_boost</td>
                  <td className="py-2 px-3 text-white">加速</td>
                  <td className="py-2 px-3 text-gray-400"><code>speed, moveSpeed, animationSpeed, frameRate, tickRate</code></td>
                  <td className="py-2 px-3 text-gray-400">乘以 1.3~1.5</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-purple-300 font-mono">score_boost</td>
                  <td className="py-2 px-3 text-white">分数翻倍</td>
                  <td className="py-2 px-3 text-gray-400"><code>score, points, totalScore, combo, multiplier, scoreMultiplier</code></td>
                  <td className="py-2 px-3 text-gray-400">劫持 score setter / 修改 multiplier</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-purple-300 font-mono">extra_life</td>
                  <td className="py-2 px-3 text-white">额外生命</td>
                  <td className="py-2 px-3 text-gray-400"><code>life, lives, health, hp, hitPoints, playerHealth, playerLives</code></td>
                  <td className="py-2 px-3 text-gray-400">增加值（+1~+5）</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-purple-300 font-mono">time_bonus</td>
                  <td className="py-2 px-3 text-white">时间奖励</td>
                  <td className="py-2 px-3 text-gray-400"><code>time, timer, countdown, remaining, timeLeft, gameTime, levelTime</code></td>
                  <td className="py-2 px-3 text-gray-400">增加值（+10~+30s）</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-purple-300 font-mono">custom</td>
                  <td className="py-2 px-3 text-white">自定义</td>
                  <td className="py-2 px-3 text-gray-400">——</td>
                  <td className="py-2 px-3 text-gray-400">透传数据，游戏自行处理</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
          <h5 className="text-yellow-400 font-semibold mb-2">变量查找策略（按优先级）</h5>
          <ol className="list-decimal pl-4 space-y-1.5 text-gray-400 text-xs">
            <li>直接属性访问：<code className="px-1 py-0.5 bg-slate-700 rounded">game.moveSpeed</code>、<code className="px-1 py-0.5 bg-slate-700 rounded">game.speed</code>（最高优先级，直接可见）</li>
            <li>通过 getter/setter：<code className="px-1 py-0.5 bg-slate-700 rounded">Object.defineProperty(game, 'score', {'{ set: ... }'})</code>（需劫持）</li>
            <li>通过方法调用：<code className="px-1 py-0.5 bg-slate-700 rounded">game.setSpeed()</code>、<code className="px-1 py-0.5 bg-slate-700 rounded">game.addScore()</code>（调用已有方法）</li>
            <li>通过原型链：<code className="px-1 py-0.5 bg-slate-700 rounded">Game.prototype.speed</code>（框架级游戏如 Phaser）</li>
            <li>全局变量扫描（最后手段）：遍历 <code className="px-1 py-0.5 bg-slate-700 rounded">window</code> 对象查找匹配关键字</li>
          </ol>
        </div>
      </div>
    ),

    'protocol-spec': (
      <div className="space-y-4 text-sm">
        <div className="p-4 bg-slate-700/20 rounded-xl border border-slate-700/50">
          <h5 className="text-white font-semibold mb-3">协议通信规范</h5>
          <p className="text-gray-400 mb-3 text-xs">所有通信通过 <code className="px-1 py-0.5 bg-slate-700 rounded">window.parent.postMessage()</code> 进行。以下是 AI 需要实现的完整协议：</p>

          <div className="space-y-3">
            <div className="p-3 bg-slate-900 rounded-lg">
              <p className="text-cyan-400 font-medium text-xs mb-1">① PROTOCOL:READY（游戏 → 平台）</p>
              <p className="text-gray-400 text-xs mb-1">游戏就绪后立即发送，声明协议能力和支持的 Schema。</p>
              <pre className="text-xs text-gray-500 font-mono">{'window.parent.postMessage({\n' +
'  type: \'PROTOCOL:READY\',\n' +
'  protocolVersion: \'1.0.0\',\n' +
'  mode: \'integrated\',\n' +
'  gameId: \'{GAME_ID}\',\n' +
'  supportedActions: [\'start\', \'pause\', \'resume\', \'redeem\'],\n' +
'  supportedSchemas: [\'difficulty_reducer\', \'score_boost\', \'...\'],\n' +
'  timestamp: Date.now(),\n' +
'}, \'*\');'}</pre>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg">
              <p className="text-cyan-400 font-medium text-xs mb-1">② REDEEM_RESULT（平台 → 游戏）</p>
              <p className="text-gray-400 text-xs mb-1">平台验证兑换码后返回结果。SDK Effect Registry 自动处理，效果仅在兑换验证后调用。</p>
              <pre className="text-xs text-gray-500 font-mono">{`// [推荐] SDK Effect Registry（兑换门控，效果仅由 SDK 内部调用）
// sdk.registerEffect('difficulty_reducer', function(data) { /* 效果逻辑 */ });

// [已废弃] 裸露的 applyEffect — 无法防止绕过兑换直接调用
window.addEventListener('allinone-item-redeemed', function(e) {
  applyEffect(e.detail.itemId);
});
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'REDEEM_RESULT') {
    if (event.data.data.success) {
      applyEffect(event.data.data.itemId);
    }
  }
});`}</pre>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg">
              <p className="text-cyan-400 font-medium text-xs mb-1">③ GAME_EVENT（游戏 → 平台，触发奖励）</p>
              <p className="text-gray-400 text-xs mb-1">游戏在关键节点发送事件，平台据此发放凭证奖励。</p>
              <pre className="text-xs text-gray-500 font-mono">{gameEventCodeText}</pre>
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
          <h5 className="text-green-400 font-semibold mb-2">道具兑换数据流（AI 需理解）</h5>
          <pre className="text-xs text-gray-400 font-mono leading-relaxed">{`[玩家] 点击 🎁 → 输入兑换码 → [SDK/桥接层] → 平台验证
                                                    │
                                          ┌─────────┴─────────┐
                                          │  成功             │  失败
                                          ▼                   ▼
                              REDEEM_RESULT + success:true   提示错误
                                          │
                              ┌───────────┴───────────┐
                              ▼                       ▼
                    REDEEM_RESULT (postMessage)   CustomEvent 触发
                    SDK 内部捕获                    allinone-item-redeemed
                              │                       │
                              └───────────┬───────────┘
                                          ▼
                        [推荐] SDK Effect Registry
                        sdk.applyRegisteredEffect()
                        仅在兑换验证后执行
                                          │
                                  ┌───────┴───────┐
                                  ▼               ▼
                          Mode A (自动)    Mode B (游戏方实现 via registerEffect)
                          Effect Engine     注册在 SDK 中的处理器
                          帧级拦截执行        兑换门控保护`}</pre>
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
              <span><strong className="text-white">自合一：</strong>所有 JS/CSS 必须内联到单个 <code className="px-1 py-0.5 bg-slate-700 rounded">index.html</code>。严禁外部文件引用。平台通过 srcdoc iframe 加载，外部引用会 404。</span>
            </div>
            <div className="flex items-start gap-2 text-gray-300">
              <span className="text-red-400 font-bold flex-shrink-0">[必须]</span>
              <span><strong className="text-white">游戏实例暴露：</strong>通过 <code className="px-1 py-0.5 bg-slate-700 rounded">{'window.{{variable}} = instance'}</code> 将游戏实例暴露到全局。集成脚本通过 <code className="px-1 py-0.5 bg-slate-700 rounded">{'window.{{variable}}'}</code> 访问游戏。</span>
            </div>
            <div className="flex items-start gap-2 text-gray-300">
              <span className="text-red-400 font-bold flex-shrink-0">[必须]</span>
              <span><strong className="text-white">脚本顺序：</strong>body 底部必须是：① 游戏引擎脚本 → ② 集成脚本。集成脚本必须在游戏引擎执行之后。</span>
            </div>
            <div className="flex items-start gap-2 text-gray-300">
              <span className="text-yellow-400 font-bold flex-shrink-0">[避免]</span>
              <span><strong className="text-white">不要手写 minify 代码。</strong>使用原始可读代码内联。minify 容易引入语法错误。</span>
            </div>
            <div className="flex items-start gap-2 text-gray-300">
              <span className="text-yellow-400 font-bold flex-shrink-0">[避免]</span>
              <span><strong className="text-white">不要依赖 window.onload。</strong>脚本在 <code className="px-1 py-0.5 bg-slate-700 rounded">&lt;/body&gt;</code> 前执行时 DOM 已就绪，直接运行即可。</span>
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
                  'HTML 中是否没有任何 <link rel="stylesheet" href="..."> 或 <script src="./...">？',
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

        <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
          <h5 className="text-cyan-400 font-semibold mb-2">常见 AI 错误模式</h5>
          <div className="space-y-2 text-xs text-gray-400">
            <p><span className="text-red-400">✗</span> 只修改了 HTML 但没内联 JS → 试玩时 404</p>
            <p><span className="text-red-400">✗</span> 集成脚本中用了 <code className="px-1 py-0.5 bg-slate-700 rounded">window.onload</code> → 和在 <code className="px-1 py-0.5 bg-slate-700 rounded">&lt;/body&gt;</code> 前执行冲突</p>
            <p><span className="text-red-400">✗</span> 使用 <code className="px-1 py-0.5 bg-slate-700 rounded">document.write()</code> 注入脚本 → srcdoc 中不会执行</p>
            <p><span className="text-red-400">✗</span> 集成脚本中游戏变量名拼写错误（如 <code className="px-1 py-0.5 bg-slate-700 rounded">zumaGame</code> 写为 <code className="px-1 py-0.5 bg-slate-700 rounded">zuma</code>）→ 兑换无效果</p>
            <p><span className="text-green-400">✓</span> <strong className="text-white">推荐做法：</strong>始终在集成脚本开头加 <code className="px-1 py-0.5 bg-slate-700 rounded">{'if (!window.{{variable}}) return console.warn(\'...\');'}</code> 进行防御性检查</p>
          </div>
        </div>
      </div>
    ),
  };



  return (
    <div className="flex gap-6">
      {/* 左侧导航 */}
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

      {/* 右侧内容 */}
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
                将 Mode B 所有规范内容（集成模板、变量映射表、协议规范、约束条件、验证清单）打包为一个 <code className="px-1 py-0.5 bg-amber-500/10 rounded text-amber-300">.md</code> 文件。
                直接发给 AI 助手，AI 即可根据文档自动完成游戏代码修改。
              </p>
            </div>
            <button
              onClick={() => {
                const content = `# AllinONE Mode B AI Skill 规范\n\n` +
                  `## 说明\n` +
                  `本文档包含 AllinONE 平台 Mode B（SDK 集成模式）的游戏技能集成规范。\n` +
                  `AI 助手需要阅读此文档并按照要求修改游戏代码，使其支持 Mode B 道具兑换功能。\n\n` +
                  `## AI 执行指令\n` +
                  `1. 分析用户提供的游戏代码（HTML/JS/CSS）\n` +
                  `2. 按照 Mode B 规范修改代码\n` +
                  `3. 确保修改后的游戏在平台的 srcdoc iframe 中正常运行\n` +
                  `4. 所有代码内联到单个 HTML 文件中\n\n` +
                  `## Mode B 标准集成模板\n\`\`\`html\n${modeBTemplate}\n\`\`\`\n\n` +
                  `## 效果类型 → 游戏变量映射表\n\n` +
                  `| effectType | 语义 | 扫描关键词 | 修改方式 |\n` +
                  `|------------|------|------------|----------|\n` +
                  `| difficulty_reducer | 降低难度/减速 | moveSpeed, speed, difficulty, gameSpeed, velocity, fallSpeed, dropSpeed | 乘以 0.5~0.7 |\n` +
                  `| score_boost | 分数加倍 | score, points, totalScore, gameScore, coinCount | 劫持 setter 或设置 multiplier |\n` +
                  `| extra_life | 增加生命 | lives, life, health, hp, heart, remainingLives | 增量+1 |\n` +
                  `| skip_level | 跳过关卡 | level, stage, currentLevel, round | 设置到下一关 |\n` +
                  `| time_bonus | 增加时间 | time, timer, countdown, remaining, timeLeft, gameTime, levelTime | 增加值（+10~+30s） |\n` +
                  `| custom | 自定义 | —— | 透传数据，游戏自行处理 |\n\n` +
                  `## 协议通信规范\n\n` +
                  `### PROTOCOL:READY（游戏 → 平台）\n` +
                  `游戏就绪后立即发送：\n` +
                  `\`\`\`javascript\n` +
                  `window.parent.postMessage({\n` +
                  `  type: 'PROTOCOL:READY',\n` +
                  `  protocolVersion: '1.0.0',\n` +
                  `  mode: 'integrated',\n` +
                  `  gameId: '{GAME_ID}',\n` +
                  `  supportedActions: ['start', 'pause', 'resume', 'redeem'],\n` +
                  `  supportedSchemas: ['difficulty_reducer', 'score_boost', '...'],\n` +
                  `  timestamp: Date.now(),\n` +
                  `}, '*');\n` +
                  `\`\`\`\n\n` +
                  `### REDEEM_RESULT（平台 → 游戏）\n` +
                  `[推荐] 使用 SDK Effect Registry（兑换门控）：\n` +
                  `\`\`\`javascript\n` +
                  `var sdk = new AllinONEGame({ gameId: '{GAME_ID}', redeemItems: REDEEM_ITEMS });\n` +
                  `sdk.registerEffect('difficulty_reducer', function(data) {\n` +
                  `  // 兑换验证通过后由 SDK 内部调用\n` +
                  `});\n` +
                  `\`\`\`\n\n` +
                  `[已废弃] 裸露的 applyEffect 模式（无法防止绕过兑换）：\n` +
                  `\`\`\`javascript\n` +
                  `window.addEventListener('allinone-item-redeemed', function(e) {\n` +
                  `  applyEffect(e.detail.itemId);\n` +
                  `});\n` +
                  `window.addEventListener('message', function(event) {\n` +
                  `  if (event.data && event.data.type === 'REDEEM_RESULT' && event.data.data.success) {\n` +
                  `    applyEffect(event.data.data.itemId);\n` +
                  `  }\n` +
                  `});\n` +
                  `\`\`\`\n\n` +
                  `### GAME_EVENT（游戏 → 平台）\n` +
                  `\`\`\`javascript\n` +
                  `window.parent.postMessage({\n` +
                  `  type: 'GAME_EVENT',\n` +
                  `  event: 'GAME_COMPLETE',\n` +
                  `  data: { score: {score}, level: {level} },\n` +
                  `  gameId: '{GAME_ID}',\n` +
                  `  timestamp: Date.now(),\n` +
                  `}, '*');\n` +
                  `\`\`\`\n\n` +
                  `## 关键约束\n\n` +
                  `- [必须] 自合一：所有 JS/CSS 必须内联到单个 index.html\n` +
                  `- [必须] 游戏实例暴露：通过 window.{{variable}} = instance 暴露到全局\n` +
                  `- [必须] 脚本顺序：body 底部必须是 ① 游戏引擎脚本 → ② 集成脚本\n` +
                  `- [避免] 不要手写 minify 代码\n` +
                  `- [避免] 不要依赖 window.onload\n\n` +
                  `## 验证清单\n\n` +
                  `- [ ] 所有 <script> 和 </script> 标签是否成对匹配？\n` +
                  `- [ ] 游戏实例是否通过 window.{{variable}} 暴露？\n` +
                  `- [ ] 集成脚本是否在游戏引擎脚本之后？\n` +
                  `- [ ] 是否删除了所有的 window.onload 改用直接执行？\n` +
                  `- [ ] SDK script 引用是否在 <head> 中？\n` +
                  `- [ ] 是否监听了 allinone-item-redeemed 事件？\n` +
                  `- [ ] 是否发送了 PROTOCOL:READY？\n` +
                  `- [ ] 通关逻辑是否发送了 GAME_EVENT / GAME_COMPLETE？\n` +
                  `- [ ] ZIP 中是否只包含 index.html？\n` +
                  `- [ ] HTML 中是否没有任何外部文件引用？\n` +
                  `- [ ] 所有外部资源 URL 是否使用 https:// 完整 URL？\n`;
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

export default function SkillWizardPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [generatedResult, setGeneratedResult] = useState<SkillGenerationResult | null>(null);
  const [copied, setCopied] = useState(false);
  
  // 视图模式：向导或管理器
  const [managerTab, setManagerTab] = useState<ManagerTab>('zuma-demo');
  const [gameId, setGameId] = useState('');
  const [gameName, setGameName] = useState('');
  
  // 项目文件相关状态
  const [projectFiles, setProjectFiles] = useState<File[]>([]);
  const [extractedFiles, setExtractedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 从发布中心接收的文件（如果通过路由跳转过来）
  // 或从URL参数获取gameId和tab
  useEffect(() => {
    const state = location.state as { fromPublishing?: boolean; files?: File[] } | null;
    if (state?.fromPublishing && state?.files) {
      setProjectFiles(state.files);
      processFiles(state.files);
    }
    
    // 解析URL参数
    const searchParams = new URLSearchParams(location.search);
    const urlGameId = searchParams.get('gameId');
    const urlTab = searchParams.get('tab');
    
    if (urlGameId) {
      setGameId(urlGameId);
      // 尝试获取游戏名称
      import('@/services/publishedGameService').then(({ getPublishedGame }) => {
        const game = getPublishedGame(urlGameId);
        if (game) {
          setGameName(game.name);
        }
      });
    }
    
    if (urlTab === 'redeem') {
      // redirect to wizard - redeem tab removed
    }
  }, [location.state, location.search]);

  // 处理文件上传
  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    try {
      const extracted: UploadedFile[] = [];
      
      for (const file of files) {
        if (file.name.toLowerCase().endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          for (const [path, zipEntry] of Object.entries(zip.files)) {
            if (zipEntry.dir || path.startsWith('__MACOSX') || path.startsWith('.')) continue;
            const content = await zipEntry.async('uint8array');
            extracted.push({
              name: path.split('/').pop() || path,
              path: path,
              size: zipEntry.size,
              type: '',
              content: content,
            });
          }
        } else {
          extracted.push({
            name: file.name,
            path: file.name,
            size: file.size,
            type: file.type,
            content: await file.text(),
          });
        }
      }
      
      setExtractedFiles(extracted);
    } catch (err) {
      console.error('文件处理失败:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setProjectFiles(files);
      processFiles(files);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files);
      setProjectFiles(files);
      processFiles(files);
    }
  }, []);

  const handleGenerate = (result: SkillGenerationResult) => {
    setGeneratedResult(result);
  };

  // 从生成结果中获取 skill 类型的代码内容
  const getGeneratedCode = () => {
    if (!generatedResult?.files) return '';
    const skillFile = generatedResult.files.find(f => f.type === 'skill');
    return skillFile?.content || '';
  };

  // 将生成的代码应用到项目并跳转到发布中心
  const handleContinuePublish = async () => {
    if (!generatedResult || projectFiles.length === 0) {
      // 如果没有项目文件，只跳转到发布中心
      navigate('/publishing-center');
      return;
    }

    // 创建包含代码的新 ZIP 文件
    const zip = new JSZip();
    
    // 添加原始项目文件
    extractedFiles.forEach(file => {
      if (typeof file.content === 'string') {
        zip.file(file.path, file.content);
      } else {
        zip.file(file.path, file.content);
      }
    });
    
    // 添加生成的 Skills 代码文件
    const code = getGeneratedCode();
    if (code) {
      zip.file('src/skills/allinone.skills.ts', code);
      zip.file('allinone.config.json', JSON.stringify({
        game: { id: 'custom-game', name: 'Custom Game', version: '1.0.0' },
        platform: { type: 'standard' },
        skills: { wallet: true, store: true },
        generatedAt: new Date().toISOString(),
      }, null, 2));
    }
    
    // 生成新的 ZIP Blob
    const content = await zip.generateAsync({ type: 'blob' });
    const newFile = new File([content], 'game-with-skills.zip', { type: 'application/zip' });
    
    // 跳转到发布中心，携带处理后的文件
    navigate('/publishing-center', {
      state: { 
        fromSkillWizard: true, 
        files: [newFile],
        skillConfig: generatedResult,
      }
    });
  };

  const handleCopyCode = () => {
    const code = getGeneratedCode();
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadCode = () => {
    const code = getGeneratedCode();
    if (code) {
      const blob = new Blob([code], { type: 'text/typescript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `game.skills.ts`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/"
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">返回首页</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span className="font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Skill Wizard
            </span>
          </div>
        </div>
      </header>

      {/* 页面主体 */}
      <main className="container mx-auto px-4 py-8">
        {/* 页面标题区 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 mb-4">
            <Wand2 className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              开发者工具
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
            🎮 Skill 配置向导
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-6">
            SDK 代码生成向导，配置 Skills 后自动生成集成代码，支持一键发布到发布中心。
          </p>
          
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-md">
            <Code className="w-4 h-4" />
            SDK 配置向导
          </span>
        </div>

        {/* ========== SDK 配置向导 ========== */}
        <>
            {/* 项目文件上传区（可选） */}
            <div className="max-w-7xl mx-auto mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-slate-200/30 dark:shadow-slate-900/30 border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-cyan-500" />
                    游戏项目文件（可选）
                  </h2>
                  {projectFiles.length > 0 && (
                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      已上传 {projectFiles.length} 个文件
                    </span>
                  )}
                </div>
                <div className="p-6">
                  {projectFiles.length === 0 ? (
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                        dragActive 
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10' 
                          : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".zip"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                      <p className="text-slate-700 dark:text-slate-300 mb-1">
                        拖拽游戏项目 ZIP 文件到此处
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        或点击上传，生成代码后将自动注入到项目中
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {projectFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileCode className="w-5 h-5 text-cyan-500" />
                            <span className="text-slate-700 dark:text-slate-300">{file.name}</span>
                            <span className="text-xs text-slate-500">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setProjectFiles(prev => prev.filter((_, i) => i !== index));
                              setExtractedFiles([]);
                            }}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 hover:border-cyan-500 hover:text-cyan-500 transition-colors"
                      >
                        + 添加更多文件
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 两步布局：向导 + 结果 */}
            <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
              {/* 左侧：Skill 配置向导 */}
              <div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-indigo-500" />
                      配置你的 Skills
                    </h2>
                  </div>
                  <div className="p-6">
                    <SkillConfigWizard 
                      className="w-full"
                      onGenerate={handleGenerate}
                    />
                  </div>
                </div>
              </div>

              {/* 右侧：生成的代码预览 */}
              <div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200 dark:border-slate-700 overflow-hidden h-full flex flex-col">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Code className="w-5 h-5 text-indigo-500" />
                      生成的代码
                    </h2>
                    {generatedResult && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyCode}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                            copied
                              ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                          )}
                        >
                          {copied ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              复制
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleDownloadCode}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:hover:bg-indigo-500/30 transition-all"
                        >
                          <Download className="w-4 h-4" />
                          下载
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-0 overflow-hidden">
                    {generatedResult ? (
                      <pre className="w-full h-full p-6 overflow-auto text-sm bg-slate-900 text-slate-50 font-mono leading-relaxed">
                        <code>{getGeneratedCode()}</code>
                      </pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-12">
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-4">
                          <Code className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-center">
                          在左侧配置你的 Skills 并点击生成<br />
                          代码将显示在这里
                        </p>
                      </div>
                    )}
                  </div>
                  {generatedResult && (
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-slate-500 dark:text-slate-400">
                          状态: <span className="font-medium text-green-600 dark:text-green-400">{generatedResult.success ? '生成成功' : '生成失败'}</span>
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          文件: <span className="font-medium text-slate-700 dark:text-slate-300">{generatedResult.files.length} 个</span>
                        </span>
                      </div>
                      {generatedResult.warnings.length > 0 && (
                        <div className="mb-3 text-xs text-yellow-600 dark:text-yellow-400">
                          警告: {generatedResult.warnings.join(', ')}
                        </div>
                      )}
                      {/* 继续发布按钮 */}
                      <button
                        onClick={handleContinuePublish}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-cyan-500/25"
                      >
                        <Rocket className="w-4 h-4" />
                        {projectFiles.length > 0 ? '应用代码并继续发布' : '前往发布中心'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>

          {/* ===== 参考面板 ===== */}
          <div className="mt-8 space-y-4 max-w-7xl mx-auto">
            <ReferencePanel title="实际案例 - Zuma Mode B 集成" icon={<Gamepad2 className="w-4 h-4" />}>
              <ZumaDemoContent />
            </ReferencePanel>
            <ReferencePanel title="AI Skill 规范" icon={<Terminal className="w-4 h-4" />}>
              <SkillIntegrationGuide />
            </ReferencePanel>
          </div>

        {/* 使用说明 */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-2xl p-8 border border-indigo-100 dark:border-indigo-500/20">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              如何使用生成的代码？
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-indigo-500">1</span>
                </div>
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">复制代码</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  点击"复制"按钮将生成的 TypeScript 代码复制到剪贴板
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-indigo-500">2</span>
                </div>
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">创建文件</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  在你的游戏项目中创建一个 <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">.ts</code> 文件并粘贴代码
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-indigo-500">3</span>
                </div>
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">导入使用</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  导入初始化好的 SkillManager，调用 <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">skill()</code> 方法使用 Skills
                </p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-indigo-200 dark:border-indigo-500/20">
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                已有游戏？前往 <Link to="/publishing-center" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">发布中心</Link> 一键发布你的游戏到 AllinONE 平台
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

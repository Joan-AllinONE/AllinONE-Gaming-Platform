/**
 * 导出 New Day API 调试日志
 * 在浏览器控制台运行此脚本获取详细日志
 */

// 获取所有控制台日志
function exportLogs() {
  // 重新发送一次同步请求并捕获日志
  console.log('========================================');
  console.log('开始导出调试日志...');
  console.log('========================================');
  
  // 提示用户复制日志
  console.log('请执行以下步骤：');
  console.log('1. 在道具仓库中点击"同步到 New Day"按钮');
  console.log('2. 等待同步完成（成功或失败）');
  console.log('3. 按 F12 打开控制台');
  console.log('4. 右键点击控制台中的日志');
  console.log('5. 选择"另存为..."保存日志文件');
  console.log('6. 将日志文件发送给 New Day 团队');
  console.log('========================================');
}

// 自动导出当前页面的日志
function autoExport() {
  const logs = [];
  
  // 保存原始 console 方法
  const originalLog = console.log;
  const originalError = console.error;
  
  // 拦截日志
  console.log = function(...args) {
    logs.push({ type: 'log', timestamp: new Date().toISOString(), data: args });
    originalLog.apply(console, args);
  };
  
  console.error = function(...args) {
    logs.push({ type: 'error', timestamp: new Date().toISOString(), data: args });
    originalError.apply(console, args);
  };
  
  // 5秒后导出日志
  setTimeout(() => {
    const logText = logs.map(log => {
      return `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.data.map(d => 
        typeof d === 'object' ? JSON.stringify(d, null, 2) : String(d)
      ).join(' ')}`;
    }).join('\n');
    
    // 创建下载链接
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newday-api-debug-${new Date().toISOString().replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('日志已导出！');
  }, 5000);
}

// 显示当前可以复制的日志
function showCopyableLogs() {
  console.log('%c New Day API 调试日志导出工具 ', 'background: #222; color: #bada55; font-size: 20px;');
  console.log('');
  console.log('请按以下步骤操作：');
  console.log('1. 在道具仓库中点击"同步到 New Day"按钮');
  console.log('2. 查看控制台输出的详细日志');
  console.log('3. 右键点击控制台空白处');
  console.log('4. 选择"另存为..."保存日志');
  console.log('');
  console.log('或者复制以下区域的日志：');
  console.log('========================================');
}

// 运行
showCopyableLogs();

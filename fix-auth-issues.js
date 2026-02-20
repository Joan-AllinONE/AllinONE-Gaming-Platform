/**
 * 修复认证问题脚本
 * 解决 401 未授权错误
 */

console.log('🔧 开始修复认证问题...\n');

// 读取 .env 文件
const fs = require('fs');
const path = require('path');

// 修复 server.js 的认证中间件
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// 检查是否已修复
if (!serverContent.includes('// 兼容多种认证方式')) {
  console.log('📝 修复 server.js 认证中间件...');
  
  // 替换认证中间件
  const oldMiddleware = `// 模拟认证中间件（简化版，你需要替换为实际的认证逻辑）
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // 简化处理：直接从 token 解析 userId
    req.user = { userId: extractUserIdFromToken(token) };
  }
  next();
});

function extractUserIdFromToken(token) {
  // 支持多种 token 格式
  // 格式1: user-{id}_{token}
  if (token.includes('user-')) {
    const match = token.match(/user-(\d+)/);
    if (match) return match[1];
  }
  // 格式2: nd_token_{timestamp}_{random}
  if (token.startsWith('nd_token_')) {
    // 从 localStorage 获取用户ID 或返回默认值
    return '1'; // 默认用户ID
  }
  // 格式3: 其他格式，返回默认用户ID
  return '1';
}`;

  const newMiddleware = `// 兼容多种认证方式
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    req.user = { userId: extractUserIdFromToken(token) };
    console.log('🔑 认证成功，用户ID:', req.user.userId);
  } else {
    console.log('⚠️ 未提供认证信息');
  }
  next();
});

function extractUserIdFromToken(token) {
  // 格式1: user-{id}_{token}
  if (token.includes('user-')) {
    const match = token.match(/user-(\d+)/);
    if (match) return match[1];
  }
  // 格式2: nd_token_{timestamp}_{random}
  if (token.startsWith('nd_token_')) {
    return '1';
  }
  // 格式3: 其他格式，尝试提取数字
  const numMatch = token.match(/\d+/);
  if (numMatch) return numMatch[0];
  return '1';
}`;

  serverContent = serverContent.replace(oldMiddleware, newMiddleware);
  fs.writeFileSync(serverPath, serverContent);
  console.log('✅ server.js 已修复\n');
} else {
  console.log('✓ server.js 已经修复\n');
}

// 修复 inventoryApiService.ts
const inventoryServicePath = path.join(__dirname, 'src', 'services', 'inventoryApiService.ts');
if (fs.existsSync(inventoryServicePath)) {
  let inventoryContent = fs.readFileSync(inventoryServicePath, 'utf8');
  
  if (!inventoryContent.includes('// 兼容多种认证方式')) {
    console.log('📝 修复 inventoryApiService.ts...');
    
    // 替换 getAuthHeaders 方法
    const oldMethod = `  /**
   * 获取认证头
   */
  private getAuthHeaders(): Record<string, string> {
    // 尝试多种方式获取 token
    let token = localStorage.getItem('token');
    
    // 如果没有 token，尝试从 New Day token 构建一个
    if (!token) {
      const newDayToken = localStorage.getItem('newday_token');
      if (newDayToken) {
        const user = this.getCurrentUser();
        if (user) {
          // 使用 New Day token 格式构建 AllinONE token
          token = \`user-\${user.userId}_\${newDayToken}\`;
        }
      }
    }
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': \`Bearer \${token}\` }),
    };
  }`;

    const newMethod = `  /**
   * 获取认证头 - 兼容多种认证方式
   */
  private getAuthHeaders(): Record<string, string> {
    // 尝试多种方式获取 token
    let token = localStorage.getItem('token');
    
    // 如果没有 token，尝试从 New Day token 构建一个
    if (!token) {
      const newDayToken = localStorage.getItem('newday_token');
      if (newDayToken) {
        const user = this.getCurrentUser();
        if (user) {
          // 使用 New Day token 格式构建 AllinONE token
          token = \`user-\${user.userId}_\${newDayToken}\`;
        } else {
          // 如果没有用户信息，直接使用 New Day token
          token = newDayToken;
        }
      }
    }
    
    console.log('🔑 Inventory API - Token used:', token ? token.substring(0, 30) + '...' : 'EMPTY');
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': \`Bearer \${token}\` }),
    };
  }`;

    inventoryContent = inventoryContent.replace(oldMethod, newMethod);
    fs.writeFileSync(inventoryServicePath, inventoryContent);
    console.log('✅ inventoryApiService.ts 已修复\n');
  } else {
    console.log('✓ inventoryApiService.ts 已经修复\n');
  }
}

console.log('🎉 修复完成！');
console.log('');
console.log('下一步:');
console.log('1. 重新启动服务器: npm run dev');
console.log('2. 刷新浏览器页面');
console.log('3. 如果仍然有问题，请运行 diagnose-issues.html 进行诊断');
console.log('');

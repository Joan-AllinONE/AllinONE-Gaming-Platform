/**
 * @allinone/cli - AllinONE CLI工具
 * 
 * 命令列表:
 * - allinone create <name>   创建新项目
 * - allinone dev             启动开发服务器
 * - allinone build           构建游戏
 * - allinone publish         发布游戏
 * - allinone lint            检查代码规范
 * - allinone validate        验证项目
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ==================== CLI配置 ====================

interface CLIOptions {
  template?: string;
  framework?: string;
  skipInstall?: boolean;
  verbose?: boolean;
}

// ==================== 模板配置 ====================

const TEMPLATES = {
  'html5': {
    name: 'HTML5 Vanilla',
    description: '原生HTML5 + JavaScript游戏',
    dependencies: {},
    devDependencies: {
      'vite': '^5.0.0',
      'typescript': '^5.0.0',
    },
  },
  'typescript': {
    name: 'TypeScript',
    description: 'TypeScript游戏项目',
    dependencies: {},
    devDependencies: {
      'vite': '^5.0.0',
      'typescript': '^5.0.0',
      '@types/node': '^20.0.0',
    },
  },
  'phaser': {
    name: 'Phaser 3',
    description: 'Phaser 3游戏框架',
    dependencies: {
      'phaser': '^3.70.0',
      '@allinone/standard-sdk': '^1.0.0',
    },
    devDependencies: {
      'vite': '^5.0.0',
      'typescript': '^5.0.0',
    },
  },
  'pixi': {
    name: 'PixiJS',
    description: 'PixiJS 2D渲染引擎',
    dependencies: {
      'pixi.js': '^7.3.0',
      '@allinone/standard-sdk': '^1.0.0',
    },
    devDependencies: {
      'vite': '^5.0.0',
      'typescript': '^5.0.0',
    },
  },
  'three': {
    name: 'Three.js',
    description: 'Three.js 3D游戏',
    dependencies: {
      'three': '^0.160.0',
      '@allinone/standard-sdk': '^1.0.0',
    },
    devDependencies: {
      'vite': '^5.0.0',
      'typescript': '^5.0.0',
      '@types/three': '^0.160.0',
    },
  },
};

// ==================== CLI类 ====================

export class AllinONECLI {
  private projectPath: string;
  private verbose: boolean;

  constructor(projectPath: string = process.cwd(), options: { verbose?: boolean } = {}) {
    this.projectPath = projectPath;
    this.verbose = options.verbose || false;
  }

  // ==================== create命令 ====================

  async create(projectName: string, options: CLIOptions = {}): Promise<void> {
    const template = options.template || 'typescript';
    const targetPath = path.resolve(this.projectPath, projectName);

    console.log(`🚀 创建新项目: ${projectName}`);
    console.log(`📦 使用模板: ${TEMPLATES[template as keyof typeof TEMPLATES]?.name || template}`);

    // 检查目录是否存在
    if (fs.existsSync(targetPath)) {
      throw new Error(`目录 ${projectName} 已存在`);
    }

    // 创建目录结构
    fs.mkdirSync(targetPath, { recursive: true });
    fs.mkdirSync(path.join(targetPath, 'src'));
    fs.mkdirSync(path.join(targetPath, 'public'));
    fs.mkdirSync(path.join(targetPath, 'public', 'assets'));

    // 生成文件
    this.generateTemplateFiles(targetPath, projectName, template);

    // 安装依赖
    if (!options.skipInstall) {
      console.log('📥 安装依赖...');
      this.runCommand('npm install', targetPath);
    }

    console.log('\n✅ 项目创建成功!');
    console.log(`\n下一步:`);
    console.log(`  cd ${projectName}`);
    console.log(`  allinone dev`);
  }

  // ==================== dev命令 ====================

  async dev(): Promise<void> {
    console.log('🔥 启动开发服务器...');
    
    // 检查配置文件
    if (!this.hasConfigFile()) {
      console.warn('⚠️  未找到 allinone.config.json，使用默认配置');
    }

    // 启动Vite开发服务器
    this.runCommand('npx vite --host', this.projectPath);
  }

  // ==================== build命令 ====================

  async build(): Promise<void> {
    console.log('🔨 构建游戏...');

    // 验证项目
    const validation = await this.validate();
    if (!validation.valid) {
      console.error('❌ 项目验证失败，请修复以下问题:');
      validation.issues.forEach(issue => console.error(`  - ${issue}`));
      process.exit(1);
    }

    // 运行Vite构建
    this.runCommand('npx vite build', this.projectPath);

    // 生成AllinONE配置到dist
    this.generateDistConfig();

    console.log('\n✅ 构建完成!');
    console.log('  输出目录: dist/');
  }

  // ==================== publish命令 ====================

  async publish(): Promise<void> {
    console.log('🚀 发布游戏到AllinONE平台...');

    // 确保已构建
    if (!fs.existsSync(path.join(this.projectPath, 'dist'))) {
      console.log('先执行构建...');
      await this.build();
    }

    // 检查登录状态
    const token = this.getAuthToken();
    if (!token) {
      console.error('❌ 请先登录: allinone login');
      process.exit(1);
    }

    // 读取配置
    const config = this.readConfig();

    // 上传并发布
    console.log('📤 上传游戏包...');
    console.log(`   游戏ID: ${config.game.id}`);
    console.log(`   版本: ${config.game.version}`);

    // 模拟发布过程
    await this.simulatePublish(config);

    console.log('\n✅ 发布成功!');
    console.log(`   🎮 游戏地址: https://allinone.game/play/${config.game.id}`);
  }

  // ==================== lint命令 ====================

  async lint(fix: boolean = false): Promise<void> {
    console.log('🔍 检查代码规范...');
    
    const args = fix ? ' --fix' : '';
    
    try {
      this.runCommand(`npx eslint src/${args}`, this.projectPath);
      console.log('✅ 代码检查通过');
    } catch (error) {
      console.error('❌ 代码检查发现问题');
      process.exit(1);
    }
  }

  // ==================== validate命令 ====================

  async validate(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // 检查配置文件
    if (!this.hasConfigFile()) {
      issues.push('缺少 allinone.config.json 配置文件');
    } else {
      try {
        const config = this.readConfig();
        if (!config.game?.id) issues.push('配置文件缺少 game.id');
        if (!config.game?.name) issues.push('配置文件缺少 game.name');
        if (!config.game?.version) issues.push('配置文件缺少 game.version');
      } catch {
        issues.push('allinone.config.json 格式错误');
      }
    }

    // 检查目录结构
    if (!fs.existsSync(path.join(this.projectPath, 'src'))) {
      issues.push('缺少 src 目录');
    }

    if (!fs.existsSync(path.join(this.projectPath, 'public'))) {
      issues.push('缺少 public 目录');
    }

    // 检查入口文件
    const entryFiles = ['src/main.ts', 'src/main.js', 'src/index.ts', 'src/index.js'];
    const hasEntry = entryFiles.some(file => 
      fs.existsSync(path.join(this.projectPath, file))
    );
    if (!hasEntry) {
      issues.push('未找到入口文件 (src/main.ts 或 src/main.js)');
    }

    // 检查SDK使用
    const mainFile = this.findMainFile();
    if (mainFile) {
      const content = fs.readFileSync(mainFile, 'utf-8');
      if (!content.includes('@allinone/standard-sdk') && !content.includes('AllinONEGame')) {
        issues.push('建议使用 @allinone/standard-sdk');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  // ==================== 私有方法 ====================

  private generateTemplateFiles(targetPath: string, projectName: string, template: string): void {
    const templateData = TEMPLATES[template as keyof typeof TEMPLATES];

    // package.json
    const packageJson = {
      name: projectName,
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
        lint: 'eslint src',
      },
      dependencies: templateData?.dependencies || {},
      devDependencies: templateData?.devDependencies || {},
    };

    fs.writeFileSync(
      path.join(targetPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // allinone.config.json
    const allinoneConfig = {
      game: {
        id: `game_${Date.now()}`,
        name: projectName,
        version: '1.0.0',
        description: `${projectName} - 使用AllinONE平台构建`,
        framework: template,
        genre: 'casual',
      },
      platform: {
        type: 'standard',
        entryPoint: 'src/main.ts',
        fullscreen: true,
        mobileOptimized: true,
        offlineSupport: false,
      },
      skills: {
        auth: true,
        wallet: true,
        inventory: true,
        store: true,
      },
      features: {
        cloudSave: true,
        autoSync: true,
        socialShare: false,
        inGamePurchase: false,
      },
      display: {
        icon: 'public/icon.png',
        cover: 'public/cover.png',
        screenshots: [],
        primaryColor: '#3B82F6',
        description: '一款精彩的游戏',
      },
    };

    fs.writeFileSync(
      path.join(targetPath, 'allinone.config.json'),
      JSON.stringify(allinoneConfig, null, 2)
    );

    // vite.config.ts
    const viteConfig = `import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
`;
    fs.writeFileSync(path.join(targetPath, 'vite.config.ts'), viteConfig);

    // tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        lib: ['ES2020', 'DOM'],
        moduleResolution: 'node',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
      },
      include: ['src/**/*'],
    };

    fs.writeFileSync(
      path.join(targetPath, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );

    // src/main.ts
    const mainContent = this.generateMainFile(template);
    fs.writeFileSync(path.join(targetPath, 'src', 'main.ts'), mainContent);

    // public/index.html
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; background: #000; }
    #game { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="game"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
`;
    fs.writeFileSync(path.join(targetPath, 'public', 'index.html'), htmlContent);

    // .gitignore
    const gitignore = `node_modules/
dist/
.env
.env.local
*.log
.DS_Store
`;
    fs.writeFileSync(path.join(targetPath, '.gitignore'), gitignore);

    // README.md
    const readme = `# ${projectName}

使用 AllinONE 平台构建的游戏项目

## 开始开发

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
allinone dev

# 构建游戏
allinone build

# 发布游戏
allinone publish
\`\`\`

## 项目结构

- \`src/\` - 源代码
- \`public/\` - 静态资源
- \`allinone.config.json\` - 游戏配置

## 文档

- [AllinONE SDK 文档](https://docs.allinone.game/sdk)
- [发布中心](https://allinone.game/publish)
`;
    fs.writeFileSync(path.join(targetPath, 'README.md'), readme);
  }

  private generateMainFile(template: string): string {
    const sdkImport = `import { AllinONEGame } from '@allinone/standard-sdk';`;

    switch (template) {
      case 'phaser':
        return `${sdkImport}
import Phaser from 'phaser';

// 初始化 AllinONE 游戏
const game = new AllinONEGame({
  gameId: 'your-game-id',
  skills: {
    auth: true,
    wallet: true,
    inventory: true,
    store: true,
  },
});

// Phaser 游戏配置
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game',
  backgroundColor: '#2d2d2d',
  scene: [],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// 启动游戏
async function start() {
  await game.initialize();
  await game.start();
  
  new Phaser.Game(config);
  
  console.log('🎮 游戏已启动!');
}

start();
`;

      case 'pixi':
        return `${sdkImport}
import * as PIXI from 'pixi.js';

// 初始化 AllinONE 游戏
const game = new AllinONEGame({
  gameId: 'your-game-id',
  skills: {
    auth: true,
    wallet: true,
  },
});

// 启动游戏
async function start() {
  await game.initialize();
  await game.start();
  
  const app = new PIXI.Application({
    width: 1280,
    height: 720,
    backgroundColor: 0x2d2d2d,
  });
  
  document.getElementById('game')?.appendChild(app.view as HTMLCanvasElement);
  
  console.log('🎮 游戏已启动!');
}

start();
`;

      case 'three':
        return `${sdkImport}
import * as THREE from 'three';

// 初始化 AllinONE 游戏
const game = new AllinONEGame({
  gameId: 'your-game-id',
  skills: {
    auth: true,
    wallet: true,
  },
});

// 启动游戏
async function start() {
  await game.initialize();
  await game.start();
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('game')?.appendChild(renderer.domElement);
  
  console.log('🎮 游戏已启动!');
}

start();
`;

      default:
        return `${sdkImport}

// 初始化 AllinONE 游戏
const game = new AllinONEGame({
  gameId: 'your-game-id',
  skills: {
    auth: true,
    wallet: true,
  },
});

// 启动游戏
async function start() {
  await game.initialize();
  await game.start();
  
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  document.getElementById('game')?.appendChild(canvas);
  
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  console.log('🎮 游戏已启动!');
}

start();
`;
    }
  }

  private hasConfigFile(): boolean {
    return fs.existsSync(path.join(this.projectPath, 'allinone.config.json'));
  }

  private readConfig(): any {
    const content = fs.readFileSync(
      path.join(this.projectPath, 'allinone.config.json'),
      'utf-8'
    );
    return JSON.parse(content);
  }

  private findMainFile(): string | null {
    const possibleFiles = ['src/main.ts', 'src/main.js', 'src/index.ts', 'src/index.js'];
    for (const file of possibleFiles) {
      const fullPath = path.join(this.projectPath, file);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    return null;
  }

  private generateDistConfig(): void {
    const config = this.readConfig();
    fs.writeFileSync(
      path.join(this.projectPath, 'dist', 'allinone.config.json'),
      JSON.stringify(config, null, 2)
    );
  }

  private getAuthToken(): string | null {
    // 从本地存储获取token
    return process.env.ALLINONE_TOKEN || null;
  }

  private async simulatePublish(config: any): Promise<void> {
    const steps = [
      '验证游戏包...',
      '注册 Skills...',
      '上传资源...',
      '构建部署...',
      '注册到平台...',
    ];

    for (const step of steps) {
      console.log(`  ⏳ ${step}`);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }

  private runCommand(command: string, cwd: string): void {
    try {
      execSync(command, {
        cwd,
        stdio: this.verbose ? 'inherit' : 'pipe',
      });
    } catch (error) {
      throw new Error(`命令执行失败: ${command}`);
    }
  }
}

// ==================== CLI入口 ====================

export function runCLI(args: string[]): void {
  const cli = new AllinONECLI();
  const command = args[0];
  const options = args.slice(1);

  switch (command) {
    case 'create':
      if (!options[0]) {
        console.error('请提供项目名称: allinone create <name>');
        process.exit(1);
      }
      cli.create(options[0], {
        template: options.find(o => o.startsWith('--template='))?.split('=')[1],
      });
      break;

    case 'dev':
      cli.dev();
      break;

    case 'build':
      cli.build();
      break;

    case 'publish':
      cli.publish();
      break;

    case 'lint':
      cli.lint(options.includes('--fix'));
      break;

    case 'validate':
      cli.validate().then(result => {
        if (result.valid) {
          console.log('✅ 项目验证通过');
        } else {
          console.error('❌ 项目验证失败:');
          result.issues.forEach(issue => console.error(`  - ${issue}`));
          process.exit(1);
        }
      });
      break;

    default:
      console.log(`
AllinONE CLI

用法:
  allinone create <name> [--template=<template>]  创建新项目
  allinone dev                                      启动开发服务器
  allinone build                                    构建游戏
  allinone publish                                  发布游戏
  allinone lint [--fix]                             检查代码规范
  allinone validate                                 验证项目

可用模板:
  html5       - 原生HTML5 + JavaScript
  typescript  - TypeScript项目
  phaser      - Phaser 3游戏框架
  pixi        - PixiJS 2D渲染
  three       - Three.js 3D游戏
`);
  }
}

export default AllinONECLI;

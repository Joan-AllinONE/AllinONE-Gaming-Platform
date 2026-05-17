/**
 * CloudBase 初始化模块
 * 统一初始化 CloudBase SDK，供全应用使用
 */
import cloudbase from '@cloudbase/js-sdk';

// CloudBase 配置
const CLOUDBASE_ENV = import.meta.env.VITE_CLOUDBASE_ENV || '';
const CLOUDBASE_ACCESS_KEY = import.meta.env.VITE_CLOUDBASE_ACCESS_KEY || '';

// 全局 app 实例
let app: cloudbase.app.App | null = null;
let initPromise: Promise<cloudbase.app.App> | null = null;

/**
 * 初始化 CloudBase
 * 应在应用启动时调用一次
 */
export async function initCloudBase(): Promise<cloudbase.app.App> {
  if (app) {
    return app;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    if (!CLOUDBASE_ENV) {
      console.warn('⚠️ VITE_CLOUDBASE_ENV 未配置，AI 功能将不可用');
      throw new Error('CloudBase env not configured');
    }

    const instance = cloudbase.init({
      env: CLOUDBASE_ENV,
      ...(CLOUDBASE_ACCESS_KEY && { accessKey: CLOUDBASE_ACCESS_KEY }),
    });

    // 匿名登录
    await instance.auth().signInAnonymously();
    console.log('✅ CloudBase 初始化成功');

    app = instance;
    return instance;
  })();

  return initPromise;
}

/**
 * 获取 CloudBase app 实例
 * 必须先调用 initCloudBase()
 */
export function getCloudBaseApp(): cloudbase.app.App {
  if (!app) {
    throw new Error('CloudBase not initialized. Call initCloudBase() first.');
  }
  return app;
}

/**
 * 检查 CloudBase 是否已初始化
 */
export function isCloudBaseReady(): boolean {
  return app !== null;
}

/**
 * 获取 AI 实例
 */
export function getAI() {
  const cloudbaseApp = getCloudBaseApp();
  return cloudbaseApp.ai();
}

/**
 * 创建 AI 模型
 * @param provider 模型提供商，默认 'hunyuan-exp'
 */
export function createAIModel(provider: string = 'hunyuan-exp') {
  const ai = getAI();
  return ai.createModel(provider);
}

export default {
  init: initCloudBase,
  getApp: getCloudBaseApp,
  isReady: isCloudBaseReady,
  getAI,
  createModel: createAIModel,
};

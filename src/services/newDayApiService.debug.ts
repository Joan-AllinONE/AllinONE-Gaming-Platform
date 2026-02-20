/**
 * New Day API 调试工具
 * 用于捕获和记录详细的 API 请求/响应信息
 */

export class NewDayApiDebugger {
  private logs: Array<{
    timestamp: string;
    type: 'request' | 'response' | 'error';
    data: any;
  }> = [];

  /**
   * 记录请求
   */
  logRequest(url: string, method: string, headers: any, body: any) {
    const log = {
      timestamp: new Date().toISOString(),
      type: 'request' as const,
      data: {
        url,
        method,
        headers: this.sanitizeHeaders(headers),
        body
      }
    };
    this.logs.push(log);
    console.log('📤 New Day API Request:', log);
  }

  /**
   * 记录响应
   */
  logResponse(status: number, statusText: string, data: any) {
    const log = {
      timestamp: new Date().toISOString(),
      type: 'response' as const,
      data: {
        status,
        statusText,
        body: data
      }
    };
    this.logs.push(log);
    console.log('📥 New Day API Response:', log);
  }

  /**
   * 记录错误
   */
  logError(error: any) {
    const log = {
      timestamp: new Date().toISOString(),
      type: 'error' as const,
      data: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    };
    this.logs.push(log);
    console.error('❌ New Day API Error:', log);
  }

  /**
   * 获取所有日志
   */
  getLogs() {
    return this.logs;
  }

  /**
   * 导出日志为 JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * 脱敏处理 headers（移除敏感信息）
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      const auth = sanitized.Authorization;
      sanitized.Authorization = auth.substring(0, 20) + '... [truncated]';
    }
    return sanitized;
  }
}

// 导出单例
export const newDayApiDebugger = new NewDayApiDebugger();

import { RawContent, AdaptedContent, PlatformMeta, PublishResult } from '../types';

/**
 * 平台 API 配置
 * 真实发布时需要各平台的凭证，通过环境变量或配置传入
 */
export interface PlatformConfig {
  /** 是否使用真实API（false = 模拟模式） */
  liveMode: boolean;
  /** 平台 Access Token / API Key */
  accessToken?: string;
  /** App ID / App Key */
  appId?: string;
  /** App Secret */
  appSecret?: string;
  /** API 基础地址 */
  apiBaseUrl?: string;
}

/**
 * 抽象平台适配器 — 策略模式基类
 * 新增平台：继承此类，实现所有抽象方法，然后在 adapter.factory.ts 注册即可
 *
 * 支持两种模式：
 * - 模拟模式 (liveMode=false): 返回模拟结果，用于开发和测试
 * - 真实模式 (liveMode=true): 调用平台实际 API 进行发布
 */
export abstract class BaseAdapter {
  abstract readonly meta: PlatformMeta;

  /** 平台配置（从环境变量加载） */
  protected config: PlatformConfig;

  constructor(config?: Partial<PlatformConfig>) {
    // 先用默认值初始化，子类meta可用后再加载环境变量
    this.config = {
      liveMode: process.env.LIVE_MODE === 'true',
      ...config,
    };
  }

  /** 初始化配置（在子类meta可用后调用） */
  protected initConfig(): void {
    const id = this.meta.id.toUpperCase();
    this.config = {
      ...this.config,
      accessToken: this.config.accessToken || process.env[`${id}_ACCESS_TOKEN`],
      appId: this.config.appId || process.env[`${id}_APP_ID`],
      appSecret: this.config.appSecret || process.env[`${id}_APP_SECRET`],
      apiBaseUrl: this.config.apiBaseUrl || process.env[`${id}_API_BASE_URL`],
    };
  }

  /** 将原始内容转换为平台专属格式 */
  abstract adapt(raw: RawContent): AdaptedContent;

  /**
   * 执行发布 — 根据 config.liveMode 选择模拟或真实发布
   */
  async publish(content: AdaptedContent): Promise<PublishResult> {
    if (!this.config.liveMode) {
      return this.simulatePublish(content);
    }
    return this.realPublish(content);
  }

  /** 真实发布到平台（子类实现具体API调用） */
  protected async realPublish(content: AdaptedContent): Promise<PublishResult> {
    // 默认实现：子类可覆盖以调用真实API
    // 如果未配置凭证，回退到模拟
    if (!this.config.accessToken) {
      console.warn(`[${this.meta.name}] 未配置 AccessToken，回退到模拟模式`);
      return this.simulatePublish(content);
    }

    // 子类应重写此方法调用真实平台API
    throw new Error(`${this.meta.name} 尚未实现真实发布接口`);
  }

  /** 模拟发布（开发测试用） */
  protected async simulatePublish(content: AdaptedContent): Promise<PublishResult> {
    await this.delay(600 + Math.random() * 400);
    return {
      platform: content.platform,
      success: true,
      message: `已${this.config.liveMode ? '' : '模拟'}发布到${this.meta.name}`,
      publishedUrl: `${this.getMockUrlPrefix()}${Date.now()}`,
      publishedAt: new Date().toISOString(),
    };
  }

  /** 获取模拟发布的URL前缀 */
  protected getMockUrlPrefix(): string {
    return `https://mock.${this.meta.id}.com/s/`;
  }

  // =============================================
  //  公共工具方法
  // =============================================

  /** 截断标题到最大长度 */
  protected truncateTitle(title: string, maxLen: number): string {
    if (title.length <= maxLen) return title;
    return title.slice(0, maxLen - 1) + '…';
  }

  /** 截断内容到最大长度 */
  protected truncateContent(content: string, maxLen: number): string {
    if (content.length <= maxLen) return content;
    return content.slice(0, maxLen - 3) + '...';
  }

  /** Markdown 转纯文本（最简实现） */
  protected markdownToPlain(md: string): string {
    return md
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[图片]')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/^[*-]\s+/gm, '• ')
      .replace(/^>\s+/gm, '');
  }

  /** 提取纯文本中的前 N 行作为摘要 */
  protected extractSummary(text: string, lines: number): string {
    return text.split('\n').slice(0, lines).join('\n');
  }

  /** 通用HTTP POST请求辅助 */
  protected async httpPost(url: string, body: any, headers?: Record<string, string>): Promise<any> {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.accessToken}`,
        ...headers,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '请求失败' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

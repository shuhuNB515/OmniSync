// ============================================================
// OmniSync 共享类型定义
// 扩展新平台时只需新增 Platform 枚举值即可
// ============================================================

/** 支持的平台枚举 — 扩展新平台在此添加 */
export enum Platform {
  WECHAT = 'wechat',           // 公众号
  ZHIHU = 'zhihu',             // 知乎
  BILIBILI = 'bilibili',       // B站
  XIAOHONGSHU = 'xiaohongshu', // 小红书
}

/** 平台元信息 */
export interface PlatformMeta {
  id: Platform;
  name: string;
  icon: string;
  maxTitleLength: number;
  maxContentLength: number;
  supportsImages: boolean;
  supportsVideo: boolean;
  supportsMarkdown: boolean;
  /** 内容格式要求说明 */
  formatTips: string;
}

/** 原始输入内容 */
export interface RawContent {
  title: string;
  content: string;       // 支持 Markdown
  images: string[];      // 图片URL列表
  videoUrl?: string;
  tags: string[];
  coverUrl?: string;
}

/** 单个平台的适配后内容 */
export interface AdaptedContent {
  platform: Platform;
  title: string;
  content: string;       // 已转为平台专属格式
  images: string[];
  videoUrl?: string;
  tags: string[];
  coverUrl?: string;
}

/** 发布请求 */
export interface PublishRequest {
  rawContent: RawContent;
  platforms: Platform[];
}

/** 单个平台发布结果 */
export interface PublishResult {
  platform: Platform;
  success: boolean;
  message: string;
  publishedUrl?: string;
  publishedAt?: string;
  /** 发布记录唯一ID（用于撤回/编辑） */
  recordId?: string;
}

export interface PublishResponse {
  results: PublishResult[];
  summary: {
    total: number;
    success: number;
    failed: number;
  };
}

/** 发布历史记录 */
export interface PublishRecord {
  id: string;
  platform: Platform;
  rawContent: RawContent;
  adaptedContent: AdaptedContent;
  result: PublishResult;
  status: 'published' | 'recalled';
  createdAt: string;
  recalledAt?: string;
}

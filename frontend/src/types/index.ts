// 与后端一致的类型定义

export enum Platform {
  WECHAT = 'wechat',
  ZHIHU = 'zhihu',
  BILIBILI = 'bilibili',
  XIAOHONGSHU = 'xiaohongshu',
}

export interface PlatformMeta {
  id: Platform;
  name: string;
  icon: string;
  maxTitleLength: number;
  maxContentLength: number;
  supportsImages: boolean;
  supportsVideo: boolean;
  supportsMarkdown: boolean;
  formatTips: string;
}

export interface RawContent {
  title: string;
  content: string;
  images: string[];
  videoUrl?: string;
  tags: string[];
  coverUrl?: string;
}

export interface AdaptedContent {
  platform: Platform;
  title: string;
  content: string;
  images: string[];
  videoUrl?: string;
  tags: string[];
  coverUrl?: string;
}

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

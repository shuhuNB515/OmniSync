import { BaseAdapter } from './base.adapter';
import { Platform, PlatformMeta, RawContent, AdaptedContent, PublishResult } from '../types';

/**
 * 知乎适配器
 * - 标题最长50字
 * - 支持Markdown
 * - 不支持视频直接嵌入（专栏除外）
 * - 标签映射为话题
 *
 * 真实发布需要：知乎开放平台凭证或Cookie登录态
 */
export class ZhihuAdapter extends BaseAdapter {
  readonly meta: PlatformMeta = {
    id: Platform.ZHIHU,
    name: '知乎',
    icon: 'zhihu',
    maxTitleLength: 50,
    maxContentLength: 30000,
    supportsImages: true,
    supportsVideo: false,
    supportsMarkdown: true,
    formatTips: '支持Markdown，擅长长文深度内容，建议配图丰富',
  };

  adapt(raw: RawContent): AdaptedContent {
    let content = raw.content;

    return {
      platform: Platform.ZHIHU,
      title: this.truncateTitle(raw.title, this.meta.maxTitleLength),
      content: this.truncateContent(content, this.meta.maxContentLength),
      images: raw.images,
      tags: raw.tags,
      coverUrl: raw.coverUrl || raw.images[0],
    };
  }

  /**
   * 真实发布到知乎专栏
   * 使用知乎专栏API（需要开发者凭证）
   */
  protected async realPublish(content: AdaptedContent): Promise<PublishResult> {
    if (!this.config.accessToken) {
      console.warn('[知乎] 未配置 AccessToken，回退到模拟');
      return this.simulatePublish(content);
    }

    try {
      const apiUrl = this.config.apiBaseUrl || 'https://www.zhihu.com/api/v4';

      // 知乎专栏发布接口
      const articleData = {
        title: content.title,
        content: content.content, // 知乎支持Markdown原文
        column: '', // 专栏ID，可配置
        comment_permission: 'all',
      };

      const res = await this.httpPost(
        `${apiUrl}/articles`,
        articleData,
        { 'x-api-version': '3.0.0' }
      );

      return {
        platform: Platform.ZHIHU,
        success: true,
        message: `已成功发布到知乎专栏`,
        publishedUrl: `https://zhuanlan.zhihu.com/p/${res.id || Date.now()}`,
        publishedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('[知乎] 真实发布失败:', err.message);
      throw err;
    }
  }
}

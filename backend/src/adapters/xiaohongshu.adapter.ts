import { BaseAdapter } from './base.adapter';
import { Platform, PlatformMeta, RawContent, AdaptedContent, PublishResult } from '../types';

/**
 * 小红书适配器
 * - 标题最长20字
 * - 正文最长1000字
 * - 不支持Markdown
 * - 表情符号友好
 * - 标签以 #话题 形式
 *
 * 真实发布需要：小红书创作者平台凭证
 */
export class XiaohongshuAdapter extends BaseAdapter {
  readonly meta: PlatformMeta = {
    id: Platform.XIAOHONGSHU,
    name: '小红书',
    icon: 'xiaohongshu',
    maxTitleLength: 20,
    maxContentLength: 1000,
    supportsImages: true,
    supportsVideo: true,
    supportsMarkdown: false,
    formatTips: '标题最多20字，正文最多1000字。图文必须1张以上。风格偏种草、轻松。',
  };

  adapt(raw: RawContent): AdaptedContent {
    let content = this.markdownToPlain(raw.content);

    const tagStr = raw.tags.length > 0
      ? '\n\n' + raw.tags.map(t => `#${t}`).join(' ')
      : '';

    const emojified = this.addXiaohongshuStyle(content);

    return {
      platform: Platform.XIAOHONGSHU,
      title: this.truncateTitle(raw.title, this.meta.maxTitleLength),
      content: this.truncateContent(emojified + tagStr, this.meta.maxContentLength),
      images: raw.images,
      videoUrl: raw.videoUrl,
      tags: raw.tags,
      coverUrl: raw.coverUrl || raw.images[0],
    };
  }

  /** 添加小红书风格标记 */
  private addXiaohongshuStyle(text: string): string {
    const paragraphs = text.split('\n').filter(p => p.trim());
    if (paragraphs.length === 0) return text;

    const emojis = ['✨', '📌', '💡', '🌟', '🔥', '💫', '🎯'];
    return paragraphs.map((p, i) => {
      if (i === 0) return p;
      if (i % 2 === 0) return `${emojis[i % emojis.length]} ${p}`;
      return p;
    }).join('\n\n');
  }

  /**
   * 真实发布到小红书
   * 使用小红书创作者平台API
   */
  protected async realPublish(content: AdaptedContent): Promise<PublishResult> {
    if (!this.config.accessToken) {
      console.warn('[小红书] 未配置 AccessToken，回退到模拟');
      return this.simulatePublish(content);
    }

    try {
      const apiUrl = this.config.apiBaseUrl || 'https://edith.xiaohongshu.com';

      // 小红书笔记发布接口
      const noteData = {
        type: content.videoUrl ? 'video' : 'normal',
        title: content.title,
        desc: content.content,
        topics: content.tags.map(t => ({ name: t })),
        image_list: content.images.map(url => ({ url })),
        ...(content.videoUrl ? { video: { url: content.videoUrl } } : {}),
      };

      const res = await this.httpPost(
        `${apiUrl}/api/sns/web/v1/note`,
        noteData,
        { 'x-s': '', 'x-t': '' } // 实际需要签名参数
      );

      if (res.code !== 0 && !res.success) {
        throw new Error(`小红书API错误: ${res.msg || res.message || JSON.stringify(res)}`);
      }

      return {
        platform: Platform.XIAOHONGSHU,
        success: true,
        message: `已成功发布到小红书笔记`,
        publishedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('[小红书] 真实发布失败:', err.message);
      throw err;
    }
  }
}

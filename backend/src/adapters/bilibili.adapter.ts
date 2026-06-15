import { BaseAdapter } from './base.adapter';
import { Platform, PlatformMeta, RawContent, AdaptedContent, PublishResult } from '../types';

/**
 * B站适配器
 * - 标题最长80字
 * - 内容以专栏/动态形式，支持富文本
 * - 核心是视频内容，图文为辅助
 *
 * 真实发布需要：B站开放平台凭证（AppKey + Access Token）
 */
export class BilibiliAdapter extends BaseAdapter {
  readonly meta: PlatformMeta = {
    id: Platform.BILIBILI,
    name: 'B站',
    icon: 'bilibili',
    maxTitleLength: 80,
    maxContentLength: 20000,
    supportsImages: true,
    supportsVideo: true,
    supportsMarkdown: false,
    formatTips: 'B站专栏不支持Markdown，需富文本。动态最多2000字。视频是B站核心',
  };

  adapt(raw: RawContent): AdaptedContent {
    let content = this.markdownToPlain(raw.content);

    if (raw.videoUrl) {
      content = content + '\n\n（关联视频见上方链接）';
    }

    return {
      platform: Platform.BILIBILI,
      title: this.truncateTitle(raw.title, this.meta.maxTitleLength),
      content: this.truncateContent(content, this.meta.maxContentLength),
      images: raw.images,
      videoUrl: raw.videoUrl,
      tags: raw.tags,
      coverUrl: raw.coverUrl || raw.images[0],
    };
  }

  /**
   * 真实发布到B站专栏
   * 使用B站专栏发布API
   */
  protected async realPublish(content: AdaptedContent): Promise<PublishResult> {
    if (!this.config.accessToken) {
      console.warn('[B站] 未配置 AccessToken，回退到模拟');
      return this.simulatePublish(content);
    }

    try {
      const apiUrl = this.config.apiBaseUrl || 'https://api.bilibili.com';

      // B站专栏发布接口
      const articleData = {
        title: content.title,
        content: content.content,
        summary: this.extractSummary(content.content, 2),
        words: content.content.length,
        category: 0,
        list_id: 0,
        tid: 0,
        reprint: 1,
        tags: content.tags.join(','),
        image_urls: content.images.join(','),
        origin_image_urls: content.images.join(','),
      };

      const res = await this.httpPost(
        `${apiUrl}/x/article/creative/draft/addupdate`,
        articleData
      );

      if (res.code !== 0) {
        throw new Error(`B站API错误: ${res.message || JSON.stringify(res)}`);
      }

      // 草稿创建成功后，提交发布
      await this.httpPost(
        `${apiUrl}/x/article/creative/article/submit`,
        { aid: res.data?.aid || res.aid }
      );

      return {
        platform: Platform.BILIBILI,
        success: true,
        message: `已成功发布到B站专栏${content.videoUrl ? '（含关联视频）' : ''}`,
        publishedUrl: `https://www.bilibili.com/read/cv${res.data?.aid || Date.now()}`,
        publishedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('[B站] 真实发布失败:', err.message);
      throw err;
    }
  }
}

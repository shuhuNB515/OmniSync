import { BaseAdapter } from './base.adapter';
import { Platform, PlatformMeta, RawContent, AdaptedContent, PublishResult } from '../types';

/**
 * 公众号适配器
 * - 标题最长64字
 * - 正文支持富文本（Markdown转HTML风格）
 * - 支持图片、封面
 * - 不支持视频直接嵌入
 *
 * 真实发布需要：微信公众号开发者凭证（AppID + AppSecret）
 * API文档：https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html
 */
export class WechatAdapter extends BaseAdapter {
  readonly meta: PlatformMeta = {
    id: Platform.WECHAT,
    name: '公众号',
    icon: 'wechat',
    maxTitleLength: 64,
    maxContentLength: 20000,
    supportsImages: true,
    supportsVideo: false,
    supportsMarkdown: true,
    formatTips: '支持Markdown格式，图片建议宽度900px，封面比例2.35:1',
  };

  adapt(raw: RawContent): AdaptedContent {
    let content = raw.content;

    return {
      platform: Platform.WECHAT,
      title: this.truncateTitle(raw.title, this.meta.maxTitleLength),
      content: this.truncateContent(content, this.meta.maxContentLength),
      images: raw.images,
      tags: raw.tags,
      coverUrl: raw.coverUrl,
    };
  }

  /**
   * 真实发布到微信公众号
   * 使用微信公众平台的草稿箱/发布API
   */
  protected async realPublish(content: AdaptedContent): Promise<PublishResult> {
    if (!this.config.accessToken || !this.config.appId || !this.config.appSecret) {
      console.warn('[公众号] 未配置完整凭证（APP_ID / APP_SECRET / ACCESS_TOKEN），回退到模拟');
      return this.simulatePublish(content);
    }

    try {
      // 步骤1：获取 access_token（如果传入的是永久token则跳过）
      // 实际场景中需要通过 appid + appsecret 获取临时 token

      // 步骤2：创建草稿（Draft API）
      const draftData = {
        articles: [{
          title: content.title,
          content: this.convertToWechatHtml(content),
          thumb_media_id: content.coverUrl || '',
          author: 'OmniSync',
          digest: this.extractSummary(this.markdownToPlain(content.content), 3),
          content_source_url: '',
          need_open_comment: 1,
          only_fans_can_comment: 0,
        }],
      };

      // 调用微信API：新增草稿
      const apiUrl = this.config.apiBaseUrl || 'https://api.weixin.qq.com/cgi-bin';
      const draftRes = await this.httpPost(
        `${apiUrl}/draft/add?access_token=${this.config.accessToken}`,
        draftData
      );

      if (draftRes.errcode && draftRes.errcode !== 0) {
        throw new Error(`微信API错误: ${draftRes.errmsg || JSON.stringify(draftRes)}`);
      }

      // 步骤3：发布草稿
      const publishRes = await this.httpPost(
        `${apiUrl}/freepublish/submit?access_token=${this.config.accessToken}`,
        { media_id: draftRes.media_id }
      );

      if (publishRes.errcode && publishRes.errcode !== 0) {
        throw new Error(`发布失败: ${publishRes.errmsg || JSON.stringify(publishRes)}`);
      }

      return {
        platform: Platform.WECHAT,
        success: true,
        message: `已成功发布到公众号（任务ID: ${publishRes.publish_id}）`,
        publishedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('[公众号] 真实发布失败:', err.message);
      throw err;
    }
  }

  /** 将适配内容转为微信公众号HTML格式 */
  private convertToWechatHtml(content: AdaptedContent): string {
    let html = content.content;

    // Markdown 基础转 HTML
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/^(-|\*) (.+)$/gm, '<li>$2</li>');

    // 插入图片
    content.images.forEach((img, i) => {
      html += `<p><img src="${img}" style="max-width:100%;" alt="图片${i+1}"/></p>`;
    });

    // 标签
    if (content.tags.length > 0) {
      html += `<p><strong>标签：</strong>${content.tags.join(' ')}</p>`;
    }

    return html;
  }
}

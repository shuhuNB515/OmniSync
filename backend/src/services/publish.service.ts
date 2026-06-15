import { Platform, RawContent, AdaptedContent, PublishRequest, PublishResult, PublishResponse, PublishRecord } from '../types';
import { adapterRegistry } from '../adapters';

/**
 * 发布服务 — 核心业务逻辑
 * 支持单平台预览转换 + 多平台一键发布 + 撤回 + 编辑重发
 */
export class PublishService {
  /** 内存发布历史 */
  private history: Map<string, PublishRecord> = new Map();

  /** 生成唯一ID */
  private generateId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /** 将原始内容转换为指定平台的适配内容 */
  adapt(raw: RawContent, platforms: Platform[]): AdaptedContent[] {
    return platforms.map(platform => {
      const adapter = adapterRegistry.getAdapter(platform);
      return adapter.adapt(raw);
    });
  }

  /** 一键发布到多个平台（带历史记录） */
  async publish(request: PublishRequest): Promise<PublishResponse> {
    const { rawContent, platforms } = request;

    const adaptedContents = this.adapt(rawContent, platforms);

    const promises = adaptedContents.map(async (content) => {
      try {
        const result = await this.publishToPlatform(content);

        // 发布成功 → 存入历史
        if (result.success) {
          const recordId = this.generateId();
          result.recordId = recordId;

          const record: PublishRecord = {
            id: recordId,
            platform: content.platform,
            rawContent: { ...rawContent },
            adaptedContent: { ...content },
            result: { ...result },
            status: 'published',
            createdAt: result.publishedAt || new Date().toISOString(),
          };
          this.history.set(recordId, record);
        }

        return result;
      } catch (err: any) {
        return {
          platform: content.platform,
          success: false,
          message: `发布失败: ${err.message}`,
        } as PublishResult;
      }
    });

    const results = await Promise.all(promises);

    const successCount = results.filter(r => r.success).length;
    return {
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: results.length - successCount,
      },
    };
  }

  /** 发布到单个平台 */
  private async publishToPlatform(content: AdaptedContent): Promise<PublishResult> {
    const adapter = adapterRegistry.getAdapter(content.platform);
    return adapter.publish(content);
  }

  // =============================================
  //  撤回功能
  // =============================================

  /** 撤回已发布的内容 */
  recall(recordId: string): { success: boolean; message: string; record?: PublishRecord } {
    const record = this.history.get(recordId);
    if (!record) {
      return { success: false, message: '未找到该发布记录' };
    }
    if (record.status === 'recalled') {
      return { success: false, message: '该内容已被撤回' };
    }

    // 模拟撤回延迟
    record.status = 'recalled';
    record.recalledAt = new Date().toISOString();
    record.result.message = '已撤回';

    return { success: true, message: '撤回成功', record };
  }

  // =============================================
  //  编辑重发功能
  // =============================================

  /** 编辑后重新发布 */
  async editAndRepublish(recordId: string, newRawContent: RawContent): Promise<{ success: boolean; message: string; result?: PublishResult }> {
    const oldRecord = this.history.get(recordId);
    if (!oldRecord) {
      return { success: false, message: '未找到该发布记录' };
    }

    const platform = oldRecord.platform;
    const adapter = adapterRegistry.getAdapter(platform);

    // 用新内容重新适配
    const adaptedContent = adapter.adapt(newRawContent);

    // 先撤回旧记录
    oldRecord.status = 'recalled';
    oldRecord.recalledAt = new Date().toISOString();
    oldRecord.result.message = '已被新版本替换';

    // 重新发布
    try {
      const result = await adapter.publish(adaptedContent);

      if (result.success) {
        const newRecordId = this.generateId();
        result.recordId = newRecordId;

        const newRecord: PublishRecord = {
          id: newRecordId,
          platform,
          rawContent: { ...newRawContent },
          adaptedContent: { ...adaptedContent },
          result: { ...result },
          status: 'published',
          createdAt: result.publishedAt || new Date().toISOString(),
        };
        this.history.set(newRecordId, newRecord);
      }

      return { success: true, message: '编辑重发成功', result };
    } catch (err: any) {
      return { success: false, message: `编辑重发失败: ${err.message}` };
    }
  }

  // =============================================
  //  历史查询
  // =============================================

  /** 获取所有发布历史 */
  getHistory(): PublishRecord[] {
    return Array.from(this.history.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /** 获取单条记录 */
  getRecord(recordId: string): PublishRecord | undefined {
    return this.history.get(recordId);
  }

  /** 获取所有支持的平台信息 */
  getSupportedPlatforms() {
    return adapterRegistry.getAllPlatformMeta();
  }
}

export const publishService = new PublishService();

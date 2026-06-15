import { Platform, PlatformMeta } from '../types';
import { BaseAdapter } from './base.adapter';
import { WechatAdapter } from './wechat.adapter';
import { ZhihuAdapter } from './zhihu.adapter';
import { BilibiliAdapter } from './bilibili.adapter';
import { XiaohongshuAdapter } from './xiaohongshu.adapter';

/**
 * 适配器注册中心 — 扩展新平台只需在此添加一行注册
 *
 * 【扩展指南】
 * 1. 在 types/index.ts 的 Platform 枚举中添加新值
 * 2. 创建 src/adapters/new-platform.adapter.ts 继承 BaseAdapter
 * 3. 在本文件的注册表 factoryMap 中添加一行映射
 * 4. 前端 components/PlatformSelector.vue 的 platforms 数组中添加元信息
 *
 * 无需修改任何其他文件，符合开闭原则。
 */
class AdapterRegistry {
  private adapters: Map<Platform, BaseAdapter> = new Map();

  constructor() {
    const wechat = new WechatAdapter();
    const zhihu = new ZhihuAdapter();
    const bilibili = new BilibiliAdapter();
    const xiaohongshu = new XiaohongshuAdapter();

    // 子类meta已初始化后，加载环境变量配置
    wechat.initConfig();
    zhihu.initConfig();
    bilibili.initConfig();
    xiaohongshu.initConfig();

    this.register(wechat);
    this.register(zhihu);
    this.register(bilibili);
    this.register(xiaohongshu);
  }

  private register(adapter: BaseAdapter): void {
    this.adapters.set(adapter.meta.id, adapter);
  }

  getAdapter(platform: Platform): BaseAdapter {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new Error(`未找到平台 "${platform}" 的适配器`);
    }
    return adapter;
  }

  /** 获取所有已注册平台的元信息 */
  getAllPlatformMeta(): PlatformMeta[] {
    return Array.from(this.adapters.values()).map(a => a.meta);
  }

  /** 获取所有已注册的平台枚举值 */
  getSupportedPlatforms(): Platform[] {
    return Array.from(this.adapters.keys());
  }
}

// 单例导出
export const adapterRegistry = new AdapterRegistry();

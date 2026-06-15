import { Router, Request, Response } from 'express';
import { publishService } from '../services/publish.service';
import { PublishRequest, RawContent } from '../types';

const router = Router();

/** GET /api/platforms — 获取所有支持的平台信息 */
router.get('/platforms', (_req: Request, res: Response) => {
  const platforms = publishService.getSupportedPlatforms();
  res.json({ success: true, data: platforms });
});

/** POST /api/preview — 预览适配后的内容 */
router.post('/preview', (req: Request, res: Response) => {
  const { rawContent, platforms } = req.body as PublishRequest;

  if (!rawContent || !platforms || !Array.isArray(platforms)) {
    return res.status(400).json({
      success: false,
      message: '缺少必要参数: rawContent, platforms',
    });
  }

  const adaptedContents = publishService.adapt(rawContent, platforms);
  res.json({ success: true, data: adaptedContents });
});

/** POST /api/publish — 一键发布到多个平台 */
router.post('/publish', async (req: Request, res: Response) => {
  const { rawContent, platforms } = req.body as PublishRequest;

  if (!rawContent || !platforms || !Array.isArray(platforms)) {
    return res.status(400).json({
      success: false,
      message: '缺少必要参数: rawContent, platforms',
    });
  }

  if (platforms.length === 0) {
    return res.status(400).json({
      success: false,
      message: '至少选择一个平台',
    });
  }

  try {
    const response = await publishService.publish({ rawContent, platforms });
    res.json(response);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || '发布服务异常',
    });
  }
});

/** POST /api/recall — 撤回已发布的内容 */
router.post('/recall', (req: Request, res: Response) => {
  const { recordId } = req.body;

  if (!recordId) {
    return res.status(400).json({
      success: false,
      message: '缺少必要参数: recordId',
    });
  }

  const result = publishService.recall(recordId);
  res.json(result);
});

/** POST /api/edit — 编辑后重新发布 */
router.post('/edit', async (req: Request, res: Response) => {
  const { recordId, newRawContent } = req.body as { recordId: string; newRawContent: RawContent };

  if (!recordId || !newRawContent) {
    return res.status(400).json({
      success: false,
      message: '缺少必要参数: recordId, newRawContent',
    });
  }

  const result = await publishService.editAndRepublish(recordId, newRawContent);
  res.json(result);
});

/** GET /api/history — 获取所有发布历史 */
router.get('/history', (_req: Request, res: Response) => {
  const history = publishService.getHistory();
  res.json({ success: true, data: history });
});

// =============================================
//  发布设置（模式 + 凭证）
// =============================================

interface PublishSettings {
  liveMode: boolean;
  credentials: {
    wechat: { appId?: string; appSecret?: string; accessToken?: string };
    zhihu: { accessToken?: string };
    bilibili: { appId?: string; appSecret?: string; accessToken?: string };
    xiaohongshu: { accessToken?: string };
  };
}

/** 内存存储的发布配置 */
let currentSettings: PublishSettings = {
  liveMode: process.env.LIVE_MODE === 'true',
  credentials: {
    wechat: {},
    zhihu: {},
    bilibili: {},
    xiaohongshu: {},
  },
};

/** GET /api/settings — 获取当前发布配置 */
router.get('/settings', (_req: Request, res: Response) => {
  // 返回凭证时脱敏（只显示后4位）
  const safeSettings = {
    ...currentSettings,
    credentials: {
      wechat: maskCreds(currentSettings.credentials.wechat),
      zhihu: maskCreds(currentSettings.credentials.zhihu),
      bilibili: maskCreds(currentSettings.credentials.bilibili),
      xiaohongshu: maskCreds(currentSettings.credentials.xiaohongshu),
    },
  };
  res.json({ success: true, data: safeSettings });
});

/** POST /api/settings — 更新发布配置 */
router.post('/settings', (req: Request, res: Response) => {
  const settings: Partial<PublishSettings> = req.body;

  if (typeof settings.liveMode === 'boolean') {
    currentSettings.liveMode = settings.liveMode;
    process.env.LIVE_MODE = String(settings.liveMode);
  }

  if (settings.credentials) {
    // 合并凭证（前端传来的会覆盖）
    const mergeCreds = <T extends Record<string, any>>(existing: T, incoming: Partial<T>): T => {
      for (const key of Object.keys(incoming)) {
        const val = incoming[key];
        if (val !== undefined && val !== '') {
          (existing as any)[key] = val;
        }
      }
      return existing;
    };

    if (settings.credentials.wechat)
      mergeCreds(currentSettings.credentials.wechat, settings.credentials.wechat);
    if (settings.credentials.zhihu)
      mergeCreds(currentSettings.credentials.zhihu, settings.credentials.zhihu);
    if (settings.credentials.bilibili)
      mergeCreds(currentSettings.credentials.bilibili, settings.credentials.bilibili);
    if (settings.credentials.xiaohongshu)
      mergeCreds(currentSettings.credentials.xiaohongshu, settings.credentials.xiaohongshu);

    // 同步到环境变量，让适配器能读取
    syncEnvFromSettings();
  }

  res.json({
    success: true,
    message: `已${currentSettings.liveMode ? '切换到真实发布' : '切换到模拟'}模式`,
    data: currentSettings,
  });
});

/** 凭证脱敏：只保留后4位 */
function maskCreds<T extends Record<string, any>>(creds: T): T {
  const masked: any = {};
  for (const [key, value] of Object.entries(creds)) {
    if (value && typeof value === 'string' && value.length > 4) {
      masked[key] = '*'.repeat(value.length - 4) + value.slice(-4);
    } else if (value) {
      masked[key] = '****';
    } else {
      masked[key] = '';
    }
  }
  return masked as T;
}

/** 将当前设置的凭证同步到 process.env */
function syncEnvFromSettings() {
  const c = currentSettings.credentials;
  if (c.wechat.appId) process.env.WECHAT_APP_ID = c.wechat.appId;
  if (c.wechat.appSecret) process.env.WECHAT_APP_SECRET = c.wechat.appSecret;
  if (c.wechat.accessToken) process.env.WECHAT_ACCESS_TOKEN = c.wechat.accessToken;
  if (c.zhihu.accessToken) process.env.ZHIHU_ACCESS_TOKEN = c.zhihu.accessToken;
  if (c.bilibili.appId) process.env.BILIBILI_APP_ID = c.bilibili.appId;
  if (c.bilibili.appSecret) process.env.BILIBILI_APP_SECRET = c.bilibili.appSecret;
  if (c.bilibili.accessToken) process.env.BILIBILI_ACCESS_TOKEN = c.bilibili.accessToken;
  if (c.xiaohongshu.accessToken) process.env.XIAOHONGSHU_ACCESS_TOKEN = c.xiaohongshu.accessToken;
}

export default router;

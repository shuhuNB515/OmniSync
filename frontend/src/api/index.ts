import type { PlatformMeta, RawContent, AdaptedContent, PublishResult, PublishResponse } from '../types';
import { Platform } from '../types';

// 生产环境使用后端实际地址，开发环境走 Vite 代理
const BASE = import.meta.env.VITE_API_BASE || '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timeoutId);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接或稍后重试');
    }
    if (err instanceof TypeError) {
      throw new Error('无法连接到后端服务，请确认后端已启动（运行 npm run dev:backend）');
    }
    throw new Error('网络请求失败，请检查网络连接');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '服务器响应异常' }));
    throw new Error(err.message || `服务器错误 (${res.status})`);
  }
  return res.json();
}

/** 获取所有支持的平台信息 */
export function fetchPlatforms(): Promise<{ success: boolean; data: PlatformMeta[] }> {
  return request(`${BASE}/platforms`);
}

/** 预览适配后的内容 */
export function previewContent(rawContent: RawContent, platforms: Platform[]): Promise<{ success: boolean; data: AdaptedContent[] }> {
  return request(`${BASE}/preview`, {
    method: 'POST',
    body: JSON.stringify({ rawContent, platforms }),
  });
}

/** 一键发布 */
export function publishContent(rawContent: RawContent, platforms: Platform[]): Promise<PublishResponse> {
  return request<PublishResponse>(`${BASE}/publish`, {
    method: 'POST',
    body: JSON.stringify({ rawContent, platforms }),
  });
}

/** 撤回已发布的内容 */
export function recallPublish(recordId: string): Promise<{ success: boolean; message: string }> {
  return request(`${BASE}/recall`, {
    method: 'POST',
    body: JSON.stringify({ recordId }),
  });
}

/** 编辑后重新发布 */
export function editAndRepublish(recordId: string, newRawContent: RawContent): Promise<{ success: boolean; message: string; result?: PublishResult }> {
  return request(`${BASE}/edit`, {
    method: 'POST',
    body: JSON.stringify({ recordId, newRawContent }),
  });
}

/** 获取发布历史 */
export function fetchHistory(): Promise<{ success: boolean; data: any[] }> {
  return request(`${BASE}/history`);
}

/** 获取当前发布配置 */
export function fetchSettings(): Promise<{ success: boolean; data: any }> {
  return request(`${BASE}/settings`);
}

/** 更新发布配置（模式 + 凭证） */
export function saveSettings(settings: { liveMode: boolean; credentials: any }): Promise<{ success: boolean; message: string; data?: any }> {
  return request(`${BASE}/settings`, {
    method: 'POST',
    body: JSON.stringify(settings),
  });
}

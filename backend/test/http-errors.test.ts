import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WechatAdapter } from '../src/adapters/wechat.adapter';

class HttpAdapter extends WechatAdapter {
  request() { return this.httpPost('https://example.com/api', { title: 'Example' }); }
}

for (const [body, message] of [
  ['{"error":"Rate limited"}', 'Rate limited'],
  ['null', 'HTTP 429'],
  ['{"error":{"message":"Nested error"}}', 'HTTP 429'],
  ['invalid json', '请求失败'],
] as const) {
  test(`HTTP failures handle response body: ${body}`, async t => {
    t.mock.method(globalThis, 'fetch', async () => new Response(body, { status: 429 }));
    await assert.rejects(new HttpAdapter({ liveMode: true }).request(), { message });
  });
}

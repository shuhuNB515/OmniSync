import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { adapterRegistry } from '../src/adapters';
import { PublishService } from '../src/services/publish.service';
import { Platform, type PublishResult, type RawContent } from '../src/types';

const original: RawContent = {
  title: 'Original title', content: 'Original body', images: ['https://example.com/image.png'], tags: ['news'],
};
const updated: RawContent = { ...original, title: 'Updated title', content: 'Updated body' };

async function seed(t: TestContext) {
  const service = new PublishService();
  const adapter = adapterRegistry.getAdapter(Platform.WECHAT);
  // Only replace the external publishing operation; adaptation and history stay real.
  t.mock.method(adapter, 'publish', async (): Promise<PublishResult> => ({
    platform: Platform.WECHAT, success: true, message: 'Published',
    publishedUrl: 'https://example.com/post/1', publishedAt: '2026-11-25T12:00:00Z',
  }));
  const response = await service.publish({ rawContent: original, platforms: [Platform.WECHAT] });
  const id = response.results[0].recordId!;
  return { service, adapter, id, before: structuredClone(service.getRecord(id)) };
}

test('a rejected replacement preserves the original record and reports failure', async t => {
  const { service, adapter, id, before } = await seed(t);
  t.mock.method(adapter, 'publish', async (): Promise<PublishResult> => ({
    platform: Platform.WECHAT, success: false, message: 'Quota exceeded',
  }));
  const response = await service.editAndRepublish(id, updated);
  assert.equal(response.success, false);
  assert.equal(response.result?.message, 'Quota exceeded');
  assert.deepEqual(service.getHistory(), [before]);
});

test('a thrown replacement error preserves the original record', async t => {
  const { service, adapter, id, before } = await seed(t);
  t.mock.method(adapter, 'publish', async () => { throw new Error('Network unavailable'); });
  const response = await service.editAndRepublish(id, updated);
  assert.equal(response.success, false);
  assert.match(response.message, /Network unavailable/);
  assert.deepEqual(service.getHistory(), [before]);
});

test('a successful replacement recalls the old record and records the new content', async t => {
  const { service, id } = await seed(t);
  const response = await service.editAndRepublish(id, updated);
  assert.equal(response.success, true);
  assert.equal(service.getHistory().length, 2);
  assert.equal(service.getRecord(id)?.status, 'recalled');
  assert.ok(service.getRecord(id)?.recalledAt);
  assert.notEqual(response.result?.recordId, id);
  const replacement = service.getRecord(response.result!.recordId!);
  assert.equal(replacement?.status, 'published');
  assert.deepEqual(replacement?.rawContent, updated);
  assert.equal(replacement?.adaptedContent.title, 'Updated title');
});

test('an unknown record cannot create a replacement', async () => {
  const service = new PublishService();
  const response = await service.editAndRepublish('missing', updated);
  assert.equal(response.success, false);
  assert.deepEqual(service.getHistory(), []);
});

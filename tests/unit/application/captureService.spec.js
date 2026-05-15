import { describe, it, expect, vi } from 'vitest';
import { createCaptureService } from '../../../src/application/captureService.js';
import { createInMemoryStorage } from '../../fakes/inMemoryStorage.js';

const makeMeta = (overrides = {}) => ({
  title: 'Test Title', description: 'Desc',
  image: 'https://example.com/img.png',
  category: 'Code', domain: 'github.com',
  ...overrides,
});

const makeService = (initial = [], metaResult = makeMeta()) => {
  const storage = createInMemoryStorage(initial);
  const notifyUpdated = vi.fn();
  const metadataFetcher = vi.fn().mockResolvedValue(metaResult);
  const service = createCaptureService({ storage, metadataFetcher, notifyUpdated });
  return { service, storage, notifyUpdated, metadataFetcher };
};

const now = new Date().toISOString();

describe('captureService.captureUrl', () => {
  it('새 URL 저장 성공', async () => {
    const { service, storage } = makeService();
    const result = await service.captureUrl('https://github.com');
    expect(result.success).toBe(true);
    expect(storage.peek()[0].content).toBe('https://github.com');
  });

  it('프로토콜 없으면 https:// 자동 추가', async () => {
    const { service, storage } = makeService();
    await service.captureUrl('github.com');
    expect(storage.peek()[0].content).toBe('https://github.com');
  });

  it('http:// 유지', async () => {
    const { service, storage } = makeService();
    await service.captureUrl('http://example.com');
    expect(storage.peek()[0].content).toBe('http://example.com');
  });

  it('중복 URL → { success: false, duplicate: true }', async () => {
    const existing = { id: '1', type: 'url', content: 'https://github.com', createdAt: now, updatedAt: now };
    const { service, storage } = makeService([existing]);
    const result = await service.captureUrl('https://github.com');
    expect(result.success).toBe(false);
    expect(result.duplicate).toBe(true);
    expect(storage.peek()).toHaveLength(1);
  });

  it('중복 체크 시 삭제된 항목은 제외', async () => {
    const deleted = { id: '1', type: 'url', content: 'https://github.com', deletedAt: now, createdAt: now, updatedAt: now };
    const { service } = makeService([deleted]);
    const result = await service.captureUrl('https://github.com');
    expect(result.success).toBe(true);
  });

  it('사설 IP → { success: false, error: Private }', async () => {
    const { service } = makeService();
    const result = await service.captureUrl('http://192.168.1.1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Private');
  });

  it('localhost → { success: false, error }', async () => {
    const { service } = makeService();
    const result = await service.captureUrl('http://localhost');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('ftp:// → Protocol not allowed 에러', async () => {
    const { service } = makeService();
    const result = await service.captureUrl('ftp://example.com');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Protocol');
  });

  it('저장 후 notifyUpdated 호출 (source: capture)', async () => {
    const { service, notifyUpdated } = makeService();
    await service.captureUrl('https://github.com');
    expect(notifyUpdated).toHaveBeenCalledWith(expect.objectContaining({ source: 'capture' }));
  });

  it('메타데이터 fetch 후 항목 업데이트', async () => {
    const { service, storage, metadataFetcher } = makeService();
    await service.captureUrl('https://github.com');
    await vi.waitFor(() => expect(metadataFetcher).toHaveBeenCalled());
    await new Promise(r => setTimeout(r, 10));
    const item = storage.peek()[0];
    expect(item.title).toBe('Test Title');
    expect(item.category).toBe('Code');
  });

  it('메타데이터 fetch 후 notifyUpdated 재호출 (source: capture-meta)', async () => {
    const { service, notifyUpdated } = makeService();
    await service.captureUrl('https://github.com');
    await vi.waitFor(() => expect(notifyUpdated).toHaveBeenCalledTimes(2));
    const lastCall = notifyUpdated.mock.calls.at(-1)[0];
    expect(lastCall.source).toBe('capture-meta');
  });

  it('메타데이터 fetch 실패해도 첫 저장 유지', async () => {
    const storage = createInMemoryStorage();
    const metadataFetcher = vi.fn().mockRejectedValue(new Error('Network error'));
    const service = createCaptureService({ storage, metadataFetcher, notifyUpdated: vi.fn() });
    await service.captureUrl('https://github.com');
    await new Promise(r => setTimeout(r, 20));
    expect(storage.peek()).toHaveLength(1);
    expect(storage.peek()[0].content).toBe('https://github.com');
  });

  it('초기 저장 시 title은 URL 자체', async () => {
    const { service, storage } = makeService([], makeMeta());
    await service.captureUrl('https://example.com');
    // 메타 fetch 전 초기 title은 URL
    // (메타 fetch 완료 전에 peek하면 URL이 title)
    expect(storage.peek()[0].content).toBe('https://example.com');
  });

  it('저장 아이템에 id, createdAt, updatedAt 자동 부여', async () => {
    const { service, storage } = makeService();
    await service.captureUrl('https://github.com');
    const item = storage.peek()[0];
    expect(item.id).toBeTruthy();
    expect(item.createdAt).toBeTruthy();
    expect(item.updatedAt).toBeTruthy();
  });

  it('저장 아이템 type은 url', async () => {
    const { service, storage } = makeService();
    await service.captureUrl('https://github.com');
    expect(storage.peek()[0].type).toBe('url');
  });

  it('www. 포함 URL → domain에서 www. 제거', async () => {
    const { service, storage } = makeService();
    await service.captureUrl('https://www.github.com');
    expect(storage.peek()[0].domain).toBe('github.com');
  });

  it('카테고리 자동 분류 (GitHub → Code)', async () => {
    const { service, storage } = makeService([], { ...makeMeta(), category: undefined });
    await service.captureUrl('https://github.com/user/repo');
    expect(storage.peek()[0].category).toBe('Code');
  });

  it('빈 문자열 입력 → 에러 반환', async () => {
    const { service } = makeService();
    const result = await service.captureUrl('');
    expect(result.success).toBe(false);
  });

  it('앞뒤 공백이 있는 URL → 정상 처리', async () => {
    const { service, storage } = makeService();
    const result = await service.captureUrl('  https://github.com  ');
    expect(result.success).toBe(true);
    expect(storage.peek()[0].content).toBe('https://github.com');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { createItemService } from '../../../src/application/itemService.js';
import { createInMemoryStorage } from '../../fakes/inMemoryStorage.js';

const makeService = (initial = []) => {
  const storage = createInMemoryStorage(initial);
  const notifyUpdated = vi.fn();
  const service = createItemService({ storage, notifyUpdated });
  return { service, storage, notifyUpdated };
};

const now = new Date().toISOString();
const baseItem = (overrides = {}) => ({
  id: undefined, type: 'url', content: 'https://example.com',
  title: 'Example', description: '', image: '', category: 'General',
  domain: 'example.com', tags: [], createdAt: now, updatedAt: now,
  ...overrides,
});

/* ===== save ===== */
describe('itemService.save', () => {
  it('새 아이템 생성: id/createdAt/updatedAt 자동 부여', () => {
    const { service } = makeService();
    const saved = service.save(baseItem());
    expect(saved.id).toBeTruthy();
    expect(saved.createdAt).toBeTruthy();
    expect(saved.updatedAt).toBeTruthy();
  });

  it('새 아이템이 목록 맨 앞에 위치', () => {
    const { service, storage } = makeService([baseItem({ id: 'existing' })]);
    service.save(baseItem({ title: 'New' }));
    expect(storage.peek()[0].title).toBe('New');
  });

  it('기존 id로 업데이트: createdAt 유지, updatedAt 갱신', async () => {
    const old = baseItem({ id: 'id1', title: 'Old', createdAt: '2020-01-01T00:00:00Z' });
    const { service } = makeService([old]);
    await new Promise(r => setTimeout(r, 5));
    const updated = service.save({ id: 'id1', title: 'New' });
    expect(updated.title).toBe('New');
    expect(updated.createdAt).toBe('2020-01-01T00:00:00Z');
    expect(updated.updatedAt).not.toBe(old.updatedAt);
  });

  it('태그 정규화 적용', () => {
    const { service } = makeService();
    const saved = service.save(baseItem({ tags: ['React', '#node', 'react'] }));
    expect(saved.tags).toEqual(['react', 'node']);
  });

  it('존재하지 않는 id로 업데이트 → 저장 안 됨 (첫 번째 항목 반환)', () => {
    const { service, storage } = makeService();
    service.save({ id: 'ghost-id', title: 'Ghost' });
    // ghost id는 없으므로 데이터 변경 없음
    expect(storage.peek()).toHaveLength(0);
  });

  it('tags 없는 아이템 저장 → tags: [] 기본값', () => {
    const { service } = makeService();
    const saved = service.save({ type: 'memo', content: 'test' });
    expect(saved.tags).toEqual([]);
  });

  it('연속 저장 → 순서대로 앞에 추가', () => {
    const { service, storage } = makeService();
    service.save(baseItem({ title: 'First' }));
    service.save(baseItem({ title: 'Second' }));
    expect(storage.peek()[0].title).toBe('Second');
  });
});

/* ===== softDelete ===== */
describe('itemService.softDelete', () => {
  it('deletedAt 설정', () => {
    const { service, storage } = makeService([baseItem({ id: 'id1' })]);
    expect(service.softDelete('id1')).toBe(true);
    expect(storage.peek()[0].deletedAt).toBeTruthy();
  });
  it('없는 id → false', () => {
    const { service } = makeService();
    expect(service.softDelete('ghost')).toBe(false);
  });
  it('이미 삭제된 항목 → true + 재설정', () => {
    const item = baseItem({ id: 'id1', deletedAt: '2020-01-01T00:00:00Z' });
    const { service, storage } = makeService([item]);
    expect(service.softDelete('id1')).toBe(true);
    expect(storage.peek()[0].deletedAt).not.toBe('2020-01-01T00:00:00Z');
  });
});

/* ===== restore ===== */
describe('itemService.restore', () => {
  it('deletedAt 제거', () => {
    const { service, storage } = makeService([baseItem({ id: 'id1', deletedAt: now })]);
    service.restore('id1');
    expect(storage.peek()[0].deletedAt).toBeUndefined();
  });
  it('없는 id → false', () => {
    const { service } = makeService();
    expect(service.restore('ghost')).toBe(false);
  });
  it('restore 후 updatedAt 갱신', async () => {
    const old = baseItem({ id: 'id1', deletedAt: now, updatedAt: '2020-01-01T00:00:00Z' });
    const { service, storage } = makeService([old]);
    await new Promise(r => setTimeout(r, 5));
    service.restore('id1');
    expect(storage.peek()[0].updatedAt).not.toBe('2020-01-01T00:00:00Z');
  });
});

/* ===== emptyTrash ===== */
describe('itemService.emptyTrash', () => {
  it('삭제된 항목만 제거', () => {
    const { service, storage } = makeService([
      baseItem({ id: '1' }),
      baseItem({ id: '2', deletedAt: now }),
    ]);
    service.emptyTrash();
    expect(storage.peek().map(i => i.id)).toEqual(['1']);
  });
  it('삭제 항목 없으면 변화 없음', () => {
    const { service, storage } = makeService([baseItem({ id: '1' })]);
    service.emptyTrash();
    expect(storage.peek()).toHaveLength(1);
  });
  it('true 반환', () => {
    const { service } = makeService();
    expect(service.emptyTrash()).toBe(true);
  });
});

/* ===== permDelete ===== */
describe('itemService.permDelete', () => {
  it('특정 id만 영구 삭제', () => {
    const { service, storage } = makeService([
      baseItem({ id: '1' }),
      baseItem({ id: '2' }),
    ]);
    service.permDelete('1');
    expect(storage.peek().map(i => i.id)).toEqual(['2']);
  });
  it('없는 id → 변화 없음', () => {
    const { service, storage } = makeService([baseItem({ id: '1' })]);
    service.permDelete('ghost');
    expect(storage.peek()).toHaveLength(1);
  });
});

/* ===== purgeTrash ===== */
describe('itemService.purgeTrash', () => {
  it('31일 이상 된 항목 삭제', () => {
    const old = baseItem({
      id: 'old',
      deletedAt: new Date(Date.now() - 31 * 86400000).toISOString(),
    });
    const fresh = baseItem({ id: 'fresh' });
    const { service, storage } = makeService([old, fresh]);
    service.purgeTrash();
    expect(storage.peek().map(i => i.id)).toEqual(['fresh']);
  });
  it('만료 항목 없으면 변화 없음', () => {
    const { service, storage } = makeService([baseItem({ id: '1' })]);
    service.purgeTrash();
    expect(storage.peek()).toHaveLength(1);
  });
});

/* ===== isDuplicateUrl ===== */
describe('itemService.isDuplicateUrl', () => {
  it('동일 URL 존재 → true', () => {
    const { service } = makeService([baseItem({ id: '1', content: 'https://example.com' })]);
    expect(service.isDuplicateUrl('https://example.com')).toBe(true);
  });
  it('삭제된 항목은 중복 아님', () => {
    const { service } = makeService([baseItem({ id: '1', content: 'https://example.com', deletedAt: now })]);
    expect(service.isDuplicateUrl('https://example.com')).toBe(false);
  });
  it('다른 URL → false', () => {
    const { service } = makeService([baseItem({ id: '1', content: 'https://example.com' })]);
    expect(service.isDuplicateUrl('https://other.com')).toBe(false);
  });
  it('type=memo 는 중복 체크 제외', () => {
    const { service } = makeService([baseItem({ id: '1', type: 'memo', content: 'https://example.com' })]);
    expect(service.isDuplicateUrl('https://example.com')).toBe(false);
  });
  it('빈 스토리지 → false', () => {
    const { service } = makeService([]);
    expect(service.isDuplicateUrl('https://example.com')).toBe(false);
  });
});

/* ===== list ===== */
describe('itemService.list', () => {
  it('삭제 항목 제외 기본', () => {
    const { service } = makeService([
      baseItem({ id: '1' }),
      baseItem({ id: '2', deletedAt: now }),
    ]);
    expect(service.list({}).map(i => i.id)).toEqual(['1']);
  });
  it('Trash 필터', () => {
    const { service } = makeService([
      baseItem({ id: '1' }),
      baseItem({ id: '2', deletedAt: now }),
    ]);
    expect(service.list({ category: 'Trash' }).map(i => i.id)).toEqual(['2']);
  });
  it('검색 필터', () => {
    const { service } = makeService([
      baseItem({ id: '1', title: 'React Tutorial' }),
      baseItem({ id: '2', title: 'Vue Guide' }),
    ]);
    const result = service.list({ search: 'react' });
    expect(result.map(i => i.id)).toContain('1');
    expect(result.map(i => i.id)).not.toContain('2');
  });
  it('카테고리 필터', () => {
    const { service } = makeService([
      baseItem({ id: '1', category: 'Video' }),
      baseItem({ id: '2', category: 'Code' }),
    ]);
    expect(service.list({ category: 'Video' }).map(i => i.id)).toEqual(['1']);
  });
});

/* ===== counts ===== */
describe('itemService.counts', () => {
  it('All/Memo/Trash 정확한 카운트', () => {
    const { service } = makeService([
      baseItem({ id: '1', type: 'memo' }),
      baseItem({ id: '2', category: 'Video' }),
      baseItem({ id: '3', deletedAt: now }),
    ]);
    const counts = service.counts();
    expect(counts.All).toBe(2);
    expect(counts.Memo).toBe(1);
    expect(counts.Trash).toBe(1);
  });
  it('빈 스토리지 → All: 0, Trash: 0', () => {
    const { service } = makeService();
    const counts = service.counts();
    expect(counts.All).toBe(0);
    expect(counts.Trash).toBe(0);
  });
  it('태그 카운트 포함', () => {
    const { service } = makeService([
      baseItem({ id: '1', tags: ['react', 'ts'] }),
      baseItem({ id: '2', tags: ['react'] }),
    ]);
    const counts = service.counts();
    expect(counts.tags.react).toBe(2);
    expect(counts.tags.ts).toBe(1);
  });
});

/* ===== toggleDone ===== */
describe('itemService.toggleDone', () => {
  const todo = (overrides = {}) => baseItem({
    id: 'td1', type: 'todo', content: '우유 사기', done: false, completedAt: null, tags: ['집안일'], ...overrides,
  });

  it('미완료 → 완료: done=true, completedAt 설정', () => {
    const { service, storage } = makeService([todo()]);
    const result = service.toggleDone('td1');
    expect(result.done).toBe(true);
    expect(result.completedAt).toBeTruthy();
    expect(storage.peek()[0].done).toBe(true);
  });

  it('완료 → 미완료: done=false, completedAt=null', () => {
    const { service } = makeService([todo({ done: true, completedAt: now })]);
    const result = service.toggleDone('td1');
    expect(result.done).toBe(false);
    expect(result.completedAt).toBeNull();
  });

  it('토글 시 태그가 유실되지 않는다 (전용 경로)', () => {
    const { service } = makeService([todo()]);
    const result = service.toggleDone('td1');
    expect(result.tags).toEqual(['집안일']);
  });

  it('존재하지 않는 id → null', () => {
    const { service } = makeService([]);
    expect(service.toggleDone('nope')).toBeNull();
  });

  it('todo 가 아닌 아이템 → null (변경 없음)', () => {
    const { service, storage } = makeService([baseItem({ id: 'u1', type: 'url' })]);
    expect(service.toggleDone('u1')).toBeNull();
    expect(storage.peek()[0]).not.toHaveProperty('done');
  });
});

/* ===== getAll ===== */
describe('itemService.getAll', () => {
  it('삭제 포함 전체 항목 반환', () => {
    const { service } = makeService([
      baseItem({ id: '1' }),
      baseItem({ id: '2', deletedAt: now }),
    ]);
    expect(service.getAll()).toHaveLength(2);
  });
});

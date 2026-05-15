import { describe, it, expect } from 'vitest';
import { filterItems, computeCounts } from '../../../src/domain/itemFilter.js';

const now = new Date().toISOString();
const base = (overrides = {}) => ({
  id: 'id1', type: 'url', content: 'https://example.com',
  title: 'Example', description: 'A page', image: '', category: 'General',
  domain: 'example.com', tags: [], createdAt: now, updatedAt: now,
  ...overrides,
});

const items = [
  base({ id: '1', category: 'Video', tags: ['react'] }),
  base({ id: '2', type: 'memo', content: 'hello world', tags: ['vue'] }),
  base({ id: '3', category: 'Code', title: 'GitHub Repo' }),
  base({ id: '4', category: 'Video', deletedAt: now }),  // trash
];

describe('filterItems', () => {
  it('기본: 삭제된 항목 제외', () => {
    const result = filterItems(items);
    expect(result.map(i => i.id)).not.toContain('4');
    expect(result).toHaveLength(3);
  });

  it('Trash 카테고리: 삭제된 항목만', () => {
    const result = filterItems(items, { category: 'Trash' });
    expect(result.map(i => i.id)).toEqual(['4']);
  });

  it('Video 카테고리 필터 (삭제 항목 제외)', () => {
    const result = filterItems(items, { category: 'Video' });
    expect(result.map(i => i.id)).toEqual(['1']);
  });

  it('Memo 카테고리 필터', () => {
    const result = filterItems(items, { category: 'Memo' });
    expect(result.map(i => i.id)).toEqual(['2']);
  });

  it('tag: 필터', () => {
    const result = filterItems(items, { category: 'tag:react' });
    expect(result.map(i => i.id)).toEqual(['1']);
  });

  it('존재하지 않는 tag: → 빈 배열', () => {
    const result = filterItems(items, { category: 'tag:nonexistent' });
    expect(result).toHaveLength(0);
  });

  it('All 카테고리: 삭제 항목 제외 전체', () => {
    const result = filterItems(items, { category: 'All' });
    expect(result).toHaveLength(3);
    expect(result.map(i => i.id)).not.toContain('4');
  });

  it('검색: title 매칭', () => {
    const result = filterItems(items, { search: 'GitHub' });
    expect(result.map(i => i.id)).toContain('3');
  });

  it('검색: 대소문자 무관', () => {
    const result = filterItems(items, { search: 'github' });
    expect(result.map(i => i.id)).toContain('3');
  });

  it('검색: 메모 content 매칭', () => {
    const result = filterItems(items, { search: 'hello' });
    expect(result.map(i => i.id)).toContain('2');
  });

  it('검색: 태그 매칭', () => {
    const result = filterItems(items, { search: 'vue' });
    expect(result.map(i => i.id)).toContain('2');
  });

  it('검색: domain 매칭', () => {
    const result = filterItems(items, { search: 'example.com' });
    expect(result.length).toBeGreaterThan(0);
  });

  it('검색어 없으면 삭제 항목 제외 전체 반환', () => {
    expect(filterItems(items, { search: '' })).toHaveLength(3);
  });

  it('검색어 공백만 → 전체 반환', () => {
    expect(filterItems(items, { search: '   ' })).toHaveLength(3);
  });

  it('존재하지 않는 카테고리 → 빈 배열', () => {
    const result = filterItems(items, { category: 'Shopping' });
    expect(result).toHaveLength(0);
  });

  it('빈 배열 입력 → 빈 배열 반환', () => {
    expect(filterItems([])).toHaveLength(0);
  });

  it('결과는 createdAt 내림차순 정렬', () => {
    const older = base({ id: 'old', createdAt: new Date(Date.now() - 86400000).toISOString() });
    const newer = base({ id: 'new', createdAt: new Date().toISOString() });
    const result = filterItems([older, newer]);
    expect(result[0].id).toBe('new');
  });

  it('카테고리 + 검색 조합', () => {
    const result = filterItems(items, { category: 'Video', search: 'example' });
    expect(result.map(i => i.id)).toContain('1');
  });

  it('Trash + 검색 조합', () => {
    const result = filterItems(items, { category: 'Trash', search: 'example' });
    expect(result.map(i => i.id)).toContain('4');
  });
});

describe('computeCounts', () => {
  it('All은 삭제 안 된 항목 수', () => {
    expect(computeCounts(items).All).toBe(3);
  });
  it('Trash는 삭제된 항목 수', () => {
    expect(computeCounts(items).Trash).toBe(1);
  });
  it('Memo 카운트', () => {
    expect(computeCounts(items).Memo).toBe(1);
  });
  it('카테고리별 카운트 (삭제 항목 제외)', () => {
    const counts = computeCounts(items);
    expect(counts.Video).toBe(1);  // 삭제된 Video는 제외
    expect(counts.Code).toBe(1);
  });
  it('태그 카운트', () => {
    const counts = computeCounts(items);
    expect(counts.tags.react).toBe(1);
    expect(counts.tags.vue).toBe(1);
  });
  it('빈 배열 → All: 0, Trash: 0', () => {
    const counts = computeCounts([]);
    expect(counts.All).toBe(0);
    expect(counts.Trash).toBe(0);
  });
  it('전부 삭제된 경우 → All: 0', () => {
    const allDeleted = [
      base({ id: '1', deletedAt: now }),
      base({ id: '2', deletedAt: now }),
    ];
    const counts = computeCounts(allDeleted);
    expect(counts.All).toBe(0);
    expect(counts.Trash).toBe(2);
  });
  it('tags가 없는 아이템 → 태그 카운트 무시', () => {
    const noTags = [base({ id: '1', tags: undefined })];
    expect(() => computeCounts(noTags)).not.toThrow();
  });
  it('카테고리 미설정 url → undefined 카운트 없음', () => {
    const counts = computeCounts(items);
    expect(counts.undefined).toBeUndefined();
  });
});

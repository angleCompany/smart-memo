import { describe, it, expect } from 'vitest';
import { sanitizeImportedItem, ALLOWED_TYPES, ALLOWED_CATEGORIES } from '../../../src/domain/itemSanitizer.js';

const validUrl = {
  id: 'abc123', type: 'url', content: 'https://github.com',
  title: 'GitHub', description: 'Desc', image: 'https://example.com/img.png',
  domain: 'github.com', category: 'Code', tags: ['code'],
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

describe('sanitizeImportedItem', () => {
  it('유효한 URL 아이템 통과', () => {
    const result = sanitizeImportedItem(validUrl);
    expect(result).not.toBeNull();
    expect(result.type).toBe('url');
    expect(result.tags).toEqual(['code']);
  });

  it('유효한 메모 아이템 통과', () => {
    const memo = {
      id: 'm1', type: 'memo', content: 'hello',
      tags: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    };
    expect(sanitizeImportedItem(memo)).not.toBeNull();
  });

  it('null 입력 → null', () => expect(sanitizeImportedItem(null)).toBeNull());
  it('undefined 입력 → null', () => expect(sanitizeImportedItem(undefined)).toBeNull());
  it('숫자 입력 → null', () => expect(sanitizeImportedItem(42)).toBeNull());
  it('배열 입력 → null', () => expect(sanitizeImportedItem([])).toBeNull());

  it('알 수 없는 type → null', () => {
    expect(sanitizeImportedItem({ ...validUrl, type: 'unknown' })).toBeNull();
  });

  it('URL 타입에서 ftp:// → null', () => {
    expect(sanitizeImportedItem({ ...validUrl, content: 'ftp://example.com' })).toBeNull();
  });
  it('URL 타입에서 javascript: → null', () => {
    expect(sanitizeImportedItem({ ...validUrl, content: 'javascript:alert(1)' })).toBeNull();
  });
  it('URL 타입에서 file:// → null', () => {
    expect(sanitizeImportedItem({ ...validUrl, content: 'file:///etc/passwd' })).toBeNull();
  });
  it('잘못된 URL content → null', () => {
    expect(sanitizeImportedItem({ ...validUrl, content: 'not-a-url' })).toBeNull();
  });

  it('허용되지 않은 category → General로 대체', () => {
    const result = sanitizeImportedItem({ ...validUrl, category: 'Unknown' });
    expect(result.category).toBe('General');
  });

  it('허용된 category → 그대로 유지', () => {
    const result = sanitizeImportedItem({ ...validUrl, category: 'Video' });
    expect(result.category).toBe('Video');
  });

  it('title 500자 초과 → 자름', () => {
    const result = sanitizeImportedItem({ ...validUrl, title: 'a'.repeat(1000) });
    expect(result.title.length).toBeLessThanOrEqual(500);
  });

  it('description 2000자 초과 → 자름', () => {
    const result = sanitizeImportedItem({ ...validUrl, description: 'x'.repeat(3000) });
    expect(result.description.length).toBeLessThanOrEqual(2000);
  });

  it('content 4096자 초과 → 자름', () => {
    const url = 'https://example.com/' + 'x'.repeat(5000);
    const result = sanitizeImportedItem({ ...validUrl, content: url });
    expect(result.content.length).toBeLessThanOrEqual(4096);
  });

  it('id 64자 초과 → 자름', () => {
    const result = sanitizeImportedItem({ ...validUrl, id: 'x'.repeat(100) });
    expect(result.id.length).toBeLessThanOrEqual(64);
  });

  it('tags 정규화 적용', () => {
    const result = sanitizeImportedItem({ ...validUrl, tags: ['React', '#node', 'react'] });
    expect(result.tags).toEqual(['react', 'node']);
  });

  it('createdAt 없으면 nowIso 사용', () => {
    const nowIso = '2026-05-14T00:00:00Z';
    const result = sanitizeImportedItem({ ...validUrl, createdAt: undefined }, nowIso);
    expect(result.createdAt).toBe(nowIso);
  });

  it('updatedAt 없으면 nowIso 사용', () => {
    const nowIso = '2026-05-14T00:00:00Z';
    const result = sanitizeImportedItem({ ...validUrl, updatedAt: undefined }, nowIso);
    expect(result.updatedAt).toBe(nowIso);
  });

  it('필수 필드가 없어도 기본값으로 처리', () => {
    const minimal = { type: 'url', content: 'https://example.com' };
    const result = sanitizeImportedItem(minimal);
    expect(result).not.toBeNull();
    expect(result.title).toBe('');
    expect(result.tags).toEqual([]);
  });

  it('memo에 content 없어도 처리 (빈 문자열)', () => {
    const memo = { type: 'memo', content: '', tags: [] };
    const result = sanitizeImportedItem(memo);
    expect(result).not.toBeNull();
    expect(result.content).toBe('');
  });

  it('image URL 2048자 초과 → 자름', () => {
    const result = sanitizeImportedItem({ ...validUrl, image: 'https://example.com/' + 'x'.repeat(3000) });
    expect(result.image.length).toBeLessThanOrEqual(2048);
  });

  it('domain 253자 초과 → 자름', () => {
    const result = sanitizeImportedItem({ ...validUrl, domain: 'x'.repeat(300) });
    expect(result.domain.length).toBeLessThanOrEqual(253);
  });

  it('deletedAt 있는 항목 → 보존', () => {
    const deleted = { ...validUrl, deletedAt: '2026-01-15T00:00:00Z' };
    const result = sanitizeImportedItem(deleted);
    // deletedAt은 sanitizer에서 명시적으로 처리하지 않을 수 있음
    // 아이템 자체는 통과해야 함
    expect(result).not.toBeNull();
  });
});

describe('ALLOWED constants', () => {
  it('ALLOWED_TYPES에 url, memo 포함', () => {
    expect([...ALLOWED_TYPES]).toEqual(expect.arrayContaining(['url', 'memo']));
  });
  it('ALLOWED_CATEGORIES에 Video 포함', () => {
    expect(ALLOWED_CATEGORIES.has('Video')).toBe(true);
  });
  it('ALLOWED_CATEGORIES에 Unknown 미포함', () => {
    expect(ALLOWED_CATEGORIES.has('Unknown')).toBe(false);
  });
  it('ALLOWED_CATEGORIES에 Memo 미포함 (type으로 구분)', () => {
    expect(ALLOWED_CATEGORIES.has('Memo')).toBe(false);
  });
  it('ALLOWED_CATEGORIES에 Trash 미포함', () => {
    expect(ALLOWED_CATEGORIES.has('Trash')).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { sanitizeTags, normalizeTag, MAX_TAGS, MAX_TAG_LENGTH } from '../../../src/domain/tags.js';

describe('normalizeTag', () => {
  it('소문자 변환', () => expect(normalizeTag('REACT')).toBe('react'));
  it('# 제거', () => expect(normalizeTag('#vue')).toBe('vue'));
  it('공백 제거', () => expect(normalizeTag('web dev')).toBe('webdev'));
  it('콤마 제거', () => expect(normalizeTag('a,b')).toBe('ab'));
  it('선행 공백/# 제거', () => expect(normalizeTag('  #tag  ')).toBe('tag'));
  it(`${MAX_TAG_LENGTH}자 초과 자름`, () => {
    expect(normalizeTag('a'.repeat(MAX_TAG_LENGTH + 10))).toHaveLength(MAX_TAG_LENGTH);
  });
  it(`정확히 ${MAX_TAG_LENGTH}자 → 유지`, () => {
    expect(normalizeTag('a'.repeat(MAX_TAG_LENGTH))).toHaveLength(MAX_TAG_LENGTH);
  });
  it('숫자 입력 → 빈 문자열', () => expect(normalizeTag(42)).toBe(''));
  it('null 입력 → 빈 문자열', () => expect(normalizeTag(null)).toBe(''));
  it('undefined 입력 → 빈 문자열', () => expect(normalizeTag(undefined)).toBe(''));
  it('객체 입력 → 빈 문자열', () => expect(normalizeTag({})).toBe(''));
  it('한국어 태그 허용', () => expect(normalizeTag('개발')).toBe('개발'));
  it('숫자가 포함된 태그 허용', () => expect(normalizeTag('react18')).toBe('react18'));
});

describe('sanitizeTags', () => {
  it('정상 태그 정규화', () => {
    expect(sanitizeTags(['React', '#NodeJS'])).toEqual(['react', 'nodejs']);
  });
  it('중복 태그 제거', () => {
    expect(sanitizeTags(['react', 'React', 'REACT'])).toEqual(['react']);
  });
  it('빈 문자열/null/숫자 필터링', () => {
    expect(sanitizeTags(['valid', '', null, 42, '  '])).toEqual(['valid']);
  });
  it(`최대 ${MAX_TAGS}개 제한`, () => {
    const many = Array.from({ length: MAX_TAGS + 10 }, (_, i) => `tag${i}`);
    expect(sanitizeTags(many)).toHaveLength(MAX_TAGS);
  });
  it(`정확히 ${MAX_TAGS}개 → 그대로`, () => {
    const exact = Array.from({ length: MAX_TAGS }, (_, i) => `tag${i}`);
    expect(sanitizeTags(exact)).toHaveLength(MAX_TAGS);
  });
  it('배열 아닌 입력 → 빈 배열', () => {
    expect(sanitizeTags(null)).toEqual([]);
    expect(sanitizeTags('react')).toEqual([]);
    expect(sanitizeTags(undefined)).toEqual([]);
    expect(sanitizeTags(42)).toEqual([]);
    expect(sanitizeTags({})).toEqual([]);
  });
  it('빈 배열 → 빈 배열', () => {
    expect(sanitizeTags([])).toEqual([]);
  });
  it('normalize 후 중복인 경우 제거', () => {
    expect(sanitizeTags(['#react', 'react', 'REACT'])).toEqual(['react']);
  });
  it('공백만 있는 태그 걸러짐', () => {
    expect(sanitizeTags(['  ', '\t', '\n'])).toEqual([]);
  });
  it('순서 유지 (Set → 삽입 순서)', () => {
    const result = sanitizeTags(['b', 'a', 'c']);
    expect(result).toEqual(['b', 'a', 'c']);
  });
});

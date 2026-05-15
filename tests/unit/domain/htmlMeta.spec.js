import { describe, it, expect } from 'vitest';
import { decodeEntities, getMeta, getTitle } from '../../../src/domain/htmlMeta.js';

describe('decodeEntities', () => {
  it('기본 HTML 엔티티 디코드', () => {
    expect(decodeEntities('Tom &amp; Jerry')).toBe('Tom & Jerry');
    expect(decodeEntities('&lt;div&gt;')).toBe('<div>');
    expect(decodeEntities('&quot;hello&quot;')).toBe('"hello"');
    expect(decodeEntities('&#39;world&#39;')).toBe("'world'");
  });
  it('숫자 엔티티 디코드', () => {
    expect(decodeEntities('&#65;')).toBe('A');
  });
  it('앞뒤 공백 제거', () => {
    expect(decodeEntities('  hello  ')).toBe('hello');
  });
});

describe('getMeta', () => {
  it('property 방식 og:title 추출', () => {
    const html = `<meta property="og:title" content="OG Title">`;
    expect(getMeta(html, 'property', 'og:title')).toBe('OG Title');
  });
  it('content가 앞에 와도 추출', () => {
    const html = `<meta content="Desc" property="og:description">`;
    expect(getMeta(html, 'property', 'og:description')).toBe('Desc');
  });
  it('없으면 빈 문자열', () => {
    expect(getMeta('<html></html>', 'property', 'og:title')).toBe('');
  });
  it('name 방식 description 추출', () => {
    const html = `<meta name="description" content="Page Desc">`;
    expect(getMeta(html, 'name', 'description')).toBe('Page Desc');
  });
});

describe('getTitle', () => {
  it('og:title 우선', () => {
    const html = `<title>fallback</title><meta property="og:title" content="OG Title">`;
    expect(getTitle(html)).toBe('OG Title');
  });
  it('og:title 없으면 <title> 사용', () => {
    expect(getTitle('<title>Plain Title</title>')).toBe('Plain Title');
  });
  it('둘 다 없으면 빈 문자열', () => {
    expect(getTitle('<html></html>')).toBe('');
  });
  it('HTML 엔티티 디코드', () => {
    expect(getTitle('<title>Tom &amp; Jerry</title>')).toBe('Tom & Jerry');
  });
});

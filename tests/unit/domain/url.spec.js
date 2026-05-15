import { describe, it, expect } from 'vitest';
import { normalizeUrl, isValidUrl, assertSafeUrl, categorizeUrl, getDomain } from '../../../src/domain/url.js';

describe('normalizeUrl', () => {
  it('이미 https://가 있으면 그대로 반환', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });
  it('이미 http://가 있으면 그대로 반환', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
  });
  it('프로토콜 없으면 https:// 추가', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
  });
  it('앞뒤 공백 제거', () => {
    expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com');
  });
  it('null/undefined → https://null 같은 형태 (빈 문자열 처리)', () => {
    expect(normalizeUrl('')).toBe('https://');
  });
  it('www 없는 도메인도 그대로', () => {
    expect(normalizeUrl('github.com/user/repo')).toBe('https://github.com/user/repo');
  });
  it('경로 + 쿼리 보존', () => {
    expect(normalizeUrl('example.com/path?q=1&r=2')).toBe('https://example.com/path?q=1&r=2');
  });
});

describe('isValidUrl', () => {
  it.each([
    ['https://github.com', true],
    ['http://example.com/path?q=1', true],
    ['github.com', true],                       // 프로토콜 없어도 허용
    ['www.example.com/page', true],
    ['ftp://example.com', false],               // ftp 거부
    ['javascript:alert(1)', false],             // javascript: 거부
    ['file:///etc/passwd', false],              // file: 거부
    ['', false],                               // 빈 문자열
    ['   ', false],                            // 공백만
  ])('%s → %s', (url, expected) => {
    expect(isValidUrl(url)).toBe(expected);
  });

  it('포트 포함 URL 허용', () => {
    expect(isValidUrl('http://example.com:8080/path')).toBe(true);
  });
  it('IP 주소 URL 허용 (공인 IP)', () => {
    expect(isValidUrl('http://8.8.8.8')).toBe(true);
  });
  it('유니코드 도메인 허용', () => {
    expect(isValidUrl('https://한국어.com')).toBe(true);
  });
});

describe('assertSafeUrl', () => {
  it('정상 https URL 통과', () => {
    expect(() => assertSafeUrl('https://example.com')).not.toThrow();
  });
  it('정상 http URL 통과', () => {
    expect(() => assertSafeUrl('http://example.com')).not.toThrow();
  });

  it.each([
    'http://localhost',
    'http://localhost:3000',
    'http://127.0.0.1',
    'http://127.0.0.1:8080',
    'http://10.0.0.1',
    'http://10.255.255.255',
    'http://192.168.0.1',
    'http://192.168.255.255',
    'http://172.16.0.1',
    'http://172.31.255.255',
    'http://0.0.0.0',
  ])('%s → Private address 에러', (url) => {
    expect(() => assertSafeUrl(url)).toThrow('Private address');
  });

  it('ftp:// → Protocol not allowed', () => {
    expect(() => assertSafeUrl('ftp://example.com')).toThrow('Protocol');
  });
  it('file:// → Protocol not allowed', () => {
    expect(() => assertSafeUrl('file:///etc/passwd')).toThrow('Protocol');
  });
  it('javascript: → Protocol not allowed', () => {
    expect(() => assertSafeUrl('javascript:alert(1)')).toThrow('Protocol');
  });
  it('잘못된 URL → Invalid URL 에러', () => {
    expect(() => assertSafeUrl('not-a-url')).toThrow('Invalid URL');
  });
  it('172.15.x.x는 사설 아님 → 통과', () => {
    expect(() => assertSafeUrl('http://172.15.0.1')).not.toThrow();
  });
  it('172.32.x.x는 사설 아님 → 통과', () => {
    expect(() => assertSafeUrl('http://172.32.0.1')).not.toThrow();
  });
});

describe('categorizeUrl', () => {
  it.each([
    ['https://www.youtube.com/watch?v=abc', 'Video'],
    ['https://youtu.be/abc', 'Video'],
    ['https://vimeo.com/123', 'Video'],
    ['https://github.com/user/repo', 'Code'],
    ['https://stackoverflow.com/questions/1', 'Code'],
    ['https://npmjs.com/package/react', 'Code'],
    ['https://medium.com/@user/post', 'Article'],
    ['https://dev.to/user/post', 'Article'],
    ['https://velog.io/@user', 'Article'],
    ['https://x.com/user', 'Social'],
    ['https://twitter.com/user', 'Social'],
    ['https://instagram.com/user', 'Social'],
    ['https://reddit.com/r/sub', 'Social'],
    ['https://coupang.com/products/1', 'Shopping'],
    ['https://amazon.com/dp/B001', 'Shopping'],
    ['https://blog.naver.com/user', 'Korean'],
    ['https://kakao.com', 'Korean'],
    ['https://notion.so/page', 'Docs'],
    ['https://docs.google.com/doc', 'Docs'],
    ['https://wikipedia.org/wiki/Test', 'Docs'],
    ['https://example.com', 'General'],
    ['https://some-unknown-site.xyz', 'General'],
    ['not-a-url', 'General'],           // 파싱 실패 → General
  ])('%s → %s', (url, expected) => {
    expect(categorizeUrl(url)).toBe(expected);
  });

  it('빈 문자열 → General', () => {
    expect(categorizeUrl('')).toBe('General');
  });
});

describe('getDomain', () => {
  it('www. 제거 후 호스트명 반환', () => {
    expect(getDomain('https://www.github.com/user')).toBe('github.com');
  });
  it('서브도메인은 www만 제거', () => {
    expect(getDomain('https://docs.example.com')).toBe('docs.example.com');
  });
  it('잘못된 URL → 빈 문자열', () => {
    expect(getDomain('not-a-url')).toBe('');
  });
  it('null/undefined → 빈 문자열', () => {
    expect(getDomain('')).toBe('');
  });
  it('포트 포함 URL → 호스트명만 (포트 제외)', () => {
    expect(getDomain('http://example.com:8080/path')).toBe('example.com');
  });
  it('경로/쿼리 무시', () => {
    expect(getDomain('https://github.com/user/repo?tab=readme')).toBe('github.com');
  });
});

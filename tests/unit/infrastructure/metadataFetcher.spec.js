import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMetadataFetcher } from '../../../src/infrastructure/metadataFetcher.js';

function makeMetaFetcher(mockHtml = '') {
  const fetchHtml = vi.fn().mockResolvedValue(mockHtml);
  const fetchUrlMetadata = createMetadataFetcher(fetchHtml);
  return { fetchUrlMetadata, fetchHtml };
}

describe('fetchUrlMetadata', () => {
  it('og:title / og:description / og:image 파싱', async () => {
    const { fetchUrlMetadata, fetchHtml } = makeMetaFetcher(`
      <html><head>
        <meta property="og:title" content="OG Title">
        <meta property="og:description" content="OG Desc">
        <meta property="og:image" content="https://example.com/img.jpg">
      </head></html>
    `);
    const meta = await fetchUrlMetadata('https://example.com');
    expect(meta.title).toBe('OG Title');
    expect(meta.description).toBe('OG Desc');
    expect(meta.image).toBe('https://example.com/img.jpg');
    expect(fetchHtml).toHaveBeenCalledWith('https://example.com');
  });

  it('og:title 없으면 <title> 태그 사용', async () => {
    const { fetchUrlMetadata } = makeMetaFetcher('<html><title>Fallback Title</title></html>');
    const meta = await fetchUrlMetadata('https://example.com');
    expect(meta.title).toBe('Fallback Title');
  });

  it('카테고리 자동 분류: Code (github.com)', async () => {
    const { fetchUrlMetadata } = makeMetaFetcher('<html><title>Repo</title></html>');
    const meta = await fetchUrlMetadata('https://github.com/user/repo');
    expect(meta.category).toBe('Code');
    expect(meta.domain).toBe('github.com');
  });

  it('카테고리 자동 분류: Social (twitter.com)', async () => {
    const { fetchUrlMetadata } = makeMetaFetcher('<html></html>');
    const meta = await fetchUrlMetadata('https://twitter.com/user');
    expect(meta.category).toBe('Social');
  });

  it('domain에서 www. 제거', async () => {
    const { fetchUrlMetadata } = makeMetaFetcher('<html></html>');
    const meta = await fetchUrlMetadata('https://www.example.com/path');
    expect(meta.domain).toBe('example.com');
  });

  it('name=description fallback (og:description 없을 때)', async () => {
    const { fetchUrlMetadata } = makeMetaFetcher(`
      <html><head>
        <meta name="description" content="Name Desc">
      </head></html>
    `);
    const meta = await fetchUrlMetadata('https://example.com');
    expect(meta.description).toBe('Name Desc');
  });

  it('YouTube oEmbed 경로 사용', async () => {
    const fetchHtml = vi.fn().mockResolvedValue(JSON.stringify({
      title: 'YT Video',
      author_name: 'Creator',
      thumbnail_url: 'https://i.ytimg.com/thumb.jpg',
    }));
    const fetchUrlMetadata = createMetadataFetcher(fetchHtml);
    const meta = await fetchUrlMetadata('https://www.youtube.com/watch?v=abc123');
    expect(meta.title).toBe('YT Video');
    expect(meta.description).toContain('Creator');
    expect(meta.category).toBe('Video');
    expect(meta.domain).toBe('youtube.com');
    // oEmbed URL 포함 호출 확인
    expect(fetchHtml.mock.calls[0][0]).toContain('oembed');
  });

  it('YouTube oEmbed 실패 시 HTML 파싱으로 폴백', async () => {
    const fetchHtml = vi.fn()
      .mockRejectedValueOnce(new Error('oEmbed failed'))
      .mockResolvedValueOnce('<html><title>YT HTML Title</title></html>');
    const fetchUrlMetadata = createMetadataFetcher(fetchHtml);
    const meta = await fetchUrlMetadata('https://www.youtube.com/watch?v=xyz');
    expect(meta.title).toBe('YT HTML Title');
    expect(fetchHtml).toHaveBeenCalledTimes(2);
  });

  it('youtu.be 단축 URL도 YouTube 처리', async () => {
    const fetchHtml = vi.fn().mockResolvedValue(JSON.stringify({
      title: 'Short YT', author_name: 'Author', thumbnail_url: '',
    }));
    const fetchUrlMetadata = createMetadataFetcher(fetchHtml);
    const meta = await fetchUrlMetadata('https://youtu.be/abc');
    expect(meta.category).toBe('Video');
  });

  it('HTML 파싱 실패(네트워크 에러) → throw 전파', async () => {
    const fetchHtml = vi.fn().mockRejectedValue(new Error('Network error'));
    const fetchUrlMetadata = createMetadataFetcher(fetchHtml);
    await expect(fetchUrlMetadata('https://example.com')).rejects.toThrow('Network error');
  });

  it('사설 IP → assertSafeUrl 에러 (fetchHtml 미호출)', async () => {
    const { fetchUrlMetadata, fetchHtml } = makeMetaFetcher('');
    await expect(fetchUrlMetadata('http://192.168.1.1')).rejects.toThrow('Private');
    expect(fetchHtml).not.toHaveBeenCalled();
  });

  it('localhost → assertSafeUrl 에러', async () => {
    const { fetchUrlMetadata } = makeMetaFetcher('');
    await expect(fetchUrlMetadata('http://localhost:3000')).rejects.toThrow('Private');
  });

  it('ftp:// → Protocol not allowed 에러', async () => {
    const { fetchUrlMetadata } = makeMetaFetcher('');
    await expect(fetchUrlMetadata('ftp://example.com')).rejects.toThrow('Protocol');
  });

  it('title/description/image 없을 때 빈 문자열 반환', async () => {
    const { fetchUrlMetadata } = makeMetaFetcher('<html><body>No meta</body></html>');
    const meta = await fetchUrlMetadata('https://example.com');
    expect(meta.title).toBe('');
    expect(meta.description).toBe('');
    expect(meta.image).toBe('');
  });

  it('HTML 엔티티가 디코딩된 제목 반환', async () => {
    const { fetchUrlMetadata } = makeMetaFetcher('<html><title>Tom &amp; Jerry</title></html>');
    const meta = await fetchUrlMetadata('https://example.com');
    expect(meta.title).toBe('Tom & Jerry');
  });
});

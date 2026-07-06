import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { fetchLatestRelease } from '../../../src/infrastructure/updateChecker.js';

let server;
let port;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.url === '/repos/o/r/releases/latest') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        tag_name: 'v1.3.0',
        html_url: 'https://github.com/o/r/releases/tag/v1.3.0',
        assets: [
          { name: 'Smart-Memo-1.3.0-arm64.dmg', browser_download_url: 'https://x/arm64.dmg', size: 123, extra: 'ignored' },
        ],
      }));
    } else if (req.url === '/repos/bad/json/releases/latest') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('not json at all');
    } else if (req.url === '/repos/not/found/releases/latest') {
      res.writeHead(404);
      res.end('nope');
    } else {
      res.writeHead(500);
      res.end();
    }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  port = server.address().port;
});

afterAll(() => new Promise(r => server.close(r)));

const base = () => `http://127.0.0.1:${port}`;

describe('fetchLatestRelease', () => {
  it('릴리즈 JSON을 tag/url/assets로 파싱 (불필요 필드 제거)', async () => {
    const r = await fetchLatestRelease('o/r', { apiBase: base() });
    expect(r.tag_name).toBe('v1.3.0');
    expect(r.html_url).toContain('/releases/tag/v1.3.0');
    expect(r.assets).toHaveLength(1);
    expect(r.assets[0]).toEqual({ name: 'Smart-Memo-1.3.0-arm64.dmg', browser_download_url: 'https://x/arm64.dmg' });
  });

  it('404 응답 → reject', async () => {
    await expect(fetchLatestRelease('not/found', { apiBase: base() })).rejects.toThrow('HTTP 404');
  });

  it('잘못된 JSON → reject', async () => {
    await expect(fetchLatestRelease('bad/json', { apiBase: base() })).rejects.toThrow('Invalid JSON');
  });

  it('잘못된 apiBase → reject', async () => {
    await expect(fetchLatestRelease('o/r', { apiBase: 'not a url' })).rejects.toThrow();
  });
});

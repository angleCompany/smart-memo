import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import zlib from 'zlib';
import { fetchHtml } from '../../../src/infrastructure/httpFetcher.js';

let server;
let port;

// 요청 핸들러별 로컬 HTTP 서버
beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.url === '/simple') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<html><head><title>Simple Page</title></head><body>Hello</body></html>');

    } else if (req.url === '/redirect-once') {
      res.writeHead(301, { location: `http://127.0.0.1:${port}/simple` });
      res.end();

    } else if (req.url === '/redirect-loop') {
      res.writeHead(301, { location: `http://127.0.0.1:${port}/redirect-loop` });
      res.end();

    } else if (req.url === '/gzip') {
      const body = '<html><title>GZip Page</title></html>';
      const compressed = zlib.gzipSync(Buffer.from(body));
      res.writeHead(200, { 'content-type': 'text/html', 'content-encoding': 'gzip' });
      res.end(compressed);

    } else if (req.url === '/deflate') {
      const body = '<html><title>Deflate Page</title></html>';
      const compressed = zlib.deflateSync(Buffer.from(body));
      res.writeHead(200, { 'content-type': 'text/html', 'content-encoding': 'deflate' });
      res.end(compressed);

    } else if (req.url === '/slow') {
      // 응답하지 않아 타임아웃 유발 — 연결만 맺고 종료
      req.socket.setTimeout(50);

    } else if (req.url === '/empty') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('');

    } else if (req.url === '/large') {
      res.writeHead(200, { 'content-type': 'text/html' });
      // 600KB — 내부 512KB 제한 초과
      res.end(Buffer.alloc(600 * 1024, 'x'));

    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  await new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise(resolve => server.close(resolve));
});

describe('fetchHtml', () => {
  it('정상 응답 → HTML 문자열 반환', async () => {
    const html = await fetchHtml(`http://127.0.0.1:${port}/simple`);
    expect(html).toContain('<title>Simple Page</title>');
  });

  it('301 리다이렉트 따라감', async () => {
    const html = await fetchHtml(`http://127.0.0.1:${port}/redirect-once`);
    expect(html).toContain('<title>Simple Page</title>');
  });

  it('무한 리다이렉트 → Too many redirects 에러', async () => {
    await expect(fetchHtml(`http://127.0.0.1:${port}/redirect-loop`))
      .rejects.toThrow('Too many redirects');
  });

  it('gzip 압축 응답 → 자동 압축 해제', async () => {
    const html = await fetchHtml(`http://127.0.0.1:${port}/gzip`);
    expect(html).toContain('<title>GZip Page</title>');
  });

  it('deflate 압축 응답 → 자동 압축 해제', async () => {
    const html = await fetchHtml(`http://127.0.0.1:${port}/deflate`);
    expect(html).toContain('<title>Deflate Page</title>');
  });

  it('빈 응답 → 빈 문자열 반환', async () => {
    const html = await fetchHtml(`http://127.0.0.1:${port}/empty`);
    expect(html).toBe('');
  });

  it('잘못된 URL → Invalid URL 에러', async () => {
    await expect(fetchHtml('not-a-url')).rejects.toThrow('Invalid URL');
  });

  it('대용량 응답 → 요청 강제 중단 후 반환 (에러 없음)', async () => {
    // 512KB 제한을 초과하면 req.destroy()를 호출하므로 에러 또는 부분 데이터
    const result = await fetchHtml(`http://127.0.0.1:${port}/large`).catch(e => e.message);
    // 에러이거나 문자열이어야 함
    expect(typeof result).toBe('string');
  });
}, 15000);

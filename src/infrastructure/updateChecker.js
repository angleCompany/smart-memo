'use strict';

const https = require('https');
const http = require('http');
const { URL } = require('url');

// 기본 전송: Node https/http. 로컬 서버로 이 경로를 단위 테스트한다.
// 주의: 사내 프록시(자체 서명 루트 CA) 환경에서는 Node가 시스템 키체인을 신뢰하지 않아
// TLS 실패("self signed certificate in certificate chain")한다. 그래서 프로덕션(main.js)에서는
// 시스템 CA/프록시를 따르는 Electron net 기반 httpGet을 주입한다.
function nodeHttpGet(urlString, headers, timeout = 10000) {
  return new Promise((resolve, reject) => {
    let url;
    try { url = new URL(urlString); } catch (e) { return reject(new Error('Invalid URL')); }
    const protocol = url.protocol === 'https:' ? https : http;
    const req = protocol.get({
      hostname: url.hostname,
      port: url.port || undefined,
      path: url.pathname + url.search,
      headers,
      timeout,
    }, (res) => {
      const chunks = [];
      let size = 0;
      res.on('data', (c) => {
        chunks.push(c);
        size += c.length;
        if (size > 1024 * 1024) req.destroy();     // 릴리즈 JSON 상한
      });
      res.on('end', () => resolve({ statusCode: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// GitHub의 releases/latest 조회(draft·prerelease 제외 → 릴리즈는 published 상태여야 함).
// httpGet(urlString, headers, timeout) → Promise<{statusCode, body}> 는 주입 가능(테스트/프록시 대응).
async function fetchLatestRelease(repo, { apiBase = 'https://api.github.com', timeout = 10000, httpGet = nodeHttpGet } = {}) {
  const url = `${apiBase}/repos/${repo}/releases/latest`;
  const { statusCode, body } = await httpGet(url, {
    'User-Agent': 'SmartMemo-Updater',       // GitHub API는 User-Agent 필수
    'Accept': 'application/vnd.github+json',
  }, timeout);

  if (statusCode !== 200) throw new Error(`HTTP ${statusCode}`);

  let json;
  try { json = JSON.parse(body); }
  catch (e) { throw new Error('Invalid JSON'); }

  return {
    tag_name: json.tag_name,
    html_url: json.html_url,
    assets: Array.isArray(json.assets)
      ? json.assets.map(a => ({ name: a.name, browser_download_url: a.browser_download_url }))
      : [],
  };
}

module.exports = { fetchLatestRelease, nodeHttpGet };

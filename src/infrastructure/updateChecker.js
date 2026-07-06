'use strict';

const https = require('https');
const http = require('http');
const { URL } = require('url');

// GitHub의 releases/latest를 조회한다(draft·prerelease는 제외됨 → 릴리즈는 published 상태여야 함).
// apiBase는 테스트에서 로컬 서버로 교체 가능하도록 주입.
function fetchLatestRelease(repo, { apiBase = 'https://api.github.com', timeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    let url;
    try { url = new URL(`${apiBase}/repos/${repo}/releases/latest`); }
    catch (e) { return reject(new Error('Invalid URL')); }

    const protocol = url.protocol === 'https:' ? https : http;
    const req = protocol.get({
      hostname: url.hostname,
      port: url.port || undefined,
      path: url.pathname + url.search,
      headers: {
        'User-Agent': 'SmartMemo-Updater',       // GitHub API는 User-Agent 필수
        'Accept': 'application/vnd.github+json',
      },
      timeout,
    }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      let size = 0;
      res.on('data', (c) => {
        chunks.push(c);
        size += c.length;
        if (size > 1024 * 1024) req.destroy();     // 릴리즈 JSON 상한
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          resolve({
            tag_name: json.tag_name,
            html_url: json.html_url,
            assets: Array.isArray(json.assets)
              ? json.assets.map(a => ({ name: a.name, browser_download_url: a.browser_download_url }))
              : [],
          });
        } catch (e) {
          reject(new Error('Invalid JSON'));
        }
      });
      res.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

module.exports = { fetchLatestRelease };

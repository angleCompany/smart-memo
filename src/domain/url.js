'use strict';

const PRIVATE_IP_RE = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1$|0\.0\.0\.0)/;

const CATEGORY_MAP = {
  Video:    ['youtube.com','youtu.be','vimeo.com','netflix.com','twitch.tv','dailymotion.com','tving.com','wavve.com'],
  Code:     ['github.com','gitlab.com','stackoverflow.com','npmjs.com','developer.mozilla.org','codepen.io','codesandbox.io','replit.com'],
  Article:  ['medium.com','dev.to','news.ycombinator.com','substack.com','hashnode.com','techcrunch.com','velog.io','brunch.co.kr'],
  Social:   ['twitter.com','x.com','instagram.com','facebook.com','linkedin.com','reddit.com','threads.net','tiktok.com'],
  Shopping: ['amazon.com','ebay.com','etsy.com','aliexpress.com','coupang.com','gmarket.co.kr','11st.co.kr'],
  Korean:   ['naver.com','kakao.com','daum.net','nate.com','tistory.com','ppomppu.co.kr','clien.net','fmkorea.com'],
  Docs:     ['docs.google.com','notion.so','confluence.atlassian.com','wikipedia.org','wikimedia.org'],
};

function normalizeUrl(raw) {
  const s = String(raw || '').trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  // other protocols (ftp://, file://, etc.) pass through so assertSafeUrl can reject them
  if (s.includes('://')) return s;
  return 'https://' + s;
}

function isValidUrl(str) {
  try {
    const s = String(str || '').trim();
    const u = new URL(s.includes('://') ? s : 'https://' + s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch { return false; }
}

function assertSafeUrl(urlString) {
  let u;
  try { u = new URL(urlString); } catch { throw new Error('Invalid URL'); }
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Protocol not allowed');
  if (PRIVATE_IP_RE.test(u.hostname)) throw new Error('Private address not allowed');
}

function categorizeUrl(urlString) {
  try {
    const domain = new URL(urlString).hostname.toLowerCase().replace(/^www\./, '');
    for (const [cat, domains] of Object.entries(CATEGORY_MAP)) {
      if (domains.some(d => domain.includes(d))) return cat;
    }
  } catch { /* invalid url → General */ }
  return 'General';
}

function getDomain(urlString) {
  try { return new URL(urlString).hostname.replace(/^www\./, ''); } catch { return ''; }
}

module.exports = { PRIVATE_IP_RE, CATEGORY_MAP, normalizeUrl, isValidUrl, assertSafeUrl, categorizeUrl, getDomain };

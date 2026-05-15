'use strict';

function decodeEntities(str) {
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .trim();
}

function getMeta(html, type, name) {
  const attr = type === 'property' ? 'property' : 'name';
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']{1,500})["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']{1,500})["'][^>]+${attr}=["']${name}["']`, 'i'),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return decodeEntities(m[1]);
  }
  return '';
}

function getTitle(html) {
  const og = getMeta(html, 'property', 'og:title');
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i);
  return m ? decodeEntities(m[1]) : '';
}

module.exports = { decodeEntities, getMeta, getTitle };

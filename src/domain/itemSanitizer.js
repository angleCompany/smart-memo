'use strict';

const { sanitizeTags } = require('./tags');

const ALLOWED_TYPES = new Set(['url', 'memo', 'todo']);
const ALLOWED_CATEGORIES = new Set(['Video', 'Code', 'Article', 'Social', 'Shopping', 'Korean', 'Docs', 'General']);

function sanitizeImportedItem(item, nowIso = new Date().toISOString()) {
  if (!item || typeof item !== 'object') return null;
  if (!ALLOWED_TYPES.has(item.type)) return null;
  if (item.type === 'url') {
    try {
      const u = new URL(item.content);
      if (!['http:', 'https:'].includes(u.protocol)) return null;
    } catch { return null; }
  }
  const result = {
    id:          String(item.id   || '').slice(0, 64),
    type:        item.type,
    content:     String(item.content     || '').slice(0, 4096),
    title:       String(item.title       || '').slice(0, 500),
    description: String(item.description || '').slice(0, 2000),
    image:       String(item.image       || '').slice(0, 2048),
    domain:      String(item.domain      || '').slice(0, 253),
    category:    ALLOWED_CATEGORIES.has(item.category) ? item.category : 'General',
    tags:        sanitizeTags(item.tags),
    createdAt:   item.createdAt || nowIso,
    updatedAt:   item.updatedAt || nowIso,
  };
  // 할 일: 완료 상태를 보존해야 export→import 시 유실되지 않는다.
  if (item.type === 'todo') {
    result.done = item.done === true;
    result.completedAt = result.done ? (item.completedAt ? String(item.completedAt).slice(0, 40) : nowIso) : null;
  }
  return result;
}

module.exports = { ALLOWED_TYPES, ALLOWED_CATEGORIES, sanitizeImportedItem };

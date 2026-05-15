'use strict';

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 50;

function normalizeTag(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim().toLowerCase().replace(/[,#\s]+/g, '').slice(0, MAX_TAG_LENGTH);
}

function sanitizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const result = [];
  for (const t of tags) {
    const normalized = normalizeTag(t);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
    if (result.length >= MAX_TAGS) break;
  }
  return result;
}

module.exports = { MAX_TAGS, MAX_TAG_LENGTH, normalizeTag, sanitizeTags };

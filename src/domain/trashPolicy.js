'use strict';

const CUTOFF_DAYS = 30;

function isExpired(item, nowMs = Date.now()) {
  if (!item.deletedAt) return false;
  const deletedMs = new Date(item.deletedAt).getTime();
  return nowMs - deletedMs > CUTOFF_DAYS * 24 * 60 * 60 * 1000;
}

function purgeExpired(items, nowMs = Date.now()) {
  return items.filter(i => !isExpired(i, nowMs));
}

module.exports = { CUTOFF_DAYS, isExpired, purgeExpired };

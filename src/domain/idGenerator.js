'use strict';

function generateId(nowMs = Date.now()) {
  return `${nowMs}-${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = { generateId };

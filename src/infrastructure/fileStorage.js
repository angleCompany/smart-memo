'use strict';

const fs = require('fs');
const path = require('path');

function createFileStorage(getDataPath) {
  function load() {
    const p = getDataPath();
    if (!fs.existsSync(p)) return { items: [] };
    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (!Array.isArray(data.items)) data.items = [];
      return data;
    } catch { return { items: [] }; }
  }

  function save(data) {
    const p = getDataPath();
    const dir = path.dirname(p);
    fs.mkdirSync(dir, { recursive: true });
    // atomic write: tmp → rename
    const tmp = p + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, p);
  }

  function exists() {
    return fs.existsSync(getDataPath());
  }

  return { load, save, exists, getPath: getDataPath };
}

module.exports = { createFileStorage };

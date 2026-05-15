'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

function getICloudBase() {
  const p = path.join(os.homedir(), 'Library', 'Mobile Documents', 'com~apple~CloudDocs');
  return fs.existsSync(p) ? p : null;
}

function getICloudDataPath() {
  const base = getICloudBase();
  if (!base) return null;
  const dir = path.join(base, 'SmartMemo');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'data.json');
}

function resolveDataPath(userDataDir, useICloud) {
  if (useICloud) {
    const p = getICloudDataPath();
    if (p) return p;
  }
  return path.join(userDataDir, 'data.json');
}

module.exports = { getICloudBase, getICloudDataPath, resolveDataPath };

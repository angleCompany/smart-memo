'use strict';

const fs = require('fs');

function createConfigStore(getConfigPath) {
  const defaults = { useICloud: false };

  function load() {
    const p = getConfigPath();
    if (!fs.existsSync(p)) return { ...defaults };
    try { return { ...defaults, ...JSON.parse(fs.readFileSync(p, 'utf8')) }; }
    catch { return { ...defaults }; }
  }

  function save(config) {
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
  }

  return { load, save };
}

module.exports = { createConfigStore };

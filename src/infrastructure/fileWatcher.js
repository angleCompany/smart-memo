'use strict';

const fs = require('fs');

function createFileWatcher(getPath, onChange, debounceMs = 800) {
  let watcher = null;
  let debounceTimer = null;

  function start() {
    stop();
    const p = getPath();
    if (!p || !fs.existsSync(p)) return;
    try {
      watcher = fs.watch(p, (eventType) => {
        if (eventType !== 'change') return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(onChange, debounceMs);
      });
    } catch { /* ignore watch errors */ }
  }

  function stop() {
    clearTimeout(debounceTimer);
    if (watcher) {
      try { watcher.close(); } catch { /* ignore */ }
      watcher = null;
    }
  }

  return { start, stop };
}

module.exports = { createFileWatcher };

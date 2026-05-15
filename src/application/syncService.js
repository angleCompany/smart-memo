'use strict';

const fs = require('fs');

function createSyncService({ configStore, storage, resolveDataPath, userDataDir, startWatcher, getICloudBase }) {
  let config = configStore.load();

  function getInfo() {
    const icloudBase = getICloudBase();
    return {
      useICloud: config.useICloud,
      icloudAvailable: !!icloudBase,
      dataPath: storage.getPath(),
      icloudDir: icloudBase ? require('path').join(icloudBase, 'SmartMemo') : null,
    };
  }

  function setUseICloud(useICloud) {
    const oldPath = storage.getPath();
    config.useICloud = useICloud;
    configStore.save(config);

    const newPath = resolveDataPath(userDataDir, useICloud);
    if (oldPath !== newPath) {
      if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
        const path = require('path');
        fs.mkdirSync(path.dirname(newPath), { recursive: true });
        fs.copyFileSync(oldPath, newPath);
      }
    }
    startWatcher();
    return { success: true, dataPath: newPath };
  }

  return { getInfo, setUseICloud };
}

module.exports = { createSyncService };

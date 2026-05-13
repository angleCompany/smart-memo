const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Items
  getItems:          (filters) => ipcRenderer.invoke('get-items', filters),
  getCounts:         ()        => ipcRenderer.invoke('get-counts'),
  fetchUrlMetadata:  (url)     => ipcRenderer.invoke('fetch-url-metadata', url),
  saveItem:          (item)    => ipcRenderer.invoke('save-item', item),
  deleteItem:        (id)      => ipcRenderer.invoke('delete-item', id),
  openUrl:           (url)     => ipcRenderer.invoke('open-url', url),
  getTheme:          ()        => ipcRenderer.invoke('get-theme'),

  // Sync & Settings
  getSyncInfo:       ()                  => ipcRenderer.invoke('get-sync-info'),
  setUseICloud:      (useICloud)         => ipcRenderer.invoke('set-use-icloud', useICloud),
  exportData:        ()                  => ipcRenderer.invoke('export-data'),
  importData:        (mode)              => ipcRenderer.invoke('import-data', mode),
  openInFinder:      (dirPath)           => ipcRenderer.invoke('open-in-finder', dirPath),

  // Events
  onDataUpdated: (callback) => {
    ipcRenderer.on('data-updated', (_, info) => callback(info));
  },
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Items
  getItems:          (filters) => ipcRenderer.invoke('get-items', filters),
  getCounts:         ()        => ipcRenderer.invoke('get-counts'),
  fetchUrlMetadata:  (url)     => ipcRenderer.invoke('fetch-url-metadata', url),
  saveItem:          (item)    => ipcRenderer.invoke('save-item', item),
  toggleTodo:        (id)      => ipcRenderer.invoke('toggle-todo', id),
  deleteItem:        (id)      => ipcRenderer.invoke('delete-item', id),
  restoreItem:       (id)      => ipcRenderer.invoke('restore-item', id),
  emptyTrash:        ()        => ipcRenderer.invoke('empty-trash'),
  permDeleteItem:    (id)      => ipcRenderer.invoke('perm-delete-item', id),
  openUrl:           (url)     => ipcRenderer.invoke('open-url', url),
  getTheme:          ()        => ipcRenderer.invoke('get-theme'),

  // Updates
  getAppVersion:     ()        => ipcRenderer.invoke('get-app-version'),
  checkForUpdates:   ()        => ipcRenderer.invoke('check-for-updates'),

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

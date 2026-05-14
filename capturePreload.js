const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('capture', {
  readClipboard: () => ipcRenderer.invoke('capture-read-clipboard'),
  saveUrl: (url) => ipcRenderer.invoke('capture-save-url', url),
  close: () => ipcRenderer.invoke('capture-close'),
  onFocus: (cb) => ipcRenderer.on('capture-focus', () => cb()),
});

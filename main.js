'use strict';

const { app, BrowserWindow, ipcMain, shell, nativeTheme, dialog, globalShortcut, screen } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');

/* ===== URL Scheme (smartmemo://) ===== */
// dev mode: process.defaultApp=true → electron binary만 등록되면 앱 경로 없이 실행됨
// 해결: 개발 시 execPath + argv[1]로 앱 경로 명시
if (process.defaultApp) {
  app.setAsDefaultProtocolClient('smartmemo', process.execPath, [path.resolve(process.argv[1])]);
} else {
  app.setAsDefaultProtocolClient('smartmemo');
}

const _pendingUrls = [];
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (app.isReady()) handleUrlScheme(url);
  else _pendingUrls.push(url);
});

const { createFileStorage }   = require('./src/infrastructure/fileStorage');
const { createConfigStore }   = require('./src/infrastructure/configStore');
const { createFileWatcher }   = require('./src/infrastructure/fileWatcher');
const { createItemService }   = require('./src/application/itemService');
const { createCaptureService } = require('./src/application/captureService');
const { createImportExportService } = require('./src/application/importExportService');
const { fetchUrlMetadata }    = require('./src/infrastructure/metadataFetcher');
const { getICloudBase, resolveDataPath } = require('./src/infrastructure/icloudDetector');
const { sanitizeImportedItem } = require('./src/domain/itemSanitizer');

let mainWindow;
let captureWindow = null;

/* ===== Bootstrap ===== */
const userDataDir = app.getPath('userData');
const configStore = createConfigStore(() => path.join(userDataDir, 'config.json'));
let config = configStore.load();
let currentDataPath = resolveDataPath(userDataDir, config.useICloud);

const storage = createFileStorage(() => currentDataPath);

function notifyUpdated(info = {}) {
  mainWindow?.webContents.send('data-updated', {
    count: storage.load().items.filter(i => !i.deletedAt).length,
    ...info,
  });
}

const itemService    = createItemService({ storage, notifyUpdated });
const captureService = createCaptureService({ storage, metadataFetcher: fetchUrlMetadata, notifyUpdated });

const fileWatcher = createFileWatcher(
  () => currentDataPath,
  () => notifyUpdated({ source: 'file-watch' }),
);

/* ===== Windows ===== */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, minWidth: 900, minHeight: 600,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'sidebar',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c1c1e' : '#f5f5f7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.loadFile('index.html');
}

function createCaptureWindow() {
  captureWindow = new BrowserWindow({
    width: 580, height: 72,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'capturePreload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  captureWindow.loadFile('capture.html');
  captureWindow.on('blur', () => setTimeout(() => captureWindow?.isVisible() && captureWindow?.hide(), 150));
  captureWindow.on('closed', () => { captureWindow = null; });
}

/* ===== Receipt Toast ===== */
function showReceiptToast(type, label, sub = '') {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const W = 300, H = 52, MARGIN = 16;
  const win = new BrowserWindow({
    x: width - W - MARGIN,
    y: height - H - MARGIN,
    width: W,
    height: H,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    focusable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.setIgnoreMouseEvents(true);
  const q = new URLSearchParams({ type, label, sub }).toString();
  win.loadFile('receipt.html', { query: { type, label, sub } });
  // dismiss after 1.8s
  const dismiss = () => { if (!win.isDestroyed()) win.close(); };
  setTimeout(dismiss, 1800);
}

/* ===== URL Scheme handler ===== */
async function handleUrlScheme(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.hostname === 'capture') {
      const targetUrl = u.searchParams.get('url');
      if (!targetUrl) return;
      const result = await captureService.captureUrl(decodeURIComponent(targetUrl));
      if (result.success) {
        const { getDomain } = require('./src/domain/url');
        showReceiptToast('ok', '저장됨', getDomain(targetUrl) || targetUrl);
      } else if (result.duplicate) {
        showReceiptToast('dup', '이미 저장된 링크', targetUrl);
      } else {
        showReceiptToast('err', result.error || '저장 실패');
      }
    } else if (u.hostname === 'open') {
      if (!mainWindow || mainWindow.isDestroyed()) createWindow();
      else { mainWindow.show(); mainWindow.focus(); }
    }
  } catch (e) {
    console.error('[SmartMemo] URL Scheme 오류:', e.message);
  }
}

function showCaptureWindow() {
  if (!captureWindow || captureWindow.isDestroyed()) createCaptureWindow();
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  captureWindow.setPosition(Math.round((width - 580) / 2), Math.round(height * 0.22));
  captureWindow.show();
  captureWindow.webContents.send('capture-focus');
}

/* ===== App lifecycle ===== */
app.whenReady().then(() => {
  itemService.purgeTrash();
  fileWatcher.start();
  createWindow();

  const shortcutOk = globalShortcut.register('CommandOrControl+Shift+M', showCaptureWindow);
  if (!shortcutOk) console.warn('[SmartMemo] ⌘⇧M 단축키 등록 실패');

  // process URLs received before app was ready (cold start via URL scheme)
  for (const url of _pendingUrls.splice(0)) handleUrlScheme(url);

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('will-quit', () => { globalShortcut.unregisterAll(); fileWatcher.stop(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

/* ===== IPC: Items ===== */
ipcMain.handle('get-items',  (_, filters = {}) => itemService.list(filters));
ipcMain.handle('get-counts', ()                => itemService.counts());

ipcMain.handle('save-item', (_, item) => itemService.save(item));

ipcMain.handle('delete-item',      (_, id) => itemService.softDelete(id));
ipcMain.handle('restore-item',     (_, id) => itemService.restore(id));
ipcMain.handle('empty-trash',      ()       => itemService.emptyTrash());
ipcMain.handle('perm-delete-item', (_, id) => itemService.permDelete(id));

ipcMain.handle('fetch-url-metadata', async (_, url) => {
  try { return { success: true, ...(await fetchUrlMetadata(url)) }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('open-url', (_, url) => {
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    shell.openExternal(url);
    return true;
  } catch { return false; }
});

ipcMain.handle('get-theme', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light');

/* ===== IPC: Sync & Settings ===== */
ipcMain.handle('get-sync-info', () => ({
  useICloud: config.useICloud,
  icloudAvailable: !!getICloudBase(),
  dataPath: currentDataPath,
  icloudDir: getICloudBase() ? path.join(getICloudBase(), 'SmartMemo') : null,
}));

ipcMain.handle('set-use-icloud', async (_, useICloud) => {
  const oldPath = currentDataPath;
  config.useICloud = useICloud;
  configStore.save(config);

  const newPath = resolveDataPath(userDataDir, useICloud);
  if (oldPath !== newPath) {
    if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
      fs.mkdirSync(path.dirname(newPath), { recursive: true });
      fs.copyFileSync(oldPath, newPath);
    }
    currentDataPath = newPath;
  }
  fileWatcher.start();
  return { success: true, dataPath: newPath };
});

/* ===== IPC: Export / Import ===== */
ipcMain.handle('export-data', async () => {
  const defaultName = `smart-memo-${new Date().toISOString().slice(0, 10)}.json`;
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: path.join(os.homedir(), 'Desktop', defaultName),
    filters: [{ name: 'JSON 파일', extensions: ['json'] }],
    buttonLabel: '내보내기',
  });
  if (canceled || !filePath) return { success: false };
  const data = storage.load();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  return { success: true, count: data.items.length };
});

ipcMain.handle('import-data', async (_, mode = 'merge') => {
  const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'JSON 파일', extensions: ['json'] }],
    properties: ['openFile'],
    buttonLabel: '가져오기',
  });
  if (canceled || !filePaths?.[0]) return { success: false };

  let imported;
  try {
    imported = JSON.parse(fs.readFileSync(filePaths[0], 'utf8'));
    if (!Array.isArray(imported.items)) throw new Error('invalid');
  } catch {
    return { success: false, error: '유효하지 않은 파일입니다' };
  }

  const nowIso = new Date().toISOString();
  const sanitized = imported.items.map(i => sanitizeImportedItem(i, nowIso)).filter(Boolean);
  const data = storage.load();

  if (mode === 'merge') {
    const existingIds = new Set(data.items.map(i => i.id));
    const newItems = sanitized.filter(i => !existingIds.has(i.id));
    data.items = [...data.items, ...newItems];
    storage.save(data);
    return { success: true, added: newItems.length, total: imported.items.length };
  } else {
    storage.save({ items: sanitized });
    return { success: true, added: sanitized.length, total: imported.items.length };
  }
});

/* ===== IPC: Quick Capture ===== */
const { clipboard } = require('electron');

ipcMain.handle('capture-read-clipboard', () => clipboard.readText());

ipcMain.handle('capture-save-url', async (_, urlString) => {
  return captureService.captureUrl(urlString);
});

ipcMain.handle('capture-close', () => { captureWindow?.hide(); });

ipcMain.handle('capture-show-toast', (_, { type, label, sub = '' }) => {
  showReceiptToast(type, label, sub);
});

ipcMain.handle('open-in-finder', (_, dirPath) => {
  const icloudBase = getICloudBase();
  const allowed = [
    userDataDir,
    ...(icloudBase ? [path.join(icloudBase, 'SmartMemo')] : []),
  ];
  const normalized = path.resolve(dirPath);
  if (!allowed.some(p => normalized.startsWith(p))) return false;
  shell.showItemInFolder(normalized);
  return true;
});

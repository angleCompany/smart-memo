const { app, BrowserWindow, ipcMain, shell, nativeTheme, dialog } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const https = require('https');
const http = require('http');
const zlib = require('zlib');
const { URL } = require('url');

let mainWindow;
let dataPath;
let appData = { items: [] };
let fileWatcher = null;
let watchDebounceTimer = null;
let config = { useICloud: false };

/* ===== Config ===== */
function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function loadConfig() {
  const p = getConfigPath();
  if (fs.existsSync(p)) {
    try { config = { ...config, ...JSON.parse(fs.readFileSync(p, 'utf8')) }; } catch (e) {}
  }
}

function saveConfig() {
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
}

/* ===== iCloud ===== */
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

function resolveDataPath() {
  if (config.useICloud) {
    const p = getICloudDataPath();
    if (p) return p;
  }
  return path.join(app.getPath('userData'), 'data.json');
}

/* ===== Data ===== */
function loadData() {
  dataPath = resolveDataPath();
  if (fs.existsSync(dataPath)) {
    try {
      appData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      if (!appData.items) appData.items = [];
    } catch (e) {
      appData = { items: [] };
    }
  }
}

function saveData() {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  fs.writeFileSync(dataPath, JSON.stringify(appData, null, 2), 'utf8');
}

/* ===== File watcher (live sync) ===== */
function startFileWatcher() {
  if (fileWatcher) {
    try { fileWatcher.close(); } catch (e) {}
    fileWatcher = null;
  }
  if (!fs.existsSync(dataPath)) return;
  try {
    fileWatcher = fs.watch(dataPath, (eventType) => {
      if (eventType !== 'change') return;
      clearTimeout(watchDebounceTimer);
      watchDebounceTimer = setTimeout(() => {
        const prevCount = appData.items.length;
        loadData();
        mainWindow?.webContents.send('data-updated', { count: appData.items.length, prev: prevCount });
      }, 800);
    });
  } catch (e) {}
}

/* ===== HTTP fetch ===== */
function fetchHtml(urlString) {
  return new Promise((resolve, reject) => {
    const makeRequest = (url, redirectCount = 0) => {
      if (redirectCount > 5) return reject(new Error('Too many redirects'));
      let parsedUrl;
      try { parsedUrl = new URL(url); } catch (e) { return reject(new Error('Invalid URL')); }

      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || undefined,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
        },
        timeout: 12000,
      };

      const req = protocol.get(options, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          try { makeRequest(new URL(res.headers.location, url).toString(), redirectCount + 1); } catch (e) { reject(e); }
          return;
        }

        let stream = res;
        const enc = res.headers['content-encoding'];
        if (enc === 'gzip') stream = res.pipe(zlib.createGunzip());
        else if (enc === 'deflate') stream = res.pipe(zlib.createInflate());
        else if (enc === 'br') stream = res.pipe(zlib.createBrotliDecompress());

        const chunks = [];
        let totalSize = 0;
        stream.on('data', (c) => { chunks.push(c); totalSize += c.length; if (totalSize > 512 * 1024) req.destroy(); });
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        stream.on('error', reject);
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    };
    makeRequest(urlString);
  });
}

/* ===== Metadata parsing ===== */
function decodeEntities(str) {
  return str.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#x27;/g,"'").replace(/&#x2F;/g,'/').replace(/&nbsp;/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(parseInt(n))).trim();
}

function getMeta(html, type, name) {
  const attr = type === 'property' ? 'property' : 'name';
  const ps = [
    new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']{1,500})["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']{1,500})["'][^>]+${attr}=["']${name}["']`, 'i'),
  ];
  for (const p of ps) { const m = html.match(p); if (m?.[1]) return decodeEntities(m[1]); }
  return '';
}

function getTitle(html) {
  const og = getMeta(html, 'property', 'og:title');
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i);
  return m ? decodeEntities(m[1]) : '';
}

function categorizeUrl(urlString) {
  try {
    const domain = new URL(urlString).hostname.toLowerCase().replace('www.', '');
    const map = {
      'Video':    ['youtube.com','youtu.be','vimeo.com','netflix.com','twitch.tv','dailymotion.com','tving.com','wavve.com'],
      'Code':     ['github.com','gitlab.com','stackoverflow.com','npmjs.com','developer.mozilla.org','codepen.io','codesandbox.io','replit.com'],
      'Article':  ['medium.com','dev.to','news.ycombinator.com','substack.com','hashnode.com','techcrunch.com','velog.io','brunch.co.kr'],
      'Social':   ['twitter.com','x.com','instagram.com','facebook.com','linkedin.com','reddit.com','threads.net','tiktok.com'],
      'Shopping': ['amazon.com','ebay.com','etsy.com','aliexpress.com','coupang.com','gmarket.co.kr','11st.co.kr'],
      'Korean':   ['naver.com','kakao.com','daum.net','nate.com','tistory.com','ppomppu.co.kr','clien.net','fmkorea.com'],
      'Docs':     ['docs.google.com','notion.so','confluence.atlassian.com','wikipedia.org','wikimedia.org'],
    };
    for (const [cat, domains] of Object.entries(map)) {
      if (domains.some(d => domain.includes(d))) return cat;
    }
  } catch (e) {}
  return 'General';
}

const PRIVATE_IP_RE = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1$|0\.0\.0\.0)/;

function assertSafeUrl(urlString) {
  const u = new URL(urlString);
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Protocol not allowed');
  if (PRIVATE_IP_RE.test(u.hostname)) throw new Error('Private address not allowed');
}

async function fetchUrlMetadata(urlString) {
  assertSafeUrl(urlString);
  const parsedUrl = new URL(urlString);
  const hostname = parsedUrl.hostname.toLowerCase();

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    try {
      const text = await fetchHtml(`https://www.youtube.com/oembed?url=${encodeURIComponent(urlString)}&format=json`);
      const json = JSON.parse(text);
      return { title: json.title || '', description: `YouTube · ${json.author_name || ''}`, image: json.thumbnail_url || '', category: 'Video', domain: 'youtube.com' };
    } catch (e) {}
  }

  const html = await fetchHtml(urlString);
  return {
    title: getTitle(html),
    description: getMeta(html, 'property', 'og:description') || getMeta(html, 'name', 'description'),
    image: getMeta(html, 'property', 'og:image'),
    category: categorizeUrl(urlString),
    domain: parsedUrl.hostname.replace('www.', ''),
  };
}

/* ===== Window ===== */
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

app.whenReady().then(() => {
  loadConfig();
  loadData();
  startFileWatcher();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

/* ===== IPC: Items ===== */
ipcMain.handle('get-items', (_, filters = {}) => {
  let items = [...appData.items];
  const { category, search } = filters;
  if (category && category !== 'All') {
    items = category === 'Memo' ? items.filter(i => i.type === 'memo') : items.filter(i => i.type === 'url' && i.category === category);
  }
  if (search?.trim()) {
    const q = search.toLowerCase().trim();
    items = items.filter(i => (i.title||'').toLowerCase().includes(q) || (i.content||'').toLowerCase().includes(q) || (i.description||'').toLowerCase().includes(q) || (i.domain||'').toLowerCase().includes(q));
  }
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

ipcMain.handle('get-counts', () => {
  const counts = { All: appData.items.length, Memo: 0 };
  for (const item of appData.items) {
    if (item.type === 'memo') counts.Memo = (counts.Memo || 0) + 1;
    else if (item.type === 'url') counts[item.category] = (counts[item.category] || 0) + 1;
  }
  return counts;
});

ipcMain.handle('fetch-url-metadata', async (_, url) => {
  try { return { success: true, ...(await fetchUrlMetadata(url)) }; }
  catch (e) { return { success: false, error: e.message, category: categorizeUrl(url), domain: '' }; }
});

ipcMain.handle('save-item', (_, item) => {
  if (item.id) {
    const idx = appData.items.findIndex(i => i.id === item.id);
    if (idx !== -1) appData.items[idx] = { ...appData.items[idx], ...item, updatedAt: new Date().toISOString() };
  } else {
    item.id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    item.createdAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    appData.items.unshift(item);
  }
  saveData();
  return item;
});

ipcMain.handle('delete-item', (_, id) => {
  appData.items = appData.items.filter(i => i.id !== id);
  saveData();
  return true;
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
  dataPath,
  icloudDir: getICloudBase() ? path.join(getICloudBase(), 'SmartMemo') : null,
}));

ipcMain.handle('set-use-icloud', async (_, useICloud) => {
  const oldPath = dataPath;
  config.useICloud = useICloud;
  saveConfig();

  const newPath = resolveDataPath();
  if (oldPath !== newPath) {
    if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
      fs.mkdirSync(path.dirname(newPath), { recursive: true });
      fs.copyFileSync(oldPath, newPath);
    }
    dataPath = newPath;
    loadData();
  }
  startFileWatcher();
  return { success: true, dataPath: newPath };
});

ipcMain.handle('export-data', async () => {
  const defaultName = `smart-memo-${new Date().toISOString().slice(0, 10)}.json`;
  const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: path.join(os.homedir(), 'Desktop', defaultName),
    filters: [{ name: 'JSON 파일', extensions: ['json'] }],
    buttonLabel: '내보내기',
  });
  if (canceled || !filePath) return { success: false };
  fs.writeFileSync(filePath, JSON.stringify(appData, null, 2), 'utf8');
  return { success: true, count: appData.items.length };
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
  } catch (e) {
    return { success: false, error: '유효하지 않은 파일입니다' };
  }

  const ALLOWED_TYPES = new Set(['url', 'memo']);
  const ALLOWED_CATEGORIES = new Set(['Video','Code','Article','Social','Shopping','Korean','Docs','General']);

  function sanitizeItem(item) {
    if (!item || typeof item !== 'object') return null;
    if (!ALLOWED_TYPES.has(item.type)) return null;
    if (item.type === 'url') {
      try {
        const u = new URL(item.content);
        if (!['http:', 'https:'].includes(u.protocol)) return null;
      } catch { return null; }
    }
    return {
      id:          String(item.id   || '').slice(0, 64),
      type:        item.type,
      content:     String(item.content     || '').slice(0, 4096),
      title:       String(item.title       || '').slice(0, 500),
      description: String(item.description || '').slice(0, 2000),
      image:       String(item.image       || '').slice(0, 2048),
      domain:      String(item.domain      || '').slice(0, 253),
      category:    ALLOWED_CATEGORIES.has(item.category) ? item.category : 'General',
      createdAt:   item.createdAt || new Date().toISOString(),
      updatedAt:   item.updatedAt || new Date().toISOString(),
    };
  }

  const sanitized = imported.items.map(sanitizeItem).filter(Boolean);

  if (mode === 'merge') {
    const existingIds = new Set(appData.items.map(i => i.id));
    const newItems = sanitized.filter(i => !existingIds.has(i.id));
    appData.items = [...appData.items, ...newItems];
    saveData();
    return { success: true, added: newItems.length, total: imported.items.length };
  } else {
    appData = { items: sanitized };
    saveData();
    return { success: true, added: sanitized.length, total: imported.items.length };
  }
});

ipcMain.handle('open-in-finder', (_, dirPath) => {
  const icloudBase = getICloudBase();
  const allowedPrefixes = [
    app.getPath('userData'),
    ...(icloudBase ? [path.join(icloudBase, 'SmartMemo')] : []),
  ];
  const normalized = path.resolve(dirPath);
  if (!allowedPrefixes.some(p => normalized.startsWith(p))) return false;
  shell.showItemInFolder(normalized);
  return true;
});

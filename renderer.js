/* ===== State ===== */
const state = {
  items: [],
  counts: {},
  selectedCategory: 'All',
  selectedItem: null,
  searchQuery: '',
  editingMemoId: null,
  syncInfo: null,
};

const CATEGORIES = [
  { id: 'All',      icon: '📋', label: '전체' },
  { id: 'Video',    icon: '🎬', label: '비디오' },
  { id: 'Code',     icon: '💻', label: '코드' },
  { id: 'Article',  icon: '📄', label: '아티클' },
  { id: 'Social',   icon: '💬', label: '소셜' },
  { id: 'Korean',   icon: '🇰🇷', label: '국내' },
  { id: 'Shopping', icon: '🛍️', label: '쇼핑' },
  { id: 'Docs',     icon: '📚', label: '문서' },
  { id: 'General',  icon: '🌐', label: '일반' },
  { id: 'Memo',     icon: '✏️', label: '메모' },
];

/* ===== DOM ===== */
const $ = id => document.getElementById(id);
const categoriesEl       = $('categories');
const itemListEl         = $('itemList');
const detailEmptyEl      = $('detailEmpty');
const detailContentEl    = $('detailContent');
const urlInput           = $('urlInput');
const btnAddUrl          = $('btnAddUrl');
const btnNewMemo         = $('btnNewMemo');
const searchInput        = $('searchInput');
const memoModal          = $('memoModal');
const memoTextarea       = $('memoTextarea');
const memoModalTitle     = $('memoModalTitle');
const loadingOverlay     = $('loadingOverlay');
const settingsModal      = $('settingsModal');
const icloudToggle       = $('icloudToggle');
const syncChip           = $('syncChip');
const syncChipIcon       = $('syncChipIcon');
const syncChipLabel      = $('syncChipLabel');
const syncDot            = $('syncDot');
const syncNotification   = $('syncNotification');
const syncNotificationText = $('syncNotificationText');

/* ===== Utils ===== */
function formatDate(iso) {
  const d = new Date(iso), now = new Date(), diff = now - d;
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), day = Math.floor(diff/86400000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  if (h < 24) return `${h}시간 전`;
  if (day < 7) return `${day}일 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function getCatLabel(id) { return CATEGORIES.find(c => c.id === id)?.label || id; }
function getCatIcon(id)  { return CATEGORIES.find(c => c.id === id)?.icon  || '🌐'; }

function isValidUrl(str) {
  try { const u = new URL(str.startsWith('http') ? str : 'https://' + str); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch { return false; }
}

function normalizeUrl(str) {
  return str.startsWith('http://') || str.startsWith('https://') ? str : 'https://' + str;
}

let toastTimer;
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ===== Sync status UI ===== */
function updateSyncChip(info) {
  if (!info) return;
  state.syncInfo = info;
  if (info.useICloud) {
    syncChipIcon.textContent = '☁️';
    syncChipLabel.textContent = 'iCloud';
    syncDot.classList.add('active');
    syncChip.title = `iCloud Drive 동기화 중\n${info.dataPath}`;
  } else {
    syncChipIcon.textContent = '💾';
    syncChipLabel.textContent = '로컬';
    syncDot.classList.remove('active');
    syncChip.title = `로컬 저장\n${info.dataPath}`;
  }
}

let syncNotifTimer;
function showSyncNotification(msg) {
  syncNotificationText.textContent = msg;
  syncNotification.style.display = '';
  syncNotification.classList.add('show');
  clearTimeout(syncNotifTimer);
  syncNotifTimer = setTimeout(() => {
    syncNotification.classList.remove('show');
    setTimeout(() => syncNotification.style.display = 'none', 400);
  }, 3500);
}

/* ===== Render: Sidebar ===== */
function renderSidebar() {
  const { counts } = state;
  let html = '';
  for (const cat of CATEGORIES) {
    const count = counts[cat.id] || 0;
    const active = state.selectedCategory === cat.id ? 'active' : '';
    if (cat.id === 'Memo') html += `<div class="cat-sep"></div>`;
    html += `
      <div class="cat-item ${active}" data-cat="${cat.id}">
        <span class="cat-icon">${cat.icon}</span>
        <span class="cat-label">${cat.label}</span>
        ${count > 0 ? `<span class="cat-count">${count}</span>` : ''}
      </div>`;
  }
  categoriesEl.innerHTML = html;
  categoriesEl.querySelectorAll('.cat-item').forEach(el => {
    el.addEventListener('click', () => selectCategory(el.dataset.cat));
  });
}

/* ===== Render: Item List ===== */
function renderItemList() {
  if (state.items.length === 0) {
    itemListEl.innerHTML = `
      <div class="list-empty">
        <div class="list-empty-icon">${state.selectedCategory === 'Memo' ? '✏️' : '📌'}</div>
        <h3>아직 항목이 없어요</h3>
        <p>${state.searchQuery ? '검색 결과가 없습니다' : 'URL을 붙여넣거나 새 메모를 작성해보세요'}</p>
      </div>`;
    return;
  }

  itemListEl.innerHTML = state.items.map(item => {
    const isSelected = state.selectedItem?.id === item.id;
    const isMemo = item.type === 'memo';

    let thumbHtml = '';
    if (!isMemo) {
      thumbHtml = item.image
        ? `<img class="card-thumb" src="${escHtml(item.image)}" alt="" data-fallback-icon="${escHtml(getCatIcon(item.category))}">`
        : `<div class="card-thumb-placeholder">${getCatIcon(item.category)}</div>`;
    }

    const title = isMemo
      ? (item.content?.split('\n')[0]?.slice(0, 80) || '(빈 메모)')
      : (item.title || item.content || '제목 없음');

    const desc = isMemo
      ? (item.content?.split('\n').slice(1).join(' ')?.slice(0, 120) || '')
      : (item.description?.slice(0, 120) || '');

    const badge = `<span class="badge badge-${isMemo ? 'Memo' : item.category}">${isMemo ? '메모' : getCatLabel(item.category)}</span>`;
    const domain = !isMemo && item.domain ? `<span class="card-domain">${escHtml(item.domain)}</span>` : '';
    const date = `<span class="card-date">${formatDate(item.createdAt)}</span>`;

    return `
      <div class="item-card ${isSelected ? 'selected' : ''}" data-id="${item.id}">
        ${thumbHtml}
        <div class="card-body">
          <div class="card-title">${escHtml(title)}</div>
          ${desc ? `<div class="card-desc">${escHtml(desc)}</div>` : ''}
          <div class="card-meta">${badge}${domain}${date}</div>
        </div>
      </div>`;
  }).join('');

  itemListEl.querySelectorAll('.item-card').forEach(el => {
    el.addEventListener('click', () => selectItem(el.dataset.id));
  });

  itemListEl.querySelectorAll('img[data-fallback-icon]').forEach(img => {
    img.addEventListener('error', () => {
      const icon = img.dataset.fallbackIcon || '🌐';
      const div = document.createElement('div');
      div.className = img.className === 'card-thumb' ? 'card-thumb-placeholder' : 'card-thumb-placeholder';
      div.textContent = icon;
      img.replaceWith(div);
    }, { once: true });
  });
}

/* ===== Render: Detail ===== */
function renderDetail() {
  if (!state.selectedItem) {
    detailEmptyEl.style.display = '';
    detailContentEl.style.display = 'none';
    return;
  }
  detailEmptyEl.style.display = 'none';
  detailContentEl.style.display = '';

  const item = state.selectedItem;
  const isMemo = item.type === 'memo';

  if (isMemo) {
    detailContentEl.innerHTML = `
      <div class="detail-meta">
        <span class="badge badge-Memo">✏️ 메모</span>
        <span class="detail-date">${formatDate(item.createdAt)}</span>
      </div>
      <div class="detail-memo-text">${escHtml(item.content || '')}</div>
      <div class="detail-actions">
        <button class="btn-primary" id="detailEditBtn">편집</button>
        <button class="btn-danger" id="detailDeleteBtn">삭제</button>
      </div>`;
  } else {
    let thumbHtml = '';
    if (item.image) {
      thumbHtml = `
        <div class="detail-thumb-wrap">
          <img class="detail-thumb" src="${escHtml(item.image)}" alt=""
            data-fallback-icon="${escHtml(getCatIcon(item.category))}">
        </div>`;
    }
    detailContentEl.innerHTML = `
      ${thumbHtml}
      <div class="detail-title">${escHtml(item.title || '제목 없음')}</div>
      <a class="detail-url" id="detailUrlLink" title="${escHtml(item.content)}">${escHtml(item.content || '')}</a>
      ${item.description ? `<div class="detail-desc">${escHtml(item.description)}</div>` : ''}
      <div class="detail-meta">
        <span class="badge badge-${item.category}">${getCatIcon(item.category)} ${getCatLabel(item.category)}</span>
        ${item.domain ? `<span class="detail-date">${escHtml(item.domain)}</span>` : ''}
        <span class="detail-date">${formatDate(item.createdAt)}</span>
      </div>
      <div class="detail-actions">
        <button class="btn-primary" id="detailOpenBtn">🔗 열기</button>
        <button class="btn-secondary" id="detailCopyBtn">복사</button>
        <button class="btn-danger" id="detailDeleteBtn">삭제</button>
      </div>`;

    $('detailUrlLink')?.addEventListener('click', () => window.api.openUrl(item.content));
    $('detailOpenBtn')?.addEventListener('click', () => window.api.openUrl(item.content));
    $('detailCopyBtn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(item.content || '');
      showToast('URL이 복사되었습니다');
    });
  }

  $('detailDeleteBtn')?.addEventListener('click', () => deleteItem(item.id));
  $('detailEditBtn')?.addEventListener('click', () => openMemoModal(item));

  detailContentEl.querySelectorAll('img[data-fallback-icon]').forEach(img => {
    img.addEventListener('error', () => {
      const icon = img.dataset.fallbackIcon || '🌐';
      const div = document.createElement('div');
      div.className = 'detail-thumb-placeholder';
      div.textContent = icon;
      img.replaceWith(div);
    }, { once: true });
  });
}

/* ===== Settings modal ===== */
async function openSettings() {
  const info = await window.api.getSyncInfo();
  state.syncInfo = info;

  icloudToggle.checked = info.useICloud;
  $('icloudUnavailableBanner').style.display = info.icloudAvailable ? 'none' : '';
  $('shareSection').style.display = info.useICloud ? '' : 'none';
  $('dataPathBox').textContent = info.dataPath || '';
  if (info.icloudDir) {
    $('icloudPathDesc').textContent = info.useICloud
      ? `📂 ${info.dataPath}`
      : '같은 Apple 계정의 모든 기기에서 자동 동기화';
  }

  settingsModal.style.display = '';
}

function closeSettings() {
  settingsModal.style.display = 'none';
}

/* ===== Data Actions ===== */
async function loadAll() {
  [state.items, state.counts] = await Promise.all([
    window.api.getItems({ category: state.selectedCategory, search: state.searchQuery }),
    window.api.getCounts(),
  ]);
  renderSidebar();
  renderItemList();
  renderDetail();
}

function selectCategory(cat) {
  state.selectedCategory = cat;
  state.selectedItem = null;
  loadAll();
}

function selectItem(id) {
  state.selectedItem = state.items.find(i => i.id === id) || null;
  renderItemList();
  renderDetail();
}

async function deleteItem(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  await window.api.deleteItem(id);
  if (state.selectedItem?.id === id) state.selectedItem = null;
  showToast('삭제되었습니다');
  await loadAll();
}

async function addUrl() {
  const raw = urlInput.value.trim();
  if (!raw) return;
  if (!isValidUrl(raw)) { showToast('올바른 URL을 입력해주세요'); return; }

  const url = normalizeUrl(raw);
  urlInput.value = '';
  loadingOverlay.style.display = '';

  try {
    const meta = await window.api.fetchUrlMetadata(url);
    const saved = await window.api.saveItem({
      type: 'url', content: url,
      title: meta.title || url,
      description: meta.description || '',
      image: meta.image || '',
      category: meta.category || 'General',
      domain: meta.domain || new URL(url).hostname.replace('www.', ''),
    });
    state.selectedItem = saved;
    showToast(`저장됨: ${(meta.title || url).slice(0, 30)}`);
  } catch (e) {
    showToast('저장 중 오류가 발생했습니다');
  } finally {
    loadingOverlay.style.display = 'none';
  }
  await loadAll();
}

function openMemoModal(existing = null) {
  state.editingMemoId = existing?.id || null;
  memoModalTitle.textContent = existing ? '메모 편집' : '새 메모';
  memoTextarea.value = existing?.content || '';
  memoModal.style.display = '';
  setTimeout(() => memoTextarea.focus(), 50);
}

function closeMemoModal() {
  memoModal.style.display = 'none';
  memoTextarea.value = '';
  state.editingMemoId = null;
}

async function saveMemo() {
  const content = memoTextarea.value.trim();
  if (!content) { showToast('메모 내용을 입력해주세요'); return; }
  const item = { type: 'memo', content };
  if (state.editingMemoId) item.id = state.editingMemoId;
  const saved = await window.api.saveItem(item);
  state.selectedItem = saved;
  closeMemoModal();
  showToast(state.editingMemoId ? '메모가 수정되었습니다' : '메모가 저장되었습니다');
  await loadAll();
}

/* ===== Event Listeners ===== */
btnAddUrl.addEventListener('click', addUrl);
urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') addUrl(); });
urlInput.addEventListener('paste', () => {
  setTimeout(() => { if (isValidUrl(urlInput.value.trim())) addUrl(); }, 0);
});

btnNewMemo.addEventListener('click', () => openMemoModal());
$('btnCloseMemo').addEventListener('click', closeMemoModal);
$('btnCancelMemo').addEventListener('click', closeMemoModal);
$('btnSaveMemo').addEventListener('click', saveMemo);
memoModal.addEventListener('click', e => { if (e.target === memoModal) closeMemoModal(); });
memoTextarea.addEventListener('keydown', e => { if (e.key === 'Enter' && e.metaKey) saveMemo(); });

let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.searchQuery = searchInput.value.trim();
    state.selectedItem = null;
    loadAll();
  }, 250);
});

// Sidebar footer
$('btnSettings').addEventListener('click', openSettings);
syncChip.addEventListener('click', openSettings);
$('btnCloseSettings').addEventListener('click', closeSettings);
settingsModal.addEventListener('click', e => { if (e.target === settingsModal) closeSettings(); });

// iCloud toggle
icloudToggle.addEventListener('change', async () => {
  const useICloud = icloudToggle.checked;
  const info = state.syncInfo;
  if (useICloud && !info?.icloudAvailable) {
    icloudToggle.checked = false;
    showToast('iCloud Drive가 활성화되어 있지 않습니다');
    return;
  }
  const result = await window.api.setUseICloud(useICloud);
  if (result.success) {
    const updatedInfo = await window.api.getSyncInfo();
    updateSyncChip(updatedInfo);
    state.syncInfo = updatedInfo;
    $('shareSection').style.display = useICloud ? '' : 'none';
    $('dataPathBox').textContent = result.dataPath || '';
    $('icloudPathDesc').textContent = useICloud ? `📂 ${result.dataPath}` : '같은 Apple 계정의 모든 기기에서 자동 동기화';
    showToast(useICloud ? '☁️ iCloud Drive 동기화가 활성화되었습니다' : '💾 로컬 저장으로 전환되었습니다');
    await loadAll();
  }
});

// Finder
$('btnOpenFinder').addEventListener('click', () => {
  if (state.syncInfo?.icloudDir) window.api.openInFinder(state.syncInfo.icloudDir);
});

// Export
$('btnExport').addEventListener('click', async () => {
  const result = await window.api.exportData();
  if (result.success) showToast(`✅ ${result.count}개 항목을 내보냈습니다`);
  else if (result !== false) showToast('내보내기가 취소되었습니다');
});

// Import
$('btnImport').addEventListener('click', async () => {
  const result = await window.api.importData('merge');
  if (result.success) {
    showToast(`📥 ${result.added}개 항목을 가져왔습니다 (전체 ${result.total}개 중)`);
    closeSettings();
    await loadAll();
  } else if (result.error) {
    showToast(`❌ ${result.error}`);
  }
});

// Listen for live sync updates from file watcher
window.api.onDataUpdated((info) => {
  loadAll();
  const diff = (info?.count || 0) - (info?.prev || 0);
  if (diff > 0) showSyncNotification(`☁️ 동기화 완료: ${diff}개 항목이 추가되었습니다`);
  else showSyncNotification('☁️ 다른 기기에서 데이터가 동기화되었습니다');
});

/* ===== Init ===== */
async function init() {
  const info = await window.api.getSyncInfo();
  updateSyncChip(info);
  await loadAll();
}

init();

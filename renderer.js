import { state } from './src/ui/state.js';
import { showToast, isValidUrl, normalizeUrl } from './src/ui/utils.js';
import { renderSidebar } from './src/ui/views/sidebar.js';
import { renderItemList } from './src/ui/views/itemList.js';
import { renderDetail } from './src/ui/views/detail.js';
import { openMemoModal, closeMemoModal, renderMemoTagsUI } from './src/ui/views/modals.js';
import { updateSyncChip, showSyncNotification } from './src/ui/views/sync.js';
import { getMemoMarkdown, handleEditorKeydown, handleEditorPaste, refreshEditorPlaceholder } from './src/ui/views/memoEditor.js';

/* ===== DOM refs ===== */
const $ = id => document.getElementById(id);
const categoriesEl       = $('categories');
const itemListEl         = $('itemList');
const detailEmptyEl      = $('detailEmpty');
const detailContentEl    = $('detailContent');
const urlInput           = $('urlInput');
const memoModal          = $('memoModal');
const memoEditor         = $('memoEditor');
const memoModalTitle     = $('memoModalTitle');
const todoModal          = $('todoModal');
const todoEditor         = $('todoEditor');
const todoModalTitle     = $('todoModalTitle');
const todoTagsDisplay    = $('todoTagsDisplay');
const settingsModal      = $('settingsModal');
const icloudToggle       = $('icloudToggle');
const syncChip           = $('syncChip');
const syncNotification   = $('syncNotification');
const syncNotificationText = $('syncNotificationText');
const memoTagsDisplay    = $('memoTagsDisplay');

const memoElements = { modal: memoModal, title: memoModalTitle, editor: memoEditor, tagsDisplay: memoTagsDisplay };
const settingsElements = {
  shareSection:         $('shareSection'),
  dataPathBox:          $('dataPathBox'),
  icloudPathDesc:       $('icloudPathDesc'),
  icloudUnavailableBanner: $('icloudUnavailableBanner'),
};
const syncChipElements = {
  icon:  $('syncChipIcon'),
  label: $('syncChipLabel'),
  dot:   $('syncDot'),
  chip:  syncChip,
};

/* ===== Detail action set (avoids repetition) ===== */
function detailActions() {
  return {
    onDelete:          deleteItem,
    onRestore:         restoreItem,
    onPermDelete:      permDeleteItem,
    onOpenMemo:        item => openMemoModal(memoElements, state, item),
    onOpenTodo:        openTodoModal,
    onSaveItem:        saveItem,
    onSidebarRefresh:  refreshSidebar,
    onToggleTodo:      toggleTodo,
  };
}

function listActions() {
  return { onSelectItem: selectItem, onEmptyTrash: emptyTrash, onToggleTodo: toggleTodo };
}

/* ===== Render ===== */
function render() {
  renderSidebar(categoriesEl, state, { onSelectCategory: selectCategory });
  renderItemList(itemListEl, state, listActions());
  renderDetail(detailEmptyEl, detailContentEl, state, detailActions());
}

async function refreshSidebar() {
  const counts = await window.api.getCounts();
  state.counts = counts;
  state.tagCounts = counts.tags || {};
  renderSidebar(categoriesEl, state, { onSelectCategory: selectCategory });
}

/* ===== Data actions ===== */
async function loadAll() {
  const [items, counts] = await Promise.all([
    window.api.getItems({ category: state.selectedCategory, search: state.searchQuery }),
    window.api.getCounts(),
  ]);
  state.items = items;
  state.counts = counts;
  state.tagCounts = counts.tags || {};
  render();
}

function selectCategory(cat) {
  state.selectedCategory = cat;
  state.selectedItem = null;
  loadAll();
}

function selectItem(id) {
  state.selectedItem = state.items.find(i => i.id === id) || null;
  renderItemList(itemListEl, state, listActions());
  renderDetail(detailEmptyEl, detailContentEl, state, detailActions());
}

async function saveItem(item) {
  return window.api.saveItem(item);
}

// 할 일 추가/편집 모달 (메모와 동일한 방식, 평문 여러 줄)
function openTodoModal(existing = null) {
  state.editingTodoId = existing?.id || null;
  state.editingMemoTags = [...(existing?.tags || [])];  // 한 번에 한 모달만 열리므로 태그 상태 공유
  todoModalTitle.textContent = existing ? '할 일 편집' : '새 할 일';
  todoEditor.value = existing?.content || '';
  renderMemoTagsUI(todoTagsDisplay, state);
  todoModal.style.display = '';
  setTimeout(() => todoEditor.focus(), 50);
}

function closeTodoModal() {
  todoModal.style.display = 'none';
  todoEditor.value = '';
  state.editingTodoId = null;
}

async function saveTodo() {
  const content = todoEditor.value.trim();
  if (!content) { showToast('할 일 내용을 입력해주세요'); return; }

  const tagInput = $('todoTagInput');
  if (tagInput?.value.trim()) {
    const extra = tagInput.value.trim().toLowerCase().replace(/[,#\s]+/g, '');
    if (extra && !state.editingMemoTags.includes(extra)) state.editingMemoTags.push(extra);
    tagInput.value = '';
  }

  const isEditing = !!state.editingTodoId;
  // 편집 시 done/completedAt은 넘기지 않아 itemService.save의 spread가 기존 값을 보존한다.
  const item = { type: 'todo', content, tags: [...state.editingMemoTags] };
  if (isEditing) item.id = state.editingTodoId;
  else { item.done = false; item.completedAt = null; }
  const saved = await window.api.saveItem(item);
  state.selectedItem = saved;
  closeTodoModal();
  showToast(isEditing ? '할 일이 수정되었습니다' : '할 일이 추가되었습니다');
  await loadAll();
}

async function toggleTodo(id) {
  const updated = await window.api.toggleTodo(id);
  if (updated && state.selectedItem?.id === id) state.selectedItem = updated;
  await loadAll();
}

async function deleteItem(id) {
  await window.api.deleteItem(id);
  if (state.selectedItem?.id === id) state.selectedItem = null;
  showToast('휴지통으로 이동했습니다');
  await loadAll();
}

async function restoreItem(id) {
  await window.api.restoreItem(id);
  if (state.selectedItem?.id === id) state.selectedItem = null;
  showToast('복원되었습니다');
  await loadAll();
}

async function permDeleteItem(id) {
  if (!confirm('영구 삭제하면 복원할 수 없습니다. 계속하시겠습니까?')) return;
  await window.api.permDeleteItem(id);
  if (state.selectedItem?.id === id) state.selectedItem = null;
  showToast('영구 삭제되었습니다');
  await loadAll();
}

async function emptyTrash() {
  await window.api.emptyTrash();
  state.selectedItem = null;
  showToast('휴지통을 비웠습니다');
  await loadAll();
}

async function addUrl() {
  const raw = urlInput.value.trim();
  if (!raw) return;
  if (!isValidUrl(raw)) { showToast('올바른 URL을 입력해주세요'); return; }
  const url = normalizeUrl(raw);

  const exists = state.items.find(i => !i.deletedAt && i.type === 'url' && i.content === url);
  if (exists) {
    showToast('이미 저장된 URL입니다');
    state.selectedItem = exists;
    renderItemList(itemListEl, state, listActions());
    renderDetail(detailEmptyEl, detailContentEl, state, detailActions());
    return;
  }

  urlInput.value = '';
  const hostname = new URL(url).hostname.replace('www.', '');
  let saved;
  try {
    saved = await window.api.saveItem({
      type: 'url', content: url,
      title: url, description: '', image: '',
      category: 'General', domain: hostname, tags: [],
    });
  } catch {
    showToast('저장 중 오류가 발생했습니다');
    return;
  }
  state.selectedItem = saved;
  showToast('저장됨 — 메타데이터 로딩 중...');
  await loadAll();

  // fetch metadata in background, update silently
  window.api.fetchUrlMetadata(url).then(async meta => {
    if (!meta.success) return;
    const updated = await window.api.saveItem({
      ...saved,
      title: meta.title || url,
      description: meta.description || '',
      image: meta.image || '',
      category: meta.category || 'General',
      domain: meta.domain || hostname,
    });
    if (state.selectedItem?.id === saved.id) state.selectedItem = updated;
    await loadAll();
  }).catch(() => {});
}

async function saveMemo() {
  const content = getMemoMarkdown(memoEditor).trim();
  if (!content) { showToast('메모 내용을 입력해주세요'); return; }

  const tagInput = $('memoTagInput');
  if (tagInput?.value.trim()) {
    const extra = tagInput.value.trim().toLowerCase().replace(/[,#\s]+/g, '');
    if (extra && !state.editingMemoTags.includes(extra)) state.editingMemoTags.push(extra);
    tagInput.value = '';
  }

  const isEditing = !!state.editingMemoId;
  const item = { type: 'memo', content, tags: [...state.editingMemoTags] };
  if (isEditing) item.id = state.editingMemoId;
  const saved = await window.api.saveItem(item);
  state.selectedItem = saved;
  closeMemoModal(memoElements, state);
  showToast(isEditing ? '메모가 수정되었습니다' : '메모가 저장되었습니다');
  await loadAll();
}

async function openSettings() {
  const info = await window.api.getSyncInfo();
  state.syncInfo = info;
  icloudToggle.checked = info.useICloud;
  settingsElements.icloudUnavailableBanner.style.display = info.icloudAvailable ? 'none' : '';
  settingsElements.shareSection.style.display = info.useICloud ? '' : 'none';
  settingsElements.dataPathBox.textContent = info.dataPath || '';
  if (info.icloudDir) {
    settingsElements.icloudPathDesc.textContent = info.useICloud
      ? `📂 ${info.dataPath}`
      : '같은 Apple 계정의 모든 기기에서 자동 동기화';
  }
  settingsModal.style.display = '';
}

function closeSettings() { settingsModal.style.display = 'none'; }

/* ===== Sync chip (status bar) ===== */
function updateSyncChipUI(info) {
  updateSyncChip(syncChipElements, state, info);
}

/* ===== Event bindings ===== */
$('btnAddUrl').addEventListener('click', addUrl);
urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') addUrl(); });

$('btnNewMemo').addEventListener('click', () => openMemoModal(memoElements, state));
$('btnNewTodo').addEventListener('click', () => openTodoModal());
$('btnCloseTodo').addEventListener('click', closeTodoModal);
$('btnCancelTodo').addEventListener('click', closeTodoModal);
$('btnSaveTodo').addEventListener('click', saveTodo);
todoModal.addEventListener('click', e => { if (e.target === todoModal) closeTodoModal(); });
todoEditor.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveTodo(); }
});
$('btnCloseMemo').addEventListener('click', () => closeMemoModal(memoElements, state));
$('btnCancelMemo').addEventListener('click', () => closeMemoModal(memoElements, state));
$('btnSaveMemo').addEventListener('click', saveMemo);
memoModal.addEventListener('click', e => { if (e.target === memoModal) closeMemoModal(memoElements, state); });
memoEditor.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.metaKey) { e.preventDefault(); saveMemo(); return; }
  handleEditorKeydown(e, memoEditor);
});
memoEditor.addEventListener('input', () => refreshEditorPlaceholder(memoEditor));
memoEditor.addEventListener('paste', e => handleEditorPaste(e, memoEditor));

document.addEventListener('keydown', e => {
  const id = e.target?.id;
  if (id !== 'memoTagInput' && id !== 'todoTagInput') return;
  if (e.isComposing) return;
  if (e.key !== 'Enter' && e.key !== ',') return;
  e.preventDefault();
  const tag = e.target.value.trim().toLowerCase().replace(/[,#\s]+/g, '');
  if (tag && !state.editingMemoTags.includes(tag)) {
    state.editingMemoTags.push(tag);
    renderMemoTagsUI(id === 'memoTagInput' ? memoTagsDisplay : todoTagsDisplay, state);
  }
  e.target.value = '';
});

let searchTimer;
$('searchInput').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.searchQuery = $('searchInput').value.trim();
    state.selectedItem = null;
    loadAll();
  }, 250);
});

$('btnSettings').addEventListener('click', openSettings);
syncChip.addEventListener('click', openSettings);
$('btnCloseSettings').addEventListener('click', closeSettings);
settingsModal.addEventListener('click', e => { if (e.target === settingsModal) closeSettings(); });

icloudToggle.addEventListener('change', async () => {
  const useICloud = icloudToggle.checked;
  if (useICloud && !state.syncInfo?.icloudAvailable) {
    icloudToggle.checked = false;
    showToast('iCloud Drive가 활성화되어 있지 않습니다');
    return;
  }
  const result = await window.api.setUseICloud(useICloud);
  if (result.success) {
    const updatedInfo = await window.api.getSyncInfo();
    updateSyncChipUI(updatedInfo);
    settingsElements.shareSection.style.display = useICloud ? '' : 'none';
    settingsElements.dataPathBox.textContent = result.dataPath || '';
    settingsElements.icloudPathDesc.textContent = useICloud
      ? `📂 ${result.dataPath}`
      : '같은 Apple 계정의 모든 기기에서 자동 동기화';
    showToast(useICloud ? '☁️ iCloud Drive 동기화가 활성화되었습니다' : '💾 로컬 저장으로 전환되었습니다');
    await loadAll();
  }
});

$('btnOpenFinder').addEventListener('click', () => {
  if (state.syncInfo?.icloudDir) window.api.openInFinder(state.syncInfo.icloudDir);
});

$('btnExport').addEventListener('click', async () => {
  const result = await window.api.exportData();
  if (result.success) showToast(`✅ ${result.count}개 항목을 내보냈습니다`);
  else if (result !== false) showToast('내보내기가 취소되었습니다');
});

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

window.api.onDataUpdated(info => {
  loadAll();
  const diff = (info?.count || 0) - (info?.prev || 0);
  const msg = diff > 0
    ? `☁️ 동기화 완료: ${diff}개 항목이 추가되었습니다`
    : '☁️ 다른 기기에서 데이터가 동기화되었습니다';
  showSyncNotification(syncNotification, syncNotificationText, msg);
});

/* ===== Init ===== */
async function init() {
  const info = await window.api.getSyncInfo();
  updateSyncChipUI(info);
  await loadAll();
}

init();

import { escHtml, formatDate, showToast } from '../utils.js';
import { getCatLabel, getCatIcon } from '../categories.js';
import { mdToHtml } from '../markdown.js';

function tagsHtml(item) {
  const chips = (item.tags || []).map(t =>
    `<span class="tag-chip-edit">#${escHtml(t)}<button class="tag-chip-remove" data-tag="${escHtml(t)}">×</button></span>`
  ).join('');
  return `
    <div class="detail-tags-section">
      <div class="detail-tags-label">태그</div>
      <div class="detail-tags-row">
        <div class="detail-tags-chips" id="detailTagChips">${chips}</div>
        <input class="tag-add-input" id="tagAddInput" placeholder="태그 추가 (Enter)" maxlength="50" />
      </div>
    </div>`;
}

function refreshTagChips(item, onSaveItem, onSidebarRefresh) {
  const chipsEl = document.getElementById('detailTagChips');
  if (!chipsEl) return;
  chipsEl.innerHTML = (item.tags || []).map(t =>
    `<span class="tag-chip-edit">#${escHtml(t)}<button class="tag-chip-remove" data-tag="${escHtml(t)}">×</button></span>`
  ).join('');
  chipsEl.querySelectorAll('.tag-chip-remove').forEach(btn => {
    btn.addEventListener('click', () => removeTag(item, btn.dataset.tag, onSaveItem, onSidebarRefresh));
  });
  onSidebarRefresh();
}

async function removeTag(item, tag, onSaveItem, onSidebarRefresh) {
  const saved = await onSaveItem({ ...item, tags: (item.tags || []).filter(t => t !== tag) });
  item.tags = saved.tags;
  refreshTagChips(item, onSaveItem, onSidebarRefresh);
}

function bindTagInput(item, onSaveItem, onSidebarRefresh) {
  const input = document.getElementById('tagAddInput');
  if (!input) return;
  refreshTagChips(item, onSaveItem, onSidebarRefresh);
  input.addEventListener('keydown', async e => {
    if (e.isComposing) return;
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const raw = input.value.trim().replace(/^[,#\s]+/, '').replace(/[,#\s]+$/, '');
    if (!raw) return;
    const tag = raw.toLowerCase();
    if ((item.tags || []).includes(tag)) { input.value = ''; return; }
    input.value = '';
    const saved = await onSaveItem({ ...item, tags: [...(item.tags || []), tag] });
    item.tags = saved.tags;
    refreshTagChips(item, onSaveItem, onSidebarRefresh);
    input.focus();
  });
}

export function renderDetail(emptyEl, contentEl, state, actions) {
  const { onDelete, onRestore, onPermDelete, onOpenMemo, onOpenTodo, onSaveItem, onSidebarRefresh, onToggleTodo } = actions;

  if (!state.selectedItem) {
    emptyEl.style.display = '';
    contentEl.style.display = 'none';
    return;
  }
  emptyEl.style.display = 'none';
  contentEl.style.display = '';

  const item = state.selectedItem;
  const isMemo = item.type === 'memo';
  const isTodo = item.type === 'todo';

  if (item.deletedAt) {
    contentEl.innerHTML = `
      <div class="detail-title">${escHtml(item.title || item.content || '제목 없음')}</div>
      ${item.description ? `<div class="detail-desc">${escHtml(item.description)}</div>` : ''}
      <div class="detail-meta">
        <span class="badge badge-${isMemo ? 'Memo' : item.category}">${isMemo ? '✏️ 메모' : getCatLabel(item.category)}</span>
        <span class="detail-date">${formatDate(item.deletedAt)} 삭제됨</span>
      </div>
      <div class="detail-actions">
        <button class="btn-secondary" id="detailRestoreBtn">↩ 복원</button>
        <button class="btn-danger" id="detailPermDeleteBtn">영구 삭제</button>
      </div>`;
    document.getElementById('detailRestoreBtn')?.addEventListener('click', () => onRestore(item.id));
    document.getElementById('detailPermDeleteBtn')?.addEventListener('click', () => onPermDelete(item.id));
    return;
  }

  if (isTodo) {
    contentEl.innerHTML = `
      <div class="detail-meta">
        <span class="badge badge-Todo">✅ 할 일</span>
        <span class="detail-date">${formatDate(item.createdAt)}</span>
        ${item.done ? `<span class="detail-date">${formatDate(item.completedAt || item.updatedAt)} 완료</span>` : ''}
      </div>
      <div class="detail-todo-text ${item.done ? 'todo-done' : ''}">${escHtml(item.content || '')}</div>
      ${tagsHtml(item)}
      <div class="detail-actions">
        <button class="btn-primary" id="detailToggleBtn">${item.done ? '↩ 미완료로 되돌리기' : '✓ 완료 처리'}</button>
        <button class="btn-secondary" id="detailEditTodoBtn">편집</button>
        <button class="btn-danger" id="detailDeleteBtn">휴지통으로</button>
      </div>`;
    document.getElementById('detailToggleBtn')?.addEventListener('click', () => onToggleTodo(item.id));
    document.getElementById('detailEditTodoBtn')?.addEventListener('click', () => onOpenTodo(item));
  } else if (isMemo) {
    contentEl.innerHTML = `
      <div class="detail-meta">
        <span class="badge badge-Memo">✏️ 메모</span>
        <span class="detail-date">${formatDate(item.createdAt)}</span>
      </div>
      <div class="detail-memo-text md-rendered">${mdToHtml(item.content || '')}</div>
      ${tagsHtml(item)}
      <div class="detail-actions">
        <button class="btn-primary" id="detailEditBtn">편집</button>
        <button class="btn-danger" id="detailDeleteBtn">휴지통으로</button>
      </div>`;
  } else {
    const thumb = item.image
      ? `<div class="detail-thumb-wrap"><img class="detail-thumb" src="${escHtml(item.image)}" alt="" data-fallback-icon="${escHtml(getCatIcon(item.category))}"></div>`
      : '';
    contentEl.innerHTML = `
      ${thumb}
      <div class="detail-title">${escHtml(item.title || '제목 없음')}</div>
      <a class="detail-url" id="detailUrlLink" title="${escHtml(item.content)}">${escHtml(item.content || '')}</a>
      ${item.description ? `<div class="detail-desc">${escHtml(item.description)}</div>` : ''}
      <div class="detail-meta">
        <span class="badge badge-${item.category}">${getCatIcon(item.category)} ${getCatLabel(item.category)}</span>
        ${item.domain ? `<span class="detail-date">${escHtml(item.domain)}</span>` : ''}
        <span class="detail-date">${formatDate(item.createdAt)}</span>
      </div>
      ${tagsHtml(item)}
      <div class="detail-actions">
        <button class="btn-primary" id="detailOpenBtn">🔗 열기</button>
        <button class="btn-secondary" id="detailCopyBtn">복사</button>
        <button class="btn-danger" id="detailDeleteBtn">휴지통으로</button>
      </div>`;

    document.getElementById('detailUrlLink')?.addEventListener('click', () => window.api.openUrl(item.content));
    document.getElementById('detailOpenBtn')?.addEventListener('click', () => window.api.openUrl(item.content));
    document.getElementById('detailCopyBtn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(item.content || '');
      showToast('URL이 복사되었습니다');
    });
    contentEl.querySelectorAll('img[data-fallback-icon]').forEach(img => {
      img.addEventListener('error', () => {
        const div = document.createElement('div');
        div.className = 'detail-thumb-placeholder';
        div.textContent = img.dataset.fallbackIcon || '🌐';
        img.replaceWith(div);
      }, { once: true });
    });
  }

  document.getElementById('detailDeleteBtn')?.addEventListener('click', () => onDelete(item.id));
  document.getElementById('detailEditBtn')?.addEventListener('click', () => onOpenMemo(item));
  bindTagInput(item, onSaveItem, onSidebarRefresh);
}

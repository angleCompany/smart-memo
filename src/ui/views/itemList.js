import { escHtml, formatDate } from '../utils.js';
import { getCatLabel, getCatIcon } from '../categories.js';
import { memoPreview } from '../markdown.js';

export function renderItemList(el, state, { onSelectItem, onEmptyTrash, onToggleTodo }) {
  if (state.selectedCategory === 'Trash' && state.items.length === 0) {
    el.innerHTML = `
      <div class="list-empty">
        <div class="list-empty-icon">🗑️</div>
        <h3>휴지통이 비어있습니다</h3>
        <p>삭제된 항목이 30일 후 자동으로 영구 삭제됩니다</p>
      </div>`;
    return;
  }

  if (state.items.length === 0) {
    el.innerHTML = `
      <div class="list-empty">
        <div class="list-empty-icon">${state.selectedCategory === 'Memo' ? '✏️' : state.selectedCategory === 'Todo' ? '✅' : '📌'}</div>
        <h3>아직 항목이 없어요</h3>
        <p>${state.searchQuery ? '검색 결과가 없습니다' : state.selectedCategory === 'Todo' ? '위 입력창에 할 일을 적어보세요' : 'URL을 붙여넣거나 새 메모를 작성해보세요'}</p>
      </div>`;
    return;
  }

  let listHtml = state.items.map(item => {
    const isSelected = state.selectedItem?.id === item.id;
    const isMemo = item.type === 'memo';

    if (item.type === 'todo') {
      const text = (item.content || '').split('\n')[0].slice(0, 200) || '(빈 할 일)';
      const date = `<span class="card-date">${formatDate(item.done ? (item.completedAt || item.updatedAt) : item.createdAt)}</span>`;
      const tagChips = (item.tags || []).slice(0, 4).map(t => `<span class="tag-chip-sm">#${escHtml(t)}</span>`).join('');
      // 휴지통 항목은 토글 불가 — 정적 체크박스로 표시하고 클릭은 상세(복원/영구삭제)로.
      const check = item.deletedAt
        ? `<span class="todo-check todo-check-static ${item.done ? 'checked' : ''}">${item.done ? '✓' : ''}</span>`
        : `<button class="todo-check ${item.done ? 'checked' : ''}" data-todo-id="${item.id}" aria-label="완료 토글">${item.done ? '✓' : ''}</button>`;
      return `
        <div class="item-card todo-card ${item.done ? 'todo-done' : ''} ${isSelected ? 'selected' : ''}" data-id="${item.id}">
          ${check}
          <div class="card-body">
            <div class="card-title todo-text">${escHtml(text)}</div>
            <div class="card-meta">${date}</div>
            ${tagChips ? `<div class="card-tags">${tagChips}</div>` : ''}
          </div>
        </div>`;
    }

    let thumbHtml = '';
    if (!isMemo) {
      thumbHtml = item.image
        ? `<img class="card-thumb" src="${escHtml(item.image)}" alt="" data-fallback-icon="${escHtml(getCatIcon(item.category))}">`
        : `<div class="card-thumb-placeholder">${getCatIcon(item.category)}</div>`;
    }

    const preview = isMemo ? memoPreview(item.content || '') : null;

    const title = isMemo
      ? (preview.title.slice(0, 80) || '(빈 메모)')
      : (item.title || item.content || '제목 없음');

    const desc = isMemo
      ? preview.desc.slice(0, 120)
      : (item.description?.slice(0, 120) || '');

    const badge = `<span class="badge badge-${isMemo ? 'Memo' : item.category}">${isMemo ? '메모' : getCatLabel(item.category)}</span>`;
    const domain = !isMemo && item.domain ? `<span class="card-domain">${escHtml(item.domain)}</span>` : '';
    const date = `<span class="card-date">${formatDate(item.createdAt)}</span>`;
    const tagChips = (item.tags || []).slice(0, 4).map(t => `<span class="tag-chip-sm">#${escHtml(t)}</span>`).join('');

    return `
      <div class="item-card ${isSelected ? 'selected' : ''}" data-id="${item.id}">
        ${thumbHtml}
        <div class="card-body">
          <div class="card-title">${escHtml(title)}</div>
          ${desc ? `<div class="card-desc">${escHtml(desc)}</div>` : ''}
          <div class="card-meta">${badge}${domain}${date}</div>
          ${tagChips ? `<div class="card-tags">${tagChips}</div>` : ''}
        </div>
      </div>`;
  }).join('');

  if (state.selectedCategory === 'Trash') {
    listHtml = `<div class="trash-header">
      <span>${state.items.length}개 항목</span>
      <button class="btn-sm btn-danger" id="btnEmptyTrash">휴지통 비우기</button>
    </div>` + listHtml;
  }

  el.innerHTML = listHtml;

  document.getElementById('btnEmptyTrash')?.addEventListener('click', async () => {
    if (!confirm('휴지통을 모두 비울까요? 복원할 수 없습니다.')) return;
    await onEmptyTrash();
  });

  el.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => onSelectItem(card.dataset.id));
  });

  el.querySelectorAll('.todo-check[data-todo-id]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();  // 체크박스 클릭은 상세 패널을 열지 않는다
      onToggleTodo?.(btn.dataset.todoId);
    });
  });

  el.querySelectorAll('img[data-fallback-icon]').forEach(img => {
    img.addEventListener('error', () => {
      const icon = img.dataset.fallbackIcon || '🌐';
      const div = document.createElement('div');
      div.className = 'card-thumb-placeholder';
      div.textContent = icon;
      img.replaceWith(div);
    }, { once: true });
  });
}

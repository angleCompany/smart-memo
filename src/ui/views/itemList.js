import { escHtml, formatDate } from '../utils.js';
import { getCatLabel, getCatIcon } from '../categories.js';

export function renderItemList(el, state, { onSelectItem, onEmptyTrash }) {
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
        <div class="list-empty-icon">${state.selectedCategory === 'Memo' ? '✏️' : '📌'}</div>
        <h3>아직 항목이 없어요</h3>
        <p>${state.searchQuery ? '검색 결과가 없습니다' : 'URL을 붙여넣거나 새 메모를 작성해보세요'}</p>
      </div>`;
    return;
  }

  let listHtml = state.items.map(item => {
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

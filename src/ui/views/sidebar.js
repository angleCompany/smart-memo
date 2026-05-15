import { CATEGORIES } from '../categories.js';
import { escHtml } from '../utils.js';

export function renderSidebar(el, state, { onSelectCategory }) {
  const { counts, tagCounts } = state;
  const mainCats = CATEGORIES.filter(c => c.id !== 'Trash');
  let html = '';

  for (const cat of mainCats) {
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

  const tags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  if (tags.length > 0) {
    html += `<div class="cat-sep"></div><div class="cat-section-label">태그</div>`;
    for (const [tag, count] of tags) {
      const tagId = `tag:${tag}`;
      const active = state.selectedCategory === tagId ? 'active' : '';
      html += `
        <div class="cat-item ${active}" data-cat="${tagId}">
          <span class="cat-icon tag-hash">#</span>
          <span class="cat-label">${escHtml(tag)}</span>
          <span class="cat-count">${count}</span>
        </div>`;
    }
  }

  const trashCount = counts['Trash'] || 0;
  const trashActive = state.selectedCategory === 'Trash' ? 'active' : '';
  html += `<div class="cat-sep"></div>
    <div class="cat-item ${trashActive}" data-cat="Trash">
      <span class="cat-icon">🗑️</span>
      <span class="cat-label">휴지통</span>
      ${trashCount > 0 ? `<span class="cat-count cat-count-trash">${trashCount}</span>` : ''}
    </div>`;

  el.innerHTML = html;
  el.querySelectorAll('.cat-item').forEach(item => {
    item.addEventListener('click', () => onSelectCategory(item.dataset.cat));
  });
}

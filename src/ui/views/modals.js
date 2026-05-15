import { escHtml } from '../utils.js';

export function openMemoModal(elements, state, existing = null) {
  state.editingMemoId = existing?.id || null;
  state.editingMemoTags = [...(existing?.tags || [])];
  elements.title.textContent = existing ? '메모 편집' : '새 메모';
  elements.textarea.value = existing?.content || '';
  renderMemoTagsUI(elements.tagsDisplay, state);
  elements.modal.style.display = '';
  setTimeout(() => elements.textarea.focus(), 50);
}

export function closeMemoModal(elements, state) {
  elements.modal.style.display = 'none';
  elements.textarea.value = '';
  state.editingMemoId = null;
}

export function renderMemoTagsUI(el, state) {
  el.innerHTML = state.editingMemoTags.map(t =>
    `<span class="tag-chip-edit">#${escHtml(t)}<button class="tag-chip-remove" data-tag="${escHtml(t)}">×</button></span>`
  ).join('');
  el.querySelectorAll('.tag-chip-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      state.editingMemoTags = state.editingMemoTags.filter(t => t !== btn.dataset.tag);
      renderMemoTagsUI(el, state);
    });
  });
}

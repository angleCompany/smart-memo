'use strict';

function filterItems(items, { category, search } = {}) {
  let result = [...items];

  if (category === 'Trash') {
    result = result.filter(i => i.deletedAt);
  } else {
    result = result.filter(i => !i.deletedAt);
    if (category && category !== 'All') {
      if (category === 'Memo') {
        result = result.filter(i => i.type === 'memo');
      } else if (category.startsWith('tag:')) {
        const tag = category.slice(4);
        result = result.filter(i => (i.tags || []).includes(tag));
      } else {
        result = result.filter(i => i.type === 'url' && i.category === category);
      }
    }
  }

  if (search?.trim()) {
    const q = search.toLowerCase().trim();
    result = result.filter(i =>
      (i.title || '').toLowerCase().includes(q) ||
      (i.content || '').toLowerCase().includes(q) ||
      (i.description || '').toLowerCase().includes(q) ||
      (i.domain || '').toLowerCase().includes(q) ||
      (i.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function computeCounts(items) {
  const active = items.filter(i => !i.deletedAt);
  const counts = {
    All: active.length,
    Memo: 0,
    Trash: items.filter(i => i.deletedAt).length,
  };
  const tagCounts = {};
  for (const item of active) {
    if (item.type === 'memo') counts.Memo = (counts.Memo || 0) + 1;
    else if (item.type === 'url') counts[item.category] = (counts[item.category] || 0) + 1;
    for (const t of (item.tags || [])) tagCounts[t] = (tagCounts[t] || 0) + 1;
  }
  return { ...counts, tags: tagCounts };
}

module.exports = { filterItems, computeCounts };

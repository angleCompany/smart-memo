export const CATEGORIES = [
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
  { id: 'Trash',    icon: '🗑️', label: '휴지통' },
];

export function getCatLabel(id) { return CATEGORIES.find(c => c.id === id)?.label || id; }
export function getCatIcon(id)  { return CATEGORIES.find(c => c.id === id)?.icon  || '🌐'; }

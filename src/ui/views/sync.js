let syncNotifTimer;

export function updateSyncChip(elements, state, info) {
  if (!info) return;
  state.syncInfo = info;
  if (info.useICloud) {
    elements.icon.textContent = '☁️';
    elements.label.textContent = 'iCloud';
    elements.dot.classList.add('active');
    elements.chip.title = `iCloud Drive 동기화 중\n${info.dataPath}`;
  } else {
    elements.icon.textContent = '💾';
    elements.label.textContent = '로컬';
    elements.dot.classList.remove('active');
    elements.chip.title = `로컬 저장\n${info.dataPath}`;
  }
}

export function showSyncNotification(notifEl, textEl, msg) {
  textEl.textContent = msg;
  notifEl.style.display = '';
  notifEl.classList.add('show');
  clearTimeout(syncNotifTimer);
  syncNotifTimer = setTimeout(() => {
    notifEl.classList.remove('show');
    setTimeout(() => notifEl.style.display = 'none', 400);
  }, 3500);
}

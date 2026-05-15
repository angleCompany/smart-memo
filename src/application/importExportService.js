'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { sanitizeImportedItem } = require('../domain/itemSanitizer');

function createImportExportService({ storage, dialog, mainWindowGetter }) {
  async function exportData() {
    const defaultName = `smart-memo-${new Date().toISOString().slice(0, 10)}.json`;
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindowGetter(), {
      defaultPath: path.join(os.homedir(), 'Desktop', defaultName),
      filters: [{ name: 'JSON 파일', extensions: ['json'] }],
      buttonLabel: '내보내기',
    });
    if (canceled || !filePath) return { success: false };
    const data = storage.load();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true, count: data.items.length };
  }

  async function importData(mode = 'merge') {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindowGetter(), {
      filters: [{ name: 'JSON 파일', extensions: ['json'] }],
      properties: ['openFile'],
      buttonLabel: '가져오기',
    });
    if (canceled || !filePaths?.[0]) return { success: false };

    let imported;
    try {
      imported = JSON.parse(fs.readFileSync(filePaths[0], 'utf8'));
      if (!Array.isArray(imported.items)) throw new Error('invalid');
    } catch {
      return { success: false, error: '유효하지 않은 파일입니다' };
    }

    const nowIso = new Date().toISOString();
    const sanitized = imported.items.map(i => sanitizeImportedItem(i, nowIso)).filter(Boolean);
    const data = storage.load();

    if (mode === 'merge') {
      const existingIds = new Set(data.items.map(i => i.id));
      const newItems = sanitized.filter(i => !existingIds.has(i.id));
      data.items = [...data.items, ...newItems];
      storage.save(data);
      return { success: true, added: newItems.length, total: imported.items.length };
    } else {
      storage.save({ items: sanitized });
      return { success: true, added: sanitized.length, total: imported.items.length };
    }
  }

  return { exportData, importData };
}

module.exports = { createImportExportService };

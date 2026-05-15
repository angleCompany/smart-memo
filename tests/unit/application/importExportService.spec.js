import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createImportExportService } from '../../../src/application/importExportService.js';
import { createInMemoryStorage } from '../../fakes/inMemoryStorage.js';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smartmemo-ie-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

const validItem = {
  id: 'item1', type: 'url', content: 'https://github.com',
  title: 'GitHub', description: '', image: '', domain: 'github.com',
  category: 'Code', tags: ['code'],
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

function makeService(initialItems = []) {
  const storage = createInMemoryStorage(initialItems);
  const dialog = { showSaveDialog: vi.fn(), showOpenDialog: vi.fn() };
  const mainWindowGetter = vi.fn().mockReturnValue(null);
  const service = createImportExportService({ storage, dialog, mainWindowGetter });
  return { service, storage, dialog };
}

/* ===== exportData ===== */
describe('importExportService.exportData', () => {
  it('다이얼로그 취소 → { success: false }', async () => {
    const { service, dialog } = makeService([validItem]);
    dialog.showSaveDialog.mockResolvedValue({ canceled: true });
    const result = await service.exportData();
    expect(result.success).toBe(false);
  });

  it('파일 경로 없음 → { success: false }', async () => {
    const { service, dialog } = makeService([validItem]);
    dialog.showSaveDialog.mockResolvedValue({ canceled: false, filePath: null });
    const result = await service.exportData();
    expect(result.success).toBe(false);
  });

  it('내보내기 성공 → JSON 파일 생성 + count 반환', async () => {
    const exportFile = path.join(tmpDir, 'export.json');
    const { service, dialog } = makeService([validItem]);
    dialog.showSaveDialog.mockResolvedValue({ canceled: false, filePath: exportFile });
    const result = await service.exportData();
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(fs.existsSync(exportFile)).toBe(true);
  });

  it('내보낸 파일이 유효한 JSON', async () => {
    const exportFile = path.join(tmpDir, 'export.json');
    const { service, dialog } = makeService([validItem]);
    dialog.showSaveDialog.mockResolvedValue({ canceled: false, filePath: exportFile });
    await service.exportData();
    const raw = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
    expect(Array.isArray(raw.items)).toBe(true);
    expect(raw.items[0].id).toBe('item1');
  });

  it('빈 스토리지 내보내기 → count: 0', async () => {
    const exportFile = path.join(tmpDir, 'empty.json');
    const { service, dialog } = makeService([]);
    dialog.showSaveDialog.mockResolvedValue({ canceled: false, filePath: exportFile });
    const result = await service.exportData();
    expect(result.count).toBe(0);
  });
});

/* ===== importData ===== */
describe('importExportService.importData', () => {
  it('다이얼로그 취소 → { success: false }', async () => {
    const { service, dialog } = makeService();
    dialog.showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] });
    const result = await service.importData();
    expect(result.success).toBe(false);
  });

  it('유효하지 않은 JSON 파일 → { success: false, error }', async () => {
    const badFile = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(badFile, 'not json!!!', 'utf8');
    const { service, dialog } = makeService();
    dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [badFile] });
    const result = await service.importData();
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('items 배열 없는 JSON → { success: false, error }', async () => {
    const badFile = path.join(tmpDir, 'noitems.json');
    fs.writeFileSync(badFile, JSON.stringify({ data: [] }), 'utf8');
    const { service, dialog } = makeService();
    dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [badFile] });
    const result = await service.importData();
    expect(result.success).toBe(false);
  });

  it('merge 모드: 새 아이템 추가', async () => {
    const importFile = path.join(tmpDir, 'import.json');
    const newItem = { ...validItem, id: 'new1', content: 'https://stackoverflow.com', domain: 'stackoverflow.com' };
    fs.writeFileSync(importFile, JSON.stringify({ items: [newItem] }), 'utf8');
    const { service, dialog, storage } = makeService([validItem]);
    dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [importFile] });
    const result = await service.importData('merge');
    expect(result.success).toBe(true);
    expect(result.added).toBe(1);
    expect(storage.peek()).toHaveLength(2);
  });

  it('merge 모드: 중복 id → 스킵', async () => {
    const importFile = path.join(tmpDir, 'dup.json');
    fs.writeFileSync(importFile, JSON.stringify({ items: [validItem] }), 'utf8');
    const { service, dialog, storage } = makeService([validItem]);
    dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [importFile] });
    const result = await service.importData('merge');
    expect(result.added).toBe(0);
    expect(storage.peek()).toHaveLength(1);
  });

  it('replace 모드: 기존 데이터 교체', async () => {
    const importFile = path.join(tmpDir, 'replace.json');
    const newItem = { ...validItem, id: 'replaced1' };
    fs.writeFileSync(importFile, JSON.stringify({ items: [newItem] }), 'utf8');
    const { service, dialog, storage } = makeService([validItem]);
    dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [importFile] });
    const result = await service.importData('replace');
    expect(result.success).toBe(true);
    expect(storage.peek()).toHaveLength(1);
    expect(storage.peek()[0].id).toBe('replaced1');
  });

  it('잘못된 type 아이템 → sanitize 후 걸러짐', async () => {
    const importFile = path.join(tmpDir, 'bad-type.json');
    const badItem = { ...validItem, id: 'bad1', type: 'unknown' };
    fs.writeFileSync(importFile, JSON.stringify({ items: [badItem] }), 'utf8');
    const { service, dialog, storage } = makeService();
    dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [importFile] });
    const result = await service.importData('merge');
    expect(result.added).toBe(0);
    expect(storage.peek()).toHaveLength(0);
  });

  it('XSS 콘텐츠 포함 아이템 → sanitize 후 저장 (content 보존)', async () => {
    const importFile = path.join(tmpDir, 'xss.json');
    const xssItem = { ...validItem, id: 'xss1', title: '<script>alert(1)</script>' };
    fs.writeFileSync(importFile, JSON.stringify({ items: [xssItem] }), 'utf8');
    const { service, dialog, storage } = makeService();
    dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [importFile] });
    await service.importData('merge');
    // sanitizeImportedItem은 title을 500자로 자르지만 내용은 유지
    expect(storage.peek()[0].title).toContain('alert');
  });

  it('javascript: URL 아이템 → 걸러짐', async () => {
    const importFile = path.join(tmpDir, 'js.json');
    const jsItem = { ...validItem, id: 'js1', content: 'javascript:alert(1)' };
    fs.writeFileSync(importFile, JSON.stringify({ items: [jsItem] }), 'utf8');
    const { service, dialog, storage } = makeService();
    dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [importFile] });
    await service.importData('merge');
    expect(storage.peek()).toHaveLength(0);
  });

  it('total: 파일 내 전체 아이템 수 반환', async () => {
    const importFile = path.join(tmpDir, 'total.json');
    const items = [
      validItem,
      { ...validItem, id: 'item2', type: 'unknown' }, // 거름
    ];
    fs.writeFileSync(importFile, JSON.stringify({ items }), 'utf8');
    const { service, dialog } = makeService();
    dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [importFile] });
    const result = await service.importData('merge');
    expect(result.total).toBe(2);
    expect(result.added).toBe(1);
  });
});

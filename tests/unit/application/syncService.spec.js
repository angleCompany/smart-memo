import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createSyncService } from '../../../src/application/syncService.js';
import { createInMemoryStorage } from '../../fakes/inMemoryStorage.js';

let tmpDir;
let localPath;
let icloudPath;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smartmemo-sync-'));
  localPath = path.join(tmpDir, 'local', 'data.json');
  icloudPath = path.join(tmpDir, 'icloud', 'SmartMemo', 'data.json');
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  fs.mkdirSync(path.dirname(icloudPath), { recursive: true });
  vi.restoreAllMocks();
});

function makeService({ useICloud = false, icloudBase = null, hasLocal = false, hasICloud = false } = {}) {
  if (hasLocal) fs.writeFileSync(localPath, JSON.stringify({ items: [{ id: 'local1' }] }), 'utf8');
  if (hasICloud) fs.writeFileSync(icloudPath, JSON.stringify({ items: [] }), 'utf8');

  const configStore = {
    load: vi.fn().mockReturnValue({ useICloud }),
    save: vi.fn(),
  };

  let currentPath = useICloud && icloudBase ? icloudPath : localPath;
  const storage = {
    getPath: vi.fn(() => currentPath),
    load: vi.fn().mockReturnValue({ items: [] }),
    save: vi.fn(),
  };

  const resolveDataPath = vi.fn((userDataDir, useIC) => useIC && icloudBase ? icloudPath : localPath);
  const startWatcher = vi.fn();
  const getICloudBase = vi.fn().mockReturnValue(icloudBase);

  const service = createSyncService({
    configStore,
    storage,
    resolveDataPath,
    userDataDir: tmpDir,
    startWatcher,
    getICloudBase,
  });

  return { service, configStore, storage, resolveDataPath, startWatcher, getICloudBase, currentPath };
}

describe('syncService.getInfo', () => {
  it('useICloud=false 상태 반환', () => {
    const { service } = makeService({ useICloud: false });
    const info = service.getInfo();
    expect(info.useICloud).toBe(false);
    expect(info.icloudAvailable).toBe(false);
  });

  it('iCloud 사용 가능 시 icloudAvailable=true', () => {
    const { service } = makeService({ icloudBase: '/icloud/base' });
    expect(service.getInfo().icloudAvailable).toBe(true);
  });

  it('icloudDir: icloudBase 있으면 SmartMemo 경로 포함', () => {
    const { service } = makeService({ icloudBase: '/icloud/base' });
    expect(service.getInfo().icloudDir).toContain('SmartMemo');
  });

  it('icloudDir: icloudBase 없으면 null', () => {
    const { service } = makeService({ icloudBase: null });
    expect(service.getInfo().icloudDir).toBeNull();
  });

  it('dataPath는 storage.getPath() 값', () => {
    const { service, storage } = makeService();
    storage.getPath.mockReturnValue('/test/data.json');
    expect(service.getInfo().dataPath).toBe('/test/data.json');
  });
});

describe('syncService.setUseICloud', () => {
  it('config 업데이트 후 저장', () => {
    const { service, configStore } = makeService({ useICloud: false, icloudBase: '/icloud' });
    service.setUseICloud(true);
    expect(configStore.save).toHaveBeenCalledWith(expect.objectContaining({ useICloud: true }));
  });

  it('반환값: { success: true, dataPath }', () => {
    const { service } = makeService({ icloudBase: '/icloud' });
    const result = service.setUseICloud(true);
    expect(result.success).toBe(true);
    expect(result.dataPath).toBeTruthy();
  });

  it('startWatcher 호출됨', () => {
    const { service, startWatcher } = makeService({ icloudBase: '/icloud' });
    service.setUseICloud(true);
    expect(startWatcher).toHaveBeenCalled();
  });

  it('같은 경로면 파일 복사 없음', () => {
    const { service, storage } = makeService({ useICloud: false });
    // resolveDataPath가 동일한 경로를 반환하도록 설정되어 있을 때
    const copySpy = vi.spyOn(fs, 'copyFileSync');
    service.setUseICloud(false);
    expect(copySpy).not.toHaveBeenCalled();
  });

  it('로컬 → iCloud 전환 시 파일 복사', () => {
    fs.writeFileSync(localPath, JSON.stringify({ items: [] }), 'utf8');
    const { service } = makeService({ useICloud: false, icloudBase: tmpDir, hasLocal: true });

    const copySpy = vi.spyOn(fs, 'copyFileSync').mockImplementation(() => {});
    service.setUseICloud(true);
    expect(copySpy).toHaveBeenCalled();
    copySpy.mockRestore();
  });
});

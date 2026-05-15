import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createFileWatcher } from '../../../src/infrastructure/fileWatcher.js';

let tmpDir;
let filePath;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smartmemo-watcher-'));
  filePath = path.join(tmpDir, 'data.json');
  fs.writeFileSync(filePath, '{}', 'utf8');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('fileWatcher', () => {
  it('파일 변경 → onChange 호출됨', async () => {
    let callCount = 0;
    const watcher = createFileWatcher(() => filePath, () => { callCount++; }, 50);
    watcher.start();

    await new Promise(r => setTimeout(r, 100));
    fs.writeFileSync(filePath, '{"changed":true}', 'utf8');

    await vi.waitFor(() => expect(callCount).toBeGreaterThan(0), { timeout: 3000 });
    watcher.stop();
  });

  it('debounce: 연속 변경은 하나의 onChange로 합산', async () => {
    let callCount = 0;
    const watcher = createFileWatcher(() => filePath, () => { callCount++; }, 200);
    watcher.start();

    await new Promise(r => setTimeout(r, 50));
    // 빠르게 여러 번 쓰기
    for (let i = 0; i < 5; i++) {
      fs.writeFileSync(filePath, `{"n":${i}}`, 'utf8');
      await new Promise(r => setTimeout(r, 20));
    }

    await vi.waitFor(() => expect(callCount).toBeGreaterThan(0), { timeout: 3000 });
    // debounce 200ms이므로 연속 쓰기는 1~2회로 합산
    await new Promise(r => setTimeout(r, 300));
    expect(callCount).toBeLessThanOrEqual(3);
    watcher.stop();
  });

  it('존재하지 않는 파일에 start → 에러 없음', () => {
    const watcher = createFileWatcher(() => '/nonexistent/path/file.json', () => {}, 50);
    expect(() => watcher.start()).not.toThrow();
    expect(() => watcher.stop()).not.toThrow();
  });

  it('stop 이후 파일 변경 → onChange 미호출', async () => {
    let callCount = 0;
    const watcher = createFileWatcher(() => filePath, () => { callCount++; }, 50);
    watcher.start();
    await new Promise(r => setTimeout(r, 50));
    watcher.stop();

    fs.writeFileSync(filePath, '{"after-stop":true}', 'utf8');
    await new Promise(r => setTimeout(r, 300));
    expect(callCount).toBe(0);
  });

  it('start → stop → start 재시작 정상 동작', async () => {
    let callCount = 0;
    const watcher = createFileWatcher(() => filePath, () => { callCount++; }, 50);
    watcher.start();
    watcher.stop();
    watcher.start();

    await new Promise(r => setTimeout(r, 100));
    fs.writeFileSync(filePath, '{"restarted":true}', 'utf8');

    await vi.waitFor(() => expect(callCount).toBeGreaterThan(0), { timeout: 3000 });
    watcher.stop();
  });

  it('중복 start 호출 → 에러 없음', () => {
    const watcher = createFileWatcher(() => filePath, () => {}, 50);
    watcher.start();
    expect(() => watcher.start()).not.toThrow();
    watcher.stop();
  });

  it('stop을 여러 번 호출해도 에러 없음', () => {
    const watcher = createFileWatcher(() => filePath, () => {}, 50);
    watcher.start();
    watcher.stop();
    expect(() => watcher.stop()).not.toThrow();
  });

  it('null 경로 → start 에러 없음', () => {
    const watcher = createFileWatcher(() => null, () => {}, 50);
    expect(() => watcher.start()).not.toThrow();
    watcher.stop();
  });
});

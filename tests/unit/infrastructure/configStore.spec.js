import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createConfigStore } from '../../../src/infrastructure/configStore.js';

let tmpDir;
let configPath;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smartmemo-config-'));
  configPath = path.join(tmpDir, 'config.json');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('configStore.load', () => {
  it('파일 없으면 기본값 { useICloud: false } 반환', () => {
    const cs = createConfigStore(() => configPath);
    expect(cs.load().useICloud).toBe(false);
  });

  it('저장된 useICloud: true 로드', () => {
    fs.writeFileSync(configPath, JSON.stringify({ useICloud: true }), 'utf8');
    const cs = createConfigStore(() => configPath);
    expect(cs.load().useICloud).toBe(true);
  });

  it('손상된 JSON → 기본값 반환', () => {
    fs.writeFileSync(configPath, 'invalid!!!', 'utf8');
    const cs = createConfigStore(() => configPath);
    expect(cs.load().useICloud).toBe(false);
  });

  it('기본값과 병합: 파일의 추가 필드 보존', () => {
    fs.writeFileSync(configPath, JSON.stringify({ useICloud: true, customKey: 'val' }), 'utf8');
    const cs = createConfigStore(() => configPath);
    const cfg = cs.load();
    expect(cfg.useICloud).toBe(true);
    expect(cfg.customKey).toBe('val');
  });

  it('파일에 useICloud 없으면 기본값 false로 채움', () => {
    fs.writeFileSync(configPath, JSON.stringify({ other: 1 }), 'utf8');
    const cs = createConfigStore(() => configPath);
    expect(cs.load().useICloud).toBe(false);
  });
});

describe('configStore.save', () => {
  it('저장 후 load로 읽힘', () => {
    const cs = createConfigStore(() => configPath);
    cs.save({ useICloud: true });
    expect(cs.load().useICloud).toBe(true);
  });

  it('유효한 JSON 형식으로 저장', () => {
    const cs = createConfigStore(() => configPath);
    cs.save({ useICloud: false });
    const raw = fs.readFileSync(configPath, 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('연속 저장 → 마지막 값 유지', () => {
    const cs = createConfigStore(() => configPath);
    cs.save({ useICloud: true });
    cs.save({ useICloud: false });
    expect(cs.load().useICloud).toBe(false);
  });
});

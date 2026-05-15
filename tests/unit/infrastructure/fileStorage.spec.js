import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createFileStorage } from '../../../src/infrastructure/fileStorage.js';

let tmpDir;
let storagePath;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smartmemo-storage-'));
  storagePath = path.join(tmpDir, 'data.json');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('fileStorage.load', () => {
  it('파일 없으면 { items: [] } 반환', () => {
    const s = createFileStorage(() => storagePath);
    expect(s.load()).toEqual({ items: [] });
  });

  it('유효한 JSON 파일 로드', () => {
    const data = { items: [{ id: '1', content: 'https://example.com' }] };
    fs.writeFileSync(storagePath, JSON.stringify(data), 'utf8');
    const s = createFileStorage(() => storagePath);
    expect(s.load().items[0].id).toBe('1');
  });

  it('손상된 JSON → { items: [] }', () => {
    fs.writeFileSync(storagePath, '{ bad json !!!', 'utf8');
    const s = createFileStorage(() => storagePath);
    expect(s.load()).toEqual({ items: [] });
  });

  it('items가 배열 아닌 경우 → [] 정규화', () => {
    fs.writeFileSync(storagePath, JSON.stringify({ items: 'not-array' }), 'utf8');
    const s = createFileStorage(() => storagePath);
    expect(s.load().items).toEqual([]);
  });

  it('items 키가 없는 경우 → [] 정규화', () => {
    fs.writeFileSync(storagePath, JSON.stringify({ other: true }), 'utf8');
    const s = createFileStorage(() => storagePath);
    expect(s.load().items).toEqual([]);
  });

  it('빈 파일 → { items: [] }', () => {
    fs.writeFileSync(storagePath, '', 'utf8');
    const s = createFileStorage(() => storagePath);
    expect(s.load()).toEqual({ items: [] });
  });
});

describe('fileStorage.save', () => {
  it('저장 후 load로 동일 데이터 반환', () => {
    const s = createFileStorage(() => storagePath);
    const data = { items: [{ id: 'x', content: 'test' }] };
    s.save(data);
    expect(s.load().items[0].id).toBe('x');
  });

  it('원자적 쓰기: tmp 파일이 남지 않음', () => {
    const s = createFileStorage(() => storagePath);
    s.save({ items: [] });
    expect(fs.existsSync(storagePath + '.tmp')).toBe(false);
    expect(fs.existsSync(storagePath)).toBe(true);
  });

  it('중첩 디렉토리 자동 생성', () => {
    const nested = path.join(tmpDir, 'a', 'b', 'c', 'data.json');
    const s = createFileStorage(() => nested);
    s.save({ items: [] });
    expect(fs.existsSync(nested)).toBe(true);
  });

  it('연속 save → 마지막 값이 최종', () => {
    const s = createFileStorage(() => storagePath);
    s.save({ items: [{ id: 'first' }] });
    s.save({ items: [{ id: 'second' }] });
    expect(s.load().items[0].id).toBe('second');
  });

  it('저장 파일이 유효한 JSON 형식', () => {
    const s = createFileStorage(() => storagePath);
    s.save({ items: [{ id: '1' }] });
    expect(() => JSON.parse(fs.readFileSync(storagePath, 'utf8'))).not.toThrow();
  });
});

describe('fileStorage.exists', () => {
  it('파일 없으면 false', () => {
    const s = createFileStorage(() => storagePath);
    expect(s.exists()).toBe(false);
  });

  it('파일 있으면 true', () => {
    fs.writeFileSync(storagePath, '{}', 'utf8');
    const s = createFileStorage(() => storagePath);
    expect(s.exists()).toBe(true);
  });

  it('save 후 exists → true', () => {
    const s = createFileStorage(() => storagePath);
    s.save({ items: [] });
    expect(s.exists()).toBe(true);
  });
});

describe('fileStorage.getPath', () => {
  it('생성 시 전달한 경로 반환', () => {
    const s = createFileStorage(() => storagePath);
    expect(s.getPath()).toBe(storagePath);
  });

  it('getter 함수가 매번 호출됨 (동적 경로)', () => {
    let current = '/path/a.json';
    const s = createFileStorage(() => current);
    expect(s.getPath()).toBe('/path/a.json');
    current = '/path/b.json';
    expect(s.getPath()).toBe('/path/b.json');
  });
});

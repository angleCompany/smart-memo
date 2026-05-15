import { describe, it, expect } from 'vitest';
import { generateId } from '../../../src/domain/idGenerator.js';

describe('generateId', () => {
  it('포맷: timestamp-6자리랜덤', () => {
    expect(generateId()).toMatch(/^\d+-[a-z0-9]{6}$/);
  });

  it('FixedClock: nowMs 주입 시 타임스탬프 일치', () => {
    const id = generateId(1700000000000);
    expect(id.startsWith('1700000000000-')).toBe(true);
  });

  it('다른 nowMs → 다른 prefix', () => {
    const a = generateId(1000);
    const b = generateId(2000);
    expect(a.split('-')[0]).toBe('1000');
    expect(b.split('-')[0]).toBe('2000');
  });

  it('연속 1000회 호출 → 중복 없음', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId()));
    expect(ids.size).toBe(1000);
  });

  it('반환값은 문자열', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('같은 nowMs에서도 random 부분이 달라 중복 방지', () => {
    const fixedMs = 9999999;
    const ids = new Set(Array.from({ length: 100 }, () => generateId(fixedMs)));
    expect(ids.size).toBeGreaterThan(90);
  });
});

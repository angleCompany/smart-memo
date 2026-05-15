import { describe, it, expect } from 'vitest';
import { isExpired, purgeExpired, CUTOFF_DAYS } from '../../../src/domain/trashPolicy.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function itemAt(daysAgo) {
  const deletedAt = new Date(Date.now() - daysAgo * DAY_MS).toISOString();
  return { id: `item-${daysAgo}`, deletedAt };
}

describe('isExpired', () => {
  it(`${CUTOFF_DAYS}일 미만 → 만료 아님`, () => {
    expect(isExpired(itemAt(CUTOFF_DAYS - 1))).toBe(false);
  });
  it(`${CUTOFF_DAYS}일 경계값 → 만료 아님 (strict >)`, () => {
    // exactly 30 days (not yet expired since > not >=)
    const deletedAt = new Date(Date.now() - CUTOFF_DAYS * DAY_MS).toISOString();
    expect(isExpired({ deletedAt })).toBe(false);
  });
  it(`${CUTOFF_DAYS + 1}일 → 만료됨`, () => {
    expect(isExpired(itemAt(CUTOFF_DAYS + 1))).toBe(true);
  });
  it('deletedAt 없으면 만료 아님', () => {
    expect(isExpired({ id: 'active' })).toBe(false);
  });
  it('FixedClock으로 시간 고정 테스트', () => {
    const fixedNow = new Date('2026-05-14T00:00:00Z').getTime();
    const deletedAt = new Date('2026-04-01T00:00:00Z').toISOString(); // 43일 전
    expect(isExpired({ deletedAt }, fixedNow)).toBe(true);

    const recent = new Date('2026-05-01T00:00:00Z').toISOString(); // 13일 전
    expect(isExpired({ deletedAt: recent }, fixedNow)).toBe(false);
  });
});

describe('purgeExpired', () => {
  it('만료된 항목만 제거', () => {
    const items = [
      { id: 'a', deletedAt: new Date(Date.now() - 31 * DAY_MS).toISOString() },
      { id: 'b', deletedAt: new Date(Date.now() - 29 * DAY_MS).toISOString() },
      { id: 'c' },
    ];
    const result = purgeExpired(items);
    expect(result.map(i => i.id)).toEqual(['b', 'c']);
  });
  it('만료 항목 없으면 그대로', () => {
    const items = [{ id: 'a' }, { id: 'b' }];
    expect(purgeExpired(items)).toHaveLength(2);
  });
});

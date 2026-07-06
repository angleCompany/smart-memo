import { describe, it, expect } from 'vitest';
import { parseVersion, compareVersions, isNewerVersion, selectDmgAsset } from '../../../src/domain/version.js';

describe('parseVersion', () => {
  it('v 접두사 제거 후 숫자 배열', () => expect(parseVersion('v1.2.3')).toEqual([1, 2, 3]));
  it('접두사 없어도 동작', () => expect(parseVersion('1.2.3')).toEqual([1, 2, 3]));
  it('누락 파트는 0으로 채움', () => expect(parseVersion('2')).toEqual([2, 0, 0]));
  it('빈/널 입력 → 0,0,0', () => {
    expect(parseVersion('')).toEqual([0, 0, 0]);
    expect(parseVersion(null)).toEqual([0, 0, 0]);
    expect(parseVersion(undefined)).toEqual([0, 0, 0]);
  });
});

describe('compareVersions', () => {
  it('작으면 -1', () => expect(compareVersions('1.2.0', '1.3.0')).toBe(-1));
  it('크면 1', () => expect(compareVersions('1.3.0', '1.2.9')).toBe(1));
  it('같으면 0', () => expect(compareVersions('1.2.0', '1.2.0')).toBe(0));
  it('메이저가 우선', () => expect(compareVersions('2.0.0', '1.9.9')).toBe(1));
  it("혼합 접두사 'v1.2.0' vs '1.2.0' → 0", () => expect(compareVersions('v1.2.0', '1.2.0')).toBe(0));
});

describe('isNewerVersion', () => {
  it('최신이 높으면 true', () => expect(isNewerVersion('1.3.0', '1.2.0')).toBe(true));
  it('같으면 false', () => expect(isNewerVersion('1.2.0', '1.2.0')).toBe(false));
  it('낮으면 false', () => expect(isNewerVersion('1.1.0', '1.2.0')).toBe(false));
  // 클래식 문자열비교 버그 방지: 태그는 'v' 접두사, getVersion()은 무접두사
  it("태그 'v1.3.0' vs 버전 '1.2.0' → true", () => expect(isNewerVersion('v1.3.0', '1.2.0')).toBe(true));
  it("'v1.2.0' vs '1.2.0' 동일 → false", () => expect(isNewerVersion('v1.2.0', '1.2.0')).toBe(false));
  it('두 자리 패치 비교 (문자열이면 틀림): 1.2.10 > 1.2.9', () => expect(isNewerVersion('1.2.10', '1.2.9')).toBe(true));
});

describe('selectDmgAsset', () => {
  const assets = [
    { name: 'Smart-Memo-1.3.0-arm64.dmg', browser_download_url: 'u-arm' },
    { name: 'Smart-Memo-1.3.0-x64.dmg', browser_download_url: 'u-x64' },
    { name: 'latest-mac.yml', browser_download_url: 'u-yml' },
  ];
  it('arm64 선택', () => expect(selectDmgAsset(assets, 'arm64').browser_download_url).toBe('u-arm'));
  it('x64 선택', () => expect(selectDmgAsset(assets, 'x64').browser_download_url).toBe('u-x64'));
  it('매칭 아키텍처 없으면 null', () => expect(selectDmgAsset(assets, 'ia32')).toBeNull());
  it('빈 배열 → null', () => expect(selectDmgAsset([], 'arm64')).toBeNull());
  it('비배열 → null', () => expect(selectDmgAsset(null, 'arm64')).toBeNull());
  it('.dmg 아닌 자산은 제외', () => expect(selectDmgAsset([{ name: 'notes-x64.txt', browser_download_url: 't' }], 'x64')).toBeNull());
});

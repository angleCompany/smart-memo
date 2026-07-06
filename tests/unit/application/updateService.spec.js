import { describe, it, expect } from 'vitest';
import { createUpdateService } from '../../../src/application/updateService.js';

const release = (overrides = {}) => ({
  tag_name: 'v1.3.0',
  html_url: 'https://github.com/o/r/releases/tag/v1.3.0',
  assets: [
    { name: 'Smart-Memo-1.3.0-arm64.dmg', browser_download_url: 'https://x/arm64.dmg' },
    { name: 'Smart-Memo-1.3.0-x64.dmg', browser_download_url: 'https://x/x64.dmg' },
  ],
  ...overrides,
});
const svcWith = (rel) => createUpdateService({ fetchLatestRelease: async () => rel });

describe('updateService.check', () => {
  it('최신이 더 높으면 updateAvailable + 해당 아키텍처 DMG', async () => {
    const r = await svcWith(release()).check({ currentVersion: '1.2.0', arch: 'arm64' });
    expect(r.updateAvailable).toBe(true);
    expect(r.latestVersion).toBe('v1.3.0');
    expect(r.downloadUrl).toBe('https://x/arm64.dmg');
    expect(r.assetName).toBe('Smart-Memo-1.3.0-arm64.dmg');
  });

  it('x64 아키텍처는 x64 DMG를 고름', async () => {
    const r = await svcWith(release()).check({ currentVersion: '1.2.0', arch: 'x64' });
    expect(r.downloadUrl).toBe('https://x/x64.dmg');
  });

  it('같은 버전이면 updateAvailable=false', async () => {
    const r = await svcWith(release()).check({ currentVersion: '1.3.0', arch: 'arm64' });
    expect(r.updateAvailable).toBe(false);
    expect(r.latestVersion).toBe('v1.3.0');
  });

  it("혼합 접두사: tag 'v1.3.0' vs current 'v1.3.0' 동일 → false", async () => {
    const r = await svcWith(release()).check({ currentVersion: 'v1.3.0', arch: 'arm64' });
    expect(r.updateAvailable).toBe(false);
  });

  it('현재가 더 높으면 false', async () => {
    const r = await svcWith(release({ tag_name: 'v1.1.0' })).check({ currentVersion: '1.3.0', arch: 'arm64' });
    expect(r.updateAvailable).toBe(false);
  });

  it('아키텍처 매칭 DMG 없으면 releaseUrl로 폴백', async () => {
    const r = await svcWith(release({ assets: [] })).check({ currentVersion: '1.2.0', arch: 'arm64' });
    expect(r.updateAvailable).toBe(true);
    expect(r.downloadUrl).toBe('https://github.com/o/r/releases/tag/v1.3.0');
    expect(r.assetName).toBeNull();
  });

  it('tag_name 없으면 false', async () => {
    const r = await svcWith({ html_url: 'x', assets: [] }).check({ currentVersion: '1.2.0', arch: 'arm64' });
    expect(r.updateAvailable).toBe(false);
  });

  it('fetch 실패는 그대로 throw (호출자가 처리)', async () => {
    const svc = createUpdateService({ fetchLatestRelease: async () => { throw new Error('network'); } });
    await expect(svc.check({ currentVersion: '1.2.0', arch: 'arm64' })).rejects.toThrow('network');
  });
});

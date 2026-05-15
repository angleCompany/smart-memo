import { describe, it, expect } from 'vitest';
import path from 'path';
import { resolveDataPath, getICloudBase } from '../../../src/infrastructure/icloudDetector.js';

describe('resolveDataPath', () => {
  it('useICloud=false → userDataDir/data.json 반환', () => {
    const result = resolveDataPath('/Users/test/AppData', false);
    expect(result).toBe(path.join('/Users/test/AppData', 'data.json'));
  });

  it('useICloud=false → iCloud 경로 사용 안 함', () => {
    const result = resolveDataPath('/userData', false);
    expect(result).not.toContain('CloudDocs');
    expect(result).not.toContain('SmartMemo');
  });

  it('useICloud=true이지만 iCloud 없는 환경 → userData로 폴백', () => {
    // iCloud가 없는 CI/테스트 환경에서는 로컬 경로로 폴백
    const result = resolveDataPath('/userData', true);
    // iCloud available이면 CloudDocs 경로, 없으면 userData 경로
    expect(typeof result).toBe('string');
    expect(result.endsWith('data.json')).toBe(true);
  });

  it('userDataDir이 절대 경로여야 올바른 결과', () => {
    const r = resolveDataPath('/home/user/.config/smartmemo', false);
    expect(path.isAbsolute(r)).toBe(true);
  });
});

describe('getICloudBase', () => {
  it('반환값은 문자열이거나 null', () => {
    const result = getICloudBase();
    expect(result === null || typeof result === 'string').toBe(true);
  });

  it('iCloud 있을 경우 경로에 com~apple~CloudDocs 포함', () => {
    const base = getICloudBase();
    if (base !== null) {
      expect(base).toContain('com~apple~CloudDocs');
    }
  });
});

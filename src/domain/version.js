'use strict';

// 순수 버전 비교 유틸. fs·네트워크 의존 없음(도메인).
// GitHub 태그("v1.2.3")와 app.getVersion()("1.2.3")의 접두사 차이를 양쪽에서 정규화한다.

// "v1.2.3" / "1.2.3" → [1, 2, 3]. 비정상 입력은 0으로 채운다.
function parseVersion(v) {
  const s = String(v == null ? '' : v).trim().replace(/^v/i, '');
  const parts = s.split('.').map(n => parseInt(n, 10));
  return [0, 1, 2].map(i => (Number.isFinite(parts[i]) ? parts[i] : 0));
}

// a < b → -1, a === b → 0, a > b → 1 (major.minor.patch 순)
function compareVersions(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] < pb[i]) return -1;
    if (pa[i] > pb[i]) return 1;
  }
  return 0;
}

// latest가 current보다 높으면 true (둘 다 'v' 접두사 허용)
function isNewerVersion(latest, current) {
  return compareVersions(latest, current) > 0;
}

// GitHub 릴리즈 자산 중 현재 아키텍처(arm64/x64)에 맞는 .dmg를 고른다. 없으면 null.
function selectDmgAsset(assets, arch) {
  if (!Array.isArray(assets)) return null;
  const key = String(arch || '').toLowerCase();
  const dmgs = assets.filter(a => a && typeof a.name === 'string' && a.name.toLowerCase().endsWith('.dmg'));
  return dmgs.find(a => a.name.toLowerCase().includes(key)) || null;
}

module.exports = { parseVersion, compareVersions, isNewerVersion, selectDmgAsset };

'use strict';

const { isNewerVersion, selectDmgAsset } = require('../domain/version');

// 최신 릴리즈를 확인해 업데이트 가능 여부와 다운로드 대상을 판정한다.
// fetchLatestRelease는 인프라에서 주입(테스트는 fake 주입). 네트워크/파싱 오류는
// 호출자(main IPC)가 잡아 "확인 실패"로 처리하도록 그대로 throw한다.
function createUpdateService({ fetchLatestRelease }) {
  async function check({ currentVersion, arch }) {
    const release = await fetchLatestRelease();
    if (!release || !release.tag_name) {
      return { updateAvailable: false, currentVersion };
    }
    const latestVersion = release.tag_name;
    if (!isNewerVersion(latestVersion, currentVersion)) {
      return { updateAvailable: false, currentVersion, latestVersion };
    }
    const asset = selectDmgAsset(release.assets, arch);
    return {
      updateAvailable: true,
      currentVersion,
      latestVersion,
      releaseUrl: release.html_url || null,
      // 아키텍처 매칭 DMG가 없으면 릴리즈 페이지로 폴백.
      downloadUrl: (asset && asset.browser_download_url) || release.html_url || null,
      assetName: asset ? asset.name : null,
    };
  }

  return { check };
}

module.exports = { createUpdateService };

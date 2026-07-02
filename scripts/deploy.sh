#!/bin/bash
# 에러 발생 시 스크립트 중단
set -e

# 사용법 안내
if [ -z "$1" ]; then
  echo "사용법: ./scripts/deploy.sh [patch | minor | major | X.Y.Z]"
  echo "예시:"
  echo "  ./scripts/deploy.sh patch   (1.0.0 -> 1.0.1)"
  echo "  ./scripts/deploy.sh minor   (1.0.0 -> 1.1.0)"
  echo "  ./scripts/deploy.sh 1.1.0   (버전을 1.1.0으로 직접 지정)"
  exit 1
fi

VERSION_ARG=$1

# 1. Git 작업 트리가 깨끗한지 확인
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ 오류: 커밋되지 않은 변경 사항이 있습니다. 먼저 커밋하거나 변경 사항을 정리한 후 다시 시도해 주세요."
  exit 1
fi

# 2. npm version 명령어를 통해 package.json 버전을 올리고 자동으로 Git Commit & Tag 생성
echo "🔄 버전을 업데이트하고 Git 태그를 생성하는 중..."
NEW_VERSION=$(npm version "$VERSION_ARG" --no-git-tag-version)
# 'v'가 앞에 자동으로 붙으므로 떼거나 유지하여 태그로 만듭니다.
# npm version은 --no-git-tag-version을 쓰면 package.json만 바꾸므로 수동으로 커밋/태그를 하겠습니다.
git add package.json package-lock.json
git commit -m "chore: release $NEW_VERSION"
git tag "$NEW_VERSION"

echo "✅ 버전이 $NEW_VERSION 으로 변경되었습니다."

# 3. 원격(GitHub) 저장소로 커밋과 태그 푸시
echo "🚀 GitHub로 코드와 태그를 푸시하는 중..."
git push origin main
git push origin "$NEW_VERSION"

echo "🎉 성공적으로 푸시되었습니다!"
echo "이제 GitHub Actions가 동작하여 자동으로 앱을 빌드하고 GitHub Release에 .dmg 설치 파일을 업로드합니다."
echo "진행 상황은 GitHub 저장소의 'Actions' 탭에서 확인하실 수 있습니다."

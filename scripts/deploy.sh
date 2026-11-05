#!/usr/bin/env bash
# 프론트를 빌드하고, 설치되어 있으면 systemd 또는 pm2로 한 포트를 다시 띄웁니다.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22 이상이 필요합니다." >&2
  exit 1
fi

NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "Node.js 22 이상이 필요합니다. 현재: $(node -v)" >&2
  exit 1
fi

if [ ! -f .env ] && [ -z "${ADMIN_PASSWORD:-}" ]; then
  echo "경고: .env 가 없고 ADMIN_PASSWORD 도 없습니다. 관리자 로그인이 꺼집니다." >&2
fi

npm ci
npm run build

if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files --type=service 2>/dev/null | grep -q '^ebs-apply\.service'; then
  sudo systemctl restart ebs-apply
  sudo systemctl --no-pager --full status ebs-apply || true
elif command -v pm2 >/dev/null 2>&1; then
  pm2 startOrReload "$ROOT/deploy/ecosystem.config.cjs" --update-env
  pm2 save || true
else
  echo "빌드가 끝났습니다. 서버 시작: npm start"
fi

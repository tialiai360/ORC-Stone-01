#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REQUIRED=(
  apps/web apps/api packages/shared packages/config
  docs docker scripts tests .github storage/uploads
  docker/docker-compose.yml docker/Dockerfile.api docker/Dockerfile.web
)
for rel in "${REQUIRED[@]}"; do
  test -e "$ROOT/$rel" || { echo "Missing: $rel"; exit 1; }
done
echo "MVP-001 structure OK"

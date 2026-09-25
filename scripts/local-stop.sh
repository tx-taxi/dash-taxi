#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
for name in frontend adapter; do
 if [[ -f .local/$name.pid ]]; then kill "$(cat .local/$name.pid)" 2>/dev/null || true; rm .local/$name.pid; fi
done

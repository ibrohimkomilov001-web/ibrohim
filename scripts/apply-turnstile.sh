#!/bin/bash
# Apply Turnstile changes to prod code tree
set -euo pipefail
ROOT=/home/yc-user/topla

sudo cp /tmp/captcha.ts         "$ROOT/topla-backend/src/lib/captcha.ts"
sudo rm -f                      "$ROOT/topla-backend/src/lib/recaptcha.ts"
sudo cp /tmp/admin-auth.routes.ts "$ROOT/topla-backend/src/modules/admin/admin-auth.routes.ts"
sudo cp /tmp/login-page.tsx     "$ROOT/topla-web/src/app/admin/login/page.tsx"
sudo cp /tmp/dc.yml             "$ROOT/docker-compose.prod.yml"
sudo cp /tmp/webDockerfile      "$ROOT/topla-web/Dockerfile"
rm -f /tmp/captcha.ts /tmp/admin-auth.routes.ts /tmp/login-page.tsx /tmp/dc.yml /tmp/webDockerfile
echo "APPLIED"

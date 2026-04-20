#!/bin/bash
# Switch from reCAPTCHA to Cloudflare Turnstile in prod .env
set -euo pipefail
cd /home/yc-user/topla

TURNSTILE_SITE='0x4AAAAAAC_3r65pG-DKrN9K'
TURNSTILE_SECRET='0x4AAAAAAC_3r7Lf5sjsUyQG3yO0NL_e8Eo'

for F in .env .env.local; do
  [ -f "$F" ] || continue
  sudo cp "$F" "${F}.bak-turnstile-$(date +%Y%m%d_%H%M%S)"
  # Remove all RECAPTCHA_* and old TURNSTILE_* lines
  sudo sed -i '/^RECAPTCHA_/d; /^NEXT_PUBLIC_RECAPTCHA_/d; /^TURNSTILE_/d; /^NEXT_PUBLIC_TURNSTILE_/d' "$F"
done

# Add Turnstile keys to .env (compose reads this)
sudo tee -a .env >/dev/null <<EOF
TURNSTILE_SECRET_KEY=$TURNSTILE_SECRET
TURNSTILE_SOFT_MODE=false
NEXT_PUBLIC_TURNSTILE_SITE_KEY=$TURNSTILE_SITE
EOF

echo "--- .env Turnstile/reCAPTCHA state ---"
sudo grep -E '^(NEXT_PUBLIC_)?(TURNSTILE|RECAPTCHA)' .env | awk -F= '{print $1, "len="length($2)}'

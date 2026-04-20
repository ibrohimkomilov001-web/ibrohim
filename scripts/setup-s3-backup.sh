#!/bin/bash
# Avtomatik Yandex Cloud S3 backup sozlovchi
# Parametrlar:
#   $1 - OAuth token (y0_...)
set -euo pipefail

TOKEN="${1:?OAuth token required}"
SA_NAME="topla-backup-sa"
BUCKET="topla-backups"
ENV_FILE="/home/yc-user/topla/.env"
LOG() { echo "[$(date +%H:%M:%S)] $*"; }

# --- 1. yc CLI o'rnatilganmi? ---------------------------------------------
if ! command -v yc >/dev/null 2>&1; then
  LOG "Installing yc CLI to \$HOME/yandex-cloud..."
  curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash -s -- -i "$HOME/yandex-cloud" -n >/dev/null
fi
export PATH="$HOME/yandex-cloud/bin:$PATH"
yc --version | head -1

# --- 2. Profilni sozlash ---------------------------------------------------
LOG "Configuring yc profile..."
yc config profile create topla-setup 2>/dev/null || yc config profile activate topla-setup
yc config set token "$TOKEN"

# --- 3. Cloud/Folder aniqlash ---------------------------------------------
CLOUD_ID=$(yc resource-manager cloud list --format json | python3 -c 'import json,sys; print(json.load(sys.stdin)[0]["id"])')
yc config set cloud-id "$CLOUD_ID"
LOG "Cloud: $CLOUD_ID"

FOLDER_ID=$(yc resource-manager folder list --format json | python3 -c 'import json,sys; print(json.load(sys.stdin)[0]["id"])')
yc config set folder-id "$FOLDER_ID"
LOG "Folder: $FOLDER_ID"

# --- 4. Service account (mavjud bo'lsa qayta ishlatamiz) ------------------
SA_ID=$(yc iam service-account list --format json | python3 -c "import json,sys
d=json.load(sys.stdin)
for s in d:
  if s['name']=='$SA_NAME': print(s['id']); sys.exit(0)" || true)

if [ -z "${SA_ID:-}" ]; then
  LOG "Creating service account $SA_NAME..."
  SA_ID=$(yc iam service-account create --name "$SA_NAME" --format json | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')
fi
LOG "SA ID: $SA_ID"

# --- 5. Rolni berish --------------------------------------------------------
LOG "Assigning storage.editor role..."
yc resource-manager folder add-access-binding "$FOLDER_ID" \
  --role storage.editor \
  --subject "serviceAccount:$SA_ID" 2>&1 | grep -v "already" || true

# --- 6. Bucket yaratish (mavjud bo'lmasa) ---------------------------------
EXISTS=$(yc storage bucket list --format json 2>/dev/null | python3 -c "import json,sys
d=json.load(sys.stdin)
print('yes' if any(b['name']=='$BUCKET' for b in d) else 'no')" || echo "no")

if [ "$EXISTS" = "no" ]; then
  LOG "Creating bucket $BUCKET (private, cold)..."
  yc storage bucket create --name "$BUCKET" \
    --default-storage-class cold \
    --public-read=false \
    --public-list=false \
    --public-config-read=false || LOG "(bucket create failed — may already exist with different casing)"
else
  LOG "Bucket $BUCKET already exists"
fi

# --- 7. Static access key yaratish ----------------------------------------
LOG "Creating static access key for $SA_NAME..."
KEY_JSON=$(yc iam access-key create --service-account-id "$SA_ID" --format json)
AK_ID=$(echo "$KEY_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_key"]["key_id"])')
AK_SECRET=$(echo "$KEY_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["secret"])')

LOG "Access Key ID: $AK_ID (len=${#AK_ID})"
LOG "Secret Key:    [${#AK_SECRET} chars]"

# --- 8. .env fayliga yozish ------------------------------------------------
LOG "Writing credentials to $ENV_FILE..."
sudo cp "$ENV_FILE" "${ENV_FILE}.bak-s3-$(date +%Y%m%d_%H%M%S)"

sudo sed -i '/^S3_ACCESS_KEY=/d; /^S3_SECRET_KEY=/d; /^S3_BUCKET=/d; /^S3_ENDPOINT=/d; /^S3_REGION=/d' "$ENV_FILE"

sudo tee -a "$ENV_FILE" >/dev/null <<EOF
S3_ENDPOINT=https://storage.yandexcloud.net
S3_REGION=ru-central1
S3_BUCKET=$BUCKET
S3_ACCESS_KEY=$AK_ID
S3_SECRET_KEY=$AK_SECRET
EOF

LOG "--- verify ---"
sudo grep -E '^S3_' "$ENV_FILE" | awk -F= '{print $1, "len="length($2)}'

# --- 9. Profile cleanup (tokenni olib tashlaymiz) -------------------------
LOG "Cleaning up local yc profile token..."
yc config unset token 2>/dev/null || true
yc config profile delete topla-setup 2>/dev/null || true

LOG "DONE"

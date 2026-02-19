# TOPLA.UZ — Yandex Cloud Deploy Guide

## Arxitektura

```
                    ┌─────────────┐
                    │  Yandex DNS │
                    │  topla.uz   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Yandex Cloud│
                    │  Compute    │
                    │  Instance   │
                    └──────┬──────┘
                           │
               ┌───────────▼───────────┐
               │     Nginx :80/:443    │
               │   (SSL + Reverse Proxy)│
               └───┬───────────────┬───┘
                   │               │
          ┌────────▼────┐   ┌──────▼─────┐
          │  API :3001  │   │  Web :3000  │
          │  (Fastify)  │   │  (Next.js)  │
          └──┬───┬───┬──┘   └────────────┘
             │   │   │
     ┌───────▼┐ ┌▼──────┐ ┌▼───────────┐
     │Postgres│ │ Redis  │ │ Meilisearch│
     │  :5432 │ │ :6379  │ │   :7700    │
     └────────┘ └────────┘ └────────────┘
                                    │
                    ┌───────────────▼──┐
                    │  Yandex Object   │
                    │  Storage (S3)    │
                    └──────────────────┘
```

## Talab qilinadigan resurslar

| Servis | Minimal | Tavsiya etiladi |
|--------|---------|-----------------|
| **Compute Instance** | 2 vCPU, 4 GB RAM, 40 GB SSD | 4 vCPU, 8 GB RAM, 80 GB SSD |
| **Object Storage** | 3 bucket (products, shops, avatars) | Xuddi shu |
| **DNS Zone** | topla.uz domeni | Xuddi shu |

**Taxminiy narxi**: ~3000-5000 RUB/oy (minimal), ~8000-12000 RUB/oy (tavsiya)

---

## 1-QADAM: Yandex Cloud hisob sozlash

### 1.1 Yandex Cloud Console

```bash
# YC CLI o'rnatish
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
source ~/.bashrc

# Login
yc init
# Cloud va folder tanlang
```

### 1.2 Service Account yaratish

```bash
# Service account
yc iam service-account create --name topla-sa --description "TOPLA deployment"

# Kerakli rollarni berish
SA_ID=$(yc iam service-account get topla-sa --format json | jq -r '.id')
FOLDER_ID=$(yc config get folder-id)

yc resource-manager folder add-access-binding $FOLDER_ID \
  --role storage.editor \
  --subject serviceAccount:$SA_ID

yc resource-manager folder add-access-binding $FOLDER_ID \
  --role compute.editor \
  --subject serviceAccount:$SA_ID

# Static access key (S3 uchun)
yc iam access-key create --service-account-name topla-sa
# Chiqadigan ACCESS_KEY va SECRET_KEY ni yozib oling!
```

### 1.3 Object Storage (S3) bucket'lar yaratish

```bash
# Buckletarni yaratish
yc storage bucket create --name topla-products --default-storage-class standard --max-size 10737418240
yc storage bucket create --name topla-shops --default-storage-class standard --max-size 5368709120
yc storage bucket create --name topla-avatars --default-storage-class standard --max-size 2147483648

# Public read access (rasmlar uchun)
for BUCKET in topla-products topla-shops topla-avatars; do
  yc storage bucket update $BUCKET --acl public-read
done
```

---

## 2-QADAM: Compute Instance yaratish

### 2.1 VM yaratish

```bash
# SSH key yaratish (agar yo'q bo'lsa)
ssh-keygen -t ed25519 -f ~/.ssh/topla-yc -C "topla-deploy"

# VM yaratish
yc compute instance create \
  --name topla-server \
  --hostname topla-server \
  --zone ru-central1-a \
  --platform standard-v3 \
  --cores 2 \
  --core-fraction 100 \
  --memory 4 \
  --create-boot-disk image-folder-id=standard-images,image-family=ubuntu-2204-lts,size=40,type=network-ssd \
  --network-interface subnet-name=default-ru-central1-a,nat-ip-version=ipv4 \
  --ssh-key ~/.ssh/topla-yc.pub \
  --metadata serial-port-enable=1

# Public IP olish
yc compute instance get topla-server --format json | jq -r '.network_interfaces[0].primary_v4_address.one_to_one_nat.address'
```

### 2.2 DNS sozlash

Yandex Cloud DNS yoki domen registratoringizda:

| Turi | Nomi | Qiymati |
|------|------|---------|
| A | topla.uz | `<VM_PUBLIC_IP>` |
| A | www.topla.uz | `<VM_PUBLIC_IP>` |
| A | api.topla.uz | `<VM_PUBLIC_IP>` |
| A | admin.topla.uz | `<VM_PUBLIC_IP>` |
| A | vendor.topla.uz | `<VM_PUBLIC_IP>` |

```bash
# Yandex DNS orqali (agar zone yaratilgan bo'lsa)
ZONE_ID=$(yc dns zone list --format json | jq -r '.[0].id')
VM_IP=$(yc compute instance get topla-server --format json | jq -r '.network_interfaces[0].primary_v4_address.one_to_one_nat.address')

for DOMAIN in topla.uz www.topla.uz api.topla.uz admin.topla.uz vendor.topla.uz; do
  yc dns zone add-records --id $ZONE_ID \
    --record "$DOMAIN. 300 A $VM_IP"
done
```

---

## 3-QADAM: Server sozlash

### 3.1 SSH bilan serverga kirish

```bash
ssh -i ~/.ssh/topla-yc yc-user@<VM_PUBLIC_IP>
```

### 3.2 Docker o'rnatish

```bash
# System update
sudo apt update && sudo apt upgrade -y

# Docker o'rnatish
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Qayta login (docker group uchun)
exit
ssh -i ~/.ssh/topla-yc yc-user@<VM_PUBLIC_IP>

# Tekshirish
docker --version
docker compose version
```

### 3.3 Firewall sozlash

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

### 3.4 Swap yaratish (4GB RAM uchun)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 4-QADAM: Loyihani deploy qilish

### 4.1 Kodni serverga ko'chirish

```bash
# Serverda
mkdir -p ~/topla && cd ~/topla

# Variant A — Git orqali
git clone <YOUR_REPO_URL> .

# Variant B — rsync orqali (lokal kompyuterdan)
# rsync -avz --exclude node_modules --exclude .next --exclude build \
#   -e "ssh -i ~/.ssh/topla-yc" \
#   . yc-user@<VM_IP>:~/topla/
```

### 4.2 Environment variables sozlash

```bash
cd ~/topla
cp .env.example .env
nano .env
```

`.env` faylga quyidagilarni to'ldiring:

```env
# Kuchli parollar generatsiya qilish:
# openssl rand -hex 32

POSTGRES_PASSWORD=<24+ belgili kuchli parol>
REDIS_PASSWORD=<24+ belgili kuchli parol>
JWT_SECRET=<openssl rand -hex 32 natijasi>
JWT_REFRESH_SECRET=<openssl rand -hex 32 natijasi>
MEILISEARCH_API_KEY=<openssl rand -hex 16 natijasi>

# Yandex Object Storage
S3_ENDPOINT=https://storage.yandexcloud.net
S3_REGION=ru-central1
S3_ACCESS_KEY=<1.2 bosqichda olgan ACCESS_KEY>
S3_SECRET_KEY=<1.2 bosqichda olgan SECRET_KEY>

# Firebase (service account JSON dan)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# Eskiz SMS
ESKIZ_EMAIL=your@email.com
ESKIZ_PASSWORD=your_eskiz_password

# Payment
PAYME_WEBHOOK_SECRET=your_payme_secret
CLICK_WEBHOOK_SECRET=your_click_secret
```

### 4.3 SSL sertifikat olish (birinchi marta)

```bash
# Avval faqat HTTP bilan nginx ishga tushiring (SSL siz)
# Vaqtincha nginx.conf da 443 blockni comment qiling

# Certbot orqali sertifikat olish
docker run --rm \
  -v topla_certbot_certs:/etc/letsencrypt \
  -v topla_certbot_www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly \
    --standalone \
    -d topla.uz \
    -d www.topla.uz \
    -d api.topla.uz \
    -d admin.topla.uz \
    -d vendor.topla.uz \
    --email admin@topla.uz \
    --agree-tos \
    --no-eff-email

# Sertifikat olingandan keyin to'liq compose ishga tushiring
```

### 4.4 Build va Start

```bash
cd ~/topla

# Build (birinchi marta 5-10 daqiqa)
docker compose -f docker-compose.prod.yml build

# Start
docker compose -f docker-compose.prod.yml up -d

# Status tekshirish
docker compose -f docker-compose.prod.yml ps

# Loglarni ko'rish
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f nginx
```

### 4.5 Tekshirish

```bash
# Health check
curl -s http://localhost:3001/health | jq

# Tashqaridan
curl -s https://api.topla.uz/health | jq

# Web sahifa
curl -s -o /dev/null -w "%{http_code}" https://topla.uz

# Barcha container'lar ishlayaptimi?
docker compose -f docker-compose.prod.yml ps
```

---

## 5-QADAM: Backup va Monitoring

### 5.1 Backup tekshirish

Backup container avtomatik ishga tushadi va har 24 soatda pg_dump qiladi:

```bash
# Backup fayllar
ls -la ~/topla/backups/

# Manual backup
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U topla_user topla_db | gzip > ~/topla/backups/manual_$(date +%Y%m%d).sql.gz
```

### 5.2 Backupni Yandex Object Storage ga ko'chirish

```bash
# s3cmd o'rnatish va sozlash
sudo apt install -y s3cmd
s3cmd --configure
# Endpoint: storage.yandexcloud.net
# Access Key va Secret Key kiriting

# Cron job — har kuni backup ni S3 ga ko'chirish
(crontab -l 2>/dev/null; echo "0 3 * * * s3cmd sync ~/topla/backups/ s3://topla-backups/ --delete-removed") | crontab -
```

### 5.3 Monitoring

```bash
# System resurslari
htop

# Docker container'lar
docker stats

# Disk ishlatish
df -h

# API response time
curl -w "@/dev/null" -o /dev/null -s -w "time_total: %{time_total}s\n" https://api.topla.uz/health
```

---

## Foydali buyruqlar

### Yangilash (Deployment)

```bash
cd ~/topla

# Yangi kodni olish
git pull origin main

# Qayta build va restart
docker compose -f docker-compose.prod.yml build api web
docker compose -f docker-compose.prod.yml up -d api web

# Migration (agar yangi migration bo'lsa — avtomatik CMD da)
docker compose -f docker-compose.prod.yml restart api
```

### Loglarni ko'rish

```bash
# Barcha loglar
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Faqat API
docker compose -f docker-compose.prod.yml logs -f api --tail=50

# Error loglar
docker compose -f docker-compose.prod.yml logs api 2>&1 | grep -i error
```

### DB ga kirish

```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U topla_user -d topla_db
```

### Backupdan tiklash

```bash
# Container'larni to'xtatish
docker compose -f docker-compose.prod.yml stop api web

# Backupni tiklash
gunzip -c ~/topla/backups/topla_20260215_030000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres psql -U topla_user -d topla_db

# Qayta ishga tushirish
docker compose -f docker-compose.prod.yml start api web
```

### SSL sertifikat yangilash (manual)

```bash
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## Xavfsizlik tekshiruv ro'yxati

- [ ] `.env` fayl `chmod 600` qilingan
- [ ] SSH key-based auth (parol o'chirilgan)
- [ ] UFW firewall yoqilgan (faqat 22, 80, 443)
- [ ] PostgreSQL tashqaridan kirib bo'lmaydi (faqat Docker network)
- [ ] Redis parol bilan himoyalangan
- [ ] SSL sertifikat ishlamoqda (HTTPS)
- [ ] Backup ishlamoqda va S3 ga ko'chirilmoqda
- [ ] Yandex Cloud security groups sozlangan
- [ ] Server SSH porti o'zgartirilgan (optional: 22 → 2222)

---

## Muammolar va yechimlari

| Muammo | Yechim |
|--------|--------|
| `Cannot connect to DB` | `docker compose logs postgres` — parol to'g'ri ekanini tekshiring |
| `SSL handshake failed` | Sertifikat muddati tugagan — `certbot renew` |
| `502 Bad Gateway` | API container crashlangan — `docker compose logs api` |
| `Disk full` | Eski backup va Docker image'larni tozalash: `docker system prune -a` |
| `Out of memory` | Swap yoqilganmi tekshiring, konteyner limitlarini oshiring |
| `Permission denied (S3)` | Service account access key va bucket ACL ni tekshiring |

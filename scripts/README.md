# TOPLA.UZ — SSH Deploy (GitHub-siz)

Bu papkadagi skriptlar lokal kompyuterdan to'g'ridan-to'g'ri Yandex Cloud VM'ga deploy qilish uchun. GitHub Actions umuman ishlatilmaydi.

## Talablar (Windows lokal kompyuter)

- OpenSSH klient (Windows 10/11'da built-in)
- Git (ixtiyoriy — versiyalashtirish uchun)
- PowerShell 5.1+
- SSH key: `$env:USERPROFILE\.ssh\topla-yc`

## Fayl tuzilishi

```
scripts/
├── deploy.ps1          # Lokal → VM deploy
├── rollback.ps1        # Oldingi relizga qaytish
└── deploy/
    ├── deploy.config.ps1   # VM connection sozlamalari
    └── remote-deploy.sh    # VM ichida ishlaydigan skript
```

## Oddiy ish jarayoni (workflow)

### 1. Kod yozasiz → lokal testlar

```powershell
cd topla-backend; npx vitest run
cd ..\topla-web;  npx tsc --noEmit
```

### 2. Lokal commit (GitHub'ga push ixtiyoriy — faqat backup uchun)

```powershell
git add .
git commit -m "feat: xyz"
# Xohlasangiz backup uchun GitHub'ga push qilasiz:
git push origin master
```

### 3. Deploy

```powershell
.\scripts\deploy.ps1
```

Bu skript:
1. Lokal testlarni (backend vitest + web tsc) tekshiradi (o'tmasa deploy bo'lmaydi)
2. Deploy uchun tar.gz arxiv yaratadi (node_modules, .next, .git chiqariladi)
3. scp orqali VM'ga yuboradi
4. VM'da **hozirgi versiyani zaxira** qiladi (`/home/yc-user/topla.bak-<timestamp>`)
5. Yangi kodni ochadi
6. `docker compose build && up -d` ishga tushiradi
7. Health check (`/health` endpoint) — agar pass bo'lmasa avtomatik rollback
8. Eski 3 tadan ko'p backup'larni tozalaydi

### 4. Agar xato bo'lsa — rollback

```powershell
.\scripts\rollback.ps1
```

Eng oxirgi backup'ga qaytaradi.

## Secrets (muhim!)

Secrets **faqat VM ichida** saqlanadi: `/home/yc-user/topla/.env.local`
- Bu fayl hech qachon repo'ga tushmaydi
- `.gitignore` allaqachon `.env.local`ni chiqarib qo'yadi
- Deploy skripti bu faylni o'zgartirmaydi
- Qayta yaratish kerak bo'lsa: VM'ga SSH bilan kiring va qo'lda tahrirlang

Misol `.env.local`:
```
POSTGRES_PASSWORD=...
REDIS_PASSWORD=...
JWT_SECRET=<32-belgili-tasodifiy>
JWT_REFRESH_SECRET=<32-belgili-tasodifiy>
COOKIE_SECRET=<32-belgili-tasodifiy>
MEILISEARCH_API_KEY=<32+-belgili>
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
# va h.k.
```

## GitHub faqat backup uchun

Siz GitHub'ga push qilishingiz mumkin, lekin:
- **Secrets'ni repo'ga qo'ymang** (`.env`, `.env.local`, `key.properties` — barchasi `.gitignore`da)
- Repo **private** bo'lishi shart
- Akkauntingizga **2FA (TOTP yoki YubiKey)** qo'ying

Kompyuter buzilsa:
```powershell
git clone https://github.com/<sizning-akkount>/topla.uz.git
cd topla.uz
# .env.local VM'da, o'zingiz yangi kompyuterga ko'chirasiz yoki VM'dan ko'chirasiz
.\scripts\deploy.ps1
```

## Xavfsizlik taqqosi

| Narsa | GitHub Actions | SSH Deploy |
|-------|----------------|------------|
| Kod GitHub'da ko'rinadi | Ha | Faqat xohlasangiz |
| Secrets GitHub'da | Ha (shifrlangan) | **Yo'q, hech qachon** |
| Deploy mexanizmi bog'liq | GitHub runner | Faqat sizning SSH key |
| Rollback oson | Qiyin | `rollback.ps1` |
| Uchinchi tomon bog'liqligi | Bor | Yo'q |

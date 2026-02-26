# TOPLA.APP — To'liq Chuqur Tahlil Hisoboti

> Sana: 2026-02-14
> Tahlil turi: Backend + Flutter App + Web Frontend + Infra

---

## TUZATILGAN MUAMMOLAR (Bugun)

| # | Muammo | Fayl | Holat |
|---|--------|------|-------|
| ✅ 1 | **ZodError 500 o'rniga 400** — barcha validation xatolari "Internal Server Error" qaytardi | `error.ts` | TUZATILDI |
| ✅ 2 | **SQL Injection** — `$queryRawUnsafe` + string interpolation admin analitikada | `admin.routes.ts` | TUZATILDI |
| ✅ 3 | **TypeScript xatolik** — `colors` o'rniga `color`, `name` o'rniga `nameUz/nameRu` | `vendor.routes.ts` | TUZATILDI |
| ✅ 4 | **Stock Race Condition** — stock tekshirish transaction ichiga ko'chirildi | `order.routes.ts` | TUZATILDI |
| ✅ 5 | **Mavjud bo'lmagan `variants` relation** olib tashlandi | `vendor.routes.ts` | TUZATILDI |

---

## 1. BACKEND TAHLILI (topla-backend)

### 1.1 Arxitektura
| Texnologiya | Versiya |  
|---|---|
| Fastify | TypeScript |
| Prisma ORM | PostgreSQL |
| Redis | Cache + OTP |
| Socket.IO | Real-time |
| Firebase FCM | Push notifications |
| Meilisearch | Search (o'rnatilgan, ISHLATILMAYAPTI) |
| S3/MinIO | File storage |

### 1.2 KRITIK Xavfsizlik Muammolari

| # | Muammo | Jiddiylik | Fayl |
|---|--------|-----------|------|
| B1 | **JWT token logout da bekor qilinmaydi** — o'g'irlangan token 30 kun ishlaydi | KRITIK | `auth.routes.ts` |
| B2 | **Refresh token rotation yo'q** — eski token bekor qilinmaydi | YUQORI | `auth.routes.ts` |
| B3 | **JWT_REFRESH_SECRET** fallback: `JWT_SECRET + '-refresh'` — agar env o'rnatilmasa topish oson | YUQORI | `jwt.ts` |
| B4 | **Promo code race condition** — transaction tashqarisida tekshiriladi | YUQORI | `order.routes.ts` |
| B5 | **Shop minOrderAmount tekshirilmaydi** — buyurtma yaratishda e'tiborsiz | O'RTA | `order.routes.ts` |
| B6 | **Swagger docs production da ochiq** — `/docs` endpoint himoyasiz | O'RTA | `app.ts` |
| B7 | **Uploaded fayllar autentifikatsiyasiz** — `/uploads/` public | O'RTA | `app.ts` |
| B8 | **Payment callback IP whitelisting yo'q** | O'RTA | `payment.routes.ts` |
| B9 | **SavedCard token plaintext** — shifrlash kerak | O'RTA | `payment.routes.ts` |
| B10 | **Vendor/Admin login rate limiting yo'q** — brute force xavfi | YUQORI | `auth.routes.ts` |
| B11 | **Courier ro'yxatdan o'tishi admin tasdiqlashsiz role beradi** | O'RTA | `courier.routes.ts` |

### 1.3 WebSocket Muammolari

| # | Muammo | Ta'sir |
|---|--------|--------|
| W1 | **Rate limiting yo'q** — har millisekunda `courier:location` yuborish mumkin | DoS |
| W2 | **Input validation yo'q** — WS eventlarda Zod tekshiruvi yo'q | Xavfsizlik |
| W3 | **Boshqa foydalanuvchining buyurtmasini kuzatish mumkin** — `track:order` da ownership check yo'q | Privacy |
| W4 | **Emit funksiyalari hechqayerda chaqirilmaydi** — `emitOrderStatusUpdate`, `emitNewOrderToVendor` eksport qilingan lekin import qilinmagan | Real-time ishlamaydi |

### 1.4 Input Validation Kamchiliklari

| Endpoint | Muammo |
|----------|--------|
| `POST /cart` | `productId` UUID validatsiyasi yo'q, `quantity` chegaralanmagan |
| `POST /auth/fcm-token` | Body Zod bilan tekshirilmaydi |
| `POST /shops/:id/reviews` | `rating`, `comment` validatsiyasi yo'q |
| `POST /orders/:id/rate` | `rating`, `comment` validatsiyasi yo'q |
| `GET /products/featured` | `limit` chegaralanmagan — 999999 bo'lishi mumkin |
| Barcha `:id` parametrlar | UUID format tekshirilmaydi |

### 1.5 Business Logic Xatolari

| # | Muammo | Fayl |
|---|--------|------|
| BL1 | `courierDelivered()` barcha buyurtmalarni `paid` deb belgilaydi, naqd to'lov ham | `courier.service.ts` |
| BL2 | Vendor buyurtma bekor qilganda courier `busy` statusda qoladi | `order.routes.ts` |
| BL3 | Mahsulot o'chirilganda faol buyurtmalardagi referenslar tekshirilmaydi | `product.routes.ts` |
| BL4 | `generateOrderNumber()` kuniga faqat 10000 raqam — collision xavfi | `order.routes.ts` |
| BL5 | Courier assignment `setTimeout(60s)` — server restart da yo'qoladi | `courier.service.ts` |
| BL6 | Recursive `findAndAssignCourier()` — 100 courier da 100 marta recurse | `courier.service.ts` |

### 1.6 Performance Muammolari

| # | Muammo | Ta'sir |
|---|--------|--------|
| P1 | **Redis cache helpers yozilgan lekin ISHLATILMAYAPTI** — categories, brands, banners har request da DB dan | Keraksiz DB load |
| P2 | **Meilisearch integratsiya qilinmagan** — `searchProducts()` yozilgan lekin `contains` ishlatiladi | Sekin search |
| P3 | **N+1 query** — `/courier/orders/available` har assignment uchun alohida query | DB bottleneck |
| P4 | **12 parallel DB queries** — `/vendor/stats` bitta request da | 12 round-trip |
| P5 | **Admin notification broadcast** — barcha user IDlarni memory ga yuklaydi | Memory pressure |
| P6 | **WebSocket `courier:location`** har 5 sekundda DB ga yozadi (2 write/courier) | Write amplification |

### 1.7 O'lik Kod

| Funksiya | Hech qayerda ishlatilmaydi |
|----------|--------------------------|
| `emitOrderStatusUpdate()` | socket.ts export, import yo'q |
| `emitNewOrderToVendor()` | socket.ts export, import yo'q |
| `emitDeliveryOfferToCourier()` | socket.ts export, import yo'q |
| `searchProducts()` (Meilisearch) | search.service.ts |
| Redis `cacheGet/cacheSet/cacheDelete` | redis.ts |
| `getEskizBalance()` | eskiz.ts |
| `checkTelegramAbility()` | telegram.ts |
| Delivery zones CRUD | Admin da CRUD bor, order yaratishda tekshirilmaydi |

### 1.8 Test Holati
- **Backend testlar: 0** — vitest o'rnatilgan, bitta test fayl ham yo'q
- **Estimated coverage: 0%**

---

## 2. FLUTTER APP TAHLILI (topla_app)

### 2.1 Arxitektura
- **Pattern**: Clean Architecture + Repository Pattern
- **State Management**: Provider (ChangeNotifier) — 9 provider
- **DI**: get_it (service locator)
- **22 feature moduli**, 32 shared widget, 11 repository interface

### 2.2 KRITIK Muammolar

| # | Muammo | Jiddiylik |
|---|--------|-----------|
| F1 | **Firebase API kalitlari hardcoded** — `firebase_options.dart` da | KRITIK |
| F2 | **iOS Info.plist permission strings yo'q** — App Store reject qiladi | KRITIK |
| F3 | **5 ta foydalanilmayotgan dependency** — freezed, go_router, build_runner, json_serializable, json_annotation | YUQORI |
| F4 | **Singleton + DI dual pattern** — ApiClient, CacheService, etc. | YUQORI |
| F5 | **Ikki xil localization tizimi** — `app_strings.dart` + `app_localizations.dart` | O'RTA |
| F6 | **DeviceFingerprint timestamp asosida** — haqiqiy fingerprint emas | PAST |

### 2.3 Performance

| # | Muammo |
|---|--------|
| FP1 | Providerlar constructor da API chaqiradi — startup da bir necha network request |
| FP2 | Cart subscription har event da to'liq reload qiladi |
| FP3 | Google Fonts tarmoqdan yuklanadi (bundle qilinmagan) |
| FP4 | No pagination in UI — 20-50 ta fixed size |

### 2.4 Test Holati
| Turdagi | Miqdor | Qamrov |
|---------|--------|--------|
| Unit (Repository) | 2 | Yaxshi |
| Unit (Service) | 2 | Yaxshi |
| Widget | 2 | Minimal |
| Integration | 0 | Yo'q |
| Provider testlar | 0 | Yo'q |
| Model serialization | 0 | Yo'q |
| **Umumiy qamrov** | **~5%** | **Juda past** |

### 2.5 Ishlatilmayotgan Dependencies (o'chirish kerak)

| Package | Hajm ta'siri |
|---------|-------------|
| `freezed` + `freezed_annotation` | ~800KB dev |
| `json_serializable` + `json_annotation` | Ishlatilmaydi |
| `build_runner` | Ishlatilmaydi |
| `go_router` | Ishlatilmaydi (named routes ishlatiladi) |

---

## 3. WEB FRONTEND TAHLILI (topla-web)

### 3.1 Arxitektura
- **Next.js 14 App Router** — subdomain-based routing (shop/vendor/admin)
- **State**: React Query (server data), Context (auth), localStorage (cart)
- **UI**: shadcn/ui + Tailwind CSS + Framer Motion
- **i18n**: next-intl (o'rnatilgan, ISHLATILMAYAPTI)

### 3.2 KRITIK Xavfsizlik

| # | Muammo | Jiddiylik |
|---|--------|-----------|
| W1 | **Admin credentials UI da ko'rsatiladi** — `admin@topla.uz / admin123` | KRITIK |
| W2 | **Demo mode backdoor** — backend o'chiq bo'lsa ham admin panel ishlaydi | KRITIK |
| W3 | **Token localStorage da** — XSS ga zaif, httpOnly cookie kerak | YUQORI |
| W4 | **CSRF himoyasi yo'q** | YUQORI |
| W5 | **error.tsx fayllar yo'q** — error boundary dan o'tmaydi | O'RTA |

### 3.3 SEO Muammolari
- Shop sahifalari **to'liq client-rendered** — Google bot faqat skeleton ko'radi
- `robots.txt`, `sitemap.xml` yo'q
- Open Graph / Twitter Card yo'q
- Structured data (JSON-LD) yo'q
- Metadata faqat root layout da

### 3.4 Performance
- **Bundle hajmi ~1.5MB+**: recharts + apexcharts (ikkisi ham!), framer-motion, xlsx, jspdf
- **Dynamic import yo'q** — og'ir komponentlar lazy-load qilinmaydi
- **Zustand o'rnatilgan, ishlatilmayapti**
- **Uch xil fetch implementation** — `client.ts`, `shop.ts`, `admin.ts` (DRY buzilgan)

### 3.5 i18n Holati
- `next-intl` o'rnatilgan, `messages/uz.json` va `messages/ru.json` mavjud
- **LEKIN**: Bitta komponent ham `useTranslations()` chaqirmaydi
- Barcha UI text Uzbek tilida hardcoded
- Locale switching UI yo'q
- **Ma'nosi**: i18n fayllari o'lik kod

### 3.6 Accessibility
- Icon-only buttonlarda ARIA label yo'q
- FAQ accordion accessible emas
- Banner carousel to'xtash mumkin emas (WCAG 2.2.2)
- Skip-to-content link yo'q
- Focus management yo'q

### 3.7 Test Holati
- **Web frontend testlar: 0**

---

## 4. INFRA & DOCKER TAHLILI

### 4.1 KRITIK Muammolar

| # | Muammo | Jiddiylik |
|---|--------|-----------|
| I1 | **Supabase anon key hardcoded** docker-compose.dev.yml da | KRITIK |
| I2 | **DB password hardcoded**: `topla_pass_2024` | KRITIK |
| I3 | **CORS `Access-Control-Allow-Origin: *`** production nginx da | KRITIK |
| I4 | **Prisma migrate deploy yo'q** — Docker CMD da migration yo'q | KRITIK |
| I5 | **Port mismatch** — Dockerfile HEALTHCHECK port 3000, prod port 3001 | KRITIK |
| I6 | **Seed fayl production da ham ishlaydi** — `deleteMany()` ma'lumotlarni o'chiradi | KRITIK |
| I7 | **Redis parolsiz** — Docker networkdagi har kim kirishi mumkin | YUQORI |
| I8 | **tsconfig.json `strict: false`** — TypeScript xavfsizlik o'chirilgan | KRITIK |
| I9 | **nginx `worker_processes` default 1** | YUQORI |
| I10 | **SSL cert yangilanish mexanizmi yo'q** | YUQORI |

### 4.2 Database Schema Muammolari

#### Yo'q bo'lgan Indekslar (15+)
| Model | Ustun | Sabab |
|-------|-------|-------|
| Address | `userId` | Har qidirishda full table scan |
| CartItem | `userId` | Cart so'rovlari sekin |
| Favorite | `userId` | Sevimlilar ro'yxati sekin |
| OrderItem | `orderId`, `shopId`, `productId` | Vendor dashboard sekin |
| ShopReview | `shopId` | Review ro'yxati sekin |
| ShopFollow | `shopId`, `userId` | Follow tekshiruvi sekin |
| Product | `subcategoryId`, `brandId` | Filter sekin |
| Product | `[shopId, status]` composite | Vendor mahsulot boshqaruvi sekin |
| Transaction | `status` | Pending tranzaksiyalar sekin |
| Payout | `shopId` | Vendor to'lov tarixi sekin |
| PromoCodeUsage | `userId` | "Ishlatganmi?" tekshiruvi sekin |

#### Schema Dizayn Muammolari
- **String-typed enums** — `DeliveryAssignment.status`, `Transaction.status` va boshqalar raw String — noto'g'ri qiymatlar kiritilishi mumkin
- **Soft-delete yo'q** — hech bir modelda `deletedAt` yo'q
- **SavedCard PCI-DSS buzilishi** — `cardNumber`, `cardHolder` saqlanmasligi kerak
- **PromoCode concurrent race** — `currentUses` DB-level constraint yo'q
- **Transaction.orderId relation yo'q** — faqat string, Prisma join qila olmaydi
- **onDelete policy yo'q** — Product/User o'chirilsa OrderItem orphan bo'ladi

---

## 5. TO'LIQ TUZATISH REJASI

### FASE 0: ZUDLIK BILAN (1-2 kun)
- [x] ~~ZodError → 400 status code fix~~
- [x] ~~SQL Injection fix (admin analytics)~~
- [x] ~~Stock race condition fix~~
- [x] ~~TypeScript compilation errors fix~~
- [ ] Admin credentials UI dan olib tashlash
- [ ] Demo mode production da o'chirish
- [ ] `tsconfig.json` → `strict: true`
- [ ] Seed file da `NODE_ENV` guard
- [ ] CORS `*` → specific origins
- [ ] DB password `.env` ga ko'chirish

### FASE 1: Xavfsizlik (3-5 kun)
- [ ] JWT blacklist/rotation (Redis-based)
- [ ] Login rate limiting (5 attempts/15min)
- [ ] WebSocket input validation + rate limiting
- [ ] Order ownership check in track:order
- [ ] SavedCard encryption at rest
- [ ] Payment webhook IP whitelisting
- [ ] httpOnly cookie for tokens (web)
- [ ] CSRF protection
- [ ] Swagger docs production da o'chirish
- [ ] Redis password qo'shish
- [ ] File upload authentication

### FASE 2: Database Optimization (2-3 kun)
- [ ] 15+ missing index qo'shish (migration)
- [ ] String enums → Prisma enum
- [ ] Soft-delete qo'shish (deletedAt)
- [ ] onDelete policies qo'shish
- [ ] Transaction.orderId → proper relation
- [ ] PromoCode atomic increment (`UPDATE WHERE currentUses < maxUses`)
- [ ] SavedCard PCI-violating fields olib tashlash

### FASE 3: Backend Sifat (5-7 kun)
- [ ] Barcha endpointlarga Zod validation
- [ ] WebSocket emit funksiyalarini ulash (real-time ishlashi uchun)
- [ ] Meilisearch integratsiyasini yoqish
- [ ] Redis cache ishlatish (categories, brands, banners)
- [ ] Courier assignment → job queue (BullMQ)
- [ ] Favorites/Reviews pagination
- [ ] Shop minOrderAmount tekshiruvi
- [ ] Standardize pagination response format
- [ ] Dead code tozalash
- [ ] Password reset implementation
- [ ] 50+ unit test yozish (auth, orders, payments, cart)

### FASE 4: Flutter App (3-5 kun)
- [ ] Firebase keys → dart-define / env
- [ ] iOS Info.plist permission strings
- [ ] Unused dependencies olib tashlash (5 ta)
- [ ] Singleton/DI conflict tuzatish
- [ ] Bitta localization tizimi tanlash
- [ ] go_router o'rnatish yoki olib tashlash
- [ ] Firebase Crashlytics ulash
- [ ] Provider testlar yozish (20+)
- [ ] Model serialization testlar (22 model)
- [ ] UI pagination (infinite scroll)

### FASE 5: Web Frontend (5-7 kun)
- [ ] Shop sahifalarni SSR qilish (SEO)
- [ ] robots.txt + sitemap.xml
- [ ] Open Graph + JSON-LD structured data
- [ ] Error boundaries (error.tsx)
- [ ] Loading states (loading.tsx)
- [ ] i18n yoqish yoki o'chirish
- [ ] Duplicate chart library olib tashlash
- [ ] Zustand olib tashlash (yoki cart uchun ishlatish)
- [ ] API client birlashtirish (3 → 1)
- [ ] Dynamic imports (charts, PDF, Excel)
- [ ] Accessibility tuzatish (ARIA, keyboard nav)
- [ ] CSRF + httpOnly cookies
- [ ] 30+ komponent test yozish

### FASE 6: Infra & CI/CD (3-5 kun)
- [ ] `.env.example` fayllar yaratish
- [ ] Docker port standardize qilish
- [ ] Prisma migrate deploy → Docker CMD
- [ ] nginx hardening (CSP, worker_processes, server_tokens)
- [ ] SSL auto-renewal (certbot)
- [ ] Resource limits (mem_limit, cpus)
- [ ] Logging driver (json-file → loki/fluentd)
- [ ] Database backup strategy
- [ ] GitHub Actions CI/CD pipeline
- [ ] Sentry error tracking
- [ ] Health check endpoints

---

## 6. UMUMIY STATISTIKA

| Metrika | Qiymat |
|---------|--------|
| **KRITIK xavfsizlik muammolari** | 12 |
| **YUQORI xavfsizlik muammolari** | 15 |
| **O'RTA muammolar** | 25+ |
| **Missing DB indekslar** | 15+ |
| **Backend test qamrovi** | 0% |
| **Flutter test qamrovi** | ~5% |
| **Web test qamrovi** | 0% |
| **O'lik kod (funksiyalar)** | 10+ |
| **Ishlatilmayotgan dependencies** | 8+ |
| **TypeScript strict mode** | O'CHIRILGAN |
| **Tuzatilgan muammolar** | 5 (bugun) |
| **Production tayyor** | ❌ YO'Q |

---

## 7. XULOSA

Ilova yaxshi arxitektura asosiga ega (Clean Architecture, Repository Pattern, proper auth flow), lekin **production ga chiqarishdan oldin** quyidagi muammolar tuzatilishi **SHART**:

1. **Xavfsizlik**: JWT revocation, rate limiting, CORS, credential management
2. **Database**: Missing indexes (sekin bo'ladi), enum constraints, soft-delete
3. **Testlar**: Hozir deyarli 0% — kamida 60% qamrov kerak
4. **Real-time**: WebSocket emit funksiyalari ulangan emas — buyurtma yangiliklari real-time kelmaydi
5. **SEO**: Web do'kon Google da topilmaydi — SSR kerak
6. **Infra**: CI/CD yo'q, backup yo'q, monitoring yo'q

**Taxminiy to'liq tuzatish vaqti: 25-35 ish kuni (1 dasturchi uchun)**

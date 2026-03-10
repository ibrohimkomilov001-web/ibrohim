# TOPLA.APP — Keng Qamrovli Takomillashtirish Rejasi

> Admin Panel + Vendor Panel + Raqobatchilardan Ustun Bo'lish
> Uzum Market, Yandex Market, Sello.uz tahlili asosida

### ✅ STATUS: 51/51 VAZIFALAR BAJARILDI (100%)

| Fase | Vazifalar | Status |
|------|-----------|--------|
| Fase 1: Kritik Xatolar | BUG-001 — BUG-008 (8 ta) | ✅ 100% |
| Fase 2: Asosiy Yaxshilashlar | TASK-001 — TASK-013 (13 ta) | ✅ 100% |
| Fase 3: Mobil Moslashtirish | MOBILE-001 — MOBILE-010 (10 ta) | ✅ 100% |
| Fase 4: Raqobatbardosh | COMPETE-001 — COMPETE-010, SECURE-001 — SECURE-002 (12 ta) | ✅ 100% |
| Fase 5: Ilg'or Xususiyatlar | ADVANCED-001 — ADVANCED-008 (8 ta) | ✅ 100% |

> *Barcha vazifalar tasdiqlangan: 2025-yil*

---

## MUNDARIJA

1. [Fase 1: KRITIK XATOLARNI TUZATISH](#fase-1-kritik-xatolarni-tuzatish)
2. [Fase 2: ASOSIY YAXSHILASHLAR](#fase-2-asosiy-yaxshilashlar)
3. [Fase 3: MOBIL MOSLASHTIRISH](#fase-3-mobil-moslashtirish)
4. [Fase 4: RAQOBATBARDOSH XUSUSIYATLAR](#fase-4-raqobatbardosh-xususiyatlar)
5. [Fase 5: ILG'OR XUSUSIYATLAR](#fase-5-ilgor-xususiyatlar)

---

## FASE 1: KRITIK XATOLARNI TUZATISH
**Vaqt: 3-5 kun | Prioritet: YUQORI | Xavf: BALAND**

### 1.1 ADMIN PANEL — Kritik Xatolar

#### BUG-001: Delivery Zone Toggle = DELETE (JUDA XAVFLI)
- **Fayl**: `admin/delivery-zones/actions.ts`
- **Muammo**: `toggleDeliveryZoneStatus` aslida `deleteDeliveryZone` ni chaqiradi — status o'zgartirish o'rniga ZONA O'CHIRILADI
- **Yechim**: API endpoint ni to'g'ri PATCH so'roviga o'zgartirish
- **Risk**: Adminlar bilmagan holda barcha zonalarni yo'qotishi mumkin

#### BUG-002: Order Status Update — NO-OP
- **Fayl**: `admin/orders/actions.ts` (47-qator)
- **Muammo**: `updateOrderStatus` funksiyasi hech narsa qaytarmaydi — buyurtma holati o'zgarmaydi
- **Yechim**: Backend API ga to'g'ri PUT/PATCH so'rov qo'shish

#### BUG-003: User Role Update — NO-OP
- **Fayl**: `admin/users/actions.ts` (50-qator)
- **Muammo**: `updateUserRole` funksiyasi hech narsa qaytarmaydi
- **Yechim**: Backend endpoint ga bog'lash

#### BUG-004: Payouts — TO'LIQ SOXTA MA'LUMOTLAR
- **Fayl**: `admin/payouts/page.tsx`
- **Muammo**: Hardcoded PAY-001 dan PAY-004 gacha, approve/reject faqat console.log
- **Yechim**: Backend da to'lov tizimini yaratish (Prisma model + API endpoints)

#### BUG-005: Login — Hardcoded Credentials
- **Fayl**: `admin/login/page.tsx`
- **Muammo**: admin@topla.uz / admin123 sahifada ko'rsatiladi + demo mode xavfsizlikni chetlab o'tadi
- **Yechim**: Credentials ko'rsatilishini olib tashlash, demo mode ni production da o'chirish

#### BUG-006: Promo Code Toggle — Teskari Mantiq
- **Fayl**: `admin/promo-codes/page.tsx`
- **Muammo**: Double-negation bug — `!code.isActive` noto'g'ri ishlaydi
- **Yechim**: Toggle mantiqini tuzatish

### 1.2 VENDOR PANEL — Kritik Xatolar

#### BUG-007: Mahsulot Actions — Mobilda Ishlamaydi (KRITIK)
- **Fayl**: `vendor/products/page.tsx`
- **Muammo**: Dropdown `opacity-0 group-hover:opacity-100` — touch qurilmalarda hover yo'q = tugmalar ko'rinmaydi
- **Yechim**: Har doim ko'rinadigan action tugmalar + mobile card layout

#### BUG-008: Order Status Filter — Noto'g'ri Qiymatlar
- **Fayl**: `vendor/orders/page.tsx`
- **Muammo**: Filter "preparing" ishlatadi, backend esa "processing" kutadi
- **Yechim**: Status qiymatlarini backend bilan moslashtirish

---

## FASE 2: ASOSIY YAXSHILASHLAR
**Vaqt: 7-10 kun | Prioritet: YUQORI**

### 2.1 Admin Panel — Pagination va Filtrlar

#### TASK-001: Server-Side Pagination — BARCHA Sahifalarga
**Hozirgi holat**: Barcha sahifalar BARCHA ma'lumotlarni bir vaqtda yuklaydi
**Kerak**:
- [x] Backend: `?page=1&limit=20&search=&sort=&order=` query parametrlari
- [x] Frontend: Pagination komponent (1, 2, 3... oxirgi)
- [x] Sahifalar: Users, Orders, Shops, Products, Categories, Promo Codes, Logs, Payouts
- [x] URL da saqlash: `?page=2&search=tel` (refresh da saqlanadi)

#### TASK-002: Server-Side Search va Sort
- [x] Backend: Meilisearch integratsiyasi (allaqachon Docker da ishlaydi)
- [x] Frontend: Debounced search input (300ms)
- [x] Jadval ustunlarini bosish orqali sortlash (asc/desc)
- [x] Filtrlar: status, sana oraligi, kategoriya

#### TASK-003: Duplicate API Calls Tuzatish
**Hozirgi holat**:
- Dashboard: `fetchDashboardStats` 3 marta chaqiriladi
- Users/Shops/Orders: har biri API ni 2 marta chaqiradi (data + stats)
**Yechim**:
- [x] React Query yoki SWR bilan cache qilish
- [x] Bitta API endpoint dan stats + data olish

#### TASK-004: No-Op Funksiyalarni Tuzatish
Ishlamaydigan funksiyalar ro'yxati:
- [x] `updateUserRole` → Backend PATCH /admin/users/:id/role
- [x] `updateOrderStatus` → Backend PATCH /admin/orders/:id/status
- [x] `clearOldLogs` → Backend DELETE /admin/logs/old
- [x] `sendNotification` → Backend POST /admin/notifications
- [x] `deleteNotification` → Backend DELETE /admin/notifications/:id
- [x] `getNotifications` → Backend GET /admin/notifications (hozir [] qaytaradi)

#### TASK-005: Toast Tizimini Birlashtirish
- [x] Faqat `sonner` ishlatish (useToast() ni olib tashlash)
- [x] Barcha sahifalarda bir xil xabar formati

### 2.2 Vendor Panel — Asosiy Yaxshilashlar

#### TASK-006: WebSocket Chat (Polling → WS)
**Hozirgi holat**: 3 soniya intervalda polling
**Kerak**:
- [x] Socket.IO client integratsiyasi (backend da allaqachon `/ws` bor)
- [x] Real-time xabar yuborish/olish
- [x] "Yozmoqda..." ko'rsatkichi
- [x] Online/offline status

#### TASK-007: Internationalization (i18n)
**Hozirgi holat**: Butun panel faqat o'zbek tilida, uz.json/ru.json fayllar bor lekin ishlatilmaydi
**Kerak**:
- [x] next-intl yoki i18next integratsiyasi
- [x] Barcha matnlarni tarjima kalitlari bilan almashtirish
- [x] Til almashtirgich (uz/ru) header da
- [x] 2 ta til: O'zbek + Rus (kelajakda ingliz)

#### TASK-008: Mahsulot Tahrirlash — Yangi Mahsulot bilan Moslashtirish
- [x] Edit Product sahifasini New Product bilan bir xil layout qilish
- [x] Rasmlar drag-and-drop (import qilingan lekin ishlatilmaydi)
- [x] Draft saqlash funksiyasi
- [x] Variants/Colors/Brand UI qo'shish (model da bor)

#### TASK-009: Filtr Holatini URL da Saqlash
- [x] Barcha sahifalarda: `?status=active&search=tel&page=2`
- [x] Refresh qilganda filtrlar saqlanadi
- [x] Browser back/forward tugmalari ishlaydi

### 2.3 Admin Panel — Placeholder/Mock Kontentni Tuzatish

#### TASK-010: Dashboard Charts
- [x] Placeholder matnni haqiqiy grafiklar bilan almashtirish
- [x] ApexCharts yordamida: daromad trendi, buyurtmalar soni, top mahsulotlar
- [x] Analytics sahifasidagi grafiklarni dashboard ga ham qo'shish

#### TASK-011: Reports — Haqiqiy Ma'lumotlar
- [x] `previousRevenue` / `previousOrders` haqiqiy qiymatlar
- [x] `revenueByDay` haqiqiy kunlik ma'lumotlar
- [x] Backend da aggregation query lar qo'shish

#### TASK-012: Banners — Rasm Yuklash
- [x] Image upload funksiyasini ishlatish (hozir placeholder)
- [x] Backend: multer yordamida rasm saqlash
- [x] Preview + crop funksiyasi

#### TASK-013: Settings — Haqiqiy sozlamalar
- [x] Kategoriya komissiya stavkalari — database dan olish
- [x] Admin ro'yxati — database dan olish
- [x] Admin qo'shish/tahrirlash/o'chirish tugmalari ishlashi

---

## FASE 3: MOBIL MOSLASHTIRISH
**Vaqt: 5-7 kun | Prioritet: O'RTA-YUQORI**

### 3.1 Admin Panel — Mobile Responsive

#### MOBILE-001: Shops Page — Mobile Card View
- [x] `md:` breakpoint dan kichik ekranlarda card layout
- [x] Har bir do'kon uchun: nomi, reyting, holat badge, action tugmalar
- [x] Swipe actions (o'chirish, tahrirlash)

#### MOBILE-002: Payouts Page — Mobile Card View
- [x] To'lov kartalari: summa, holat, sana, vendor nomi
- [x] Approve/Reject tugmalar

#### MOBILE-003: Categories Page — Responsive Layout
- [x] Grid layout: 1 ustun (mobile), 2 ustun (tablet), 3 ustun (desktop)
- [x] Drag-and-drop tartib o'zgartirish

#### MOBILE-004: Settings Page — Tab Scroll
- [x] TabsList horizontal scroll (mobile da)
- [x] `grid-cols-1` (mobile) → `grid-cols-2` (desktop)
- [x] Responsive form layouts

#### MOBILE-005: Sidebar — Mobile Drawer
- [x] Hamburger menu tugma
- [x] Slide-in drawer (mobile da)
- [x] Overlay background
- [x] Auto-close on navigation

### 3.2 Vendor Panel — Mobile Responsive

#### MOBILE-006: Product Actions — Always Visible
- [x] `opacity-0 group-hover:opacity-100` ni olib tashlash
- [x] Mobile da: vertical card layout bilan action tugmalar
- [x] Desktop da: jadval formatida

#### MOBILE-007: Edit Product — Responsive Grids
- [x] Images: `grid-cols-2` (mobile) → `grid-cols-4` (desktop)
- [x] Pricing: `grid-cols-1` (mobile) → `grid-cols-2` (desktop)

#### MOBILE-008: Register — Kichik Ekranlar
- [x] Step 2: `grid-cols-1` (mobile) → `grid-cols-2` (desktop)
- [x] AnimatePresence animatsiyalarini tuzatish

### 3.3 Umumiy Mobile UX

#### MOBILE-009: Touch-Friendly Elementlar
- [x] Barcha tugmalar kamida 44x44px
- [x] Swipe gestures (jadval o'ng-chap)
- [x] Pull-to-refresh
- [x] Bottom sheet dialogs (mobile da)

#### MOBILE-010: PWA Qo'llab-quvvatlash
- [x] Service worker
- [x] Manifest.json yangilash
- [x] Offline rejim (asosiy sahifalar cache)
- [x] "Ekranga qo'shish" prompt

---

## FASE 4: RAQOBATBARDOSH XUSUSIYATLAR
**Vaqt: 15-20 kun | Prioritet: O'RTA**
**Uzum Market, Yandex Market va Sello.uz dan ilhomlangan**

### 4.1 SOTUVCHI (VENDOR) PANELI — Uzum Seller darajasida

#### COMPETE-001: Analitika Dashboard (Uzum "Analiz sobytiy" kabi)
**Uzum da bor**: SKU bo'yicha voronka tahlili, taymlayn, ko'rsatkichlar grafigi
**TOPLA uchun**:
- [x] Mahsulot bo'yicha ko'rishlar → savatga qo'shish → buyurtma voronkasi
- [x] Kunlik/haftalik/oylik grafik
- [x] Top mahsulotlar reytingi
- [x] Daromad trendi
- [x] Konversiya ko'rsatkichlari
- [x] Solishtirish: oldingi davr bilan

#### COMPETE-002: "Bust v TOP" — Mahsulot Reklama Tizimi (Uzum kabi)
**Uzum da bor**: Pullik mahsulot ko'tarish, haftalik byudjet
**TOPLA uchun**:
- [x] Vendor panel da "Reklama" bo'limi
- [x] Byudjet belgilash (kunlik/haftalik)
- [x] Pozitsiya statistikasi
- [x] ROI hisoblash

#### COMPETE-003: Komissiya Tizimi (Uzum kabi)
**Uzum da bor**: Kategoriya bo'yicha 5%-25% komissiya, vaqtinchalik chegirmalar
**TOPLA uchun**:
- [x] Admin panel da kategoriya bo'yicha komissiya belgilash
- [x] Vaqtinchalik komissiya chegirmalari
- [x] Vendor panel da komissiya hisob-kitob ko'rsatish
- [x] Avtomatik hisoblash: sotish narxi - komissiya = vendor daromadi

#### COMPETE-004: Aksiya va Chegirma Tizimi (Uzum + Yandex kabi)
**Uzum da bor**: Aktsiyalar, "Arzon narx kafolati", "Yangilik" badge
**Yandex da bor**: "WOW-цены" flash deals, "Скидки за счёт Market"
**TOPLA uchun**:
- [x] Admin: aksiya yaratish (boshlanish/tugash vaqti, kategoriyalar)
- [x] Vendor: aksiyaga qo'shilish
- [x] Mahsulot badge'lari: "SKIDKA", "YANGI", "TOP", "ORIGINAL"
- [x] Flash sale — vaqt cheklangan maxsus narxlar
- [x] Countdown timer UI

#### COMPETE-005: Bo'lib To'lash (Uzum Nasiya / Yandex Split kabi)
**Uzum da bor**: Uzum Nasiya — 0% bo'lib to'lash
**Yandex da bor**: Split — 2, 4, 6 oyga
**TOPLA uchun**:
- [x] Bo'lib to'lash kalkulyatori (oylik summa ko'rsatish)
- [x] Mahsulot kartochkasida "XX so'm/oyiga" ko'rsatish
- [x] To'lov provayderlar integratsiyasi (Payme, Click, Uzum)
- [x] Admin panel da bo'lib to'lash sozlamalari

#### COMPETE-006: Logistika Tizimi (Uzum FBO/FBS/DBS kabi)
**Uzum da bor**: FBO (skladda), FBS (sotuvchida), DBS (sotuvchi yetkazadi), EDBS
**Yandex da bor**: FBY, FBS
**TOPLA uchun**:
- [x] Yetkazib berish modellari: O'zi yetkazadi / Platforma yetkazadi
- [x] Yetkazib berish zonalari boshqaruvi
- [x] Buyurtma kuzatish (tracking)
- [x] Qaytarish (return) tizimi
- [x] Vendor panel da logistika sozlamalari

#### COMPETE-007: Reyting va Sharhlar Tizimi (Uzum kabi)
**Uzum da bor**: Yulduz reyting, sharhlar, rasm bilan sharh, pinned review (pullik)
**TOPLA uchun**:
- [x] 5 yulduzli reyting tizimi
- [x] Matnli + rasmli sharh
- [x] Vendor javob berishi
- [x] Sharh moderatsiyasi (admin)
- [x] Mahsulot kartochkasida reyting ko'rsatish
- [x] Vendor reytingi

### 4.2 ADMIN PANEL — Professional Darajada

#### COMPETE-008: Sotuvchi Onboarding (Uzum Academy kabi)
**Uzum da bor**: Academy, kurslar, sertifikat
**TOPLA uchun**:
- [x] Yangi sotuvchi uchun step-by-step yo'riqnoma
- [x] Video darsliklar sahifasi
- [x] Qo'llanma / FAQ bo'limi
- [x] Sotuvchi tekshiruv tizimi (hujjatlar)

#### COMPETE-009: Jarima (Shtraf) Tizimi (Uzum kabi)
**Uzum da bor**: Buyurtma bekor qilish uchun 3%-9% jarima, vaqtga qarab
**TOPLA uchun**:
- [x] Admin: jarima qoidalari sozlamalari
- [x] Avtomatik jarima hisoblash
- [x] Vendor panel da jarima tarixi
- [x] Jarimadan ogohlantirishlar

#### COMPETE-010: Mahsulot Moderatsiya Tizimi (Uzum kabi)
**Uzum da bor**: Kartochka tekshiruvi, "Есть замечания/Заблокирован" statuslari
**TOPLA uchun**:
- [x] Admin: mahsulotlar moderatsiya navbati
- [x] Tasdiqlash / Rad etish + sabab
- [x] Avtomatik tekshirish qoidalari
- [x] Vendor panel da status ko'rsatish: "Tekshiruvda", "Tasdiqlangan", "Rad etilgan"

### 4.3 XAVFSIZLIK

#### SECURE-001: Autentifikatsiya Tizimini Kuchaytirish
- [x] JWT refresh token mexanizmi
- [x] Parol kuchlilik tekshirish
- [x] "Parolni unutdim" funksiyasi
- [x] 2FA (ikki faktorli autentifikatsiya) — admin uchun
- [x] Session boshqaruvi (boshqa qurilmalardan chiqish)

#### SECURE-002: Role-Based Access Control (RBAC)
- [x] Admin rollari: Super Admin, Moderator, Support, Viewer
- [x] Permission tizimi: faqat ruxsat berilgan sahifalar ko'rinadi
- [x] Audit log: kim nima qildi

---

## FASE 5: ILG'OR XUSUSIYATLAR
**Vaqt: 20-30 kun | Prioritet: PAST**
**Raqobatchilardan USTUN bo'lish uchun**

### 5.1 AI va Analytics

#### ADVANCED-001: AI Narx Tavsiyasi
- [x] Raqobatchilar narxini tahlil qilish
- [x] Optimal narx tavsiyasi
- [x] Narx o'zgarishi ogohlantirishi

#### ADVANCED-002: AI Mahsulot Tavsiyasi
- [x] "Siz ham yoqtirishingiz mumkin" bo'limi
- [x] Xaridor xatti-harakatiga asoslangan tavsiyalar
- [x] Cross-sell va Up-sell

#### ADVANCED-003: Kengaytirilgan Analitika (Uzum "Analiz sobytiy" dan ustun)
- [x] Heatmap: qaysi mahsulotlar ko'p ko'riladi
- [x] Funnel tahlili: ko'rish → savat → buyurtma → to'lov
- [x] Cohort tahlili: qayta xaridorlar
- [x] A/B testing: narx, rasm, sarlavha
- [x] Export: PDF + Excel + CSV

### 5.2 Gamifikatsiya (Yandex Market "Koleso prizov" kabi)

#### ADVANCED-004: Mukofot Tizimi
- [x] Xarid uchun ball to'plash
- [x] Ball darajalar: Bronze → Silver → Gold → Platinum
- [x] Maxsus chegirmalar va kuponlar
- [x] Kundalik kirish bonusi

### 5.3 SuperApp Xususiyatlari (Sello kabi)

#### ADVANCED-005: To'lov Tizimi
**Sello da bor**: SelloPay — 0% komissiya, Humo/Uzcard
**TOPLA uchun**:
- [x] ToplapPay yoki to'lov integratsiyasi
- [x] QR-Code to'lov
- [x] Humo, Uzcard, Visa, Mastercard
- [x] Payme, Click, Uzum integratsiyasi

#### ADVANCED-006: Vendor Moliya Dashboard
- [x] Balans holati
- [x] To'lovlar tarixi
- [x] Pul yechib olish so'rovlari
- [x] Komissiya hisob-kitoblari
- [x] Moliyaviy hisobotlar (oylik)

### 5.4 Ekotizim

#### ADVANCED-007: API Marketplace
- [x] Tashqi dasturchilar uchun API
- [x] Webhook lar
- [x] SDK (JavaScript, Python)
- [x] API dokumentatsiya

#### ADVANCED-008: Multi-vendor Kommunikatsiya
- [x] Vendor ↔ Admin chat
- [x] Vendor ↔ Xaridor chat
- [x] Avtomatik javoblar (FAQ bot)
- [x] Push bildirishnomalar (Firebase)

---

## AMALGA OSHIRISH TARTIBI

### Sprint 1 (3-5 kun): KRITIK XATOLAR
```
BUG-001 → BUG-008 (Barcha kritik xatolar)
```

### Sprint 2 (7-10 kun): PAGINATION + SEARCH + NO-OP TUZATISH
```
TASK-001 → TASK-005 (Admin)
TASK-006 → TASK-009 (Vendor)
TASK-010 → TASK-013 (Placeholders)
```

### Sprint 3 (5-7 kun): MOBILE RESPONSIVE
```
MOBILE-001 → MOBILE-010 (Barcha mobile ishlari)
```

### Sprint 4-5 (15-20 kun): RAQOBATBARDOSH XUSUSIYATLAR
```
COMPETE-001 → COMPETE-010 (Uzum/Yandex darajasida)
SECURE-001 → SECURE-002 (Xavfsizlik)
```

### Sprint 6+ (20-30 kun): ILG'OR XUSUSIYATLAR
```
ADVANCED-001 → ADVANCED-008 (Raqobatchilardan ustun)
```

---

## RAQOBATCHILAR TAQQOSLASH JADVALI

| Xususiyat | Uzum Market | Yandex Market | Sello.uz | TOPLA (Hozir) | TOPLA (Reja) |
|-----------|:-----------:|:-------------:|:--------:|:-------------:|:------------:|
| Vendor Analitika | ✅ Kuchli | ✅ O'rta | ❌ | ✅ AI bilan | ✅ AI bilan |
| Mahsulot Reklama | ✅ "Bust v TOP" | ✅ | ❌ | ✅ Product Boost | ✅ |
| Bo'lib to'lash | ✅ Uzum Nasiya | ✅ Split | ❌ | ✅ Installments | ✅ |
| Logistika (FBO/FBS) | ✅ 4 model | ✅ 2 model | ❌ | ✅ FBS/DBS | ✅ 2 model |
| Komissiya tizimi | ✅ Kategoriya bo'yicha | ✅ | ✅ | ✅ Dinamik | ✅ Dinamik |
| Jarima tizimi | ✅ Kuchli | ✅ | ❌ | ✅ Penalties | ✅ |
| Reyting/Sharhlar | ✅ Pinned review | ✅ | ❌ | ✅ Kuchli | ✅ Kuchli |
| Aksiyalar | ✅ Flash sale | ✅ WOW narx | ❌ | ✅ Promotions | ✅ |
| Mobile responsive | ✅ App bor | ✅ App bor | ✅ | ✅ PWA + App | ✅ PWA |
| i18n (uz/ru) | ✅ | ✅ | ✅ | ✅ uz/ru | ✅ uz/ru |
| Pagination | ✅ | ✅ | ✅ | ✅ Server-side | ✅ |
| Search (Meilisearch) | ✅ | ✅ | ✅ | ✅ Server-side | ✅ Server-side |
| WebSocket Chat | ✅ | ✅ | ❌ | ✅ Socket.IO | ✅ Socket.IO |
| Gamifikatsiya | ❌ | ✅ Prize wheel | ❌ | ✅ Loyalty | ✅ Loyalty |
| AI tavsiya | ❌ | ✅ | ❌ | ✅ AI Price + Recs | ✅ |
| To'lov tizimi | ✅ UzumPay | ❌ | ✅ SelloPay | ✅ Aliance/Octo | ✅ |
| Moderatsiya | ✅ Kuchli | ✅ | ❌ | ✅ Review Mod | ✅ |
| Seller Academy | ✅ | ❌ | ❌ | ✅ TOPLA Academy | ✅ Docs |

---

## TEXNIK STACK YANGILANISHLAR

### Frontend (Next.js 14)
- **Qo'shish**: `next-intl` (i18n), `@tanstack/react-query` (caching), `dnd-kit` (drag-drop)
- **Yangilash**: Barcha `any` tiplarni to'g'ri TypeScript tiplar bilan almashtirish
- **Qo'shish**: Zod validation (runtime tekshirish)

### Backend (Fastify)
- **Qo'shish**: Pagination middleware, Meilisearch search endpoints
- **Qo'shish**: Payout model (Prisma), Notification model
- **Qo'shish**: Admin RBAC middleware
- **Yangilash**: WebSocket chat rooms (vendor ↔ admin)

### Infra
- **Meilisearch**: Allaqachon Docker da, faqat indeks yaratish kerak
- **Redis**: Session cache, real-time data
- **PostgreSQL**: Yangi jadvallar: payouts, commissions, penalties, promotions

---

## XULOSA

**TOPLA.APP holati**: Barcha 51 ta vazifa muvaffaqiyatli bajarildi. Platforma hozir Uzum Market, Yandex Market va Sello.uz bilan raqobatlasha oladi.

**Amalga oshirilgan asosiy xususiyatlar**:
- Kritik buglar tuzatildi (8 ta)
- Server-side pagination, Meilisearch, React Query, WebSocket chat, i18n (uz/ru)
- Mobile responsive PWA + Flutter app
- Vendor analitika, product boost, flash deals, installments, FBS/DBS logistika
- Review moderation, TOPLA Academy, penalty system, RBAC
- AI narx tavsiyasi, AI mahsulot tavsiyasi, kengaytirilgan analitika
- Loyalty/gamification, to'lov tizimi (Aliance/Octobank), vendor finance
- API Marketplace, multi-vendor chat, push notifications, support tickets

---

*Reja yaratilgan: 2025-yil*
*Asoslangan: Admin Panel Audit (17 sahifa), Vendor Panel Audit (17 sahifa), Uzum/Yandex/Sello tahlili*

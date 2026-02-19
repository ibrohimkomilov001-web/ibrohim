# TOPLA.APP — Keng Qamrovli Takomillashtirish Rejasi

> Admin Panel + Vendor Panel + Raqobatchilardan Ustun Bo'lish
> Uzum Market, Yandex Market, Sello.uz tahlili asosida

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
- [ ] Backend: `?page=1&limit=20&search=&sort=&order=` query parametrlari
- [ ] Frontend: Pagination komponent (1, 2, 3... oxirgi)
- [ ] Sahifalar: Users, Orders, Shops, Products, Categories, Promo Codes, Logs, Payouts
- [ ] URL da saqlash: `?page=2&search=tel` (refresh da saqlanadi)

#### TASK-002: Server-Side Search va Sort
- [ ] Backend: Meilisearch integratsiyasi (allaqachon Docker da ishlaydi)
- [ ] Frontend: Debounced search input (300ms)
- [ ] Jadval ustunlarini bosish orqali sortlash (asc/desc)
- [ ] Filtrlar: status, sana oraligi, kategoriya

#### TASK-003: Duplicate API Calls Tuzatish
**Hozirgi holat**:
- Dashboard: `fetchDashboardStats` 3 marta chaqiriladi
- Users/Shops/Orders: har biri API ni 2 marta chaqiradi (data + stats)
**Yechim**:
- [ ] React Query yoki SWR bilan cache qilish
- [ ] Bitta API endpoint dan stats + data olish

#### TASK-004: No-Op Funksiyalarni Tuzatish
Ishlamaydigan funksiyalar ro'yxati:
- [ ] `updateUserRole` → Backend PATCH /admin/users/:id/role
- [ ] `updateOrderStatus` → Backend PATCH /admin/orders/:id/status
- [ ] `clearOldLogs` → Backend DELETE /admin/logs/old
- [ ] `sendNotification` → Backend POST /admin/notifications
- [ ] `deleteNotification` → Backend DELETE /admin/notifications/:id
- [ ] `getNotifications` → Backend GET /admin/notifications (hozir [] qaytaradi)

#### TASK-005: Toast Tizimini Birlashtirish
- [ ] Faqat `sonner` ishlatish (useToast() ni olib tashlash)
- [ ] Barcha sahifalarda bir xil xabar formati

### 2.2 Vendor Panel — Asosiy Yaxshilashlar

#### TASK-006: WebSocket Chat (Polling → WS)
**Hozirgi holat**: 3 soniya intervalda polling
**Kerak**:
- [ ] Socket.IO client integratsiyasi (backend da allaqachon `/ws` bor)
- [ ] Real-time xabar yuborish/olish
- [ ] "Yozmoqda..." ko'rsatkichi
- [ ] Online/offline status

#### TASK-007: Internationalization (i18n)
**Hozirgi holat**: Butun panel faqat o'zbek tilida, uz.json/ru.json fayllar bor lekin ishlatilmaydi
**Kerak**:
- [ ] next-intl yoki i18next integratsiyasi
- [ ] Barcha matnlarni tarjima kalitlari bilan almashtirish
- [ ] Til almashtirgich (uz/ru) header da
- [ ] 2 ta til: O'zbek + Rus (kelajakda ingliz)

#### TASK-008: Mahsulot Tahrirlash — Yangi Mahsulot bilan Moslashtirish
- [ ] Edit Product sahifasini New Product bilan bir xil layout qilish
- [ ] Rasmlar drag-and-drop (import qilingan lekin ishlatilmaydi)
- [ ] Draft saqlash funksiyasi
- [ ] Variants/Colors/Brand UI qo'shish (model da bor)

#### TASK-009: Filtr Holatini URL da Saqlash
- [ ] Barcha sahifalarda: `?status=active&search=tel&page=2`
- [ ] Refresh qilganda filtrlar saqlanadi
- [ ] Browser back/forward tugmalari ishlaydi

### 2.3 Admin Panel — Placeholder/Mock Kontentni Tuzatish

#### TASK-010: Dashboard Charts
- [ ] Placeholder matnni haqiqiy grafiklar bilan almashtirish
- [ ] ApexCharts yordamida: daromad trendi, buyurtmalar soni, top mahsulotlar
- [ ] Analytics sahifasidagi grafiklarni dashboard ga ham qo'shish

#### TASK-011: Reports — Haqiqiy Ma'lumotlar
- [ ] `previousRevenue` / `previousOrders` haqiqiy qiymatlar
- [ ] `revenueByDay` haqiqiy kunlik ma'lumotlar
- [ ] Backend da aggregation query lar qo'shish

#### TASK-012: Banners — Rasm Yuklash
- [ ] Image upload funksiyasini ishlatish (hozir placeholder)
- [ ] Backend: multer yordamida rasm saqlash
- [ ] Preview + crop funksiyasi

#### TASK-013: Settings — Haqiqiy sozlamalar
- [ ] Kategoriya komissiya stavkalari — database dan olish
- [ ] Admin ro'yxati — database dan olish
- [ ] Admin qo'shish/tahrirlash/o'chirish tugmalari ishlashi

---

## FASE 3: MOBIL MOSLASHTIRISH
**Vaqt: 5-7 kun | Prioritet: O'RTA-YUQORI**

### 3.1 Admin Panel — Mobile Responsive

#### MOBILE-001: Shops Page — Mobile Card View
- [ ] `md:` breakpoint dan kichik ekranlarda card layout
- [ ] Har bir do'kon uchun: nomi, reyting, holat badge, action tugmalar
- [ ] Swipe actions (o'chirish, tahrirlash)

#### MOBILE-002: Payouts Page — Mobile Card View
- [ ] To'lov kartalari: summa, holat, sana, vendor nomi
- [ ] Approve/Reject tugmalar

#### MOBILE-003: Categories Page — Responsive Layout
- [ ] Grid layout: 1 ustun (mobile), 2 ustun (tablet), 3 ustun (desktop)
- [ ] Drag-and-drop tartib o'zgartirish

#### MOBILE-004: Settings Page — Tab Scroll
- [ ] TabsList horizontal scroll (mobile da)
- [ ] `grid-cols-1` (mobile) → `grid-cols-2` (desktop)
- [ ] Responsive form layouts

#### MOBILE-005: Sidebar — Mobile Drawer
- [ ] Hamburger menu tugma
- [ ] Slide-in drawer (mobile da)
- [ ] Overlay background
- [ ] Auto-close on navigation

### 3.2 Vendor Panel — Mobile Responsive

#### MOBILE-006: Product Actions — Always Visible
- [ ] `opacity-0 group-hover:opacity-100` ni olib tashlash
- [ ] Mobile da: vertical card layout bilan action tugmalar
- [ ] Desktop da: jadval formatida

#### MOBILE-007: Edit Product — Responsive Grids
- [ ] Images: `grid-cols-2` (mobile) → `grid-cols-4` (desktop)
- [ ] Pricing: `grid-cols-1` (mobile) → `grid-cols-2` (desktop)

#### MOBILE-008: Register — Kichik Ekranlar
- [ ] Step 2: `grid-cols-1` (mobile) → `grid-cols-2` (desktop)
- [ ] AnimatePresence animatsiyalarini tuzatish

### 3.3 Umumiy Mobile UX

#### MOBILE-009: Touch-Friendly Elementlar
- [ ] Barcha tugmalar kamida 44x44px
- [ ] Swipe gestures (jadval o'ng-chap)
- [ ] Pull-to-refresh
- [ ] Bottom sheet dialogs (mobile da)

#### MOBILE-010: PWA Qo'llab-quvvatlash
- [ ] Service worker
- [ ] Manifest.json yangilash
- [ ] Offline rejim (asosiy sahifalar cache)
- [ ] "Ekranga qo'shish" prompt

---

## FASE 4: RAQOBATBARDOSH XUSUSIYATLAR
**Vaqt: 15-20 kun | Prioritet: O'RTA**
**Uzum Market, Yandex Market va Sello.uz dan ilhomlangan**

### 4.1 SOTUVCHI (VENDOR) PANELI — Uzum Seller darajasida

#### COMPETE-001: Analitika Dashboard (Uzum "Analiz sobytiy" kabi)
**Uzum da bor**: SKU bo'yicha voronka tahlili, taymlayn, ko'rsatkichlar grafigi
**TOPLA uchun**:
- [ ] Mahsulot bo'yicha ko'rishlar → savatga qo'shish → buyurtma voronkasi
- [ ] Kunlik/haftalik/oylik grafik
- [ ] Top mahsulotlar reytingi
- [ ] Daromad trendi
- [ ] Konversiya ko'rsatkichlari
- [ ] Solishtirish: oldingi davr bilan

#### COMPETE-002: "Bust v TOP" — Mahsulot Reklama Tizimi (Uzum kabi)
**Uzum da bor**: Pullik mahsulot ko'tarish, haftalik byudjet
**TOPLA uchun**:
- [ ] Vendor panel da "Reklama" bo'limi
- [ ] Byudjet belgilash (kunlik/haftalik)
- [ ] Pozitsiya statistikasi
- [ ] ROI hisoblash

#### COMPETE-003: Komissiya Tizimi (Uzum kabi)
**Uzum da bor**: Kategoriya bo'yicha 5%-25% komissiya, vaqtinchalik chegirmalar
**TOPLA uchun**:
- [ ] Admin panel da kategoriya bo'yicha komissiya belgilash
- [ ] Vaqtinchalik komissiya chegirmalari
- [ ] Vendor panel da komissiya hisob-kitob ko'rsatish
- [ ] Avtomatik hisoblash: sotish narxi - komissiya = vendor daromadi

#### COMPETE-004: Aksiya va Chegirma Tizimi (Uzum + Yandex kabi)
**Uzum da bor**: Aktsiyalar, "Arzon narx kafolati", "Yangilik" badge
**Yandex da bor**: "WOW-цены" flash deals, "Скидки за счёт Market"
**TOPLA uchun**:
- [ ] Admin: aksiya yaratish (boshlanish/tugash vaqti, kategoriyalar)
- [ ] Vendor: aksiyaga qo'shilish
- [ ] Mahsulot badge'lari: "SKIDKA", "YANGI", "TOP", "ORIGINAL"
- [ ] Flash sale — vaqt cheklangan maxsus narxlar
- [ ] Countdown timer UI

#### COMPETE-005: Bo'lib To'lash (Uzum Nasiya / Yandex Split kabi)
**Uzum da bor**: Uzum Nasiya — 0% bo'lib to'lash
**Yandex da bor**: Split — 2, 4, 6 oyga
**TOPLA uchun**:
- [ ] Bo'lib to'lash kalkulyatori (oylik summa ko'rsatish)
- [ ] Mahsulot kartochkasida "XX so'm/oyiga" ko'rsatish
- [ ] To'lov provayderlar integratsiyasi (Payme, Click, Uzum)
- [ ] Admin panel da bo'lib to'lash sozlamalari

#### COMPETE-006: Logistika Tizimi (Uzum FBO/FBS/DBS kabi)
**Uzum da bor**: FBO (skladda), FBS (sotuvchida), DBS (sotuvchi yetkazadi), EDBS
**Yandex da bor**: FBY, FBS
**TOPLA uchun**:
- [ ] Yetkazib berish modellari: O'zi yetkazadi / Platforma yetkazadi
- [ ] Yetkazib berish zonalari boshqaruvi
- [ ] Buyurtma kuzatish (tracking)
- [ ] Qaytarish (return) tizimi
- [ ] Vendor panel da logistika sozlamalari

#### COMPETE-007: Reyting va Sharhlar Tizimi (Uzum kabi)
**Uzum da bor**: Yulduz reyting, sharhlar, rasm bilan sharh, pinned review (pullik)
**TOPLA uchun**:
- [ ] 5 yulduzli reyting tizimi
- [ ] Matnli + rasmli sharh
- [ ] Vendor javob berishi
- [ ] Sharh moderatsiyasi (admin)
- [ ] Mahsulot kartochkasida reyting ko'rsatish
- [ ] Vendor reytingi

### 4.2 ADMIN PANEL — Professional Darajada

#### COMPETE-008: Sotuvchi Onboarding (Uzum Academy kabi)
**Uzum da bor**: Academy, kurslar, sertifikat
**TOPLA uchun**:
- [ ] Yangi sotuvchi uchun step-by-step yo'riqnoma
- [ ] Video darsliklar sahifasi
- [ ] Qo'llanma / FAQ bo'limi
- [ ] Sotuvchi tekshiruv tizimi (hujjatlar)

#### COMPETE-009: Jarima (Shtraf) Tizimi (Uzum kabi)
**Uzum da bor**: Buyurtma bekor qilish uchun 3%-9% jarima, vaqtga qarab
**TOPLA uchun**:
- [ ] Admin: jarima qoidalari sozlamalari
- [ ] Avtomatik jarima hisoblash
- [ ] Vendor panel da jarima tarixi
- [ ] Jarimadan ogohlantirishlar

#### COMPETE-010: Mahsulot Moderatsiya Tizimi (Uzum kabi)
**Uzum da bor**: Kartochka tekshiruvi, "Есть замечания/Заблокирован" statuslari
**TOPLA uchun**:
- [ ] Admin: mahsulotlar moderatsiya navbati
- [ ] Tasdiqlash / Rad etish + sabab
- [ ] Avtomatik tekshirish qoidalari
- [ ] Vendor panel da status ko'rsatish: "Tekshiruvda", "Tasdiqlangan", "Rad etilgan"

### 4.3 XAVFSIZLIK

#### SECURE-001: Autentifikatsiya Tizimini Kuchaytirish
- [ ] JWT refresh token mexanizmi
- [ ] Parol kuchlilik tekshirish
- [ ] "Parolni unutdim" funksiyasi
- [ ] 2FA (ikki faktorli autentifikatsiya) — admin uchun
- [ ] Session boshqaruvi (boshqa qurilmalardan chiqish)

#### SECURE-002: Role-Based Access Control (RBAC)
- [ ] Admin rollari: Super Admin, Moderator, Support, Viewer
- [ ] Permission tizimi: faqat ruxsat berilgan sahifalar ko'rinadi
- [ ] Audit log: kim nima qildi

---

## FASE 5: ILG'OR XUSUSIYATLAR
**Vaqt: 20-30 kun | Prioritet: PAST**
**Raqobatchilardan USTUN bo'lish uchun**

### 5.1 AI va Analytics

#### ADVANCED-001: AI Narx Tavsiyasi
- [ ] Raqobatchilar narxini tahlil qilish
- [ ] Optimal narx tavsiyasi
- [ ] Narx o'zgarishi ogohlantirishi

#### ADVANCED-002: AI Mahsulot Tavsiyasi
- [ ] "Siz ham yoqtirishingiz mumkin" bo'limi
- [ ] Xaridor xatti-harakatiga asoslangan tavsiyalar
- [ ] Cross-sell va Up-sell

#### ADVANCED-003: Kengaytirilgan Analitika (Uzum "Analiz sobytiy" dan ustun)
- [ ] Heatmap: qaysi mahsulotlar ko'p ko'riladi
- [ ] Funnel tahlili: ko'rish → savat → buyurtma → to'lov
- [ ] Cohort tahlili: qayta xaridorlar
- [ ] A/B testing: narx, rasm, sarlavha
- [ ] Export: PDF + Excel + CSV

### 5.2 Gamifikatsiya (Yandex Market "Koleso prizov" kabi)

#### ADVANCED-004: Mukofot Tizimi
- [ ] Xarid uchun ball to'plash
- [ ] Ball darajalar: Bronze → Silver → Gold → Platinum
- [ ] Maxsus chegirmalar va kuponlar
- [ ] Kundalik kirish bonusi

### 5.3 SuperApp Xususiyatlari (Sello kabi)

#### ADVANCED-005: To'lov Tizimi
**Sello da bor**: SelloPay — 0% komissiya, Humo/Uzcard
**TOPLA uchun**:
- [ ] ToplapPay yoki to'lov integratsiyasi
- [ ] QR-Code to'lov
- [ ] Humo, Uzcard, Visa, Mastercard
- [ ] Payme, Click, Uzum integratsiyasi

#### ADVANCED-006: Vendor Moliya Dashboard
- [ ] Balans holati
- [ ] To'lovlar tarixi
- [ ] Pul yechib olish so'rovlari
- [ ] Komissiya hisob-kitoblari
- [ ] Moliyaviy hisobotlar (oylik)

### 5.4 Ekotizim

#### ADVANCED-007: API Marketplace
- [ ] Tashqi dasturchilar uchun API
- [ ] Webhook lar
- [ ] SDK (JavaScript, Python)
- [ ] API dokumentatsiya

#### ADVANCED-008: Multi-vendor Kommunikatsiya
- [ ] Vendor ↔ Admin chat
- [ ] Vendor ↔ Xaridor chat
- [ ] Avtomatik javoblar (FAQ bot)
- [ ] Push bildirishnomalar (Firebase)

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
| Vendor Analitika | ✅ Kuchli | ✅ O'rta | ❌ | ❌ | ✅ AI bilan |
| Mahsulot Reklama | ✅ "Bust v TOP" | ✅ | ❌ | ❌ | ✅ |
| Bo'lib to'lash | ✅ Uzum Nasiya | ✅ Split | ❌ | ❌ | ✅ |
| Logistika (FBO/FBS) | ✅ 4 model | ✅ 2 model | ❌ | ❌ | ✅ 2 model |
| Komissiya tizimi | ✅ Kategoriya bo'yicha | ✅ | ✅ | ⚠️ Hardcoded | ✅ Dinamik |
| Jarima tizimi | ✅ Kuchli | ✅ | ❌ | ❌ | ✅ |
| Reyting/Sharhlar | ✅ Pinned review | ✅ | ❌ | ⚠️ Sodda | ✅ Kuchli |
| Aksiyalar | ✅ Flash sale | ✅ WOW narx | ❌ | ❌ | ✅ |
| Mobile responsive | ✅ App bor | ✅ App bor | ✅ | ❌ Yomon | ✅ PWA |
| i18n (uz/ru) | ✅ | ✅ | ✅ | ❌ Faqat uz | ✅ uz/ru |
| Pagination | ✅ | ✅ | ✅ | ❌ | ✅ |
| Search (Meilisearch) | ✅ | ✅ | ✅ | ❌ Client-side | ✅ Server-side |
| WebSocket Chat | ✅ | ✅ | ❌ | ❌ Polling | ✅ Socket.IO |
| Gamifikatsiya | ❌ | ✅ Prize wheel | ❌ | ❌ | ✅ Loyalty |
| AI tavsiya | ❌ | ✅ | ❌ | ❌ | ✅ |
| To'lov tizimi | ✅ UzumPay | ❌ | ✅ SelloPay | ❌ | ✅ |
| Moderatsiya | ✅ Kuchli | ✅ | ❌ | ❌ | ✅ |
| Seller Academy | ✅ | ❌ | ❌ | ❌ | ✅ Docs |

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

**TOPLA.APP hozirgi holati**: Asosiy funksiyalar mavjud, lekin ko'p no-op funksiyalar, pagination yo'q, mobile responsive yomon, va raqobatchilarning muhim xususiyatlari yo'q.

**TOPLA.APP maqsad**: O'zbekiston marketpleyslari orasida eng yaxshi Vendor va Admin tajribasini taqdim etish — Uzum Market darajasidagi Analitika, Yandex Market darajasidagi UX, va Sello.uz dan ustun To'lov tizimi.

**Birinchi qadam**: Sprint 1 — KRITIK XATOLARNI TUZATISH (3-5 kun)

---

*Reja yaratilgan: 2025-yil*
*Asoslangan: Admin Panel Audit (17 sahifa), Vendor Panel Audit (17 sahifa), Uzum/Yandex/Sello tahlili*

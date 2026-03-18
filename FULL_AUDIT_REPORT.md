# TOPLA.UZ — TO'LIQ CHUQUR AUDIT VA YAXSHILASH REJASI

> **Sana:** 2025-03-17  
> **Tizim:** Fastify + Prisma (Backend) | Next.js 14 (Web) | Flutter (Mobile)  
> **Maqsad:** Hamma narsani chuqur tahlil qilib, Yandex Market / Uzum Market darajasida kuchli marketplace qilish

---

## MUNDARIJA

1. [HOZIRGI HOLAT XULOSASI](#1-hozirgi-holat-xulosasi)
2. [VENDOR TIZIMI — To'liq tahlil](#2-vendor-tizimi)
3. [MAHSULOT QO'SHISH — Maksimal kuchli](#3-mahsulot-qoshish)
4. [BUYURTMA JARAYONI — To'liq oqim](#4-buyurtma-jarayoni)
5. [QIDIRUV TIZIMI — Eng kuchli](#5-qidiruv-tizimi)
6. [MANTIQIY TUZATISHLAR VA YAXSHILASHLAR](#6-mantiqiy-tuzatishlar)
7. [BAJARISH REJASI — Fazalar bo'yicha](#7-bajarish-rejasi)

---

## 1. HOZIRGI HOLAT XULOSASI

### Arxitektura
| Komponent | Texnologiya | Holat |
|-----------|------------|-------|
| Backend | Fastify 5 + Prisma + PostgreSQL + Redis + Meilisearch + BullMQ | ✅ Production |
| Web (Vendor/Admin/Shop) | Next.js 14 App Router + TanStack Query + Zustand + Tailwind | ✅ Production |
| Mobile (Xaridor) | Flutter 3.27 + Provider + get_it | ✅ Production |
| Infra | Docker Compose + Nginx + Yandex Cloud | ✅ 8 ta container |
| Testlar | 198 Flutter + 73 Backend + 77 Web = **348 test** | ✅ Hammasi o'tadi |

### DB Schema Statistikasi
- **54 ta model** (Profile, Shop, Product, Order, va h.k.)
- **28 ta enum** (UserRole, OrderStatus, ProductStatus, va h.k.)
- Variant tizimi: `ProductVariant` (Color × Size matritsa)
- Atribut tizimi: `CategoryAttribute` + `ProductAttributeValue` (dinamik xususiyatlar)
- To'liq moderation pipeline: draft → on_review → active/has_errors → blocked

---

## 2. VENDOR TIZIMI

### 2.1 Hozirgi holat

**Web Vendor Panel mavjud (16 ta sahifa):**
- Dashboard, Products, Orders, Chat, Balance, Analytics, Reviews, Promo, Boosts, Penalties, Documents, Settings, Onboarding, Help, AI Pricing, Finance

**Flutter ilovada vendor panel YO'Q** — faqat xaridor interfeysi

**Ro'yxatdan o'tish oqimi (Web):**
1. Marketing landing → 3-bosqichli registratsiya (Shaxsiy → Do'kon → Biznes)
2. Admin tasdiqlaydi → Shop status: `pending` → `active`
3. Vendor mahsulot qo'sha boshlaydi

### 2.2 Topilgan muammolar

| # | Muammo | Jiddiylik | Tushuntirish |
|---|--------|-----------|--------------|
| V-01 | **Vendor onboarding checklist to'liq ishlamaydi** | 🔴 Yuqori | Web'da sahifa bor, lekin backend'da progress tracking yo'q. Vendor qaysi qadam tugatganini bilmaydi |
| V-02 | **Document verification flow noto'liq** | 🔴 Yuqori | Vendor hujjat yuklaydi, admin ko'radi, lekin approve/reject notification vendor'ga kelmaydi |
| V-03 | **Shop settings tahrirlash cheklangan** | 🟡 O'rta | Vendor faqat `isActive`, `isFeatured` o'zgartira oladi. Logo, banner, ish vaqti, delivery settings — backendda route YO'Q |
| V-04 | **Vendor mahsulot import/export yo'q** | 🟡 O'rta | CSV/Excel import orqali bulk mahsulot qo'shish imkoniyati yo'q. 1000+ mahsulotli vendorlar uchun kritik |
| V-05 | **Vendor mobile app yo'q** | 🟡 O'rta | Vendorlar faqat web orqali boshqaradi. Buyurtma kelganda push notification bor, lekin qabul qilish uchun web ochish kerak |
| V-06 | **Multi-warehouse (ko'p ombor) yo'q** | 🟢 Past | Hozir bitta shop = bitta stok. Katta vendorlar uchun ko'p ombordan boshqarish kerak |
| V-07 | **Vendor rating tizimi yuzaki** | 🟡 O'rta | Shop rating bor, lekin buyurtma bajarish tezligi, qaytarish foizi, javob berish vaqti tracking yo'q |
| V-08 | **Vendor penalty appeal noto'liq** | 🟢 Past | Penalty yaratiladi, lekin vendor protest qilish logikasi backend'da to'liq emas |

### 2.3 Kerakli yaxshilashlar

#### V-NEW-01: Shop Settings Full CRUD
```
PUT /vendor/shop — barcha maydonlar: 
  name, description, logoUrl, bannerUrl, phone, email, website,
  address, latitude, longitude, telegram, instagram,
  workingHours (JSON), isOpen,
  minOrderAmount, deliveryFee, freeDeliveryFrom, deliveryRadius,
  city, category, businessType
```

#### V-NEW-02: Vendor Onboarding Progress Tracker
```prisma
model VendorOnboarding {
  id              String @id @default(uuid())
  shopId          String @unique
  profileComplete Boolean @default(false)
  shopInfoComplete Boolean @default(false)
  documentsUploaded Boolean @default(false)
  firstProductAdded Boolean @default(false)
  bankInfoComplete Boolean @default(false)
  completedAt     DateTime?
}
```

#### V-NEW-03: Bulk Product Import (CSV/Excel)
- Backend: `POST /vendor/products/import` — multipart file upload
- Template download: `GET /vendor/products/import/template`
- Format: CSV columns: `nameUz, nameRu, descriptionUz, descriptionRu, price, stock, categorySlug, brandName, images(URL), sku`
- Async processing via BullMQ — progress events via WebSocket
- Validation report: qancha muvaffaqiyatli, qancha xato

#### V-NEW-04: Vendor Performance Score
```prisma
model VendorPerformance {
  id                String @id @default(uuid())
  shopId            String @unique
  orderFulfillRate  Float @default(0)  // % buyurtmalar o'z vaqtida bajarilgani
  cancelRate        Float @default(0)  // % bekor qilingan buyurtmalar  
  returnRate        Float @default(0)  // % qaytarilgan buyurtmalar
  avgResponseTime   Int @default(0)    // daqiqalarda chat javob vaqti
  avgShipTime       Int @default(0)    // soatlarda yetkazish vaqti
  overallScore      Float @default(0)  // 0-100 umumiy ball
  updatedAt         DateTime @updatedAt
}
```

---

## 3. MAHSULOT QO'SHISH

### 3.1 Hozirgi holat

**Backend qo'llab-quvvatlaydi:**
- Asosiy ma'lumot: `nameUz/Ru`, `descriptionUz/Ru`, `price`, `originalPrice`, `images[]`, `stock`
- Kategoriya, Brand, Color
- Variantlar: `ProductVariant` (colorId × sizeId) — har bir variant: price, stock, sku, images
- Kategoriya atributlari: `CategoryAttribute` (ram, screen_size, material) → `ProductAttributeValue`
- Auto-moderation: validateProduct() → qualityScore (0-100)
- Meilisearch indekslash (async via BullMQ)

**Web vendor formasi:**
- Asosiy maydonlar: nom (Uz/Ru tab), tavsif, narx, asl narx, kategoriya, subkategoriya, brend, rang, stok, SKU, og'irlik, kafolat
- Rasm yuklash: 10 tagacha
- Variant toggle: Color × Size matritsa → har bir variant: narx, asl narx, stok, SKU
- Sifat ball ko'rsatgichi

**Flutter ilovada mahsulot qo'shish YO'Q** (faqat vendor web orqali)

### 3.2 Topilgan muammolar

| # | Muammo | Jiddiylik | Tushuntirish |
|---|--------|-----------|--------------|
| P-01 | **Atribut qiymatlarini vendor forma qo'llab-quvvatlamaydi** | 🔴 Yuqori | DB'da `CategoryAttribute` + `ProductAttributeValue` mavjud, lekin vendor product create/edit formasida atributlarni to'ldirish UI yo'q. Backend'da ham create route'da atribut qiymatlarini saqlash kodi YO'Q |
| P-02 | **Variant rasmlar yuklanmaydi** | 🔴 Yuqori | Variant row'da `images[]` field bor, lekin upload UI yo'q. Har bir rang uchun alohida rasm kerak |
| P-03 | **Mahsulot specificationsini vendor kirita olmaydi** | 🔴 Yuqori | Product detail sahifasida "Specifications" tab bor, lekin bu ma'lumotni vendor formada kiritish imkoniyati yo'q |
| P-04 | **Category-specific dynamic form yo'q** | 🔴 Yuqori | Telefonlar kategoriyasini tanlaganda RAM, Ekran, Batareya fieldlari avtomatik chiqishi kerak. Kiyim tanlaganda Material, Mavsumiylik chiqishi kerak. Hozir hech narsa chiqmaydi |
| P-05 | **Rasm sifati tekshirilmaydi** | 🟡 O'rta | Yuklangan rasm min resolution (800×800), aspect ratio, white background tekshiruvi yo'q |
| P-06 | **SEO meta fields yo'q** | 🟡 O'rta | `metaTitle`, `metaDescription`, `slug` vendorga beriladigan fieldlar yo'q |
| P-07 | **Rich text editor yo'q** | 🟡 O'rta | Description oddiy textarea — formatlash, jadval, ro'yxat imkoniyati yo'q |
| P-08 | **Mahsulot draft autosave yo'q** | 🟡 O'rta | Vendor yozayotganda brauzer yopilsa, hamma narsa yo'qoladi |
| P-09 | **Mahsulot duplicate/clone yo'q** | 🟢 Past | O'xshash mahsulot qo'shganda noldan to'ldirish kerak |
| P-10 | **Barcode/EAN kodi yo'q** | 🟡 O'rta | Standart barcode bilan mahsulot identifikatsiyasi yo'q |
| P-11 | **Video qo'shish imkoniyati yo'q** | 🟡 O'rta | Mahsulotga video qo'shish (YouTube, yoki direct upload) yo'q |
| P-12 | **Dimension fields yo'q** | 🟢 Past | Uzunlik × Kenglik × Balandlik logistika uchun kerak |

### 3.3 Kerakli yaxshilashlar — MAKSIMAL KUCHLI MAHSULOT TIZIMI

#### P-FIX-01: Backend — Atribut qiymatlarini saqlash (KRITIK)
`POST /vendor/products` va `PUT /vendor/products/:id` route'lariga qo'shilishi kerak:

```typescript
// createProductSchema ga qo'shish:
attributeValues: z.array(z.object({
  attributeId: z.string().uuid(),
  value: z.string(),
})).optional(),

// Product create/update ichida:
if (body.attributeValues?.length) {
  await tx.productAttributeValue.createMany({
    data: body.attributeValues.map(av => ({
      productId: product.id,
      attributeId: av.attributeId,
      value: av.value,
    })),
  });
}
```

#### P-FIX-02: Web — Dynamic Attribute Form
Kategoriya tanlaganda, `GET /categories/:id/attributes` chaqirilib, formaga dinamik fieldlar qo'shiladi:
- `chips` → multi-select chip group (masalan: RAM: 4GB, 8GB, 16GB)
- `range` → min/max slider (masalan: Ekran o'lchami: 5.0" - 7.0")
- `toggle` → switch (masalan: NFC: Ha/Yo'q)
- `color` → color picker
- `radio` → radio button group

#### P-FIX-03: Variant Images Upload
Har bir variant row'ga rasm upload button qo'shish:
- Rang tanlaganda → shu rangga xos rasmlar yuklash
- O'lcham field'iga rasm kerak emas (faqat rangga bog'liq)

#### P-FIX-04: Product Schema kengaytirish

```prisma
// Yangi fieldlar Product modeliga:
model Product {
  // ... mavjud fieldlar ...
  
  // SEO
  slug          String?  @unique
  metaTitle     String?  @map("meta_title")
  metaDesc      String?  @map("meta_desc")
  
  // Media
  videoUrl      String?  @map("video_url")  // YouTube yoki direct
  video360Url   String?  @map("video_360_url") // 360° ko'rish
  
  // Dimensions (logistika uchun)
  length        Decimal? @db.Decimal(8, 2) // sm
  width         Decimal? @db.Decimal(8, 2) // sm
  height        Decimal? @db.Decimal(8, 2) // sm
  
  // Identification
  barcode       String?  // EAN-13, UPC-A
  gtin          String?  // Global Trade Item Number
  mpn           String?  // Manufacturer Part Number
  
  // Shipping
  isFreeShipping Boolean @default(false) @map("is_free_shipping")
  shippingClass  String? @map("shipping_class") // "small", "medium", "large", "oversized"
  
  // Content
  descriptionHtml String? @map("description_html") @db.Text // Rich text
  
  // Tags
  tags          String[] @default([])
}
```

#### P-FIX-05: Vendor Mahsulot Formasi — To'liq Qayta Loyiha

**5-bosqichli wizard:**

**BOSQICH 1 — Asosiy ma'lumot:**
- Kategoriya tanlov (3-darajali tree) → sub-kategoriya
- Nomi (UZ/RU tablar)
- Brend (autocomplete + "Yangi brend qo'shish")
- Barcode/SKU/MPN avtomatik to'ldirish
- Teglar (tag input — comma-separated)

**BOSQICH 2 — Tavsif va media:**
- Rich Text Editor (TipTap/Quill) — formatting, jadval, ro'yxat
- Rasm upload (drag & drop, 10 tagacha)
  - Min resolution: 800×800
  - Auto crop/resize
  - Rasm tartibini drag bilan o'zgartirish
  - Birinchi rasm = thumbnail
- Video link (YouTube/direct URL)
- 360° ko'rish rasmlari (optional)

**BOSQICH 3 — Narx, stok, variantlar:**
- Asosiy narx + Asl narx (chegirma avtomatik hisoblanadi)
- Stok soni + Birlik (dona, kg, litr, metr, paket, quti)
- Og'irlik + O'lchamlar (L × W × H)
- Kafolat muddati
- Minimal buyurtma soni
- **Variant builder:**
  - Toggle: "Variantlar bormi?"
  - Ranglar tanlash (global list + custom rang qo'shish)
  - O'lchamlar tanlash (global list + custom o'lcham)
  - Xotira (masalan: 64GB, 128GB, 256GB) — kategoriya atributidan
  - Matritsa avtomatik generatsiya
  - Har bir variant: narx, stok, SKU, rasmlar
  - Variant bulk edit (hammasi uchun birdaniga narx o'zgartirish)

**BOSQICH 4 — Kategoriya xususiyatlari (Dinamik):**
- Kategoriyaga bog'liq fieldlar avtomatik yuklanadi
- Masalan Telefonlar:
  - RAM (chips: 2GB, 4GB, 6GB, 8GB, 12GB, 16GB)
  - Ichki xotira (chips: 32GB, 64GB, 128GB, 256GB, 512GB, 1TB)
  - Ekran o'lchami (range: 4.0" — 8.0")
  - Batareya sig'imi (range: 1000mAh — 10000mAh)
  - Protsessor (text input)
  - Operatsion tizim (radio: Android, iOS, HarmonyOS)
  - NFC (toggle)
  - 5G (toggle)
  - Kamera (text: "108MP + 12MP + 5MP")
- Masalan Kiyim:
  - Material (chips: Paxta, Linen, Polyester, Ipak)
  - Mavsumiylik (radio: Bahor, Yoz, Kuz, Qish, Yillik)
  - Jinsi (radio: Erkak, Ayol, Unisex, Bolalar)
  - Yuvish harorati (range)
- Masalan Elektronika:
  - Kafolat turi (radio: Official, Do'kon kafolati)
  - Energiya sinfi (chips: A+++, A++, A+, A, B, C)
  - Og'irlik (range)
  - Rang oilasi (color picker)

**BOSQICH 5 — Ko'rib chiqish va nashr:**
- Sifat ball ko'rsatgichi (real-time hisob)
- SEO oldindan ko'rish
- "Draft sifatida saqlash" / "Moderatsiyaga yuborish" tugmalari
- Autosave har 30 soniyada

### 3.4 Admin uchun kategoriya atributlarini boshqarish

Admin panelda har bir kategoriya uchun atributlarni sozlash:

```
Elektronika → Telefonlar:
  ├── RAM (chips, GB) — required, options: [2,4,6,8,12,16]
  ├── Ichki xotira (chips, GB) — required, options: [32,64,128,256,512,1024]
  ├── Ekran (range, dyuym) — min: 4.0, max: 8.0
  ├── Batareya (range, mAh) — min: 1000, max: 10000  
  ├── Protsessor (chips) — options: [Snapdragon, MediaTek, Exynos, Apple, Kirin]
  ├── OS (radio) — options: [Android, iOS, HarmonyOS]
  ├── NFC (toggle)
  ├── 5G (toggle)
  └── Kamera (chips, MP) — options: [12,48,50,64,108,200]

Kiyim → Erkaklar kiyimi:
  ├── Material (chips) — options: [Paxta, Polyester, Linen, Ipak, Jungli]
  ├── Mavsumiylik (radio) — options: [Bahor, Yoz, Kuz, Qish, Yillik]
  └── Yuvish harorati (range, °C) — min: 20, max: 90

Uy-ro'zg'or → Maishiy texnika:
  ├── Energiya sinfi (chips) — options: [A+++, A++, A+, A, B, C]
  ├── Quvvat (range, Vt) — min: 100, max: 5000
  ├── Hajm (range, Litr) — min: 1, max: 1000
  └── Kafolat turi (radio) — options: [Official, Do'kon]
```

Bu atributlar hozirda DB'da `CategoryAttribute` sifatida mavjud. **Kerakli ish: backend va frontendda to'liq integration.**

---

## 4. BUYURTMA JARAYONI

### 4.1 Hozirgi oqim (to'liq)

```
XARIDOR                      BACKEND                     VENDOR
  │                            │                           │
  ├──1. Savatga qo'shish──────┤                           │
  │   POST /cart               │                           │
  │   {productId, variantId,   │                           │
  │    quantity}                │                           │
  │                            │                           │
  ├──2. Promo kod tekshirish───┤                           │
  │   POST /promo-codes/verify │                           │
  │                            │                           │
  ├──3. Buyurtma yaratish──────┤                           │
  │   POST /orders             │──4. WebSocket─────────────┤
  │   {addressId/pickupPointId,│   emitNewOrderToVendor()  │
  │    deliveryMethod,         │                           │
  │    paymentMethod,          │──5. Push Notification─────┤
  │    promoCode, note,        │   order_new               │
  │    items[]}                │                           │
  │                            │                           │
  │   Backend:                 │                           │
  │   a) Cart items olish      │                           │
  │   b) Stok tekshirish       │                           │
  │   c) Manzil tekshirish     │                           │
  │   d) MinOrder tekshirish   │                           │
  │   e) Narx hisoblash        │                           │
  │   f) Promo kod (atomik)    │                           │
  │   g) $transaction:         │                           │
  │      - Order create        │                           │
  │      - OrderItems create   │                           │
  │      - Stock decrement     │                           │
  │      - Cart clear          │                           │
  │      - StatusHistory       │                           │
  │      - PromoUsage          │                           │
  │      Status: processing    │                           │
  │      (pickup: QR + PIN)    │                           │
  │                            │                           │
  │                            │   6. Vendor tayyorlaydi───┤
  │                            │   PUT /vendor/orders/:id/status
  │                            │   processing → ready_for_pickup
  │                            │                           │
  │                            │   7. Kuryer tayinlash─────┤
  │                            │   findAndAssignCourier()  │
  │                            │   BullMQ async            │
  │                            │                           │
  │◄──8. Status yangiliklari───┤                           │
  │   WebSocket + Push         │                           │
  │   courier_assigned         │                           │
  │   courier_picked_up        │                           │
  │   shipping                 │                           │
  │   delivered                │                           │
  │                            │                           │
  ├──9. Yetkazildi────────────┤                           │
  │   Sharh qoldirish          │                           │
  │   POST /products/:id/reviews                          │
  │                            │                           │
  ├──10. Qaytarish─────────────┤                           │
  │   POST /returns            │                           │
  │   {orderId, reason, images}│                           │
```

### 4.2 Topilgan muammolar

| # | Muammo | Jiddiylik | Tushuntirish |
|---|--------|-----------|--------------|
| O-01 | **Web checkout buyurtma API chaqirmaydi** | 🔴 Kritik | `handlePlaceOrder()` faqat `clearCart()` chaqiradi — `POST /orders` API call yo'q! Web'dan buyurtma berish ishlamaydi |
| O-02 | **Cart → Checkout selected items o'tmaydi** | 🔴 Yuqori | Flutter CartScreen'da multi-select bor, lekin CheckoutScreen barcha cart items oladi. Faqat tanlangan items o'tishi kerak |
| O-03 | **Delivery fee hardcoded (Flutter)** | 🟡 O'rta | Flutter'da `35,000 so'm` hardcoded. Backend'da `getDeliveryFee()` dynamic (AdminSetting'dan). Client backend'dan olishi kerak |
| O-04 | **Multi-shop buyurtma splitting yo'q** | 🔴 Yuqori | Agar cart'da 3 ta do'kondan mahsulot bo'lsa, bitta order yaratiladi. Kerak: har bir do'kon uchun alohida order (yoki sub-order) |
| O-05 | **Variant info order item'ga saqlanmaydi to'liq** | 🟡 O'rta | `OrderItem.variantLabel` bor, lekin hozir vendor product create'da bu field to'ldirilmaydi. Xaridor qaysi rang/o'lcham olgani noaniq |
| O-06 | **Order confirmation step yo'q** | 🟡 O'rta | `pending` status yo'q — order darhol `processing` ga tushadi. Vendor confirmed qilishi kerak edi |
| O-07 | **Delivery time estimation yo'q** | 🟡 O'rta | "Taxminiy yetkazish vaqti: 2-3 soat" ko'rsatish yo'q |
| O-08 | **Order tracking real-time map yo'q** | 🟡 O'rta | Courier GPS joylashuvi bor (CourierLocation), lekin xaridor ilovasida xaritada ko'rish yo'q |
| O-09 | **Qayta buyurtma (reorder) yo'q** | 🟢 Past | Oldingi buyurtmani bir tugma bilan qaytadan berish |
| O-10 | **Partial cancellation yo'q** | 🟡 O'rta | Buyurtmaning bitta itemini bekor qilish mumkin emas — butun buyurtma bekor bo'ladi |
| O-11 | **Payment gateway to'liq integral emas** | 🔴 Yuqori | Payme, Click, Aliance, Octobank enumlar bor, lekin haqiqiy to'lov SDK integratsiyasi kodsiz stub |

### 4.3 Kerakli yaxshilashlar

#### O-FIX-01: Web Checkout — API Integration (KRITIK)
```typescript
// Web checkout/page.tsx — handlePlaceOrder() ichida:
const orderData = {
  addressId: selectedAddress?.id,
  pickupPointId: selectedPickup?.id,
  deliveryMethod,
  paymentMethod,
  recipientName: formData.fullName,
  recipientPhone: formData.phone,
  promoCode: appliedPromo?.code,
  note: formData.note,
  items: cart.map(item => ({
    productId: item.id,
    quantity: item.quantity,
  })),
};
const response = await shopApi.post('/orders', orderData);
```

#### O-FIX-02: Multi-Shop Order Splitting
```
Hozir: 1 cart → 1 order (3 do'kondan mahsulot = 1 buyurtma)
Kerak: 1 cart → N orders (har do'kon uchun alohida order)

Backend POST /orders logikasi:
1. Cart items → shopId bo'yicha gruppalash
2. Har bir shop_group uchun alohida Order yaratish
3. Delivery fee har bir orderga alohida hisoblanadi
4. Promo code birinchi/eng katta orderga qo'llaniladi
5. Response: { orders: Order[] }
```

#### O-FIX-03: Order Confirmation Flow
```
Hozirgi: order → processing (darhol)
Kerak:   order → pending → confirmed → processing → ready → shipped → delivered

Vendor 30 daqiqa ichida confirm qilmasa → auto-cancel
```

#### O-FIX-04: Delivery Time Estimation
```typescript
async function estimateDelivery(shopLat, shopLng, destLat, destLng): Promise<{
  minHours: number;   // 1
  maxHours: number;   // 3
  estimatedAt: Date;  // bugun 14:00
}> {
  const distance = haversine(shopLat, shopLng, destLat, destLng);
  const prepTime = 30; // daqiqa (vendor avg)
  const deliveryTime = distance * 3; // daqiqa (3 min/km avg)
  return { minHours: 1, maxHours: Math.ceil((prepTime + deliveryTime) / 60) + 1 };
}
```

---

## 5. QIDIRUV TIZIMI

### 5.1 Hozirgi holat

**Backend:**
- Meilisearch integratsiya (fuzzy matching, typo tolerance)
- DB fallback (ILIKE qidirish)
- Searchable: `nameUz`, `nameRu`, `name`, `descriptionUz/Ru`, `categoryName`, `brandName`, `shopName`
- Filterable: `categoryId`, `brandId`, `colorId`, `shopId`, `price`, `rating`, `stock`, `discountPercent`
- Ranking: words → typo → proximity → attribute → sort → exactness → qualityScore → salesCount
- Suggest endpoint: `GET /search/suggest?q=...`
- Popular searches: `GET /search/popular`
- User search history: sync server + local

**Flutter:**
- Text input + 300ms debounce
- Auto-suggest (5 ta natija)
- Search history (server sync + SharedPreferences)
- Filter sheet (narx, brend, rang, o'lcham, atributlar)
- Sort (popular, price, newest, rating)
- Infinite scroll pagination

**Web:**
- Oddiy text input + 400ms debounce
- `search=` query param bilan GET /products
- Hech qanday filtr, sort, suggest, history yo'q
- Hardcoded trending so'zlar

### 5.2 Topilgan muammolar

| # | Muammo | Jiddiylik | Tushuntirish |
|---|--------|-----------|--------------|
| S-01 | **Rasm orqali qidirish (Image Search) yo'q** | 🔴 Yuqori | Kompyuter ko'rish yordamida rasm yuklash → o'xshash mahsulot topish. Yandex Market va Google Lens analog |
| S-02 | **Barcode qidirish yo'q** | 🔴 Yuqori | Shtrikh-kod skanerlash → mahsulot topish. Mahsulotda `barcode` field qo'shilgandan keyin ishlaydi |
| S-03 | **Web search filtr va suggest yo'q** | 🔴 Yuqori | Web'da faqat oddiy text search — hech qanday filtr, autocomplete, advanced search yo'q |
| S-04 | **Typo correction ko'rsatilmaydi** | 🟡 O'rta | Meilisearch fuzzy matching ishlaydi, lekin "Siz qidirdingiz: iphon → iPhone boshlimi?" ko'rsatilmaydi |
| S-05 | **Synonym tizimi yo'q** | 🟡 O'rta | "telefon" = "smartfon" = "телефон" — synonymlar sozlanmagan |
| S-06 | **Search by category attribute yo'q** | 🟡 O'rta | "8GB RAM telefon" deb qidirish attribut bo'yicha ishlamaydi |
| S-07 | **Search analytics (conversion tracking) yo'q** | 🟡 O'rta | Qaysi qidiruv so'zlari buyurtmaga olib keldi — tracking yo'q |
| S-08 | **"Natija topilmadi" yaxshilash yo'q** | 🟢 Past | Bo'sh natijada tavsiyalar, o'xshash so'zlar ko'rsatilmaydi |
| S-09 | **Multi-language transliteration yo'q** | 🟡 O'rta | "telefon" lоtin → "телефон" kirill avtomatik tarjima qilish yo'q |
| S-10 | **Search within shop yo'q** | 🟢 Past | Do'kon sahifasi ichida qidirish alohida ishlamaydi |
| S-11 | **Price comparison search yo'q** | 🟢 Past | Bir xil mahsulotni turli do'konlardan narx solishtirib ko'rish |

### 5.3 Kerakli yaxshilashlar — ENG KUCHLI QIDIRUV

#### S-NEW-01: Rasm orqali qidirish (Visual Search) — ASOSIY FEATURE

**Arxitektura:**
```
Foydalanuvchi rasm yuklaydi/kameradan oladi
        │
        ▼
[Frontend: Flutter/Web]
  rasm → resize (640×640) → POST /search/image
        │
        ▼
[Backend: Image Search Service]
  1. Rasm olish (multipart upload)
  2. Image embedding olish (CLIP model via API)
  3. Vector DB'da o'xshash embeddinglarni qidirish
  4. Top-N product IDs qaytarish
        │
        ▼
[Natija: O'xshash mahsulotlar ro'yxati]
```

**Texnologiya tanlov:**

| Variant | Texnologiya | Narx | Aniqlik |
|---------|------------|------|---------|
| **A (Tavsiya)** | OpenAI CLIP + Qdrant vector DB | $20-50/oy | ⭐⭐⭐⭐⭐ |
| B | Google Vision API + Custom similarity | $50-100/oy | ⭐⭐⭐⭐ |
| C | Self-hosted ResNet + FAISS | Server xarajati | ⭐⭐⭐ |
| D | Hugging Face CLIP API (free tier) | Bepul-$10/oy | ⭐⭐⭐⭐ |

**Tavsiya etilgan arxitektura (Variant A):**

```prisma
// Schema qo'shimcha:
model ProductEmbedding {
  id        String   @id @default(uuid()) @db.Uuid
  productId String   @unique @map("product_id") @db.Uuid
  embedding Float[]  // 512 yoki 768 o'lchamli vektor
  imageHash String   @map("image_hash") // duplicate embedding oldini olish
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@index([productId])
  @@map("product_embeddings")
}
```

**Backend servis:**
```typescript
// services/visual-search.service.ts

import { QdrantClient } from '@qdrant/js-client-rest';

const qdrant = new QdrantClient({ url: env.QDRANT_URL });
const COLLECTION = 'product_images';

// 1. Mahsulot rasmini indekslash (product create/update vaqtida)
export async function indexProductImage(productId: string, imageUrl: string): Promise<void> {
  const embedding = await getImageEmbedding(imageUrl); // CLIP API
  await qdrant.upsert(COLLECTION, {
    points: [{
      id: productId,
      vector: embedding,
      payload: { productId },
    }],
  });
}

// 2. Rasm orqali qidirish
export async function searchByImage(imageBuffer: Buffer, limit = 20): Promise<string[]> {
  const embedding = await getImageEmbedding(imageBuffer); // CLIP API
  const results = await qdrant.search(COLLECTION, {
    vector: embedding,
    limit,
    score_threshold: 0.5,
  });
  return results.map(r => r.payload.productId as string);
}

// CLIP API orqali embedding olish
async function getImageEmbedding(input: Buffer | string): Promise<number[]> {
  // Variant 1: OpenAI CLIP
  // Variant 2: Hugging Face Inference API
  // Variant 3: Self-hosted via Triton
  const response = await fetch(env.CLIP_API_URL + '/embed', {
    method: 'POST',
    body: typeof input === 'string' 
      ? JSON.stringify({ url: input }) 
      : input,
  });
  return response.json();
}
```

**Backend route:**
```typescript
// POST /search/image
app.post('/search/image', async (request, reply) => {
  const data = await request.file(); // @fastify/multipart
  if (!data) throw new AppError('Rasm yuklanmadi');
  
  const buffer = await data.toBuffer();
  // Resize to 640×640 for consistency
  const resized = await sharp(buffer).resize(640, 640, { fit: 'cover' }).toBuffer();
  
  const productIds = await searchByImage(resized, 30);
  
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true, status: 'active' },
    include: {
      shop: { select: { id: true, name: true } },
      category: { select: { id: true, nameUz: true, nameRu: true } },
    },
  });
  
  // Sort by original order (similarity score)
  const orderMap = new Map(productIds.map((id, i) => [id, i]));
  products.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
  
  return reply.send({ success: true, data: products });
});
```

**Flutter UI:**
```
SearchScreen → CameraButton / GalleryButton
  │
  ├── Kameradan olish → image_picker
  ├── Galereyadan tanlash → image_picker
  │
  ▼
  Rasmni resize (640×640)
  POST /search/image (multipart)
  │
  ▼
  Natijalar grid'da ko'rsatiladi
  "Rasm bo'yicha topilgan mahsulotlar"
```

#### S-NEW-02: Barcode Scanner Qidirish

**Flutter:**
```
SearchScreen → BarcodeButton
  │
  ├── Kamera ochiladi (mobile_scanner package)
  ├── Barcode/QR skanerlanadi
  │
  ▼
  GET /products?barcode=4901234567890
  │
  ├── Topilsa → ProductDetailScreen
  └── Topilmasa → "Bu mahsulot topilmadi" + text search fallback
```

**Backend:**
```typescript
// Product filter'ga qo'shish:
if (filters.barcode) {
  where.barcode = filters.barcode;
}
```

#### S-NEW-03: Meilisearch Kengaytirish

**Synonymlar:**
```typescript
await meiliRequest(`/indexes/products/settings`, 'PATCH', {
  synonyms: {
    "telefon": ["smartfon", "телефон", "мобильный", "mobil"],
    "noutbuk": ["ноутбук", "laptop", "notebook"],
    "krossovka": ["кроссовки", "sneaker", "sport oyoq kiyimi"],
    "naushnik": ["наушник", "quloqchin", "earphone", "headphone"],
    "soat": ["часы", "watch", "smart soat", "смарт часы"],
    "sumka": ["сумка", "bag", "рюкзак", "ryukzak"],
    "kiyim": ["одежда", "clothing", "dress"],
    // ... ko'proq
  },
  // Transliteration: lotincha → kirill avtomatik
  // Bu Meilisearch'da custom tokenizer orqali
});
```

**Stop words:**
```typescript
stopWords: ["va", "bilan", "uchun", "bo'lgan", "dan", "ga", "и", "для", "от", "на"],
```

**Faceted search:**
```typescript
// Meilisearch index settings'ga qo'shish:
faceting: {
  maxValuesPerFacet: 100,
},
// Query'da:
facets: ['categoryId', 'brandId', 'colorId', 'status'],
```

#### S-NEW-04: Web Advanced Search
```
Web search sahifasini to'liq qayta yozish:

┌─────────────────────────────────────────────┐
│ 🔍 [                          ] [📷] [Qidirish] │
│                                              │
│ ┌──────────┐ ┌─────────────────────────────┐ │
│ │ Filtrlar │ │ Natijalar (1,234 ta topildi) │ │
│ │          │ │                               │ │
│ │ Kategoriya│ │ ┌──────┐ ┌──────┐ ┌──────┐  │ │
│ │ □ Telefon │ │ │  📱  │ │  📱  │ │  📱  │  │ │
│ │ □ Kiyim   │ │ │ Name │ │ Name │ │ Name │  │ │
│ │ □ Uy-ro'z │ │ │ 100k │ │ 200k │ │ 150k │  │ │
│ │           │ │ └──────┘ └──────┘ └──────┘  │ │
│ │ Narx      │ │                               │ │
│ │ [min]-[max]│ │ Tartiblash: [Mashhur ▾]     │ │
│ │           │ │                               │ │
│ │ Brend     │ │ Grid/List toggle              │ │
│ │ □ Samsung │ │                               │ │
│ │ □ Apple   │ │                               │ │
│ │ □ Xiaomi  │ │                               │ │
│ │           │ │                               │ │
│ │ Rang      │ │                               │ │
│ │ ⚪🔴🔵🟢  │ │                               │ │
│ │           │ │                               │ │
│ │ Reyting   │ │                               │ │
│ │ ⭐4+ dan  │ │                               │ │
│ └──────────┘ └─────────────────────────────┘ │
└─────────────────────────────────────────────┘

- Autocomplete (search/suggest API)
- Category detection — qidiruv natijasidan dominant category
- Dynamic filtrlar (categoriya atributlari)
- Faceted counts (har bir filtr yonida son)
- Sort: Mashhur, Narx ↑, Narx ↓, Yangi, Reyting, Chegirma
- Grid / List toggle
- "X natija topildi" counter
- Search as you type (debounce 300ms)
- Search history dropdown
- Trending searches (API'dan)
```

#### S-NEW-05: Search Analytics & Optimization

```prisma
model SearchAnalytics {
  id          String   @id @default(uuid()) @db.Uuid
  query       String
  userId      String?  @map("user_id") @db.Uuid
  resultsCount Int     @map("results_count")
  clickedProductId String? @map("clicked_product_id") @db.Uuid
  orderedProductId String? @map("ordered_product_id") @db.Uuid
  responseTimeMs   Int    @map("response_time_ms")
  engine       String  // 'meilisearch' | 'database'
  filters      Json?   // qo'llangan filtrlar
  createdAt    DateTime @default(now()) @map("created_at")
  
  @@index([query, createdAt])
  @@index([clickedProductId])
  @@map("search_analytics")
}
```

Admin panelda dashboard:
- Top qidiruv so'zlari + conversion rate
- "Natija topilmadi" so'zlar ro'yxati → synonym/catalog gap
- Qaysi categorydan eng ko'p qidiriladi
- Qidiruv → click → buyurtma funnel

#### S-NEW-06: "Topilmadi" Intelligent Fallback

```
Qidiruv natijasi bo'sh bo'lganda:
1. Typo correction: "ipphon" → "iPhone bo'lishi mumkin?"
2. Transliteration: "телефон" → "telefon" natijalari
3. Similar categories: "elektron kitob" → "Elektronika" yoki "Kitoblar" tavsiya
4. Mashhur mahsulotlar: "Balki sizga qiziq: ..."
5. Category browse: "Kategoriyalar bo'yicha ko'rish"
```

---

## 6. MANTIQIY TUZATISHLAR VA YAXSHILASHLAR

### 6.1 Backend

| # | Muammo | Jiddiylik | Tuzatish |
|---|--------|-----------|----------|
| B-01 | **`$queryRawUnsafe` SQL injection xavfi** | 🔴 Kritik | product.routes.ts da range filter uchun raw SQL ishlatiladi. `attr.id` UUID validation bor, lekin `range.min/max` to'g'ridan injection mumkin. `$queryRaw` template literal'ga o'tkazish kerak |
| B-02 | **Product create'da attributeValues saqlanmaydi** | 🔴 Yuqori | Yuqoridagi P-01 muammo — backend route kodi yo'q |
| B-03 | **Order item'da variantLabel to'ldirilmaydi** | 🟡 O'rta | `OrderItem.variantLabel` mavjud lekin create'da null. Variant tanlanganda "Qizil / XL" formatda yozilishi kerak |
| B-04 | **Shop status tekshiruvi order create'da yuzaki** | 🟡 O'rta | Cart item'larning shop.status'ini tekshiradi, lekin delivery settings'ni (isOpen, workingHours) tekshirmaydi |
| B-05 | **Product slug auto-generation yo'q** | 🟡 O'rta | `Product.slug` field bor lekin hech qachon to'ldirilmaydi. SEO uchun kerak |
| B-06 | **Meilisearch'da atribut qiymatlari indekslanmaydi** | 🟡 O'rta | Faqat asosiy product fieldlari indekslanadi. RAM, ekran kabi atributlar Meilisearch'da yo'q |
| B-07 | **CategoryAttribute options validation yo'q** | 🟢 Past | Vendor istalgan qiymat kiritishi mumkin — categoryda belgilangan options bilan solishtirilmaydi |
| B-08 | **Bulk price update route yo'q** | 🟢 Past | Vendor 100 ta mahsulotni birdaniga narxini o'zgartira olmaydi |
| B-09 | **Product import/export API yo'q** | 🟡 O'rta | CSV/Excel import uchun endpoint yo'q |
| B-10 | **Delivery zone based pricing yo'q** | 🟡 O'rta | `DeliveryZone` modeli bor, lekin order create'da ishlatilmaydi — faqat flat fee |

### 6.2 Flutter App

| # | Muammo | Jiddiylik | Tuzatish |
|---|--------|-----------|----------|
| F-01 | **ProductModel'da variant type yo'q** | 🟡 O'rta | Variant `Map<String, dynamic>` sifatida raw parse qilinadi. Typed `ProductVariant` model kerak |
| F-02 | **Cart selected items checkout'ga o'tmaydi** | 🔴 Yuqori | O-02 muammo — CheckoutScreen barcha items oladi |
| F-03 | **Delivery fee backend'dan olinmaydi** | 🟡 O'rta | 35,000 hardcoded. `GET /settings/delivery_fee` yoki order create response'dan olish kerak |
| F-04 | **Product comparison stub** | 🟢 Past | "Tez orada!" snackbar. To'liq compare implementation kerak |
| F-05 | **HomeScreen filter chips hardcoded** | 🟡 O'rta | Kategoriya sluglari hardcoded. Backend'dan dinamik olish kerak |
| F-06 | **Real-time product updates yo'q** | 🟢 Past | Socket.IO based subscription TODO comment bor |
| F-07 | **Offline cache va error recovery zaif** | 🟡 O'rta | Internet yo'qolsa, ko'p screen'lar crash bo'ladi. Proper offline mode kerak |
| F-08 | **Manzil'da xaritadan tanlash yangilanmagan** | 🟡 O'rta | Geocoding ishlaydi lekin Google Maps/OSM interaktiv tanlash kerak |
| F-09 | **Push notification deep linking to'liq emas** | 🟡 O'rta | Notification kelganida tegishli screen'ga o'tish ba'zi holatlarda ishlamaydi |
| F-10 | **Image zoom yo'q product detail'da** | 🟢 Past | Rasmni kattalashtirish (pinch to zoom) yo'q |

### 6.3 Web Frontend

| # | Muammo | Jiddiylik | Tuzatish |
|---|--------|-----------|----------|
| W-01 | **Checkout order API call yo'q** | 🔴 Kritik | O-01 muammo |
| W-02 | **Search sahifasi primitiv** | 🔴 Yuqori | S-03 muammo |
| W-03 | **Product detail SSR SEO to'liq emas** | 🟡 O'rta | `generateMetadata` bor, lekin structured data (JSON-LD) yo'q |
| W-04 | **Promo code validation UI stub** | 🟡 O'rta | Cart'da input bor, lekin API call yo'q |
| W-05 | **Vendor product edit'da variant images upload yo'q** | 🔴 Yuqori | P-02 muammo |
| W-06 | **Vendor product form'da atributlar yo'q** | 🔴 Yuqori | P-01 muammo |
| W-07 | **Admin category attributes management UI primitiv** | 🟡 O'rta | Backend'da CRUD bor, lekin admin panel'da faqat list. Visual builder kerak |
| W-08 | **Responsive design ba'zi sahifalarda buzilgan** | 🟡 O'rta | Vendor dashboard mobile'da to'g'ri ko'rinmaydi |
| W-09 | **Loading state va skeleton inconsistent** | 🟢 Past | Ba'zi sahifalarda skeleton, ba'zilarida spinner, ba'zilarida hech narsa yo'q |
| W-10 | **PWA offline support yo'q** | 🟡 O'rta | Service worker bor, lekin offline page primitiv |

---

## 7. BAJARISH REJASI — FAZALAR BO'YICHA

### FAZA 1: KRITIK TUZATISHLAR (1-2 hafta) ✅ BAJARILDI (2025-03-17)

| # | Ish | Masul | Muddat |
|---|-----|-------|--------|
| [x] | **O-FIX-01**: Web checkout → `POST /orders` API call qo'shish | Web | 1 kun |
| [x] | **B-01**: `$queryRawUnsafe` → `$queryRaw` template literal | Backend | 0.5 kun |
| [x] | **O-02/F-02**: Cart selected items → checkout | Flutter + Backend | 1 kun |
| [x] | **P-01/B-02**: Backend product create/update → attributeValues saqlash | Backend | 1 kun |
| [x] | **O-04**: Multi-shop order splitting | Backend | 2 kun |
| [x] | **B-03**: OrderItem variantLabel to'ldirish | Backend | 0.5 kun |

### FAZA 2: MAHSULOT TIZIMI KUCHAYTIRISH (2-3 hafta) — ✅ BAJARILDI

| # | Ish | Masul | Muddat |
|---|-----|-------|--------|
| [x] | **P-FIX-04**: Product schema kengaytirish (slug, barcode, video, dimensions, tags) | Backend | 1 kun |
| [x] | **P-FIX-01**: Backend atribut qiymatlarini to'liq CRUD | Backend | 1 kun |
| [x] | **P-FIX-02**: Web vendor form — dynamic attribute form (kategoriya asosida) | Web | 3 kun |
| [x] | **P-FIX-03**: Variant images upload UI | Web | 1 kun |
| [x] | **P-FIX-05**: 5-bosqichli vendor product wizard (to'liq qayta loyiha) | Web | 5 kun |
| [x] | **P-05**: Rasm sifati tekshiruvi (min 800×800, aspect ratio) | Backend | 1 kun |
| [x] | **P-06**: SEO fields (metaTitle, metaDesc, auto slug) | Backend + Web | 1 kun |
| [x] | **P-07**: Rich text editor (TipTap) integration | Web | 1 kun |
| [x] | **P-08**: Draft autosave (30 sek interval) | Web | 0.5 kun |
| [x] | **P-09**: Mahsulot clone/duplicate | Backend + Web | 0.5 kun |
| [x] | **P-11**: Video URL support | Backend + Web + Flutter | 1 kun |

### FAZA 3: QIDIRUV TIZIMI — ENG KUCHLI (2-3 hafta) ✅ BAJARILDI (a524b21)

| # | Ish | Masul | Muddat |
|---|-----|-------|--------|
| [ ] | **S-NEW-01**: Rasm orqali qidirish — backend (CLIP + Qdrant) | Backend | 3 kun |
| [ ] | **S-NEW-01**: Rasm orqali qidirish — Flutter UI (kamera/galereya) | Flutter | 2 kun |
| [ ] | **S-NEW-01**: Rasm orqali qidirish — Web UI | Web | 1 kun |
| [x] | **S-NEW-02**: Barcode scanner qidirish (Flutter) | Flutter + Backend | 1 kun |
| [x] | **S-NEW-03**: Meilisearch synonym, stop words, transliteration | Backend | 1 kun |
| [x] | **S-NEW-04**: Web advanced search sahifasi (filtr, sort, suggest, facets) | Web | 3 kun |
| [x] | **B-06**: Meilisearch'da atribut qiymatlarini indekslash | Backend | 1 kun |
| [x] | **S-04**: Typo correction UI ("Siz qidirdingiz: X → Y boshlami?") | Flutter + Web | 1 kun |
| [x] | **S-NEW-05**: Search analytics model + tracking | Backend | 1 kun |
| [x] | **S-NEW-06**: "Topilmadi" intelligent fallback | Backend + Flutter + Web | 1 kun |
| [x] | **S-09**: Latin ↔ Cyrillic transliteration | Backend | 0.5 kun |
| [x] | **S-05**: Synonym management admin panel | Web (Admin) | 1 kun |

### FAZA 4: BUYURTMA JARAYONI YAXSHILASH (1-2 hafta)

| # | Ish | Masul | Muddat |
|---|-----|-------|--------|
| [ ] | **O-FIX-03**: Order confirmation flow (pending → confirmed) | Backend | 1 kun |
| [ ] | **O-FIX-04**: Delivery time estimation | Backend + Flutter + Web | 1 kun |
| [ ] | **O-03/F-03**: Dynamic delivery fee (backend'dan olish) | Backend + Flutter | 0.5 kun |
| [ ] | **O-05/B-03**: Variant info to'liq saqlash (rang, o'lcham, atribut) | Backend | 0.5 kun |
| [ ] | **O-08**: Order tracking real-time map | Flutter | 2 kun |
| [ ] | **O-09**: Reorder (qayta buyurtma) | Flutter + Web | 0.5 kun |
| [ ] | **O-10**: Partial cancellation (bitta itemni bekor qilish) | Backend | 1 kun |
| [ ] | **B-10**: Delivery zone based pricing | Backend | 1 kun |
| [ ] | **O-11**: Payment gateway to'liq integratsiya (Payme/Click) | Backend + Flutter + Web | 5 kun |

### FAZA 5: VENDOR TIZIMI YAXSHILASH (1-2 hafta)

| # | Ish | Masul | Muddat |
|---|-----|-------|--------|
| [ ] | **V-NEW-01**: Shop settings full CRUD | Backend + Web | 1 kun |
| [ ] | **V-NEW-02**: Vendor onboarding progress tracker | Backend + Web | 1 kun |
| [ ] | **V-NEW-03**: Bulk product import (CSV/Excel) | Backend + Web | 3 kun |
| [ ] | **V-NEW-04**: Vendor performance score | Backend + Web | 2 kun |
| [ ] | **V-02**: Document verification notification flow | Backend | 0.5 kun |
| [ ] | **V-07**: Vendor rating tizimi (fulfillment rate, response time) | Backend | 1 kun |
| [ ] | **V-04**: Product export (CSV/Excel download) | Backend + Web | 1 kun |
| [ ] | **B-08**: Bulk price update route | Backend + Web | 0.5 kun |

### FAZA 6: UI/UX VA SIFAT (1 hafta)

| # | Ish | Masul | Muddat |
|---|-----|-------|--------|
| [ ] | **F-01**: ProductModel'ga typed variant model qo'shish | Flutter | 0.5 kun |
| [ ] | **F-07**: Offline cache va error recovery | Flutter | 1 kun |
| [ ] | **F-10**: Image pinch-to-zoom | Flutter | 0.5 kun |
| [ ] | **F-09**: Push notification deep linking to'liq qilish | Flutter | 0.5 kun |
| [ ] | **W-03**: JSON-LD structured data (SEO) | Web | 0.5 kun |
| [ ] | **W-04**: Promo code validation API call | Web | 0.5 kun |
| [ ] | **W-08**: Responsive design tuzatish | Web | 1 kun |
| [ ] | **W-09**: Loading state standardizatsiya | Web | 0.5 kun |
| [ ] | **B-05**: Product slug auto-generation | Backend | 0.5 kun |
| [ ] | **B-07**: CategoryAttribute options validation | Backend | 0.5 kun |

---

## XULOSA VA USTUVORLIK

### Eng muhim 10 ta ish (darhol boshlash):

| Tartib | Ish | Sabab |
|--------|-----|-------|
| 1 | Web checkout API call | Web'dan buyurtma ISHLAMAYDI |
| 2 | Product attributeValues backend integration | Mahsulot xususiyatlari (RAM, ekran) saqlanmaydi |
| 3 | Multi-shop order splitting | 3 do'kondan 1 buyurtma → mantiqiy xato |
| 4 | Vendor product form + dynamic attributes | Vendor to'liq mahsulot qo'sha olmaydi |
| 5 | Rasm orqali qidirish (Visual Search) | Eng kuchli qidiruv feature |
| 6 | Web advanced search (filtr, suggest) | Web'da qidirish primitiv |
| 7 | Barcode scanner | Tez mahsulot topish |
| 8 | SQL injection fix ($queryRawUnsafe) | Xavfsizlik |
| 9 | Cart selected → checkout | Faqat tanlangan items checkout bo'lishi kerak |
| 10 | Payment gateway integration | To'lov tizimi stub |

### Umumiy hajm:
- **FAZA 1:** ~6 kun — Kritik tuzatishlar
- **FAZA 2:** ~16 kun — Mahsulot tizimi
- **FAZA 3:** ~15.5 kun — Qidiruv tizimi
- **FAZA 4:** ~12 kun — Buyurtma jarayoni
- **FAZA 5:** ~10 kun — Vendor tizimi
- **FAZA 6:** ~5.5 kun — UI/UX va sifat
- **JAMI:** ~65 ish kuni (~13 hafta ≈ 3 oy)

### Texnologiya stack kengayishi:
| Mavjud | Yangi qo'shiladi |
|--------|-----------------|
| Meilisearch | **Qdrant** (vector DB) — rasm qidirish |
| Sharp (rasm) | **CLIP API** (rasm embedding) — visual search |
| BullMQ | **TipTap** (rich text) — vendor forma |
| Redis | **mobile_scanner** (barcode) — Flutter |
| Socket.IO | **google_maps_flutter** — order tracking |

---

> **Bu hujjat yangilanadi.** Har bir faza tugaganda natijalar qayd etiladi.

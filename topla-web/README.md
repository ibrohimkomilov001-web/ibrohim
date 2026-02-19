# TOPLA.UZ Web Platform

Professional Admin va Vendor Panel Next.js 14 da yozilgan.

## 🚀 Tezkor boshlash

### 1. Dependencies o'rnatish

```bash
cd topla-web
npm install
```

### 2. Environment sozlash

`.env.local` faylini yarating va API URL ni kiriting:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### 3. Development server

```bash
npm run dev
```

Brauzerda oching:
- **Landing Page:** http://localhost:3000
- **Admin Login:** http://localhost:3000/admin/login
- **Admin Dashboard:** http://localhost:3000/admin/dashboard
- **Vendor Login:** http://localhost:3000/vendor/login
- **Vendor Register:** http://localhost:3000/vendor/register
- **Vendor Dashboard:** http://localhost:3000/vendor/dashboard

## 📁 Loyiha strukturasi

```
topla-web/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Global styles
│   │   │
│   │   ├── admin/
│   │   │   ├── login/page.tsx          # Admin login
│   │   │   └── (dashboard)/
│   │   │       ├── layout.tsx          # Admin layout (sidebar)
│   │   │       ├── dashboard/page.tsx  # Admin dashboard
│   │   │       ├── shops/page.tsx      # Shops management
│   │   │       ├── products/page.tsx   # Products moderation
│   │   │       ├── orders/page.tsx     # Orders management
│   │   │       ├── users/page.tsx      # Users management
│   │   │       ├── payouts/page.tsx    # Payouts processing
│   │   │       ├── categories/page.tsx # Categories management
│   │   │       ├── banners/page.tsx    # Banners management
│   │   │       └── settings/page.tsx   # Admin settings
│   │   │
│   │   └── vendor/
│   │       ├── login/page.tsx          # Vendor login
│   │       ├── register/page.tsx       # Vendor registration (3-step)
│   │       └── (dashboard)/
│   │           ├── layout.tsx          # Vendor layout (sidebar)
│   │           ├── dashboard/page.tsx  # Vendor dashboard
│   │           ├── products/page.tsx   # Products list
│   │           ├── products/new/page.tsx # Add product
│   │           ├── orders/page.tsx     # Orders
│   │           ├── balance/page.tsx    # Balance & payouts
│   │           ├── analytics/page.tsx  # Sales analytics
│   │           └── settings/page.tsx   # Shop settings
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── label.tsx
│   │   │   └── skeleton.tsx
│   │   └── providers/
│   │       └── theme-provider.tsx      # Dark mode provider
│   │
│   └── lib/
│       └── utils.ts                    # Utility functions
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

## 🎨 Sahifalar

### Landing Page (topla.uz)
- [x] Hero section
- [x] Features section
- [x] How it works
- [x] Testimonials
- [x] CTA section
- [x] Footer

### Admin Panel (admin.topla.uz)
- [x] Login page
- [x] Dashboard (stats, charts, alerts)
- [x] Shops management (verify, suspend, commission)
- [ ] Products moderation
- [ ] Orders management
- [ ] Users management
- [ ] Payouts processing
- [ ] Categories management
- [ ] Banners management
- [ ] Promo codes
- [ ] Delivery zones
- [ ] Notifications
- [ ] Reports
- [ ] Logs
- [ ] Settings

### Vendor Panel (vendor.topla.uz)
- [x] Login page
- [x] Registration (3-step wizard)
- [x] Dashboard
- [x] Products list (grid/table view)
- [x] Add product form
- [ ] Orders management
- [x] Balance & payouts
- [ ] Analytics
- [ ] Documents
- [ ] Settings
- [ ] Help

## 🔧 Texnologiyalar

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI)
- **Backend:** Fastify + Prisma (REST API)
- **Icons:** Lucide Icons
- **Charts:** Recharts (qo'shilishi kerak)
- **Forms:** React Hook Form + Zod
- **Tables:** TanStack Table

## 🚀 Production Deploy

### Vercel ga deploy

1. GitHub ga push qiling
2. Vercel.com da import qiling
3. Environment variables qo'shing
4. Deploy!

### Custom domain

Vercel settings dan:
- `topla.uz` - Landing
- `admin.topla.uz` - Admin panel
- `vendor.topla.uz` - Vendor panel

## 📝 TODO

### Keyingi qadamlar:

1. **Qo'shimcha sahifalar**
   - Admin: Users, Orders, Categories, Banners
   - Vendor: Orders, Analytics, Settings

2. **Realtime**
   - New orders notification
   - Order status updates

3. **Charts**
   - Recharts integration
   - Sales charts
   - Analytics

4. **File upload**
   - Product images
   - Documents

## 📞 Qo'llab-quvvatlash

Savollar bo'lsa, bog'laning:
- Telegram: @topla_support
- Email: dev@topla.uz

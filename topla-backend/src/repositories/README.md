# Repository Layer

Markazlashtirilgan ma'lumotlar bazasi kirish qatlami. Prisma chaqiriq'larini route fayllaridan chiqarib, domain-specific repo modullariga ko'chirish.

## Nima uchun

Oldingi holat:
- Har route fayli o'zi `prisma.product.findMany(...)` chaqiradi
- `include`/`select` pattern'lari takrorlanadi (~30 joyda)
- Tenant scope filter (`userId`, `shopId`) qo'shishni unutish oson → IDOR xavfi
- Cache qo'shish uchun 30 joyda o'zgartirish kerak
- Testda Prisma'ni mock qilish qiyin

Yangi holat:
- Route → Repo → Prisma
- Include preset'lar bir joyda (`productCardInclude`, `productDetailInclude`, ...)
- Tenant-safe funksiyalar: `findByIdForShop(id, shopId)` — shopId majburiy parametr
- Cache va invalidation repo ichida
- Test'da bitta repo'ni mock qilish yetarli

## Qoidalar

1. **Function-first** — class emas, oddiy named export:

    ```ts
    export async function findById(id: string, tx?: DbClient) { ... }
    ```

2. **Tenant scope majburiy** — user/vendor-facing funksiyalarda:

    ```ts
    // YAXSHI: caller shopId'ni uzatishga majbur
    findByIdForShop(id, shopId)

    // YOMON: caller unutishi mumkin
    findById(id, { shopId }) // optional filter
    ```

3. **Transaction-aware** — har funksiya oxirgi optional argument sifatida `tx?: DbClient`:

    ```ts
    await prisma.$transaction(async (tx) => {
      const p = await productRepo.findById(id, tx);
      await orderRepo.create(data, tx);
    });
    ```

4. **Include preset'lar** — const export qilinadi, route'lar uni ishlata oladi:

    ```ts
    export const productCardInclude = { shop: {...}, category: {...} } as const;
    ```

5. **Cache — shu yerda** — faqat read-heavy pattern'lar (product detail, shop). Write operatsiyalari avtomatik invalidate qiladi.

## Foydalanish

```ts
// Route faylida:
import * as productRepo from '../../repositories/product.repository.js';

app.get('/products/:id', async (request) => {
  const product = await productRepo.findByIdCached(request.params.id);
  if (!product) throw new NotFoundError();
  return { data: product };
});

// Vendor faylda (IDOR-safe):
app.put('/vendor/products/:id', async (request) => {
  const shop = await shopRepo.findByOwner(request.user.userId);
  const updated = await productRepo.updateForShop(
    request.params.id,
    shop.id,
    request.body,
  );
  if (!updated) throw new NotFoundError();
  return { data: updated };
});
```

## Migration strategiyasi

Mavjud route'larni bir vaqtning o'zida migrate qilmaslik. Har bir PR'da bitta modul yoki bitta feature-bundle:

1. Route faylida `prisma.product.*` chaqiriq'larini top
2. Kerakli repo funksiyasini `product.repository.ts`'ga qo'sh (yoki mavjudini ishlat)
3. Route'ni repo chaqiriq'iga almashtir
4. Typecheck + test
5. Commit

Mavjud Prisma chaqiriq'lari o'rnida qolishi mumkin (katakombada). Asta-sekin almashtiriladi.

## Tiplar

`DbClient` — `any` (Prisma extension + TxClient birlashmasida "Excessive stack depth" xatosi sababli). Real tur xavfsizligi repo funksiyalarining `Prisma.*Input` tiplarini ishlatishida emas — har funksiya ichida ishlaydigan Prisma modelning o'z tiplari (argument sifatida `Record<string, unknown>` qabul qilinadi va Prisma validate qiladi).

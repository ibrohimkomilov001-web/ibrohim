import { PrismaClient, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🛍️  Adding demo products...');

  const shop = await prisma.shop.findFirst({ where: { name: 'Demo Shop' } });
  if (!shop) { console.error('❌ Demo Shop not found. Run seed.ts first.'); process.exit(1); }

  const cats = await prisma.category.findMany({ include: { subcategories: true } });
  const getCat = (n: string) => cats.find(c => c.nameUz === n);
  const getSub = (cat: any, n: string) => cat?.subcategories.find((s: any) => s.nameUz === n);

  const el = getCat('Elektronika');
  const laptop = getCat('Noutbuklar va kompyuterlar');
  const sport = getCat('Sport va dam olish');

  const brands = await prisma.brand.findMany();
  const b = (n: string) => brands.find(x => x.name === n)?.id;

  await prisma.favorite.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.product.deleteMany();
  console.log('🗑️  Cleared old products');

  const items = [
    {
      name: 'iPhone 15 Pro Max 256GB', nameUz: 'iPhone 15 Pro Max 256GB', nameRu: 'iPhone 15 Pro Max 256GB',
      descriptionUz: 'A17 Pro chip, titanium korpus, 48MP kamera. Eng yangi Apple flagmani.',
      descriptionRu: 'Чип A17 Pro, корпус из титана, камера 48МП. Флагман Apple.',
      price: 14990000, originalPrice: 16500000,
      categoryId: el?.id, subcategoryId: getSub(el, 'Smartfonlar')?.id, brandId: b('Apple'),
      images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=600&fit=crop'],
      isFeatured: true, stock: 25,
    },
    {
      name: 'Samsung Galaxy S24 Ultra', nameUz: 'Samsung Galaxy S24 Ultra', nameRu: 'Samsung Galaxy S24 Ultra',
      descriptionUz: 'S Pen, 200MP kamera, 5000mAh batareya. Samsung flagmani.',
      descriptionRu: 'S Pen, камера 200МП, аккумулятор 5000мАч. Флагман Samsung.',
      price: 12500000, originalPrice: 13900000,
      categoryId: el?.id, subcategoryId: getSub(el, 'Smartfonlar')?.id, brandId: b('Samsung'),
      images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=600&fit=crop'],
      isFeatured: true, stock: 18,
    },
    {
      name: 'Xiaomi 14 Pro 12/256GB', nameUz: 'Xiaomi 14 Pro 12/256GB', nameRu: 'Xiaomi 14 Pro 12/256GB',
      descriptionUz: 'Snapdragon 8 Gen 3, Leica kamera, 120W tez zaryadlash.',
      descriptionRu: 'Snapdragon 8 Gen 3, камера Leica, быстрая зарядка 120Вт.',
      price: 8990000, originalPrice: null,
      categoryId: el?.id, subcategoryId: getSub(el, 'Smartfonlar')?.id, brandId: b('Xiaomi'),
      images: ['https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&h=600&fit=crop'],
      isFeatured: true, stock: 30,
    },
    {
      name: 'Xiaomi Redmi Note 13 Pro', nameUz: 'Xiaomi Redmi Note 13 Pro 8/256GB', nameRu: 'Xiaomi Redmi Note 13 Pro 8/256GB',
      descriptionUz: '200MP kamera, AMOLED ekran, 5100mAh batareya.',
      descriptionRu: 'Камера 200МП, AMOLED экран, аккумулятор 5100мАч.',
      price: 4290000, originalPrice: 4990000,
      categoryId: el?.id, subcategoryId: getSub(el, 'Smartfonlar')?.id, brandId: b('Xiaomi'),
      images: ['https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=600&h=600&fit=crop'],
      isFeatured: false, stock: 50,
    },
    {
      name: 'Apple AirPods Pro 2', nameUz: 'Apple AirPods Pro (2-avlod)', nameRu: 'Apple AirPods Pro (2-е поколение)',
      descriptionUz: 'Active Noise Cancellation, Adaptive Transparency, MagSafe qobiq.',
      descriptionRu: 'Шумоподавление ANC, Adaptive Transparency, чехол MagSafe.',
      price: 2890000, originalPrice: 3200000,
      categoryId: el?.id, subcategoryId: getSub(el, 'Quloqchinlar')?.id, brandId: b('Apple'),
      images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&h=600&fit=crop'],
      isFeatured: true, stock: 40,
    },
    {
      name: 'Samsung Galaxy Buds3 Pro', nameUz: 'Samsung Galaxy Buds3 Pro', nameRu: 'Samsung Galaxy Buds3 Pro',
      descriptionUz: '360° audio, noise cancelling, 6 soat ishlash.',
      descriptionRu: 'Звук 360°, шумоподавление, 6 часов работы.',
      price: 1890000, originalPrice: null,
      categoryId: el?.id, subcategoryId: getSub(el, 'Quloqchinlar')?.id, brandId: b('Samsung'),
      images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop'],
      isFeatured: false, stock: 22,
    },
    {
      name: 'Apple Watch Series 9 GPS 45mm', nameUz: 'Apple Watch Series 9 GPS 45mm', nameRu: 'Apple Watch Series 9 GPS 45mm',
      descriptionUz: 'S9 chip, Always-On Retina ekran, sog\'liq monitoringi.',
      descriptionRu: 'Чип S9, экран Always-On Retina, мониторинг здоровья.',
      price: 4490000, originalPrice: 4990000,
      categoryId: el?.id, subcategoryId: getSub(el, 'Smart soatlar')?.id, brandId: b('Apple'),
      images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=600&fit=crop'],
      isFeatured: true, stock: 15,
    },
    {
      name: 'MacBook Air M3 13"', nameUz: 'MacBook Air M3 13" 8/256GB', nameRu: 'MacBook Air M3 13" 8/256GB',
      descriptionUz: 'M3 chip, 18 soatgacha batareya, eng yengil Apple noutbuk.',
      descriptionRu: 'Чип M3, до 18 часов работы, самый лёгкий ноутбук Apple.',
      price: 16490000, originalPrice: 17500000,
      categoryId: laptop?.id, subcategoryId: getSub(laptop, 'Noutbuklar')?.id, brandId: b('Apple'),
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop'],
      isFeatured: true, stock: 10,
    },
    {
      name: 'Samsung Galaxy Book4 Pro', nameUz: 'Samsung Galaxy Book4 Pro 16"', nameRu: 'Samsung Galaxy Book4 Pro 16"',
      descriptionUz: 'Intel Core Ultra 7, Dynamic AMOLED 2X ekran.',
      descriptionRu: 'Intel Core Ultra 7, Dynamic AMOLED 2X экран.',
      price: 13990000, originalPrice: null,
      categoryId: laptop?.id, subcategoryId: getSub(laptop, 'Noutbuklar')?.id, brandId: b('Samsung'),
      images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop'],
      isFeatured: false, stock: 8,
    },
    {
      name: 'Nike Air Max 270', nameUz: 'Nike Air Max 270 (43 razmer)', nameRu: 'Nike Air Max 270 (размер 43)',
      descriptionUz: 'Katta Air birlik, engil va qulay kunlik sport oyoq kiyimi.',
      descriptionRu: 'Большой воздушный блок, лёгкая и удобная спортивная обувь.',
      price: 1490000, originalPrice: 1890000,
      categoryId: sport?.id, subcategoryId: getSub(sport, 'Sport kiyimlari')?.id, brandId: b('Nike'),
      images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop'],
      isFeatured: true, stock: 35,
    },
    {
      name: 'Adidas Ultraboost 23', nameUz: 'Adidas Ultraboost 23', nameRu: 'Adidas Ultraboost 23',
      descriptionUz: 'Yugurish uchun eng yaxshi krossovka, BOOST texnologiyasi.',
      descriptionRu: 'Лучшие кроссовки для бега, технология BOOST.',
      price: 1690000, originalPrice: null,
      categoryId: sport?.id, subcategoryId: getSub(sport, 'Sport kiyimlari')?.id, brandId: b('Adidas'),
      images: ['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=600&fit=crop'],
      isFeatured: false, stock: 28,
    },
    {
      name: 'Nike Dri-FIT Sport T-shirt', nameUz: "Nike Dri-FIT Sport T-shirt (L)", nameRu: 'Nike Dri-FIT Sport T-shirt (L)',
      descriptionUz: 'Sport mashg\'ulotlari uchun quruq va qulay futbolka.',
      descriptionRu: 'Сухая и комфортная футболка для тренировок.',
      price: 290000, originalPrice: 350000,
      categoryId: sport?.id, subcategoryId: getSub(sport, 'Sport kiyimlari')?.id, brandId: b('Nike'),
      images: ['https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=600&fit=crop'],
      isFeatured: false, stock: 60,
    },
  ];

  let count = 0;
  for (const item of items) {
    await prisma.product.create({
      data: {
        shopId: shop.id,
        name: item.name,
        nameUz: item.nameUz,
        nameRu: item.nameRu,
        descriptionUz: item.descriptionUz,
        descriptionRu: item.descriptionRu,
        price: item.price,
        originalPrice: item.originalPrice,
        images: item.images,
        thumbnailUrl: item.images[0],
        categoryId: item.categoryId ?? null,
        subcategoryId: item.subcategoryId ?? null,
        brandId: item.brandId ?? null,
        isFeatured: item.isFeatured,
        stock: item.stock,
        status: ProductStatus.active,
        isActive: true,
      },
    });
    count++;
    console.log(`  ✅ ${item.nameUz}`);
  }

  console.log(`\n🎉 ${count} demo products created!`);
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

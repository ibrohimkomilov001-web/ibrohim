// ============================================
// Vendor Service — Business logic for vendor system
// Phase 5: Vendor tizimi yaxshilash
// ============================================

import { prisma } from '../config/database.js';

// ============================================
// TYPES
// ============================================

export interface OnboardingProgress {
  completed: number;
  total: number;
  percentage: number;
  steps: OnboardingStep[];
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href: string;
}

export interface PerformanceScore {
  overallScore: number; // 0-100
  fulfillmentRate: number; // % buyurtmalar o'z vaqtida bajarilgani
  cancellationRate: number; // % bekor qilingan buyurtmalar
  returnRate: number; // % qaytarilgan buyurtmalar
  avgResponseTime: number; // soatda (buyurtma qabul qilish vaqti)
  reviewScore: number; // 0-5 o'rtacha reyting
  productQuality: number; // 0-100 avg quality score
  shippingSpeed: number; // 0-100 based on delivery time
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalOrders: number;
  totalDelivered: number;
  totalCancelled: number;
  totalReturned: number;
  periodDays: number;
}

export interface BulkPriceUpdate {
  productId: string;
  price?: number;
  originalPrice?: number;
  discountPercent?: number;
}

export interface BulkImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export interface ProductExportRow {
  name: string;
  nameUz: string;
  nameRu: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  stock: number;
  sku: string;
  barcode: string;
  unit: string;
  status: string;
  images: string;
}

// ============================================
// ONBOARDING PROGRESS
// ============================================

export async function calculateOnboardingProgress(shopId: string): Promise<OnboardingProgress> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      _count: { select: { products: true, documents: true } },
    },
  });

  if (!shop) {
    return { completed: 0, total: 7, percentage: 0, steps: [] };
  }

  // Check documents approval
  const approvedDocs = await prisma.vendorDocument.count({
    where: { shopId, status: 'approved' },
  });

  const steps: OnboardingStep[] = [
    {
      id: 'shop_info',
      title: 'Do\'kon ma\'lumotlari',
      description: 'Nomi, tavsifi, logo va banner yuklash',
      completed: !!(shop.name && shop.description && shop.logoUrl),
      href: '/vendor/settings',
    },
    {
      id: 'contact_info',
      title: 'Aloqa ma\'lumotlari',
      description: 'Telefon, email, manzil',
      completed: !!(shop.phone && shop.address && shop.city),
      href: '/vendor/settings',
    },
    {
      id: 'business_info',
      title: 'Biznes ma\'lumotlari',
      description: 'INN, bank hisob raqami, MFO',
      completed: !!(shop.inn && shop.bankAccount && shop.mfo),
      href: '/vendor/settings',
    },
    {
      id: 'contract',
      title: 'Shartnoma imzolash',
      description: 'Didox orqali shartnomani ko\'rib chiqish va imzolash',
      completed: shop.contractStatus === 'signed',
      href: '/vendor/onboarding',
    },
    {
      id: 'documents',
      title: 'Hujjatlar yuklash',
      description: 'Pasport yoki INN hujjat yuklash va tasdiqlash',
      completed: approvedDocs > 0,
      href: '/vendor/documents',
    },
    {
      id: 'first_product',
      title: 'Birinchi mahsulot',
      description: 'Kamida bitta mahsulot qo\'shish',
      completed: shop._count.products > 0,
      href: '/vendor/products/new',
    },
    {
      id: 'delivery_setup',
      title: 'Yetkazish sozlamalari',
      description: 'Yetkazish narxi va minimal buyurtma belgilash',
      completed: !!(shop.fulfillmentType && shop.deliveryFee !== null),
      href: '/vendor/settings',
    },
    {
      id: 'social_links',
      title: 'Ijtimoiy tarmoqlar',
      description: 'Telegram yoki Instagram ulash',
      completed: !!(shop.telegram || shop.instagram),
      href: '/vendor/settings',
    },
  ];

  const completed = steps.filter(s => s.completed).length;

  return {
    completed,
    total: steps.length,
    percentage: Math.round((completed / steps.length) * 100),
    steps,
  };
}

// ============================================
// PERFORMANCE SCORE
// ============================================

export async function calculatePerformanceScore(
  shopId: string,
  periodDays: number = 30,
): Promise<PerformanceScore> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  // Get all orders with items from this shop in the period
  const orders = await prisma.order.findMany({
    where: {
      items: { some: { shopId } },
      createdAt: { gte: startDate },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  // Returns count
  const returnCount = await prisma.return.count({
    where: {
      order: { items: { some: { shopId } } },
      createdAt: { gte: startDate },
    },
  });

  // Average response time (time from pending to confirmed/processing)
  const statusHistories = await prisma.orderStatusHistory.findMany({
    where: {
      order: { items: { some: { shopId } } },
      status: { in: ['confirmed', 'processing'] },
      createdAt: { gte: startDate },
    },
    select: { orderId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
    distinct: ['orderId'],
  });

  let avgResponseHours = 0;
  if (statusHistories.length > 0) {
    const orderCreatedMap = new Map(orders.map(o => [o.id, o.createdAt]));
    let totalHours = 0;
    let count = 0;
    for (const h of statusHistories) {
      const orderCreated = orderCreatedMap.get(h.orderId);
      if (orderCreated) {
        const hours = (h.createdAt.getTime() - orderCreated.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
        count++;
      }
    }
    avgResponseHours = count > 0 ? Math.round((totalHours / count) * 10) / 10 : 0;
  }

  // Shop review rating
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { rating: true, reviewCount: true },
  });

  // Average product quality score
  const productQualityAgg = await prisma.product.aggregate({
    where: { shopId, deletedAt: null },
    _avg: { qualityScore: true },
  });

  // Calculate rates
  const fulfillmentRate = totalOrders > 0
    ? Math.round((deliveredOrders.length / totalOrders) * 100)
    : 100;

  const cancellationRate = totalOrders > 0
    ? Math.round((cancelledOrders.length / totalOrders) * 100)
    : 0;

  const returnRate = totalOrders > 0
    ? Math.round((returnCount / totalOrders) * 100)
    : 0;

  const reviewScore = shop?.rating || 0;
  const productQuality = Math.round(productQualityAgg._avg?.qualityScore || 0);

  // Shipping speed score: <2h = 100, <4h = 80, <8h = 60, <24h = 40, else 20
  let shippingSpeed = 80;
  if (avgResponseHours > 0) {
    if (avgResponseHours <= 2) shippingSpeed = 100;
    else if (avgResponseHours <= 4) shippingSpeed = 80;
    else if (avgResponseHours <= 8) shippingSpeed = 60;
    else if (avgResponseHours <= 24) shippingSpeed = 40;
    else shippingSpeed = 20;
  }

  // Overall score = weighted average
  const overallScore = Math.round(
    fulfillmentRate * 0.25 +
    (100 - cancellationRate) * 0.15 +
    (100 - returnRate) * 0.10 +
    (reviewScore / 5 * 100) * 0.20 +
    productQuality * 0.15 +
    shippingSpeed * 0.15,
  );

  // Level brackets
  let level: PerformanceScore['level'] = 'bronze';
  if (overallScore >= 90) level = 'platinum';
  else if (overallScore >= 75) level = 'gold';
  else if (overallScore >= 55) level = 'silver';

  return {
    overallScore,
    fulfillmentRate,
    cancellationRate,
    returnRate,
    avgResponseTime: avgResponseHours,
    reviewScore,
    productQuality,
    shippingSpeed,
    level,
    totalOrders,
    totalDelivered: deliveredOrders.length,
    totalCancelled: cancelledOrders.length,
    totalReturned: returnCount,
    periodDays,
  };
}

// ============================================
// BULK PRICE UPDATE
// ============================================

export async function bulkUpdatePrices(
  shopId: string,
  updates: BulkPriceUpdate[],
): Promise<{ updated: number; errors: { productId: string; message: string }[] }> {
  const results = { updated: 0, errors: [] as { productId: string; message: string }[] };

  // N+1 fix: Barcha productlarni BITTA query bilan olib kelamiz
  const productIds = updates.map(u => u.productId);
  const existingProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, shopId, deletedAt: null },
    select: { id: true, price: true },
  });
  const productMap = new Map(existingProducts.map(p => [p.id, p]));

  for (const update of updates) {
    try {
      const product = productMap.get(update.productId);

      if (!product) {
        results.errors.push({ productId: update.productId, message: 'Mahsulot topilmadi' });
        continue;
      }

      const data: any = {};
      if (update.price !== undefined && update.price > 0) data.price = update.price;
      if (update.originalPrice !== undefined && update.originalPrice > 0) data.originalPrice = update.originalPrice;
      if (update.discountPercent !== undefined) {
        data.discountPercent = Math.min(100, Math.max(0, update.discountPercent));
      }

      // Auto-calculate discount if both prices given
      if (data.price && data.originalPrice && data.originalPrice > data.price) {
        data.discountPercent = Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100);
      }

      await prisma.product.update({
        where: { id: update.productId },
        data,
      });

      results.updated++;
    } catch (err: any) {
      results.errors.push({ productId: update.productId, message: err.message || 'Xatolik' });
    }
  }

  return results;
}

// ============================================
// PRODUCT EXPORT (CSV)
// ============================================

export async function exportProductsCSV(shopId: string): Promise<string> {
  const products = await prisma.product.findMany({
    where: { shopId, deletedAt: null },
    include: {
      category: { select: { nameUz: true, nameRu: true } },
      brand: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // CSV header
  const headers = [
    'ID', 'Nomi', 'Nomi (UZ)', 'Nomi (RU)', 'Tavsif',
    'Kategoriya', 'Brend', 'Narx', 'Eski narx', 'Chegirma %',
    'Stok', 'SKU', 'Shtrixkod', 'Birlik', 'Status',
    'Rasmlar', 'Yaratilgan sana',
  ];

  const rows = products.map(p => [
    p.id,
    escapeCsvField(p.name),
    escapeCsvField(p.nameUz || ''),
    escapeCsvField(p.nameRu || ''),
    escapeCsvField((p.description || '').slice(0, 500)),
    escapeCsvField(p.category?.nameUz || ''),
    escapeCsvField(p.brand?.name || ''),
    p.price,
    p.originalPrice || '',
    p.discountPercent || 0,
    p.stock,
    p.sku || '',
    p.barcode || '',
    p.unit || 'dona',
    p.status,
    (p.images as string[] || []).join(';'),
    p.createdAt.toISOString().slice(0, 10),
  ]);

  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.map(v => String(v)).join(',')),
  ];

  return csvLines.join('\n');
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// ============================================
// BULK PRODUCT IMPORT (CSV)
// ============================================

export async function bulkImportProducts(
  shopId: string,
  csvContent: string,
): Promise<BulkImportResult> {
  const lines = csvContent.split('\n').filter(l => l.trim());
  if (lines.length < 2) {
    return { total: 0, imported: 0, skipped: 0, errors: [{ row: 0, message: 'CSV fayl bo\'sh yoki header yo\'q' }] };
  }

  const header = parseCsvLine(lines[0]!).map(h => h.toLowerCase().trim());
  const result: BulkImportResult = { total: lines.length - 1, imported: 0, skipped: 0, errors: [] };

  // Map column names
  const colMap: Record<string, number> = {};
  const columnAliases: Record<string, string[]> = {
    name: ['nomi', 'name', 'mahsulot', 'product'],
    nameUz: ['nomi (uz)', 'nameuz', 'name_uz', 'nomi_uz'],
    nameRu: ['nomi (ru)', 'nameru', 'name_ru', 'nomi_ru'],
    description: ['tavsif', 'description', 'desc'],
    price: ['narx', 'price', 'baho'],
    originalPrice: ['eski narx', 'originalprice', 'original_price', 'old_price'],
    discountPercent: ['chegirma %', 'chegirma', 'discount', 'discountpercent', 'discount_percent'],
    stock: ['stok', 'stock', 'miqdor', 'quantity'],
    sku: ['sku', 'artikul'],
    barcode: ['shtrixkod', 'barcode', 'ean'],
    unit: ['birlik', 'unit'],
    category: ['kategoriya', 'category'],
    brand: ['brend', 'brand'],
  };

  for (const [field, aliases] of Object.entries(columnAliases)) {
    const idx = header.findIndex(h => aliases.includes(h));
    if (idx !== -1) colMap[field] = idx;
  }

  if (!('name' in colMap) && !('nameUz' in colMap)) {
    return { total: 0, imported: 0, skipped: 0, errors: [{ row: 0, message: 'Name yoki Nomi ustuni topilmadi' }] };
  }

  // Cache categories and brands
  const categories = await prisma.category.findMany({ select: { id: true, nameUz: true, nameRu: true } });
  const brands = await prisma.brand.findMany({ select: { id: true, name: true } });

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCsvLine(lines[i]!);
      const getVal = (field: string) => {
        const idx = colMap[field];
        return idx !== undefined ? values[idx]?.trim() || '' : '';
      };

      const name = getVal('name') || getVal('nameUz');
      if (!name || name.length < 2) {
        result.errors.push({ row: i + 1, message: 'Mahsulot nomi bo\'sh yoki juda qisqa' });
        result.skipped++;
        continue;
      }

      const price = parseFloat(getVal('price'));
      if (isNaN(price) || price <= 0) {
        result.errors.push({ row: i + 1, message: `Narx noto'g'ri: "${getVal('price')}"` });
        result.skipped++;
        continue;
      }

      // Match category
      let categoryId: string | undefined;
      const catName = getVal('category');
      if (catName) {
        const found = categories.find(c =>
          c.nameUz?.toLowerCase() === catName.toLowerCase() ||
          c.nameRu?.toLowerCase() === catName.toLowerCase(),
        );
        if (found) categoryId = found.id;
      }

      // Match brand
      let brandId: string | undefined;
      const brandName = getVal('brand');
      if (brandName) {
        const found = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
        if (found) brandId = found.id;
      }

      const stock = parseInt(getVal('stock')) || 0;
      const originalPrice = parseFloat(getVal('originalPrice')) || undefined;
      const discountPercent = parseFloat(getVal('discountPercent')) || 0;

      // Check duplicate by SKU or name
      const sku = getVal('sku') || undefined;
      if (sku) {
        const exists = await prisma.product.findFirst({
          where: { shopId, sku, deletedAt: null },
          select: { id: true },
        });
        if (exists) {
          result.errors.push({ row: i + 1, message: `SKU "${sku}" allaqachon mavjud` });
          result.skipped++;
          continue;
        }
      }

      await prisma.product.create({
        data: {
          shopId,
          name,
          nameUz: getVal('nameUz') || name,
          nameRu: getVal('nameRu') || undefined,
          description: getVal('description') || undefined,
          price,
          originalPrice,
          discountPercent,
          stock,
          sku,
          barcode: getVal('barcode') || undefined,
          unit: (['dona', 'kg', 'litr', 'metr', 'paket', 'quti'].includes(getVal('unit')) ? getVal('unit') : 'dona') as any,
          categoryId,
          brandId,
          status: 'draft',
          isActive: false,
          images: [],
        },
      });

      result.imported++;
    } catch (err: any) {
      result.errors.push({ row: i + 1, message: err.message || 'Import xatoligi' });
      result.skipped++;
    }
  }

  return result;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

// ============================================
// DOCUMENT VERIFICATION NOTIFICATION
// ============================================

export async function sendDocumentStatusNotification(
  shopId: string,
  documentName: string,
  status: 'approved' | 'rejected',
  reason?: string,
): Promise<void> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { ownerId: true, name: true },
  });

  if (!shop) return;

  // Check if all required documents approved
  const allDocs = await prisma.vendorDocument.findMany({
    where: { shopId },
    select: { status: true, type: true },
  });

  const hasPassport = allDocs.some(d => d.type === 'passport' && d.status === 'approved');
  const hasInn = allDocs.some(d => d.type === 'inn' && d.status === 'approved');
  const allApproved = hasPassport && hasInn;

  // Create notification
  await prisma.notification.create({
    data: {
      userId: shop.ownerId,
      title: status === 'approved' ? '✅ Hujjat tasdiqlandi' : '❌ Hujjat rad etildi',
      body: status === 'approved'
        ? `"${documentName}" hujjati muvaffaqiyatli tasdiqlandi.${allApproved ? '\n\n🎉 Barcha hujjatlar tasdiqlandi! Do\'koningiz faollashtirildi.' : ''}`
        : `"${documentName}" hujjati rad etildi.\nSabab: ${reason || 'Noma\'lum'}\n\nIltimos, hujjatni qayta yuklang.`,
      type: 'system',
    },
  });

  // If all required docs approved → activate shop
  if (allApproved && status === 'approved') {
    const currentShop = await prisma.shop.findUnique({ where: { id: shopId }, select: { status: true } });
    if (currentShop?.status === 'pending') {
      await prisma.shop.update({
        where: { id: shopId },
        data: { status: 'active' },
      });

      // Send activation notification
      await prisma.notification.create({
        data: {
          userId: shop.ownerId,
          title: '🎉 Do\'koningiz faollashtirildi!',
          body: 'Tabriklaymiz! Barcha hujjatlar tasdiqlandi va do\'koningiz endi faol. Mahsulot qo\'shishni boshlashingiz mumkin.',
          type: 'system',
        },
      });
    }
  }
}

// Export for testing
export { parseCsvLine, escapeCsvField };

/**
 * Order Service — Phase 4: Buyurtma jarayoni yaxshilash
 * 
 * O-FIX-03: Order confirmation flow (pending → confirmed → processing)
 * O-FIX-04: Delivery time estimation
 * O-03/F-03 + B-10: Dynamic delivery fee (zone-based)
 * O-05/B-03: Variant info to'liq saqlash
 * O-09: Reorder
 * O-10: Partial cancellation
 */
import { prisma } from '../config/database.js';

// ============================================
// B-10: Zone-based delivery fee
// ============================================

/**
 * Calculate delivery fee based on user's address coordinates
 * Falls back to AdminSetting('delivery_fee') → then 15000
 */
export async function calculateDeliveryFee(
  addressId?: string | null,
  deliveryMethod: string = 'courier',
): Promise<{ fee: number; zoneName: string | null; freeDeliveryThreshold: number }> {
  // Pickup = bepul
  if (deliveryMethod === 'pickup') {
    return { fee: 0, zoneName: null, freeDeliveryThreshold: 0 };
  }

  let freeDeliveryThreshold = 0;
  try {
    const thresholdSetting = await prisma.adminSetting.findUnique({
      where: { key: 'free_delivery_threshold' },
    });
    if (thresholdSetting) {
      freeDeliveryThreshold = parseFloat(thresholdSetting.value) || 0;
    }
  } catch {}

  // Address mavjud bo'lsa, zone-based fee hisoblash
  if (addressId) {
    try {
      const address = await prisma.address.findUnique({
        where: { id: addressId },
        select: { latitude: true, longitude: true },
      });

      if (address?.latitude && address?.longitude) {
        // GeoJSON point-in-polygon tekshirish
        const zone = await findDeliveryZone(
          Number(address.latitude),
          Number(address.longitude),
        );
        if (zone) {
          return {
            fee: Number(zone.deliveryFee),
            zoneName: zone.name,
            freeDeliveryThreshold,
          };
        }
      }
    } catch (err) {
      console.error('Zone-based fee error:', err);
    }
  }

  // Fallback: AdminSetting dan delivery_fee
  try {
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'delivery_fee' },
    });
    if (setting) {
      return {
        fee: parseFloat(setting.value) || 15000,
        zoneName: null,
        freeDeliveryThreshold,
      };
    }
  } catch {}

  return { fee: 15000, zoneName: null, freeDeliveryThreshold };
}

/**
 * Find delivery zone by lat/lng using GeoJSON polygon
 * Uses Ray-casting algorithm for point-in-polygon
 */
async function findDeliveryZone(
  lat: number,
  lng: number,
): Promise<{ name: string; deliveryFee: number; minOrder: number | null } | null> {
  const zones = await prisma.deliveryZone.findMany({
    where: { isActive: true },
    select: {
      name: true,
      polygon: true,
      deliveryFee: true,
      minOrder: true,
    },
  });

  for (const zone of zones) {
    const polygon = zone.polygon as any;
    if (polygon && isPointInPolygon(lat, lng, polygon)) {
      return {
        name: zone.name,
        deliveryFee: Number(zone.deliveryFee),
        minOrder: zone.minOrder ? Number(zone.minOrder) : null,
      };
    }
  }

  return null;
}

/**
 * Ray-casting point-in-polygon algorithm
 * Supports GeoJSON Polygon format: { type: "Polygon", coordinates: [[[lng, lat], ...]] }
 */
function isPointInPolygon(lat: number, lng: number, geoJson: any): boolean {
  if (!geoJson || typeof geoJson !== 'object') return false;

  let coordinates: number[][];

  if (geoJson.type === 'Polygon' && geoJson.coordinates?.[0]) {
    coordinates = geoJson.coordinates[0];
  } else if (Array.isArray(geoJson) && Array.isArray(geoJson[0])) {
    coordinates = geoJson;
  } else {
    return false;
  }

  let inside = false;
  const n = coordinates.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    // GeoJSON: [lng, lat]
    const xi = coordinates[i]![1]!, yi = coordinates[i]![0]!;
    const xj = coordinates[j]![1]!, yj = coordinates[j]![0]!;

    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

// ============================================
// O-FIX-04: Delivery time estimation
// ============================================

export interface DeliveryEstimate {
  estimatedMinutes: number; // Taxminiy daqiqa
  estimatedDate: string;     // ISO date
  estimatedTimeSlot: string; // "10:00-12:00"
  displayText: string;       // "Bugun 10:00-12:00" yoki "Ertaga 14:00-16:00"
}

/**
 * Estimate delivery time based on order time and delivery method
 * Business rules:
 * - Orders before 14:00 → same day delivery (2-4 hours)
 * - Orders after 14:00 → next day delivery
 * - Next day delivery is default if no special urgency
 */
export function estimateDeliveryTime(
  deliveryMethod: string,
  scheduledDate?: string | null,
  scheduledTimeSlot?: string | null,
): DeliveryEstimate {
  const now = new Date();
  const hour = now.getHours();
  const tzOffset = 5; // UTC+5 (Toshkent)
  const localHour = (hour + tzOffset) % 24;

  // Pickup — foydalanuvchi o'zi oladi
  if (deliveryMethod === 'pickup') {
    return {
      estimatedMinutes: 60,
      estimatedDate: now.toISOString(),
      estimatedTimeSlot: '1 soat ichida',
      displayText: 'Tayyorlanishi ~1 soat',
    };
  }

  // Scheduled date berilgan bo'lsa
  if (scheduledDate) {
    const date = new Date(scheduledDate);
    const isToday = date.toDateString() === now.toDateString();
    const dayLabel = isToday ? 'Bugun' : formatDateUz(date);
    const timeSlot = scheduledTimeSlot || '10:00-18:00';
    return {
      estimatedMinutes: isToday ? 120 : 24 * 60,
      estimatedDate: date.toISOString(),
      estimatedTimeSlot: timeSlot,
      displayText: `${dayLabel} ${timeSlot}`,
    };
  }

  // Auto-estimate based on current time
  if (localHour < 14) {
    // Bugun yetkazish (2-4 soat)
    const endHour = Math.min(localHour + 4, 22);
    const timeSlot = `${String(localHour + 2).padStart(2, '0')}:00-${String(endHour).padStart(2, '0')}:00`;
    return {
      estimatedMinutes: 180,
      estimatedDate: now.toISOString(),
      estimatedTimeSlot: timeSlot,
      displayText: `Bugun ${timeSlot}`,
    };
  } else {
    // Ertaga yetkazish
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const timeSlot = '10:00-14:00';
    return {
      estimatedMinutes: 24 * 60,
      estimatedDate: tomorrow.toISOString(),
      estimatedTimeSlot: timeSlot,
      displayText: `Ertaga ${timeSlot}`,
    };
  }
}

function formatDateUz(date: Date): string {
  const months = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
  ];
  return `${date.getDate()}-${months[date.getMonth()]}`;
}

// ============================================
// O-09: Reorder — Qayta buyurtma berish  
// ============================================

export interface ReorderResult {
  addedItems: Array<{ productId: string; name: string; quantity: number }>;
  skippedItems: Array<{ productId: string; name: string; reason: string }>;
}

/**
 * Re-add order items to cart (reorder)
 * Checks stock availability and product active status
 */
export async function reorderToCart(
  orderId: string,
  userId: string,
): Promise<ReorderResult> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, stock: true, isActive: true, price: true },
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error('Buyurtma topilmadi');
  }

  const addedItems: ReorderResult['addedItems'] = [];
  const skippedItems: ReorderResult['skippedItems'] = [];

  for (const item of order.items) {
    const product = item.product;

    // Product mavjud emas yoki faol emas
    if (!product || !product.isActive) {
      skippedItems.push({
        productId: item.productId,
        name: item.name,
        reason: 'Mahsulot sotuvda mavjud emas',
      });
      continue;
    }

    // Stok tekshirish
    if (product.stock < 1) {
      skippedItems.push({
        productId: item.productId,
        name: item.name,
        reason: 'Mahsulot tugagan',
      });
      continue;
    }

    const addQty = Math.min(item.quantity, product.stock);

    // Savatga qo'shish (upsert — mavjud bo'lsa quantity oshirish)
    await prisma.cartItem.upsert({
      where: {
        userId_productId_variantId: {
          userId,
          productId: item.productId,
          variantId: item.variantId || 'no-variant',
        },
      },
      create: {
        userId,
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: addQty,
      },
      update: {
        quantity: { increment: addQty },
      },
    });

    addedItems.push({
      productId: item.productId,
      name: item.name,
      quantity: addQty,
    });
  }

  return { addedItems, skippedItems };
}

// ============================================
// O-10: Partial cancellation — bitta itemni bekor qilish
// ============================================

export interface PartialCancelResult {
  cancelledItem: { productId: string; name: string; quantity: number; refundAmount: number };
  newOrderTotal: number;
  orderCancelled: boolean; // Agar oxirgi item bo'lsa, butun buyurtma cancel
}

/**
 * Cancel a single item from an order
 * - Restores stock
 * - Recalculates order total
 * - If last item → cancels entire order
 */
export async function cancelOrderItem(
  orderId: string,
  itemId: string,
  userId: string,
  reason?: string,
): Promise<PartialCancelResult> {
  return await prisma.$transaction(async (tx) => {
    // Order va item topish (faqat order egasi)
    const order = await tx.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });

    if (!order) {
      throw new Error('Buyurtma topilmadi');
    }

    // Faqat pending/processing holatda bekor qilish mumkin
    if (!['pending', 'processing', 'confirmed'].includes(order.status)) {
      throw new Error('Bu holatda itemni bekor qilib bo\'lmaydi');
    }

    const item = order.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Buyurtma elementi topilmadi');
    }

    const refundAmount = Number(item.price) * item.quantity;
    const remainingItems = order.items.filter(i => i.id !== itemId);

    if (remainingItems.length === 0) {
      // Oxirgi item — butun buyurtmani bekor qilish
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          cancelReason: reason || 'Barcha elementlar bekor qilindi',
          cancelledAt: new Date(),
        },
      });

      // Stokni qaytarish (barcha items uchun, chunki order bekor)
      for (const oi of order.items) {
        await tx.product.update({
          where: { id: oi.productId },
          data: { stock: { increment: oi.quantity } },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'cancelled',
          note: reason || 'Oxirgi element bekor qilindi',
          changedBy: userId,
        },
      });

      return {
        cancelledItem: {
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          refundAmount,
        },
        newOrderTotal: 0,
        orderCancelled: true,
      };
    }

    // Partial cancel — faqat bitta itemni o'chirish
    await tx.orderItem.delete({ where: { id: itemId } });

    // Stokni qaytarish
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });

    // Buyurtma totalini qayta hisoblash
    const newSubtotal = remainingItems.reduce(
      (sum, i) => sum + Number(i.price) * i.quantity,
      0,
    );
    // Discount ni proportsional kamaytirish
    const originalSubtotal = Number(order.subtotal);
    const originalDiscount = Number(order.discount);
    const discountRatio = originalSubtotal > 0
      ? newSubtotal / originalSubtotal
      : 0;
    const newDiscount = Math.round(originalDiscount * discountRatio);
    const newTotal = Math.max(0, newSubtotal - newDiscount + Number(order.deliveryFee));

    await tx.order.update({
      where: { id: orderId },
      data: {
        subtotal: newSubtotal,
        discount: newDiscount,
        total: newTotal,
      },
    });

    // Status history
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: order.status,
        note: `Element bekor qilindi: ${item.name} (${item.quantity} dona)${reason ? '. Sabab: ' + reason : ''}`,
        changedBy: userId,
      },
    });

    return {
      cancelledItem: {
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        refundAmount,
      },
      newOrderTotal: newTotal,
      orderCancelled: false,
    };
  });
}

// ============================================
// O-05/B-03: Build variant info for order item
// ============================================

export interface VariantInfo {
  variantLabel: string | null;
  price: any; // Decimal
  imageUrl: string | null;
  attributes: Record<string, string>; // { "Rang": "Qora", "O'lcham": "XL", "RAM": "8GB" }
}

/**
 * Build complete variant information for order item
 * Includes color, size, and ALL custom attribute values
 */
export function buildVariantInfo(cartItem: any): VariantInfo {
  const variant = cartItem.variant;
  const product = cartItem.product;

  const attributes: Record<string, string> = {};
  const labelParts: string[] = [];

  if (variant) {
    // Yangi junction-based variantValues (Yandex-style multi-attribute)
    if (variant.variantValues && Array.isArray(variant.variantValues) && variant.variantValues.length > 0) {
      // sortOrder bo'yicha tartiblash
      const sorted = [...variant.variantValues].sort((a: any, b: any) => {
        const so = (a.optionType?.sortOrder ?? 0) - (b.optionType?.sortOrder ?? 0);
        return so;
      });
      for (const vv of sorted) {
        const typeName = vv.optionType?.nameUz || vv.optionType?.slug || 'Attribut';
        const valueName = vv.optionValue?.valueUz || '';
        if (!valueName) continue;
        attributes[typeName] = valueName;
        labelParts.push(valueName);
      }
    } else {
      // Eski Color / Size (backward compat)
      if (variant.color?.nameUz) {
        attributes['Rang'] = variant.color.nameUz;
        labelParts.push(variant.color.nameUz);
      }
      if (variant.size?.nameUz) {
        attributes['O\'lcham'] = variant.size.nameUz;
        labelParts.push(variant.size.nameUz);
      }
    }

    // Custom attribute values (eski formatdagi)
    if (variant.attributeValues && Array.isArray(variant.attributeValues)) {
      for (const av of variant.attributeValues) {
        if (av.attribute?.key && av.value) {
          const key = av.attribute.nameUz || av.attribute.key;
          if (!attributes[key]) {
            attributes[key] = av.value;
            labelParts.push(`${key}: ${av.value}`);
          }
        }
      }
    }
  }

  return {
    variantLabel: labelParts.length > 0 ? labelParts.join(' / ') : null,
    price: variant?.price || product.price,
    imageUrl: variant?.images?.[0] || product.images?.[0] || null,
    attributes,
  };
}

// ============================================
// GET /orders/delivery-info — endpoint uchun
// Yetkazish narxi va vaqtini oldindan hisoblash
// ============================================

export async function getDeliveryInfo(params: {
  addressId?: string;
  deliveryMethod?: string;
  subtotal?: number;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
}): Promise<{
  deliveryFee: number;
  isFreeDelivery: boolean;
  freeDeliveryThreshold: number;
  zoneName: string | null;
  estimate: DeliveryEstimate;
}> {
  const { fee, zoneName, freeDeliveryThreshold } = await calculateDeliveryFee(
    params.addressId,
    params.deliveryMethod || 'courier',
  );

  const isFreeDelivery = freeDeliveryThreshold > 0
    && (params.subtotal || 0) >= freeDeliveryThreshold;

  const estimate = estimateDeliveryTime(
    params.deliveryMethod || 'courier',
    params.scheduledDate,
    params.scheduledTimeSlot,
  );

  return {
    deliveryFee: isFreeDelivery ? 0 : fee,
    isFreeDelivery,
    freeDeliveryThreshold,
    zoneName,
    estimate,
  };
}

// ============================================
// Exports for testing
// ============================================
export { isPointInPolygon, findDeliveryZone, formatDateUz };

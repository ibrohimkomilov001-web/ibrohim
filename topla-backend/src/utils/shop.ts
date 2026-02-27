import { prisma } from '../config/database.js';
import { NotFoundError } from '../middleware/error.js';

/**
 * Vendor'ning do'konini topish uchun yagona helper.
 * 38+ joyda takrorlangan lookup'ni almashtiradi.
 */
export async function getVendorShop(userId: string) {
  const shop = await prisma.shop.findUnique({
    where: { ownerId: userId },
  });
  if (!shop) throw new NotFoundError("Do'kon");
  return shop;
}

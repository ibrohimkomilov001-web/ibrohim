import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import * as cartRepo from '../../repositories/cart.repository.js';
import { authMiddleware } from '../../middleware/auth.js';
import { AppError, NotFoundError } from '../../middleware/error.js';

// ============================================
// CART (Savat) Routes
// ============================================

export async function cartRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /cart
   */
  app.get('/cart', { preHandler: authMiddleware }, async (request, reply) => {
    const cartItems = await cartRepo.findByUser(request.user!.userId);

    const total = cartItems.reduce(
      (sum: number, item: { product: { price: unknown }; quantity: number }) =>
        sum + Number(item.product.price) * item.quantity,
      0,
    );

    return reply.send({
      success: true,
      data: { items: cartItems, total, itemCount: cartItems.length },
    });
  });

  /**
   * POST /cart
   * Savatga qo'shish
   */
  const addToCartSchema = z.object({
    productId: z.string().uuid('Noto\'g\'ri mahsulot IDsi'),
    variantId: z.string().uuid().nullish(),
    quantity: z.number().int().positive().max(999).default(1),
  });

  app.post('/cart', { preHandler: authMiddleware }, async (request, reply) => {
    const { productId, variantId, quantity } = addToCartSchema.parse(request.body);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw new NotFoundError('Mahsulot');

    // Variant bo'lsa — variant stock tekshir; bo'lmasa — product stock
    if (variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: { id: variantId, productId, isActive: true },
      });
      if (!variant) throw new NotFoundError('Variant');
      if (variant.stock < quantity) {
        throw new AppError(`Faqat ${variant.stock} dona mavjud`, 400);
      }
    } else {
      if (product.stock < quantity) throw new AppError('Yetarli mahsulot yo\'q');
    }

    const userId = request.user!.userId;
    const cartItem = await cartRepo.addOrIncrement(
      userId,
      productId,
      variantId ?? null,
      quantity,
    );

    return reply.send({ success: true, data: cartItem });
  });

  /**
   * PUT /cart/:productId
   * Savatdagi mahsulot sonini yangilash
   */
  const productIdParamSchema = z.object({ productId: z.string().uuid() });

  app.put('/cart/:productId', { preHandler: authMiddleware }, async (request, reply) => {
    const { productId } = productIdParamSchema.parse(request.params);
    const bodySchema = z.object({
      quantity: z.coerce.number().int().min(0, 'Miqdor 0 dan kam bo\'lmasligi kerak').max(999, 'Miqdor 999 dan oshmasligi kerak'),
    });
    const { quantity } = bodySchema.parse(request.body);

    const userId = request.user!.userId;

    if (quantity <= 0) {
      await cartRepo.setQuantity(userId, productId, 0);
      return reply.send({ success: true, message: 'Savatdan o\'chirildi' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      throw new NotFoundError('Mahsulot');
    }
    if (product.stock < quantity) {
      throw new AppError(`Faqat ${product.stock} dona mavjud`, 400);
    }

    try {
      const updated = await cartRepo.setQuantity(userId, productId, quantity);
      return reply.send({ success: true, data: updated });
    } catch (e: any) {
      throw new AppError('Savatni yangilashda xatolik', 500);
    }
  });

  /**
   * DELETE /cart/:productId
   * Savatdan o'chirish
   */
  app.delete('/cart/:productId', { preHandler: authMiddleware }, async (request, reply) => {
    const { productId } = productIdParamSchema.parse(request.params);
    await cartRepo.removeProduct(request.user!.userId, productId);
    return reply.send({ success: true });
  });

  /**
   * DELETE /cart
   * Savatni tozalash
   */
  app.delete('/cart', { preHandler: authMiddleware }, async (request, reply) => {
    await cartRepo.clear(request.user!.userId);
    return reply.send({ success: true });
  });
}

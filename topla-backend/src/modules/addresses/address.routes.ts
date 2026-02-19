import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../config/database.js';
import { authMiddleware } from '../../middleware/auth.js';
import { NotFoundError } from '../../middleware/error.js';

const addressSchema = z.object({
  name: z.string().min(1).max(50),
  fullAddress: z.string().min(5),
  street: z.string().nullable().optional(),
  building: z.string().nullable().optional(),
  apartment: z.string().nullable().optional(),
  entrance: z.string().nullable().optional(),
  floor: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  latitude: z.number(),
  longitude: z.number(),
  isDefault: z.boolean().default(false),
});

export async function addressRoutes(app: FastifyInstance): Promise<void> {

  app.get('/addresses', { preHandler: authMiddleware }, async (request, reply) => {
    const addresses = await prisma.address.findMany({
      where: { userId: request.user!.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return reply.send({ success: true, data: addresses });
  });

  app.get('/addresses/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const address = await prisma.address.findFirst({
      where: { id, userId: request.user!.userId },
    });
    if (!address) throw new NotFoundError('Manzil');
    return reply.send({ success: true, data: address });
  });

  app.post('/addresses', { preHandler: authMiddleware }, async (request, reply) => {
    const body = addressSchema.parse(request.body);

    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: request.user!.userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { 
        ...body,
        user: { connect: { id: request.user!.userId } }
      } as any,
    });

    return reply.status(201).send({ success: true, data: address });
  });

  app.put('/addresses/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const body = addressSchema.partial().parse(request.body);

    // Ownership tekshiruvi
    const existing = await prisma.address.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundError('Manzil');

    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: body,
    });

    return reply.send({ success: true, data: address });
  });

  app.delete('/addresses/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const existing = await prisma.address.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundError('Manzil');

    await prisma.address.delete({ where: { id } });
    return reply.send({ success: true });
  });
}

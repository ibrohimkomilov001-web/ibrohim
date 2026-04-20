import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as addressRepo from '../../repositories/address.repository.js';
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
    const addresses = await addressRepo.findByUser(request.user!.userId);
    return reply.send({ success: true, data: addresses });
  });

  app.get('/addresses/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const address = await addressRepo.findByIdForUser(id, request.user!.userId);
    if (!address) throw new NotFoundError('Manzil');
    return reply.send({ success: true, data: address });
  });

  app.post('/addresses', { preHandler: authMiddleware }, async (request, reply) => {
    const body = addressSchema.parse(request.body);
    const address = await addressRepo.createForUser(request.user!.userId, body);
    return reply.status(201).send({ success: true, data: address });
  });

  app.put('/addresses/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;
    const body = addressSchema.partial().parse(request.body);

    const address = await addressRepo.updateForUser(id, userId, body);
    if (!address) throw new NotFoundError('Manzil');

    return reply.send({ success: true, data: address });
  });

  app.delete('/addresses/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.userId;

    const deleted = await addressRepo.deleteForUser(id, userId);
    if (!deleted) throw new NotFoundError('Manzil');

    return reply.send({ success: true });
  });
}

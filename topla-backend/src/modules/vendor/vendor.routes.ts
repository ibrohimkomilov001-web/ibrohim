// ============================================
// Vendor Routes — Coordinator
// Registers all vendor sub-route modules
// ============================================

import { FastifyInstance } from 'fastify';
import { vendorCoreRoutes } from './vendor-core.routes.js';
import { vendorProductsRoutes } from './vendor-products.routes.js';
import { vendorOrdersRoutes } from './vendor-orders.routes.js';
import { vendorFinanceRoutes } from './vendor-finance.routes.js';
import { vendorEngagementRoutes } from './vendor-engagement.routes.js';
import { vendorStaffRoutes } from './vendor-staff.routes.js';

export async function vendorRoutes(app: FastifyInstance): Promise<void> {
  await app.register(vendorCoreRoutes);
  await app.register(vendorProductsRoutes);
  await app.register(vendorOrdersRoutes);
  await app.register(vendorFinanceRoutes);
  await app.register(vendorEngagementRoutes);
  await app.register(vendorStaffRoutes);
}

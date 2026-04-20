// ============================================
// Admin Routes — Coordinator
// Registers all admin sub-route modules
// ============================================

import { FastifyInstance } from 'fastify';
import { adminAuthRoutes } from './admin-auth.routes.js';
import { adminCoreRoutes } from './admin-core.routes.js';
import { adminCatalogRoutes } from './admin-catalog.routes.js';
import { adminAnalyticsRoutes } from './admin-analytics.routes.js';
import { adminExtensionsRoutes } from './admin-extensions.routes.js';
import { adminAuthzRoutes } from './admin-authz.routes.js';

export async function adminRoutes(app: FastifyInstance) {
  await app.register(adminAuthRoutes);
  await app.register(adminCoreRoutes);
  await app.register(adminCatalogRoutes);
  await app.register(adminAnalyticsRoutes);
  await app.register(adminExtensionsRoutes);
  await app.register(adminAuthzRoutes);
}

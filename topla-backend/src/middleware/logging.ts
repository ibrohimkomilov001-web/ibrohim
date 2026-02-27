import { FastifyInstance } from 'fastify';

/**
 * Request logging middleware — har bir so'rov uchun log yozadi.
 * Method, URL, status code, response time, userId ko'rsatadi.
 */
export function registerRequestLogging(app: FastifyInstance) {
  app.addHook('onResponse', async (request, reply) => {
    const responseTime = reply.elapsedTime;
    const userId = (request as any).user?.userId || null;

    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: `${responseTime.toFixed(1)}ms`,
        userId,
      },
      `${request.method} ${request.url} → ${reply.statusCode} (${responseTime.toFixed(0)}ms)`,
    );
  });
}

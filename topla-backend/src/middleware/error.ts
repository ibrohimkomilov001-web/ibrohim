import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * Global error handler
 */
export function errorHandler(
  error: Error & { statusCode?: number; validation?: any },
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const statusCode = error.statusCode || 500;

  // Zod validation errors
  if (error instanceof ZodError) {
    reply.status(400).send({
      error: 'Validation Error',
      message: 'Noto\'g\'ri ma\'lumot kiritildi',
      details: error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    });
    return;
  }

  // Fastify schema validation errors
  if (error.validation) {
    reply.status(400).send({
      error: 'Validation Error',
      message: 'Noto\'g\'ri ma\'lumot kiritildi',
      details: error.validation,
    });
    return;
  }

  // Prisma known errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': { // Unique constraint violation
        const target = (error.meta?.target as string[])?.join(', ') || 'field';
        request.log.warn({ target, prismaCode: error.code }, 'Unique constraint violation');
        reply.status(409).send({
          error: 'Conflict',
          message: 'Bu ma\'lumot allaqachon mavjud',
        });
        return;
      }
      case 'P2025': // Record not found
        reply.status(404).send({
          error: 'Not Found',
          message: 'Ma\'lumot topilmadi',
        });
        return;
      case 'P2003': // Foreign key constraint
        reply.status(400).send({
          error: 'Bad Request',
          message: 'Bog\'liq ma\'lumot topilmadi',
        });
        return;
      default:
        request.log.error({ err: error, prismaCode: error.code }, 'Prisma error');
        reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Serverda xatolik yuz berdi. Iltimos qayta urinib ko\'ring.',
        });
        return;
    }
  }

  // Prisma validation errors (invalid data types, etc.)
  if (error instanceof Prisma.PrismaClientValidationError) {
    request.log.warn({ err: error }, 'Prisma validation error');
    reply.status(400).send({
      error: 'Bad Request',
      message: 'Noto\'g\'ri ma\'lumot formati',
    });
    return;
  }

  // Known errors
  if (statusCode < 500) {
    reply.status(statusCode).send({
      error: error.name || 'Error',
      message: error.message,
    });
    return;
  }

  // Server errors — log with request context but don't expose details
  request.log.error({
    err: error,
    method: request.method,
    url: request.url,
    userId: (request as any).user?.userId,
  }, 'Unhandled server error');
  
  reply.status(500).send({
    error: 'Internal Server Error',
    message: 'Serverda xatolik yuz berdi. Iltimos qayta urinib ko\'ring.',
  });
}

/**
 * Custom application error
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resurs') {
    super(`${resource} topilmadi`, 404);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Ruxsat yo\'q') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { softDeleteExtension } from '../middleware/soft-delete.js';

// Connection pool: production da 20, development da 5
const connectionLimit = env.NODE_ENV === 'production' ? 20 : 5;
const poolTimeout = 30; // seconds

// DATABASE_URL ga pool parametrlarini qo'shish
function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || '';
  const separator = baseUrl.includes('?') ? '&' : '?';
  // Agar allaqachon connection_limit bo'lsa, o'zgartirmaymiz
  if (baseUrl.includes('connection_limit')) return baseUrl;
  return `${baseUrl}${separator}connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}`;
}

const basePrisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasourceUrl: getDatabaseUrl(),
});

// Soft-delete extension — deletedAt bo'lgan yozuvlarni avtomatik filtrlab tashlaydi
export const prisma = basePrisma.$extends(softDeleteExtension);

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('Database disconnected');
}

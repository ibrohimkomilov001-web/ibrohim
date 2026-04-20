/**
 * ============================================
 * RBAC v2 — Seed & Migration Script
 * ============================================
 * Idempotent — istalgancha marta ishlatilsa bo'ladi, ma'lumot buzilmaydi.
 * Production-safe — faqat yangi yozuvlar qo'shadi, mavjudlarni yangilaydi.
 *
 * Qiladi:
 *   1. 21 ta tizim Role shablonini upsert qiladi (code + permissions + bitmask).
 *   2. PLATFORM singleton Organization'ni yaratadi.
 *   3. Har Shop uchun SHOP tipidagi Organization yaratadi (agar yo'q bo'lsa) va
 *      shop.organizationId ga bog'laydi.
 *   4. Har Shop egasi (ownerId) uchun shop_admin Membership yaratadi.
 *   5. Har mavjud AdminRole'ni PLATFORM'dagi mos admin_* Membership'ga ko'chiradi.
 *
 * Ishlatish:
 *   npx tsx prisma/seed-authz.ts
 */

import { PrismaClient, type OrganizationType } from '@prisma/client';
import {
  ROLE_TEMPLATES,
  type RoleTemplate,
} from '../src/lib/authz/role-templates.js';
import { permissionsToBitmaskHex } from '../src/lib/authz/permissions.js';

const prisma = new PrismaClient();

async function upsertRoleTemplates() {
  console.log('📋 Rol shablonlari yuklanmoqda...');
  let created = 0;
  let updated = 0;
  for (const t of ROLE_TEMPLATES) {
    const bitmaskHex = permissionsToBitmaskHex(t.permissions);
    const existing = await prisma.role.findUnique({ where: { code: t.code } });
    if (!existing) {
      await prisma.role.create({
        data: {
          code: t.code,
          name: t.name,
          description: t.description,
          scope: t.scope as OrganizationType,
          priority: t.priority,
          permissions: t.permissions,
          bitmaskHex,
          isSystem: true,
        },
      });
      created++;
    } else {
      await prisma.role.update({
        where: { code: t.code },
        data: {
          name: t.name,
          description: t.description,
          scope: t.scope as OrganizationType,
          priority: t.priority,
          permissions: t.permissions,
          bitmaskHex,
          isSystem: true,
        },
      });
      updated++;
    }
  }
  console.log(`  ✔  ${created} rol yaratildi, ${updated} yangilandi (jami ${ROLE_TEMPLATES.length})`);
}

async function ensurePlatformOrg() {
  console.log('🏢 PLATFORM organization tekshirilmoqda...');
  const existing = await prisma.organization.findFirst({
    where: { type: 'PLATFORM' },
  });
  if (existing) {
    console.log(`  ✔  Mavjud (id=${existing.id})`);
    return existing;
  }
  const created = await prisma.organization.create({
    data: {
      type: 'PLATFORM',
      name: 'TOPLA Platform',
      slug: 'topla-platform',
      status: 'active',
    },
  });
  console.log(`  ✔  Yaratildi (id=${created.id})`);
  return created;
}

async function migrateAdmins(platformOrgId: string) {
  console.log('👮 Admin rollari Membership\'ga ko\'chirilmoqda...');
  const adminRoles = await prisma.adminRole.findMany({
    include: { user: { select: { id: true, email: true } } },
  });

  // AdminPermissionLevel → Role.code map
  const levelToCode: Record<string, string> = {
    super_admin: 'admin_super',
    manager: 'admin_manager',
    moderator: 'admin_moderator',
    support: 'admin_support',
    viewer: 'admin_viewer',
  };

  let created = 0;
  let skipped = 0;
  for (const adminRole of adminRoles) {
    const targetCode = levelToCode[adminRole.level] || 'admin_viewer';
    const role = await prisma.role.findUnique({ where: { code: targetCode } });
    if (!role) {
      console.warn(`  ⚠  Rol topilmadi: ${targetCode}`);
      continue;
    }

    const existing = await prisma.membership.findUnique({
      where: {
        profileId_organizationId: {
          profileId: adminRole.userId,
          organizationId: platformOrgId,
        },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.membership.create({
      data: {
        profileId: adminRole.userId,
        organizationId: platformOrgId,
        roleId: role.id,
        status: 'active',
        acceptedAt: adminRole.createdAt,
        // Qo'shimcha permissionlar (agar rol shablonida yo'q bo'lsa)
        extraPermissions: adminRole.permissions.filter(
          (p) => !role.permissions.includes(p),
        ),
      },
    });
    created++;
  }
  console.log(`  ✔  ${created} admin ko'chirildi, ${skipped} avvaldan bor edi (jami ${adminRoles.length})`);
}

async function migrateShops() {
  console.log('🏬 Do\'konlar Organization + Membership\'ga ko\'chirilmoqda...');
  const shops = await prisma.shop.findMany({
    where: { organizationId: null },
    select: { id: true, name: true, ownerId: true, createdAt: true, inn: true },
  });

  const shopAdminRole = await prisma.role.findUnique({ where: { code: 'shop_admin' } });
  if (!shopAdminRole) throw new Error('shop_admin rol shabloni topilmadi');

  let orgCreated = 0;
  let membCreated = 0;
  for (const shop of shops) {
    // SHOP tipidagi Organization yaratish
    const org = await prisma.organization.create({
      data: {
        type: 'SHOP',
        name: shop.name,
        inn: shop.inn ?? null,
        status: 'active',
      },
    });
    await prisma.shop.update({
      where: { id: shop.id },
      data: { organizationId: org.id },
    });
    orgCreated++;

    // Owner uchun shop_admin Membership (owner = shop_admin, real owner keyin BUSINESS darajasida qo'shiladi)
    const existing = await prisma.membership.findUnique({
      where: {
        profileId_organizationId: {
          profileId: shop.ownerId,
          organizationId: org.id,
        },
      },
    });
    if (!existing) {
      await prisma.membership.create({
        data: {
          profileId: shop.ownerId,
          organizationId: org.id,
          roleId: shopAdminRole.id,
          status: 'active',
          acceptedAt: shop.createdAt,
        },
      });
      membCreated++;
    }
  }
  console.log(`  ✔  ${orgCreated} Organization yaratildi, ${membCreated} Membership yaratildi (${shops.length} do'kon)`);
}

async function main() {
  console.log('🚀 RBAC v2 seed boshlanmoqda...\n');
  try {
    await upsertRoleTemplates();
    const platform = await ensurePlatformOrg();
    await migrateAdmins(platform.id);
    await migrateShops();
    console.log('\n🎉 RBAC v2 seed muvaffaqiyatli tugadi!');
  } catch (err) {
    console.error('\n❌ Seed xatoligi:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

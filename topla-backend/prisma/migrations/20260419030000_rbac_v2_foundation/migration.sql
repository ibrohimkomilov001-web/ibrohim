-- ============================================
-- RBAC v2 Foundation Migration
-- ============================================
-- Yangi jadvallar: organizations, roles, memberships
-- Yangi enumlar: OrganizationType, MembershipStatus
-- Shop jadvaliga: organization_id ustuni qo'shiladi
-- MAVJUD MA'LUMOTLARNI O'ZGARTIRMAYDI. Bacckfill keyin seed-authz.ts orqali.

-- ─── Enums ───────────────────────────────────
CREATE TYPE "OrganizationType" AS ENUM ('PLATFORM', 'BUSINESS_GROUP', 'BUSINESS', 'SHOP', 'COURIER_COMPANY');
CREATE TYPE "MembershipStatus" AS ENUM ('pending', 'active', 'suspended', 'revoked');

-- ─── organizations ───────────────────────────
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "parent_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "legal_name" TEXT,
    "inn" TEXT,
    "logo_url" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE INDEX "organizations_type_parent_id_idx" ON "organizations"("type", "parent_id");
CREATE INDEX "organizations_parent_id_idx" ON "organizations"("parent_id");
ALTER TABLE "organizations"
    ADD CONSTRAINT "organizations_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "organizations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── roles ────────────────────────────────────
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "OrganizationType" NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "permissions" TEXT[],
    "bitmask_hex" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");
CREATE INDEX "roles_scope_is_system_idx" ON "roles"("scope", "is_system");

-- ─── memberships ──────────────────────────────
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'pending',
    "invited_by" UUID,
    "invited_email" TEXT,
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" TEXT,
    "invite_token_hash" TEXT,
    "extra_permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "memberships_invite_token_hash_key" ON "memberships"("invite_token_hash");
CREATE UNIQUE INDEX "memberships_profile_id_organization_id_key" ON "memberships"("profile_id", "organization_id");
CREATE INDEX "memberships_organization_id_status_idx" ON "memberships"("organization_id", "status");
CREATE INDEX "memberships_profile_id_status_idx" ON "memberships"("profile_id", "status");
CREATE INDEX "memberships_status_expires_at_idx" ON "memberships"("status", "expires_at");

ALTER TABLE "memberships"
    ADD CONSTRAINT "memberships_profile_id_fkey"
    FOREIGN KEY ("profile_id") REFERENCES "profiles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "memberships"
    ADD CONSTRAINT "memberships_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "memberships"
    ADD CONSTRAINT "memberships_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "memberships"
    ADD CONSTRAINT "memberships_invited_by_fkey"
    FOREIGN KEY ("invited_by") REFERENCES "profiles"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── shops.organization_id ────────────────────
ALTER TABLE "shops" ADD COLUMN "organization_id" UUID;
CREATE UNIQUE INDEX "shops_organization_id_key" ON "shops"("organization_id");
ALTER TABLE "shops"
    ADD CONSTRAINT "shops_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

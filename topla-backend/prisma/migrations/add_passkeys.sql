-- =====================================================
-- Migration: Add Passkeys Table for WebAuthn/FIDO2
-- =====================================================

-- Create passkeys table
CREATE TABLE IF NOT EXISTS "passkeys" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "credential_id" TEXT NOT NULL,
  "public_key" TEXT NOT NULL,
  "counter" BIGINT NOT NULL DEFAULT 0,
  "device_type" TEXT,
  "backed_up" BOOLEAN NOT NULL DEFAULT false,
  "transports" TEXT[] DEFAULT '{}',
  "device_name" TEXT,
  "last_used_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "passkeys_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "passkeys_credential_id_key" UNIQUE ("credential_id"),
  CONSTRAINT "passkeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS "passkeys_user_id_idx" ON "passkeys" ("user_id");

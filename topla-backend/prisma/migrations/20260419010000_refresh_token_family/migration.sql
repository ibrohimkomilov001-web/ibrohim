-- B2 — JWT Refresh Token Rotation + Reuse Detection
-- Adds token_version to profiles + restructures refresh_tokens to track
-- per-login family chains, jti, replaced_by relationships, revoke reasons.

-- 1. Add token_version to profiles (default 0)
ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "token_version" INTEGER NOT NULL DEFAULT 0;

-- 2. Refresh tokens table — drop legacy and recreate with new structure.
--    There are no production consumers of the old schema (it was defined but
--    unused), so a clean drop is safe.
DROP TABLE IF EXISTS "refresh_tokens" CASCADE;

CREATE TABLE "refresh_tokens" (
  "id"              UUID        NOT NULL DEFAULT gen_random_uuid(),
  "user_id"         UUID        NOT NULL,
  "jti"             TEXT        NOT NULL,
  "token_hash"      TEXT        NOT NULL,
  "family_id"       UUID        NOT NULL,
  "replaced_by_id"  UUID,
  "is_revoked"      BOOLEAN     NOT NULL DEFAULT FALSE,
  "revoked_reason"  TEXT,
  "expires_at"      TIMESTAMP(3) NOT NULL,
  "ip_address"      TEXT,
  "user_agent"      TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "refresh_tokens_jti_key"        ON "refresh_tokens"("jti");
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX        "refresh_tokens_user_revoke_idx" ON "refresh_tokens"("user_id", "is_revoked");
CREATE INDEX        "refresh_tokens_family_idx"      ON "refresh_tokens"("family_id");
CREATE INDEX        "refresh_tokens_expires_idx"     ON "refresh_tokens"("expires_at");

ALTER TABLE "refresh_tokens"
  ADD CONSTRAINT "refresh_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

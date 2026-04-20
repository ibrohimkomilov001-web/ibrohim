-- B3 — Admin Audit Log
-- Full HTTP audit trail for admin-role requests (mutating verbs).

CREATE TABLE "admin_audit_logs" (
  "id"              UUID        NOT NULL DEFAULT gen_random_uuid(),
  "actor_id"        UUID,
  "actor_email"     TEXT,
  "actor_role"      TEXT,
  "method"          TEXT        NOT NULL,
  "path"            TEXT        NOT NULL,
  "query"           JSONB,
  "body_summary"    JSONB,
  "params_summary"  JSONB,
  "status_code"     INTEGER     NOT NULL,
  "duration_ms"     INTEGER,
  "ip_address"      TEXT,
  "user_agent"      TEXT,
  "request_id"      TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_logs_actor_idx"   ON "admin_audit_logs"("actor_id", "created_at" DESC);
CREATE INDEX "admin_audit_logs_path_idx"    ON "admin_audit_logs"("path", "created_at" DESC);
CREATE INDEX "admin_audit_logs_created_idx" ON "admin_audit_logs"("created_at" DESC);

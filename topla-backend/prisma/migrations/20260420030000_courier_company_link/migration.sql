-- Phase 5: CourierCompany link
-- Adds couriers.company_id → organizations(id) ON DELETE SET NULL

ALTER TABLE "couriers"
  ADD COLUMN IF NOT EXISTS "company_id" UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'couriers_company_id_fkey'
  ) THEN
    ALTER TABLE "couriers"
      ADD CONSTRAINT "couriers_company_id_fkey"
      FOREIGN KEY ("company_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS "couriers_company_id_idx" ON "couriers"("company_id");

SELECT migration_name, finished_at IS NOT NULL AS done, rolled_back_at IS NULL AS ok FROM _prisma_migrations WHERE migration_name LIKE '20260419%' ORDER BY migration_name;
SELECT 'admin_audit_logs_exists' AS t, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='admin_audit_logs');
SELECT 'refresh_tokens_has_jti' AS t, EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='refresh_tokens' AND column_name='jti');
SELECT 'profiles_has_token_version' AS t, EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='token_version');
SELECT 'passkeys_exists' AS t, EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='passkeys');

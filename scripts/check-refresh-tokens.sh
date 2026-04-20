#!/bin/bash
docker exec topla-postgres psql -U topla_user -d topla_db -At <<'SQL'
SELECT 'refresh_tokens_count=' || COUNT(*) FROM refresh_tokens;
SELECT 'refresh_tokens_active=' || COUNT(*) FROM refresh_tokens WHERE expires_at > NOW();
SELECT 'passkeys_count=' || COUNT(*) FROM passkeys;
\d refresh_tokens
SQL

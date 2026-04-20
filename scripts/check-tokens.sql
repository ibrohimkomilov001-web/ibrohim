SELECT 'refresh_tokens_total', COUNT(*) FROM refresh_tokens;
SELECT 'refresh_tokens_active', COUNT(*) FROM refresh_tokens WHERE expires_at > NOW();
SELECT 'passkeys_total', COUNT(*) FROM passkeys;

-- Drop passkeys table (WebAuthn removed; Google + OTP + 2FA TOTP are sufficient)
DROP TABLE IF EXISTS "passkeys";

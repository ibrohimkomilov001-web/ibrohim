#!/bin/sh

echo "=== Running Prisma migrations ==="

# Try prisma migrate deploy — if it fails, start app anyway
if npx prisma migrate deploy 2>&1; then
  echo "✅ Migrations applied successfully"
else
  echo "⚠️ Migration failed — starting app anyway to restore service"
  echo "⚠️ Please manually fix migrations later"
fi

echo "=== Starting application ==="
exec node dist/app.js

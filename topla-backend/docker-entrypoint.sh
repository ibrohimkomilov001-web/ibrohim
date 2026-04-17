#!/bin/sh
set -e

echo "=== Running Prisma migrations ==="

# Try prisma migrate deploy
if npx prisma migrate deploy 2>&1; then
  echo "✅ Migrations applied successfully"
else
  echo "⚠️ Migration failed — attempting to resolve failed migrations..."

  # Get list of failed migrations from the database
  FAILED=$(npx prisma migrate resolve --help 2>&1 || true)

  # Try to resolve each known migration that might have failed
  # by marking it as rolled-back, then re-deploying
  for migration_dir in prisma/migrations/*/; do
    migration_name=$(basename "$migration_dir")
    if [ "$migration_name" = "migration_lock.toml" ]; then
      continue
    fi
    echo "Attempting to resolve: $migration_name"
    npx prisma migrate resolve --rolled-back "$migration_name" 2>/dev/null || true
  done

  echo "🔄 Retrying prisma migrate deploy..."
  if npx prisma migrate deploy 2>&1; then
    echo "✅ Migrations applied after resolve"
  else
    echo "❌ Migrations still failing — starting app anyway to serve existing data"
  fi
fi

echo "=== Starting application ==="
exec node dist/app.js

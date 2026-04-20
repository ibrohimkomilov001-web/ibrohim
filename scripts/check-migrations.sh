#!/bin/bash
# Query applied prisma migrations
docker exec topla-postgres psql -U topla_user -d topla_db -At -c 'SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 15;'
echo '---deployed migrations on disk---'
ls /home/yc-user/topla/topla-backend/prisma/migrations/ | sort

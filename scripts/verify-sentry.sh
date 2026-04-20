#!/bin/bash
set -e
echo "--- SENTRY server env ---"
docker exec topla-web sh -c 'env | grep ^SENTRY_DSN=' | awk -F= '{print $1, "len="length($2)}'
echo "--- SENTRY public env ---"
docker exec topla-web sh -c 'env | grep ^NEXT_PUBLIC_SENTRY_DSN=' | awk -F= '{print $1, "len="length($2)}'
echo "--- web container status ---"
docker ps --filter name=topla-web --format '{{.Names}} {{.Status}}'
echo "--- public health ---"
curl -fsS -o /dev/null -w 'topla.uz %{http_code}\n' https://topla.uz/
curl -fsS -o /dev/null -w 'api.topla.uz/health %{http_code}\n' https://api.topla.uz/health

#!/bin/bash
docker exec cbe387109800_topla-api sh -c '
  url="$REDIS_URL"
  colons=$(echo "$url" | awk -F: "{print NF-1}")
  echo "REDIS_URL_COLONS=$colons (>=3 means has password)"
  echo "REDIS_URL_HOST=$(echo "$url" | sed "s|.*@||" | sed "s|/.*||")"
  echo "REDIS_URL_LEN=${#REDIS_URL}"
  echo "MEILISEARCH_URL_LEN=${#MEILISEARCH_URL}"
  echo "COOKIE_SECRET_ENTRIES=$(printenv | grep -c ^COOKIE_SECRET=)"
  echo "---ALL ENV KEYS (names only)---"
  printenv | awk -F= "{print \$1}" | sort
'

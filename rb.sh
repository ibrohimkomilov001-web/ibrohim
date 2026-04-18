cd /home/yc-user/topla
echo '=== .env.local exists? ==='
sudo ls -la .env.local 2>&1
echo '=== Force rebuild web with --no-cache ==='
sudo docker compose -f docker-compose.prod.yml build --no-cache --build-arg NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lf5Fb4sAAAAAHCCs1S8BiOsAO6P1PkMvXlKu4Mu web 2>&1 | tail -5
echo '=== Recreate web ==='
sudo docker compose -f docker-compose.prod.yml up -d --force-recreate web 2>&1 | tail -3
sleep 6
echo '=== Web env ==='
sudo docker exec topla-web sh -c 'env | grep RECAPTCHA'
echo '=== Web bundle ==='
sudo docker exec topla-web sh -c 'grep -ro 6Lf5Fb4sAAAAAHCC .next/static 2>/dev/null | head -2'
echo '=== Live HTML grecaptcha script ==='
curl -sk https://manage.topla.uz/admin/login | grep -oE 'recaptcha/api[^"]*' | head -2
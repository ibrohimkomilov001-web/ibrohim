cd /home/yc-user/topla
echo '=== Try build again, show errors ==='
sudo docker compose -f docker-compose.prod.yml build --no-cache --build-arg NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lf5Fb4sAAAAAHCCs1S8BiOsAO6P1PkMvXlKu4Mu web 2>&1 | tail -40
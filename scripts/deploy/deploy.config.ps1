# TOPLA.UZ — Deploy sozlamalari
# SSH deploy uchun VM ma'lumotlari

$DeployConfig = @{
    # VM ma'lumotlari
    VmHost    = '89.169.146.228'
    VmUser    = 'yc-user'
    SshKey    = Join-Path $env:USERPROFILE '.ssh\topla-yc'

    # VM ichidagi yo'llar
    RemoteRoot      = '/home/yc-user/topla'        # deploy target
    RemoteTmp       = '/tmp'                        # arxiv uchun
    BackupRetention = 3                             # nechta eski backup saqlash

    # Deploy'ga kiritiladigan papkalar/fayllar (yuqori daraja)
    Includes = @(
        'topla-backend',
        'topla-web',
        'nginx',
        'docker-compose.prod.yml'
    )

    # Arxivdan chiqarish kerak bo'lgan narsalar (top-level exclude rsync pattern)
    # Har bir pattern `find` bilan ishlatiladi
    Excludes = @(
        'node_modules',
        '.next',
        '.git',
        'build',
        'dist',
        'coverage',
        '.turbo',
        '.vitest',
        '.cache',
        'topla_app',               # Flutter app deploy qilinmaydi
        '*.log',
        '.env',
        '.env.local',
        '.env.development'
    )

    # Health check
    HealthCheckUrl     = 'http://127.0.0.1:3001/health'
    HealthCheckRetries = 12    # 12 * 5s = 60s max
    HealthCheckDelay   = 5     # sekund
}

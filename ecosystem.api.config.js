// ╔══════════════════════════════════════════════════════════╗
// ║  SUNUCU 2: API / UYGULAMA — VPS / Cloud                ║
// ║  Bu dosya sadece API sunucusunda çalıştırılır           ║
// ╚══════════════════════════════════════════════════════════╝
module.exports = {
  apps: [
    {
      name:         'vc-api',
      script:       './apps/api/src/index.js',
      cwd:          '/opt/voicecore',
      instances:    'max',       // CPU çekirdek sayısı kadar process
      exec_mode:    'cluster',   // Yük dağılımı için cluster mode
      autorestart:  true,
      watch:        false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT:     '3000',
        // apps/api/.env dosyasından okunur
      },
      error_file:   '/var/log/voicecore/api-error.log',
      out_file:     '/var/log/voicecore/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // Graceful shutdown
      kill_timeout:    5000,
      listen_timeout:  10000,
    },
  ],
};

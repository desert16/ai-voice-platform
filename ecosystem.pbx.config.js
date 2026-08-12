// ╔══════════════════════════════════════════════════════════╗
// ║  SUNUCU 1: SANTRAL (PBX) — Debian 11 / Asterisk 22     ║
// ║  Bu dosya sadece santral sunucusunda çalıştırılır       ║
// ╚══════════════════════════════════════════════════════════╝
module.exports = {
  apps: [
    {
      name:         'vc-bridge',
      script:       './apps/bridge/src/index.js',
      cwd:          '/opt/voicecore',
      instances:    1,
      exec_mode:    'fork',
      autorestart:  true,
      watch:        false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV:          'production',
        BRIDGE_PORT:       '9092',
        // Bu değerler santral sunucusundaki apps/bridge/.env dosyasından okunur
      },
      error_file:   '/var/log/voicecore/bridge-error.log',
      out_file:     '/var/log/voicecore/bridge-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // Kritik: AudioSocket gecikme hassasiyeti için yüksek öncelik
      node_args:    '--max-old-space-size=256',
    },
    {
      name:         'vc-asterisk-manager',
      script:       './apps/asterisk-manager/src/index.js',
      cwd:          '/opt/voicecore',
      instances:    1,
      exec_mode:    'fork',
      autorestart:  true,
      watch:        false,
      max_memory_restart: '128M',
      env: {
        NODE_ENV: 'production',
        PORT:     '4001',
        // apps/asterisk-manager/.env dosyasından okunur
      },
      error_file:   '/var/log/voicecore/asterisk-manager-error.log',
      out_file:     '/var/log/voicecore/asterisk-manager-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};

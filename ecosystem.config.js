// ============================================================
// PM2 Ecosystem Config — VoiceCore Tüm Servisler
// Debian 11 Asterisk sunucusunda çalışır
// ============================================================

module.exports = {
  apps: [
    // ── Multi-Tenant AudioSocket Bridge ──────────────────────
    {
      name: 'voicecore-bridge',
      script: './apps/bridge/src/index.js',
      instances: 1,          // AudioSocket stateful — tek instance
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      env_file: './apps/bridge/.env',
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 3000,
      log_file: '/var/log/voicecore/bridge.log',
      error_file: '/var/log/voicecore/bridge-error.log',
      time: true,
    },

    // ── Asterisk Manager Servisi ──────────────────────────────
    {
      name: 'voicecore-asterisk-manager',
      script: './apps/asterisk-manager/src/index.js',
      instances: 1,
      exec_mode: 'fork',
      env_file: './apps/asterisk-manager/.env',
      watch: false,
      max_memory_restart: '256M',
      restart_delay: 3000,
      log_file: '/var/log/voicecore/asterisk-manager.log',
      error_file: '/var/log/voicecore/asterisk-manager-error.log',
      time: true,
    },

    // ── REST API Backend ──────────────────────────────────────
    {
      name: 'voicecore-api',
      script: './apps/api/src/index.js',
      instances: 'max',      // CPU core sayısı kadar worker
      exec_mode: 'cluster',
      env_file: './apps/api/.env',
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 2000,
      log_file: '/var/log/voicecore/api.log',
      error_file: '/var/log/voicecore/api-error.log',
      time: true,
    },
  ],
};

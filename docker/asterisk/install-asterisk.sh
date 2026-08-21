#!/bin/bash
# ============================================================
# VoiceCore — Debian 11 Asterisk 22 Kurulum Scripti
# Tek komutla çalıştır: sudo bash install-asterisk.sh
# ============================================================

set -e
echo "========================================"
echo " VoiceCore Asterisk 22 Kurulum Scripti"
echo "========================================"

# ── Sistem Güncellemesi ──────────────────────────────────────
apt-get update && apt-get upgrade -y
apt-get install -y curl wget gnupg2 \
    build-essential libssl-dev libxml2-dev libncurses-dev \
    libnewt-dev libsqlite3-dev libjansson-dev libedit-dev \
    uuid-dev libxslt1-dev git

# ── Asterisk 22 İndir ve Derle ───────────────────────────────
cd /usr/src
wget -q https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-22-current.tar.gz
tar xzf asterisk-22-current.tar.gz
cd asterisk-22*/

# Ön gereksinimler
./contrib/scripts/install_prereq install

# Derleme (AudioSocket ve res_pjsip dahil)
./configure --with-jansson-bundled
make menuselect.makeopts

# Gerekli modülleri etkinleştir
menuselect/menuselect \
    --enable res_pjsip \
    --enable res_pjsip_session \
    --enable res_pjsip_registrar \
    --enable res_pjsip_outbound_registration \
    --enable res_pjsip_endpoint_identifier_ip \
    --enable res_audiosocket \
    --enable app_audiosocket \
    --enable chan_pjsip \
    menuselect.makeopts

make -j$(nproc)
make install
# "make samples" olmadan asterisk.conf/logger.conf/modules.conf/stasis.conf
# gibi çekirdek config dosyaları hiç kurulmaz ve Asterisk "Module
# initialization failed" ile açılışta çöker. Kendi pjsip/extensions/manager
# config'lerimizi bundan SONRA üzerine kopyalıyoruz.
make samples
make config
make install-logrotate

# ── Dizinler Oluştur ─────────────────────────────────────────
mkdir -p /etc/asterisk/pjsip.d
mkdir -p /etc/asterisk/extensions.d
mkdir -p /var/log/asterisk
mkdir -p /var/spool/asterisk/monitor   # Ses kayıtları

# ── Config Dosyalarını Kopyala ───────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cp "$SCRIPT_DIR/pjsip.conf"      /etc/asterisk/pjsip.conf
cp "$SCRIPT_DIR/extensions.conf" /etc/asterisk/extensions.conf
cp "$SCRIPT_DIR/manager.conf"    /etc/asterisk/manager.conf

# pjsip.d / extensions.d klasörlerini içerecek placeholder — GERÇEK .conf
# uzantılı olmalı. Sadece .gitkeep bırakılırsa "#include pjsip.d/*.conf" ve
# "#include extensions.d/*.conf" boş dizinde hiçbir dosyaya eşleşmez ve
# Asterisk res_pjsip/pbx_config modüllerini "declined to load" yaparak
# TÜM pjsip/dialplan config'ini reddeder.
cat > /etc/asterisk/pjsip.d/00-placeholder.conf << 'PJPLACEHOLDER'
; Tenant aktivasyonlarında buraya tenant_<id>.conf dosyaları eklenir.
PJPLACEHOLDER

cat > /etc/asterisk/extensions.d/00-placeholder.conf << 'EXTPLACEHOLDER'
; Tenant aktivasyonlarında buraya tenant_<id>.conf dosyaları eklenir.
EXTPLACEHOLDER

# ── Asterisk Kullanıcısı ─────────────────────────────────────
if ! id asterisk >/dev/null 2>&1; then
  useradd -r -d /var/lib/asterisk -M asterisk
fi
id asterisk
chown -R asterisk:asterisk /var/lib/asterisk /var/log/asterisk \
    /var/spool/asterisk /etc/asterisk /usr/lib/asterisk

# ── Systemd Servisi ──────────────────────────────────────────
cat > /etc/systemd/system/asterisk.service << 'EOF'
[Unit]
Description=Asterisk PBX
After=network.target

[Service]
Type=simple
User=asterisk
ExecStart=/usr/sbin/asterisk -f -U asterisk
ExecStop=/usr/sbin/asterisk -rx "core stop now"
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable asterisk
systemctl start asterisk

echo ""
echo "✓ Asterisk 22 kurulumu tamamlandı!"
echo "  Durum: systemctl status asterisk"
echo "  CLI:   asterisk -rvvv"
echo ""

# ── Node.js Servisleri (bridge + asterisk-manager) ───────────
echo "Node.js servisleri kuruluyor..."

# PM2 global install
npm install -g pm2

echo ""
echo "Şimdi projeyi kurmak için:"
echo "  cd /opt/voicecore"
echo "  cp apps/bridge/.env.example apps/bridge/.env"
echo "  # .env dosyalarını düzenle"
echo "  npm install"
echo "  pm2 start ecosystem.config.js"
echo ""

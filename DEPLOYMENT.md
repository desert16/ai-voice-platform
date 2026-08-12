# VoiceCore AI Platform — Tam Kurulum Kılavuzu

## Sunucu Mimarisi

```
[MÜŞTERİ TELEFONU]
       │ SIP (5060) / RTP (10000-20000)
       ▼
┌──────────────────────────────────────────┐
│  SUNUCU 1: SANTRAL (PBX)                │
│  Debian 11 — Sabit IP gerekli           │
│                                          │
│  Servisler:                              │
│  ├─ Asterisk 22    (5060, 10000-20000)  │
│  ├─ Bridge         (9092 — DAHİLİ)      │
│  └─ AsteriskMgr   (4001 — DAHİLİ)      │
│                                          │
│  Dışarıya açık portlar: 5060, 10000-20000│
│  Kapalı: 4001, 9092 (sadece lokal)      │
└──────────────┬───────────────────────────┘
               │ Private ağ veya sabit IP
               │ HTTPS → api.voicecore.ai
               ▼
┌──────────────────────────────────────────┐
│  SUNUCU 2: API / PANEL                  │
│  Ubuntu 22.04 VPS — Sabit IP + Domain   │
│                                          │
│  Servisler:                              │
│  ├─ Express API   (3000 → Nginx 443)    │
│  ├─ PostgreSQL    (5432 — DAHİLİ)      │
│  ├─ Redis         (6379 — DAHİLİ/Private)│
│  └─ Web Panel     (Nginx 443)           │
│                                          │
│  Dışarıya açık: 80, 443                │
│  Kapalı: 3000, 5432, 6379              │
└──────────────────────────────────────────┘
```

---

## SUNUCU 1: SANTRAL KURULUMU

### 1.1 Ön Gereksinimler
```bash
# Debian 11 root erişimi ile:
apt update && apt upgrade -y
apt install -y git curl build-essential
```

### 1.2 Asterisk 22 Kurulumu
```bash
# Proje reposunu çek
git clone https://github.com/KULLANICI/ai-voice-platform.git /opt/voicecore
cd /opt/voicecore

# Kurulum scriptini çalıştır (Asterisk 22 + gerekli modüller)
chmod +x install-asterisk.sh
bash install-asterisk.sh

# Kurulum ~10-15 dakika sürer
# Tamamlanınca doğrula:
asterisk -rx "core show version"
# → Asterisk 22.x.x çıktısı görmeli
```

### 1.3 Node.js 20 Kurulumu
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version  # v20.x.x görmeli
```

### 1.4 PM2 Kurulumu
```bash
npm install -g pm2
pm2 --version
```

### 1.5 Bridge Servisi
```bash
cd /opt/voicecore/apps/bridge
npm install

# .env oluştur
cp .env.example .env
nano .env
```

**`apps/bridge/.env` içeriği:**
```env
NODE_ENV=production
BRIDGE_PORT=9092
REDIS_URL=redis://:voicecore_redis_2024@API_SUNUCU_IP:6379
API_SERVER_URL=https://api.voicecore.ai
GEMINI_API_KEY=AIza...
```

### 1.6 Asterisk Manager Servisi
```bash
cd /opt/voicecore/apps/asterisk-manager
npm install

cp .env.example .env
nano .env
```

**`apps/asterisk-manager/.env` içeriği:**
```env
NODE_ENV=production
PORT=4001
AMI_HOST=127.0.0.1
AMI_PORT=5038
AMI_USER=voicecore_ami
AMI_PASSWORD=ami_secret_2024
SERVICE_TOKEN=voicecore_internal_service_token
ASTERISK_CONF_DIR=/etc/asterisk
```

### 1.7 Asterisk Yapılandırması
```bash
# Hazır config dosyalarını kopyala
cp /opt/voicecore/docker/asterisk/pjsip.conf      /etc/asterisk/
cp /opt/voicecore/docker/asterisk/extensions.conf  /etc/asterisk/
cp /opt/voicecore/docker/asterisk/manager.conf     /etc/asterisk/

# Sahipliği ayarla
chown asterisk:asterisk /etc/asterisk/*.conf

# Asterisk'i yeniden başlat
systemctl restart asterisk
asterisk -rx "module reload"

# Doğrula
asterisk -rx "pjsip show endpoints"
```

### 1.8 Log Dizini ve PM2 Başlatma
```bash
mkdir -p /var/log/voicecore

cd /opt/voicecore
pm2 start ecosystem.pbx.config.js

# PM2'yi sistem başlangıcına ekle
pm2 save
pm2 startup
# Çıktıdaki komutu çalıştır

# Durumu kontrol et
pm2 status
# vc-bridge ve vc-asterisk-manager "online" görmeli
```

### 1.9 Güvenlik Duvarı (UFW)
```bash
ufw enable
ufw allow 22/tcp        # SSH
ufw allow 5060/tcp      # SIP TCP
ufw allow 5060/udp      # SIP UDP
ufw allow 5061/tcp      # SIP TLS
ufw allow 10000:20000/udp  # RTP medya

# 4001 ve 9092 portlarını SADECE API sunucusuna aç
ufw allow from API_SUNUCU_IP to any port 4001 proto tcp
# 9092 tamamen kapalı (lokal AudioSocket)

ufw status verbose
```

---

## SUNUCU 2: API / PANEL KURULUMU

### 2.1 Ön Gereksinimler
```bash
# Ubuntu 22.04 root erişimi ile:
apt update && apt upgrade -y
apt install -y git curl nginx certbot python3-certbot-nginx
```

### 2.2 Docker Kurulumu (PostgreSQL + Redis için)
```bash
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# Docker Compose
apt install -y docker-compose
docker --version
docker-compose --version
```

### 2.3 Node.js 20 ve PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2
```

### 2.4 Repo ve Veritabanı
```bash
git clone https://github.com/KULLANICI/ai-voice-platform.git /opt/voicecore
cd /opt/voicecore

# PostgreSQL + Redis'i başlat
docker-compose up -d postgres redis

# Kontrol
docker ps
# voicecore-postgres ve voicecore-redis "Up" görmeli
```

### 2.5 Prisma Migration ve Seed
```bash
cd /opt/voicecore/packages/db
npm install

# Veritabanı şemasını uygula
npx prisma migrate deploy

# İlk admin kullanıcısını oluştur
node src/seed.js

# Çıktı:
# → Admin Email: admin@voicecore.ai
# → Password:    admin123
```

### 2.6 API Servisi
```bash
cd /opt/voicecore/apps/api
npm install

cp .env.example .env
nano .env
```

**`apps/api/.env` içeriği:**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://voicecore:voicecore_secret_2024@127.0.0.1:5432/voicecore
REDIS_URL=redis://:voicecore_redis_2024@127.0.0.1:6379
JWT_SECRET=GUCLU_RASTGELE_SECRET_BURAYA
ASTERISK_MANAGER_URL=http://SANTRAL_SUNUCU_IP:4001
SERVICE_TOKEN=voicecore_internal_service_token
GEMINI_API_KEY=AIza...
```

### 2.7 Web Panel Build
```bash
cd /opt/voicecore/apps/web
npm install

# .env oluştur
echo "VITE_API_BASE_URL=https://api.voicecore.ai/api" > .env

# Production build
npm run build
# → dist/ klasörü oluşur
```

### 2.8 Nginx Yapılandırması
```bash
# API için
cat > /etc/nginx/sites-available/voicecore-api << 'EOF'
server {
    listen 80;
    server_name api.voicecore.ai;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.voicecore.ai;

    ssl_certificate     /etc/letsencrypt/live/api.voicecore.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.voicecore.ai/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;

        # SSE için (AI wizard streaming)
        proxy_buffering    off;
        proxy_read_timeout 300s;
    }
}
EOF

# Panel için
cat > /etc/nginx/sites-available/voicecore-panel << 'EOF'
server {
    listen 80;
    server_name panel.voicecore.ai;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name panel.voicecore.ai;

    ssl_certificate     /etc/letsencrypt/live/panel.voicecore.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/panel.voicecore.ai/privkey.pem;

    root /opt/voicecore/apps/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain application/javascript text/css application/json;
}
EOF

ln -s /etc/nginx/sites-available/voicecore-api   /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/voicecore-panel  /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 2.9 SSL Sertifikaları
```bash
certbot --nginx -d api.voicecore.ai -d panel.voicecore.ai
# E-posta gir, şartları kabul et

# Otomatik yenileme test et
certbot renew --dry-run
```

### 2.10 PM2 ile API Başlat
```bash
mkdir -p /var/log/voicecore
cd /opt/voicecore

pm2 start ecosystem.api.config.js
pm2 save
pm2 startup

pm2 status
# vc-api "online" görünmeli (cluster mode, çoklu instance)
```

### 2.11 Güvenlik Duvarı
```bash
ufw enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (Nginx yönlendirir)
ufw allow 443/tcp   # HTTPS

# Redis'i santral IP'sine aç (bridge bağlantısı için)
ufw allow from SANTRAL_SUNUCU_IP to any port 6379

# Diğer her şey kapalı
ufw status verbose
```

---

## 3. Uçtan Uca Test

```bash
# API sağlık kontrolü
curl https://api.voicecore.ai/health
# → {"status":"ok"}

# Santral durumu
asterisk -rx "pjsip show endpoints"
pm2 status

# Panel erişimi
# Tarayıcıda: https://panel.voicecore.ai
# Giriş: admin@voicecore.ai / admin123
```

### Çağrı Testi
1. Panel → Hızlı Kurulum → SIP trunk bilgilerini gir
2. Trunk'ı aktifleştir (numara sağlayıcınızdan numara aktif etmelisiniz)
3. O numarayı telefondan ara
4. AI ajan Türkçe karşılamalı

---

## 4. Sorun Giderme

```bash
# Bridge logları
pm2 logs vc-bridge

# API logları
pm2 logs vc-api

# Asterisk logları
tail -f /var/log/asterisk/messages

# Redis bağlantı testi (santral sunucusundan)
redis-cli -h API_SUNUCU_IP -p 6379 -a voicecore_redis_2024 ping
# → PONG

# Veritabanı bağlantı testi
psql postgresql://voicecore:voicecore_secret_2024@127.0.0.1:5432/voicecore -c "SELECT 1"
```

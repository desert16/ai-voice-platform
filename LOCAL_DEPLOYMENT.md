# VoiceCore — Lokal İki Sunucu Kurulum Kılavuzu

## Ağ Haritası

```
Lokal Ağ (192.168.1.0/24)
─────────────────────────────────────────────────────
  SUNUCU 1 (PBX)           SUNUCU 2 (API/Panel)
  IP: 192.168.1.10          IP: 192.168.1.20
  ─────────────────         ─────────────────────
  Asterisk 22 :5060         Express API    :3000
  Bridge      :9092         PostgreSQL     :5432
  AsteriskMgr :4001    <->  Redis          :6379
                            Web Panel      :5173
─────────────────────────────────────────────────────
Bilgisayarınız (Windows)
  SSH ile sunuculara baglanir
  Tarayici ile http://192.168.1.20:5173 paneli acar
```

---

## ADIM 1 — Debian 11 Temel Kurulum (Her İki Sunucu)

```bash
# Her iki sunucuda sirayla yapın
apt update && apt upgrade -y
apt install -y git curl wget nano net-tools ufw \
               build-essential ca-certificates \
               apt-transport-https gnupg2

# Saat dilimi
timedatectl set-timezone Europe/Istanbul
```

---

## ADIM 2 — Sabit IP Adresi

```bash
# Ag arayzunu ogrenin
ip addr show
# eth0 ya da ens3 gibi bir ad gorunur

nano /etc/network/interfaces
```

**Sunucu 1 (PBX) icin:**
```
auto eth0
iface eth0 inet static
    address 192.168.1.10
    netmask 255.255.255.0
    gateway 192.168.1.1
    dns-nameservers 8.8.8.8 8.8.4.4
```

**Sunucu 2 (API) icin:**
```
auto eth0
iface eth0 inet static
    address 192.168.1.20
    netmask 255.255.255.0
    gateway 192.168.1.1
    dns-nameservers 8.8.8.8 8.8.4.4
```

```bash
systemctl restart networking
ip addr show eth0   # IP gorunmeli
```

---

## ADIM 3 — Node.js + PM2 + Git (Her İki Sunucu)

```bash
# Her iki sunucuda yapın
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2

git clone https://github.com/KULLANICI/ai-voice-platform.git /opt/voicecore
mkdir -p /var/log/voicecore
```

---

## ADIM 4 — SUNUCU 2: Docker + PostgreSQL + Redis

```bash
# [SUNUCU 2 - 192.168.1.20]
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
apt install -y docker-compose

cd /opt/voicecore/docker
docker-compose up -d postgres redis pgadmin

docker ps
# voicecore_postgres ve voicecore_redis "Up" gorunmeli
```

---

## ADIM 5 — SUNUCU 2: Veritabani Kurulumu

```bash
# [SUNUCU 2]
cd /opt/voicecore/packages/db
npm install
npx prisma migrate deploy
node src/seed.js
# Cikti: admin@voicecore.ai / admin123
```

---

## ADIM 6 — SUNUCU 2: API Servisi

```bash
# [SUNUCU 2]
cd /opt/voicecore/apps/api
npm install
cp .env.example .env
nano .env
```

**.env degerleri:**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://voicecore:voicecore_secret_2024@127.0.0.1:5432/voicecore
REDIS_URL=redis://:voicecore_redis_2024@127.0.0.1:6379
JWT_SECRET=degistirin_guclu_bir_secret
ASTERISK_MANAGER_URL=http://192.168.1.10:4001
SERVICE_TOKEN=voicecore_internal_service_token_2024
GEMINI_API_KEY=AIza_GEMINI_KEY
```

```bash
cd /opt/voicecore
pm2 start ecosystem.api.config.js
pm2 save && pm2 startup

# Test (Windows PowerShell'den):
# curl http://192.168.1.20:3000/health
# -> {"status":"ok"}
```

---

## ADIM 7 — SUNUCU 2: Web Panel

```bash
# [SUNUCU 2]
cd /opt/voicecore/apps/web
npm install
echo "VITE_API_BASE_URL=http://192.168.1.20:3000/api" > .env
npm run build

# Panel'i sun
npm install -g serve
pm2 serve /opt/voicecore/apps/web/dist 5173 --name vc-panel --spa
pm2 save
```

**Erisim:** `http://192.168.1.20:5173`

---

## ADIM 8 — SUNUCU 1: Asterisk 22 Kurulumu

```bash
# [SUNUCU 1 - 192.168.1.10]
cd /opt/voicecore
chmod +x install-asterisk.sh
bash install-asterisk.sh   # ~15 dakika

asterisk -rx "core show version"   # Asterisk 22.x.x gorunmeli

systemctl enable asterisk
systemctl start asterisk
```

---

## ADIM 9 — SUNUCU 1: Asterisk Yapilandirmasi

```bash
# [SUNUCU 1]
cp /opt/voicecore/docker/asterisk/pjsip.conf      /etc/asterisk/
cp /opt/voicecore/docker/asterisk/extensions.conf  /etc/asterisk/
cp /opt/voicecore/docker/asterisk/manager.conf     /etc/asterisk/

chown asterisk:asterisk /etc/asterisk/pjsip.conf \
                        /etc/asterisk/extensions.conf \
                        /etc/asterisk/manager.conf

asterisk -rx "core reload"
asterisk -rx "manager show connected"
```

---

## ADIM 10 — SUNUCU 1: Bridge + AsteriskMgr

```bash
# [SUNUCU 1] Bridge
cd /opt/voicecore/apps/bridge
npm install
cp .env.example .env
nano .env
```

**Bridge .env:**
```
NODE_ENV=production
BRIDGE_PORT=9092
BRIDGE_HOST=0.0.0.0
REDIS_HOST=192.168.1.20
REDIS_PORT=6379
REDIS_PASSWORD=voicecore_redis_2024
API_SERVER_URL=http://192.168.1.20:3000
GEMINI_API_KEY=AIza_GEMINI_KEY
DEFAULT_SYSTEM_PROMPT=Sen VoiceCore AI'in sesli asistanisin. Kisa ve dogal Turkce konuş.
```

```bash
# [SUNUCU 1] Asterisk Manager
cd /opt/voicecore/apps/asterisk-manager
npm install
cp .env.example .env
nano .env
```

**AsteriskMgr .env:**
```
NODE_ENV=production
PORT=4001
AMI_HOST=127.0.0.1
AMI_PORT=5038
AMI_USER=voicecore_ami
AMI_SECRET=ami_secret_2024
REDIS_HOST=192.168.1.20
REDIS_PORT=6379
REDIS_PASSWORD=voicecore_redis_2024
ASTERISK_CONF_DIR=/etc/asterisk
SERVICE_TOKEN=voicecore_internal_service_token_2024
```

```bash
cd /opt/voicecore
pm2 start ecosystem.pbx.config.js
pm2 save && pm2 startup
pm2 status
# vc-bridge ve vc-asterisk-manager "online" gorunmeli
```

---

## ADIM 11 — Guvenlik Duvari

**Sunucu 1 (PBX):**
```bash
ufw enable
ufw allow from 192.168.1.0/24 to any port 22
ufw allow 5060/tcp && ufw allow 5060/udp
ufw allow 10000:20000/udp
ufw allow from 192.168.1.20 to any port 4001   # Sadece API'den
ufw status verbose
```

**Sunucu 2 (API):**
```bash
ufw enable
ufw allow from 192.168.1.0/24 to any port 22
ufw allow from 192.168.1.0/24 to any port 3000  # API (lokal)
ufw allow from 192.168.1.0/24 to any port 5173  # Panel (lokal)
ufw allow from 192.168.1.10 to any port 6379    # Redis: sadece PBX
ufw status verbose
```

---

## ADIM 12 — Uctan Uca Dogrulama

```bash
# [SUNUCU 1] Redis baglantisi test
redis-cli -h 192.168.1.20 -p 6379 -a voicecore_redis_2024 ping
# -> PONG

# [SUNUCU 1] API baglantisi test
curl http://192.168.1.20:3000/health
# -> {"status":"ok"}

# [SUNUCU 2] AsteriskMgr baglantisi test
curl http://192.168.1.10:4001/health
# -> {"status":"ok"}
```

---

## Hizli Basvuru Tablosu

| Servis | Sunucu | Adres |
|--------|--------|-------|
| Web Panel | Sunucu 2 | http://192.168.1.20:5173 |
| API | Sunucu 2 | http://192.168.1.20:3000 |
| pgAdmin | Sunucu 2 | http://192.168.1.20:5050 |
| Admin Girisi | — | admin@voicecore.ai / admin123 |
| pgAdmin Girisi | — | admin@voicecore.local / admin123 |

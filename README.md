# VoiceCore AI Voice Platform

Multi-tenant AI sesli ajan platformu. Asterisk 22 + Gemini Live API tabanlı.

## Mimari

```
┌─────────────────────────────────────────────────────┐
│                  Debian 11 Sunucusu                  │
│                                                      │
│  ┌──────────────┐    ┌─────────────────────────┐    │
│  │  Asterisk 22  │    │   voicecore-bridge      │    │
│  │  (SIP/PJSIP)  │◄──►│   (AudioSocket:9092)    │    │
│  └──────┬───────┘    └───────────┬─────────────┘    │
│         │                        │                   │
│  ┌──────▼───────┐    ┌───────────▼─────────────┐    │
│  │asterisk-mgr  │    │      Gemini Live API     │    │
│  │   :4001      │    │  (Per-tenant session)    │    │
│  └──────┬───────┘    └─────────────────────────┘    │
│         │                                            │
│  ┌──────▼───────────────────────────────────┐       │
│  │  PostgreSQL + Redis                       │       │
│  └──────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
         │
┌────────▼────────────────────┐
│  voicecore-api  :3000        │  REST API
│  voicecore-web  :5173/80     │  React Panel
└─────────────────────────────┘
```

## Hızlı Başlangıç

### 1. Veritabanı ve Redis (Docker)

```bash
cd docker
docker compose up -d
```

### 2. Paketleri Yükle

```bash
npm install
npm run db:generate
npm run db:migrate
```

### 3. Asterisk Kurulumu (Debian 11)

```bash
sudo bash docker/asterisk/install-asterisk.sh
```

### 4. Konfigürasyon

Her servis için `.env.example` dosyasını `.env` olarak kopyalayın:

```bash
cp apps/bridge/.env.example apps/bridge/.env
cp apps/api/.env.example apps/api/.env
cp apps/asterisk-manager/.env.example apps/asterisk-manager/.env
```

`.env` dosyalarındaki değerleri düzenleyin:
- `GEMINI_API_KEY` → Google AI Studio'dan alın
- `SERVICE_TOKEN` → Güçlü rastgele bir token
- `JWT_SECRET` → Güçlü rastgele bir secret

### 5. Servisleri Başlat (PM2)

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Asterisk Dosyalarını Kopyala

```bash
sudo cp docker/asterisk/pjsip.conf /etc/asterisk/pjsip.conf
sudo cp docker/asterisk/extensions.conf /etc/asterisk/extensions.conf
sudo cp docker/asterisk/manager.conf /etc/asterisk/manager.conf
sudo mkdir -p /etc/asterisk/pjsip.d /etc/asterisk/extensions.d
sudo systemctl restart asterisk
```

## Multi-Tenant Akışı

```
Müşteri satın alır
       ↓
Panel: SIP Trunk bilgileri girilir
       ↓
API: POST /tenants/:id/sip-trunks/activate
       ↓
asterisk-manager: /etc/asterisk/pjsip.d/tenant_XXX.conf yazar
asterisk-manager: Asterisk reload
       ↓
Müşteri numarasından arama gelir
       ↓
Asterisk → extensions.d/tenant_XXX.conf → UserEvent (UUID + TenantID)
       ↓
asterisk-manager: Redis.set("tenant:uuid:UUID", tenantId, EX 300)
       ↓
AudioSocket → bridge.js → UUID oku → Redis'ten tenantId bul
       ↓
Redis'ten tenant config çek (systemPrompt, agentId)
       ↓
Gemini Live session aç → konuşma başlar ✓
```

## Servisler

| Servis | Port | Açıklama |
|--------|------|----------|
| voicecore-api | 3000 | REST API |
| voicecore-bridge | 9092 | AudioSocket (Asterisk'ten) |
| voicecore-asterisk-manager | 4001 | Internal — trunk yönetimi |
| voicecore-web | 5173 | React Panel (dev) / 80 (prod) |
| PostgreSQL | 5432 | Veritabanı |
| Redis | 6379 | Cache & UUID mapping |
| pgAdmin | 5050 | DB yönetim paneli |

## Proje Yapısı

```
ai-voice-platform/
├── apps/
│   ├── bridge/              # AudioSocket ↔ Gemini köprüsü
│   ├── api/                 # REST API backend
│   ├── web/                 # React müşteri paneli
│   └── asterisk-manager/    # pjsip.conf yönetimi
├── packages/
│   └── db/                  # Prisma schema
├── docker/
│   ├── docker-compose.yml
│   └── asterisk/            # Asterisk config dosyaları
└── ecosystem.config.js      # PM2 config
```

// ============================================================================
// Asterisk AMI (Asterisk Manager Interface) Client
// Asterisk komutlarını uzaktan yürütür: reload, status, vb.
// ============================================================================

const AsteriskManager = require('asterisk-manager');

let amiClient = null;

function createAmiClient() {
  const client = new AsteriskManager(
    parseInt(process.env.AMI_PORT || '5038'),
    process.env.AMI_HOST || '127.0.0.1',
    process.env.AMI_USER || 'voicecore',
    process.env.AMI_SECRET || 'voicecore_ami_secret',
    true  // events
  );

  client.on('connect', () => {
    console.log('[AMI] Asterisk Manager bağlantısı kuruldu ✓');
  });

  client.on('error', (err) => {
    console.error(`[AMI ERROR] ${err.message}`);
  });

  client.on('close', () => {
    console.log('[AMI] Bağlantı kapandı, yeniden bağlanılıyor...');
    setTimeout(() => client.connect(), 5000);
  });

  // VoicecoreCall UserEvent dinle → Redis'e UUID:TenantID yaz
  client.on('userevent', (event) => {
    if (event.event === 'Userevent' && event.userevent === 'VoicecoreCall') {
      handleVoicecoreCallEvent(event);
    }
  });

  client.keepConnected();
  return client;
}

async function handleVoicecoreCallEvent(event) {
  // event örn: { tenantid: 'clxxx', uuid: 'abc123-...', callerid: '905XXXXXXXXX' }
  const tenantId = event.tenantid;
  const rawUuid  = event.uuid;

  if (!tenantId || !rawUuid) return;

  // AudioSocket, UUID'yi Asterisk'e binary (16 byte) olarak yollar; bridge tarafı
  // bunu payload.toString('hex') ile tiresiz/küçük harf 32 karaktere çeviriyor.
  // Redis key'inin bridge'in aradığı formatla birebir eşleşmesi için burada da
  // aynı normalizasyonu yapıyoruz (tireleri at, küçük harfe çevir).
  const uuid = rawUuid.replace(/-/g, '').toLowerCase();

  try {
    const { getRedisClient } = require('./index');
    const redis = getRedisClient();
    // 5 dakika TTL — çağrı bu sürede başlayacaktır
    await redis.setex(`tenant:uuid:${uuid}`, 300, tenantId);
    console.log(`[AMI] UUID map: ${uuid.substring(0, 8)}... → ${tenantId}`);
  } catch (e) {
    console.error(`[AMI] Redis yazma hatası: ${e.message}`);
  }
}

// Asterisk'i pjsip için reload yap
function reloadPjsip() {
  return new Promise((resolve, reject) => {
    if (!amiClient) {
      reject(new Error('AMI client başlatılmamış'));
      return;
    }

    amiClient.action(
      { Action: 'Command', Command: 'pjsip reload' },
      (err, res) => {
        if (err) {
          console.error('[AMI] pjsip reload hatası:', err);
          reject(err);
        } else {
          console.log('[AMI] pjsip reload başarılı ✓');
          resolve(res);
        }
      }
    );
  });
}

// Dialplan reload
function reloadDialplan() {
  return new Promise((resolve, reject) => {
    if (!amiClient) {
      reject(new Error('AMI client başlatılmamış'));
      return;
    }

    amiClient.action(
      { Action: 'Command', Command: 'dialplan reload' },
      (err, res) => {
        if (err) {
          console.error('[AMI] dialplan reload hatası:', err);
          reject(err);
        } else {
          console.log('[AMI] dialplan reload başarılı ✓');
          resolve(res);
        }
      }
    );
  });
}

// Trunk kayıt durumunu sorgula
function getTrunkStatus(tenantId) {
  const safeId = tenantId.replace(/[^a-zA-Z0-9_]/g, '_');
  return new Promise((resolve) => {
    if (!amiClient) { resolve({ status: 'unknown' }); return; }

    amiClient.action(
      { Action: 'Command', Command: `pjsip show registration registration-${safeId}` },
      (err, res) => {
        if (err) { resolve({ status: 'error', error: err.message }); return; }
        const output = res?.output?.join('') || '';
        const registered = output.includes('Registered');
        resolve({
          status: registered ? 'ACTIVE' : 'INACTIVE',
          raw: output,
        });
      }
    );
  });
}

function initAmi() {
  amiClient = createAmiClient();
  return amiClient;
}

function getAmiClient() {
  return amiClient;
}

module.exports = { initAmi, getAmiClient, reloadPjsip, reloadDialplan, getTrunkStatus };

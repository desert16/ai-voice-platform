// ============================================================================
// pjsip Config Generator — Multi-Tenant Asterisk 22
// ============================================================================
// Her tenant için /etc/asterisk/pjsip.d/tenant_<ID>.conf dosyası üretir.
// Registration tipi: kullanıcı adı/şifre ile dışarıya kayıt olur.
// ============================================================================

const fs = require('fs');
const path = require('path');

const PJSIP_DIR    = process.env.PJSIP_DIR    || '/etc/asterisk/pjsip.d';
const DIALPLAN_DIR = process.env.DIALPLAN_DIR  || '/etc/asterisk/extensions.d';
const BRIDGE_HOST  = process.env.BRIDGE_HOST   || '127.0.0.1';
const BRIDGE_PORT  = process.env.BRIDGE_PORT   || '9092';

// ──────────────────────────────────────────────
// pjsip.conf tenant dosyası içeriği
// Registration tipi: SIP provider'a outbound register
// ──────────────────────────────────────────────
function generatePjsipConfig(tenant) {
  const {
    id,          // tenantId (kısa, cuid)
    sipUsername,
    sipPassword,
    sipHost,
    sipPort = 5060,
    phoneNumber,
    label = '',
  } = tenant;

  // Asterisk config için güvenli ID (özel karakter yok)
  const safeId = id.replace(/[^a-zA-Z0-9_]/g, '_');

  return `; ============================================================
; VoiceCore Tenant: ${safeId}
; Firma: ${label}
; Numara: ${phoneNumber}
; Otomatik oluşturuldu — elle düzenlemeyin
; ============================================================

; ── OUTBOUND AUTH ─────────────────────────────────────────────
[auth-${safeId}]
type=auth
auth_type=userpass
username=${sipUsername}
password=${sipPassword}

; ── AOR (Address of Record) ───────────────────────────────────
[aor-${safeId}]
type=aor
contact=sip:${sipUsername}@${sipHost}:${sipPort}
qualify_frequency=30
remove_existing=yes
max_contacts=1

; ── ENDPOINT ──────────────────────────────────────────────────
[endpoint-${safeId}]
type=endpoint
context=voicecore-${safeId}
outbound_auth=auth-${safeId}
aors=aor-${safeId}
dtmf_mode=rfc4733
disallow=all
allow=ulaw
; Tenant ID'yi dialplan'a taşı
set_var=TENANT_ID=${id}
; Çağrı kaydı
record_on_feature=automixmon
rtp_symmetric=yes
force_rport=yes
rewrite_contact=yes

; ── INBOUND IDENTIFY (Gelen çağrıda endpoint eşleştirme) ──────
[identify-${safeId}]
type=identify
endpoint=endpoint-${safeId}
match=${sipHost}

; ── OUTBOUND REGISTRATION ─────────────────────────────────────
; Müşterinin SIP provider'ına bu Asterisk'i register eder
[registration-${safeId}]
type=registration
transport=transport-udp
outbound_auth=auth-${safeId}
server_uri=sip:${sipHost}:${sipPort}
client_uri=sip:${sipUsername}@${sipHost}:${sipPort}
contact_user=${sipUsername}
retry_interval=60
forbidden_retry_interval=600
expiration=3600
max_retries=10
line=yes
endpoint=endpoint-${safeId}
`;
}

// ──────────────────────────────────────────────
// extensions.conf (dialplan) tenant dosyası
// ──────────────────────────────────────────────
function generateDialplan(tenant) {
  const { id, phoneNumber } = tenant;
  const safeId = id.replace(/[^a-zA-Z0-9_]/g, '_');

  return `; ============================================================
; VoiceCore Dialplan: tenant ${safeId}
; Numara: ${phoneNumber}
; ============================================================

[voicecore-${safeId}]

; Gelen tüm çağrıları AudioSocket köprüsüne yönlendir
exten => _X.,1,NoOp(=== VoiceCore Tenant: ${safeId} ===)
 same => n,Answer()
 same => n,Wait(0.5)
 same => n,Set(TENANT_ID=${id})
 same => n,Set(CALL_UUID=\${UUID()})
 same => n,UserEvent(VoicecoreCall,TenantID: ${id},UUID: \${CALL_UUID},CallerID: \${CALLERID(num)})
 same => n,AudioSocket(\${CALL_UUID},${BRIDGE_HOST}:${BRIDGE_PORT})
 same => n,Hangup()

; Doğrudan numara eşleşmesi (opsiyonel)
exten => ${phoneNumber || '_X.'},1,Goto(voicecore-${safeId},_X.,1)
`;
}

// ──────────────────────────────────────────────
// Dosya yaz / sil
// ──────────────────────────────────────────────
function getPjsipFilePath(tenantId) {
  const safeId = tenantId.replace(/[^a-zA-Z0-9_]/g, '_');
  return path.join(PJSIP_DIR, `tenant_${safeId}.conf`);
}

function getDialplanFilePath(tenantId) {
  const safeId = tenantId.replace(/[^a-zA-Z0-9_]/g, '_');
  return path.join(DIALPLAN_DIR, `tenant_${safeId}.conf`);
}

function writeTenantConfig(tenant) {
  const pjsipPath    = getPjsipFilePath(tenant.id);
  const dialplanPath = getDialplanFilePath(tenant.id);

  fs.writeFileSync(pjsipPath,    generatePjsipConfig(tenant),  'utf8');
  fs.writeFileSync(dialplanPath, generateDialplan(tenant),      'utf8');

  console.log(`[CONFIG] Yazıldı: ${pjsipPath}`);
  console.log(`[CONFIG] Yazıldı: ${dialplanPath}`);

  return { pjsipPath, dialplanPath };
}

function deleteTenantConfig(tenantId) {
  const pjsipPath    = getPjsipFilePath(tenantId);
  const dialplanPath = getDialplanFilePath(tenantId);

  [pjsipPath, dialplanPath].forEach((f) => {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
      console.log(`[CONFIG] Silindi: ${f}`);
    }
  });
}

module.exports = {
  generatePjsipConfig,
  generateDialplan,
  writeTenantConfig,
  deleteTenantConfig,
  getPjsipFilePath,
  getDialplanFilePath,
};

// ============================================================================
// DB Helper — Bridge için minimal Prisma operasyonları
// ============================================================================

const { PrismaClient } = require('@prisma/client');

let prisma;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error'],
      datasources: {
        db: { url: process.env.DATABASE_URL },
      },
    });
  }
  return prisma;
}

// Yeni çağrı başlat — DB'ye kayıt aç, callId döner
async function startCall({ tenantId, asteriskUuid, agentId, callerNumber, calledNumber }) {
  if (!tenantId) return null;

  try {
    const call = await getPrisma().call.create({
      data: {
        tenantId,
        asteriskUuid,
        agentId: agentId || null,
        callerNumber: callerNumber || null,
        calledNumber: calledNumber || null,
        status: 'ACTIVE',
        startedAt: new Date(),
      },
      select: { id: true },
    });
    return call.id;
  } catch (e) {
    console.error(`[DB] startCall hatası: ${e.message}`);
    return null;
  }
}

// Çağrı bitişini kaydet
async function endCall(callId) {
  if (!callId) return;

  try {
    const call = await getPrisma().call.findUnique({
      where: { id: callId },
      select: { startedAt: true },
    });

    const endedAt = new Date();
    const duration = call
      ? Math.round((endedAt - call.startedAt) / 1000)
      : null;

    await getPrisma().call.update({
      where: { id: callId },
      data: { status: 'COMPLETED', endedAt, duration },
    });
  } catch (e) {
    console.error(`[DB] endCall hatası: ${e.message}`);
  }
}

// Transkript satırı kaydet
async function saveTranscript({ callId, speaker, text, durationMs }) {
  if (!callId || !text?.trim()) return;

  try {
    await getPrisma().transcript.create({
      data: {
        callId,
        speaker,
        text: text.trim(),
        durationMs: durationMs || null,
        timestamp: new Date(),
      },
    });
  } catch (e) {
    console.error(`[DB] saveTranscript hatası: ${e.message}`);
  }
}

module.exports = { startCall, endCall, saveTranscript };

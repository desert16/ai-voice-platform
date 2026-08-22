// apps/api/src/ai/contextBuilder.js
// AI Context Builder — Tenant + Sektör + Plan + Modüller + Tools + SystemPrompt birleştirir
const { PrismaClient } = require('@prisma/client');
const { ALL_TOOLS } = require('./tools/definitions');

const prisma = new PrismaClient();

/**
 * Tenant'ın aktif modüllerine göre tool listesi filtreler.
 * AI'ın yalnızca ihtiyacı olan tool'ları görmesini sağlar.
 */
function buildToolsForModules(activeModuleCodes) {
  const activeSet = new Set(activeModuleCodes);
  return ALL_TOOLS.filter(tool => activeSet.has(tool.module));
}

/**
 * buildAiContext(tenantId) — Bridge ve agent route'larından çağrılır.
 * Döndürür: { systemPrompt, tools, tenantInfo, modules }
 */
async function buildAiContext(tenantId) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      sector: true,
      tenantModules: {
        where: { enabled: true },
        include: { module: true },
      },
      subscription: { include: { plan: true } },
      agents: { where: { status: 'ACTIVE', isDefault: true }, take: 1 },
    },
  });

  if (!tenant) throw new Error(`Tenant bulunamadı: ${tenantId}`);

  const activeModuleCodes = tenant.tenantModules.map(tm => tm.module.code);
  const tools = buildToolsForModules(activeModuleCodes);

  // Default agent'ın promptunu al, yoksa temel prompt üret
  const defaultAgent = tenant.agents[0];
  const systemPrompt = defaultAgent?.systemPrompt || buildDefaultPrompt(tenant);

  return {
    tenantId,
    tenantName: tenant.name,
    sector: tenant.sector?.name || 'Genel',
    sectorCode: tenant.sector?.code || 'other',
    plan: tenant.subscription?.plan?.code || 'starter',
    modules: activeModuleCodes,
    tools: tools.map(t => t.definition),
    toolDefinitions: tools,
    systemPrompt,
  };
}

/**
 * Tenant bilgilerinden temel bir sistem promptu üretir.
 */
function buildDefaultPrompt(tenant) {
  const sectorName = tenant.sector?.name || 'işletme';
  return `Sen ${tenant.name} firmasının Türkçe sesli AI asistanısın.
${sectorName} sektöründe hizmet veriyorsun.
Kısa, doğal ve nazik cümlelerle konuş. Telefonda konuşuyorsun.
Görüşme başında müşteriyi nazikçe selamla.
Yalnızca bildiğin konularda yardımcı ol, bilmediğin konularda insana bağla.`;
}

module.exports = { buildAiContext, buildToolsForModules };

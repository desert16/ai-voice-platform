// packages/db/prisma/seed.js
// Sektörler, Modüller, Sektör-Modül şablonları ve Planlar

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================
// MODÜLLER
// ============================================================
const MODULES = [
  // Core modüller — her tenanta eklenir
  { code: 'ai_voice',      name: 'AI Sesli Asistan',      icon: '🎙️', category: 'core',        isCore: true,  description: 'Gemini tabanlı gerçek zamanlı sesli AI asistan' },
  { code: 'crm',           name: 'CRM',                    icon: '👥', category: 'core',        isCore: true,  description: 'Müşteri yönetimi, notlar, aktivite akışı' },
  { code: 'call_center',   name: 'Çağrı Merkezi',         icon: '📞', category: 'core',        isCore: true,  description: 'Çağrı kuyruğu, agent durumu, kayıtlar' },

  // Sektörel modüller
  { code: 'appointment',   name: 'Randevu Yönetimi',      icon: '📅', category: 'sector',      isCore: false, description: 'Sektör bağımsız randevu motoru' },
  { code: 'property',      name: 'Emlak Portföy',         icon: '🏠', category: 'sector',      isCore: false, description: 'Gayrimenkul ilanı ve portföy yönetimi' },
  { code: 'patient',       name: 'Hasta Yönetimi',        icon: '🩺', category: 'sector',      isCore: false, description: 'Hasta kayıtları ve sağlık geçmişi' },
  { code: 'reservation',   name: 'Rezervasyon',           icon: '🍽️', category: 'sector',      isCore: false, description: 'Masa ve otel oda rezervasyonu' },
  { code: 'order',         name: 'Sipariş Yönetimi',      icon: '📦', category: 'sector',      isCore: false, description: 'E-ticaret ve restoran sipariş takibi' },
  { code: 'service',       name: 'Teknik Servis',         icon: '🔧', category: 'sector',      isCore: false, description: 'Servis kaydı, cihaz ve teknisyen yönetimi' },
  { code: 'shipping',      name: 'Kargo Takibi',          icon: '🚚', category: 'sector',      isCore: false, description: 'Kargo firmalarıyla entegrasyon' },
  { code: 'inventory',     name: 'Stok/Envanter',         icon: '📊', category: 'sector',      isCore: false, description: 'Ürün ve stok yönetimi' },

  // Entegrasyon modülleri
  { code: 'whatsapp',      name: 'WhatsApp Entegrasyon',  icon: '💬', category: 'integration', isCore: false, description: 'WhatsApp Business API entegrasyonu' },
  { code: 'sms',           name: 'SMS Gönderimi',         icon: '📱', category: 'integration', isCore: false, description: 'Toplu ve tekil SMS gönderimi' },
  { code: 'ai_chat',       name: 'AI Chat',               icon: '🤖', category: 'integration', isCore: false, description: 'Web sitesi chatbot entegrasyonu' },
  { code: 'fraud_shield',  name: 'Fraud Shield',          icon: '🛡️', category: 'integration', isCore: false, description: 'Dolandırıcılık koruması ve anomali tespiti' },
];

// ============================================================
// SEKTÖRLER
// ============================================================
const SECTORS = [
  { code: 'health',            name: 'Sağlık & Klinik',      icon: '🏥', description: 'Klinik, diş, göz, polikliniк vb.' },
  { code: 'real_estate',       name: 'Emlak',                 icon: '🏠', description: 'Gayrimenkul alım-satım ve kiralama' },
  { code: 'restaurant',        name: 'Restoran & Kafe',       icon: '🍽️', description: 'Restoran, kafe, catering hizmetleri' },
  { code: 'ecommerce',         name: 'E-Ticaret',             icon: '🛒', description: 'Online satış ve e-ticaret' },
  { code: 'automotive',        name: 'Otomotiv & Oto Servis', icon: '🚗', description: 'Oto servis, galeri, kiralama' },
  { code: 'legal',             name: 'Hukuk & Avukatlık',     icon: '⚖️', description: 'Avukatlık bürosu ve hukuki danışmanlık' },
  { code: 'education',         name: 'Eğitim & Kurs',         icon: '📚', description: 'Kurs merkezi, dershane, online eğitim' },
  { code: 'hotel',             name: 'Otel & Konaklama',      icon: '🏨', description: 'Otel, pansiyon, apart otel' },
  { code: 'travel',            name: 'Seyahat & Turizm',      icon: '✈️', description: 'Seyahat acentesi, tur operatörü' },
  { code: 'logistics',         name: 'Lojistik & Kargo',      icon: '🚚', description: 'Kargo firması, lojistik hizmetler' },
  { code: 'technical_service', name: 'Teknik Servis',         icon: '🔧', description: 'Beyaz eşya, elektronik, bilgisayar servisi' },
  { code: 'finance',           name: 'Finans & Sigorta',      icon: '💼', description: 'Muhasebe, finansal danışmanlık, sigorta' },
  { code: 'corporate',         name: 'Kurumsal Sekreter',     icon: '🏢', description: 'Genel kurumsal çağrı merkezi' },
  { code: 'other',             name: 'Diğer',                 icon: '⭐', description: 'Özel / diğer sektörler' },
];

// ============================================================
// SEKTÖR → MODÜL ŞABLONU
// ============================================================
const SECTOR_MODULE_TEMPLATES = {
  health:            ['crm', 'ai_voice', 'call_center', 'appointment', 'patient', 'sms', 'whatsapp'],
  real_estate:       ['crm', 'ai_voice', 'call_center', 'appointment', 'property', 'whatsapp'],
  restaurant:        ['crm', 'ai_voice', 'call_center', 'reservation', 'order', 'whatsapp'],
  ecommerce:         ['crm', 'ai_voice', 'call_center', 'order', 'shipping', 'whatsapp', 'sms'],
  automotive:        ['crm', 'ai_voice', 'call_center', 'appointment', 'service', 'inventory', 'sms'],
  legal:             ['crm', 'ai_voice', 'call_center', 'appointment', 'whatsapp'],
  education:         ['crm', 'ai_voice', 'call_center', 'appointment', 'sms', 'whatsapp'],
  hotel:             ['crm', 'ai_voice', 'call_center', 'reservation', 'whatsapp'],
  travel:            ['crm', 'ai_voice', 'call_center', 'reservation', 'order', 'whatsapp'],
  logistics:         ['crm', 'ai_voice', 'call_center', 'order', 'shipping', 'sms'],
  technical_service: ['crm', 'ai_voice', 'call_center', 'appointment', 'service', 'inventory', 'sms'],
  finance:           ['crm', 'ai_voice', 'call_center', 'appointment', 'sms'],
  corporate:         ['crm', 'ai_voice', 'call_center', 'whatsapp', 'sms'],
  other:             ['crm', 'ai_voice', 'call_center'],
};

// ============================================================
// PLANLAR
// ============================================================
const PLANS = [
  {
    code: 'starter',
    name: 'Starter',
    description: 'Küçük işletmeler için temel plan',
    priceMonthly: 299,
    maxExtensions: 5,
    maxDids: 1,
    maxAiMinutes: 100,
    maxAgents: 1,
    maxCallsPerDay: 50,
    modules: ['crm', 'ai_voice', 'call_center', 'sms'],
  },
  {
    code: 'professional',
    name: 'Professional',
    description: 'Büyüyen işletmeler için gelişmiş plan',
    priceMonthly: 999,
    maxExtensions: 25,
    maxDids: 5,
    maxAiMinutes: 5000,
    maxAgents: 5,
    maxCallsPerDay: 500,
    modules: ['crm', 'ai_voice', 'call_center', 'appointment', 'property', 'reservation', 'order', 'service', 'whatsapp', 'sms', 'ai_chat'],
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    description: 'Kurumsal kullanım için tam özellikli plan',
    priceMonthly: 2999,
    maxExtensions: 100,
    maxDids: 20,
    maxAiMinutes: 20000,
    maxAgents: 20,
    maxCallsPerDay: 5000,
    modules: ['crm', 'ai_voice', 'call_center', 'appointment', 'property', 'patient', 'reservation', 'order', 'service', 'shipping', 'inventory', 'whatsapp', 'sms', 'ai_chat', 'fraud_shield'],
  },
];

// ============================================================
// SEED MAIN
// ============================================================
async function main() {
  console.log('🌱 Seed başlıyor...\n');

  // 1. Modülleri ekle
  console.log('📦 Modüller oluşturuluyor...');
  for (const mod of MODULES) {
    await prisma.module.upsert({
      where: { code: mod.code },
      update: { name: mod.name, icon: mod.icon, category: mod.category, isCore: mod.isCore, description: mod.description },
      create: mod,
    });
  }
  console.log(`   ✓ ${MODULES.length} modül oluşturuldu`);

  // 2. Sektörleri ekle
  console.log('🏭 Sektörler oluşturuluyor...');
  for (const sector of SECTORS) {
    await prisma.sector.upsert({
      where: { code: sector.code },
      update: { name: sector.name, icon: sector.icon, description: sector.description },
      create: sector,
    });
  }
  console.log(`   ✓ ${SECTORS.length} sektör oluşturuldu`);

  // 3. Sektör-Modül şablonlarını bağla
  console.log('🔗 Sektör-Modül şablonları bağlanıyor...');
  for (const [sectorCode, moduleCodes] of Object.entries(SECTOR_MODULE_TEMPLATES)) {
    const sector = await prisma.sector.findUnique({ where: { code: sectorCode } });
    for (const moduleCode of moduleCodes) {
      const mod = await prisma.module.findUnique({ where: { code: moduleCode } });
      if (!sector || !mod) continue;
      await prisma.sectorModule.upsert({
        where: { sectorId_moduleId: { sectorId: sector.id, moduleId: mod.id } },
        update: {},
        create: { sectorId: sector.id, moduleId: mod.id, isDefault: true },
      });
    }
  }
  console.log(`   ✓ Sektör-Modül bağlantıları tamamlandı`);

  // 4. Planları ekle
  console.log('💳 Planlar oluşturuluyor...');
  for (const plan of PLANS) {
    const { modules: planModules, ...planData } = plan;
    const createdPlan = await prisma.plan.upsert({
      where: { code: planData.code },
      update: { ...planData },
      create: { ...planData },
    });

    // Plan modüllerini bağla
    for (const moduleCode of planModules) {
      const mod = await prisma.module.findUnique({ where: { code: moduleCode } });
      if (!mod) continue;
      await prisma.planFeature.upsert({
        where: { planId_moduleId: { planId: createdPlan.id, moduleId: mod.id } },
        update: {},
        create: { planId: createdPlan.id, moduleId: mod.id, isIncluded: true },
      });
    }
  }
  console.log(`   ✓ ${PLANS.length} plan oluşturuldu`);

  console.log('\n✅ Seed tamamlandı!');
  console.log(`   📦 ${MODULES.length} modül`);
  console.log(`   🏭 ${SECTORS.length} sektör`);
  console.log(`   💳 ${PLANS.length} plan\n`);
}

main()
  .catch((e) => { console.error('❌ Seed hatası:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

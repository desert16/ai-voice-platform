const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  const passwordHash = await bcrypt.hash('admin123', 10);

  // 1. Demo Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'voicecore-demo' },
    update: {},
    create: {
      name: 'VoiceCore Demo Firma',
      slug: 'voicecore-demo',
      email: 'admin@voicecore.ai',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
    },
  });

  // 2. Admin User
  const user = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@voicecore.ai',
      },
    },
    update: {
      passwordHash,
    },
    create: {
      tenantId: tenant.id,
      email: 'admin@voicecore.ai',
      passwordHash,
      name: 'VoiceCore Admin',
      role: 'OWNER',
    },
  });

  // 3. Default AI Agent
  const agent = await prisma.agent.upsert({
    where: { id: 'default-agent-' + tenant.id },
    update: {},
    create: {
      id: 'default-agent-' + tenant.id,
      tenantId: tenant.id,
      name: 'Müşteri Hizmetleri Ajanı',
      systemPrompt: 'Sen VoiceCore AI Türkçe sesli asistanısın. Kısa, nazik ve çözüm odaklı konuş.',
      voiceModel: 'gemini-3.1-flash-live-preview',
      language: 'tr-TR',
      welcomeMessage: 'Merhaba! Ben VoiceCore sesli asistanı, size nasıl yardımcı olabilirim?',
      isDefault: true,
      status: 'ACTIVE',
    },
  });

  console.log('Seed completed successfully!');
  console.log('-----------------------------------');
  console.log('Tenant Slug: voicecore-demo');
  console.log('Admin Email: admin@voicecore.ai');
  console.log('Password:    admin123');
  console.log('-----------------------------------');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

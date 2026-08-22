const express = require('express');
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch {
  try {
    bcrypt = require('bcryptjs');
  } catch {
    bcrypt = null;
  }
}
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');

const router = express.Router();
const prisma = new PrismaClient();


const JWT_SECRET = process.env.JWT_SECRET || 'voicecore_jwt_super_secret_2024';

const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
  };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[AUTH] Giriş denemesi: ${email}`);

    if (!email || !password) {
      return error(res, 'E-posta ve şifre zorunludur', 400);
    }

    const user = await prisma.user.findFirst({
      where: { email },
      include: { tenant: true }
    });

    if (!user) {
      console.warn(`[AUTH] Kullanıcı bulunamadı: ${email}`);
      return error(res, 'Geçersiz e-posta veya şifre', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.warn(`[AUTH] Şifre eşleşmedi: ${email}`);
      return error(res, 'Geçersiz e-posta veya şifre', 401);
    }

    if (user.tenant && user.tenant.status !== 'ACTIVE') {
      return error(res, 'Hesabınız veya firma aktif değil', 403);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    }).catch(() => {});

    const tokens = generateTokens(user);
    console.log(`[AUTH] Giriş başarılı: ${email} (Tenant: ${user.tenant?.slug || user.tenantId})`);
    return success(res, 'Giriş başarılı', { user, tokens });
  } catch (err) {
    console.error('[AUTH] Login hatası:', err);
    return error(res, 'Giriş sırasında hata oluştu', 500, err.message);
  }
});

// GET /api/auth/me — Aktif kullanıcı ve firma bilgilerini döner
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return error(res, 'Token bulunamadı', 401);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { 
        tenant: {
          include: {
            sector: true,
            tenantModules: { where: { enabled: true }, include: { module: true } }
          }
        } 
      }
    });
    if (!user) return error(res, 'Kullanıcı bulunamadı', 404);

    return success(res, 'Kullanıcı bilgisi alındı', { user, tenant: user.tenant });
  } catch (err) {
    return error(res, 'Geçersiz veya süresi dolmuş token', 401);
  }
});


// POST /api/auth/register-tenant — Web sitesi / Onboarding Sihirbazı Ön Kayıt
router.post('/register-tenant', async (req, res) => {
  try {
    const { 
      companyName, slug, email, password, phone, 
      serviceType = 'FULL_SUITE', sectorCode = 'health',
      initialGreeting
    } = req.body;

    if (!companyName || !email || !password) {
      return error(res, 'Firma adı, e-posta ve şifre zorunludur', 400);
    }

    // Slug kontrolü veya otomatik oluşturma
    let safeSlug = slug ? slug.toLowerCase().replace(/[^a-z0-9-]/g, '-') : companyName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (safeSlug.length < 2) safeSlug = 'firma-' + Math.floor(Math.random() * 9000 + 1000);

    const existingTenant = await prisma.tenant.findFirst({
      where: { OR: [{ email }, { slug: safeSlug }] }
    });

    if (existingTenant) {
      if (existingTenant.slug === safeSlug) {
        safeSlug = `${safeSlug}-${Math.floor(Math.random() * 900 + 100)}`;
      } else {
        return error(res, 'Bu e-posta adresiyle kayıtlı bir firma zaten var', 409);
      }
    }

    // Sektör ID'sini bul
    const sector = await prisma.sector.findUnique({
      where: { code: sectorCode },
      include: { sectorModules: { where: { isDefault: true }, include: { module: true } } }
    });

    // Şifreyi hashle
    const passwordHash = await bcrypt.hash(password, 10);

    // Tenant ve Owner Kullanıcıyı Transaction ile oluştur
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug: safeSlug,
          email,
          phone,
          sectorId: sector?.id || null,
          serviceType: serviceType,
          status: 'ACTIVE',
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: `${companyName} Yöneticisi`,
          email,
          passwordHash,
          role: 'OWNER',
        },
      });

      // Sektörün varsayılan modüllerini bağla
      if (sector && sector.sectorModules?.length) {
        await tx.tenantModule.createMany({
          data: sector.sectorModules.map(sm => ({
            tenantId: tenant.id,
            moduleId: sm.moduleId,
            enabled: true,
          })),
          skipDuplicates: true,
        });
      }

      // Eğer AI dahil ise varsayılan AI Ajan oluştur
      if (serviceType !== 'PBX_ONLY') {
        const defaultPrompt = `Sen ${companyName} firmasının profesyonel, nazik ve çözüm odaklı Türkçe sesli asistanısın.
Sektör: ${sector?.name || 'Genel Ticaret'}
İlk Selamlama: ${initialGreeting || `Merhaba, ${companyName}'e hoş geldiniz! Size nasıl yardımcı olabilirim?`}
Telefonda konuştuğun için kısa, net ve 1-2 cümlelik yanıtlar ver.`;

        await tx.agent.create({
          data: {
            tenantId: tenant.id,
            name: `${companyName} Sesli Asistanı`,
            systemPrompt: defaultPrompt,
            welcomeMessage: initialGreeting || `Merhaba, ${companyName}'e hoş geldiniz!`,
            voiceModel: 'gemini-3.1-flash-live-preview',
            language: 'tr-TR',
            isDefault: true,
            status: 'ACTIVE',
          },
        });
      }

      return { tenant, user };
    });

    const tokens = generateTokens(result.user);
    console.log(`[ONBOARDING] Yeni tenant kaydı tamamlandı: ${result.tenant.name} (${result.tenant.slug}) - Hizmet: ${serviceType}`);

    return success(res, 'Firma ve panel kaydı başarıyla tamamlandı', {
      tenant: result.tenant,
      user: result.user,
      tokens,
      redirectUrl: `/${result.tenant.slug}/dashboard`,
    }, 201);

  } catch (err) {
    console.error('[ONBOARDING ERROR]', err);
    return error(res, 'Kayıt sırasında hata oluştu: ' + err.message, 500);
  }
});





router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return error(res, 'Refresh token required', 400);

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const tokens = generateTokens({
      id: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role
    });
    return success(res, 'Token refreshed', tokens);
  } catch (err) {
    return error(res, 'Invalid refresh token', 403);
  }
});

router.post('/logout', (req, res) => {
  // Client-side removes the tokens
  return success(res, 'Logged out successfully');
});

module.exports = router;

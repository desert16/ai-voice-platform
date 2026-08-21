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

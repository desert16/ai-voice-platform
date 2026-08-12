const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');

const router = express.Router();
const prisma = new PrismaClient();

const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
  };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findFirst({
      where: { email },
      include: { tenant: true }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return error(res, 'Invalid credentials', 401);
    }

    if (user.tenant && user.tenant.status !== 'ACTIVE') {
      return error(res, 'Tenant is not active', 403);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const tokens = generateTokens(user);
    return success(res, 'Login successful', { user, tokens });
  } catch (err) {
    return error(res, 'Login failed', 500, err.message);
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

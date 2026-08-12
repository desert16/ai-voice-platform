const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { success, error, paginated } = require('../utils/response');
const { authenticateToken, requireSuperadmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Only SUPERADMIN can manage tenants globally
router.use(authenticateToken, requireSuperadmin);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.tenant.count()
    ]);

    return paginated(res, 'Tenants retrieved', tenants, total, page, limit);
  } catch (err) {
    return error(res, 'Failed to fetch tenants', 500, err.message);
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, slug, email, plan, status } = req.body;
    const tenant = await prisma.tenant.create({
      data: { name, slug, email, plan, status }
    });
    return success(res, 'Tenant created', tenant, 201);
  } catch (err) {
    return error(res, 'Failed to create tenant', 500, err.message);
  }
});

router.post('/provision', async (req, res) => {
  try {
    const { tenantName, tenantSlug, tenantEmail, plan, userName, userEmail, password } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: tenantSlug,
          email: tenantEmail,
          plan: plan || 'STARTER',
          status: 'ACTIVE'
        }
      });

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: userEmail,
          name: userName,
          passwordHash,
          role: 'OWNER'
        }
      });

      return { tenant, user };
    });

    return success(res, 'Tenant provisioned successfully', result, 201);
  } catch (err) {
    return error(res, 'Provisioning failed', 500, err.message);
  }
});

module.exports = router;

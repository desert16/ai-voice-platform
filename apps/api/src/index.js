require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { error } = require('./utils/response');

// ─── Routes ────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const tenantRoutes       = require('./routes/tenants');
const sipTrunkRoutes     = require('./routes/sipTrunks');
const agentRoutes        = require('./routes/agents');
const customerApiRoutes  = require('./routes/customerApis');
const callRoutes         = require('./routes/calls');
const apiKeyRoutes       = require('./routes/apiKeys');
const publicApiRoutes    = require('./routes/publicApi');
const internalRoutes     = require('./routes/internal');

// ─── Yeni Modüler Routes ────────────────────────────────────
const sectorRoutes       = require('./routes/sectors');
const moduleRoutes       = require('./routes/modules');
const crmRoutes          = require('./routes/crm');
const appointmentRoutes  = require('./routes/appointments');
const propertyRoutes     = require('./routes/properties');
const serviceTicketRoutes = require('./routes/serviceTickets');

// ─── Core Middleware ────────────────────────────────────────
const { tenantGuard }    = require('./core/tenantGuard');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use(limiter);

// ─── Health Check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'VoiceCore API' });
});

// ─── Auth & Admin ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin/tenants', tenantRoutes);
app.use('/api/admin/sectors', sectorRoutes);
app.use('/api/admin/modules', (req, res, next) => { req.params = {}; next(); }, moduleRoutes);



// ─── Tenant-scoped — Mevcut Routes ─────────────────────────
app.use('/api/tenants/:tenantId/trunks',   sipTrunkRoutes);
app.use('/api/tenants/:tenantId/agents',   agentRoutes);
app.use('/api/tenants/:tenantId/apis',     customerApiRoutes);
app.use('/api/tenants/:tenantId/calls',    callRoutes);
app.use('/api/tenants/:tenantId/keys',     apiKeyRoutes);

// ─── Tenant-scoped — Yeni Modüler Routes ───────────────────
app.use('/api/tenants/:tenantId/modules',      tenantGuard, moduleRoutes);
app.use('/api/tenants/:tenantId/crm',          tenantGuard, crmRoutes);
app.use('/api/tenants/:tenantId/appointments', tenantGuard, appointmentRoutes);
app.use('/api/tenants/:tenantId/properties',   tenantGuard, propertyRoutes);
app.use('/api/tenants/:tenantId/tickets',      tenantGuard, serviceTicketRoutes);

// ─── Public API (API Key ile) ───────────────────────────────
app.use('/v1', publicApiRoutes);

// ─── Internal API — Sadece PBX (x-service-token) ───────────
app.use('/api/internal', internalRoutes);



// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  error(res, 'Internal Server Error', 500, err.message);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VoiceCore API Server is running on port ${PORT}`);
});

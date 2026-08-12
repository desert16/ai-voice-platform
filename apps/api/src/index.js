require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { error } = require('./utils/response');

// Routes
const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenants');
const sipTrunkRoutes = require('./routes/sipTrunks');
const agentRoutes = require('./routes/agents');
const customerApiRoutes = require('./routes/customerApis');
const callRoutes = require('./routes/calls');
const apiKeyRoutes = require('./routes/apiKeys');
const publicApiRoutes = require('./routes/publicApi');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use(limiter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin / Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/tenants', tenantRoutes); // System Admin Tenant management

// Tenant-scoped Routes
app.use('/api/tenants/:tenantId/trunks', sipTrunkRoutes);
app.use('/api/tenants/:tenantId/agents', agentRoutes);
app.use('/api/tenants/:tenantId/apis', customerApiRoutes);
app.use('/api/tenants/:tenantId/calls', callRoutes);
app.use('/api/tenants/:tenantId/keys', apiKeyRoutes);

// Customer-facing Public API (Requires API Key)
app.use('/v1', publicApiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  error(res, 'Internal Server Error', 500, err.message);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VoiceCore API Server is running on port ${PORT}`);
});

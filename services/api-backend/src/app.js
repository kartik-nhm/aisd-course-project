const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');

const authRoutes = require('./routes/auth.routes');
const consultationRoutes = require('./routes/consultation.routes');
const pharmacyRoutes = require('./routes/pharmacy.routes');

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'smart-telehealth-api-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Platform Routes
app.use('/api/auth', authRoutes);
app.use('/api/consultation', consultationRoutes);
app.use('/api/pharmacy', pharmacyRoutes);

// Compatibility alias
app.use('/auth', authRoutes);

module.exports = { app };

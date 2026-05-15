require('node:dns/promises').setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Route imports
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const insightRoutes = require('./routes/insights');
const budgetRoutes = require('./routes/budgets');
const categoryRoutes = require('./routes/categories');

// Middleware imports
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/authMiddleware');
const requestLogger = require('./middleware/requestLogger'); // ✅ already present
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too many requests. Please try again later.' },
});
app.use(limiter);

// ✅ ── Request logging middleware (ADDED HERE) ────────────────────────────────
app.use(requestLogger);

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── MongoDB connection ─────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
    .then(() => logger.info('MongoDB Atlas connected'))
    .catch((err) => {
        logger.error('MongoDB connection failed', { error: err.message });
        process.exit(1);
    });

// ── Public routes (no auth required) ──────────────────────────────────────────
app.get('/ping', (req, res) => {
    res.json({
        status: 'ok',
        message: 'SpendSight API is alive',
        timestamp: new Date().toISOString(),
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        env: process.env.NODE_ENV,
    });
});

app.use('/api/auth', authRoutes);

// ── Protected routes (auth enforced here) ──────────────────────────────────────
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/insights', authMiddleware, insightRoutes);
app.use('/api/budgets', authMiddleware, budgetRoutes);
app.use('/api/categories', authMiddleware, categoryRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ───────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`SpendSight API running on port ${PORT}`);
    logger.info(`From iPhone: http://<your-pc-ip>:${PORT}/ping`);
});

module.exports = app;
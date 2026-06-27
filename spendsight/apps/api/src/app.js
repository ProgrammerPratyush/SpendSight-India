require('node:dns/promises').setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { startInsightEngine } = require('./jobs/insightEngine');
const adminRoutes = require('./routes/admin');

// Route imports
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const insightRoutes = require('./routes/insights');
const budgetRoutes = require('./routes/budgets');
const categoryRoutes = require('./routes/categories');
// Import the notification routes
const notificationRoutes = require('./routes/notifications');

// Middleware imports
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/authMiddleware');
const requestLogger = require('./middleware/requestLogger');
const apiLimiter = require('./middleware/rateLimiter');
const parseRoutes = require("./routes/parse");

const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

//
// ──────────────────────────────────────────────────────────
// Express Trust Proxy
// Required for Railway / Render / Nginx / Cloudflare
// ──────────────────────────────────────────────────────────
//
app.set('trust proxy', 1);

//
// ──────────────────────────────────────────────────────────
// MongoDB Config
// ──────────────────────────────────────────────────────────
//
mongoose.set('strictQuery', true);

//
// ──────────────────────────────────────────────────────────
// Security Middleware
// ──────────────────────────────────────────────────────────
//
app.use(helmet());

//
// ──────────────────────────────────────────────────────────
// CORS
// ──────────────────────────────────────────────────────────
//
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['*'];

app.use(cors({
    origin: (origin, callback) => {
        if (
            !origin ||
            allowedOrigins.includes('*') ||
            allowedOrigins.includes(origin)
        ) {
            return callback(null, true);
        }

        return callback(new Error('CORS not allowed'));
    },

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

    allowedHeaders: [
        'Content-Type',
        'Authorization',
    ],

    credentials: true,
}));

//
// ──────────────────────────────────────────────────────────
// Body Parsing
// Must come BEFORE routes
// ──────────────────────────────────────────────────────────
//
app.use(express.json({
    limit: '10kb',
}));

app.use(express.urlencoded({
    extended: true,
}));

//
// ──────────────────────────────────────────────────────────
// Request Logger
// BEFORE limiter for blocked-request visibility
// ──────────────────────────────────────────────────────────
//
app.use(requestLogger);

//
// ──────────────────────────────────────────────────────────
// Global API Rate Limiter
// ──────────────────────────────────────────────────────────
//
app.use(apiLimiter);

//
// ──────────────────────────────────────────────────────────
// MongoDB Connection
// ──────────────────────────────────────────────────────────
//
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        logger.info('MongoDB Atlas connected');

        startInsightEngine();
    })
    .catch((err) => {
        logger.error('MongoDB connection failed', {
            error: err.message,
        });

        process.exit(1);
    });

//
// ──────────────────────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────────────────────
//
app.get('/ping', (req, res) => {
    res.json({
        status: 'ok',
        service: 'SpendSight API',
        timestamp: new Date().toISOString(),

        environment: process.env.NODE_ENV,

        database:
            mongoose.connection.readyState === 1
                ? 'connected'
                : 'disconnected',
    });
});

//
// ──────────────────────────────────────────────────────────
// Public Routes
// ──────────────────────────────────────────────────────────
//
app.use('/api/auth', authRoutes);
// app.use('/api/parse', parseRoutes);
//
// ──────────────────────────────────────────────────────────
// Protected Routes
// ──────────────────────────────────────────────────────────
//
app.use(
    '/api/transactions',
    authMiddleware,
    transactionRoutes
);

app.use(
    '/api/insights',
    authMiddleware,
    insightRoutes
);

app.use(
    '/api/budgets',
    authMiddleware,
    budgetRoutes
);

app.use(
    '/api/categories',
    authMiddleware,
    categoryRoutes
);

// For Insight Engine Testing with manual way
app.use(
    '/api/admin',
    authMiddleware,
    adminRoutes
);

// For Claude code parser
app.use(
    "/api/parse",
    authMiddleware,
    parseRoutes
);
// Notification Routes
app.use(
    "/api/notifications",
    authMiddleware,
    notificationRoutes
);
//
// ──────────────────────────────────────────────────────────
// 404 Handler
// ──────────────────────────────────────────────────────────
//
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
    });
});

//
// ──────────────────────────────────────────────────────────
// Global Error Handler
// MUST be last
// ──────────────────────────────────────────────────────────
//
app.use(errorHandler);

//
// ──────────────────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────────────────
//
const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`SpendSight API running on port ${PORT}`);
});

//
// ──────────────────────────────────────────────────────────
// Graceful Shutdown
// ──────────────────────────────────────────────────────────
//
process.on('SIGTERM', async () => {
    logger.warn('SIGTERM received. Shutting down gracefully...');

    server.close(async () => {
        await mongoose.connection.close();

        logger.info('Server shutdown complete');

        process.exit(0);
    });
});

module.exports = app;
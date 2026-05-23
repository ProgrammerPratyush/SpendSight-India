const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error('Unhandled API Error', {
        message: err.message,
        stack: process.env.NODE_ENV !== 'production'
            ? err.stack
            : undefined,
        path: req.originalUrl,
        method: req.method,
        userId: req.userId || null,
        requestId: req.requestId || null,
    });

    // Zod validation
    if (err.name === 'ZodError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.errors,
        });
    }

    // Mongoose validation
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(
            (e) => e.message
        );

        return res.status(400).json({
            error: 'Validation failed',
            details: messages,
        });
    }

    // Duplicate keys
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];

        return res.status(409).json({
            error: `${field} already exists`,
        });
    }

    // JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired',
        });
    }

    return res.status(err.status || 500).json({
        error:
            process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : err.message,
    });
};

module.exports = errorHandler;
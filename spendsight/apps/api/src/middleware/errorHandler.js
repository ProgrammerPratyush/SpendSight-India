const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        path: req.path,
        userId: req.userId || null,
    });

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ error: 'Validation failed', details: messages });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({ error: `${field} already exists` });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
    }

    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Something went wrong'
            : err.message,
    });
};

module.exports = errorHandler;
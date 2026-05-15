const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

module.exports = function requestLogger(req, res, next) {
    // Attach a unique ID to every request — makes debugging easy
    req.requestId = uuidv4();

    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? 'error'
            : res.statusCode >= 400 ? 'warn'
                : 'info';

        logger[level](`${req.method} ${req.path}`, {
            requestId: req.requestId,
            statusCode: res.statusCode,
            durationMs: duration,
            userId: req.userId || null,
        });
    });

    next();
};
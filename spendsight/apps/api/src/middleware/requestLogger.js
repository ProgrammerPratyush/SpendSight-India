const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

module.exports = function requestLogger(req, res, next) {
    req.requestId = uuidv4();

    const start = Date.now();

    logger.info('Incoming Request', {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
    });

    res.on('finish', () => {
        const duration = Date.now() - start;

        const level =
            res.statusCode >= 500
                ? 'error'
                : res.statusCode >= 400
                    ? 'warn'
                    : 'info';

        logger[level]('Request Completed', {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: duration,
            userId: req.userId || null,
        });
    });

    next();
};
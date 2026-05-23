const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,

    message: {
        error: 'Too many requests. Please try again later.',
    },

    skip: (req) => {
        // Skip localhost during development
        return (
            process.env.NODE_ENV !== 'production' &&
            (
                req.ip === '::1' ||
                req.ip === '127.0.0.1'
            )
        );
    },
});

module.exports = apiLimiter;
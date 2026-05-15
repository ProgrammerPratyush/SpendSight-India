const winston = require('winston');

const { combine, timestamp, printf, colorize, json } = winston.format;

// Human-readable format for development
const devFormat = combine(
    colorize(),
    timestamp({ format: 'HH:mm:ss' }),
    printf(({ level, message, timestamp, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} [${level}] ${message} ${metaStr}`;
    })
);

// JSON format for production — parseable by Railway, Datadog, etc.
const prodFormat = combine(
    timestamp(),
    json()
);

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
    transports: [
        new winston.transports.Console(),
    ],
});

module.exports = logger;
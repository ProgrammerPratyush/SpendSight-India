const admin = require('../config/firebase');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error: 'Authorization header missing',
            });
        }

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Invalid authorization format',
            });
        }

        const token = authHeader.split('Bearer ')[1];

        if (!token) {
            return res.status(401).json({
                error: 'Authentication token missing',
            });
        }

        const decoded = await admin.auth().verifyIdToken(token);

        req.userId = decoded.uid;
        req.userPhone = decoded.phone_number || null;
        req.userEmail = decoded.email || null;

        next();
    } catch (err) {
        logger.warn('Authentication failed', {
            error: err.message,
            path: req.path,
            ip: req.ip,
        });

        return res.status(401).json({
            error: 'Invalid or expired token',
        });
    }
};

module.exports = authMiddleware;
// api/src/services/notificationService.js

const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');

// ═════════════════════════════════════════════════════
//
// SECTION 1: NOTIFICATION CRUD
//
// ═════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────
// CREATE
// Called by insightEngine.js after every insight
// is created to fire a paired notification
// ─────────────────────────────────────────────────────
async function createNotification({
    userId,
    title,
    body,
    type = 'system',
    severity = 'info',
    deepLink = '',
    metadata = {},
}) {
    try {
        const notification = await Notification.create({
            userId,
            title,
            body,
            type,
            severity,
            deepLink,
            metadata,
        });

        logger.info(
            `[NOTIFICATION SERVICE] Created: type=${type} userId=${userId}`
        );

        return notification;
    } catch (err) {
        logger.error('[NOTIFICATION SERVICE] createNotification failed', {
            error: err.message,
            userId,
            type,
        });
        return null;
    }
}

// ─────────────────────────────────────────────────────
// GET ALL
// Returns latest notifications for a user
// ─────────────────────────────────────────────────────
async function getNotifications(userId, limit = 20) {
    try {
        return await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit);
    } catch (err) {
        logger.error('[NOTIFICATION SERVICE] getNotifications failed', {
            error: err.message,
            userId,
        });
        return [];
    }
}

// ─────────────────────────────────────────────────────
// UNREAD COUNT
// ─────────────────────────────────────────────────────
async function getUnreadCount(userId) {
    try {
        return await Notification.countDocuments({
            userId,
            readAt: null,
        });
    } catch (err) {
        logger.error('[NOTIFICATION SERVICE] getUnreadCount failed', {
            error: err.message,
            userId,
        });
        return 0;
    }
}

// ─────────────────────────────────────────────────────
// MARK ONE AS READ
// ─────────────────────────────────────────────────────
async function markAsRead(notificationId, userId) {
    try {
        return await Notification.findOneAndUpdate(
            {
                _id: notificationId,
                userId,
            },
            {
                $set: { readAt: new Date() },
            },
            { new: true }
        );
    } catch (err) {
        logger.error('[NOTIFICATION SERVICE] markAsRead failed', {
            error: err.message,
            notificationId,
            userId,
        });
        return null;
    }
}

// ─────────────────────────────────────────────────────
// MARK ALL AS READ
// ─────────────────────────────────────────────────────
async function markAllAsRead(userId) {
    try {
        const result = await Notification.updateMany(
            {
                userId,
                readAt: null,
            },
            {
                $set: { readAt: new Date() },
            }
        );

        logger.info(
            `[NOTIFICATION SERVICE] markAllAsRead: ${result.modifiedCount} updated for ${userId}`
        );

        return result;
    } catch (err) {
        logger.error('[NOTIFICATION SERVICE] markAllAsRead failed', {
            error: err.message,
            userId,
        });
        return null;
    }
}

// ─────────────────────────────────────────────────────
// DELETE ONE
// ─────────────────────────────────────────────────────
async function deleteNotification(notificationId, userId) {
    try {
        return await Notification.findOneAndDelete({
            _id: notificationId,
            userId,
        });
    } catch (err) {
        logger.error('[NOTIFICATION SERVICE] deleteNotification failed', {
            error: err.message,
            notificationId,
            userId,
        });
        return null;
    }
}

// ─────────────────────────────────────────────────────
// DELETE ALL
// ─────────────────────────────────────────────────────
async function deleteAllNotifications(userId) {
    try {
        const result = await Notification.deleteMany({ userId });

        logger.info(
            `[NOTIFICATION SERVICE] deleteAll: ${result.deletedCount} removed for ${userId}`
        );

        return result;
    } catch (err) {
        logger.error('[NOTIFICATION SERVICE] deleteAllNotifications failed', {
            error: err.message,
            userId,
        });
        return null;
    }
}

// ═════════════════════════════════════════════════════
//
// SECTION 2: DEVICE MANAGEMENT
//
// All device token operations go through this service.
// Routes, crons, and future push senders must call
// these functions — never touch user.notificationDevices
// directly.
//
// ═════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────
// REGISTER DEVICE
//
// Adds a new push token or updates lastSeen
// if the token already exists.
// Caps at 5 devices per user — oldest removed first.
//
// Usage:
//   await notificationService.registerDevice(
//       userId, token, platform, appVersion
//   );
// ─────────────────────────────────────────────────────
async function registerDevice(userId, { token, platform, appVersion = '' }) {
    try {
        const user = await User.findById(userId);

        if (!user) {
            logger.error(
                `[DEVICE SERVICE] registerDevice: user not found ${userId}`
            );
            return {
                success: false,
                message: 'User not found',
            };
        }

        // ── Check if token already exists ──
        const existingIndex = user.notificationDevices.findIndex(
            (device) => device.token === token
        );

        if (existingIndex !== -1) {
            // Token exists — update lastSeen and appVersion
            user.notificationDevices[existingIndex].lastSeen = new Date();
            user.notificationDevices[existingIndex].appVersion =
                appVersion ||
                user.notificationDevices[existingIndex].appVersion;

            await user.save();

            logger.info(
                `[DEVICE SERVICE] Token updated: userId=${userId} platform=${platform}`
            );

            return {
                success: true,
                message: 'Device updated',
            };
        }

        // ── Cap at 5 devices — remove oldest if full ──
        if (user.notificationDevices.length >= 5) {
            user.notificationDevices.sort(
                (a, b) =>
                    new Date(a.lastSeen).getTime() -
                    new Date(b.lastSeen).getTime()
            );

            const removed = user.notificationDevices.shift();

            logger.info(
                `[DEVICE SERVICE] Removed oldest device for ${userId}: ${removed?.token}`
            );
        }

        // ── Push new device ──
        user.notificationDevices.push({
            token,
            platform,
            appVersion,
            lastSeen: new Date(),
        });

        await user.save();

        logger.info(
            `[DEVICE SERVICE] New device registered: userId=${userId} platform=${platform}`
        );

        return {
            success: true,
            message: 'Device registered',
        };
    } catch (err) {
        logger.error('[DEVICE SERVICE] registerDevice failed', {
            error: err.message,
            userId,
        });
        return {
            success: false,
            message: 'Registration failed',
        };
    }
}

// ─────────────────────────────────────────────────────
// REMOVE DEVICE
//
// Removes a specific push token from the user.
// Called on logout, uninstall, or token rotation.
//
// Usage:
//   await notificationService.removeDevice(userId, token);
// ─────────────────────────────────────────────────────
async function removeDevice(userId, token) {
    try {
        const user = await User.findById(userId);

        if (!user) {
            logger.error(
                `[DEVICE SERVICE] removeDevice: user not found ${userId}`
            );
            return {
                success: false,
                message: 'User not found',
            };
        }

        const originalLength = user.notificationDevices.length;

        // ── Filter out the matching token ──
        user.notificationDevices = user.notificationDevices.filter(
            (device) => device.token !== token
        );

        const removed = originalLength - user.notificationDevices.length;

        if (removed === 0) {
            logger.info(
                `[DEVICE SERVICE] Token not found for removal: userId=${userId}`
            );
            return {
                success: false,
                message: 'Device not found',
            };
        }

        await user.save();

        logger.info(
            `[DEVICE SERVICE] Device removed: userId=${userId} removed=${removed}`
        );

        return {
            success: true,
            message: 'Device removed',
        };
    } catch (err) {
        logger.error('[DEVICE SERVICE] removeDevice failed', {
            error: err.message,
            userId,
        });
        return {
            success: false,
            message: 'Removal failed',
        };
    }
}

// ─────────────────────────────────────────────────────
// GET USER DEVICES
//
// Returns all registered devices for a user.
// Used by push sender to know where to deliver.
//
// Usage:
//   const devices = await notificationService.getUserDevices(userId);
//   // [{ token, platform, appVersion, lastSeen }, ...]
// ─────────────────────────────────────────────────────
async function getUserDevices(userId) {
    try {
        const user = await User.findById(userId)
            .select('notificationDevices')
            .lean();

        if (!user) {
            logger.error(
                `[DEVICE SERVICE] getUserDevices: user not found ${userId}`
            );
            return [];
        }

        return user.notificationDevices || [];
    } catch (err) {
        logger.error('[DEVICE SERVICE] getUserDevices failed', {
            error: err.message,
            userId,
        });
        return [];
    }
}

// ═════════════════════════════════════════════════════
//
// EXPORTS
//
// ═════════════════════════════════════════════════════

module.exports = {
    // Notification CRUD
    createNotification,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,

    // Device Management
    registerDevice,
    removeDevice,
    getUserDevices,
};
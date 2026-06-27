const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// Apply auth to all routes in this file
router.use(authMiddleware);

// ─────────────────────────────────────────────────────
// HELPER: Resolve MongoDB user from Firebase UID
// ─────────────────────────────────────────────────────
async function resolveUser(req, res) {
    const user = await User.findOne({
        firebaseUid: req.userId,
    });

    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return null;
    }

    return user;
}

// ─────────────────────────────────────────────────────
// GET /api/notifications
// Returns latest 20 notifications for the user
// Sorted newest first
//
// Response:
// {
//   data: {
//     notifications: [...],
//     unreadCount: 4
//   }
// }
// ─────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const user = await resolveUser(req, res);
        if (!user) return;

        // ✅ Disable caching so badge always reflects truth
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        const notifications = await Notification.find({
            userId: user._id,
        })
            .sort({ createdAt: -1 })
            .limit(20);

        const unreadCount = await Notification.countDocuments({
            userId: user._id,
            readAt: null,
        });

        logger.info(
            `[NOTIFICATIONS] Fetched ${notifications.length} for user ${user._id}`
        );

        res.json({
            data: {
                notifications,
                unreadCount,
            },
        });
    } catch (err) {
        logger.error('[NOTIFICATIONS] GET / failed', {
            error: err.message,
        });
        next(err);
    }
});

// ─────────────────────────────────────────────────────
// GET /api/notifications/unread-count
// Returns only the unread count
// Used by Dashboard badge
//
// Response:
// {
//   data: { count: 4 }
// }
// ─────────────────────────────────────────────────────
router.get('/unread-count', async (req, res, next) => {
    try {
        const user = await resolveUser(req, res);
        if (!user) return;

        const count = await Notification.countDocuments({
            userId: user._id,
            readAt: null,
        });

        logger.info(
            `[NOTIFICATIONS] Unread count for ${user._id}: ${count}`
        );

        res.json({
            data: { count },
        });
    } catch (err) {
        logger.error('[NOTIFICATIONS] GET /unread-count failed', {
            error: err.message,
        });
        next(err);
    }
});

// ─────────────────────────────────────────────────────
// PATCH /api/notifications/:id/read
// Mark a single notification as read
//
// Response:
// {
//   data: { success: true }
// }
// ─────────────────────────────────────────────────────
router.patch('/:id/read', async (req, res, next) => {
    try {
        const user = await resolveUser(req, res);
        if (!user) return;

        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: user._id,
            },
            {
                $set: { readAt: new Date() },
            },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                error: 'Notification not found',
            });
        }

        logger.info(
            `[NOTIFICATIONS] Marked read: ${req.params.id} for ${user._id}`
        );

        res.json({ data: { success: true } });
    } catch (err) {
        logger.error('[NOTIFICATIONS] PATCH /:id/read failed', {
            error: err.message,
        });
        next(err);
    }
});

// ─────────────────────────────────────────────────────
// PATCH /api/notifications/read-all
// Mark ALL unread notifications as read
// Called when user opens the Notifications screen
//
// Response:
// {
//   data: {
//     success: true,
//     updatedCount: 4
//   }
// }
// ─────────────────────────────────────────────────────
router.patch('/read-all', async (req, res, next) => {
    try {
        const user = await resolveUser(req, res);
        if (!user) return;

        const result = await Notification.updateMany(
            {
                userId: user._id,
                readAt: null,
            },
            {
                $set: { readAt: new Date() },
            }
        );

        logger.info(
            `[NOTIFICATIONS] Marked all read for ${user._id}. Count: ${result.modifiedCount}`
        );

        res.json({
            data: {
                success: true,
                updatedCount: result.modifiedCount,
            },
        });
    } catch (err) {
        logger.error('[NOTIFICATIONS] PATCH /read-all failed', {
            error: err.message,
        });
        next(err);
    }
});

// ─────────────────────────────────────────────────────
// DELETE /api/notifications/:id
// Delete a single notification
//
// Response:
// {
//   data: { success: true }
// }
// ─────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
    try {
        const user = await resolveUser(req, res);
        if (!user) return;

        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: user._id,
        });

        if (!notification) {
            return res.status(404).json({
                error: 'Notification not found',
            });
        }

        logger.info(
            `[NOTIFICATIONS] Deleted: ${req.params.id} for ${user._id}`
        );

        res.json({ data: { success: true } });
    } catch (err) {
        logger.error('[NOTIFICATIONS] DELETE /:id failed', {
            error: err.message,
        });
        next(err);
    }
});

// ─────────────────────────────────────────────────────
// DELETE /api/notifications/clear-all
// Delete ALL notifications for the user
//
// Response:
// {
//   data: {
//     success: true,
//     deletedCount: 12
//   }
// }
// ─────────────────────────────────────────────────────
router.delete('/clear-all', async (req, res, next) => {
    try {
        const user = await resolveUser(req, res);
        if (!user) return;

        const result = await Notification.deleteMany({
            userId: user._id,
        });

        logger.info(
            `[NOTIFICATIONS] Cleared all for ${user._id}. Count: ${result.deletedCount}`
        );

        res.json({
            data: {
                success: true,
                deletedCount: result.deletedCount,
            },
        });
    } catch (err) {
        logger.error('[NOTIFICATIONS] DELETE /clear-all failed', {
            error: err.message,
        });
        next(err);
    }
});

module.exports = router;
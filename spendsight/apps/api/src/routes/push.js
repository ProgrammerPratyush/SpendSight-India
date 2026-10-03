const express = require('express');
const router = express.Router();

const User = require('../models/User');
const PushSubscription = require('../models/PushSubscription');
const authMiddleware = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// Apply authentication to every push route.
router.use(authMiddleware);

// ─────────────────────────────────────────────────────
// HELPER: Resolve MongoDB user from Firebase UID
// ─────────────────────────────────────────────────────
async function resolveUser(req, res) {
    const user = await User.findOne({
        firebaseUid: req.userId,
    });

    if (!user) {
        res.status(404).json({
            error: 'User not found',
        });

        return null;
    }

    return user;
}

// ─────────────────────────────────────────────────────
// POST /api/push/subscribe
//
// Registers or updates a browser push subscription.
//
// Request:
// {
//   "subscription": {
//     "endpoint": "...",
//     "keys": {
//       "p256dh": "...",
//       "auth": "..."
//     }
//   },
//   "browser": "Safari",
//   "deviceType": "mobile"
// }
// ─────────────────────────────────────────────────────
router.post('/subscribe', async (req, res, next) => {
    try {
        const user = await resolveUser(req, res);

        if (!user) return;

        const {
            subscription,
            browser = 'unknown',
            deviceType = 'unknown',
        } = req.body;

        // Validate top-level subscription object.
        if (!subscription || typeof subscription !== 'object') {
            return res.status(400).json({
                error: 'Push subscription is required',
            });
        }

        const {
            endpoint,
            keys,
        } = subscription;

        // Validate required Web Push fields.
        if (
            typeof endpoint !== 'string' ||
            !endpoint.trim()
        ) {
            return res.status(400).json({
                error: 'Push subscription endpoint is required',
            });
        }

        if (
            !keys ||
            typeof keys.p256dh !== 'string' ||
            typeof keys.auth !== 'string' ||
            !keys.p256dh.trim() ||
            !keys.auth.trim()
        ) {
            return res.status(400).json({
                error: 'Invalid push subscription keys',
            });
        }

        // Validate device type.
        const allowedDeviceTypes = [
            'desktop',
            'mobile',
            'tablet',
            'unknown',
        ];

        const normalizedDeviceType =
            allowedDeviceTypes.includes(deviceType)
                ? deviceType
                : 'unknown';

        // Upsert by endpoint.
        //
        // If the browser already registered this endpoint,
        // update it instead of creating a duplicate.
        const pushSubscription =
            await PushSubscription.findOneAndUpdate(
                {
                    endpoint: endpoint.trim(),
                },
                {
                    $set: {
                        userId: user._id,

                        keys: {
                            p256dh: keys.p256dh.trim(),
                            auth: keys.auth.trim(),
                        },

                        platform: 'web',

                        browser:
                            typeof browser === 'string'
                                ? browser.trim().slice(0, 50)
                                : 'unknown',

                        deviceType: normalizedDeviceType,

                        userAgent:
                            typeof req.headers['user-agent'] === 'string'
                                ? req.headers['user-agent'].slice(0, 500)
                                : '',

                        lastUsedAt: new Date(),
                    },
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true,
                    runValidators: true,
                }
            );

        logger.info(
            `[PUSH] Subscription registered for user ${user._id}`
        );

        return res.status(200).json({
            data: {
                success: true,
                subscriptionId: pushSubscription._id,
            },
        });
    } catch (err) {
        logger.error('[PUSH] POST /subscribe failed', {
            error: err.message,
        });

        next(err);
    }
});

// ─────────────────────────────────────────────────────
// GET /api/push/me
//
// Returns the authenticated user's registered
// push subscriptions.
//
// Useful for debugging and account/device management.
// ─────────────────────────────────────────────────────
router.get('/me', async (req, res, next) => {
    try {
        const user = await resolveUser(req, res);

        if (!user) return;

        const subscriptions = await PushSubscription.find({
            userId: user._id,
        })
            .select(
                '_id platform browser deviceType createdAt updatedAt lastUsedAt'
            )
            .sort({
                updatedAt: -1,
            });

        return res.json({
            data: {
                subscriptions,
            },
        });
    } catch (err) {
        logger.error('[PUSH] GET /me failed', {
            error: err.message,
        });

        next(err);
    }
});

// ─────────────────────────────────────────────────────
// DELETE /api/push/unsubscribe
//
// Removes a browser push subscription.
//
// Request:
// {
//   "endpoint": "..."
// }
// ─────────────────────────────────────────────────────
router.delete('/unsubscribe', async (req, res, next) => {
    try {
        const user = await resolveUser(req, res);

        if (!user) return;

        const { endpoint } = req.body;

        if (
            typeof endpoint !== 'string' ||
            !endpoint.trim()
        ) {
            return res.status(400).json({
                error: 'Push subscription endpoint is required',
            });
        }

        const result =
            await PushSubscription.findOneAndDelete({
                endpoint: endpoint.trim(),
                userId: user._id,
            });

        if (!result) {
            return res.status(404).json({
                error: 'Push subscription not found',
            });
        }

        logger.info(
            `[PUSH] Subscription removed for user ${user._id}`
        );

        return res.json({
            data: {
                success: true,
            },
        });
    } catch (err) {
        logger.error('[PUSH] DELETE /unsubscribe failed', {
            error: err.message,
        });

        next(err);
    }
});

module.exports = router;
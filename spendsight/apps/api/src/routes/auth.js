const express = require('express');
const admin = require('firebase-admin');
const { z } = require('zod');

const logger = require('../utils/logger');
const authMiddleware = require('../middleware/authMiddleware');

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Insight = require('../models/Insight');
const Category = require('../models/Category');

const router = express.Router();

//
// ──────────────────────────────────────────────────────────
// Firebase Admin Initialization
// ──────────────────────────────────────────────────────────
//

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
    });

    logger.info('Firebase Admin initialized');
}

//
// ──────────────────────────────────────────────────────────
// Validation Schemas
// ──────────────────────────────────────────────────────────
//

const verifySchema = z.object({
    idToken: z.string().min(1),
});

const updateProfileSchema = z.object({
    name: z.string().trim().min(2).max(40).optional(),
    monthlyIncome: z.number().positive().optional(),
});

//
// ──────────────────────────────────────────────────────────
// POST /api/auth/verify
// Verify Firebase token and create user if first login
// ──────────────────────────────────────────────────────────
//

router.post('/verify', async (req, res, next) => {
    try {
        const parsed = verifySchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request body',
                details: parsed.error.errors,
            });
        }

        const { idToken } = parsed.data;

        // Verify Firebase token
        const decoded = await admin.auth().verifyIdToken(idToken);

        const uid = decoded.uid;

        let user = await User.findOne({ firebaseUid: uid });

        // First-time user
        if (!user) {
            user = await User.create({
                firebaseUid: uid,
            });

            logger.info(`New user created`, {
                firebaseUid: uid,
                mongoUserId: user._id,
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                userId: user._id,
                firebaseUid: user.firebaseUid,
                name: user.name || '',
                monthlyIncome: user.monthlyIncome || 0,
                isNewUser: !user.name,
                notificationPrefs: user.notificationPrefs || {},
            },
        });
    } catch (err) {
        logger.error('Auth verification failed', {
            error: err.message,
        });

        next(err);
    }
});

//
// ──────────────────────────────────────────────────────────
// PATCH /api/auth/profile
// Update onboarding/profile data
// ──────────────────────────────────────────────────────────
//

router.patch('/profile', authMiddleware, async (req, res, next) => {
    try {
        const parsed = updateProfileSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid profile data',
                details: parsed.error.errors,
            });
        }

        const { name, monthlyIncome } = parsed.data;

        const update = {};

        if (name !== undefined) {
            update.name = name.trim();
        }

        if (monthlyIncome !== undefined) {
            // Store in paise
            update.monthlyIncome = Math.round(monthlyIncome * 100);
        }

        const user = await User.findOneAndUpdate(
            { firebaseUid: req.userId },
            { $set: update },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        logger.info('Profile updated', {
            firebaseUid: req.userId,
        });

        return res.status(200).json({
            success: true,
            data: {
                name: user.name,
                monthlyIncome: user.monthlyIncome,
            },
        });
    } catch (err) {
        logger.error('Profile update failed', {
            firebaseUid: req.userId,
            error: err.message,
        });

        next(err);
    }
});

//
// ──────────────────────────────────────────────────────────
// DELETE /api/auth/account
// Permanently delete account and all related data
// ──────────────────────────────────────────────────────────
//

router.delete('/account', authMiddleware, async (req, res, next) => {
    try {
        logger.info('Delete account request received', {
            firebaseUid: req.userId,
        });

        const user = await User.findOne({
            firebaseUid: req.userId,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        //
        // Delete all MongoDB user-related data
        //

        await Promise.all([
            Transaction.deleteMany({ userId: user._id }),
            Budget.deleteMany({ userId: user._id }),
            Insight.deleteMany({ userId: user._id }),
            Category.deleteMany({
                userId: user._id,
                isDefault: false,
            }),
        ]);

        // Delete user document last
        await User.deleteOne({ _id: user._id });

        logger.info('MongoDB user data deleted', {
            firebaseUid: req.userId,
            mongoUserId: user._id,
        });

        //
        // Delete Firebase Auth user
        // This is intentionally isolated so Mongo deletion
        // is not rolled back if Firebase fails.
        //

        try {
            await admin.auth().deleteUser(req.userId);

            logger.info('Firebase Auth user deleted', {
                firebaseUid: req.userId,
            });
        } catch (firebaseErr) {
            logger.warn('Firebase user deletion failed', {
                firebaseUid: req.userId,
                error: firebaseErr.message,
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                message: 'Account deleted successfully',
            },
        });
    } catch (err) {
        logger.error('Delete account failed', {
            firebaseUid: req.userId,
            error: err.message,
        });

        next(err);
    }
});

module.exports = router;
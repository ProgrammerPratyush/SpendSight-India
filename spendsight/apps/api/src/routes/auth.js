const logger = require('../utils/logger');
const { deleteAccount } = require("../controllers/userController");
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const User = require('../models/User');

// Initialise Firebase Admin if not already done
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
    });
}

// POST /api/auth/verify
// Called after user completes OTP on mobile
// Creates user in MongoDB if first time, returns user profile
router.post('/verify', async (req, res, next) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: 'idToken is required' });
        }

        // Verify the Firebase token
        const decoded = await admin.auth().verifyIdToken(idToken);
        const { uid, phone_number } = decoded;

        // Check if user already exists
        let user = await User.findOne({ firebaseUid: uid });

        if (!user) {
            // First time — create new user
            user = await User.create({ firebaseUid: uid });
            logger.info(`New user created: ${uid}`);
        }

        res.status(200).json({
            data: {
                userId: user._id,
                firebaseUid: user.firebaseUid,
                name: user.name,
                isNewUser: !user.name,   // true if onboarding not completed yet
                notificationPrefs: user.notificationPrefs,
            }
        });

    } catch (err) {
        next(err);
    }
});

// PATCH /api/auth/profile
// Update user name and income after onboarding
const authMiddleware = require('../middleware/authMiddleware');

router.patch('/profile', authMiddleware, async (req, res, next) => {
    try {
        const { name, monthlyIncome } = req.body;

        const update = {};
        if (name) update.name = name.trim();
        if (monthlyIncome) update.monthlyIncome = Math.round(monthlyIncome * 100); // convert to paise

        const user = await User.findOneAndUpdate(
            { firebaseUid: req.userId },
            { $set: update },
            { new: true }
        );

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ data: { name: user.name, monthlyIncome: user.monthlyIncome } });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/auth/delete-account
// Permanently delete user + all related data
router.delete("/delete-account", authMiddleware, async (req, res) => {
    try {
        logger.info(`Delete account request received for UID: ${req.userId}`);

        // Find current user
        const user = await User.findOne({ firebaseUid: req.userId });

        if (!user) {
            logger.warn(`User not found for UID: ${req.userId}`);

            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Load models
        const Transaction = require("../models/Transaction");
        const Budget = require("../models/Budget");
        const Insight = require("../models/Insight");
        const Category = require("../models/Category");

        // Delete all related collections
        await Promise.all([
            Transaction.deleteMany({ userId: user._id }),
            Budget.deleteMany({ userId: user._id }),
            Insight.deleteMany({ userId: user._id }),
            Category.deleteMany({
                userId: user._id,
                isDefault: false,
            }),
        ]);

        logger.info(`Deleted related collections for user ${user._id}`);

        // Delete Mongo user
        await User.findByIdAndDelete(user._id);

        logger.info(`Deleted Mongo user ${user._id}`);

        // Delete Firebase Auth user
        try {
            await admin.auth().deleteUser(req.userId);

            logger.info(`Deleted Firebase user ${req.userId}`);
        } catch (firebaseErr) {
            logger.error(
                `Firebase delete failed: ${firebaseErr.message}`
            );
        }

        return res.status(200).json({
            success: true,
            message: "Account deleted successfully",
        });

    } catch (error) {
        logger.error(`Delete account failed: ${error.message}`);

        return res.status(500).json({
            success: false,
            message: "Failed to delete account",
            error: error.message,
        });
    }
});

module.exports = router;
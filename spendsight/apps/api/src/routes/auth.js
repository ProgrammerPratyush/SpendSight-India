const logger = require('../utils/logger');
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

// DELETE /api/auth/account
// Permanently deletes user data from MongoDB and Firebase
router.delete('/account', authMiddleware, async (req, res, next) => {
    try {
        const user = await User.findOne({ firebaseUid: req.userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Delete all user data from MongoDB
        const Transaction = require('../models/Transaction');
        const Budget = require('../models/Budget');
        const Insight = require('../models/Insight');
        const Category = require('../models/Category');

        await Transaction.deleteMany({ userId: user._id });
        await Budget.deleteMany({ userId: user._id });
        await Insight.deleteMany({ userId: user._id });
        await Category.deleteMany({ userId: user._id, isDefault: false });
        await User.deleteOne({ _id: user._id });

        // Delete from Firebase Auth
        await admin.auth().deleteUser(req.userId);

        res.json({ data: { success: true, message: 'Account deleted successfully' } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
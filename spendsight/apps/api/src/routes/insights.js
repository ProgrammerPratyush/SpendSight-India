const logger = require('../utils/logger');
const express = require('express');
const router = express.Router();
const Insight = require('../models/Insight');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/insights
// Returns latest insights for the user
router.get('/', async (req, res, next) => {
    try {
        // Disable caching to ensure fresh insights are always returned
        res.set(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate"
        );
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");

        const user = await User.findOne({ firebaseUid: req.userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const insights = await Insight.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(10);

        // If no stored insights yet, generate a live one on the fly
        if (insights.length === 0) {
            const today = new Date();

            const startOfMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );

            const transactions = await Transaction.find({
                userId: user._id,
                txDate: { $gte: startOfMonth },
                type: 'debit',
                status: 'completed',
            });

            const totalPaise =
                transactions.reduce(
                    (sum, tx) => sum + tx.amount,
                    0
                );

            const totalRupees =
                Math.round(totalPaise / 100);

            return res.json({
                data: {
                    insights: [
                        {
                            type: 'system',
                            text:
                                totalRupees > 0
                                    ? `No generated insights found. Current spend this month: ₹${totalRupees.toLocaleString('en-IN')}`
                                    : 'No transactions available.',
                        },
                    ],
                    live: true,
                    insightCount: 0,
                },
            });
        }

        res.json({ data: { insights, live: false } });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/insights/:id/read
// Mark an insight as read
router.patch('/:id/read', async (req, res, next) => {
    try {
        const user = await User.findOne({ firebaseUid: req.userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        await Insight.findOneAndUpdate(
            { _id: req.params.id, userId: user._id },
            { $set: { readAt: new Date() } }
        );

        res.json({ data: { success: true } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
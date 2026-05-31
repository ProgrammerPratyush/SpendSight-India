const express = require('express');
const router = express.Router();

const {
    generateInsightsForUser,
} = require('../jobs/insightEngine');

const User = require('../models/User');

router.post('/run-insights', async (req, res) => {
    try {
        const user = await User.findOne({
            firebaseUid: req.userId,
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
            });
        }

        const count =
            await generateInsightsForUser(user._id);

        res.json({
            success: true,
            userId: user._id,
            insightsCreated: count,
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: err.message,
        });
    }
});

module.exports = router;
const logger = require('../utils/logger');
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');


router.get('/', async (req, res, next) => {
    try {
        // Get the MongoDB user to have the correct ObjectId
        const user = await User.findOne({ firebaseUid: req.userId });

        // Fetch system categories + user's custom ones
        const categories = await Category.find({
            $or: [
                { isDefault: true },
                { userId: user ? user._id : null }
            ]
        }).sort({ name: 1 });

        res.json({ data: { categories } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
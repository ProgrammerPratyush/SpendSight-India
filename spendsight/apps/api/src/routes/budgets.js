const logger = require('../utils/logger');
const express = require('express');
const router = express.Router();
const { z } = require('zod');
const Budget = require('../models/Budget');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const budgetSchema = z.object({
    period: z.enum(['monthly', 'weekly']).default('monthly'),
    categoryId: z.string().nullable().optional(),
    limitAmount: z.number().positive(),   // in rupees — converted to paise on save
    alertAt: z.number().min(1).max(100).default(80),
});

// GET /api/budgets
router.get('/', async (req, res, next) => {
    try {
        const user = await User.findOne({ firebaseUid: req.userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const budgets = await Budget.find({ userId: user._id, isActive: true })
            .populate('categoryId', 'name icon color');

        res.json({
            data: {
                budgets: budgets.map(b => ({
                    ...b.toObject(),
                    limitAmountInRupees: b.limitAmount / 100,
                }))
            }
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/budgets
router.post('/', async (req, res, next) => {
    try {
        const user = await User.findOne({ firebaseUid: req.userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const parsed = budgetSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid data', details: parsed.error.errors });
        }

        const body = parsed.data;

        const budget = await Budget.create({
            userId: user._id,
            period: body.period,
            categoryId: body.categoryId || null,
            limitAmount: Math.round(body.limitAmount * 100),   // rupees to paise
            alertAt: body.alertAt,
        });

        res.status(201).json({
            data: { ...budget.toObject(), limitAmountInRupees: budget.limitAmount / 100 }
        });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/budgets/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const user = await User.findOne({ firebaseUid: req.userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        await Budget.findOneAndUpdate(
            { _id: req.params.id, userId: user._id },
            { $set: { isActive: false } }
        );

        res.json({ data: { success: true } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
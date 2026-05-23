const logger = require('../utils/logger');
const express = require('express');
const router = express.Router();
const { z } = require('zod');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { classifyMerchant } = require('../services/categoryClassifier');

const createTxSchema = z.object({
    amount: z.number().positive(),
    type: z.enum(['debit', 'credit']),
    merchantRaw: z.string().optional(),
    merchantNormalised: z.string().optional(),
    categoryId: z.string().optional(),
    source: z.enum(['sms', 'manual', 'import', 'nlp']).default('manual'),
    smsHash: z.string().optional(),
    bankLast4: z.string().max(4).optional(),
    txDate: z.string(),
    txRef: z.string().optional(),
    status: z.enum(['completed', 'reversed', 'failed', 'pending']).default('completed'),
    notes: z.string().max(300).optional(),
});

// GET /api/transactions?period=today|week|month
router.get('/', async (req, res, next) => {
    try {
        const user = await User.findOne({ firebaseUid: req.userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { period = 'month', limit = 50, offset = 0 } = req.query;
        const now = new Date();
        let startDate;

        if (period === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (period === 'week') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const transactions = await Transaction.find({
            userId: user._id,
            txDate: { $gte: startDate, $lte: now },
            status: { $ne: 'failed' },
        })
            .sort({ txDate: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset))
            .populate('categoryId', 'name icon color');

        const totals = transactions.reduce((acc, tx) => {
            if (tx.type === 'debit') acc.spent += tx.amount;
            if (tx.type === 'credit') acc.received += tx.amount;
            return acc;
        }, { spent: 0, received: 0 });

        res.json({
            data: {
                transactions: transactions.map(tx => ({
                    ...tx.toObject(),
                    amountInRupees: tx.amount / 100,
                })),
                totals: {
                    spent: totals.spent,
                    spentInRupees: totals.spent / 100,
                    received: totals.received,
                    receivedInRupees: totals.received / 100,
                },
                period,
                count: transactions.length,
            }
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/transactions
router.post('/', async (req, res, next) => {
    try {
        const user = await User.findOne({ firebaseUid: req.userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const parsed = createTxSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid data', details: parsed.error.errors });
        }

        const body = parsed.data;

        if (body.smsHash) {
            const existing = await Transaction.findOne({
                userId: user._id,
                smsHash: body.smsHash,
            });
            if (existing) {
                return res.status(200).json({
                    data: { duplicate: true, message: 'Transaction already exists' }
                });
            }
        }

        const categoryId = body.categoryId ||
            await classifyMerchant(body.merchantNormalised || body.merchantRaw) ||
            null;

        const tx = await Transaction.create({
            userId: user._id,
            amount: Math.round(body.amount * 100),
            type: body.type,
            merchantRaw: body.merchantRaw || '',
            merchantNormalised: body.merchantNormalised || '',
            categoryId,
            source: body.source,
            smsHash: body.smsHash || null,
            bankLast4: body.bankLast4 || '',
            txDate: new Date(body.txDate),
            txRef: body.txRef || '',
            status: body.status,
            notes: body.notes || '',
        });

        logger.info(`Transaction created: ${tx._id}`);

        res.status(201).json({
            data: {
                ...tx.toObject(),
                amountInRupees: tx.amount / 100,
            }
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/transactions/bulk
router.post('/bulk', async (req, res, next) => {
    try {
        const user = await User.findOne({ firebaseUid: req.userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { transactions } = req.body;
        if (!Array.isArray(transactions) || transactions.length === 0) {
            return res.status(400).json({ error: 'transactions array is required' });
        }

        if (transactions.length > 500) {
            return res.status(400).json({ error: 'Maximum 500 transactions per bulk insert' });
        }

        let inserted = 0;
        let duplicates = 0;

        for (const item of transactions) {
            const parsed = createTxSchema.safeParse(item);
            if (!parsed.success) continue;

            const body = parsed.data;

            if (body.smsHash) {
                const exists = await Transaction.findOne({
                    userId: user._id,
                    smsHash: body.smsHash,
                });
                if (exists) { duplicates++; continue; }
            }

            await Transaction.create({
                userId: user._id,
                amount: Math.round(body.amount * 100),
                type: body.type,
                merchantRaw: body.merchantRaw || '',
                merchantNormalised: body.merchantNormalised || '',
                categoryId: body.categoryId || null,
                source: body.source,
                smsHash: body.smsHash || null,
                bankLast4: body.bankLast4 || '',
                txDate: new Date(body.txDate),
                txRef: body.txRef || '',
                status: body.status,
                notes: body.notes || '',
            });
            inserted++;
        }

        res.status(201).json({
            data: { inserted, duplicates, total: transactions.length }
        });
    } catch (err) {
        next(err);
    }
});

// PATCH /api/transactions/:id/category
router.patch('/:id/category', async (req, res, next) => {
    try {
        const user = await User.findOne({ firebaseUid: req.userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { categoryId } = req.body;
        if (!categoryId) return res.status(400).json({ error: 'categoryId is required' });

        const tx = await Transaction.findOneAndUpdate(
            { _id: req.params.id, userId: user._id },
            { $set: { categoryId, userCorrected: true } },
            { new: true }
        );

        if (!tx) return res.status(404).json({ error: 'Transaction not found' });

        res.json({ data: tx });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
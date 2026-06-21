const cron = require('node-cron');

const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Insight = require('../models/Insight');
const User = require('../models/User');

const logger = require('../utils/logger');

// ─────────────────────────────────────────
// HELPER: Format paise → ₹ readable string
// ─────────────────────────────────────────
function formatRupees(paise) {
    return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

// ─────────────────────────────────────────
// HELPER: Get start of today (midnight)
// ─────────────────────────────────────────
function getStartOfToday() {
    const now = new Date();
    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );
}

// ─────────────────────────────────────────
// HELPER: Get start of current month
// ─────────────────────────────────────────
function getStartOfMonth() {
    const now = new Date();
    return new Date(
        now.getFullYear(),
        now.getMonth(),
        1
    );
}

// ─────────────────────────────────────────────────────
// HELPER: Map category string → human readable name
// ─────────────────────────────────────────────────────
function resolveCategoryName(raw) {
    if (!raw) return 'Uncategorised';

    const map = {
        food_dining: 'Food & Dining',
        food: 'Food & Dining',
        shopping: 'Shopping',
        travel: 'Travel',
        utilities: 'Utilities',
        entertainment: 'Entertainment',
        health: 'Health',
        groceries: 'Groceries',
        subscriptions: 'Subscriptions',
        transfers: 'Transfers',
        other: 'Other',
    };

    return map[raw.toLowerCase()] || raw;
}

// ─────────────────────────────────────────────────────
// HELPER: Map category string → emoji icon
// ─────────────────────────────────────────────────────
function resolveCategoryIcon(raw) {
    if (!raw) return '💰';

    const map = {
        food_dining: '🍽️',
        food: '🍽️',
        shopping: '🛒',
        travel: '✈️',
        utilities: '💡',
        entertainment: '🎬',
        health: '🏥',
        groceries: '🛍️',
        subscriptions: '📦',
        transfers: '🔁',
        other: '💰',
    };

    return map[raw.toLowerCase()] || '💰';
}

// ─────────────────────────────────────────
// CORE: Generate all insights for one user
// ─────────────────────────────────────────
async function generateInsightsForUser(userId) {
    const now = new Date();
    const startOfToday = getStartOfToday();
    const startOfMonth = getStartOfMonth();

    let createdCount = 0;

    // ─────────────────────────────────────
    // BLOCK 1: DAILY DIGEST
    // ─────────────────────────────────────
    try {
        const todayTransactions = await Transaction.find({
            userId,
            type: 'debit',
            status: 'completed',
            txDate: { $gte: startOfToday },
        });

        const todaySpend = todayTransactions.reduce(
            (sum, tx) => sum + (tx.amount || 0),
            0
        );

        logger.info(`[INSIGHTS] Daily spend for ${userId}: ${todaySpend}`);

        if (todaySpend > 0) {
            const existing = await Insight.findOne({
                userId,
                type: 'daily_digest',
                createdAt: { $gte: startOfToday },
            });

            if (!existing) {
                await Insight.create({
                    userId,
                    type: 'daily_digest',

                    // ✅ Change #3: Corrected metadata
                    title: 'Daily Summary',
                    icon: '📊',
                    severity: 'info',

                    text: `You spent ${formatRupees(todaySpend)} today across ${todayTransactions.length} transaction${todayTransactions.length > 1 ? 's' : ''}.`,

                    data: {
                        totalSpend: todaySpend,
                        transactionCount: todayTransactions.length,
                    },

                    period: {
                        start: startOfToday,
                        end: now,
                    },
                });

                createdCount++;
                logger.info(`[INSIGHTS] daily_digest created for ${userId}`);
            }
        }
    } catch (err) {
        logger.error(`[INSIGHTS] daily_digest failed for ${userId}`, {
            error: err.message,
        });
    }

    // ─────────────────────────────────────
    // BLOCK 2: FETCH MONTH TRANSACTIONS
    // (Shared across Block 3, 4, 5)
    // ─────────────────────────────────────
    let monthTransactions = [];
    let monthSpend = 0;

    try {
        monthTransactions = await Transaction.find({
            userId,
            type: 'debit',
            status: 'completed',
            txDate: { $gte: startOfMonth },
        });

        monthSpend = monthTransactions.reduce(
            (sum, tx) => sum + (tx.amount || 0),
            0
        );
    } catch (err) {
        logger.error(
            `[INSIGHTS] Month transactions fetch failed for ${userId}`,
            { error: err.message }
        );
    }

    // ─────────────────────────────────────
    // BLOCK 3: BUDGET ALERT
    // ─────────────────────────────────────
    try {
        const budgets = await Budget.find({
            userId,
            isActive: true,
        });

        for (const budget of budgets) {
            const limit = budget.limitAmount;

            if (!limit || limit <= 0) continue;

            const percentUsed = (monthSpend / limit) * 100;

            if (percentUsed < (budget.alertAt || 80)) continue;

            const existing = await Insight.findOne({
                userId,
                type: 'limit_alert',
                'data.budgetId': budget._id.toString(),
                createdAt: { $gte: startOfToday },
            });

            if (!existing) {
                const isExceeded = percentUsed >= 100;

                await Insight.create({
                    userId,
                    type: 'limit_alert',

                    // ✅ Change #3: Unified to 'Budget Warning' always
                    // severity escalates to 'danger' only when exceeded
                    title: 'Budget Warning',
                    icon: '⚠️',
                    severity: isExceeded ? 'danger' : 'warning',

                    text:
                        isExceeded
                            ? `You have exceeded your monthly budget by ${formatRupees(monthSpend - limit)}.`
                            : `You have used ${Math.round(percentUsed)}% of your monthly budget.`,

                    data: {
                        budgetId: budget._id.toString(),
                        spent: monthSpend,
                        limit,
                        percentUsed,
                    },

                    period: {
                        start: startOfMonth,
                        end: now,
                    },
                });

                createdCount++;
                logger.info(`[INSIGHTS] limit_alert created for ${userId}`);
            }
        }
    } catch (err) {
        logger.error(`[INSIGHTS] limit_alert failed for ${userId}`, {
            error: err.message,
        });
    }

    // ─────────────────────────────────────
    // BLOCK 4: MONTH OVER MONTH TREND
    // ─────────────────────────────────────
    try {
        const previousMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
        );

        const previousMonthEnd = new Date(
            now.getFullYear(),
            now.getMonth(),
            0,
            23, 59, 59
        );

        const previousMonthTransactions = await Transaction.find({
            userId,
            type: 'debit',
            status: 'completed',
            txDate: {
                $gte: previousMonthStart,
                $lte: previousMonthEnd,
            },
        });

        const previousMonthSpend = previousMonthTransactions.reduce(
            (sum, tx) => sum + (tx.amount || 0),
            0
        );

        if (previousMonthSpend > 0 && monthSpend > 0) {
            const changePercent =
                ((monthSpend - previousMonthSpend) / previousMonthSpend) * 100;

            if (Math.abs(changePercent) >= 5) {
                const existingTrend = await Insight.findOne({
                    userId,
                    type: 'trend',
                    createdAt: { $gte: startOfMonth },
                });

                if (!existingTrend) {
                    const isUp = changePercent > 0;

                    await Insight.create({
                        userId,
                        type: 'trend',

                        // ✅ Change #3: Exact titles and icons as specified
                        title: isUp ? 'Spending Increased' : 'Spending Reduced',
                        icon: isUp ? '📈' : '✅',
                        severity: isUp ? 'warning' : 'success',

                        text:
                            isUp
                                ? `You have spent ${Math.round(changePercent)}% more this month compared to last month.`
                                : `Great job. Spending is down ${Math.abs(Math.round(changePercent))}% compared to last month.`,

                        data: {
                            currentMonthSpend: monthSpend,
                            previousMonthSpend,
                            changePercent: Math.round(changePercent),
                        },

                        period: {
                            start: previousMonthStart,
                            end: now,
                        },
                    });

                    createdCount++;
                    logger.info(`[INSIGHTS] trend created for ${userId}`);
                }
            }
        }
    } catch (err) {
        logger.error(`[INSIGHTS] trend failed for ${userId}`, {
            error: err.message,
        });
    }

    // ─────────────────────────────────────
    // BLOCK 5: MONTHLY WRAP (Top Category)
    // ─────────────────────────────────────
    try {
        const categorySpendMap = {};

        for (const tx of monthTransactions) {
            const key =
                tx.categoryId?.toString() ||
                tx.category?.toString();

            if (!key) continue;

            categorySpendMap[key] =
                (categorySpendMap[key] || 0) + tx.amount;
        }

        let topCategoryKey = null;
        let topAmount = 0;

        for (const [key, amount] of Object.entries(categorySpendMap)) {
            if (amount > topAmount) {
                topAmount = amount;
                topCategoryKey = key;
            }
        }

        if (topCategoryKey && monthSpend > 0) {
            const percentage = Math.round(
                (topAmount / monthSpend) * 100
            );

            if (percentage >= 25) {
                const existing = await Insight.findOne({
                    userId,
                    type: 'monthly_wrap',
                    createdAt: { $gte: startOfMonth },
                });

                if (!existing) {
                    const categoryName =
                        resolveCategoryName(topCategoryKey);

                    await Insight.create({
                        userId,
                        type: 'monthly_wrap',

                        // ✅ Change #3: Exact title and icon as specified
                        // icon is always 🛒 regardless of category
                        // (overrides dynamic icon from Change #1)
                        title: 'Top Spending Category',
                        icon: '🛒',
                        severity: 'info',

                        text: `${categoryName} accounts for ${percentage}% of your spending this month.`,

                        data: {
                            categoryName,
                            amount: topAmount,
                            percentage,
                        },

                        period: {
                            start: startOfMonth,
                            end: now,
                        },
                    });

                    createdCount++;
                    logger.info(`[INSIGHTS] monthly_wrap created for ${userId}`);
                }
            }
        }
    } catch (err) {
        logger.error(`[INSIGHTS] monthly_wrap failed for ${userId}`, {
            error: err.message,
        });
    }

    // ─────────────────────────────────────
    // BLOCK 6: RECURRING EXPENSE DETECTION
    // ─────────────────────────────────────
    try {
        const sixMonthsAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 6,
            now.getDate()
        );

        const recurringTransactions = await Transaction.find({
            userId,
            type: 'debit',
            status: 'completed',
            txDate: { $gte: sixMonthsAgo },
        }).sort({ merchantNormalised: 1, txDate: 1 });

        const merchantMap = {};

        for (const tx of recurringTransactions) {
            const merchant =
                tx.merchantNormalised?.trim().toLowerCase();
            if (!merchant) continue;

            if (!merchantMap[merchant]) {
                merchantMap[merchant] = [];
            }
            merchantMap[merchant].push(tx);
        }

        const recurringMerchants = [];

        for (const [merchant, txs] of Object.entries(merchantMap)) {
            if (txs.length < 2) continue;

            let monthlyPattern = true;

            for (let i = 1; i < txs.length; i++) {
                const diffDays =
                    Math.abs(txs[i].txDate - txs[i - 1].txDate) /
                    (1000 * 60 * 60 * 24);

                if (diffDays < 20 || diffDays > 40) {
                    monthlyPattern = false;
                    break;
                }
            }

            if (!monthlyPattern) continue;

            const avgAmount =
                txs.reduce((sum, tx) => sum + tx.amount, 0) /
                txs.length;

            const amountsSimilar = txs.every((tx) => {
                const variance =
                    Math.abs(tx.amount - avgAmount) / avgAmount;
                return variance <= 0.15;
            });

            if (!amountsSimilar) continue;

            recurringMerchants.push({
                merchant,
                monthlyCost: Math.round(avgAmount),
                count: txs.length,
            });
        }

        if (recurringMerchants.length > 0) {
            const existing = await Insight.findOne({
                userId,
                type: 'recurring_detected',
                createdAt: { $gte: startOfMonth },
            });

            if (!existing) {
                const totalRecurringCost =
                    recurringMerchants.reduce(
                        (sum, item) => sum + item.monthlyCost,
                        0
                    );

                const isSingle = recurringMerchants.length === 1;

                await Insight.create({
                    userId,
                    type: 'recurring_detected',

                    // ✅ Change #3: Exact title and icon as specified
                    title: 'Recurring Expense',
                    icon: '🔁',
                    severity: 'info',

                    text:
                        isSingle
                            ? `Recurring expense detected: ${recurringMerchants[0].merchant} costs approximately ${formatRupees(recurringMerchants[0].monthlyCost)} per month.`
                            : `You have ${recurringMerchants.length} recurring expenses totalling approximately ${formatRupees(totalRecurringCost)} per month.`,

                    data: {
                        recurringMerchants,
                        totalRecurringCost,
                    },

                    period: {
                        start: sixMonthsAgo,
                        end: now,
                    },
                });

                createdCount++;
                logger.info(
                    `[INSIGHTS] recurring_detected created for ${userId}`
                );
            }
        }
    } catch (err) {
        logger.error(
            `[INSIGHTS] recurring_detected failed for ${userId}`,
            { error: err.message }
        );
    }

    // ─────────────────────────────────────
    // BLOCK 7: UNUSUAL SPEND DETECTION
    // ─────────────────────────────────────
    try {
        const ninetyDaysAgo = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 90
        );

        const merchantTransactions = await Transaction.find({
            userId,
            type: 'debit',
            status: 'completed',
            txDate: { $gte: ninetyDaysAgo },
        }).sort({ txDate: -1 });

        const merchantGroups = {};

        for (const tx of merchantTransactions) {
            const merchant =
                tx.merchantNormalised?.trim().toLowerCase();
            if (!merchant) continue;

            if (!merchantGroups[merchant]) {
                merchantGroups[merchant] = [];
            }
            merchantGroups[merchant].push(tx);
        }

        for (const [merchant, txs] of Object.entries(merchantGroups)) {
            if (txs.length < 3) continue;

            const latestTx = txs[0];
            const historicalTxs = txs.slice(1);

            const averageSpend =
                historicalTxs.reduce(
                    (sum, tx) => sum + tx.amount, 0
                ) / historicalTxs.length;

            if (averageSpend <= 0) continue;

            const isRecent = latestTx.txDate >= startOfToday;

            if (isRecent && latestTx.amount > averageSpend * 3) {
                const existing = await Insight.findOne({
                    userId,
                    type: 'unusual_spend',
                    'data.transactionId': latestTx._id.toString(),
                });

                if (!existing) {
                    await Insight.create({
                        userId,
                        type: 'unusual_spend',

                        // ✅ Change #3: Exact title and severity as specified
                        // Note: severity is 'danger' not 'critical'
                        title: 'Large Purchase Detected',
                        icon: '🚨',
                        severity: 'danger',

                        text: `Large spending detected at ${merchant}: ${formatRupees(latestTx.amount)} versus your usual ${formatRupees(averageSpend)}.`,

                        data: {
                            merchant,
                            transactionId: latestTx._id.toString(),
                            amount: latestTx.amount,
                            averageSpend: Math.round(averageSpend),
                        },

                        period: {
                            start: ninetyDaysAgo,
                            end: now,
                        },
                    });

                    createdCount++;
                    logger.info(
                        `[INSIGHTS] unusual_spend created for ${userId}`
                    );
                }
            }
        }
    } catch (err) {
        logger.error(
            `[INSIGHTS] unusual_spend failed for ${userId}`,
            { error: err.message }
        );
    }

    logger.info(
        `[INSIGHTS] Total insights created for ${userId}: ${createdCount}`
    );

    return createdCount;
}

// ─────────────────────────────────────────
// SCHEDULER: Runs every day at 3:00 AM IST
// ─────────────────────────────────────────
function startInsightEngine() {
    cron.schedule(
        '0 3 * * *',
        async () => {
            logger.info('[INSIGHTS] Insight Engine Started');

            try {
                const users = await User.find({});

                logger.info(
                    `[INSIGHTS] Processing ${users.length} users`
                );

                let totalCreated = 0;

                for (const user of users) {
                    try {
                        const count =
                            await generateInsightsForUser(user._id);
                        totalCreated += count;
                    } catch (err) {
                        logger.error(
                            `[INSIGHTS] Failed for user ${user._id}`,
                            { error: err.message }
                        );
                    }
                }

                logger.info(
                    `[INSIGHTS] Engine Completed. ${totalCreated} total insights created.`
                );
            } catch (err) {
                logger.error('[INSIGHTS] Engine Failed', {
                    error: err.message,
                });
            }
        },
        {
            timezone: 'Asia/Kolkata',
        }
    );

    logger.info(
        '[INSIGHTS] Engine Scheduled — runs daily at 3:00 AM IST'
    );
}

module.exports = {
    startInsightEngine,
    generateInsightsForUser,
};
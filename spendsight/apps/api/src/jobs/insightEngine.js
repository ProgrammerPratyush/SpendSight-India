const cron = require('node-cron');

const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Insight = require('../models/Insight');
const User = require('../models/User');

const logger = require('../utils/logger');

function formatRupees(paise) {
    return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

async function generateInsightsForUser(userId) {
    const now = new Date();

    const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
    );

    let createdCount = 0;

    //
    // DAILY DIGEST
    //
    const todayTransactions = await Transaction.find({
        userId,
        type: 'debit',
        status: 'completed',
        txDate: {
            $gte: startOfToday,
        },
    });

    console.log(
        '[INSIGHTS] Transactions:',
        JSON.stringify(todayTransactions, null, 2)
    );

    const todaySpend = todayTransactions.reduce(
        (sum, tx) => sum + tx.amount,
        0
    );

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
                text: `You spent ${formatRupees(todaySpend)} today across ${todayTransactions.length} transactions.`,
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
        }
    }
    console.log(
        '[INSIGHTS] Spend:',
        todaySpend
    );

    //
    // BUDGET ALERTS
    //
    const budgets = await Budget.find({
        userId,
        isActive: true,
    });

    const monthTransactions = await Transaction.find({
        userId,
        type: 'debit',
        status: 'completed',
        txDate: {
            $gte: startOfMonth,
        },
    });

    const monthSpend = monthTransactions.reduce(
        (sum, tx) => sum + tx.amount,
        0
    );

    for (const budget of budgets) {
        const limit = budget.limitAmount;

        if (!limit || limit <= 0) continue;

        const percentUsed = (monthSpend / limit) * 100;

        if (percentUsed >= budget.alertAt) {
            const existing = await Insight.findOne({
                userId,
                type: 'limit_alert',
                createdAt: { $gte: startOfToday },
            });

            if (!existing) {
                await Insight.create({
                    userId,
                    type: 'limit_alert',
                    text:
                        percentUsed >= 100
                            ? `You have exceeded your monthly budget by ${formatRupees(monthSpend - limit)}.`
                            : `You have used ${Math.round(percentUsed)}% of your monthly budget.`,

                    data: {
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
            }
        }
    }

    return createdCount;
}

function startInsightEngine() {
    cron.schedule(
        '0 3 * * *',
        async () => {
            logger.info('Insight Engine Started');

            try {
                const users = await User.find({});

                let totalCreated = 0;

                for (const user of users) {
                    try {
                        const count =
                            await generateInsightsForUser(user._id);

                        totalCreated += count;
                    } catch (err) {
                        logger.error(
                            `Insight generation failed for user ${user._id}`,
                            {
                                error: err.message,
                            }
                        );
                    }
                }

                logger.info(
                    `Insight Engine Completed. ${totalCreated} insights created.`
                );
            } catch (err) {
                logger.error('Insight Engine Failed', {
                    error: err.message,
                });
            }
        },
        {
            timezone: 'Asia/Kolkata',
        }
    );

    logger.info(
        'Insight Engine Scheduled (8:30 AM IST)'
    );
}

module.exports = {
    startInsightEngine,
    generateInsightsForUser,
};
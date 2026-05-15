const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: [
            'daily_digest',
            'limit_alert',
            'trend',
            'recurring_detected',
            'unusual_spend',
            'monthly_wrap',
        ],
        required: true,
    },
    text: {
        type: String,   // the plain-language insight shown to user
        required: true,
    },
    data: {
        type: mongoose.Schema.Types.Mixed,  // supporting numbers behind the insight
        default: {},
    },
    period: {
        start: { type: Date },
        end: { type: Date },
    },
    readAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
    expireAfterSeconds: 60 * 60 * 24 * 90,   // auto-delete after 90 days
});

module.exports = mongoose.model('Insight', insightSchema);
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
    title: {
        type: String,
        default: '',
    },

    icon: {
        type: String,
        default: '💡',
    },

    severity: {
        type: String,
        enum: [
            'success',
            'warning',
            'danger',
            'info',
        ],
        default: 'info',
    },
}, {
    timestamps: true,
    expireAfterSeconds: 60 * 60 * 24 * 90,   // auto-delete after 90 days
});

insightSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 90 }
);

module.exports = mongoose.model('Insight', insightSchema);
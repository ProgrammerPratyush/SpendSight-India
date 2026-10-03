const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        endpoint: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        keys: {
            p256dh: {
                type: String,
                required: true,
                trim: true,
            },

            auth: {
                type: String,
                required: true,
                trim: true,
            },
        },

        platform: {
            type: String,
            enum: ['web'],
            default: 'web',
            required: true,
        },

        browser: {
            type: String,
            trim: true,
            default: 'unknown',
        },

        deviceType: {
            type: String,
            enum: ['desktop', 'mobile', 'tablet', 'unknown'],
            default: 'unknown',
        },

        userAgent: {
            type: String,
            trim: true,
            default: '',
        },

        lastUsedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

pushSubscriptionSchema.index({
    userId: 1,
    endpoint: 1,
});

module.exports = mongoose.model(
    'PushSubscription',
    pushSubscriptionSchema
);
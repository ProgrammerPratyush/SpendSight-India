const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        body: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },

        type: {
            type: String,
            enum: [
                "daily_digest",
                "limit_alert",
                "trend",
                "recurring_detected",
                "unusual_spend",
                "monthly_wrap",
                "system",
            ],
            required: true,
        },

        severity: {
            type: String,
            enum: [
                "info",
                "success",
                "warning",
                "critical",
            ],
            default: "info",
        },

        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },

        deepLink: {
            type: String,
            default: "",
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// -----------------------------------------------------------------------------
// Indexes
// -----------------------------------------------------------------------------

notificationSchema.index({
    userId: 1,
    createdAt: -1,
});

notificationSchema.index({
    userId: 1,
    isRead: 1,
});

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);
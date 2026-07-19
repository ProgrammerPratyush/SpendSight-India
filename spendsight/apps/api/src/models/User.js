const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    name: {
        type: String,
        trim: true,
        default: '',
    },
    phoneHash: {
        type: String,   // bcrypt hash — never store raw phone number
        default: '',
    },
    monthlyIncome: {
        type: Number,   // in paise — optional
        default: 0,
    },
    currency: {
        type: String,
        default: 'INR',
    },
    timezone: {
        type: String,
        default: 'Asia/Kolkata',
    },
    notificationPrefs: {
        dailyDigest: { type: Boolean, default: true },
        limitAlerts: { type: Boolean, default: true },
        recurringAlerts: { type: Boolean, default: true },
    },
    deletionRequestedAt: {
        type: Date,
        default: null,
    },
    notificationDevices: [
        {
            token: {
                type: String,
                required: true,
            },

            platform: {
                type: String,
                enum: ["android", "ios"],
                required: true,
            },

            appVersion: {
                type: String,
                default: "",
            },

            lastSeen: {
                type: Date,
                default: Date.now,
            },
        },
    ],
}, { timestamps: true });   // adds createdAt and updatedAt automatically

module.exports = mongoose.model('User', userSchema);
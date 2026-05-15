const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    icon: {
        type: String,   // emoji: '🍔' or icon key: 'food'
        default: '💰',
    },
    color: {
        type: String,   // hex color for UI
        default: '#6B7280',
    },
    keywords: {
        type: [String], // merchant keywords mapped to this category
        default: [],
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,  // null = system category available to all users
    },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
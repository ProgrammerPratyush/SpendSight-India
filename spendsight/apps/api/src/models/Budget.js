const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    period: {
        type: String,
        enum: ['monthly', 'weekly'],
        default: 'monthly',
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,   // null = total budget across all categories
    },
    limitAmount: {
        type: Number,   // in paise
        required: true,
        min: 1,
    },
    alertAt: {
        type: Number,   // percentage — alert when this % is reached e.g. 80
        default: 80,
        min: 1,
        max: 100,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Budget', budgetSchema);
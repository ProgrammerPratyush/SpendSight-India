const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    amount: {
        type: Number,   // stored in paise — Rs 100 = 10000 paise
        required: true,
        min: 1,
    },
    type: {
        type: String,
        enum: ['debit', 'credit'],
        required: true,
    },
    merchantRaw: {
        type: String,   // original string from SMS — never parsed further server-side
        default: '',
    },
    merchantNormalised: {
        type: String,   // cleaned: 'Swiggy', 'Amazon', etc.
        default: '',
        index: true,
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
    },
    source: {
        type: String,
        enum: ['sms', 'manual', 'import'],
        default: 'manual',
    },
    smsHash: {
        type: String,   // SHA-256 of original SMS — for deduplication only
        default: null,
        sparse: true,
    },
    bankLast4: {
        type: String,   // encrypted — only last 4 digits
        default: '',
    },
    txDate: {
        type: Date,
        required: true,
        index: true,
    },
    txRef: {
        type: String,   // UPI ref or bank ref number
        default: '',
    },
    status: {
        type: String,
        enum: ['completed', 'reversed', 'failed', 'pending'],
        default: 'completed',
    },
    isRecurring: {
        type: Boolean,
        default: false,
    },
    userCorrected: {
        type: Boolean,   // true if user manually edited the category
        default: false,
    },
    notes: {
        type: String,
        default: '',
        maxlength: 300,
    },
}, { timestamps: true });

// Compound index — most common query pattern: all transactions for a user by date
transactionSchema.index({ userId: 1, txDate: -1 });

// Deduplication index
transactionSchema.index({ userId: 1, smsHash: 1 }, { sparse: true });

module.exports = mongoose.model('Transaction', transactionSchema);
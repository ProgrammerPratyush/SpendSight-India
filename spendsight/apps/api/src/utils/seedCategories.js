// this is for fixing the DNS issue for connecting to MongoDB Atlas in some environments
require('node:dns/promises').setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const defaultCategories = [
    { name: 'Food & Dining', icon: '🍔', color: '#F59E0B', keywords: ['swiggy', 'zomato', 'mcdonald', 'domino', 'pizza', 'kfc', 'burger', 'restaurant', 'cafe', 'dhaba', 'hotel', 'biryani', 'food', 'kitchen', 'eat'] },
    { name: 'Shopping', icon: '🛒', color: '#8B5CF6', keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'snapdeal', 'shopping', 'mart', 'store', 'mall', 'retail'] },
    { name: 'Travel', icon: '🚗', color: '#3B82F6', keywords: ['uber', 'ola', 'rapido', 'irctc', 'makemytrip', 'goibibo', 'redbus', 'metro', 'auto', 'cab', 'taxi', 'train', 'flight', 'bus', 'petrol', 'fuel', 'indiane', 'spicejet'] },
    { name: 'Utilities', icon: '⚡', color: '#10B981', keywords: ['electricity', 'bescom', 'msedcl', 'tata power', 'water', 'gas', 'airtel', 'jio', 'vodafone', 'vi', 'bsnl', 'bill', 'recharge', 'broadband', 'wifi', 'internet', 'postpaid', 'prepaid'] },
    { name: 'Entertainment', icon: '🎬', color: '#EC4899', keywords: ['netflix', 'hotstar', 'prime', 'spotify', 'youtube', 'bookmyshow', 'movie', 'pvr', 'inox', 'game', 'steam', 'playstation'] },
    { name: 'Health', icon: '💊', color: '#EF4444', keywords: ['apollo', 'medplus', 'netmeds', '1mg', 'pharmeasy', 'pharmacy', 'hospital', 'clinic', 'doctor', 'medicine', 'health', 'gym', 'cult.fit', 'fitpass'] },
    { name: 'Education', icon: '📚', color: '#6366F1', keywords: ['udemy', 'coursera', 'byju', 'unacademy', 'vedantu', 'book', 'course', 'tuition', 'fees', 'school', 'college', 'coaching'] },
    { name: 'Subscriptions', icon: '🔄', color: '#0EA5E9', keywords: ['subscription', 'membership', 'renewal', 'annual', 'monthly plan', 'premium'] },
    { name: 'Transfers', icon: '💸', color: '#64748B', keywords: ['transfer', 'sent', 'neft', 'imps', 'rtgs', 'upi', 'payment to', 'paid to'] },
    { name: 'Groceries', icon: '🛍️', color: '#84CC16', keywords: ['bigbasket', 'grofers', 'blinkit', 'zepto', 'instamart', 'dmart', 'reliance', 'more', 'spencer', 'grocery', 'vegetables', 'fruits', 'supermarket'] },
    { name: 'Other', icon: '💰', color: '#6B7280', keywords: [] },
];

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    for (const cat of defaultCategories) {
        await Category.findOneAndUpdate(
            { name: cat.name, isDefault: true },
            { ...cat, isDefault: true, userId: null },
            { upsert: true, new: true }
        );
        logger.info(`✅ Seeded: ${cat.name}`);
    }

    logger.info('All categories seeded.');
    process.exit(0);
}

seed().catch(err => {
    logger.error(err);
    process.exit(1);
});
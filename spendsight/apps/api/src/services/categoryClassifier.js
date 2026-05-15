const Category = require('../models/Category');

// Cache categories in memory — reloaded every 10 minutes
let categoryCache = [];
let lastLoaded = null;

async function loadCategories() {
    const now = Date.now();
    if (!lastLoaded || now - lastLoaded > 10 * 60 * 1000) {
        categoryCache = await Category.find({ isDefault: true });
        lastLoaded = now;
    }
    return categoryCache;
}

async function classifyMerchant(merchantName) {
    if (!merchantName) return null;

    const categories = await loadCategories();
    const normalised = merchantName.toLowerCase().trim();

    for (const cat of categories) {
        for (const keyword of cat.keywords) {
            if (normalised.includes(keyword.toLowerCase())) {
                return cat._id;
            }
        }
    }

    // Fallback — return 'Other' category
    const other = categories.find(c => c.name === 'Other');
    return other ? other._id : null;
}

module.exports = { classifyMerchant };
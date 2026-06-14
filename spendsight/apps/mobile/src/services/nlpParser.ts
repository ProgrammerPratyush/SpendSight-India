// On-device NLP parser — runs instantly, zero network required
// Tier 1: regex + Indian merchant dictionary
// Handles 80%+ of real user inputs

export interface ParsedTransaction {
    amount: number;
    merchant?: string;
    description?: string;
    merchantNormalised?: string;
    categoryId?: string;
    categoryName?: string;
    categoryIcon?: string;
    type: "debit" | "credit";
    txDate: Date;
    confidence: number;
    rawInput?: string;
    source?: "nlp_tier1" | "nlp_tier2";
}

// ── Indian merchant dictionary ─────────────────────────────────────────────
// Format: keyword → { name, categoryName, icon, defaultCategoryId }
// categoryId will be resolved from the real categories after parsing

const MERCHANT_MAP: Record<string, { name: string; cat: string; icon: string }> = {
    // Food & Dining
    swiggy: { name: 'Swiggy', cat: 'Food & Dining', icon: '🍔' },
    zomato: { name: 'Zomato', cat: 'Food & Dining', icon: '🍔' },
    dominos: { name: "Domino's", cat: 'Food & Dining', icon: '🍕' },
    dominoes: { name: "Domino's", cat: 'Food & Dining', icon: '🍕' },
    mcdonalds: { name: "McDonald's", cat: 'Food & Dining', icon: '🍔' },
    mcdonald: { name: "McDonald's", cat: 'Food & Dining', icon: '🍔' },
    kfc: { name: 'KFC', cat: 'Food & Dining', icon: '🍗' },
    starbucks: { name: 'Starbucks', cat: 'Food & Dining', icon: '☕' },
    cafe: { name: 'Cafe', cat: 'Food & Dining', icon: '☕' },
    coffee: { name: 'Coffee', cat: 'Food & Dining', icon: '☕' },
    restaurant: { name: 'Restaurant', cat: 'Food & Dining', icon: '🍽️' },
    biryani: { name: 'Biryani', cat: 'Food & Dining', icon: '🍛' },
    pizza: { name: 'Pizza', cat: 'Food & Dining', icon: '🍕' },
    burger: { name: 'Burger', cat: 'Food & Dining', icon: '🍔' },
    dhaba: { name: 'Dhaba', cat: 'Food & Dining', icon: '🍛' },
    hotel: { name: 'Hotel Food', cat: 'Food & Dining', icon: '🍽️' },
    lunch: { name: 'Lunch', cat: 'Food & Dining', icon: '🍱' },
    dinner: { name: 'Dinner', cat: 'Food & Dining', icon: '🍽️' },
    breakfast: { name: 'Breakfast', cat: 'Food & Dining', icon: '🥞' },
    food: { name: 'Food', cat: 'Food & Dining', icon: '🍔' },
    // Travel
    uber: { name: 'Uber', cat: 'Travel', icon: '🚗' },
    ola: { name: 'Ola', cat: 'Travel', icon: '🚕' },
    rapido: { name: 'Rapido', cat: 'Travel', icon: '🏍️' },
    irctc: { name: 'IRCTC', cat: 'Travel', icon: '🚆' },
    makemytrip: { name: 'MakeMyTrip', cat: 'Travel', icon: '✈️' },
    goibibo: { name: 'Goibibo', cat: 'Travel', icon: '✈️' },
    redbus: { name: 'redBus', cat: 'Travel', icon: '🚌' },
    metro: { name: 'Metro', cat: 'Travel', icon: '🚇' },
    auto: { name: 'Auto', cat: 'Travel', icon: '🛺' },
    cab: { name: 'Cab', cat: 'Travel', icon: '🚕' },
    taxi: { name: 'Taxi', cat: 'Travel', icon: '🚕' },
    train: { name: 'Train', cat: 'Travel', icon: '🚆' },
    flight: { name: 'Flight', cat: 'Travel', icon: '✈️' },
    bus: { name: 'Bus', cat: 'Travel', icon: '🚌' },
    petrol: { name: 'Petrol', cat: 'Travel', icon: '⛽' },
    fuel: { name: 'Fuel', cat: 'Travel', icon: '⛽' },
    diesel: { name: 'Diesel', cat: 'Travel', icon: '⛽' },
    toll: { name: 'Toll', cat: 'Travel', icon: '🛣️' },
    parking: { name: 'Parking', cat: 'Travel', icon: '🅿️' },
    indigo: { name: 'IndiGo', cat: 'Travel', icon: '✈️' },
    spicejet: { name: 'SpiceJet', cat: 'Travel', icon: '✈️' },
    // Shopping
    amazon: { name: 'Amazon', cat: 'Shopping', icon: '🛒' },
    flipkart: { name: 'Flipkart', cat: 'Shopping', icon: '🛒' },
    myntra: { name: 'Myntra', cat: 'Shopping', icon: '👗' },
    ajio: { name: 'AJIO', cat: 'Shopping', icon: '👗' },
    meesho: { name: 'Meesho', cat: 'Shopping', icon: '🛍️' },
    nykaa: { name: 'Nykaa', cat: 'Shopping', icon: '💄' },
    snapdeal: { name: 'Snapdeal', cat: 'Shopping', icon: '🛒' },
    shopping: { name: 'Shopping', cat: 'Shopping', icon: '🛍️' },
    mall: { name: 'Mall', cat: 'Shopping', icon: '🏪' },
    market: { name: 'Market', cat: 'Shopping', icon: '🏪' },
    store: { name: 'Store', cat: 'Shopping', icon: '🏪' },
    clothes: { name: 'Clothes', cat: 'Shopping', icon: '👔' },
    // Utilities & Bills
    airtel: { name: 'Airtel', cat: 'Utilities', icon: '📱' },
    jio: { name: 'Jio', cat: 'Utilities', icon: '📱' },
    vodafone: { name: 'Vodafone', cat: 'Utilities', icon: '📱' },
    bsnl: { name: 'BSNL', cat: 'Utilities', icon: '📞' },
    electricity: { name: 'Electricity', cat: 'Utilities', icon: '⚡' },
    bescom: { name: 'BESCOM', cat: 'Utilities', icon: '⚡' },
    msedcl: { name: 'MSEDCL', cat: 'Utilities', icon: '⚡' },
    water: { name: 'Water Bill', cat: 'Utilities', icon: '💧' },
    gas: { name: 'Gas', cat: 'Utilities', icon: '🔥' },
    internet: { name: 'Internet', cat: 'Utilities', icon: '🌐' },
    wifi: { name: 'WiFi', cat: 'Utilities', icon: '📶' },
    broadband: { name: 'Broadband', cat: 'Utilities', icon: '🌐' },
    recharge: { name: 'Recharge', cat: 'Utilities', icon: '📱' },
    bill: { name: 'Bill', cat: 'Utilities', icon: '📄' },
    rent: { name: 'Rent', cat: 'Utilities', icon: '🏠' },
    // Entertainment & Subscriptions
    netflix: { name: 'Netflix', cat: 'Subscriptions', icon: '🎬' },
    hotstar: { name: 'Hotstar', cat: 'Subscriptions', icon: '📺' },
    spotify: { name: 'Spotify', cat: 'Subscriptions', icon: '🎵' },
    youtube: { name: 'YouTube', cat: 'Subscriptions', icon: '▶️' },
    prime: { name: 'Amazon Prime', cat: 'Subscriptions', icon: '📺' },
    bookmyshow: { name: 'BookMyShow', cat: 'Entertainment', icon: '🎭' },
    movie: { name: 'Movie', cat: 'Entertainment', icon: '🎬' },
    pvr: { name: 'PVR', cat: 'Entertainment', icon: '🎬' },
    inox: { name: 'INOX', cat: 'Entertainment', icon: '🎬' },
    // Health
    apollo: { name: 'Apollo', cat: 'Health', icon: '💊' },
    medplus: { name: 'MedPlus', cat: 'Health', icon: '💊' },
    netmeds: { name: 'Netmeds', cat: 'Health', icon: '💊' },
    pharmeasy: { name: 'PharmEasy', cat: 'Health', icon: '💊' },
    pharmacy: { name: 'Pharmacy', cat: 'Health', icon: '💊' },
    hospital: { name: 'Hospital', cat: 'Health', icon: '🏥' },
    doctor: { name: 'Doctor', cat: 'Health', icon: '👨‍⚕️' },
    medicine: { name: 'Medicine', cat: 'Health', icon: '💊' },
    gym: { name: 'Gym', cat: 'Health', icon: '💪' },
    // Groceries
    bigbasket: { name: 'BigBasket', cat: 'Groceries', icon: '🛍️' },
    blinkit: { name: 'Blinkit', cat: 'Groceries', icon: '⚡' },
    zepto: { name: 'Zepto', cat: 'Groceries', icon: '🛍️' },
    instamart: { name: 'Instamart', cat: 'Groceries', icon: '🛒' },
    grofers: { name: 'Grofers', cat: 'Groceries', icon: '🛒' },
    dmart: { name: 'DMart', cat: 'Groceries', icon: '🏪' },
    grocery: { name: 'Grocery', cat: 'Groceries', icon: '🥦' },
    vegetables: { name: 'Vegetables', cat: 'Groceries', icon: '🥦' },
    // Transfers
    transfer: { name: 'Transfer', cat: 'Transfers', icon: '💸' },
    sent: { name: 'Transfer', cat: 'Transfers', icon: '💸' },
    upi: { name: 'UPI Payment', cat: 'Transfers', icon: '💸' },
    neft: { name: 'NEFT', cat: 'Transfers', icon: '🏦' },
    imps: { name: 'IMPS', cat: 'Transfers', icon: '🏦' },
    // Education
    udemy: { name: 'Udemy', cat: 'Education', icon: '📚' },
    coursera: { name: 'Coursera', cat: 'Education', icon: '📚' },
    byjus: { name: "BYJU'S", cat: 'Education', icon: '📖' },
    unacademy: { name: 'Unacademy', cat: 'Education', icon: '📖' },
    book: { name: 'Books', cat: 'Education', icon: '📚' },
    tuition: { name: 'Tuition', cat: 'Education', icon: '🎓' },
    fees: { name: 'Fees', cat: 'Education', icon: '🎓' },
};

// ── Product keywords for detection ────────────────────────────────────────
const PRODUCT_KEYWORDS = [
    "headphones",
    "earphones",
    "laptop",
    "phone",
    "mobile",
    "shirt",
    "shoes",
    "watch",
    "bag",
    "charger",
    "keyboard",
    "mouse",
    "tablet",
    "camera",
    "speaker",
    "cable",
    "adapter",
    "backpack",
    "wallet",
    "glasses",
];

// ── Shopping keywords for heuristic detection ─────────────────────────────
const SHOPPING_KEYWORDS = [
    "buy",
    "bought",
    "purchase",
    "purchased",
    "shopping",
    "ordered",
    "headphones",
    "earphones",
    "laptop",
    "phone",
    "shirt",
    "shoes",
    "clothes",
    "dress",
    "jeans",
    "jacket",
];

// ── Travel keywords for heuristic detection ───────────────────────────────
const TRAVEL_KEYWORDS = [
    "uber",
    "ola",
    "fuel",
    "petrol",
    "diesel",
    "toll",
    "parking",
    "driving",
    "highway",
    "travel",
    "cab",
    "taxi",
    "auto",
    "rapido",
    "metro",
    "train",
    "flight",
    "bus",
];

// ── Date keyword map ───────────────────────────────────────────────────────
function resolveDate(input: string): Date {
    const lower = input.toLowerCase();
    const today = new Date();

    if (lower.includes('yesterday')) {
        const d = new Date(today);
        d.setDate(today.getDate() - 1);
        return d;
    }
    if (lower.includes('day before')) {
        const d = new Date(today);
        d.setDate(today.getDate() - 2);
        return d;
    }
    if (lower.includes('last week')) {
        const d = new Date(today);
        d.setDate(today.getDate() - 7);
        return d;
    }

    // Try to parse date patterns: "23 april", "april 23", "23/4", "23-4"
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    for (let i = 0; i < monthNames.length; i++) {
        const monthRegex = new RegExp(`(\\d{1,2})\\s*${monthNames[i]}`, 'i');
        const match = lower.match(monthRegex);
        if (match) {
            const d = new Date(today.getFullYear(), i, parseInt(match[1]));
            return d;
        }
        const monthRegex2 = new RegExp(`${monthNames[i]}\\s*(\\d{1,2})`, 'i');
        const match2 = lower.match(monthRegex2);
        if (match2) {
            const d = new Date(today.getFullYear(), i, parseInt(match2[1]));
            return d;
        }
    }

    return today;
}

// ── Main parser function ───────────────────────────────────────────────────
export function parseNaturalLanguage(
    input: string,
    categories: Array<{ _id: string; name: string; icon: string }>
): ParsedTransaction {
    const raw = input.trim();
    const lower = raw.toLowerCase().replace(/[₹,]/g, '');

    const result: ParsedTransaction = {
        amount: 0,
        merchant: '',
        description: '',
        merchantNormalised: '',
        categoryId: undefined,
        categoryName: 'Other',
        categoryIcon: '💰',
        type: 'debit',
        txDate: new Date(),
        confidence: 0,
        rawInput: raw,
        source: 'nlp_tier1',
    };

    // ── 1. Detect credit keywords ────────────────────────────────────────────
    const creditKeywords = ['received', 'credited', 'got', 'salary', 'income', 'cashback', 'refund', 'from'];
    if (creditKeywords.some(k => lower.includes(k))) {
        result.type = 'credit';
    }

    // ── 2. Extract amount ────────────────────────────────────────────────────
    const amountPatterns = [
        /(?:rs\.?\s*|₹\s*)(\d+(?:\.\d{1,2})?)/i,   // Rs 450 or ₹450
        /(\d+(?:\.\d{1,2})?)\s*(?:rs|rupees?)/i,      // 450 Rs
        /\b(\d+(?:\.\d{1,2})?)\b/,                    // plain number
    ];

    for (const pattern of amountPatterns) {
        const match = lower.match(pattern);
        if (match) {
            const parsed = parseFloat(match[1].replace(/,/g, ''));
            if (parsed > 0) {
                result.amount = parsed;
                result.confidence += 0.4;
                break;
            }
        }
    }

    // ── 3. Check for travel heuristics ───────────────────────────────────────
    const isTravel = TRAVEL_KEYWORDS.some(k => lower.includes(k));

    // ── 4. Match merchant from dictionary ───────────────────────────────────
    const words = lower.split(/\s+/);
    let bestMatch: { name: string; cat: string; icon: string } | null = null;
    let matchedKeyword = '';

    // Try multi-word matches first (e.g. "big basket", "make my trip")
    const joined = words.join('');
    for (const [keyword, data] of Object.entries(MERCHANT_MAP)) {
        if (joined.includes(keyword) || lower.includes(keyword)) {
            bestMatch = data;
            matchedKeyword = keyword;
            result.confidence += 0.4;
            break;
        }
    }

    if (bestMatch) {
        result.merchantNormalised = bestMatch.name;
        result.merchant = bestMatch.name;
        result.categoryName = bestMatch.cat;
        result.categoryIcon = bestMatch.icon;

        // Resolve real categoryId from passed categories array
        const matchedCat = categories.find(
            c => c.name.toLowerCase() === bestMatch!.cat.toLowerCase()
        );
        if (matchedCat) {
            result.categoryId = matchedCat._id;
            result.confidence += 0.2; // Boost confidence when category is matched
        }
    } else if (isTravel) {
        // Apply travel heuristics when no merchant matched but travel keywords detected
        const travelCat = categories.find(
            c => c.name.toLowerCase() === "travel"
        );
        if (travelCat) {
            result.categoryId = travelCat._id;
            result.categoryName = travelCat.name;
            result.categoryIcon = travelCat.icon;
            result.confidence += 0.3;
        }
        // Don't fabricate merchant name for travel expenses
        result.merchant = '';
        result.merchantNormalised = '';
    } else {
        // No dictionary match and no travel heuristic
        // DO NOT fabricate merchant name
        result.merchant = '';
        result.merchantNormalised = '';
    }

    // ── 5. Product detection ─────────────────────────────────────────────────
    const foundProduct = PRODUCT_KEYWORDS.find(product => lower.includes(product));
    if (foundProduct) {
        result.description = foundProduct.charAt(0).toUpperCase() + foundProduct.slice(1);
        result.confidence += 0.2;
    }

    // ── 6. Shopping heuristics ───────────────────────────────────────────────
    const isShopping = SHOPPING_KEYWORDS.some(keyword => lower.includes(keyword));

    if (isShopping && !result.categoryId) {
        const shoppingCat = categories.find(
            c => c.name.toLowerCase() === "shopping"
        );
        if (shoppingCat) {
            result.categoryId = shoppingCat._id;
            result.categoryName = shoppingCat.name;
            result.categoryIcon = shoppingCat.icon;
            result.confidence += 0.3;
        }
    }

    // ── 7. Resolve date ──────────────────────────────────────────────────────
    result.txDate = resolveDate(raw);
    if (raw.toLowerCase() !== 'today') result.confidence += 0.1;

    return result;
}

// ── Preview label for UI feedback ─────────────────────────────────────────
export function getParsePreview(parsed: ParsedTransaction): string {
    if (!parsed.amount && !parsed.merchantNormalised && !parsed.description) return '';

    const parts: string[] = [];

    // Add merchant or description
    if (parsed.merchantNormalised) {
        parts.push(parsed.merchantNormalised);
    } else if (parsed.description) {
        parts.push(parsed.description);
    }

    // Add amount
    if (parsed.amount) parts.push(`₹${parsed.amount.toLocaleString('en-IN')}`);

    // Add category
    if (parsed.categoryName && parsed.categoryName !== 'Other') parts.push(parsed.categoryName);

    return parts.join(' · ');
}

// ── Helper to check if Tier-1 result is high confidence ──────────────────
export function isHighConfidenceParse(parsed: ParsedTransaction): boolean {
    return (
        !!parsed.amount &&
        !!parsed.categoryId &&
        parsed.confidence >= 0.7
    );
}
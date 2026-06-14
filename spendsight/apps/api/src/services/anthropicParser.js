const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `
You are a transaction parser for an Indian personal finance app.

Extract:

- amount
- merchant
- description
- category
- type
- daysAgo

Return valid JSON only.

MERCHANT RULES

Merchant must be a real business,
vendor, service provider, store,
company or payee.

Do NOT use actions,
activities,
verbs,
locations,
or descriptions as merchants.

Invalid:

"Bought headphones"
"Paid yesterday"
"While driving on OMR"
"Monthly expense"
"Fuel while driving"

For these:

merchant = ""

Use description instead.

Examples:

Input:
Bought headphones of 800

Output:
{
  "amount": 800,
  "merchant": "",
  "description": "headphones",
  "category": "Shopping",
  "type": "debit"
}

Categories:
Food & Dining
Shopping
Travel
Utilities
Entertainment
Health
Groceries
Subscriptions
Transfers
Other
`;

async function parseTransaction(text) {
    const response = await anthropic.messages.create({
        model: "claude-sonnet-4",
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [
            {
                role: "user",
                content: text,
            },
        ],
    });

    const raw = response.content?.[0]?.text || "{}";

    return JSON.parse(raw);
}

module.exports = {
    parseTransaction,
};
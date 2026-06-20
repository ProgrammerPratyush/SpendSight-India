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
    console.log("\n===== CLAUDE REQUEST =====");
    console.log(text);

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

    // ✅ Change 3: Token Usage Logs
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;

    // ✅ Change 3: Approximate Cost Calculation
    // Pricing: $3 per 1M input tokens, $15 per 1M output tokens
    const estimatedCost =
        ((inputTokens / 1_000_000) * 3) +
        ((outputTokens / 1_000_000) * 15);

    console.log("\n===== CLAUDE USAGE =====");
    console.log("Input Tokens :", inputTokens);
    console.log("Output Tokens:", outputTokens);
    console.log(
        "Estimated Cost (USD):",
        estimatedCost.toFixed(6)
    );

    // ✅ Optional but Valuable: Raw Response Log for Prompt Tuning
    const raw = response.content?.[0]?.text || "{}";

    console.log("\n===== CLAUDE RAW RESPONSE =====");
    console.log(raw);

    return JSON.parse(raw);
}

module.exports = {
    parseTransaction,
};
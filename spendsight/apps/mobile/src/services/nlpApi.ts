// services/nlpApi.ts

import apiClient from "./apiClient";

export async function parseTransactionAI(text: string) {
    const response = await apiClient.post(
        "/api/parse/transaction",
        { text }
    );

    return response.data.data;
}
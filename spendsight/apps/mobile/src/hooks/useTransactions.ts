import { useCallback } from 'react';
import apiClient from '../services/apiClient';
import { useTransactionStore, Period } from '../store/transactionStore';

export function useTransactions() {
    const {
        transactions,
        totals,
        period,
        isLoading,
        error,
        setTransactions,
        setPeriod,
        setLoading,
        setError,
        addTransaction,
    } = useTransactionStore();

    const fetchTransactions = useCallback(async (p?: Period) => {
        const activePeriod = p || period;
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get(`/api/transactions?period=${activePeriod}`);
            setTransactions(res.data.data.transactions, res.data.data.totals);
        } catch (err: any) {
            setError(err.message || 'Failed to load transactions');
        } finally {
            setLoading(false);
        }
    }, [period]);

    const changePeriod = useCallback((p: Period) => {
        setPeriod(p);
        fetchTransactions(p);
    }, [fetchTransactions]);

    const createTransaction = useCallback(async (data: {
        amount: number;
        type: 'debit' | 'credit';
        merchantNormalised: string;
        categoryId?: string;
        txDate: string;
        notes?: string;
        source: "manual" | "nlp";
    }) => {
        try {
            const res = await apiClient.post('/api/transactions', data);
            addTransaction(res.data.data);
            await fetchTransactions();
            return { success: true };
        } catch (err: any) {
            return {
                success: false,
                error: err.response?.data?.error || err.message || 'Unknown error'
            };
        }
    }, [fetchTransactions]);

    return {
        transactions,
        totals,
        period,
        isLoading,
        error,
        fetchTransactions,
        changePeriod,
        createTransaction,
    };
}
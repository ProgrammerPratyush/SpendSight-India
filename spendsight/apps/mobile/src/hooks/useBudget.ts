import { useState, useCallback } from 'react';
import apiClient from '../services/apiClient';

export interface Budget {
    _id: string;
    period: 'monthly' | 'weekly';
    categoryId: { _id: string; name: string; icon: string; color: string } | null;
    limitAmount: number;
    limitAmountInRupees: number;
    alertAt: number;
    isActive: boolean;
}

export function useBudget() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchBudgets = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/api/budgets');
            setBudgets(res.data.data.budgets || []);
        } catch (err) {
            logger.info('Budget fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createBudget = useCallback(async (data: {
        period: 'monthly' | 'weekly';
        categoryId?: string | null;
        limitAmount: number;
        alertAt?: number;
    }) => {
        try {
            const res = await apiClient.post('/api/budgets', data);
            await fetchBudgets();
            return { success: true, budget: res.data.data };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, [fetchBudgets]);

    const deleteBudget = useCallback(async (id: string) => {
        try {
            await apiClient.delete(`/api/budgets/${id}`);
            await fetchBudgets();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }, [fetchBudgets]);

    return { budgets, isLoading, fetchBudgets, createBudget, deleteBudget };
}
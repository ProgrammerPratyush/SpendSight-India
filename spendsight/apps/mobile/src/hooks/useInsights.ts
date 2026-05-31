import { useState, useCallback } from 'react';
import apiClient from '../services/apiClient';

export interface Insight {
    _id?: string;
    type: string;
    text: string;
    data?: any;
    readAt?: string | null;
    createdAt?: string;
}

export function useInsights() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchInsights = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/api/insights');
            setInsights(res.data.data.insights || []);
        } catch (err) {
            console.error('Insights fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const markRead = useCallback(async (id: string) => {
        try {
            await apiClient.patch(`/api/insights/${id}/read`);
        } catch (err) {
            console.error('Mark read error:', err);
        }
    }, []);

    return { insights, isLoading, fetchInsights, markRead };
}
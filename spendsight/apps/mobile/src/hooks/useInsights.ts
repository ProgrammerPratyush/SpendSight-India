import { useState, useCallback } from 'react';
import apiClient from '../services/apiClient';

// ─────────────────────────────────────────
// ✅ Single source of truth for Insight type
// Used by useInsights, DashboardScreen,
// and InsightCard — all import from here
// ─────────────────────────────────────────
export type InsightSeverity =
    | 'success'
    | 'warning'
    | 'danger'
    | 'info';

export interface Insight {
    _id: string;
    type: string;

    // ✅ Fixed: Added missing fields
    title: string;
    icon: string;
    severity: InsightSeverity;

    text: string;
    data?: Record<string, any>;
    readAt?: string | null;
    createdAt?: string;
    period?: {
        start: string;
        end: string;
    };
}

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────
export function useInsights() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchInsights = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await apiClient.get('/api/insights');

            // ✅ Fixed: Safe fallback if shape is unexpected
            const raw = res.data?.data?.insights;

            if (Array.isArray(raw)) {
                setInsights(raw);
            } else {
                setInsights([]);
            }
        } catch (err: any) {
            console.error('Insights fetch error:', err);
            setError(
                err?.response?.data?.error ||
                'Failed to load insights'
            );
            // ✅ Fixed: Don't leave stale data on error
            setInsights([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ✅ Fixed: markRead now also refreshes local state
    // so the unread dot disappears instantly
    // without needing a full fetchInsights() call
    const markRead = useCallback(async (id: string) => {
        try {
            await apiClient.patch(`/api/insights/${id}/read`);

            // Optimistically update local state
            setInsights((prev) =>
                prev.map((ins) =>
                    ins._id === id
                        ? {
                            ...ins,
                            readAt: new Date().toISOString(),
                        }
                        : ins
                )
            );
        } catch (err) {
            console.error('Mark read error:', err);
        }
    }, []);

    return {
        insights,
        isLoading,
        error,
        fetchInsights,
        markRead,
    };
}
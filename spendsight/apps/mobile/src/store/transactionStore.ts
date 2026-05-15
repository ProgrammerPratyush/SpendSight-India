import { create } from 'zustand';

export type Period = 'today' | 'week' | 'month';

export interface Transaction {
    _id: string;
    amount: number;
    amountInRupees: number;
    type: 'debit' | 'credit';
    merchantNormalised: string;
    merchantRaw: string;
    categoryId: { _id: string; name: string; icon: string; color: string } | null;
    txDate: string;
    status: string;
    notes: string;
    source: string;
}

interface Totals {
    spent: number;
    spentInRupees: number;
    received: number;
    receivedInRupees: number;
}

interface TransactionStore {
    transactions: Transaction[];
    totals: Totals;
    period: Period;
    isLoading: boolean;
    error: string | null;
    setTransactions: (transactions: Transaction[], totals: Totals) => void;
    setPeriod: (period: Period) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    addTransaction: (tx: Transaction) => void;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
    transactions: [],
    totals: { spent: 0, spentInRupees: 0, received: 0, receivedInRupees: 0 },
    period: 'month',
    isLoading: false,
    error: null,
    setTransactions: (transactions, totals) => set({ transactions, totals }),
    setPeriod: (period) => set({ period }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    addTransaction: (tx) => set((state) => ({
        transactions: [tx, ...state.transactions],
    })),
}));
import { create } from 'zustand';

interface User {
    userId: string;
    firebaseUid: string;
    name: string;
    isNewUser: boolean;
}

interface AuthStore {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    setUser: (user: User) => void;
    updateUser: (updates: Partial<User>) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
    updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
    })),
    setLoading: (isLoading) => set({ isLoading }),
    logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}));
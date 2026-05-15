import { format, isToday, isYesterday, startOfDay, startOfWeek, startOfMonth } from 'date-fns';

export function formatTransactionDate(date: Date | string): string {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'd MMM yyyy');
}

export function formatTime(date: Date | string): string {
    return format(new Date(date), 'h:mm a');
}

export function getPeriodDates(period: 'today' | 'week' | 'month') {
    const now = new Date();
    if (period === 'today') return { start: startOfDay(now), end: now };
    if (period === 'week') return { start: startOfWeek(now, { weekStartsOn: 1 }), end: now };
    return { start: startOfMonth(now), end: now };
}

export function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}
// utils/time.ts
// ─────────────────────────────────────────
// Reusable relative time formatter
// Used by NotificationsScreen, InsightCard,
// Activity Feed, Chat etc.
// ─────────────────────────────────────────

export function formatRelative(date: string | Date): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();

    // Guard against invalid dates
    if (isNaN(past.getTime())) return '';

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    // Older than a week — show actual date
    return past.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
    });
}
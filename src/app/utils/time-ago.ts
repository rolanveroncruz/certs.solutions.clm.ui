// Parses an API timestamp. Returns null when it is missing, invalid, or Go's zero time (year 1), which means "never".
export function parseApiDate(value: string | null | undefined): Date | null {
    const date = value ? new Date(value) : null;
    if (!date || isNaN(date.getTime()) || date.getFullYear() <= 1) {
        return null;
    }
    return date;
}

// Converts a date into a relative string such as "5 minutes ago"
export function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) {
        return 'just now';
    }
    const units: { label: string; seconds: number }[] = [
        { label: 'year', seconds: 365 * 24 * 3600 },
        { label: 'month', seconds: 30 * 24 * 3600 },
        { label: 'week', seconds: 7 * 24 * 3600 },
        { label: 'day', seconds: 24 * 3600 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
    ];
    for (const unit of units) {
        const count = Math.floor(seconds / unit.seconds);
        if (count >= 1) {
            return `${count} ${unit.label}${count === 1 ? '' : 's'} ago`;
        }
    }
    return 'just now';
}

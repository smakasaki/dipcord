// src/shared/lib/date.ts

/**
 * Format a date to show as a relative time (today, tomorrow, etc.) or a date format
 */
export function formatRelativeDate(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Is it today?
    if (dateOnly.getTime() === today.getTime()) {
        return "Today";
    }

    // Is it tomorrow?
    if (dateOnly.getTime() === tomorrow.getTime()) {
        return "Tomorrow";
    }

    // Is it within the next 7 days?
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    if (dateOnly < nextWeek) {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return days[dateOnly.getDay()];
    }

    // Is it overdue?
    if (dateOnly < today) {
        // For dates in the past
        const days = Math.floor((today.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24));

        if (days === 1) {
            return "Yesterday";
        }

        if (days < 30) {
            return `${days} days ago`;
        }

        // If more than 30 days ago, just use the date
        return dateOnly.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }

    // For other future dates, show the date
    return dateOnly.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Get a color for overdue/due soon dates
 */
export function getDueDateColor(date: Date | null): string | undefined {
    if (!date)
        return undefined;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Overdue
    if (dateOnly < today) {
        return "red";
    }

    // Due today
    if (dateOnly.getTime() === today.getTime()) {
        return "orange";
    }

    // Due tomorrow
    if (dateOnly.getTime() === tomorrow.getTime()) {
        return "amber";
    }

    return undefined;
}

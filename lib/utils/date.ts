/**
 * Parse a date string that can be either an ISO 8601 date or a timestamp (milliseconds).
 * Returns undefined if the value cannot be parsed into a valid date.
 */
export function parseDate(value: string): Date | undefined {
    const num = Number(value);

    // If the value is a valid number, treat it as a Unix timestamp (seconds)
    if (!Number.isNaN(num) && Number.isFinite(num)) {
        return new Date(num);
    }

    // Otherwise, try to parse as an ISO 8601 date string
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }

    return date;
}

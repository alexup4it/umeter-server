/**
 * Convert Unix timestamp to Date object
 * @param ts
 */
export function unixToDate(ts: number): Date {
    return new Date(ts * 1000);
}

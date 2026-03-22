/**
 * Decode base64 encoded binary data to array of {value, ts} objects
 * Each item is 8 bytes: 4 bytes value (little-endian) + 4 bytes timestamp (little-endian)
 * @param data
 * @param signed
 */
export function decodeBase64(
    data: string | null | undefined,
    signed = false,
): { value: number; ts: number }[] | null {
    if (!data) {
        return null;
    }

    const buffer = Buffer.from(data, 'base64');
    const result: { value: number; ts: number }[] = [];

    let i = 0;
    while (i <= buffer.length - 8) {
        const value = signed
            ? buffer.readInt32LE(i)
            : buffer.readUInt32LE(i);
        const ts = buffer.readUInt32LE(i + 4);
        result.push({ value, ts });
        i += 8;
    }

    return result;
}

interface CountEntry {
    count: number | null;
    countMax: number | null;
    countMin: number | null;
}

/**
 * Merge count, count_max, count_min arrays into a single object keyed by timestamp
 * @param count
 * @param countMax
 * @param countMin
 * @returns Map of timestamp to { count, countMax, countMin }
 */
export function mergeCount(
    count: { value: number; ts: number }[] | null,
    countMax: { value: number; ts: number }[] | null,
    countMin: { value: number; ts: number }[] | null,
): Map<number, CountEntry> | null {
    if (!count || !countMax || !countMin) {
        return null;
    }

    const result = new Map<number, CountEntry>();

    // Initialize all timestamps
    for (const item of count) {
        result.set(item.ts, { count: null, countMax: null, countMin: null });
    }
    for (const item of countMax) {
        if (!result.has(item.ts)) {
            result.set(item.ts, { count: null, countMax: null, countMin: null });
        }
    }
    for (const item of countMin) {
        if (!result.has(item.ts)) {
            result.set(item.ts, { count: null, countMax: null, countMin: null });
        }
    }

    // Fill values
    for (const item of count) {
        const entry = result.get(item.ts);
        if (entry) {
            entry.count = item.value;
        }
    }
    for (const item of countMax) {
        const entry = result.get(item.ts);
        if (entry) {
            entry.countMax = item.value;
        }
    }
    for (const item of countMin) {
        const entry = result.get(item.ts);
        if (entry) {
            entry.countMin = item.value;
        }
    }

    return result;
}

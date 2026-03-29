import moment from 'moment';

import type { SensorRecord } from '@/lib/types/station';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Compute the effective date range from URL params.
 * - No `from` → default to 1 week ago
 * - No `to` → live mode (current time)
 */
export function computeEffectiveRange(
    fromParam: string | null,
    toParam: string | null,
): [Date, Date] {
    const effectiveFrom = fromParam
        ? moment(fromParam).startOf('day').toDate()
        : new Date(Date.now() - ONE_WEEK_MS);
    const effectiveTo = toParam
        ? moment(toParam).endOf('day').toDate()
        : new Date();

    return [effectiveFrom, effectiveTo];
}

export function buildRecordsUrl(
    uid: string,
    from: Date,
    to: Date,
    after?: string,
): string {
    const url = new URL(
        `/api/stations/${uid}/records`,
        window.location.origin,
    );
    url.searchParams.set('from', from.toISOString());
    url.searchParams.set('to', to.toISOString());

    if (after) {
        url.searchParams.set('after', after);
    }

    return url.toString();
}

/**
 * SWR fetcher for records endpoint.
 * Returns the records array from the response.
 */
export async function recordsFetcher(
    url: string,
): Promise<SensorRecord[]> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Failed to fetch records');
    }

    const data = await response.json() as
        { records: SensorRecord[] };

    return data.records;
}

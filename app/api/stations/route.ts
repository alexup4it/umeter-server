import { NextResponse } from 'next/server';

import { fetchStationSummaries } from '@/lib/data/stations';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stations
 * Returns a list of all known stations with their latest sensor readings.
 * Only includes data from the last 7 days.
 */
export async function GET() {
    const stations = await fetchStationSummaries();

    return NextResponse.json(stations);
}

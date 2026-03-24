import { NextRequest, NextResponse } from 'next/server';

import { fetchStationDetail } from '@/lib/data/stations';
import { parseDate } from '@/lib/utils/date';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stations/[uid]
 * Returns detailed station data with sensor history.
 * Query params: from, to (ISO date strings). Defaults to last 7 days.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ uid: string }> },
) {
    const { uid: uidParam } = await params;
    const uid = Number(uidParam);

    if (Number.isNaN(uid)) {
        return NextResponse.json(
            { error: 'Invalid uid' },
            { status: 400 },
        );
    }

    const searchParams = request.nextUrl.searchParams;

    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    const from = fromParam ? parseDate(fromParam) : undefined;
    const to = toParam ? parseDate(toParam) : undefined;

    console.log('TO', to, toParam);

    const detail = await fetchStationDetail(uid, from, to);

    if (!detail) {
        return NextResponse.json(
            { error: 'Station not found' },
            { status: 404 },
        );
    }

    return NextResponse.json(detail);
}

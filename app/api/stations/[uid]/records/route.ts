import { NextRequest, NextResponse } from 'next/server';

import { fetchSensorRecords } from '@/lib/data/stations';
import { parseDate } from '@/lib/utils/date';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stations/[uid]/records
 * Returns sensor records for a station within a date range.
 * Query params:
 *   - from (required): ISO date string — range start
 *   - to   (required): ISO date string — range end
 *   - after (optional): ISO date string — fetch only records newer than this timestamp
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
    const afterParam = searchParams.get('after');

    if (!fromParam || !toParam) {
        return NextResponse.json(
            { error: 'Missing required "from" and "to" params' },
            { status: 400 },
        );
    }

    const from = parseDate(fromParam);
    const to = parseDate(toParam);

    if (!from || !to) {
        return NextResponse.json(
            { error: 'Invalid date format' },
            { status: 400 },
        );
    }

    const after = afterParam ? parseDate(afterParam) : undefined;

    const records = await fetchSensorRecords(uid, from, to, after);

    return NextResponse.json({ records });
}

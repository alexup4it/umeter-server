import { NextRequest, NextResponse } from 'next/server';

import { fetchStationDetail } from '@/lib/data/stations';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stations/[uid]
 * Returns detailed station data (without records).
 */
export async function GET(
    _request: NextRequest,
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

    const detail = await fetchStationDetail(uid);

    if (!detail) {
        return NextResponse.json(
            { error: 'Station not found' },
            { status: 404 },
        );
    }

    return NextResponse.json(detail);
}

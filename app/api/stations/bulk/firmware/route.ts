import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/stations/bulk/firmware
 * Assign firmware to multiple devices at once.
 * Body: { uids: number[], filename: string }
 */
export async function PUT(request: NextRequest) {
    const body = await request.json() as {
        uids?: number[];
        filename?: string;
    };

    if (!body.uids || body.uids.length === 0) {
        return NextResponse.json(
            { error: 'uids array is required' },
            { status: 400 },
        );
    }

    const filename = body.filename;
    if (!filename) {
        return NextResponse.json(
            { error: 'filename is required' },
            { status: 400 },
        );
    }

    const results = await Promise.all(
        body.uids.map((uid) =>
            prisma.firmwareAssignment.upsert({
                where: { deviceUid: uid },
                create: { deviceUid: uid, filename },
                update: { filename },
            })),
    );

    return NextResponse.json({ count: results.length });
}

import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stations/[uid]/firmware
 * Returns pending firmware assignment for the device, or null if none.
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

    const pending = await prisma.firmwareAssignment.findUnique({
        where: { deviceUid: uid },
    });

    return NextResponse.json({ pending });
}

/**
 * PUT /api/stations/[uid]/firmware
 * Assign a firmware file to the device.
 * Body: { filename: string }
 */
export async function PUT(
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

    const body = await request.json() as { filename?: string };

    if (!body.filename) {
        return NextResponse.json(
            { error: 'filename is required' },
            { status: 400 },
        );
    }

    const assignment = await prisma.firmwareAssignment.upsert({
        where: { deviceUid: uid },
        create: { deviceUid: uid, filename: body.filename },
        update: { filename: body.filename },
    });

    return NextResponse.json({ assignment });
}

/**
 * DELETE /api/stations/[uid]/firmware
 * Cancel pending firmware assignment.
 */
export async function DELETE(
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

    try {
        await prisma.firmwareAssignment.delete({ where: { deviceUid: uid } });
    } catch {
        return NextResponse.json(
            { error: 'No pending firmware' },
            { status: 404 },
        );
    }

    return NextResponse.json({ status: 'ok' });
}

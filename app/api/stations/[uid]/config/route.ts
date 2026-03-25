import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stations/[uid]/config
 * Returns pending config for the device, or null if none.
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

    const pending = await prisma.deviceConfig.findUnique({
        where: { deviceUid: uid },
    });

    return NextResponse.json({ pending });
}

/**
 * PUT /api/stations/[uid]/config
 * Upsert pending config for the device.
 * Body: { apn?, url_ota?, url_app?, period_upload?, period_sensors?, period_anemometer? }
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

    const body = await request.json() as {
        apn?: string | null;
        url_ota?: string | null;
        url_app?: string | null;
        period_upload?: number | null;
        period_sensors?: number | null;
        period_anemometer?: number | null;
    };

    const data = {
        apn: body.apn ?? null,
        urlOta: body.url_ota ?? null,
        urlApp: body.url_app ?? null,
        periodUpload: body.period_upload ?? null,
        periodSensors: body.period_sensors ?? null,
        periodAnemometer: body.period_anemometer ?? null,
    };

    const config = await prisma.deviceConfig.upsert({
        where: { deviceUid: uid },
        create: { deviceUid: uid, ...data },
        update: data,
    });

    return NextResponse.json({ config });
}

/**
 * DELETE /api/stations/[uid]/config
 * Cancel pending config for the device.
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
        await prisma.deviceConfig.delete({ where: { deviceUid: uid } });
    } catch {
        return NextResponse.json(
            { error: 'No pending config' },
            { status: 404 },
        );
    }

    return NextResponse.json({ status: 'ok' });
}

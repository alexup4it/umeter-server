import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import prisma from '@/lib/prisma';
import { pendingConfigSchema } from '@/lib/schemas';

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

    const pending = await prisma.devicePendingConfig.findUnique({
        where: { deviceUid: uid },
    });

    return NextResponse.json({ pending });
}

/**
 * PUT /api/stations/[uid]/config
 * Upsert pending config for the device.
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

    const parsed = pendingConfigSchema.safeParse(
        await request.json(),
    );

    if (!parsed.success) {
        return NextResponse.json(
            { error: z.treeifyError(parsed.error) },
            { status: 400 },
        );
    }

    const { data: body } = parsed;

    const data = {
        apn: body.apn,
        urlOta: body.url_ota,
        urlApp: body.url_app,
        periodUpload: body.period_upload,
        periodSensors: body.period_sensors,
        periodAnemometer: body.period_anemometer,
    };

    const config = await prisma.devicePendingConfig.upsert({
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
        await prisma.devicePendingConfig.delete({
            where: { deviceUid: uid },
        });
    } catch {
        return NextResponse.json(
            { error: 'No pending config' },
            { status: 404 },
        );
    }

    return NextResponse.json({ status: 'ok' });
}

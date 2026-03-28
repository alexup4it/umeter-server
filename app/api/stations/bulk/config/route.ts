import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/stations/bulk/config
 * Apply config to multiple devices at once.
 * Body: {
 *   uids: number[],
 *   config: {
 *     apn?,
 *     url_ota?,
 *     url_app?,
 *     period_upload?,
 *     period_sensors?,
 *     period_anemometer?
 *   }
 * }
 */
export async function PUT(request: NextRequest) {
    const body = await request.json() as {
        uids?: number[];
        config?: {
            apn?: string | null;
            url_ota?: string | null;
            url_app?: string | null;
            period_upload?: number | null;
            period_sensors?: number | null;
            period_anemometer?: number | null;
        };
    };

    if (!body.uids || body.uids.length === 0) {
        return NextResponse.json(
            { error: 'uids array is required' },
            { status: 400 },
        );
    }

    if (!body.config) {
        return NextResponse.json(
            { error: 'config object is required' },
            { status: 400 },
        );
    }

    const data = {
        apn: body.config.apn ?? null,
        urlOta: body.config.url_ota ?? null,
        urlApp: body.config.url_app ?? null,
        periodUpload: body.config.period_upload ?? null,
        periodSensors: body.config.period_sensors ?? null,
        periodAnemometer: body.config.period_anemometer ?? null,
    };

    const results = await Promise.all(
        body.uids.map((uid) =>
            prisma.devicePendingConfig.upsert({
                where: { deviceUid: uid },
                create: { deviceUid: uid, ...data },
                update: data,
            })),
    );

    return NextResponse.json({ count: results.length });
}

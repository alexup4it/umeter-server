import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import prisma from '@/lib/prisma';
import { pendingConfigSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

const bulkConfigSchema = z.object({
    uids: z.array(z.number().int()).min(1, 'uids is required'),
    config: pendingConfigSchema,
});

/**
 * PUT /api/stations/bulk/config
 * Apply config to multiple devices at once.
 */
export async function PUT(request: NextRequest) {
    const parsed = bulkConfigSchema.safeParse(
        await request.json(),
    );

    if (!parsed.success) {
        return NextResponse.json(
            { error: z.treeifyError(parsed.error) },
            { status: 400 },
        );
    }

    const { uids, config: body } = parsed.data;

    const data = {
        apn: body.apn,
        urlOta: body.url_ota,
        urlApp: body.url_app,
        periodUpload: body.period_upload,
        periodSensors: body.period_sensors,
        periodAnemometer: body.period_anemometer,
    };

    const results = await Promise.all(
        uids.map((uid) =>
            prisma.devicePendingConfig.upsert({
                where: { deviceUid: uid },
                create: { deviceUid: uid, ...data },
                update: data,
            })),
    );

    return NextResponse.json({ count: results.length });
}

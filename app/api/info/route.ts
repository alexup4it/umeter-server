import { NextRequest, NextResponse } from 'next/server';

import {
    buildFlaggedResponse,
    checkAndApplyConfig,
    checkAndApplyFirmware,
} from '@/lib/data/pending';
import prisma from '@/lib/prisma';
import { infoPayloadSchema } from '@/lib/schemas';
import { unixToDate } from '@/lib/utils/date';
import { verifyHmac } from '@/lib/utils/hmac';

export async function GET(request: NextRequest) {
    return handleRequest(request);
}

export async function POST(request: NextRequest) {
    return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
    const body = await request.text();
    const auth = request.headers.get('Authorization');

    if (!auth || !verifyHmac(body, auth)) {
        return new NextResponse('Invalid HMAC', { status: 401 });
    }

    const payload = infoPayloadSchema.parse(JSON.parse(body));

    await prisma.info.create({
        data: {
            uid: payload.uid,
            ts: payload.ts ? unixToDate(payload.ts) : null,
            name: payload.name,
            blGit: payload.bl_git,
            blStatus: payload.bl_status,
            appGit: payload.app_git,
            appVer: payload.app_ver,
            mcu: payload.mcu,
            apn: payload.apn,
            urlOta: payload.url_ota,
            urlApp: payload.url_app,
            periodUpload: payload.period_upload,
            periodSensors: payload.period_sensors,
            periodAnemometer: payload.period_anemometer,
            color: payload.color,
        },
    });

    // Check if pending config/firmware was applied by this info report
    if (payload.uid != null) {
        await Promise.all([
            checkAndApplyConfig(payload.uid, {
                apn: payload.apn ?? null,
                urlOta: payload.url_ota ?? null,
                urlApp: payload.url_app ?? null,
                periodUpload: payload.period_upload ?? null,
                periodSensors: payload.period_sensors ?? null,
                periodAnemometer: payload.period_anemometer ?? null,
                appVer: payload.app_ver ?? null,
            }),
            checkAndApplyFirmware(payload.uid, {
                apn: payload.apn ?? null,
                urlOta: payload.url_ota ?? null,
                urlApp: payload.url_app ?? null,
                periodUpload: payload.period_upload ?? null,
                periodSensors: payload.period_sensors ?? null,
                periodAnemometer: payload.period_anemometer ?? null,
                appVer: payload.app_ver ?? null,
            }),
        ]);
    }

    // Respond with remaining pending-update flags
    return buildFlaggedResponse(payload.uid);
}

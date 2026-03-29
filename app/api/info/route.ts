import { NextRequest, NextResponse } from 'next/server';

import {
    buildFlaggedResponse,
    checkAndApplyConfig,
    checkAndApplyFirmware,
} from '@/lib/data/pending';
import prisma from '@/lib/prisma';
import { infoPayloadSchema } from '@/lib/schemas';
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

    // Upsert Device record
    await prisma.device.upsert({
        where: { uid: payload.uid },
        create: {
            uid: payload.uid,
            model: payload.name,
        },
        update: {
            model: payload.name,
        },
    });

    const infoData = {
        blGit: payload.bl_git,
        blStatus: payload.bl_status,
        appGit: payload.app_git,
        appVer: payload.app_ver,
        mcu: payload.mcu,
    };

    await prisma.deviceInfo.upsert({
        where: { deviceUid: payload.uid },
        create: { deviceUid: payload.uid, ...infoData },
        update: infoData,
    });

    const configData = {
        apn: payload.apn,
        urlOta: payload.url_ota,
        urlApp: payload.url_app,
        periodUpload: payload.period_upload,
        periodSensors: payload.period_sensors,
        periodAnemometer: payload.period_anemometer,
    };

    await prisma.deviceConfig.upsert({
        where: { deviceUid: payload.uid },
        create: { deviceUid: payload.uid, ...configData },
        update: configData,
    });

    // Check if pending config/firmware was applied
    const reportedConfig = {
        apn: payload.apn,
        urlOta: payload.url_ota,
        urlApp: payload.url_app,
        periodUpload: payload.period_upload,
        periodSensors: payload.period_sensors,
        periodAnemometer: payload.period_anemometer,
        appVer: payload.app_ver,
    };

    await Promise.all([
        checkAndApplyConfig(payload.uid, reportedConfig),
        checkAndApplyFirmware(payload.uid, reportedConfig),
    ]);

    return buildFlaggedResponse(payload.uid);
}

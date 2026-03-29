import { NextRequest, NextResponse } from 'next/server';

import { buildFlaggedResponse } from '@/lib/data/pending';
import prisma from '@/lib/prisma';
import { cnetPayloadSchema } from '@/lib/schemas';
import { unixToDate } from '@/lib/utils/date';
import { verifyHmac } from '@/lib/utils/hmac';
import { lookupCellLocation } from '@/lib/utils/opencellid';

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

    const payload = cnetPayloadSchema.parse(JSON.parse(body));

    // Upsert Device record
    await prisma.device.upsert({
        where: { uid: payload.uid },
        create: { uid: payload.uid, model: '' },
        update: {},
    });

    // Create DeviceCnet record
    const record = await prisma.deviceCnet.create({
        data: {
            deviceUid: payload.uid,
            ts: unixToDate(payload.ts),
            mcc: payload.mcc,
            mnc: payload.mnc,
            lac: payload.lac,
            cid: payload.cid,
            lev: payload.lev,
        },
    });

    // Resolve cell tower location in background
    void lookupCellLocation(
        payload.mcc,
        payload.mnc,
        payload.lac,
        payload.cid,
    ).then((location) => {
        if (location) {
            return prisma.deviceCnet.update({
                where: { id: record.id },
                data: { lat: location.lat, lng: location.lng },
            });
        }
    }).catch((error: unknown) => {
        console.error('Cell location resolution failed:', error);
    });

    return buildFlaggedResponse(payload.uid);
}

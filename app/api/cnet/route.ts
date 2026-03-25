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

    const record = await prisma.cnet.create({
        data: {
            uid: payload.uid,
            ts: payload.ts ? unixToDate(payload.ts) : null,
            mcc: payload.mcc,
            mnc: payload.mnc,
            lac: payload.lac,
            cid: payload.cid,
            lev: payload.lev,
        },
    });

    // Resolve cell tower location in background — don't block response to device
    if (payload.mcc != null && payload.mnc != null
        && payload.lac != null && payload.cid != null) {
        void lookupCellLocation(
            payload.mcc,
            payload.mnc,
            payload.lac,
            payload.cid,
        ).then((location) => {
            if (location) {
                return prisma.cnet.update({
                    where: { id: record.id },
                    data: { lat: location.lat, lng: location.lng },
                });
            }
        }).catch((error: unknown) => {
            console.error('Cell location resolution failed:', error);
        });
    }

    // Respond with pending-update flags
    return buildFlaggedResponse(payload.uid);
}

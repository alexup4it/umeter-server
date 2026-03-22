import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { cnetPayloadSchema } from '@/lib/schemas';
import { unixToDate } from '@/lib/utils/date';
import { hmacBase64, verifyHmac } from '@/lib/utils/hmac';

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

    await prisma.cnet.create({
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

    const responseBody = JSON.stringify({ status: 'ok' });
    const response = NextResponse.json({ status: 'ok' });
    response.headers.set('Authorization', hmacBase64(responseBody));

    return response;
}

import { NextRequest, NextResponse } from 'next/server';

import { getConfigForDevice } from '@/lib/data/pending';
import { hmacBase64, verifyHmac } from '@/lib/utils/hmac';

export async function GET(request: NextRequest) {
    const uidParam = request.nextUrl.searchParams.get('uid');

    if (!uidParam) {
        return new NextResponse('specify uid', { status: 400 });
    }

    const uid = parseInt(uidParam, 10);

    if (isNaN(uid)) {
        return new NextResponse('uid must be integer', { status: 400 });
    }

    const auth = request.headers.get('Authorization');

    if (!auth || !verifyHmac('', auth)) {
        return new NextResponse('Invalid HMAC', { status: 401 });
    }

    const config = await getConfigForDevice(uid);

    if (!config) {
        const body = JSON.stringify({});
        const response = new NextResponse(body, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
        response.headers.set('Authorization', hmacBase64(body));

        return response;
    }

    const body = JSON.stringify(config);
    const response = new NextResponse(body, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
    response.headers.set('Authorization', hmacBase64(body));

    return response;
}

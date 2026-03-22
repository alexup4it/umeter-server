import { NextResponse } from 'next/server';

import { hmacBase64 } from '@/lib/utils/hmac';

export function GET() {
    const ts = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({ status: 'ok', ts });

    const response = NextResponse.json({ status: 'ok', ts });
    response.headers.set('Authorization', hmacBase64(body));

    return response;
}

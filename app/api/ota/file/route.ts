import { NextRequest, NextResponse } from 'next/server';

import { readFirmwareFile } from '@/lib/ota';
import { hmacBase64 } from '@/lib/utils/hmac';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
    const file = request.nextUrl.searchParams.get('file');
    const addrStr = request.nextUrl.searchParams.get('addr');
    const sizeStr = request.nextUrl.searchParams.get('size');

    if (!file) {
        return new NextResponse('specify file', { status: 400 });
    }
    if (addrStr === null) {
        return new NextResponse('specify addr', { status: 400 });
    }
    if (sizeStr === null) {
        return new NextResponse('specify size', { status: 400 });
    }

    const addr = parseInt(addrStr, 10);
    const size = parseInt(sizeStr, 10);

    if (isNaN(addr) || isNaN(size)) {
        return new NextResponse(
            'addr and size must be integers',
            { status: 400 },
        );
    }

    const binary = readFirmwareFile(file);

    if (!binary) {
        return new NextResponse('file not found', { status: 404 });
    }

    const chunk = binary.subarray(addr, addr + size);
    const response = new NextResponse(new Uint8Array(chunk), {
        status: 200,
        headers: {
            'Content-Type': 'application/octet-stream',
        },
    });
    response.headers.set('Authorization', hmacBase64(chunk));

    return response;
}

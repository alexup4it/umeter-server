import { NextRequest, NextResponse } from 'next/server';

import { checksum, firmwareList, readFirmwareFile } from '@/lib/ota';
import { hmacBase64 } from '@/lib/utils/hmac';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
    const name = request.nextUrl.searchParams.get('name');

    if (!name) {
        return new NextResponse('specify name', { status: 400 });
    }

    const fws = firmwareList();

    const fwList = fws
        .filter((fw) => fw.name === name)
        .map((fw) => {
            const binary = readFirmwareFile(fw.filename);
            const cs = binary ? checksum(binary) : 0;

            return {
                file: fw.filename,
                size: fw.size,
                ver: fw.binver,
                checksum: cs,
            };
        });

    const body = JSON.stringify(fwList);
    const response = new NextResponse(body, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
    response.headers.set('Authorization', hmacBase64(body));

    return response;
}

import { NextRequest, NextResponse } from 'next/server';

import { checksum, firmwareList, readFirmwareFile } from '@/lib/ota';
import prisma from '@/lib/prisma';
import { hmacBase64 } from '@/lib/utils/hmac';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const uidStr = request.nextUrl.searchParams.get('uid');

    if (!uidStr) {
        return new NextResponse('specify uid', { status: 400 });
    }

    const uid = parseInt(uidStr, 10);

    if (isNaN(uid)) {
        return new NextResponse('uid must be an integer', { status: 400 });
    }

    const assignment = await prisma.firmwareAssignment.findUnique({
        where: { deviceUid: uid },
    });

    if (!assignment) {
        return new NextResponse(null, { status: 204 });
    }

    const fws = firmwareList();
    const fw = fws.find((f) => f.filename === assignment.filename);

    if (!fw) {
        return new NextResponse('assigned firmware file not found', { status: 404 });
    }

    const binary = readFirmwareFile(fw.filename);
    const cs = binary ? checksum(binary) : 0;

    const result = {
        file: fw.filename,
        size: fw.size,
        ver: fw.binver,
        checksum: cs,
    };

    const body = JSON.stringify(result);
    const response = new NextResponse(body, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
    response.headers.set('Authorization', hmacBase64(body));

    return response;
}

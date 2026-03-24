import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { unixToDate } from '@/lib/utils/date';
import { parseDataPayload } from '@/lib/utils/decode';
import { hmacBase64, verifyHmac } from '@/lib/utils/hmac';

export async function POST(request: NextRequest) {
    const rawBody = Buffer.from(await request.arrayBuffer());
    const auth = request.headers.get('Authorization');

    if (!auth || !verifyHmac(rawBody, auth)) {
        return new NextResponse('Invalid HMAC', { status: 401 });
    }

    let parsed;
    try {
        parsed = parseDataPayload(rawBody);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Bad payload';

        return new NextResponse(message, { status: 400 });
    }

    const { header, records } = parsed;

    // Insert status record
    await prisma.status.create({
        data: {
            uid: header.uid,
            ts: unixToDate(header.ts),
            ticks: BigInt(header.ticks),
            tamper: header.tamper,
            recordsCount: header.recordsCount,
        },
    });

    // Insert sensor records (convert raw units → normal units)
    if (records.length > 0) {
        await prisma.sensorRecord.createMany({
            data: records.map((r) => ({
                uid: header.uid,
                ts: unixToDate(r.timestamp),
                voltage: r.voltage / 1000, // mV → V
                temperature: r.temperature / 100, // centidegrees → °C
                humidity: r.humidity / 100, // centipercent → %
                pressure: r.pressure / 10, // hPa*10 → hPa
                windDirection: r.windDirection / 100, // centidegrees → °
                windSpeedAvg: r.windSpeedAvg,
                windSpeedMin: r.windSpeedMin,
                windSpeedMax: r.windSpeedMax,
            })),
        });
    }

    const responseBody = JSON.stringify({ status: 'ok' });
    const response = NextResponse.json({ status: 'ok' });
    response.headers.set('Authorization', hmacBase64(responseBody));

    return response;
}

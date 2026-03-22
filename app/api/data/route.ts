import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/prisma';
import { dataPayloadSchema } from '@/lib/schemas';
import { unixToDate } from '@/lib/utils/date';
import { decodeBase64, mergeCount } from '@/lib/utils/decode';
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

    const payload = dataPayloadSchema.parse(JSON.parse(body));

    // Decode base64 encoded arrays
    const temp = decodeBase64(payload.temp, true);
    const hum = decodeBase64(payload.hum, true);
    const angle = decodeBase64(payload.angle, true);
    const count = decodeBase64(payload.count, false);
    const countMax = decodeBase64(payload.count_max, false);
    const countMin = decodeBase64(payload.count_min, false);
    const countAll = mergeCount(count, countMax, countMin);

    // Insert status record
    await prisma.status.create({
        data: {
            uid: payload.uid,
            ts: payload.ts ? unixToDate(payload.ts) : null,
            ticks: payload.ticks != null
                ? BigInt(payload.ticks)
                : null,
            bat: payload.bat,
            dist: payload.dist,
            tamper: payload.tamper,
        },
    });

    // Insert temperature records
    if (temp) {
        await prisma.temperature.createMany({
            data: temp.map((item) => ({
                uid: payload.uid,
                ts: unixToDate(item.ts),
                temp: item.value,
            })),
        });
    }

    // Insert humidity records
    if (hum) {
        await prisma.humidity.createMany({
            data: hum.map((item) => ({
                uid: payload.uid,
                ts: unixToDate(item.ts),
                hum: item.value,
            })),
        });
    }

    // Insert angle records
    if (angle) {
        await prisma.angle.createMany({
            data: angle.map((item) => ({
                uid: payload.uid,
                ts: unixToDate(item.ts),
                angle: item.value,
            })),
        });
    }

    // Insert counter records
    if (countAll) {
        const counterData: {
            uid: string | null;
            ts: Date;
            count: bigint | null;
            countMax: bigint | null;
            countMin: bigint | null;
        }[] = [];

        for (const [ts, value] of countAll.entries()) {
            counterData.push({
                uid: payload.uid,
                ts: unixToDate(ts),
                count: value.count != null
                    ? BigInt(value.count)
                    : null,
                countMax: value.countMax != null
                    ? BigInt(value.countMax)
                    : null,
                countMin: value.countMin != null
                    ? BigInt(value.countMin)
                    : null,
            });
        }

        await prisma.counter.createMany({
            data: counterData,
        });
    }

    const responseBody = JSON.stringify({ status: 'ok' });
    const response = NextResponse.json({ status: 'ok' });
    response.headers.set('Authorization', hmacBase64(responseBody));

    return response;
}

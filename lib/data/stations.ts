import prisma from '@/lib/prisma';
import type { StationDetail, StationSummary } from '@/lib/types/station';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Fetch all stations with their latest sensor readings from the last 7 days.
 */
export async function fetchStationSummaries(): Promise<
    StationSummary[]
> {
    const weekAgo = new Date(Date.now() - ONE_WEEK_MS);

    const recentStatuses = await prisma.status.findMany({
        where: {
            ts: { gte: weekAgo },
            uid: { not: null },
        },
        distinct: ['uid'],
        orderBy: { ts: 'desc' },
        select: { uid: true },
    });

    const uids = recentStatuses
        .map((status) => status.uid)
        .filter((uid): uid is string => uid !== null);

    if (uids.length === 0) {
        return [];
    }

    return Promise.all(
        uids.map(async (uid) => {
            const [info, status, cnet, temp, hum, angleRec, counter] =
                await Promise.all([
                    prisma.info.findFirst({
                        where: { uid },
                        orderBy: { created: 'desc' },
                    }),
                    prisma.status.findFirst({
                        where: { uid, ts: { gte: weekAgo } },
                        orderBy: { ts: 'desc' },
                    }),
                    prisma.cnet.findFirst({
                        where: { uid, lat: { not: null } },
                        orderBy: { ts: 'desc' },
                    }),
                    prisma.temperature.findFirst({
                        where: { uid, ts: { gte: weekAgo } },
                        orderBy: { ts: 'desc' },
                    }),
                    prisma.humidity.findFirst({
                        where: { uid, ts: { gte: weekAgo } },
                        orderBy: { ts: 'desc' },
                    }),
                    prisma.angle.findFirst({
                        where: { uid, ts: { gte: weekAgo } },
                        orderBy: { ts: 'desc' },
                    }),
                    prisma.counter.findFirst({
                        where: { uid, ts: { gte: weekAgo } },
                        orderBy: { ts: 'desc' },
                    }),
                ]);

            return {
                uid,
                name: info?.name ?? null,
                lat: info?.lat ?? cnet?.lat ?? null,
                lng: info?.lng ?? cnet?.lng ?? null,
                lastSeen: status?.ts?.toISOString() ?? null,
                temperature: temp?.temp ?? null,
                humidity: hum?.hum ?? null,
                angle: angleRec?.angle ?? null,
                count: counter?.count != null
                    ? Number(counter.count)
                    : null,
                bat: status?.bat ?? null,
            };
        }),
    );
}

/**
 * Fetch detailed station data with sensor history for a given date range.
 * Returns null if station not found.
 */
export async function fetchStationDetail(
    uid: string,
    from?: Date,
    to?: Date,
): Promise<StationDetail | null> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - ONE_WEEK_MS);

    const dateFrom = from ?? weekAgo;
    const dateTo = to ?? now;
    const dateFilter = { gte: dateFrom, lte: dateTo };

    const [info, status, cnet, temperature, humidity, angle, counter] =
        await Promise.all([
            prisma.info.findFirst({
                where: { uid },
                orderBy: { created: 'desc' },
            }),
            prisma.status.findFirst({
                where: { uid },
                orderBy: { ts: 'desc' },
            }),
            prisma.cnet.findFirst({
                where: { uid },
                orderBy: { ts: 'desc' },
            }),
            prisma.temperature.findMany({
                where: { uid, ts: dateFilter },
                orderBy: { ts: 'asc' },
            }),
            prisma.humidity.findMany({
                where: { uid, ts: dateFilter },
                orderBy: { ts: 'asc' },
            }),
            prisma.angle.findMany({
                where: { uid, ts: dateFilter },
                orderBy: { ts: 'asc' },
            }),
            prisma.counter.findMany({
                where: { uid, ts: dateFilter },
                orderBy: { ts: 'asc' },
            }),
        ]);

    if (!info && !status) {
        return null;
    }

    return {
        uid,
        name: info?.name ?? null,
        lat: info?.lat ?? cnet?.lat ?? null,
        lng: info?.lng ?? cnet?.lng ?? null,
        bat: status?.bat ?? null,
        ticks: status?.ticks != null
            ? Number(status.ticks)
            : null,
        dist: status?.dist ?? null,
        tamper: status?.tamper ?? null,
        lastSeen: status?.ts?.toISOString() ?? null,
        info: info
            ? {
                appGit: info.appGit,
                appVer: info.appVer,
                blGit: info.blGit,
                blStatus: info.blStatus,
                mcu: info.mcu,
                apn: info.apn,
                periodApp: info.periodApp,
                periodSen: info.periodSen,
                sens: info.sens,
            }
            : null,
        cnet: cnet
            ? {
                mcc: cnet.mcc,
                mnc: cnet.mnc,
                lac: cnet.lac,
                cid: cnet.cid,
                lev: cnet.lev,
            }
            : null,
        temperature: temperature.map((record) => ({
            ts: record.ts?.toISOString() ?? '',
            value: record.temp ?? 0,
        })),
        humidity: humidity.map((record) => ({
            ts: record.ts?.toISOString() ?? '',
            value: record.hum ?? 0,
        })),
        angle: angle.map((record) => ({
            ts: record.ts?.toISOString() ?? '',
            value: record.angle ?? 0,
        })),
        counter: counter.map((record) => ({
            ts: record.ts?.toISOString() ?? '',
            count: record.count != null
                ? Number(record.count)
                : null,
            countMax: record.countMax != null
                ? Number(record.countMax)
                : null,
            countMin: record.countMin != null
                ? Number(record.countMin)
                : null,
        })),
    };
}

import prisma from '@/lib/prisma';
import type { StationDetail, StationSummary } from '@/lib/types/station';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Fetch all stations with their latest sensor readings from the last 7 days.
 * Includes stations that have sent status OR info within the time window.
 */
export async function fetchStationSummaries(): Promise<
    StationSummary[]
> {
    const weekAgo = new Date(Date.now() - ONE_WEEK_MS);

    const [recentStatuses, recentInfos] = await Promise.all([
        prisma.status.findMany({
            where: {
                ts: { gte: weekAgo },
                uid: { not: null },
            },
            distinct: ['uid'],
            orderBy: { ts: 'desc' },
            select: { uid: true },
        }),
        prisma.info.findMany({
            where: {
                created: { gte: weekAgo },
                uid: { not: null },
            },
            distinct: ['uid'],
            orderBy: { created: 'desc' },
            select: { uid: true },
        }),
    ]);

    const uidSet = new Set<number>();
    for (const row of recentStatuses) {
        if (row.uid != null) {
            uidSet.add(row.uid);
        }
    }
    for (const row of recentInfos) {
        if (row.uid != null) {
            uidSet.add(row.uid);
        }
    }

    const uids = [...uidSet];

    if (uids.length === 0) {
        return [];
    }

    return Promise.all(
        uids.map(async (uid) => {
            const [info, cnet, latestRecord] =
                await Promise.all([
                    prisma.info.findFirst({
                        where: { uid },
                        orderBy: { created: 'desc' },
                    }),
                    prisma.cnet.findFirst({
                        where: { uid, lat: { not: null } },
                        orderBy: { ts: 'desc' },
                    }),
                    prisma.sensorRecord.findFirst({
                        where: { uid, ts: { gte: weekAgo } },
                        orderBy: { ts: 'desc' },
                    }),
                ]);

            return {
                uid,
                name: info?.name ?? null,
                lat: info?.lat ?? cnet?.lat ?? null,
                lng: info?.lng ?? cnet?.lng ?? null,
                lastSeen: latestRecord?.ts?.toISOString() ?? null,
                temperature: latestRecord?.temperature ?? null,
                humidity: latestRecord?.humidity ?? null,
                windDirection: latestRecord?.windDirection ?? null,
                windSpeed: latestRecord?.windSpeedAvg ?? null,
                voltage: latestRecord?.voltage ?? null,
            };
        }),
    );
}

/**
 * Fetch detailed station data with sensor history for a given date range.
 * Returns null if station not found.
 */
export async function fetchStationDetail(
    uid: number,
    from?: Date,
    to?: Date,
): Promise<StationDetail | null> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - ONE_WEEK_MS);

    const dateFrom = from ?? weekAgo;
    const dateTo = to ?? now;
    const dateFilter = { gte: dateFrom, lte: dateTo };

    const [info, status, cnet, records] =
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
            prisma.sensorRecord.findMany({
                where: { uid, ts: dateFilter },
                orderBy: { ts: 'asc' },
            }),
        ]);

    if (!info && !status) {
        return null;
    }

    // Latest record for voltage
    const latestRecord = records.length > 0
        ? records[records.length - 1]
        : null;

    return {
        uid,
        name: info?.name ?? null,
        lat: info?.lat ?? cnet?.lat ?? null,
        lng: info?.lng ?? cnet?.lng ?? null,
        voltage: latestRecord?.voltage ?? null,
        ticks: status?.ticks != null
            ? Number(status.ticks)
            : null,
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
                periodUpload: info.periodUpload,
                periodSensors: info.periodSensors,
                periodAnemometer: info.periodAnemometer,
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
        temperature: records.map((r) => ({
            ts: r.ts?.toISOString() ?? '',
            value: r.temperature ?? 0,
        })),
        humidity: records.map((r) => ({
            ts: r.ts?.toISOString() ?? '',
            value: r.humidity ?? 0,
        })),
        windDirection: records.map((r) => ({
            ts: r.ts?.toISOString() ?? '',
            value: r.windDirection ?? 0,
        })),
        windSpeed: records.map((r) => ({
            ts: r.ts?.toISOString() ?? '',
            windSpeedAvg: r.windSpeedAvg,
            windSpeedMax: r.windSpeedMax,
            windSpeedMin: r.windSpeedMin,
        })),
    };
}

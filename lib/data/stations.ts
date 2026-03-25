import prisma from '@/lib/prisma';
import type {
    SensorRecord,
    StationDetail,
    StationSummary,
} from '@/lib/types/station';

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
            const [info, cnet, latestRecord, pendingConfig, pendingFirmware] =
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
                    prisma.deviceConfig.findUnique({
                        where: { deviceUid: uid },
                    }),
                    prisma.firmwareAssignment.findUnique({
                        where: { deviceUid: uid },
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
                pressure: latestRecord?.pressure ?? null,
                windDirection: latestRecord?.windDirection ?? null,
                windSpeed: latestRecord?.windSpeedAvg ?? null,
                voltage: latestRecord?.voltage ?? null,
                hasPendingConfig: pendingConfig !== null,
                hasPendingFirmware: pendingFirmware !== null,
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

    const [info, status, cnet, records, pendingConfig, pendingFirmware] =
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
            prisma.deviceConfig.findUnique({
                where: { deviceUid: uid },
            }),
            prisma.firmwareAssignment.findUnique({
                where: { deviceUid: uid },
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
                urlOta: info.urlOta,
                urlApp: info.urlApp,
                periodUpload: info.periodUpload,
                periodSensors: info.periodSensors,
                periodAnemometer: info.periodAnemometer,
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
        records: records.map((r) => ({
            ts: r.ts?.toISOString() ?? '',
            voltage: r.voltage,
            temperature: r.temperature,
            humidity: r.humidity,
            pressure: r.pressure,
            windDirection: r.windDirection,
            windSpeedAvg: r.windSpeedAvg,
            windSpeedMin: r.windSpeedMin,
            windSpeedMax: r.windSpeedMax,
        })),
        pendingConfig: pendingConfig
            ? {
                apn: pendingConfig.apn,
                urlOta: pendingConfig.urlOta,
                urlApp: pendingConfig.urlApp,
                periodUpload: pendingConfig.periodUpload,
                periodSensors: pendingConfig.periodSensors,
                periodAnemometer: pendingConfig.periodAnemometer,
            }
            : null,
        pendingFirmware: pendingFirmware
            ? { filename: pendingFirmware.filename }
            : null,
    };
}

/**
 * Fetch sensor records for a station within a date range.
 * Supports incremental loading via the `after` parameter:
 * when provided, only records with ts strictly greater than
 * `after` are returned.
 */
export async function fetchSensorRecords(
    uid: number,
    from: Date,
    to: Date,
    after?: Date,
): Promise<SensorRecord[]> {
    const records = await prisma.sensorRecord.findMany({
        where: {
            uid,
            ts: {
                gt: after ?? undefined,
                gte: after ? undefined : from,
                lte: to,
            },
        },
        orderBy: { ts: 'asc' },
    });

    return records.map((r) => ({
        ts: r.ts?.toISOString() ?? '',
        voltage: r.voltage,
        temperature: r.temperature,
        humidity: r.humidity,
        pressure: r.pressure,
        windDirection: r.windDirection,
        windSpeedAvg: r.windSpeedAvg,
        windSpeedMin: r.windSpeedMin,
        windSpeedMax: r.windSpeedMax,
    }));
}

import prisma from '@/lib/prisma';
import type {
    SensorRecord,
    StationDetail,
    StationSummary,
} from '@/lib/types/station';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Fetch all stations with their latest sensor readings from the last 7 days.
 */
export async function fetchStationSummaries(): Promise<
    StationSummary[]
> {
    const weekAgo = new Date(Date.now() - ONE_WEEK_MS);

    const devices = await prisma.device.findMany({
        include: {
            pendingConfig: { select: { id: true } },
            firmwareAssignment: { select: { deviceUid: true } },
            cnet: {
                where: { lat: { not: null } },
                orderBy: { ts: 'desc' },
                take: 1,
            },
            sensorRecords: {
                where: { ts: { gte: weekAgo } },
                orderBy: { ts: 'desc' },
                take: 1,
            },
            status: {
                orderBy: { ts: 'desc' },
                take: 1,
            },
        },
    });

    return devices
        .filter((d) => {
            const hasRecentRecord = d.sensorRecords.length > 0;
            const hasRecentStatus = d.status.length > 0
                && d.status[0].ts >= weekAgo;
            const hasRecentCreation = d.created >= weekAgo;

            return hasRecentRecord
                || hasRecentStatus
                || hasRecentCreation;
        })
        .map((d) => {
            const latest = d.sensorRecords[0] as
                typeof d.sensorRecords[0] | undefined;
            const cnet = d.cnet[0] as
                typeof d.cnet[0] | undefined;

            return {
                uid: d.uid,
                model: d.model,
                displayName: d.displayName,
                lat: cnet?.lat ?? null,
                lng: cnet?.lng ?? null,
                lastSeen: latest?.ts.toISOString() ?? null,
                temperature: latest?.temperature ?? null,
                humidity: latest?.humidity ?? null,
                pressure: latest?.pressure ?? null,
                windDirection: latest?.windDirection ?? null,
                windSpeed: latest?.windSpeedAvg ?? null,
                voltage: latest?.voltage ?? null,
                hasPendingConfig: d.pendingConfig !== null,
                hasPendingFirmware:
                    d.firmwareAssignment !== null,
            };
        });
}

/**
 * Fetch detailed station data (without records).
 * Returns null if station not found.
 */
export async function fetchStationDetail(
    uid: number,
): Promise<StationDetail | null> {
    const device = await prisma.device.findUnique({
        where: { uid },
        include: {
            info: true,
            config: true,
            pendingConfig: true,
            firmwareAssignment: true,
            cnet: {
                orderBy: { ts: 'desc' },
                take: 1,
            },
            status: {
                orderBy: { ts: 'desc' },
                take: 1,
            },
            sensorRecords: {
                orderBy: { ts: 'desc' },
                take: 1,
            },
        },
    });

    if (!device) {
        return null;
    }

    const latestStatus = device.status[0] as
        typeof device.status[0] | undefined;
    const latestCnet = device.cnet[0] as
        typeof device.cnet[0] | undefined;
    const latestRecord = device.sensorRecords[0] as
        typeof device.sensorRecords[0] | undefined;

    return {
        uid: device.uid,
        model: device.model,
        displayName: device.displayName,
        lat: latestCnet?.lat ?? null,
        lng: latestCnet?.lng ?? null,
        voltage: latestRecord?.voltage ?? null,
        ticks: latestStatus
            ? Number(latestStatus.ticks)
            : null,
        tamper: latestStatus?.tamper ?? null,
        lastSeen: latestStatus?.ts.toISOString() ?? null,
        info: device.info
            ? { ...device.info }
            : null,
        config: device.config
            ? { ...device.config }
            : null,
        cnet: latestCnet
            ? {
                mcc: latestCnet.mcc,
                mnc: latestCnet.mnc,
                lac: latestCnet.lac,
                cid: latestCnet.cid,
                lev: latestCnet.lev,
            }
            : null,
        pendingConfig: device.pendingConfig
            ? { ...device.pendingConfig }
            : null,
        pendingFirmware: device.firmwareAssignment
            ? { filename: device.firmwareAssignment.filename }
            : null,
    };
}

/**
 * Fetch sensor records for a station within a date range.
 * Supports incremental loading via the `after` parameter.
 */
export async function fetchSensorRecords(
    uid: number,
    from: Date,
    to: Date,
    after?: Date,
): Promise<SensorRecord[]> {
    const records = await prisma.sensorRecord.findMany({
        where: {
            deviceUid: uid,
            ts: {
                gt: after ?? undefined,
                gte: after ? undefined : from,
                lte: to,
            },
        },
        orderBy: { ts: 'asc' },
    });

    return records.map((r) => ({
        ts: r.ts.toISOString(),
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

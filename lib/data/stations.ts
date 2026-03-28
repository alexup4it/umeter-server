import prisma from '@/lib/prisma';
import type {
    SensorRecord,
    StationDetail,
    StationSummary,
} from '@/lib/types/station';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Fetch all stations with their latest sensor readings from the last 7 days.
 * Uses Device as the central entity with relations.
 */
export async function fetchStationSummaries(): Promise<
    StationSummary[]
> {
    const weekAgo = new Date(Date.now() - ONE_WEEK_MS);

    const devices = await prisma.device.findMany({
        include: {
            info: true,
            config: true,
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

    // Filter to only devices active in the last week
    return devices
        .filter((d) => {
            const hasRecentRecord = d.sensorRecords.length > 0;
            const hasRecentStatus = d.status.length > 0
                && d.status[0].ts != null
                && d.status[0].ts >= weekAgo;
            const hasRecentCreation = d.created >= weekAgo;

            return hasRecentRecord || hasRecentStatus || hasRecentCreation;
        })
        .map((d) => {
            const latestRecord = d.sensorRecords.length ? d.sensorRecords[0] : null;
            const latestCnet = d.cnet.length ? d.cnet[0] : null;

            return {
                uid: d.uid,
                model: d.model,
                displayName: d.displayName,
                lat: latestCnet?.lat ?? null,
                lng: latestCnet?.lng ?? null,
                lastSeen: latestRecord?.ts?.toISOString() ?? null,
                temperature: latestRecord?.temperature ?? null,
                humidity: latestRecord?.humidity ?? null,
                pressure: latestRecord?.pressure ?? null,
                windDirection: latestRecord?.windDirection ?? null,
                windSpeed: latestRecord?.windSpeedAvg ?? null,
                voltage: latestRecord?.voltage ?? null,
                hasPendingConfig: d.pendingConfig !== null,
                hasPendingFirmware: d.firmwareAssignment !== null,
            };
        });
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
                where: { ts: dateFilter },
                orderBy: { ts: 'asc' },
            },
        },
    });

    if (!device) {
        return null;
    }

    const latestStatus = device.status.length ? device.status[0] : null;
    const latestCnet = device.cnet.length ? device.cnet[0] : null;
    const latestRecord = device.sensorRecords.length > 0
        ? device.sensorRecords[device.sensorRecords.length - 1]
        : null;

    return {
        uid: device.uid,
        model: device.model,
        displayName: device.displayName,
        lat: latestCnet?.lat ?? null,
        lng: latestCnet?.lng ?? null,
        voltage: latestRecord?.voltage ?? null,
        ticks: latestStatus?.ticks != null
            ? Number(latestStatus.ticks)
            : null,
        tamper: latestStatus?.tamper ?? null,
        lastSeen: latestStatus?.ts?.toISOString() ?? null,
        info: device.info
            ? {
                appGit: device.info.appGit,
                appVer: device.info.appVer,
                blGit: device.info.blGit,
                blStatus: device.info.blStatus,
                mcu: device.info.mcu,
            }
            : null,
        config: device.config
            ? {
                apn: device.config.apn,
                urlOta: device.config.urlOta,
                urlApp: device.config.urlApp,
                periodUpload: device.config.periodUpload,
                periodSensors: device.config.periodSensors,
                periodAnemometer: device.config.periodAnemometer,
            }
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
        records: device.sensorRecords.map((r) => ({
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
        pendingConfig: device.pendingConfig
            ? {
                apn: device.pendingConfig.apn,
                urlOta: device.pendingConfig.urlOta,
                urlApp: device.pendingConfig.urlApp,
                periodUpload: device.pendingConfig.periodUpload,
                periodSensors: device.pendingConfig.periodSensors,
                periodAnemometer: device.pendingConfig.periodAnemometer,
            }
            : null,
        pendingFirmware: device.firmwareAssignment
            ? { filename: device.firmwareAssignment.filename }
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

import { NextResponse } from 'next/server';

import { verToBinver } from '@/lib/ota';
import prisma from '@/lib/prisma';
import { hmacBase64 } from '@/lib/utils/hmac';

interface PendingFlags {
    cfg_update: boolean;
    fw_update: boolean;
}

/**
 * Check if a device has pending config or firmware updates.
 * Used by /api/data, /api/info, /api/cnet to add flags to responses.
 */
export async function getPendingFlags(
    uid: number,
): Promise<PendingFlags> {
    const [config, firmware] = await Promise.all([
        prisma.devicePendingConfig.findUnique({ where: { deviceUid: uid } }),
        prisma.firmwareAssignment.findUnique({ where: { deviceUid: uid } }),
    ]);

    return {
        cfg_update: config !== null,
        fw_update: firmware !== null,
    };
}

export interface DeviceConfigResponse {
    apn: string | null;
    url_ota: string | null;
    url_app: string | null;
    period_upload: number | null;
    period_sensors: number | null;
    period_anemometer: number | null;
}

/**
 * Get config for device. Returns pending config if exists,
 * otherwise returns current params from DeviceConfig.
 */
export async function getConfigForDevice(
    uid: number,
): Promise<DeviceConfigResponse | null> {
    const pending = await prisma.devicePendingConfig.findUnique({
        where: { deviceUid: uid },
    });

    if (pending) {
        return {
            apn: pending.apn,
            url_ota: pending.urlOta,
            url_app: pending.urlApp,
            period_upload: pending.periodUpload,
            period_sensors: pending.periodSensors,
            period_anemometer: pending.periodAnemometer,
        };
    }

    // Fall back to current (actual) config
    const config = await prisma.deviceConfig.findUnique({
        where: { deviceUid: uid },
    });

    if (!config) {
        return null;
    }

    return {
        apn: config.apn,
        url_ota: config.urlOta,
        url_app: config.urlApp,
        period_upload: config.periodUpload,
        period_sensors: config.periodSensors,
        period_anemometer: config.periodAnemometer,
    };
}

interface InfoFields {
    apn: string | null;
    urlOta: string | null;
    urlApp: string | null;
    periodUpload: number | null;
    periodSensors: number | null;
    periodAnemometer: number | null;
    appVer: number | null;
}

/**
 * Compare incoming info with pending config.
 * If all pending fields match, delete the pending record (mark as applied).
 */
export async function checkAndApplyConfig(
    uid: number,
    info: InfoFields,
): Promise<void> {
    const pending = await prisma.devicePendingConfig.findUnique({
        where: { deviceUid: uid },
    });

    if (!pending) {
        return;
    }

    const matches
        = (pending.apn === null || pending.apn === info.apn)
        && (pending.urlOta === null || pending.urlOta === info.urlOta)
        && (pending.urlApp === null || pending.urlApp === info.urlApp)
        && (pending.periodUpload === null
            || pending.periodUpload === info.periodUpload)
        && (pending.periodSensors === null
            || pending.periodSensors === info.periodSensors)
        && (pending.periodAnemometer === null
            || pending.periodAnemometer === info.periodAnemometer);

    if (matches) {
        await prisma.devicePendingConfig.delete({ where: { deviceUid: uid } });
    }
}

/**
 * Compare incoming info with pending firmware assignment.
 * If the device's app version matches the assigned firmware version,
 * delete the assignment (mark as applied).
 *
 * Firmware filename format: {dev}-{rev}-{ver}.bin
 * We compare the binver from the filename with appVer from info.
 */
export async function checkAndApplyFirmware(
    uid: number,
    info: InfoFields,
): Promise<void> {
    const pending = await prisma.firmwareAssignment.findUnique({
        where: { deviceUid: uid },
    });

    if (!pending || info.appVer === null) {
        return;
    }

    // Extract version from filename: {dev}-{rev}-{ver}.bin
    const baseName = pending.filename.replace(/\.bin$/, '');
    const parts = baseName.split('-');

    if (parts.length < 3) {
        return;
    }

    const ver = parts.slice(2).join('-');
    const expectedBinver = verToBinver(ver);

    if (info.appVer === expectedBinver) {
        await prisma.firmwareAssignment.delete({ where: { deviceUid: uid } });
    }
}

/**
 * Build a signed JSON response with { status: "ok" } and optional
 * cfg_update / fw_update flags for the given device.
 */
export async function buildFlaggedResponse(
    uid: number,
): Promise<NextResponse> {
    const flags = await getPendingFlags(uid);

    const data: Record<string, unknown> = { status: 'ok' };

    if (flags.cfg_update) {
        data.cfg_update = true;
    }
    if (flags.fw_update) {
        data.fw_update = true;
    }

    const body = JSON.stringify(data);

    return new NextResponse(body, {
        status: 200,
        headers: {
            Authorization: hmacBase64(body),
        },
    });
}

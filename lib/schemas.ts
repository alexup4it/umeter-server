import { z } from 'zod';

export const infoPayloadSchema = z.object({
    uid: z.number(),
    ts: z.number().default(0),
    name: z.string(),
    bl_git: z.string(),
    bl_status: z.number(),
    app_git: z.string(),
    app_ver: z.number(),
    mcu: z.string(),
    apn: z.string().default(''),
    url_ota: z.string(),
    url_app: z.string(),
    period_upload: z.number(),
    period_sensors: z.number(),
    period_anemometer: z.number(),
});

export const cnetPayloadSchema = z.object({
    uid: z.number(),
    ts: z.number().default(0),
    mcc: z.number(),
    mnc: z.number(),
    lac: z.number(),
    cid: z.number(),
    lev: z.number(),
});

export const pendingConfigSchema = z.object({
    apn: z.string().default(''),
    url_ota: z.string().min(1, 'url_ota is required'),
    url_app: z.string().min(1, 'url_app is required'),
    period_upload: z.number().int().positive(),
    period_sensors: z.number().int().positive(),
    period_anemometer: z.number().int().positive(),
});

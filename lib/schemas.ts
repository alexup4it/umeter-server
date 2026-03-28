import { z } from 'zod';

export const infoPayloadSchema = z.object({
    uid: z.number(),
    ts: z.number().default(0),
    name: z.string().nullable().optional().default(null),
    bl_git: z.string().nullable().optional().default(null),
    bl_status: z.number().nullable().optional().default(null),
    app_git: z.string().nullable().optional().default(null),
    app_ver: z.number().nullable().optional().default(null),
    mcu: z.string().nullable().optional().default(null),
    apn: z.string().nullable().optional().default(null),
    url_ota: z.string().nullable().optional().default(null),
    url_app: z.string().nullable().optional().default(null),
    period_upload: z.number().nullable().optional().default(null),
    period_sensors: z.number().nullable().optional().default(null),
    period_anemometer: z.number().nullable().optional().default(null),
});

export const cnetPayloadSchema = z.object({
    uid: z.number(),
    ts: z.number().default(0),
    mcc: z.number().nullable().optional().default(null),
    mnc: z.number().nullable().optional().default(null),
    lac: z.number().nullable().optional().default(null),
    cid: z.number().nullable().optional().default(null),
    lev: z.number().nullable().optional().default(null),
});

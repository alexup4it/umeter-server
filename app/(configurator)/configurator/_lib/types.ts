export const RESPONSE_PREFIX = '@,,';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export type LogLevel = 'E' | 'I' | 'W';

export interface LogEntry {
    id: number;
    timestamp: Date;
    level: LogLevel | null;
    tag: string;
    ticks: string;
    payload: string;
    raw: string;
}

export interface DeviceParams {
    uid: number;
    ts: number;
    ticks: number;
    name: string;
    blGit: string;
    blStatus: number;
    appGit: string;
    appVer: number;
    mcu: string;
    apn: string;
    urlOta: string;
    urlApp: string;
    periodApp: number;
    periodSen: number;
    mtimeCount: number;
    sens: number;
    bat: number;
    count: number;
    temp: number;
    hum: number;
    angle: number;
}

export interface WritableParams {
    uid: number;
    apn: string;
    urlOta: string;
    urlApp: string;
    periodApp: number;
    periodSen: number;
    mtimeCount: number;
    secret: string;
}

export const READABLE_PARAMS = [
    'uid',
    'ts',
    'ticks',
    'name',
    'bl_git',
    'bl_status',
    'app_git',
    'app_ver',
    'mcu',
    'apn',
    'url_ota',
    'url_app',
    'period_app',
    'period_sen',
    'mtime_count',
    'sens',
    'bat',
    'count',
    'temp',
    'hum',
    'angle',
] as const;

export type ReadableParamName = typeof READABLE_PARAMS[number];

/** Sensor-related params for polling */
export const SENSOR_PARAMS = [
    'bat',
    'temp',
    'hum',
    'angle',
    'count',
    'sens',
] as const;

export type SensorParamName = typeof SENSOR_PARAMS[number];

export const WRITABLE_PARAMS = [
    'uid',
    'apn',
    'url_ota',
    'url_app',
    'period_app',
    'period_sen',
    'mtime_count',
    'secret',
] as const;

export type WritableParamName = typeof WRITABLE_PARAMS[number];

/** Maps wire param names to DeviceParams keys */
export const PARAM_KEY_MAP: Record<ReadableParamName, keyof DeviceParams> = {
    uid: 'uid',
    ts: 'ts',
    ticks: 'ticks',
    name: 'name',
    bl_git: 'blGit',
    bl_status: 'blStatus',
    app_git: 'appGit',
    app_ver: 'appVer',
    mcu: 'mcu',
    apn: 'apn',
    url_ota: 'urlOta',
    url_app: 'urlApp',
    period_app: 'periodApp',
    period_sen: 'periodSen',
    mtime_count: 'mtimeCount',
    sens: 'sens',
    bat: 'bat',
    count: 'count',
    temp: 'temp',
    hum: 'hum',
    angle: 'angle',
};

/** Maps WritableParams keys to wire param names */
export const WRITABLE_KEY_MAP: Record<keyof WritableParams, WritableParamName> = {
    uid: 'uid',
    apn: 'apn',
    urlOta: 'url_ota',
    urlApp: 'url_app',
    periodApp: 'period_app',
    periodSen: 'period_sen',
    mtimeCount: 'mtime_count',
    secret: 'secret',
};

export interface ProtocolResponse {
    status: 'ok' | 'error';
    [key: string]: unknown;
}

export interface SerialCallbacks {
    onResponse: (response: ProtocolResponse) => void;
    onLog: (entry: LogEntry) => void;
    onConnectionChange: (status: ConnectionStatus) => void;
}

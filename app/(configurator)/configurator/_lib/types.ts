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
    periodUpload: number;
    periodSensors: number;
    periodAnemometer: number;
    sens: number;
    bat: number;
    temp: number;
    hum: number;
    windSpeed: number;
    windDirection: number;
}

export interface WritableParams {
    uid: number;
    apn: string;
    urlOta: string;
    urlApp: string;
    periodUpload: number;
    periodSensors: number;
    periodAnemometer: number;
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
    'period_upload',
    'period_sensors',
    'period_anemometer',
    'sens',
    'bat',
    'temp',
    'hum',
    'wind_speed',
    'wind_direction',
] as const;

export type ReadableParamName = typeof READABLE_PARAMS[number];

/** Sensor-related params for polling */
export const SENSOR_PARAMS = [
    'bat',
    'temp',
    'hum',
    'wind_speed',
    'wind_direction',
    'sens',
] as const;

export type SensorParamName = typeof SENSOR_PARAMS[number];

export const WRITABLE_PARAMS = [
    'uid',
    'apn',
    'url_ota',
    'url_app',
    'period_upload',
    'period_sensors',
    'period_anemometer',
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
    period_upload: 'periodUpload',
    period_sensors: 'periodSensors',
    period_anemometer: 'periodAnemometer',
    sens: 'sens',
    bat: 'bat',
    temp: 'temp',
    hum: 'hum',
    wind_speed: 'windSpeed',
    wind_direction: 'windDirection',
};

/** Maps WritableParams keys to wire param names */
export const WRITABLE_KEY_MAP: Record<keyof WritableParams, WritableParamName> = {
    uid: 'uid',
    apn: 'apn',
    urlOta: 'url_ota',
    urlApp: 'url_app',
    periodUpload: 'period_upload',
    periodSensors: 'period_sensors',
    periodAnemometer: 'period_anemometer',
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

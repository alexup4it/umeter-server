export interface StationSummary {
    uid: number;
    model: string;
    displayName: string | null;
    lat: number | null;
    lng: number | null;
    lastSeen: string | null;
    temperature: number | null;
    humidity: number | null;
    pressure: number | null;
    windDirection: number | null;
    windSpeed: number | null;
    voltage: number | null;
    hasPendingConfig: boolean;
    hasPendingFirmware: boolean;
}

export interface SensorRecord {
    ts: string;
    voltage: number;
    temperature: number;
    humidity: number;
    pressure: number;
    windDirection: number;
    windSpeedAvg: number;
    windSpeedMin: number;
    windSpeedMax: number;
}

export interface StationInfo {
    appGit: string;
    appVer: number;
    blGit: string;
    blStatus: number;
    mcu: string;
}

export interface StationConfig {
    apn: string;
    urlOta: string;
    urlApp: string;
    periodUpload: number;
    periodSensors: number;
    periodAnemometer: number;
}

export interface StationCnet {
    mcc: number;
    mnc: number;
    lac: number;
    cid: number;
    lev: number;
}

export interface StationDetail {
    uid: number;
    model: string;
    displayName: string | null;
    lat: number | null;
    lng: number | null;
    voltage: number | null;
    ticks: number | null;
    tamper: boolean | null;
    lastSeen: string | null;
    info: StationInfo | null;
    config: StationConfig | null;
    cnet: StationCnet | null;
    pendingConfig: StationConfig | null;
    pendingFirmware: PendingFirmware | null;
}

export interface PendingFirmware {
    filename: string;
}

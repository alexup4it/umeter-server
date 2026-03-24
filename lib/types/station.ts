export interface StationSummary {
    uid: number;
    name: string | null;
    lat: number | null;
    lng: number | null;
    lastSeen: string | null;
    temperature: number | null;
    humidity: number | null;
    windDirection: number | null;
    windSpeed: number | null;
    voltage: number | null;
}

export interface SensorRecord {
    ts: string;
    voltage: number | null;
    temperature: number | null;
    humidity: number | null;
    windDirection: number | null;
    windSpeedAvg: number | null;
    windSpeedMin: number | null;
    windSpeedMax: number | null;
}

export interface StationDetail {
    uid: number;
    name: string | null;
    lat: number | null;
    lng: number | null;
    voltage: number | null;
    ticks: number | null;
    tamper: boolean | null;
    lastSeen: string | null;
    info: StationInfo | null;
    cnet: StationCnet | null;
    records: SensorRecord[];
}

export interface StationInfo {
    appGit: string | null;
    appVer: number | null;
    blGit: string | null;
    blStatus: number | null;
    mcu: string | null;
    apn: string | null;
    periodUpload: number | null;
    periodSensors: number | null;
    periodAnemometer: number | null;
    sens: number | null;
}

export interface StationCnet {
    mcc: number | null;
    mnc: number | null;
    lac: number | null;
    cid: number | null;
    lev: number | null;
}

export interface StationSummary {
    uid: number;
    name: string | null;
    lat: number | null;
    lng: number | null;
    lastSeen: string | null;
    temperature: number | null;
    humidity: number | null;
    angle: number | null;
    count: number | null;
    voltage: number | null;
}

export interface SensorPoint {
    ts: string;
    value: number;
}

export interface CounterPoint {
    ts: string;
    count: number | null;
    countMax: number | null;
    countMin: number | null;
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
    temperature: SensorPoint[];
    humidity: SensorPoint[];
    angle: SensorPoint[];
    counter: CounterPoint[];
}

export interface StationInfo {
    appGit: string | null;
    appVer: number | null;
    blGit: string | null;
    blStatus: number | null;
    mcu: string | null;
    apn: string | null;
    periodApp: number | null;
    periodSen: number | null;
    sens: number | null;
}

export interface StationCnet {
    mcc: number | null;
    mnc: number | null;
    lac: number | null;
    cid: number | null;
    lev: number | null;
}

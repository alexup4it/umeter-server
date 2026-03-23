const HEADER_SIZE = 14;
const RECORD_SIZE = 18;

export interface DataHeader {
    uid: number;
    ts: number;
    ticks: number;
    tamper: boolean;
    recordsCount: number;
}

export interface RawSensorRecord {
    timestamp: number;
    /** millivolts */
    voltage: number;
    /** centidegrees C (0.01 C) */
    temperature: number;
    /** centipercent RH (0.01%) */
    humidity: number;
    /** centidegrees (0.01 deg) */
    windDirection: number;
    windSpeedAvg: number;
    windSpeedMin: number;
    windSpeedMax: number;
}

export interface ParsedPayload {
    header: DataHeader;
    records: RawSensorRecord[];
}

/**
 * Parse binary data payload.
 *
 * Header (14 bytes, little-endian):
 *   0..3   uint32  uid
 *   4..7   uint32  ts
 *   8..11  uint32  ticks
 *   12     uint8   tamper (0/1)
 *   13     uint8   records count
 *
 * Records (N x 18 bytes each):
 *   0..3   uint32  timestamp
 *   4..5   uint16  voltage (mV)
 *   6..7   int16   temperature (centidegrees C)
 *   8..9   uint16  humidity (centipercent RH)
 *   10..11 uint16  wind_direction (centidegrees)
 *   12..13 uint16  wind_direction_avg
 *   14..15 uint16  wind_direction_min
 *   16..17 uint16  wind_direction_max
 */
export function parseDataPayload(buf: Buffer): ParsedPayload {
    if (buf.length < HEADER_SIZE) {
        throw new Error(
            `Payload too short: expected at least ${HEADER_SIZE} bytes, got ${buf.length}`,
        );
    }

    const uid = buf.readUInt32LE(0);
    const ts = buf.readUInt32LE(4);
    const ticks = buf.readUInt32LE(8);
    const tamper = buf[12] !== 0;
    const recordsCount = buf[13];

    const expectedSize = HEADER_SIZE + recordsCount * RECORD_SIZE;
    if (buf.length < expectedSize) {
        throw new Error(
            `Payload too short for ${recordsCount} records: expected ${expectedSize} bytes, got ${buf.length}`,
        );
    }

    const records: RawSensorRecord[] = [];
    for (let i = 0; i < recordsCount; i++) {
        const off = HEADER_SIZE + i * RECORD_SIZE;
        records.push({
            timestamp: buf.readUInt32LE(off),
            voltage: buf.readUInt16LE(off + 4),
            temperature: buf.readInt16LE(off + 6),
            humidity: buf.readUInt16LE(off + 8),
            windDirection: buf.readUInt16LE(off + 10),
            windSpeedAvg: buf.readUInt16LE(off + 12),
            windSpeedMin: buf.readUInt16LE(off + 14),
            windSpeedMax: buf.readUInt16LE(off + 16),
        });
    }

    return {
        header: { uid, ts, ticks, tamper, recordsCount },
        records,
    };
}

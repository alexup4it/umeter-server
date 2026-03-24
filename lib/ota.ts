import fs from 'fs';
import path from 'path';

const CHECKSUM_INIT = 0x5A5A5A5A;

/** Directory where firmware .bin files are stored */
export const FIRMWARE_DIR = process.env.FIRMWARE_DIR ?? './firmware';

interface FirmwareInfo {
    filename: string;
    size: number;
    dev: string;
    rev: string;
    name: string;
    ver: string;
    binver: number;
}

/**
 * Calculate 32-bit checksum of a firmware binary payload.
 * Matches the device-side algorithm: pad to a multiple of 4 with 0xFF,
 * then sum all little-endian uint32 words + CHECKSUM_INIT.
 */
export function checksum(payload: Buffer): number {
    // Pad to a multiple of 4 bytes with 0xFF (matches device behavior)
    let data = payload;
    const remainder = data.length % 4;
    if (remainder !== 0) {
        const padding = Buffer.alloc(4 - remainder, 0xff);
        data = Buffer.concat([data, padding]);
    }

    let cs = CHECKSUM_INIT;
    for (let i = 0; i + 4 <= data.length; i += 4) {
        cs += data.readUInt32LE(i);
        cs = cs >>> 0;
    }

    return cs >>> 0;
}

/**
 * Convert version string "1.2.3" to a 32-bit integer.
 * Each dot-separated part becomes one byte, packed big-endian.
 */
export function verToBinver(ver: string): number {
    const parts = ver.split('.').map(Number);
    let result = 0;
    for (const part of parts) {
        result = (result << 8) | (part & 0xFF);
    }

    return result >>> 0;
}

/**
 * Scan FIRMWARE_DIR for .bin files and parse their metadata.
 * Expected filename format: {dev}-{rev}-{ver}.bin
 * Example: umeter-r1-1.0.0.bin
 */
export function firmwareList(): FirmwareInfo[] {
    const dir = FIRMWARE_DIR;

    if (!fs.existsSync(dir)) {
        return [];
    }

    const files = fs.readdirSync(dir);
    const fws: FirmwareInfo[] = [];

    for (const file of files) {
        if (!file.endsWith('.bin')) {
            continue;
        }

        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        const baseName = file.replace(/\.bin$/, '');
        const parts = baseName.split('-');

        if (parts.length < 3) {
            continue;
        }

        const dev = parts[0];
        const rev = parts[1];
        const ver = parts.slice(2).join('-');

        fws.push({
            filename: file,
            size: stats.size,
            dev,
            rev,
            name: `${dev}-${rev}`,
            ver,
            binver: verToBinver(ver),
        });
    }

    return fws;
}

/**
 * Read a firmware file from FIRMWARE_DIR.
 * Returns null if file doesn't exist or path escapes FIRMWARE_DIR.
 */
export function readFirmwareFile(
    filename: string,
): Buffer | null {
    // Prevent path traversal
    const resolved = path.resolve(FIRMWARE_DIR, filename);
    const dirResolved = path.resolve(FIRMWARE_DIR);

    if (!resolved.startsWith(dirResolved + path.sep)
        && resolved !== dirResolved) {
        return null;
    }

    if (!fs.existsSync(resolved)) {
        return null;
    }

    return fs.readFileSync(resolved);
}

/**
 * Save a firmware file to FIRMWARE_DIR.
 * Creates the directory if it doesn't exist.
 */
export function saveFirmwareFile(
    filename: string,
    data: Buffer,
): void {
    const dir = FIRMWARE_DIR;

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, data);
}

/**
 * Delete a firmware file from FIRMWARE_DIR.
 * Returns true if deleted, false if not found.
 */
export function deleteFirmwareFile(filename: string): boolean {
    const resolved = path.resolve(FIRMWARE_DIR, filename);
    const dirResolved = path.resolve(FIRMWARE_DIR);

    if (!resolved.startsWith(dirResolved + path.sep)
        && resolved !== dirResolved) {
        return false;
    }

    if (!fs.existsSync(resolved)) {
        return false;
    }

    fs.unlinkSync(resolved);

    return true;
}

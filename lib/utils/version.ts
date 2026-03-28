/**
 * Convert a 32-bit integer back to a dotted version string "A.B.C.D".
 * Each byte (big-endian) becomes one part of the version.
 */
export function binverToString(binver: number): string {
    return [
        (binver >>> 24) & 0xFF,
        (binver >>> 16) & 0xFF,
        (binver >>> 8) & 0xFF,
        binver & 0xFF,
    ].join('.');
}

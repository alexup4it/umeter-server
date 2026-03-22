import crypto from 'crypto';

/**
 * Get the HMAC secret from environment variable
 * Falls back to 0xAB repeated 32 times if not set
 */
function getSecret(): Buffer {
    const secretHex = process.env.HMAC_SECRET;
    if (secretHex) {
        return Buffer.from(secretHex, 'hex');
    }

    // Default: 0xAB repeated 32 times
    return Buffer.alloc(32, 0xab);
}

/**
 * Create HMAC-SHA256 signature and encode as base64
 * @param payload
 */
export function hmacBase64(payload: Buffer | string): string {
    const secret = getSecret();
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);

    return hmac.digest('base64');
}

/**
 * Verify HMAC signature from request
 * @param payload
 * @param signature
 */
export function verifyHmac(payload: Buffer | string, signature: string): boolean {
    const expected = hmacBase64(payload);

    return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature),
    );
}

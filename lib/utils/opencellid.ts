interface CellLocation {
    lat: number;
    lng: number;
}

interface OpenCellIdResponse {
    lat: number;
    lon: number;
    accuracy: number;
}

/**
 * Look up cell tower location via OpenCellID API.
 * Returns { lat, lng } or null if lookup fails or API key is not configured.
 */
export async function lookupCellLocation(
    mcc: number,
    mnc: number,
    lac: number,
    cid: number,
): Promise<CellLocation | null> {
    const apiKey = process.env.OPENCELL_API_KEY;
    if (!apiKey) {
        return null;
    }

    const params = new URLSearchParams({
        key: apiKey,
        mcc: mcc.toString(),
        mnc: mnc.toString(),
        lac: lac.toString(),
        cellid: cid.toString(),
        format: 'json',
    });

    const url = `https://opencellid.org/cell/get?${params}`;

    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            console.error(`OpenCellID HTTP ${response.status}`);

            return null;
        }

        const data = (await response.json()) as Partial<OpenCellIdResponse>;

        if (data.lat == null || data.lon == null) {
            return null;
        }

        return { lat: data.lat, lng: data.lon };
    } catch (error) {
        console.error('OpenCellID lookup failed:', error);

        return null;
    }
}

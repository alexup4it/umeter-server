import { NextRequest, NextResponse } from 'next/server';

import {
    deleteFirmwareFile,
    firmwareList,
    saveFirmwareFile,
} from '@/lib/ota';

export const dynamic = 'force-dynamic';

export function GET() {
    const fws = firmwareList();

    return NextResponse.json(fws);
}

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
        return NextResponse.json(
            { error: 'No file provided' },
            { status: 400 },
        );
    }

    const filename = file.name;

    if (!filename.endsWith('.bin')) {
        return NextResponse.json(
            { error: 'Only .bin files are allowed' },
            { status: 400 },
        );
    }

    // Validate filename format: {dev}-{rev}-{ver}.bin
    const baseName = filename.replace(/\.bin$/, '');
    const parts = baseName.split('-');
    if (parts.length < 3) {
        return NextResponse.json(
            {
                error: 'Invalid filename format.'
                    + ' Expected: {dev}-{rev}-{ver}.bin',
            },
            { status: 400 },
        );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    saveFirmwareFile(filename, buffer);

    return NextResponse.json({ status: 'ok', filename });
}

export async function DELETE(request: NextRequest) {
    const { filename } = await request.json() as { filename: string };

    if (!filename) {
        return NextResponse.json(
            { error: 'No filename provided' },
            { status: 400 },
        );
    }

    const deleted = deleteFirmwareFile(filename);

    if (!deleted) {
        return NextResponse.json(
            { error: 'File not found' },
            { status: 404 },
        );
    }

    return NextResponse.json({ status: 'ok' });
}

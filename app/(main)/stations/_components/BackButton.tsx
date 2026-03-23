'use client';

import Link from 'next/link';

import { Button } from '@mantine/core';

export function BackButton() {
    return (
        <Button
            component={ Link }
            href="/"
            variant="light"
            color="gray"
        >
            Back
        </Button>
    );
}

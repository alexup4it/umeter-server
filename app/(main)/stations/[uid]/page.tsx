'use client';

import { Suspense } from 'react';

import { useParams } from 'next/navigation';

import { Container, Group, Loader, Title } from '@mantine/core';

import { BackButton } from '../_components/BackButton';
import { StationDetailView } from '../_components/StationDetailView';

export default function StationPage() {
    const { uid: uidParam } = useParams<{ uid: string }>();
    const uid = Number(uidParam);

    if (Number.isNaN(uid)) {
        return null;
    }

    return (
        <Container size="xl" py="xl">
            <Group mb="xl">
                <BackButton />
                <Title order={ 2 }>
                    Station
                    { uid }
                </Title>
            </Group>

            <Suspense fallback={ <Loader /> }>
                <StationDetailView uid={ String(uid) } />
            </Suspense>
        </Container>
    );
}

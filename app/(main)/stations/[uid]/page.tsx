import { notFound } from 'next/navigation';

import { Container, Group, Title } from '@mantine/core';

import { fetchStationDetail } from '@/lib/data/stations';

import { BackButton } from '../_components/BackButton';
import { StationDetailView } from '../_components/StationDetailView';

export default async function StationPage({
    params,
}: {
    params: Promise<{ uid: string }>;
}) {
    const { uid: uidParam } = await params;
    const uid = Number(uidParam);

    if (Number.isNaN(uid)) {
        notFound();
    }

    const detail = await fetchStationDetail(uid);

    if (!detail) {
        notFound();
    }

    return (
        <Container size="xl" py="xl">
            <Group mb="xl">
                <BackButton />
                <Title order={ 2 }>
                    { detail.name
                        ? `${detail.name} (${uid})`
                        : `Station ${uid}` }
                </Title>
            </Group>

            <StationDetailView
                uid={ String(uid) }
                initialDetail={ detail }
            />
        </Container>
    );
}

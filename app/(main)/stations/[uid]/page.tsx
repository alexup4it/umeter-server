import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button, Container, Group, Title } from '@mantine/core';

import { fetchStationDetail } from '@/lib/data/stations';

import { StationDetailView } from '../_components/StationDetailView';

export default async function StationPage({
    params,
}: {
    params: Promise<{ uid: string }>;
}) {
    const { uid } = await params;
    const detail = await fetchStationDetail(uid);

    if (!detail) {
        notFound();
    }

    return (
        <Container size="xl" py="xl">
            <Group mb="xl">
                <Button
                    component={ Link }
                    href="/"
                    variant="light"
                    color="gray"
                >
                    Back
                </Button>
                <Title order={ 2 }>
                    { detail.name
                        ? `${detail.name} (${uid})`
                        : `Station ${uid}` }
                </Title>
            </Group>

            <StationDetailView
                uid={ uid }
                initialDetail={ detail }
            />
        </Container>
    );
}

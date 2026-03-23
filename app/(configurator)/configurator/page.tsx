'use client';

import dynamic from 'next/dynamic';

// eslint-disable-next-line @typescript-eslint/naming-convention
const ConfiguratorApp = dynamic(
    () =>
        import('./_components/ConfiguratorApp').then(
            (mod) => mod.ConfiguratorApp,
        ),
    { ssr: false },
);

export default function ConfiguratorPage() {
    return <ConfiguratorApp />;
}

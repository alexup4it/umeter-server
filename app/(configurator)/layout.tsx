import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { JetBrains_Mono } from 'next/font/google';

import { createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin', 'cyrillic'],
    variable: '--font-jetbrains-mono',
});

const theme = createTheme({
    fontFamily: 'var(--font-jetbrains-mono), monospace',
    fontFamilyMonospace: 'var(--font-jetbrains-mono), monospace',
    defaultRadius: 'sm',
});

export const metadata = {
    title: 'UMeter Configurator',
    description: 'Configure UMeter device over serial port',
};

export default function ConfiguratorRootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            className={ jetbrainsMono.variable }
            lang="en"
            data-mantine-color-scheme="dark"
        >
            <head />
            <body>
                <MantineProvider
                    theme={ theme }
                    forceColorScheme="dark"
                    defaultColorScheme="dark"
                >
                    <Notifications position="top-right" />
                    { children }
                </MantineProvider>
            </body>
        </html>
    );
}

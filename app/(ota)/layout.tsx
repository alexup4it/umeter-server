import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { JetBrains_Mono } from 'next/font/google';

import {
    ColorSchemeScript,
    createTheme,
    mantineHtmlProps,
    MantineProvider,
} from '@mantine/core';
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
    title: 'UMeter OTA',
    description: 'Firmware management for UMeter devices',
};

export default function OtaRootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            className={ jetbrainsMono.variable }
            lang="en"
            { ...mantineHtmlProps }
        >
            <head>
                <ColorSchemeScript defaultColorScheme="dark" />
            </head>
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

import type { Metadata } from 'next';
import * as React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Developer User Module',
  description: 'Manage users, roles and permissions for the Developer platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <QueryProvider>
            <AppShell>{children}</AppShell>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

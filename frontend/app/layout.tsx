import './globals.css';
import type { Metadata } from 'next';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'OASIS — Opus Administration & Service Intelligence Suite',
  description:
    'OASIS — the AI-powered administration management platform for Opus Technologies: procurement, facilities, workspace, travel, invoicing, visa and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Funnel Query Generator',
  description: 'Generate Trino SQL for experiment funnel analysis — no setup required.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-900 text-slate-100">{children}</body>
    </html>
  );
}

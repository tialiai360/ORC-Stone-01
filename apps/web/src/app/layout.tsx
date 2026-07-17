import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stone-01 — Bootstrap',
  description: 'ORC Stone-01 repository bootstrap shell',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

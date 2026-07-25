import type { Metadata } from 'next';
import { DM_Sans, Source_Serif_4 } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
});

export const metadata: Metadata = {
  title: 'Lead Platform',
  description:
    'Capture inbound leads, assign ownership, and run a clear sales pipeline with notes and activity.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${sourceSerif.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

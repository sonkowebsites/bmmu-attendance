import type { Metadata, Viewport } from 'next';
import { Archivo, Inter } from 'next/font/google';
import './globals.css';

export const dynamic = 'force-dynamic';

// Archivo is a bold, geometric grotesque - the closest widely-available
// open font to the tight, confident headline style Netflix uses.
const display = Archivo({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-display'
});

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body'
});

export const metadata: Metadata = {
  title: 'BMMU Attendance Archive',
  description: 'Digital attendance record archive for Bilal Muslim Mission Uganda',
  manifest: '/manifest.json',
  icons: {
    icon: ['/icon-192.png', '/icon-512.png'],
    apple: '/apple-touch-icon.png'
  }
};

export const viewport: Viewport = {
  themeColor: '#1C8A54'
};

// Inline script so the correct theme applies before first paint (no flash).
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('bmmu-theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-body bg-bmmu-cream text-bmmu-black dark:bg-bmmu-green-deep dark:text-bmmu-cream transition-colors duration-300 min-h-screen">
        {children}
      </body>
    </html>
  );
}

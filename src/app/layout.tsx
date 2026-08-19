import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';

export const dynamic = 'force-dynamic';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display'
});

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body'
});

export const metadata: Metadata = { title: 'BMMU Attendance Archive', description: 'Digital attendance record archive for Bilal Muslim Mission Uganda', manifest: '/manifest.json', icons: { icon: ['/icon-192.png', '/icon-512.png'], apple: '/apple-touch-icon.png' } }; Also add this line right after: export const metadata export const viewport = { themeColor: '#1C8A54' };

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
      <body className="font-body bg-bmmu-cream text-bmmu-black dark:bg-bmmu-green-deep dark:text-bmmu-cream transition-colors duration-200 min-h-screen">
        {children}
      </body>
    </html>
  );
}

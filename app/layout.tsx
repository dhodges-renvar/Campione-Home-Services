import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CallBar from '@/components/CallBar';
import JsonLd from '@/components/JsonLd';
import { SITE } from '@/lib/site';
import { graph, localBusiness, website } from '@/lib/schema';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | Painting, Drywall & Exteriors in Monroe, GA`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.elevator,
  applicationName: SITE.name,
  authors: [{ name: SITE.legal }],
  generator: 'Next.js',
  keywords: [
    'painters Monroe GA',
    'drywall contractor Monroe GA',
    'exterior repair Monroe GA',
    'pressure washing Monroe GA',
    'post construction cleaning Monroe GA',
    'construction management metro Atlanta',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} | Six trades, one contractor`,
    description: SITE.elevator,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.name,
    description: SITE.elevator,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'Home improvement',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0e1114',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <CallBar />
        <JsonLd data={graph([localBusiness(), website()])} />
      </body>
    </html>
  );
}

import { Inter, Playfair_Display, Lato } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/providers/SessionProvider';
import VisitorTrackingProvider from '@/components/providers/VisitorTrackingProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MainContent from '@/components/layout/MainContent';
import { Toaster } from 'sonner';
import { Metadata } from 'next';
import StructuredData from '@/components/StructuredData';
import PerformanceProvider from '@/components/providers/PerformanceProvider';
import ChatBot from '@/components/ChatBot';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const lato = Lato({ weight: ['100', '300', '400', '700', '900'], subsets: ['latin'], variable: '--font-lato' });

export const metadata: Metadata = {
  title: {
    default: 'IJARCM - International Journal of Research in Computer Applications and Management',
    template: '%s | IJARCM'
  },
  description: 'IJARCM is a premier international journal publishing high-quality research in computer applications, management, technology, and innovation. Submit your research today.',
  keywords: 'research journal, computer applications, management, technology, innovation, academic publishing, peer review, research papers, IJARCM',
  authors: [{ name: 'IJARCM Editorial Board' }],
  creator: 'IJARCM',
  publisher: 'International Journal of Research in Computer Applications and Management',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://ijarcm.com'),
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': [
        { url: '/api/rss/papers.xml', title: 'IJARCM Latest Papers' },
        { url: '/api/rss/announcements.xml', title: 'IJARCM Announcements' }
      ]
    }
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'IJARCM - International Journal of Research in Computer Applications and Management',
    title: 'IJARCM - International Journal of Research in Computer Applications and Management',
    description: 'IJARCM is a premier international journal publishing high-quality research in computer applications, management, technology, and innovation.',
    images: [
      {
        url: '/images/ijrcam-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'IJARCM - International Journal of Research in Computer Applications and Management'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@ijarcm',
    creator: '@ijarcm',
    title: 'IJARCM - International Journal of Research in Computer Applications and Management',
    description: 'IJARCM is a premier international journal publishing high-quality research in computer applications, management, technology, and innovation.',
    images: ['/images/ijarcm-og-image.jpg']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
      </head>
      <body className={`${inter.variable} ${playfair.variable} ${lato.variable} font-sans min-h-screen bg-white text-slate-900 antialiased`}>
        <PerformanceProvider>
          <SessionProvider>
            <VisitorTrackingProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1">
                  <MainContent>
                    {children}
                  </MainContent>
                </div>
                <Footer />
              </div>
              <ChatBot />
              <Toaster />
            </VisitorTrackingProvider>
          </SessionProvider>
        </PerformanceProvider>
      </body>
    </html>
  );
}
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import './globals.css';
// Manrope carries both the text and the display voice (--font-display follows --font-body in globals.css).
const manrope = localFont({ src: '../../public/fonts/Manrope.ttf', variable: '--font-body', display: 'swap', weight: '200 800' });
export const metadata: Metadata = {
  title: { default: 'Optic 2000 Tahiti — Votre regard, votre signature', template: '%s | Optic 2000 Tahiti' },
  description: 'Découvrez les collections de lunettes de soleil et retrouvez nos opticiens à Centre-ville, Mamao et Taravao.',
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: '/media/655699e241-logo-optic-2000-quadri.webp' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr" className={manrope.variable}><body><a className="skip-link" href="#contenu">Aller au contenu</a><Header /><main id="contenu">{children}</main><Footer /></body></html>;
}

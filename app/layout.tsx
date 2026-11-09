import type { Metadata, Viewport } from 'next';
import { Inter, Nunito } from 'next/font/google';
import './globals.css';
import { esDespliegueDeProduccion } from '@/lib/entorno';
import { SITE } from '@/lib/site';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFlotante from '@/components/layout/WhatsAppFlotante';

// Nunito (titres) : terminaisons arrondies, comme l'écume du logo. Inter (texte) : lisible dans les formulaires.
const nunito = Nunito({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-nunito', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

// URL canonique sur le domaine de production (chaque page ajoute la sienne), image Open Graph par défaut (la vague du
// logo) et noindex hors du déploiement de production.
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.tituloPorDefecto, template: `%s · ${SITE.nombre}` },
  description: SITE.descripcion,
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: SITE.nombre,
    title: SITE.tituloPorDefecto,
    description: SITE.descripcion,
    images: [{ url: '/og/marca.png', width: 1200, height: 630, alt: 'La vague de La Ola Import' }],
  },
  twitter: { card: 'summary_large_image' },
  ...(esDespliegueDeProduccion() ? {} : { robots: { index: false, follow: false } }),
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  colorScheme: 'light',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="fr" className={`${nunito.variable} ${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70] focus:rounded-full focus:bg-marine focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Aller au contenu
        </a>
        <Header />
        {/* overflow-x-clip : rien ne doit élargir le document à 390 px (sinon le menu mobile sort de l'écran). */}
        <main id="contenu" className="flex-1 overflow-x-clip">
          {children}
        </main>
        <Footer />
        <WhatsAppFlotante />
      </body>
    </html>
  );
}

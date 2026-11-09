import type { Metadata, Viewport } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import { esDespliegueDeProduccion } from '@/lib/entorno';
import { SITE } from '@/lib/site';
import StarField from '@/components/space/StarField';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFlotante from '@/components/layout/WhatsAppFlotante';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

// Fase 9: canónica en https://dominio-pendiente.example (cada página añade la suya), imagen Open Graph por defecto
// (public/og/marca.png, generada por scripts/marca/generar-og.py) y noindex fuera del despliegue de producción.
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.tituloPorDefecto, template: '%s · [MARCA]' },
  description: SITE.descripcion,
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: SITE.nombre,
    title: SITE.tituloPorDefecto,
    description: SITE.descripcion,
    images: [{ url: '/og/marca.png', width: 1200, height: 630, alt: '[MARCA]: tu logo en camisetas, sudaderas y merchandising para tu negocio.' }],
  },
  twitter: { card: 'summary_large_image' },
  ...(esDespliegueDeProduccion() ? {} : { robots: { index: false, follow: false } }),
};

export const viewport: Viewport = {
  themeColor: '#111111',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={`${sora.variable} ${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[70] focus:rounded-full focus:bg-moon-50 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink-900"
        >
          Saltar al contenido
        </a>
        <StarField />
        <Header />
        {/* overflow-x-clip: las decoraciones que sobresalen (órbita y estrella del ojo de buey) no ensanchan el documento; si no, en móvil
            el navegador agranda el viewport de maquetación y la cabecera se sale de la pantalla (fase 4.6). */}
        <main id="contenido" className="flex-1 overflow-x-clip">
          {children}
        </main>
        <Footer />
        <WhatsAppFlotante />
      </body>
    </html>
  );
}

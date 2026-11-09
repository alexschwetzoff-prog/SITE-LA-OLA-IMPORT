import Image from 'next/image';
import Link from 'next/link';
import { ENLACES_LEGALES, SITE, TEXTOS, enlaceTelefono, enlaceWhatsApp } from '@/lib/site';
import { IconoInstagram, IconoWhatsApp } from './Iconos';

const enlace = 'text-mist-300 transition-colors hover:text-star-300';

export default function Footer() {
  const { direccion, titular } = SITE;
  return (
    <footer style={{ viewTransitionName: 'pie' }} className="relative mt-24 border-t border-moon-50/10 bg-space-950/80">
      {/* La base: una línea de horizonte fina con un destello en el centro. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-star-300/70 to-transparent"
      />
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Image src="/marca/logo-marca.png" alt="[MARCA]" width={537} height={207} className="h-10 w-auto" />
          <p className="mt-4 font-display text-lg text-moon-50">{SITE.lema}</p>
          <p className="mt-2 max-w-xs text-sm text-mist-300">
            Personalización textil y merchandising con impresión digital. Con sede en Valencia y entregas en toda España.
          </p>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold tracking-wide text-moon-50 uppercase">Contacto</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={`mailto:${SITE.email}`} className={enlace}>
                {SITE.email}
              </a>
            </li>
            {SITE.telefonos.map((tel) => (
              <li key={tel}>
                <a href={enlaceTelefono(tel)} className={enlace}>
                  {tel}
                </a>
              </li>
            ))}
            <li>
              <a href={enlaceWhatsApp()} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 ${enlace}`}>
                <IconoWhatsApp className="h-4 w-4" />
                WhatsApp
              </a>
            </li>
            <li>
              <a href={SITE.instagram.url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 ${enlace}`}>
                <IconoInstagram className="h-4 w-4" />
                {SITE.instagram.usuario}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold tracking-wide text-moon-50 uppercase">Dónde estamos</h2>
          <address className="mt-4 text-sm text-mist-300 not-italic">
            <a href={direccion.mapaUrl} target="_blank" rel="noopener noreferrer" className={enlace}>
              {direccion.calle}
              <br />
              {direccion.barrio} · {direccion.cp} {direccion.ciudad}
            </a>
          </address>
          <p className="mt-4 text-sm text-mist-300">
            <span className="block font-medium text-moon-50">Horario</span>
            {SITE.horario}
          </p>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold tracking-wide text-moon-50 uppercase">Catálogo</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={SITE.catalogoPdf.href} className={enlace}>
                Descargar el {SITE.catalogoPdf.etiqueta}
              </a>
            </li>
            <li>
              <Link href="/catalogo" className={enlace}>
                Ver el catálogo en la web
              </Link>
            </li>
          </ul>
          <h2 className="mt-8 font-display text-sm font-semibold tracking-wide text-moon-50 uppercase">Legal</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {ENLACES_LEGALES.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={enlace}>
                  {item.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-moon-50/10">
        {/* En móvil deja hueco a la derecha para el botón flotante de WhatsApp. */}
        <p className="mx-auto w-full max-w-6xl px-4 py-5 pr-24 text-xs text-mist-300/80 sm:px-6 sm:pr-24 lg:px-8">
          [MARCA] es el nombre comercial de {titular.nombre} · NIF {titular.nif}. {TEXTOS.sinIva}
        </p>
      </div>
    </footer>
  );
}

import { IconoWhatsApp } from '@/components/layout/Iconos';
import { BotonEnlace, ESTILO_BOTON } from '@/components/ui/Botones';
import { CTA, SITE, enlaceWhatsApp } from '@/lib/site';

/** Bloque final del catálogo (sección 4): versión honesta del «catálogo infinito», más la descarga del PDF. */
export function NoLoVes() {
  return (
    <div className="mt-16 grid gap-6 rounded-3xl border border-moon-50/10 bg-space-900/50 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
      <div>
        <h2 className="font-display text-2xl font-semibold text-moon-50 sm:text-3xl">¿No lo ves aquí?</h2>
        <p className="mt-3 text-lg text-mist-300">Trabajamos con muchos más productos; cuéntanos qué tienes en mente.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <BotonEnlace href={CTA.href}>{CTA.etiqueta}</BotonEnlace>
          <a href={enlaceWhatsApp()} target="_blank" rel="noopener noreferrer" className={ESTILO_BOTON.secundario}>
            <IconoWhatsApp className="h-4 w-4" />
            Escríbenos por WhatsApp
          </a>
        </div>
      </div>
      <div className="rounded-2xl border border-moon-50/10 bg-space-950/50 p-5">
        <p className="text-sm font-semibold text-moon-50">Catálogo en PDF</p>
        <p className="mt-1 text-sm text-mist-300">Los 30 productos con sus colores y precios «desde» (sin IVA), para verlos con calma o compartirlos. El catálogo oficial, tal cual.</p>
        <a href={SITE.catalogoPdf.href} className={`${ESTILO_BOTON.secundario} mt-4`} download>
          Descargar el {SITE.catalogoPdf.etiqueta}
        </a>
      </div>
    </div>
  );
}

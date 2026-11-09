import type { MetadataRoute } from 'next';
import { CON_ESTUDIO, PRODUCTOS } from '@/data/catalogo';
import { esDespliegueDeProduccion } from '@/lib/entorno';
import { ENLACES_LEGALES, SITE } from '@/lib/site';

// Fase 9: sitemap.xml con las páginas públicas (home, catálogo, las 30 fichas, los 2 estudios, opiniones, proyecto y
// legales). /gracias y /tu-opinion no van (noindex). Fuera de producción el sitemap va vacío.
export default function sitemap(): MetadataRoute.Sitemap {
  if (!esDespliegueDeProduccion()) return [];
  const url = (ruta: string) => `${SITE.url}${ruta}`;
  return [
    { url: url('/'), priority: 1 },
    { url: url('/catalogue'), priority: 0.9 },
    ...PRODUCTOS.filter((p) => p.activo).map((p) => ({ url: url(`/catalogue/${p.slug}`), priority: 0.8 })),
    ...CON_ESTUDIO.map((p) => ({ url: url(`/personnaliser/${p.slug}`), priority: 0.7 })),
    { url: url('/projet'), priority: 0.7 },
    { url: url('/avis'), priority: 0.4 },
    ...ENLACES_LEGALES.map((e) => ({ url: url(e.href), priority: 0.2 })),
  ];
}

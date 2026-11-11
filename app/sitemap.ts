import type { MetadataRoute } from 'next';
import { CON_ESTUDIO, PRODUCTOS } from '@/data/catalogo';
import { esDespliegueDeProduccion } from '@/lib/entorno';
import { ENLACES_LEGALES, SEGMENTS, SITE } from '@/lib/site';
import { obtenerOpiniones } from '@/lib/opiniones/obtener';

// sitemap.xml : pages publiques (accueil, catalogue, fiches, studios, pages atelier / équipe / segments, devis,
// livraison, légales). /merci, /donner-mon-avis et /espace-client n'y sont pas (noindex) ; /avis seulement quand il y a
// des avis publiés (la page est en noindex tant qu'elle est vide). Hors production, le sitemap est vide.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!esDespliegueDeProduccion()) return [];
  const url = (ruta: string) => `${SITE.url}${ruta}`;
  return [
    { url: url('/'), priority: 1 },
    { url: url('/catalogue'), priority: 0.9 },
    ...PRODUCTOS.filter((p) => p.activo).map((p) => ({ url: url(`/catalogue/${p.slug}`), priority: 0.8 })),
    ...CON_ESTUDIO.map((p) => ({ url: url(`/personnaliser/${p.slug}`), priority: 0.7 })),
    { url: url('/devis'), priority: 0.8 },
    ...SEGMENTS.map((s) => ({ url: url(`/professionnels/${s.slug}`), priority: 0.8 })),
    { url: url('/contact'), priority: 0.7 },
    { url: url('/comment-nous-travaillons'), priority: 0.6 },
    { url: url('/qui-sommes-nous'), priority: 0.6 },
    { url: url('/livraison-et-paiement'), priority: 0.4 },
    ...((await obtenerOpiniones()).length ? [{ url: url('/avis'), priority: 0.4 }] : []),
    ...ENLACES_LEGALES.map((e) => ({ url: url(e.href), priority: 0.2 })),
  ];
}

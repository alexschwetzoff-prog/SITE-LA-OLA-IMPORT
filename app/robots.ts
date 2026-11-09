import type { MetadataRoute } from 'next';
import { esDespliegueDeProduccion } from '@/lib/entorno';
import { SITE } from '@/lib/site';

// Fase 9: robots.txt. En producción (dominio-pendiente.example) se permite todo menos las páginas privadas; en cualquier
// otro despliegue (vistas previas, *.netlify.app, *.vercel.app) se bloquea la indexación entera.
export default function robots(): MetadataRoute.Robots {
  if (!esDespliegueDeProduccion()) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/gracias', '/tu-opinion'] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}

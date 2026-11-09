// Fase 9: dónde está desplegada la web, decidido en el build con las variables que exponen Netlify y Vercel.
// Solo la web publicada en dominio-pendiente.example se indexa: las vistas previas, los despliegues de rama y los
// subdominios *.netlify.app y *.vercel.app llevan noindex en los metadatos y «Disallow: /» en robots.txt. Un build
// en local (next build && next start) cuenta como producción para que Lighthouse mida lo mismo que verá Google.
//
// Netlify: CONTEXT (production | deploy-preview | branch-deploy | dev) y URL (la dirección principal del sitio: el
// dominio propio cuando está configurado como dominio principal; si no, el subdominio .netlify.app).
// Vercel: VERCEL_ENV (production | preview | development) y VERCEL_PROJECT_PRODUCTION_URL (dominio de producción).
// INDEXAR=1 o INDEXAR=0 fuerza el resultado (por si hiciera falta publicar desde otro sitio sin tocar el código).

import { SITE } from '@/lib/site';

const DOMINIO = new URL(SITE.url).host; // dominio-pendiente.example

function sinProtocolo(url: string | undefined): string {
  return (url ?? '').replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase();
}

/** `true` solo en el despliegue de producción que se sirve en dominio-pendiente.example (o en un build local). */
export function esDespliegueDeProduccion(): boolean {
  const forzado = process.env.INDEXAR?.trim();
  if (forzado === '1' || forzado === 'si') return true;
  if (forzado === '0' || forzado === 'no') return false;
  if (process.env.NETLIFY === 'true') {
    return process.env.CONTEXT === 'production' && sinProtocolo(process.env.URL) === DOMINIO;
  }
  if (process.env.VERCEL) {
    return process.env.VERCEL_ENV === 'production' && sinProtocolo(process.env.VERCEL_PROJECT_PRODUCTION_URL) === DOMINIO;
  }
  return true;
}

/** Nombre corto del entorno, para los logs del build. */
export function describirEntorno(): string {
  if (process.env.NETLIFY === 'true') return `Netlify · ${process.env.CONTEXT ?? '?'} · ${process.env.URL ?? '?'}`;
  if (process.env.VERCEL) return `Vercel · ${process.env.VERCEL_ENV ?? '?'} · ${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? '?'}`;
  return 'local';
}

// Lighthouse móvil de la home, varias pasadas, con el resumen que se mira al cerrar una fase: rendimiento, LCP, FCP,
// Speed Index, TBT, CLS, el elemento del LCP y los vídeos que se piden durante la carga.
// Uso: node scripts/lighthouse-home.mjs http://localhost:3100/ [pasadas=3] [carpeta=docs/capturas/video-hero]
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const url = process.argv[2] ?? 'http://localhost:3100/';
const pasadas = Number(process.argv[3] ?? 3);
const carpeta = process.argv[4] ?? 'docs/capturas/video-hero';
mkdirSync(carpeta, { recursive: true });
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const filas = [];
for (let i = 1; i <= pasadas; i++) {
  const salida = path.join(carpeta, `lighthouse-home-${i}.json`);
  const r = spawnSync(npx, ['lighthouse@13.5.0', url, '--only-categories=performance,accessibility,best-practices,seo', '--output=json', `--output-path=${salida}`, '--chrome-flags=--headless=new', '--quiet'], { stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error('lighthouse ha fallado en la pasada', i);
    process.exit(1);
  }
  const j = JSON.parse(readFileSync(salida, 'utf8'));
  const a = j.audits;
  const ms = (k) => Math.round(a[k].numericValue);
  const peticiones = a['network-requests'].details.items;
  const scripts = peticiones.filter((p) => p.resourceType === 'Script').reduce((s, p) => s + (p.transferSize ?? 0), 0);
  const videos = peticiones.filter((p) => /\.(mp4|webm)(\?|$)/.test(p.url)).map((p) => `${path.basename(p.url)} ${(p.transferSize / 1024).toFixed(0)} KB a ${(p.networkRequestTime / 1000).toFixed(1)} s`);
  const lcpEl = a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet ?? '';
  filas.push({
    pasada: i,
    rendimiento: Math.round(j.categories.performance.score * 100),
    accesibilidad: Math.round(j.categories.accessibility.score * 100),
    practicas: Math.round(j.categories['best-practices'].score * 100),
    seo: Math.round(j.categories.seo.score * 100),
    LCP: ms('largest-contentful-paint'),
    FCP: ms('first-contentful-paint'),
    SI: ms('speed-index'),
    TBT: ms('total-blocking-time'),
    CLS: a['cumulative-layout-shift'].numericValue.toFixed(3),
    jsKB: Math.round(scripts / 1024),
    videos: videos.join(' · ') || 'ninguno',
    lcpEl: lcpEl.slice(0, 90),
  });
}
console.table(filas.map((f) => Object.fromEntries(Object.entries(f).filter(([clave]) => clave !== 'videos' && clave !== 'lcpEl'))));
console.log('vídeos pedidos durante la carga:', filas.map((f) => f.videos).join(' | '));
console.log('elemento LCP:', filas[0].lcpEl);

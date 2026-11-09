// Comprobación (fase 4.6): a 390 px en emulación móvil, el documento tiene que medir 390 px y el botón del menú quedar en
// pantalla en todas las rutas. Si algo sobresale, Chrome agranda el viewport de maquetación y la cabecera se sale.
// Uso: node scripts/comprobar-movil.mjs http://localhost:3000
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:3000';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
let fallos = 0;
for (const ruta of ['/', '/catalogue', '/catalogue/imola', '/catalogue/zenith', '/personnaliser', '/projet', '/merci', '/avis', '/mentions-legales']) {
  await p.goto(base + ruta, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => {
    const de = document.documentElement;
    const menu = document.querySelector('header button[aria-expanded], header button[aria-label*="men" i], header button[aria-controls]');
    const rect = menu?.getBoundingClientRect();
    const anchos = [...document.querySelectorAll('body *')].filter((e) => getComputedStyle(e).position !== 'fixed').map((e) => e.getBoundingClientRect().right);
    return { innerWidth, clientWidth: de.clientWidth, scrollWidth: de.scrollWidth, header: Math.round(document.querySelector('header').getBoundingClientRect().width), menuDerecha: rect ? Math.round(rect.right) : null, maxDerecha: Math.round(Math.max(...anchos)) };
  });
  const ok = r.innerWidth === 390 && r.scrollWidth === 390 && r.header === 390 && (r.menuDerecha === null || r.menuDerecha <= 390);
  if (!ok) fallos++;
  console.log(`${ok ? 'OK ' : 'MAL'} ${ruta.padEnd(16)} inner ${r.innerWidth} client ${r.clientWidth} scroll ${r.scrollWidth} cabecera ${r.header} menú hasta ${r.menuDerecha} · elemento más a la derecha ${r.maxDerecha}`);
}
await b.close();
console.log(fallos ? `VIEWPORT: ${fallos} rutas mal` : 'VIEWPORT OK: 390 px en todas las rutas y el menú en pantalla');

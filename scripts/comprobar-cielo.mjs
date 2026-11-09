// Comprobación (fase 4.6): errores de consola, densidad del cielo y que el sobrevuelo del OVNI nunca pisa el texto
// ni los botones de la primera pantalla. Se fuerza un sobrevuelo y se lee su posición real del motor (gancho
// window.__marcaCielo con ?capturas=1) cada 150 ms, comparándola con las zonas marcadas.
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:3000';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const navegador = await chromium.launch();
let fallos = 0;
for (const [ruta, vista] of [['/', { width: 1280, height: 800 }], ['/', { width: 390, height: 844 }], ['/catalogo', { width: 1280, height: 800 }], ['/', { width: 1024, height: 700 }]]) {
  const ctx = await navegador.newContext({ viewport: vista, deviceScaleFactor: vista.width < 500 ? 2 : 1, isMobile: vista.width < 500 });
  const p = await ctx.newPage();
  const errores = [];
  p.on('console', (m) => { if (m.type() === 'error') errores.push(`${m.type()}: ${m.text().slice(0, 160)}`); });
  p.on('pageerror', (e) => errores.push(`pageerror: ${e.message.slice(0, 160)}`));
  await p.goto(base + ruta + '?capturas=1', { waitUntil: 'load' });
  await espera(3500);
  const estrellas = await p.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return 'sin canvas';
    const d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 20) n++;
    return `${n} px con estrella (${c.width}×${c.height})`;
  });
  for (let intento = 0; intento < 3; intento++) {
    await p.evaluate(() => window.dispatchEvent(new Event('marca:sobrevuelo')));
    const muestras = [];
    for (let k = 0; k < 36; k++) {
      await espera(150);
      muestras.push(await p.evaluate(() => {
        const s = window.__marcaCielo?.estado().sobrevuelo;
        if (!s) return null;
        const caja = { left: s.x - s.ancho / 2, top: s.y - s.alto / 2, right: s.x + s.ancho / 2, bottom: s.y + s.alto / 2 };
        const zonas = [...document.querySelectorAll('[data-cielo-evitar], main h1')].map((e) => e.getBoundingClientRect()).filter((z) => z.width > 0);
        const pisa = zonas.filter((z) => !(caja.right < z.left || caja.left > z.right || caja.bottom < z.top || caja.top > z.bottom));
        const dentro = caja.right > 0 && caja.left < innerWidth && caja.bottom > 0 && caja.top < innerHeight;
        return { x: Math.round(s.x), y: Math.round(s.y), dentro, pisa: pisa.length };
      }));
    }
    const vistas = muestras.filter((m) => m && m.dentro);
    const pisadas = vistas.filter((m) => m.pisa > 0);
    const flote = vistas[Math.floor(vistas.length / 2)];
    console.log(`${ruta} @${vista.width} intento ${intento + 1}: ${vistas.length} muestras del OVNI en pantalla, flota en (${flote?.x}, ${flote?.y}), ${pisadas.length} pisan texto/botones`);
    if (pisadas.length) fallos++;
    if (intento === 0) await p.screenshot({ path: `${process.argv[3] ?? 'docs/capturas/fase-4-6'}/sonda-sobrevuelo-${vista.width}${ruta === '/catalogo' ? '-catalogo' : ''}.png` }).catch(() => {});
    await espera(800);
  }
  console.log(`  ${estrellas}${errores.length ? ' · consola: ' + errores.slice(0, 3).join(' | ') : ''}`);
  await ctx.close();
}
await navegador.close();
console.log(fallos ? `FALLOS: ${fallos}` : 'OK: ningún sobrevuelo pisa texto ni botones');

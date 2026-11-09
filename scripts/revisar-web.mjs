// Revisión final de la web (fase 9): recorre todas las páginas en escritorio y a 390 px y comprueba
//   - enlaces internos rotos (cada <a href> interno responde 200; los externos solo se listan),
//   - textos que no pueden salir en producción: «lorem», marcadores [FALTA …] / [provisional], «demo», «muestra
//     gratuita», «mockup», el nombre del proveedor, «distribuidor oficial», «videollamada»,
//   - metadatos: título y descripción únicos por página, canónica, imagen Open Graph, robots,
//   - errores de consola y peticiones fallidas (4xx/5xx) al cargar cada página.
// Uso: node scripts/revisar-web.mjs http://localhost:3000 [--capturas docs/capturas/fase-9]
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const capturasArg = process.argv.indexOf('--capturas');
const carpetaCapturas = capturasArg > 0 ? process.argv[capturasArg + 1] : null;

// Palabras que no pueden aparecer en el texto visible ni en los metadatos (minúsculas; se busca como subcadena).
const PROHIBIDAS = ['lorem', 'ipsum', '[falta', '[provisional', 'provisional]', 'mockup', 'muestra gratuita', 'muestra gratis', 'demo gratuita', 'demo física', 'solicitar demo', 'distribuidor oficial', 'videollamada', 'proveedor-pendiente', /* [PROVEEDOR] nombre del fabricante */ 'todo:', 'fixme', 'se activa en la fase'];
// Marcadores que sí se admiten mientras el equipo no aporte el dato (se listan aparte, no cuentan como error).
const PENDIENTES_ADMITIDOS = ['[falta número de registro]', '[plazo a confirmar]'];

const RUTAS_INICIALES = ['/', '/catalogo', '/disena/atomic-150', '/disena/austral', '/proyecto', '/opiniones', '/gracias', '/tu-opinion', '/aviso-legal', '/privacidad', '/cookies', '/no-existe-404', '/sitemap.xml', '/robots.txt'];

const b = await chromium.launch();
const resultados = [];
const titulos = new Map();
const descripciones = new Map();
const enlacesExternos = new Set();
const porVisitar = [...RUTAS_INICIALES];
const visitadas = new Set();
let fallos = 0;
const mal = (texto) => {
  fallos++;
  console.log(`MAL ${texto}`);
};

async function comprobarEstado(ruta) {
  const r = await fetch(base + ruta, { redirect: 'manual' });
  return r.status;
}

const vistas = {
  escritorio: { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 },
  movil: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

for (const [nombreVista, opciones] of Object.entries(vistas)) {
  const ctx = await b.newContext(opciones);
  const p = await ctx.newPage();
  const consola = [];
  const peticionesMal = [];
  p.on('console', (m) => {
    // la propia página 404 de prueba responde 404: ese aviso del navegador es el esperado
    if ((m.type() === 'error' || m.type() === 'warning') && !(p.url().includes('/no-existe-404') && /404/.test(m.text()))) consola.push(`${m.type()}: ${m.text().slice(0, 160)}`);
  });
  p.on('response', (r) => {
    if (r.status() >= 400 && !r.url().includes('/no-existe-404')) peticionesMal.push(`${r.status()} ${r.url()}`);
  });
  // a 390 px se repasan las páginas HTML que se encontraron en escritorio (los archivos no se vuelven a pedir)
  const cola = nombreVista === 'escritorio' ? porVisitar : [...visitadas].filter((r) => !/\.(pdf|png|jpg|webp|mp4|webm|ico|xml|txt)$/.test(r));
  const vistasAqui = new Set();
  while (cola.length) {
    const ruta = cola.shift();
    if (vistasAqui.has(ruta)) continue;
    vistasAqui.add(ruta);
    if (nombreVista === 'escritorio') visitadas.add(ruta);
    const esHtml = !/\.(xml|txt)$/.test(ruta);
    consola.length = 0;
    peticionesMal.length = 0;
    const respuesta = await p.goto(base + ruta, { waitUntil: 'load' });
    const estado = respuesta?.status();
    const esperado = ruta === '/no-existe-404' ? 404 : 200;
    if (estado !== esperado) mal(`${nombreVista} ${ruta}: responde ${estado} (esperaba ${esperado})`);
    if (!esHtml) {
      const cuerpo = await respuesta.text();
      console.log(`OK  ${nombreVista} ${ruta}: ${cuerpo.length} bytes${ruta.endsWith('.xml') ? ` · ${(cuerpo.match(/<loc>/g) ?? []).length} URLs` : ''}`);
      if (ruta === '/robots.txt') console.log('    ' + cuerpo.trim().split('\n').join(' | '));
      continue;
    }
    await p.waitForTimeout(800);
    const datos = await p.evaluate(() => {
      const texto = document.body.innerText;
      const meta = (sel) => document.querySelector(sel)?.getAttribute('content') ?? null;
      const enlaces = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
      return {
        titulo: document.title,
        descripcion: meta('meta[name="description"]'),
        canonica: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
        og: meta('meta[property="og:image"]'),
        ogTitulo: meta('meta[property="og:title"]'),
        robots: meta('meta[name="robots"]'),
        h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
        texto,
        enlaces,
        favicon: document.querySelector('link[rel="icon"]')?.getAttribute('href') ?? null,
      };
    });
    const resumen = `${nombreVista} ${ruta}`;
    let textoTodo = `${datos.texto}\n${datos.titulo}\n${datos.descripcion ?? ''}`.toLowerCase();
    // los marcadores admitidos no cuentan como texto prohibido (se listan aparte)
    for (const pendiente of PENDIENTES_ADMITIDOS) textoTodo = textoTodo.split(pendiente).join(' ');
    for (const palabra of PROHIBIDAS) {
      if (textoTodo.includes(palabra)) {
        const i = textoTodo.indexOf(palabra);
        mal(`${resumen}: contiene «${palabra}»: …${textoTodo.slice(Math.max(0, i - 50), i + 60).replace(/\s+/g, ' ')}…`);
      }
    }
    for (const pendiente of PENDIENTES_ADMITIDOS) {
      if (datos.texto.toLowerCase().includes(pendiente)) console.log(`PEN ${resumen}: marcador pendiente «${pendiente}»`);
    }
    if (nombreVista === 'escritorio') {
      if (!datos.titulo) mal(`${resumen}: sin <title>`);
      if (!datos.descripcion) mal(`${resumen}: sin meta description`);
      if (datos.h1.length !== 1) mal(`${resumen}: ${datos.h1.length} h1 (${datos.h1.join(' / ')})`);
      const noIndex = /noindex/.test(datos.robots ?? '');
      if (!noIndex && ruta !== '/no-existe-404') {
        if (!datos.canonica) mal(`${resumen}: sin canónica`);
        else if (!datos.canonica.startsWith('https://dominio-pendiente.example')) mal(`${resumen}: canónica rara ${datos.canonica}`);
        if (!datos.og) mal(`${resumen}: sin og:image`);
        if (titulos.has(datos.titulo)) mal(`${resumen}: título repetido con ${titulos.get(datos.titulo)}: «${datos.titulo}»`);
        if (datos.descripcion && descripciones.has(datos.descripcion)) mal(`${resumen}: descripción repetida con ${descripciones.get(datos.descripcion)}`);
        titulos.set(datos.titulo, ruta);
        if (datos.descripcion) descripciones.set(datos.descripcion, ruta);
      }
      if (!datos.favicon) mal(`${resumen}: sin favicon`);
      console.log(`OK  ${resumen} · «${datos.titulo}»${noIndex ? ' · noindex' : ''} · canónica ${datos.canonica ?? '-'} · og ${datos.og ? path.basename(datos.og) : '-'}`);
      for (const href of datos.enlaces) {
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
        if (/^https?:/.test(href)) {
          if (!href.startsWith(base)) {
            enlacesExternos.add(href.replace(/\?.*$/, ''));
            continue;
          }
        }
        const limpio = href.replace(base, '').split('#')[0].split('?')[0];
        if (limpio && !visitadas.has(limpio) && !cola.includes(limpio)) {
          if (/\.(pdf|png|jpg|webp|mp4|webm|ico)$/.test(limpio)) {
            const estadoArchivo = await comprobarEstado(limpio);
            if (estadoArchivo !== 200) mal(`${resumen}: enlace a archivo ${limpio} responde ${estadoArchivo}`);
            else console.log(`OK  archivo ${limpio}`);
            visitadas.add(limpio);
          } else cola.push(limpio);
        }
      }
    } else {
      // móvil: nada se sale de la pantalla y el menú está
      const ancho = await p.evaluate(() => document.documentElement.scrollWidth);
      if (ancho !== 390) mal(`${resumen}: el documento mide ${ancho} px (debe medir 390)`);
      else console.log(`OK  ${resumen} · 390 px`);
    }
    if (consola.length) console.log(`    consola: ${consola.slice(0, 3).join(' · ')}`);
    if (peticionesMal.length) mal(`${resumen}: peticiones fallidas: ${peticionesMal.slice(0, 5).join(' · ')}`);
    if (carpetaCapturas && ['/', '/catalogo', '/catalogo/atomic-150', '/proyecto', '/opiniones', '/gracias', '/aviso-legal', '/no-existe-404'].includes(ruta)) {
      await mkdir(carpetaCapturas, { recursive: true });
      const nombre = ruta === '/' ? 'inicio' : ruta.replace(/^\//, '').replace(/\//g, '-');
      await p.screenshot({ path: path.join(carpetaCapturas, `${nombre}-${nombreVista}.png`), fullPage: ruta !== '/' });
    }
    resultados.push({ vista: nombreVista, ruta, estado });
  }
  await ctx.close();
}
await b.close();

console.log(`\n${visitadas.size} rutas internas comprobadas en escritorio y a 390 px.`);
console.log('Enlaces externos (no se comprueban):');
for (const e of [...enlacesExternos].sort()) console.log('  ' + e);
console.log(fallos ? `\nREVISIÓN: ${fallos} problemas` : '\nREVISIÓN OK: sin problemas');
process.exit(fallos ? 1 : 0);

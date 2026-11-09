// Capturas de pantalla a 390 px y escritorio con Chrome, sin dependencias (protocolo DevTools).
// Chrome headless ignora anchos de ventana pequeños, así que aquí se emula el dispositivo.
// Uso: node scripts/capturas.mjs [urlBase] [carpeta]
//   urlBase: http://localhost:3000 por defecto (hace falta `npm run build && npm run start`).
//   carpeta: docs/capturas/fase-4-2 por defecto.
// Variables: CHROME_PATH para indicar otro navegador basado en Chromium.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

// ---------------------------------------------------------------------------------------------
// Códec PNG mínimo para unir los tramos de una captura larga (8 bits, RGB o RGBA, sin entrelazar).
// ---------------------------------------------------------------------------------------------
function leerPng(buf) {
  const ihdr = { ancho: buf.readUInt32BE(16), alto: buf.readUInt32BE(20), bits: buf[24], tipo: buf[25], entrelazado: buf[28] };
  if (ihdr.bits !== 8 || ![2, 6].includes(ihdr.tipo) || ihdr.entrelazado) throw new Error('PNG no admitido');
  const canales = ihdr.tipo === 6 ? 4 : 3;
  const idat = [];
  for (let p = 8; p < buf.length; ) {
    const largo = buf.readUInt32BE(p);
    const tipo = buf.toString('latin1', p + 4, p + 8);
    if (tipo === 'IDAT') idat.push(buf.subarray(p + 8, p + 8 + largo));
    p += 12 + largo;
  }
  const crudo = zlib.inflateSync(Buffer.concat(idat));
  const bpp = canales;
  const fila = ihdr.ancho * bpp;
  const salida = Buffer.alloc(fila * ihdr.alto);
  let previa = Buffer.alloc(fila);
  for (let y = 0; y < ihdr.alto; y++) {
    const filtro = crudo[y * (fila + 1)];
    const linea = crudo.subarray(y * (fila + 1) + 1, (y + 1) * (fila + 1));
    const actual = salida.subarray(y * fila, (y + 1) * fila);
    for (let i = 0; i < fila; i++) {
      const a = i >= bpp ? actual[i - bpp] : 0;
      const b = previa[i];
      const c = i >= bpp ? previa[i - bpp] : 0;
      let v = linea[i];
      if (filtro === 1) v += a;
      else if (filtro === 2) v += b;
      else if (filtro === 3) v += (a + b) >> 1;
      else if (filtro === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      actual[i] = v & 255;
    }
    previa = actual;
  }
  return { ...ihdr, canales, datos: salida };
}

function escribirPng({ ancho, alto, tipo, canales, datos }) {
  const fila = ancho * canales;
  const crudo = Buffer.alloc((fila + 1) * alto);
  for (let y = 0; y < alto; y++) {
    crudo[y * (fila + 1)] = 0;
    datos.copy(crudo, y * (fila + 1) + 1, y * fila, (y + 1) * fila);
  }
  const chunk = (nombre, cuerpo) => {
    const largo = Buffer.alloc(4);
    largo.writeUInt32BE(cuerpo.length);
    const tipoYCuerpo = Buffer.concat([Buffer.from(nombre, 'latin1'), cuerpo]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(tipoYCuerpo) >>> 0);
    return Buffer.concat([largo, tipoYCuerpo, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0);
  ihdr.writeUInt32BE(alto, 4);
  ihdr[8] = 8;
  ihdr[9] = tipo;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(crudo, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Une varios PNG del mismo ancho, uno debajo de otro. */
function unirPng(buffers) {
  const tramos = buffers.map(leerPng);
  const base = tramos[0];
  return escribirPng({ ...base, alto: tramos.reduce((n, t) => n + t.alto, 0), datos: Buffer.concat(tramos.map((t) => t.datos)) });
}

const base = process.argv[2] ?? 'http://localhost:3000';
const carpeta = process.argv[3] ?? 'docs/capturas/fase-4-6';
// --solo nombre1,nombre2: solo esas capturas (por ejemplo, las «antes» de una fase sobre el build anterior).
const soloArg = process.argv.find((a) => a.startsWith('--solo='));
const solo = soloArg ? new Set(soloArg.slice(7).split(',')) : null;

const VISTAS = {
  movil: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
  escritorio: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
  zoom200: { width: 720, height: 450, deviceScaleFactor: 2, mobile: false },
  // fase 4.6: ventanas altas para encuadrar entera la sección de destacados (6 tarjetas)
  'escritorio-alto': { width: 1440, height: 1500, deviceScaleFactor: 1, mobile: false },
  'movil-alto': { width: 390, height: 2900, deviceScaleFactor: 2, mobile: true },
};

// Acciones reutilizables (JS que se ejecuta en la página antes de capturar).
const ABRIR_MENU = "document.querySelector('header button[aria-expanded]').click()";
const SOLTAR_LOGO = `(async () => {
  const r = await fetch('/marca/logo-marca.png');
  const file = new File([await r.blob()], 'logo-prueba.png', { type: 'image/png' });
  const input = document.querySelector('#pruebalo input[type=file]');
  const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 1500));
  document.documentElement.style.scrollBehavior = 'auto';
  document.querySelector('#pruebalo').scrollIntoView();
  await new Promise((r) => setTimeout(r, 900));
})()`;
const FILTRAR_SUDADERAS = `(async () => {
  [...document.querySelectorAll('[role=group][aria-label=Categoría] button')].find((b) => b.textContent.includes('Sudaderas')).click();
  await new Promise((r) => setTimeout(r, 900));
})()`;
const COLOR_ROYAL = `(async () => {
  document.querySelector('button[title=Royal]').click();
  await new Promise((r) => setTimeout(r, 900));
})()`;
// Elige un color en la ficha (botón con el nombre del color como título) y espera a que cargue la foto.
const elegirColor = (nombre) => `(async () => {
  document.querySelector('button[title=${JSON.stringify(nombre)}]').click();
  await new Promise((r) => setTimeout(r, 1500));
  const img = document.querySelector('article img[fetchpriority]');
  if (img && !img.complete) await new Promise((r) => { img.onload = r; img.onerror = r; });
  await new Promise((r) => setTimeout(r, 300));
})()`;
// Elige un color en la primera tarjeta del catálogo que tenga esa muestra.
const elegirColorTarjeta = (nombre) => `(async () => {
  const b = [...document.querySelectorAll('ul[aria-describedby] button[title=${JSON.stringify(nombre)}]')][0];
  b.scrollIntoView({ block: 'center' });
  b.click();
  await new Promise((r) => setTimeout(r, 1800));
})()`;
// Fase 4.1: ver la espalda en la ficha (botón «Detrás» de la galería).
const VER_DETRAS = `(async () => {
  [...document.querySelectorAll('[role=group][aria-label=Vista] button')].find((b) => b.textContent.trim() === 'Detrás').click();
  await new Promise((r) => setTimeout(r, 1500));
  const img = document.querySelector('article img[fetchpriority]');
  if (img && !img.complete) await new Promise((r) => { img.onload = r; img.onerror = r; });
  await new Promise((r) => setTimeout(r, 300));
})()`;
// Elegir una posición y añadir al presupuesto (el selector es obligatorio desde la fase 4.1).
const ELEGIR_POSICION_Y_ANADIR = `(async () => {
  [...document.querySelectorAll('button[aria-pressed]')].find((b) => b.textContent.includes('Corazón'))?.click();
  await new Promise((r) => setTimeout(r, 200));
  [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Añadir al presupuesto').click();
  await new Promise((r) => setTimeout(r, 500));
  document.documentElement.style.scrollBehavior = 'auto';
  [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Añadir al presupuesto').scrollIntoView({ block: 'center' });
  await new Promise((r) => setTimeout(r, 400));
})()`;
// Intentar añadir sin posición: sale el aviso.
const ANADIR_SIN_POSICION = `(async () => {
  document.documentElement.style.scrollBehavior = 'auto';
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Añadir al presupuesto');
  b.click();
  await new Promise((r) => setTimeout(r, 400));
  b.scrollIntoView({ block: 'center' });
  await new Promise((r) => setTimeout(r, 400));
})()`;
// Formulario de /proyecto en modo particular.
const MODO_PARTICULAR = `(async () => {
  document.querySelector('input[name=tipo_cliente][value=particular]').click();
  await new Promise((r) => setTimeout(r, 600));
})()`;

// Zoom al 200 % (fase 4.2: el logo del ejemplo tiene que verse nítido ampliado): como hace el navegador al ampliar,
// la ventana de escritorio se ve a la mitad de ancho en px CSS y con el doble de píxeles de dispositivo.
const ENCUADRAR_FOTO = `(async () => {
  document.documentElement.style.scrollBehavior = 'auto';
  const img = document.querySelector('article img[fetchpriority]');
  img.scrollIntoView({ block: 'start' });
  window.scrollBy(0, -16);
  await new Promise((r) => setTimeout(r, 900));
})()`;

// [nombre, ruta, vista, acción opcional, { completa?: boolean } ]
// Por defecto la captura es de la página entera (hasta 6000 px); completa: false captura solo la ventana.
// Fase 4.3: un color y, encadenado, la vista trasera.
const colorYDetras = (nombre) => `(async () => { await ${elegirColor(nombre)}; await ${VER_DETRAS}; })()`;
// Fase 4.4: elegir un color en una tarjeta concreta del catálogo (por el nombre del producto) y, en las primeras
// tarjetas con ese color, el mismo color a la vez (prendas en negro).
const elegirColorEnTarjeta = (producto, color) => `(async () => {
  document.documentElement.style.scrollBehavior = 'auto';
  const art = [...document.querySelectorAll('article')].find((a) => a.querySelector('h3')?.textContent.trim() === ${JSON.stringify(producto)});
  art.scrollIntoView({ block: 'center' });
  await new Promise((r) => setTimeout(r, 400));
  art.querySelector('button[title=${JSON.stringify(color)}]').click();
  await new Promise((r) => setTimeout(r, 2200));
})()`;
const colorEnTarjetas = (color, n) => `(async () => {
  document.documentElement.style.scrollBehavior = 'auto';
  const arts = [...document.querySelectorAll('article')].filter((a) => a.querySelector('button[title=${JSON.stringify(color)}]')).slice(0, ${n});
  for (const a of arts) { a.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 250)); a.querySelector('button[title=${JSON.stringify(color)}]').click(); await new Promise((r) => setTimeout(r, 900)); }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 1200));
})()`;

const CAPTURAS_4_3 = [
  // Fase 4.3: fotos reales de todos los colores (delante y detrás)
  ['ficha-imola-amarillo-delante', '/catalogue/imola', 'escritorio', null, { completa: false }],
  ['ficha-imola-amarillo-detras', '/catalogue/imola', 'escritorio', VER_DETRAS, { completa: false }],
  ['ficha-imola-royal-delante', '/catalogue/imola', 'escritorio', elegirColor('Royal'), { completa: false }],
  ['ficha-imola-royal-detras', '/catalogue/imola', 'escritorio', colorYDetras('Royal'), { completa: false }],
  ['ficha-montblanc-royal-delante', '/catalogue/montblanc', 'escritorio', elegirColor('Royal'), { completa: false }],
  ['ficha-montblanc-royal-detras', '/catalogue/montblanc', 'escritorio', colorYDetras('Royal'), { completa: false }],
  ['ficha-montblanc-rojo-delante', '/catalogue/montblanc', 'escritorio', elegirColor('Rojo'), { completa: false }],
  ['ficha-shura-fucsia-delante', '/catalogue/shura', 'escritorio', null, { completa: false }],
  ['ficha-shura-fucsia-detras', '/catalogue/shura', 'escritorio', VER_DETRAS, { completa: false }],
  ['ficha-shura-negro-delante', '/catalogue/shura', 'escritorio', elegirColor('Negro'), { completa: false }],
  ['ficha-shura-negro-detras', '/catalogue/shura', 'escritorio', colorYDetras('Negro'), { completa: false }],
  ['ficha-freya-blanco-y-royal', '/catalogue/freya', 'escritorio', elegirColor('Blanco y royal'), { completa: false }],
  ['ficha-freya-blanco-y-negro', '/catalogue/freya', 'escritorio', elegirColor('Blanco y negro'), { completa: false }],
  ['ficha-atomic-blanco-delante', '/catalogue/atomic-150', 'escritorio', elegirColor('Blanco'), { completa: false }],
  ['ficha-atomic-blanco-detras', '/catalogue/atomic-150', 'escritorio', colorYDetras('Blanco'), { completa: false }],
  ['ficha-atomic-royal-delante', '/catalogue/atomic-150', 'escritorio', elegirColor('Royal'), { completa: false }],
  ['ficha-atomic-royal-detras', '/catalogue/atomic-150', 'escritorio', colorYDetras('Royal'), { completa: false }],
  ['ficha-atomic-gris-vigore-delante', '/catalogue/atomic-150', 'escritorio', elegirColor('Gris vigoré'), { completa: false }],
  ['ficha-atomic-gris-vigore-detras', '/catalogue/atomic-150', 'escritorio', colorYDetras('Gris vigoré'), { completa: false }],
  // Traseras nuevas (Mercury con el cierre, Crest cara B) y Jamaica (encuadre propio por color)
  ['ficha-mercury-royal-detras', '/catalogue/mercury', 'escritorio', colorYDetras('Royal'), { completa: false }],
  ['ficha-crest-verde-delante', '/catalogue/crest', 'escritorio', elegirColor('Verde'), { completa: false }],
  ['ficha-jamaica-gris-vigore-delante', '/catalogue/jamaica', 'escritorio', null, { completa: false }],
  ['ficha-jamaica-blanco-delante', '/catalogue/jamaica', 'escritorio', elegirColor('Blanco'), { completa: false }],
  // Estudio con fotos reales
  ['estudio-atomic-royal-escritorio', '/personnaliser/atomic-150?color=Royal', 'escritorio', null, { completa: false }],
  ['estudio-austral-amarillo-escritorio', '/personnaliser/austral?color=Amarillo', 'escritorio', null, { completa: false }],
  // 390 px
  ['ficha-imola-390', '/catalogue/imola', 'movil', null, { completa: false }],
  ['ficha-freya-390', '/catalogue/freya', 'movil', elegirColor('Blanco y rojo'), { completa: false }],
  ['catalogo-390', '/catalogue', 'movil'],
  ['inicio-390', '/', 'movil'],
  ['estudio-atomic-royal-390', '/personnaliser/atomic-150?color=Royal', 'movil', null, { completa: false }],
  // Regresión
  ['inicio-escritorio', '/', 'escritorio'],
  ['catalogo-escritorio', '/catalogue', 'escritorio'],
  ['color-tarjeta-bull-negro-escritorio', '/catalogue', 'escritorio', elegirColorTarjeta('Negro'), { completa: false }],
  ['proyecto-negocio-escritorio', '/projet?cita=local', 'escritorio'],
  ['inicio-390-menu', '/', 'movil', ABRIR_MENU, { completa: false }],
  ['inicio-escritorio-logo', '/', 'escritorio', SOLTAR_LOGO, { completa: false }],
  ['catalogo-sudaderas-escritorio', '/catalogue', 'escritorio', FILTRAR_SUDADERAS],
  ['ficha-bull-posicion-390', '/catalogue/bull', 'movil', ELEGIR_POSICION_Y_ANADIR, { completa: false }],
  ['proyecto-particular-390', '/projet', 'movil', MODO_PARTICULAR],
  ['ficha-atomic-zoom-200', '/catalogue/atomic-150', 'zoom200', ENCUADRAR_FOTO, { completa: false }],
];
void COLOR_ROYAL;
void ANADIR_SIN_POSICION;
void CAPTURAS_4_3;

// Ir a una sección por su id (con el scroll instantáneo) y dejar que carguen sus fotos.
const irA = (id) => `(async () => {
  document.documentElement.style.scrollBehavior = 'auto';
  document.getElementById(${JSON.stringify(id)}).scrollIntoView({ block: 'start' });
  window.scrollBy(0, -24);
  await new Promise((r) => setTimeout(r, 2500));
})()`;

// Vídeo de portada (18/10/2026): el hero con el vídeo en el ojo de buey, en escritorio y a 390 px (primera pantalla).
// Carpeta: docs/capturas/video-hero.
const CAPTURAS = [
  ['inicio-escritorio', '/', 'escritorio', null, { completa: false }],
  ['inicio-390', '/', 'movil', null, { completa: false }],
].filter(([nombre]) => !solo || solo.has(nombre));

// Fase 4.6: logo [MARCA] siempre con sus colores (Atomic 150 y Austral en 4 colores, delante y detrás) y los
// destacados (6) en escritorio y a 390 px.
const CAPTURAS_4_6 = [
  ['ficha-atomic-blanco-delante', '/catalogue/atomic-150', 'escritorio', elegirColor('Blanco'), { completa: false }],
  ['ficha-atomic-blanco-detras', '/catalogue/atomic-150', 'escritorio', colorYDetras('Blanco'), { completa: false }],
  ['ficha-atomic-negro-delante', '/catalogue/atomic-150', 'escritorio', elegirColor('Negro'), { completa: false }],
  ['ficha-atomic-negro-detras', '/catalogue/atomic-150', 'escritorio', colorYDetras('Negro'), { completa: false }],
  ['ficha-atomic-royal-delante', '/catalogue/atomic-150', 'escritorio', elegirColor('Royal'), { completa: false }],
  ['ficha-atomic-royal-detras', '/catalogue/atomic-150', 'escritorio', colorYDetras('Royal'), { completa: false }],
  ['ficha-atomic-rojo-delante', '/catalogue/atomic-150', 'escritorio', elegirColor('Rojo'), { completa: false }],
  ['ficha-atomic-rojo-detras', '/catalogue/atomic-150', 'escritorio', colorYDetras('Rojo'), { completa: false }],
  ['ficha-austral-blanco-delante', '/catalogue/austral', 'escritorio', elegirColor('Blanco'), { completa: false }],
  ['ficha-austral-blanco-detras', '/catalogue/austral', 'escritorio', colorYDetras('Blanco'), { completa: false }],
  ['ficha-austral-negro-delante', '/catalogue/austral', 'escritorio', null, { completa: false }],
  ['ficha-austral-negro-detras', '/catalogue/austral', 'escritorio', VER_DETRAS, { completa: false }],
  ['ficha-austral-royal-delante', '/catalogue/austral', 'escritorio', elegirColor('Royal'), { completa: false }],
  ['ficha-austral-royal-detras', '/catalogue/austral', 'escritorio', colorYDetras('Royal'), { completa: false }],
  ['ficha-austral-marino-delante', '/catalogue/austral', 'escritorio', elegirColor('Marino'), { completa: false }],
  ['ficha-austral-marino-detras', '/catalogue/austral', 'escritorio', colorYDetras('Marino'), { completa: false }],
  ['catalogo-negro-tarjetas', '/catalogue', 'escritorio', colorEnTarjetas('Negro', 5), { completa: false }],
  ['estudio-atomic-negro', '/personnaliser/atomic-150?color=Negro', 'escritorio', null, { completa: false }],
  ['estudio-austral-negro', '/personnaliser/austral?color=Negro', 'escritorio', null, { completa: false }],
  ['destacados-escritorio', '/', 'escritorio-alto', irA('catalogo'), { completa: false }],
  ['destacados-390', '/', 'movil-alto', irA('catalogo'), { completa: false }],
  ['inicio-390', '/', 'movil'],
  ['catalogo-390', '/catalogue', 'movil'],
];
void CAPTURAS_4_6;

// Fase 4.4: nitidez (zoom al 200 %), prendas en negro, Shura y Valier desde la tarjeta. Las «antes» se toman del
// build anterior con --solo=… y van a docs/capturas/fase-4-4/antes/.
const CAPTURAS_4_4 = [
  // Antes/después con zoom al 200 % (la foto de la ficha ampliada ×2 en una pantalla 2×)
  ['zoom200-atomic', '/catalogue/atomic-150', 'zoom200', ENCUADRAR_FOTO, { completa: false }],
  ['zoom200-imola', '/catalogue/imola', 'zoom200', ENCUADRAR_FOTO, { completa: false }],
  ['zoom200-montblanc', '/catalogue/montblanc', 'zoom200', ENCUADRAR_FOTO, { completa: false }],
  ['zoom200-freya', '/catalogue/freya', 'zoom200', ENCUADRAR_FOTO, { completa: false }],
  // Prendas en negro: catálogo (5 tarjetas con negro elegido), fichas y estudio
  ['catalogo-negro-tarjetas', '/catalogue', 'escritorio', colorEnTarjetas('Negro', 5), { completa: false }],
  ['ficha-atomic-negro', '/catalogue/atomic-150', 'escritorio', elegirColor('Negro'), { completa: false }],
  ['ficha-austral-negro', '/catalogue/austral', 'escritorio', null, { completa: false }],
  ['ficha-valier-negro', '/catalogue/valier', 'escritorio', null, { completa: false }],
  ['ficha-urban-negro', '/catalogue/urban', 'escritorio', elegirColor('Negro'), { completa: false }],
  ['ficha-montblanc-negro', '/catalogue/montblanc', 'escritorio', elegirColor('Negro'), { completa: false }],
  ['ficha-clasica-negro-detras', '/catalogue/clasica', 'escritorio', colorYDetras('Negro'), { completa: false }],
  ['estudio-atomic-negro', '/personnaliser/atomic-150?color=Negro', 'escritorio', null, { completa: false }],
  ['estudio-austral-negro', '/personnaliser/austral?color=Negro', 'escritorio', null, { completa: false }],
  // Shura: fucsia (por defecto) y negro, con el diseño pequeño y centrado
  ['ficha-shura-fucsia', '/catalogue/shura', 'escritorio', null, { completa: false }],
  ['ficha-shura-negro', '/catalogue/shura', 'escritorio', elegirColor('Negro'), { completa: false }],
  // Valier: cambio de color desde la tarjeta del catálogo
  ['tarjeta-valier-amarillo', '/catalogue', 'escritorio', elegirColorEnTarjeta('Valier', 'Amarillo flúor'), { completa: false }],
  ['tarjeta-valier-royal', '/catalogue', 'escritorio', elegirColorEnTarjeta('Valier', 'Royal'), { completa: false }],
  // Distintivo ECO y destacados
  ['catalogo-eco', '/catalogue?etiquetas=eco', 'escritorio'],
  ['inicio-destacados', '/', 'escritorio'],
  ['ficha-imola-eco', '/catalogue/imola', 'escritorio', null, { completa: false }],
  // 390 px
  ['inicio-390', '/', 'movil'],
  ['catalogo-390', '/catalogue', 'movil'],
  ['ficha-valier-390', '/catalogue/valier', 'movil', null, { completa: false }],
  ['ficha-shura-390', '/catalogue/shura', 'movil', null, { completa: false }],
  ['estudio-atomic-negro-390', '/personnaliser/atomic-150?color=Negro', 'movil', null, { completa: false }],
];
void CAPTURAS_4_4;

const candidatos = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const chrome = candidatos.find((p) => existsSync(p));
if (!chrome) {
  console.error('No encuentro Chrome. Indica la ruta en CHROME_PATH.');
  process.exit(1);
}

const puerto = 9300 + Math.floor(Math.random() * 500);
const perfil = path.join(os.tmpdir(), `marca-capturas-${process.pid}`);
const proc = spawn(
  chrome,
  [
    `--remote-debugging-port=${puerto}`,
    `--user-data-dir=${perfil}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--hide-scrollbars',
    '--window-size=1600,1000',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function esperarChrome() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${puerto}/json/version`);
      return await r.json();
    } catch {
      await espera(250);
    }
  }
  throw new Error('Chrome no responde al protocolo DevTools');
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pendientes = new Map();
    this.oyentes = [];
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id && this.pendientes.has(d.id)) {
        const { res, rej } = this.pendientes.get(d.id);
        this.pendientes.delete(d.id);
        if (d.error) rej(new Error(d.error.message));
        else res(d.result);
      } else if (d.method) {
        for (const f of [...this.oyentes]) f(d);
      }
    };
  }

  enviar(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pendientes.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  esperarEvento(method) {
    return new Promise((res) => {
      const f = (d) => {
        if (d.method === method) {
          this.oyentes.splice(this.oyentes.indexOf(f), 1);
          res(d.params);
        }
      };
      this.oyentes.push(f);
    });
  }
}

try {
  await mkdir(carpeta, { recursive: true });
  await esperarChrome();
  const tab = await (await fetch(`http://127.0.0.1:${puerto}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  const cdp = new Cdp(ws);
  await cdp.enviar('Page.enable');
  await cdp.enviar('Runtime.enable');

  // Chrome no compone fotogramas de más de unos 6000 px de dispositivo: las páginas largas se capturan por tramos
  // de esa altura (css px = 6000 / escala) y se unen en un solo PNG dentro del propio navegador (canvas).
  const MAX_DISPOSITIVO = 6000;
  const log = (nombre, paso) => process.env.DEPURAR && console.log(`[${nombre}] ${paso}`);

  for (const [nombre, ruta, vista, accion, opciones = {}] of CAPTURAS) {
    const v = VISTAS[vista];
    const maxTramo = Math.floor(MAX_DISPOSITIVO / v.deviceScaleFactor);
    await cdp.enviar('Emulation.setDeviceMetricsOverride', { ...v, screenWidth: v.width, screenHeight: v.height });
    await cdp.enviar('Emulation.setTouchEmulationEnabled', { enabled: v.mobile });
    const cargada = cdp.esperarEvento('Page.loadEventFired');
    await cdp.enviar('Page.navigate', { url: base + ruta });
    await cargada;
    log(nombre, 'cargada');
    // fase 4.2: el diseño de ejemplo se dibuja en tiempo libre tras cargar la foto; se le deja margen
    await cdp.enviar('Runtime.evaluate', {
      expression: 'document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 1800)))',
      awaitPromise: true,
    });
    if (ruta.startsWith('/personnaliser/')) {
      // el estudio dibuja la foto en un lienzo: se espera a que la cargue
      await cdp.enviar('Runtime.evaluate', { expression: 'new Promise((r) => setTimeout(r, 2500))', awaitPromise: true });
    }
    if (accion) {
      await cdp.enviar('Runtime.evaluate', { expression: accion, awaitPromise: true });
      await espera(500);
      log(nombre, 'acción hecha');
    }

    let alto = v.height;
    let data;
    if (opciones.completa === false) {
      ({ data } = await cdp.enviar('Page.captureScreenshot', { format: 'png' }));
    } else {
      // Las imágenes perezosas se cargan al recorrer la página antes de medirla.
      await cdp.enviar('Runtime.evaluate', {
        expression: `(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 500)); })()`,
        awaitPromise: true,
      });
      const { result } = await cdp.enviar('Runtime.evaluate', {
        expression: 'Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)',
        returnByValue: true,
      });
      alto = Math.max(v.height, Math.min(result.value, 14000));
      const tramos = [];
      for (let y = 0; y < alto; y += maxTramo) {
        const altoTramo = Math.min(maxTramo, alto - y);
        await cdp.enviar('Emulation.setDeviceMetricsOverride', { ...v, height: altoTramo, screenWidth: v.width, screenHeight: altoTramo });
        // A partir del segundo tramo se ocultan los elementos fijos (cabecera, botones flotantes) para no repetirlos.
        await cdp.enviar('Runtime.evaluate', {
          expression: `(async () => { document.getElementById('captura-ocultar')?.remove(); if (${y} > 0) { const st = document.createElement('style'); st.id = 'captura-ocultar'; st.textContent = 'header, .fixed { visibility: hidden !important }'; document.head.appendChild(st); } document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, ${y}); await new Promise((r) => setTimeout(r, 900)); return window.scrollY; })()`,
          awaitPromise: true,
        });
        const tramo = await cdp.enviar('Page.captureScreenshot', { format: 'png' });
        tramos.push(tramo.data);
        log(nombre, `tramo ${y}-${y + altoTramo}`);
      }
      await cdp.enviar('Runtime.evaluate', { expression: "document.getElementById('captura-ocultar')?.remove(); document.documentElement.style.scrollBehavior = ''" });
      data = tramos.length === 1 ? tramos[0] : unirPng(tramos.map((t) => Buffer.from(t, 'base64'))).toString('base64');
    }
    const destino = path.join(carpeta, `${nombre}.png`);
    await writeFile(destino, Buffer.from(data, 'base64'));
    console.log(`${destino} · ${v.width}×${alto} css px @${v.deviceScaleFactor}x`);
  }
  ws.close();
} finally {
  proc.kill();
}

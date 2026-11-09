// Prueba de punta a punta del formulario «Cuéntanos tu proyecto» (fase 6) con el transporte de pruebas "archivo":
//   A) negocio con un diseño hecho en el estudio (logo + capturas) y un archivo suelto, en escritorio;
//   B) particular con un producto del catálogo, a 390 px;
//   C) el estado de error (envío demasiado rápido) a 390 px.
// Después abre los emails guardados en .correo-local/ y los captura en escritorio (claro) y en móvil (modo oscuro).
// Requiere el servidor arrancado con CORREO_TRANSPORTE=archivo (ver .env.example).
// Uso: node scripts/probar-solicitud.mjs http://localhost:3000 docs/capturas/fase-6

import { mkdir, readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:3000';
const salida = process.argv[3] ?? 'docs/capturas/fase-6';
// --gmail=<email>: prueba real con el servidor en CORREO_TRANSPORTE=gmail; los emails de cliente van a ese buzón y no
// se leen carpetas locales (se comprueba el buzón aparte).
const gmail = process.argv.find((a) => a.startsWith('--gmail='))?.slice(8) ?? null;
const emailCliente = (porDefecto) => gmail ?? porDefecto;
const CORREOS = path.join(process.cwd(), '.correo-local');
const MOVIL = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const ESCRITORIO = { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 };

await mkdir(salida, { recursive: true });
await rm(CORREOS, { recursive: true, force: true });
const navegador = await chromium.launch();
let fallos = 0;
const ok = (cond, texto) => {
  console.log(`${cond ? 'OK ' : 'MAL'} ${texto}`);
  if (!cond) fallos++;
};

async function pagina(opciones) {
  const ctx = await navegador.newContext(opciones);
  return { ctx, p: await ctx.newPage() };
}

/** Pulsa la etiqueta de una opción (los radios y casillas de opción van ocultos dentro de su etiqueta). */
async function opcion(p, texto) {
  await p.getByText(texto, { exact: true }).first().click();
}

async function esperarTiempoMinimo(p, desde) {
  const falta = 5600 - (Date.now() - desde);
  if (falta > 0) await p.waitForTimeout(falta);
}

async function cestaVacia(p) {
  return p.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('marca:presupuesto') ?? '[]').length === 0;
    } catch {
      return false;
    }
  });
}

// ---------- A) Negocio con diseño del estudio ----------
{
  const { ctx, p } = await pagina(ESCRITORIO);
  await p.goto(`${base}/disena/atomic-150`, { waitUntil: 'load' });
  await p.locator('input[type=file]').first().setInputFiles('public/marca/estrella-marca.png'); // fase 10: hay dos entradas (delantero y trasero)
  await p.waitForTimeout(1500);
  await p.getByRole('button', { name: 'Enviar', exact: true }).click();
  const enviarDiseno = p.getByRole('button', { name: 'Enviar mi diseño' });
  await enviarDiseno.waitFor({ state: 'visible', timeout: 15000 });
  await p.waitForFunction(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === 'Enviar mi diseño');
    return b && !b.disabled;
  }, null, { timeout: 30000 });
  await enviarDiseno.click();
  await p.waitForURL('**/proyecto', { timeout: 30000 });
  const cargada = Date.now();
  await p.getByText('Diseño del estudio', { exact: false }).first().waitFor({ timeout: 15000 });
  await p.getByText('Logo original guardado en tu navegador', { exact: false }).first().waitFor({ timeout: 15000 });
  ok(true, 'A · el diseño del estudio ha llegado a la cesta con su logo guardado');

  await p.fill('input[name=nombre]', 'Marta Pérez');
  await p.fill('input[name=negocio]', 'Academia Órbita');
  await p.fill('input[name=sector]', 'Academia de idiomas');
  await p.fill('input[name=ciudad]', 'València');
  await p.fill('input[name=email]', emailCliente('marta.prueba@example.com'));
  await p.fill('input[name=telefono]', '612 345 678');
  await p.fill('input[name=otro_producto]', 'Toallas de microfibra con el logo');
  await opcion(p, 'Venta en el local');
  await opcion(p, 'Packs para clientes');
  await p.fill('input[name=fecha_limite]', '2026-11-20');
  await p.setInputFiles('input[name=archivos]', 'public/marca/tu-logo-aqui.png');
  await p.fill('textarea[name=mensaje]', 'Queremos 40 camisetas con el logo para vender en la academia y otras 20 para el equipo.\nSi puede ser, en naranja y en negro.');
  await opcion(p, 'Que vengáis a mi local (ciudad de Valencia)');
  await p.fill('input[name=franja]', 'Martes o jueves por la mañana');
  await p.check('input[name=privacidad]');
  await p.check('input[name=logo_permiso]');
  await p.screenshot({ path: path.join(salida, 'proyecto-negocio-escritorio.png'), fullPage: true });
  await esperarTiempoMinimo(p, cargada);
  await p.getByRole('button', { name: 'Enviar mi proyecto' }).click();
  await p.waitForURL('**/gracias', { timeout: 90000 });
  await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(salida, 'gracias-escritorio.png'), fullPage: true });
  ok(await cestaVacia(p), 'A · la cesta se ha vaciado tras el envío');
  await ctx.close();
}

// ---------- B) Particular con un producto del catálogo, a 390 px ----------
{
  const { ctx, p } = await pagina(MOVIL);
  await p.goto(`${base}/catalogo/bahrain`, { waitUntil: 'load' });
  // La posición es obligatoria: la lista de posiciones es la <ul> con ayuda; el primer botón es «Corazón» o similar.
  await p.locator('ul[aria-describedby$="-ayuda"] button[aria-pressed]').first().click();
  await p.getByRole('button', { name: 'Añadir al presupuesto' }).first().click();
  await p.waitForFunction(() => JSON.parse(localStorage.getItem('marca:presupuesto') ?? '[]').length === 1, null, { timeout: 10000 });
  ok(true, 'B · el producto de la ficha ha entrado en la cesta con su posición');
  await p.goto(`${base}/proyecto`, { waitUntil: 'load' });
  const cargada = Date.now();
  await opcion(p, 'Particular');
  await p.fill('input[name=nombre]', 'Lucía Prueba');
  await p.fill('input[name=ciudad]', 'Burjassot');
  await p.fill('input[name=email]', emailCliente('lucia.prueba@example.com'));
  await p.fill('input[name=telefono]', '600 111 222');
  await opcion(p, 'Email');
  await p.fill('input[name=ocasion]', 'Despedida de soltera');
  // Fase 10: los comentarios son opcionales; el caso B va sin ellos para comprobar «(sin comentarios)» en el email interno.
  await p.check('input[name=privacidad]');
  await p.screenshot({ path: path.join(salida, 'proyecto-particular-390.png'), fullPage: true });
  await esperarTiempoMinimo(p, cargada);
  await p.getByRole('button', { name: 'Enviar mi proyecto' }).click();
  await p.waitForURL('**/gracias', { timeout: 90000 });
  await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(salida, 'gracias-390.png'), fullPage: true });
  ok(await cestaVacia(p), 'B · la cesta se ha vaciado tras el envío');
  await ctx.close();
}

// ---------- C) Error: envío demasiado rápido (el formulario conserva lo escrito) ----------
{
  const { ctx, p } = await pagina(MOVIL);
  await p.goto(`${base}/proyecto`, { waitUntil: 'load' });
  await p.fill('input[name=nombre]', 'Prueba Rápida');
  await p.fill('input[name=negocio]', 'Bar Cometa');
  await p.fill('input[name=email]', 'rapida@example.com');
  await p.fill('textarea[name=mensaje]', 'Mensaje de prueba del estado de error.');
  await p.check('input[name=privacidad]');
  await p.getByRole('button', { name: 'Enviar mi proyecto' }).click();
  // Next añade su propio role="alert" (el anunciador de rutas): se busca el aviso del formulario por su texto.
  const alerta = p.getByRole('alert').filter({ hasText: 'No se ha enviado' });
  await alerta.waitFor({ timeout: 30000 });
  const texto = await alerta.innerText();
  ok(/demasiado deprisa/.test(texto), `C · aviso de error visible: «${texto.replace(/\s*\n+\s*/g, ' · ').slice(0, 140)}»`);
  ok((await p.inputValue('input[name=negocio]')) === 'Bar Cometa', 'C · lo rellenado sigue en el formulario');
  await p.screenshot({ path: path.join(salida, 'proyecto-error-390.png'), fullPage: false });
  await ctx.close();
}

// ---------- Emails guardados ----------
if (gmail) {
  await navegador.close();
  console.log(`\nModo Gmail: los emails de cliente han ido a ${gmail}; comprueba los buzones (scripts/leer-buzon-gmail.py para el del equipo).`);
  console.log(fallos ? `\nFALLOS: ${fallos}` : '\nTODO OK');
  process.exit(fallos ? 1 : 0);
}
const carpetas = (await readdir(CORREOS)).sort();
ok(carpetas.length === 4, `${carpetas.length} emails guardados en .correo-local (se esperaban 4)`);
const etiquetas = ['negocio', 'negocio', 'particular', 'particular'];
for (const [i, carpeta] of carpetas.entries()) {
  const ruta = path.join(CORREOS, carpeta);
  const cab = JSON.parse(await readFile(path.join(ruta, 'cabeceras.json'), 'utf8'));
  const tipo = /nueva-solicitud/.test(carpeta) ? 'equipo' : 'cliente';
  const nombre = `email-${tipo}-${etiquetas[i] ?? i}`;
  console.log(`\n${nombre}: «${cab.asunto}» → ${cab.para.email}${cab.responderA ? ` · responder a ${cab.responderA.email}` : ''}`);
  for (const a of cab.adjuntos) console.log(`   adjunto ${a.nombre} · ${a.tipo} · ${(a.tamano / 1024).toFixed(0)} KB${a.cid ? ' · incrustado' : ''}`);
  const html = `file:///${path.join(ruta, 'correo.html').replace(/\\/g, '/')}`;
  for (const [sufijo, opciones] of [
    ['escritorio', { viewport: { width: 820, height: 900 }, deviceScaleFactor: 1, colorScheme: 'light' }],
    ['movil-oscuro', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, colorScheme: 'dark' }],
  ]) {
    const { ctx, p } = await pagina(opciones);
    await p.goto(html, { waitUntil: 'load' });
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(salida, `${nombre}-${sufijo}.png`), fullPage: true });
    await ctx.close();
  }
  const texto = await readFile(path.join(ruta, 'correo.txt'), 'utf8');
  ok(!/€/.test(texto) || tipo === 'equipo', `${nombre}: sin precios en el texto`);
  if (etiquetas[i] === 'particular') {
    ok(tipo === 'equipo' ? /\(sin comentarios\)/.test(texto) : !/TUS COMENTARIOS/.test(texto), `${nombre}: ${tipo === 'equipo' ? '«(sin comentarios)» cuando el cliente no escribe nada' : 'sin bloque de comentarios vacío'}`);
  }
  if (tipo === 'equipo' && etiquetas[i] === 'negocio') {
    const nombres = cab.adjuntos.map((a) => a.nombre).join(' ');
    ok(/logo-delantero\./.test(nombres) && /diseno-1-delante/.test(nombres) && /diseno-1-detras/.test(nombres) && /tu-logo-aqui/.test(nombres), 'email al equipo (negocio): logo, capturas delante y detrás y archivo suelto adjuntos');
  }
}

await navegador.close();
console.log(fallos ? `\nFALLOS: ${fallos}` : '\nTODO OK');
process.exit(fallos ? 1 : 0);

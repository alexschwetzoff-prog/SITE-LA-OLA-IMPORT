// Capturas del estudio 2D con Chrome por el protocolo DevTools, sin dependencias: cada posición con un logo de
// prueba (escritorio), cuatro colores de cada prenda (390 px y escritorio), el cambio de prenda con el logo
// conservado y las capturas de 1200 × 1500 que genera el propio estudio.
//
// Uso: node scripts/capturas-estudio.mjs [urlBase] [carpetaSalida]
//   urlBase: http://localhost:3000 por defecto (hace falta `npm run build && npm run start`).
//   carpeta: docs/capturas/fase-2 por defecto.
// Variables: CHROME_PATH para otro navegador basado en Chromium; LOGO para otro logo de prueba.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:3000';
const carpeta = process.argv[3] ?? 'docs/capturas/fase-2';
const logoPrueba = path.resolve(process.env.LOGO ?? 'public/marca/logo-marca.png');

const VISTAS = {
  390: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
  escritorio: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
};
const PRODUCTOS = [
  { slug: 'atomic-150', posiciones: ['Corazón', 'Frontal A4', 'Espalda A4', 'Espalda A3'], colores: ['Blanco', 'Negro', 'Royal', 'Amarillo'] },
  { slug: 'austral', posiciones: ['Corazón', 'Espalda A4', 'Espalda A3'], colores: ['Blanco', 'Negro', 'Rojo', 'Royal'] },
];

const candidatos = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
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
const perfil = path.join(os.tmpdir(), `marca-capturas-estudio-${process.pid}`);
const proc = spawn(
  chrome,
  [`--remote-debugging-port=${puerto}`, `--user-data-dir=${perfil}`, '--headless=new', '--no-first-run', '--hide-scrollbars', '--window-size=1600,1000', 'about:blank'],
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
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id && this.pendientes.has(d.id)) {
        const { res, rej } = this.pendientes.get(d.id);
        this.pendientes.delete(d.id);
        if (d.error) rej(new Error(d.error.message));
        else res(d.result);
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
  async evaluar(expression) {
    const { result, exceptionDetails } = await this.enviar('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? 'Error en la página');
    return result.value;
  }
}

async function nuevaPestana(vista) {
  const tab = await (await fetch(`http://127.0.0.1:${puerto}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  const cdp = new Cdp(ws);
  await cdp.enviar('Page.enable');
  await cdp.enviar('Runtime.enable');
  await cdp.enviar('DOM.enable');
  await cdp.enviar('Emulation.setDeviceMetricsOverride', { ...vista, screenWidth: vista.width, screenHeight: vista.height });
  await cdp.enviar('Emulation.setTouchEmulationEnabled', { enabled: vista.mobile });
  return { cdp, ws, id: tab.id };
}

async function cerrarPestana(p) {
  p.ws.close();
  await fetch(`http://127.0.0.1:${puerto}/json/close/${p.id}`).catch(() => {});
}

/** Espera a que la foto actual esté dibujada (fotoLista vuelve a false al cambiar de color o de prenda). */
async function esperarListo(cdp, reintentar = true) {
  for (let i = 0; i < 300; i++) {
    if (await cdp.evaluar('Boolean(window.__marcaEstudio && window.__marcaEstudio.listo())')) return;
    await espera(100);
  }
  if (reintentar) {
    // Chrome headless a veces se queda con la pestaña nueva a medio cargar: se recarga una vez antes de rendirse.
    console.warn('aviso: la foto no se ha dibujado en 30 s; se recarga la página');
    await cdp.enviar('Page.reload', { ignoreCache: false });
    await espera(500);
    return esperarListo(cdp, false);
  }
  throw new Error('El estudio no ha dibujado la foto en 30 s');
}

async function subirLogo(cdp) {
  const { root } = await cdp.enviar('DOM.getDocument', { depth: -1 });
  const { nodeId } = await cdp.enviar('DOM.querySelector', { nodeId: root.nodeId, selector: 'input[type=file]' });
  await cdp.enviar('DOM.setFileInputFiles', { nodeId, files: [logoPrueba] });
  await cdp.evaluar("document.querySelector('input[type=file]').dispatchEvent(new Event('change', { bubbles: true })); 'ok'");
  await espera(600);
}

async function clicBoton(cdp, texto) {
  const ok = await cdp.evaluar(
    `(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith(${JSON.stringify(texto)})); if (!b) return false; b.click(); return true; })()`,
  );
  if (!ok) throw new Error(`No encuentro el botón «${texto}»`);
  await espera(400);
}

/** Elige una posición sin desmarcarla si ya está puesta (pulsar la activa la quita). */
async function elegirPosicion(cdp, texto) {
  const estado = await cdp.evaluar(
    `(() => { const b = [...document.querySelectorAll('li button[aria-pressed]')].find((x) => x.textContent.trim().startsWith(${JSON.stringify(texto)})); return b ? b.getAttribute('aria-pressed') : null; })()`,
  );
  if (estado === null) throw new Error(`No encuentro la posición «${texto}»`);
  if (estado === 'true') return;
  await clicBoton(cdp, texto);
}

async function elegirColor(cdp, nombre) {
  const ok = await cdp.evaluar(`window.__marcaEstudio.color(${JSON.stringify(nombre)})`);
  if (!ok) throw new Error(`No existe el color «${nombre}»`);
  await esperarListo(cdp);
  await espera(400);
}

async function captura(cdp, destino) {
  const { data } = await cdp.enviar('Page.captureScreenshot', { format: 'png' });
  await writeFile(destino, Buffer.from(data, 'base64'));
  console.log('captura:', destino);
}

function slugTexto(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

try {
  await mkdir(carpeta, { recursive: true });
  await esperarChrome();
  const tiempos = {};
  for (const producto of PRODUCTOS) {
    // Escritorio: posiciones, colores, capturas 1200 × 1500 y cambio de prenda
    {
      const p = await nuevaPestana(VISTAS.escritorio);
      const { cdp } = p;
      await cdp.enviar('Page.navigate', { url: `${base}/disena/${producto.slug}?capturas=1` });
      await esperarListo(cdp);
      tiempos[`${producto.slug}-escritorio`] = await cdp.evaluar(
        "(() => { const m = performance.getEntriesByName('estudio:primer-render')[0]; return m ? Math.round(m.startTime) : null; })()",
      );
      await subirLogo(cdp);
      await clicBoton(cdp, 'Posición');
      for (const posicion of producto.posiciones) {
        await elegirPosicion(cdp, posicion);
        await espera(500);
        await captura(cdp, path.join(carpeta, `estudio-${producto.slug}-${slugTexto(posicion)}-escritorio.png`));
      }
      await elegirPosicion(cdp, 'Corazón');
      await clicBoton(cdp, 'Delante');
      await clicBoton(cdp, 'Color');
      for (const color of producto.colores) {
        await elegirColor(cdp, color);
        await captura(cdp, path.join(carpeta, `estudio-${producto.slug}-color-${slugTexto(color)}-escritorio.png`));
      }
      const capturas = await cdp.evaluar('window.__marcaEstudio.capturar()');
      for (const c of capturas) {
        const destino = path.join(carpeta, `captura-${producto.slug}-${c.lado}.png`);
        await writeFile(destino, Buffer.from(c.url.split(',')[1], 'base64'));
        console.log('captura:', destino);
      }
      // «Descargar mi diseño»: se intercepta el enlace de descarga y se guarda el PNG compuesto
      await clicBoton(cdp, 'Enviar');
      await cdp.evaluar(
        "(() => { window.__descarga = null; const orig = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__descarga = { href: this.href, nombre: this.download }; return; } return orig.call(this); }; return 'ok'; })()",
      );
      await clicBoton(cdp, 'Descargar mi diseño');
      let descarga = null;
      for (let i = 0; i < 100 && !descarga; i++) {
        descarga = await cdp.evaluar(
          "(async () => { if (!window.__descarga) return null; const b = await (await fetch(window.__descarga.href)).blob(); const url = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); return { nombre: window.__descarga.nombre, url }; })()",
        );
        if (!descarga) await espera(100);
      }
      if (!descarga) throw new Error('La descarga no se ha generado');
      const destinoDescarga = path.join(carpeta, `descarga-${producto.slug}.png`);
      await writeFile(destinoDescarga, Buffer.from(descarga.url.split(',')[1], 'base64'));
      console.log('captura:', destinoDescarga, `(nombre de descarga: ${descarga.nombre})`);
      // cambio de prenda con el logo puesto: se conserva el diseño (desde la camiseta se cambia con el frontal A4
      // puesto, para ver el aviso de que el polo no lo admite)
      const otro = PRODUCTOS.find((x) => x.slug !== producto.slug);
      if (otro) {
        if (producto.posiciones.includes('Frontal A4')) {
          await clicBoton(cdp, 'Posición');
          await elegirPosicion(cdp, 'Frontal A4');
          await espera(300);
        }
        await cdp.evaluar(`window.__marcaEstudio.producto(${JSON.stringify(otro.slug)})`);
        await esperarListo(cdp);
        await espera(600);
        await captura(cdp, path.join(carpeta, `estudio-cambio-${producto.slug}-a-${otro.slug}-escritorio.png`));
      }
      // «Enviar mi diseño»: guarda el diseño con sus capturas y abre /proyecto
      if (producto === PRODUCTOS[0]) {
        await clicBoton(cdp, 'Enviar');
        await clicBoton(cdp, 'Enviar mi diseño');
        let ruta = '';
        for (let i = 0; i < 100; i++) {
          ruta = await cdp.evaluar('location.pathname');
          if (ruta === '/proyecto') break;
          await espera(100);
        }
        const guardado = await cdp.evaluar(
          "(() => { const d = sessionStorage.getItem('marca:diseno'); if (!d) return null; const j = JSON.parse(d); return { producto: j.producto.slug, color: j.color.nombre, colocaciones: j.colocaciones.map((c) => c.posicion), capturas: j.capturas.map((c) => c.lado) }; })()",
        );
        console.log('envío:', ruta, JSON.stringify(guardado));
      }
      await cerrarPestana(p);
    }
    // Móvil: los mismos colores con el logo en el corazón
    {
      const p = await nuevaPestana(VISTAS[390]);
      const { cdp } = p;
      await cdp.enviar('Page.navigate', { url: `${base}/disena/${producto.slug}?capturas=1` });
      await esperarListo(cdp);
      tiempos[`${producto.slug}-390`] = await cdp.evaluar(
        "(() => { const m = performance.getEntriesByName('estudio:primer-render')[0]; return m ? Math.round(m.startTime) : null; })()",
      );
      await subirLogo(cdp);
      for (const color of producto.colores) {
        await elegirColor(cdp, color);
        await captura(cdp, path.join(carpeta, `estudio-${producto.slug}-color-${slugTexto(color)}-390.png`));
      }
      await cerrarPestana(p);
    }
  }
  console.log('Tiempo hasta la foto dibujada (ms, sin limitar la red):', JSON.stringify(tiempos));
} finally {
  proc.kill();
}

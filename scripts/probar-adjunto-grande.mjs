// Prueba (fase 9): envío del formulario con un archivo suelto de casi 4 MB a través del servidor local de Netlify
// (netlify serve), que pasa la acción de servidor por la emulación de la función. Comprueba que llega a /gracias.
// Uso: node scripts/probar-adjunto-grande.mjs http://localhost:8888 (con el servidor arrancado con CORREO_TRANSPORTE=archivo)
import { chromium } from 'playwright';
import { mkdir, readdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

const base = process.argv[2] ?? 'http://localhost:8888';
const repo = process.cwd();
const tamano = 3.9 * 1024 * 1024;

// PNG válido de 1 × 1 con un chunk privado enorme (bytes aleatorios: no se comprimen) para pesar 3,9 MB.
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const td = Buffer.concat([Buffer.from(tipo, 'latin1'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([largo, td, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(1, 0);
ihdr.writeUInt32BE(1, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const idat = zlib.deflateSync(Buffer.from([0, 255, 255, 255]));
const relleno = Buffer.alloc(Math.floor(tamano / 4) * 4);
for (let i = 0; i < relleno.length; i += 4) relleno.writeUInt32LE((Math.random() * 0xffffffff) >>> 0, i);
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('prVt', relleno), chunk('IEND', Buffer.alloc(0))]);
const archivo = path.join(os.tmpdir(), 'marca-logo-grande-prueba.png');
await writeFile(archivo, png);
console.log(`archivo de prueba: ${(png.length / 1024 / 1024).toFixed(2)} MB`);

const correos = path.join(repo, '.correo-local');
await rm(correos, { recursive: true, force: true });
await mkdir(correos, { recursive: true });

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(base + '/projet', { waitUntil: 'load' });
await p.fill('input[name="nombre"]', 'Prueba Adjunto Grande');
await p.fill('input[name="negocio"]', 'Prueba Netlify');
await p.fill('input[name="email"]', 'prueba.adjunto@example.com');
await p.fill('textarea[name="mensaje"]', 'Prueba de la fase 9: un archivo suelto de casi 4 MB a través de la función de Netlify.');
await p.setInputFiles('input[name="archivos"]', archivo);
await p.check('input[name="privacidad"]');
await p.waitForTimeout(5500);
const t0 = Date.now();
await p.click('button[type="submit"]');
try {
  await p.waitForURL('**/gracias', { timeout: 60000 });
  console.log(`OK  /gracias tras ${Date.now() - t0} ms`);
} catch {
  const aviso = await p.locator('[role="alert"]').textContent().catch(() => null);
  console.log('MAL no ha llegado a /gracias. Aviso:', aviso);
  await p.screenshot({ path: path.join(os.tmpdir(), 'marca-adjunto-grande-error.png'), fullPage: true });
}
await b.close();
const carpetas = await readdir(correos).catch(() => []);
console.log('emails guardados:', carpetas.length, carpetas.join(' | '));
for (const c of carpetas) {
  const adj = await readdir(path.join(correos, c, 'adjuntos')).catch(() => []);
  console.log(`  ${c}: ${adj.join(', ')}`);
}

// OCR de todas las imágenes publicadas (fase 10): busca texto del proveedor (su nombre y los de su grupo) en cada
// archivo de public/ con tesseract.js (WASM, sin instalar nada en el sistema), y escribe un CSV con las palabras que
// reconoce en cada imagen y una columna de alerta cuando alguna se parece a los nombres prohibidos (con variantes de
// mayúsculas, espacios y errores típicos del OCR: 0 por O, 1 por l…). El CSV sirve de caché: una imagen que no ha
// cambiado (mismo tamaño y fecha) no se vuelve a leer.
//
// Uso:  npm i --no-save tesseract.js        (no es dependencia del proyecto: solo para esta revisión)
//       node scripts/fotos/ocr-fotos.mjs [--salida docs/revision-colores/ocr.csv] [--modo disperso|bloque] [--solo <subcadena>] [carpeta o archivo ...]
// Sin carpetas: public/ entero (saltando las versiones -800.webp, que son la misma foto reducida). Con --modo bloque
// se leen los recortes ampliados de scripts/fotos/revisar-marcas.py (docs/revision-colores/marcas/recortes), donde
// una etiqueta de 50 px se lee de verdad: en la foto entera tesseract no la ve (comprobado: «[PROVEEDOR]» solo sale a 2-4×).
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createWorker, PSM } from 'tesseract.js';

const args = process.argv.slice(2);
const opcion = (nombre, porDefecto) => {
  const i = args.indexOf(nombre);
  if (i < 0) return porDefecto;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const salida = opcion('--salida', 'docs/revision-colores/ocr.csv');
const solo = opcion('--solo', null);
// 'disperso' (texto suelto por toda la imagen: fotos enteras) o 'bloque' (un bloque de texto: recortes ampliados de
// una etiqueta, donde tesseract lee mucho mejor)
const modo = opcion('--modo', 'disperso');
const raices = args.length ? args : ['public'];

// Nombres que no pueden aparecer. Se comparan con las palabras del OCR normalizadas (minúsculas, sin espacios ni
// signos, con las confusiones habituales del OCR resueltas: 0→o, 1→l, |→l, 5→s, 8→b, 4→a).
const PROHIBIDOS = [
  // [PROVEEDOR] patrones (en minúsculas y con las confusiones del OCR) del nombre del fabricante, de su web y de las
  // marcas de su grupo. Rellenar con los del proveedor de La Ola Import.
  { nombre: 'proveedor', re: /proveedorpendiente/ },
];
const CONFIANZA_MINIMA = 35;

function normalizar(texto) {
  return texto
    .toLowerCase()
    .replace(/[^a-z0-9|]/g, '')
    .replace(/0/g, 'o')
    .replace(/[1|]/g, 'l')
    .replace(/5/g, 's')
    .replace(/8/g, 'b')
    .replace(/4/g, 'a');
}

function alertasDe(palabras) {
  const alertas = new Set();
  const todas = normalizar(palabras.map((p) => p.texto).join(''));
  for (const p of palabras) {
    const n = normalizar(p.texto);
    for (const { nombre, re } of PROHIBIDOS) if (re.test(n)) alertas.add(`${nombre} («${p.texto}» ${Math.round(p.confianza)})`);
  }
  // nombres partidos en dos palabras («RO LY»)
  for (const { nombre, re } of PROHIBIDOS) if (re.test(todas) && ![...alertas].some((a) => a.startsWith(nombre))) alertas.add(`${nombre} (unido)`);
  return [...alertas];
}

function* archivosDe(raiz) {
  const st = statSync(raiz);
  if (st.isFile()) {
    yield raiz;
    return;
  }
  for (const nombre of readdirSync(raiz)) {
    const ruta = path.join(raiz, nombre);
    if (statSync(ruta).isDirectory()) yield* archivosDe(ruta);
    else if (/\.(webp|jpe?g|png)$/i.test(nombre) && !/-800\.webp$/i.test(nombre)) yield ruta;
  }
}

function leerCsv(ruta) {
  const mapa = new Map();
  if (!existsSync(ruta)) return mapa;
  const lineas = readFileSync(ruta, 'utf8').split(/\r?\n/).slice(1);
  for (const linea of lineas) {
    if (!linea) continue;
    const campos = [];
    let actual = '';
    let entreComillas = false;
    for (let i = 0; i < linea.length; i++) {
      const c = linea[i];
      if (entreComillas) {
        if (c === '"' && linea[i + 1] === '"') {
          actual += '"';
          i++;
        } else if (c === '"') entreComillas = false;
        else actual += c;
      } else if (c === '"') entreComillas = true;
      else if (c === ',') {
        campos.push(actual);
        actual = '';
      } else actual += c;
    }
    campos.push(actual);
    const [archivo, tamano, fecha, ancho, alto, palabras, texto, alertas] = campos;
    mapa.set(archivo, { archivo, tamano, fecha, ancho, alto, palabras, texto, alertas });
  }
  return mapa;
}

const campo = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
function escribirCsv(ruta, filas) {
  mkdirSync(path.dirname(ruta), { recursive: true });
  const cabecera = 'archivo,tamano,fecha,ancho,alto,palabras,texto,alertas';
  writeFileSync(ruta, [cabecera, ...filas.map((f) => [f.archivo, f.tamano, f.fecha, f.ancho, f.alto, f.palabras, f.texto, f.alertas].map(campo).join(','))].join('\n') + '\n');
}

const previas = leerCsv(salida);
const archivos = [];
for (const raiz of raices) for (const ruta of archivosDe(raiz)) if (!solo || ruta.includes(solo)) archivos.push(ruta.replace(/\\/g, '/'));
archivos.sort();

const worker = await createWorker('eng', 1, { cachePath: path.join(process.env.TEMP ?? '.', 'tessdata-marca'), logger: () => {} });
await worker.setParameters({ tessedit_pageseg_mode: modo === 'bloque' ? PSM.SINGLE_BLOCK : PSM.SPARSE_TEXT });

const filas = [];
let leidas = 0;
let conAlerta = 0;
const inicio = Date.now();
for (const [i, ruta] of archivos.entries()) {
  const st = statSync(ruta);
  const clave = `${st.size}|${Math.round(st.mtimeMs)}`;
  const previa = previas.get(ruta);
  if (previa && previa.tamano === String(st.size) && previa.fecha === String(Math.round(st.mtimeMs))) {
    filas.push(previa);
    if (previa.alertas) conAlerta++;
    continue;
  }
  let fila = { archivo: ruta, tamano: String(st.size), fecha: String(Math.round(st.mtimeMs)), ancho: '', alto: '', palabras: '0', texto: '', alertas: '' };
  try {
    const { data } = await worker.recognize(ruta, {}, { text: true, blocks: true });
    const palabras = [];
    for (const b of data.blocks ?? []) for (const p of b.paragraphs) for (const l of p.lines) for (const w of l.words) if (w.confidence >= CONFIANZA_MINIMA && /[a-z0-9]/i.test(w.text)) palabras.push({ texto: w.text, confianza: w.confidence });
    const alertas = alertasDe(palabras);
    fila = { ...fila, palabras: String(palabras.length), texto: palabras.map((p) => `${p.text ?? p.texto}(${Math.round(p.confianza)})`).join(' ').slice(0, 400), alertas: alertas.join(' · ') };
    void clave;
  } catch (e) {
    fila.texto = `ERROR ${e.message}`;
  }
  if (fila.alertas) conAlerta++;
  filas.push(fila);
  leidas++;
  if (leidas % 25 === 0) {
    escribirCsv(salida, filas.concat([...previas.values()].filter((p) => !filas.some((f) => f.archivo === p.archivo) && archivos.includes(p.archivo))));
    const t = (Date.now() - inicio) / 1000;
    console.log(`${i + 1}/${archivos.length} · ${leidas} leídas en ${t.toFixed(0)} s (${(t / leidas).toFixed(1)} s/imagen) · ${conAlerta} con alerta`);
  }
}
await worker.terminate();
escribirCsv(salida, filas);
console.log(`${archivos.length} imágenes (${leidas} leídas ahora, el resto de la caché) · ${conAlerta} con alerta → ${salida}`);
for (const f of filas) if (f.alertas) console.log(`  ALERTA ${f.archivo}: ${f.alertas} · ${f.texto}`);

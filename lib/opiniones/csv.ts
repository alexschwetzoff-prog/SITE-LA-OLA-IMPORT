// Parser CSV propio (fase 10), para el CSV publicado de la hoja de respuestas del formulario de opiniones. Sin
// dependencias: campos entre comillas (con comillas dobladas, comas y saltos de línea dentro), separador coma,
// finales de línea \n, \r\n o \r, marca de orden de bytes (BOM) al principio y filas vacías, que se ignoran.
// Devuelve las filas tal cual (sin interpretar cabeceras): eso lo hace lib/opiniones/opiniones.ts.

export function parsearCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = '';
  let entreComillas = false;
  let i = texto.charCodeAt(0) === 0xfeff ? 1 : 0; // BOM
  const n = texto.length;
  const cerrarFila = () => {
    fila.push(campo);
    campo = '';
    // una fila vacía (o solo de campos vacíos) no cuenta
    if (fila.some((c) => c.trim() !== '')) filas.push(fila);
    fila = [];
  };
  while (i < n) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i += 2;
          continue;
        }
        entreComillas = false;
        i++;
        continue;
      }
      campo += c;
      i++;
      continue;
    }
    if (c === '"') {
      entreComillas = true;
      i++;
      continue;
    }
    if (c === ',') {
      fila.push(campo);
      campo = '';
      i++;
      continue;
    }
    if (c === '\r' || c === '\n') {
      cerrarFila();
      i += c === '\r' && texto[i + 1] === '\n' ? 2 : 1;
      continue;
    }
    campo += c;
    i++;
  }
  // la última fila, con o sin salto de línea final
  if (campo !== '' || fila.length) cerrarFila();
  return filas;
}
